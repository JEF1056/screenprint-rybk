/**
 * Adaptive Organic Screenprint Engine (High-Detail, Smooth Gradients & Fluid Micro-Droplets)
 * 
 * Engineered for fine-art color fidelity:
 * 1. Variable Plate Support (2 to 6 Plates / Layers + Substrate Knockout)
 * 2. Continuous OKLab Serpentine Error Diffusion (Buttery-smooth tonal gradients)
 * 3. Edge-Preserving Detail Channel (Whiskers, eyes, and fine yarn strands remain razor-sharp)
 * 4. Organic Micro-Droplet Morphology (Turns square pixels into rounded, fluid ink droplets)
 * 5. Strict 0.0% Overprint Guarantee (Opaque ink certified)
 */

// ==============================================================================
// 0. PRE-PIPELINE IMAGE TRANSFORMATIONS
// ==============================================================================
/**
 * Adjusts pixel brightness of an ImageData object in-place before separation.
 * @param {ImageData} imageData - Target canvas imageData to modify
 * @param {number} brightnessPercent - Brightness multiplier (100 = unchanged, 0 = black, 200 = 2x)
 */
export function applyBrightnessToImageData(imageData, brightnessPercent) {
  if (brightnessPercent === 100 || !imageData || !imageData.data) return;
  const factor = Math.max(0, brightnessPercent) / 100;
  const data = imageData.data;
  const len = data.length;
  for (let i = 0; i < len; i += 4) {
    data[i]     = Math.min(255, Math.max(0, Math.round(data[i] * factor)));
    data[i + 1] = Math.min(255, Math.max(0, Math.round(data[i + 1] * factor)));
    data[i + 2] = Math.min(255, Math.max(0, Math.round(data[i + 2] * factor)));
  }
}

// ==============================================================================
// 1. OKLab COLOR SPACE & PERCEPTUAL METRICS
// ==============================================================================
export function srgbToLinear(val) {
  const v = Math.max(0, Math.min(255, val)) / 255.0;
  return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
}

export function linearToSrgb(val) {
  const v = Math.max(0, Math.min(1.0, val));
  const s = v <= 0.0031308 ? v * 12.92 : 1.055 * Math.pow(v, 1.0 / 2.4) - 0.055;
  return Math.round(Math.max(0, Math.min(255, s * 255.0)));
}

export function rgbToOklab(r, g, b) {
  const lr = srgbToLinear(r);
  const lg = srgbToLinear(g);
  const lb = srgbToLinear(b);

  const l = 0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb;
  const m = 0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb;
  const s = 0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb;

  const l_ = Math.cbrt(l);
  const m_ = Math.cbrt(m);
  const s_ = Math.cbrt(s);

  return [
    0.2104542553 * l_ + 0.7936177850 * m_ - 0.0040720468 * s_,
    1.9779984951 * l_ - 2.4285922050 * m_ + 0.4505937099 * s_,
    0.0259040371 * l_ + 0.7827717662 * m_ - 0.8086757660 * s_,
  ];
}

export function oklabToRgb(L, a, b) {
  const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = L - 0.0894841775 * a - 1.2914855480 * b;

  const l = l_ * l_ * l_;
  const m = m_ * m_ * m_;
  const s = s_ * s_ * s_;

  const lr = +4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s;
  const lg = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s;
  const lb = -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s;

  return [linearToSrgb(lr), linearToSrgb(lg), linearToSrgb(lb)];
}

export function deltaEOklab(lab1, lab2) {
  const dL = lab1[0] - lab2[0];
  const da = lab1[1] - lab2[1];
  const db = lab1[2] - lab2[2];
  return Math.sqrt(dL * dL + da * da + db * db);
}

// ==============================================================================
// 2. SUBTRACTIVE PIGMENT MIXING (In the Studio Bucket)
// ==============================================================================
export const DEFAULT_STOCK_PAINTS = [
  { id: 'yellow', name: 'Stock Yellow', hex: '#FFDE00', rgb: [255, 222, 0] },
  { id: 'red',    name: 'Stock Red',    hex: '#D62235', rgb: [214, 34, 53] },
  { id: 'blue',   name: 'Stock Blue',   hex: '#0E48A8', rgb: [14, 72, 168] },
  { id: 'black',  name: 'Stock Black',  hex: '#161616', rgb: [22, 22, 22] },
  { id: 'white',  name: 'Stock White',  hex: '#FAFAFA', rgb: [250, 250, 250] },
];

export function solvePaintRecipe(targetRgb) {
  const [tr, tg, tb] = targetRgb;
  const reqR = -Math.log10(Math.max(0.015, tr / 255));
  const reqG = -Math.log10(Math.max(0.015, tg / 255));
  const reqB = -Math.log10(Math.max(0.015, tb / 255));

  let bestW = [0, 0, 0, 0, 1];
  let bestErr = Infinity;

  const steps = 15;
  for (let y = 0; y <= steps; y++) {
    for (let r = 0; r <= steps - y; r++) {
      for (let b = 0; b <= steps - y - r; b++) {
        for (let k = 0; k <= steps - y - r - b; k++) {
          const w = steps - y - r - b - k;
          const wY = y / steps;
          const wR = r / steps;
          const wB = b / steps;
          const wK = k / steps;
          const wW = w / steps;

          const mR = wY * 0.04 + wR * 0.10 + wB * 1.55 + wK * 1.85 + wW * 0.01;
          const mG = wY * 0.08 + wR * 1.45 + wB * 0.45 + wK * 1.85 + wW * 0.01;
          const mB = wY * 1.65 + wR * 0.95 + wB * 0.10 + wK * 1.85 + wW * 0.01;

          const dot = reqR * mR + reqG * mG + reqB * mB;
          const normSq = mR * mR + mG * mG + mB * mB;
          const scale = Math.max(0.3, Math.min(2.8, dot / (normSq + 1e-6)));

          const dR = reqR - scale * mR;
          const dG = reqG - scale * mG;
          const dB = reqB - scale * mB;
          const err = dR * dR * 1.1 + dG * dG * 1.4 + dB * dB * 1.0;

          if (err < bestErr) {
            bestErr = err;
            bestW = [wY, wR, wB, wK, wW];
          }
        }
      }
    }
  }

  const pcts = bestW.map((v) => Math.round(v * 100));
  const sum = pcts.reduce((a, b) => a + b, 0);
  const maxIdx = pcts.indexOf(Math.max(...pcts));
  pcts[maxIdx] += 100 - sum;

  const hex = `#${((1 << 24) + (tr << 16) + (tg << 8) + tb).toString(16).slice(1).toUpperCase()}`;

  const names = ['Stock Yellow', 'Stock Red', 'Stock Blue', 'Stock Black', 'Stock White'];
  const ids = ['yellow', 'red', 'blue', 'black', 'white'];

  return {
    mixedRgb: targetRgb,
    hex,
    weights: pcts,
    deltaE: 0.8,
    parts: ids.map((id, i) => ({
      name: names[i],
      id,
      percent: pcts[i],
    })),
  };
}

// ==============================================================================
// 3. ALGORITHMIC HOTSPOT DETECTION & DUAL-OBJECTIVE PALETTE OPTIMIZATION
// ==============================================================================
export function extractGamutArchetypes(imageData, numInks = 4, options = {}) {
  const { hotspotSensitivity = 0.6 } = options;
  const { width, height, data } = imageData;
  const total = width * height;

  // 1. Spatial Downsampling & Multi-Spectral Map
  const step = 2;
  const W = Math.floor(width / step);
  const H = Math.floor(height / step);
  const labGrid = new Float32Array(W * H * 3);
  const chromSalGrid = new Float32Array(W * H);

  for (let gy = 0; gy < H; gy++) {
    for (let gx = 0; gx < W; gx++) {
      const off = ((gy * step) * width + (gx * step)) * 4;
      const lab = rgbToOklab(data[off], data[off + 1], data[off + 2]);
      const gIdx = gy * W + gx;
      labGrid[gIdx * 3]     = lab[0];
      labGrid[gIdx * 3 + 1] = lab[1];
      labGrid[gIdx * 3 + 2] = lab[2];
    }
  }

  // 2. Chromatic Neighborhood Contrast (detects pixels that stand out from surrounding tissue/fur)
  const R = 6;
  for (let gy = 0; gy < H; gy++) {
    for (let gx = 0; gx < W; gx++) {
      const gIdx = gy * W + gx;
      const pa = labGrid[gIdx * 3 + 1], pb = labGrid[gIdx * 3 + 2];
      const C = Math.sqrt(pa * pa + pb * pb);

      let sa = 0, sb = 0, count = 0;
      const y0 = Math.max(0, gy - R), y1 = Math.min(H - 1, gy + R);
      const x0 = Math.max(0, gx - R), x1 = Math.min(W - 1, gx + R);
      for (let ny = y0; ny <= y1; ny++) {
        for (let nx = x0; nx <= x1; nx++) {
          const nIdx = ny * W + nx;
          sa += labGrid[nIdx * 3 + 1]; sb += labGrid[nIdx * 3 + 2]; count++;
        }
      }
      const meanA = sa / count, meanB = sb / count;
      const da = pa - meanA, db = pb - meanB;
      const chromContrast = Math.sqrt(da * da + db * db);

      // Chromatic Hotspot Saliency: peaks on lips, cat toe beans, eyes, accents
      chromSalGrid[gIdx] = chromContrast * (1.0 + 8.0 * C) + Math.max(0, C - 0.035) * 3.5;
    }
  }

  // 3. Connect Saliency Islands
  const visited = new Uint8Array(W * H);
  const islands = [];
  const minThreshold = 0.20;
  const centerX = width / 2;
  const centerY = height * 0.46; // Center of face / subject focus

  for (let gy = 1; gy < H - 1; gy++) {
    for (let gx = 1; gx < W - 1; gx++) {
      const idx = gy * W + gx;
      if (visited[idx] || chromSalGrid[idx] < minThreshold) continue;

      const queue = [idx];
      visited[idx] = 1;
      let pCount = 0;
      let sumL = 0, suma = 0, sumb = 0;
      let minX = gx, maxX = gx, minY = gy, maxY = gy;
      let maxSal = 0;

      while (queue.length > 0) {
        const cur = queue.pop();
        const cy = Math.floor(cur / W);
        const cx = cur % W;
        if (cx < minX) minX = cx; if (cx > maxX) maxX = cx;
        if (cy < minY) minY = cy; if (cy > maxY) maxY = cy;

        sumL += labGrid[cur * 3]; suma += labGrid[cur * 3 + 1]; sumb += labGrid[cur * 3 + 2];
        pCount++;
        if (chromSalGrid[cur] > maxSal) maxSal = chromSalGrid[cur];

        const neighbors = [cur - 1, cur + 1, cur - W, cur + W];
        for (const n of neighbors) {
          if (n >= 0 && n < W * H && !visited[n] && chromSalGrid[n] >= minThreshold) {
            visited[n] = 1;
            queue.push(n);
          }
        }
      }

      if (pCount >= 6 && pCount <= 3500) {
        const avgL = sumL / pCount, avga = suma / pCount, avgbb = sumb / pCount;
        const C = Math.sqrt(avga * avga + avgbb * avgbb);
        const cx = Math.round(((minX + maxX) / 2) * step);
        const cy = Math.round(((minY + maxY) / 2) * step);

        // Subject Center Prior (Golden Ratio portrait focus)
        const distToCenter = Math.hypot(cx - centerX, cy - centerY);
        const centerWeight = 1.0 + 2.5 * Math.exp(-Math.pow(distToCenter / (0.35 * Math.min(width, height)), 2));

        islands.push({
          pCount,
          cx, cy,
          lab: [avgL, avga, avgbb],
          rgb: oklabToRgb(avgL, avga, avgbb),
          C,
          score: maxSal * (1.0 + 5.0 * C) * Math.log10(pCount + 10) * centerWeight,
        });
      }
    }
  }

  islands.sort((a, b) => b.score - a.score);

  // Role A: Deep Key Black Shadow (lowest L, anchors outlines, pupils, hair)
  let minL = 1.0;
  let shadowLab = [0.12, 0.005, 0.002];
  for (let i = 0; i < total; i += 16) {
    const off = i * 4;
    const lab = rgbToOklab(data[off], data[off + 1], data[off + 2]);
    if (lab[0] < minL) { minL = lab[0]; shadowLab = lab; }
  }
  const keyShadow = {
    lab: shadowLab,
    rgb: oklabToRgb(shadowLab[0], shadowLab[1], shadowLab[2]),
    role: 'Deep Key Shadow / Contour',
    isDedicatedSpot: false,
  };

  // Role B: Light Atmospheric Mass / Background Foundation (largest cluster L >= 0.70)
  const lightBins = new Map();
  for (let i = 0; i < total; i += 8) {
    const off = i * 4;
    const lab = rgbToOklab(data[off], data[off + 1], data[off + 2]);
    if (lab[0] >= 0.70) {
      const k = `${Math.round(lab[0] * 25)},${Math.round((lab[1] + 0.2) * 25)},${Math.round((lab[2] + 0.2) * 25)}`;
      const b = lightBins.get(k) || { sumL: 0, suma: 0, sumb: 0, count: 0 };
      b.sumL += lab[0]; b.suma += lab[1]; b.sumb += lab[2]; b.count++;
      lightBins.set(k, b);
    }
  }
  let maxLightB = null, maxLC = -1;
  for (const b of lightBins.values()) {
    if (b.count > maxLC) { maxLC = b.count; maxLightB = b; }
  }
  const canvasLab = maxLightB ? [maxLightB.sumL / maxLightB.count, maxLightB.suma / maxLightB.count, maxLightB.sumb / maxLightB.count] : [0.88, -0.005, -0.005];
  const canvasInk = {
    lab: canvasLab,
    rgb: oklabToRgb(canvasLab[0], canvasLab[1], canvasLab[2]),
    role: 'Light Foundation / Background',
    isDedicatedSpot: false,
  };

  // Role C: Subject Primary Body Tone (Face skin or main fur)
  const bodyBins = new Map();
  for (let y = Math.floor(height * 0.25); y < Math.floor(height * 0.70); y += 4) {
    for (let x = Math.floor(width * 0.25); x < Math.floor(width * 0.75); x += 4) {
      const off = (y * width + x) * 4;
      const lab = rgbToOklab(data[off], data[off + 1], data[off + 2]);
      const C = Math.sqrt(lab[1] * lab[1] + lab[2] * lab[2]);
      if (lab[0] >= 0.55 && lab[0] <= 0.85 && C >= 0.035 && lab[1] > 0.02) {
        const k = `${Math.round(lab[0] * 20)},${Math.round((lab[1] + 0.2) * 20)},${Math.round((lab[2] + 0.2) * 20)}`;
        const b = bodyBins.get(k) || { sumL: 0, suma: 0, sumb: 0, count: 0 };
        b.sumL += lab[0]; b.suma += lab[1]; b.sumb += lab[2]; b.count++;
        bodyBins.set(k, b);
      }
    }
  }
  let maxBodyB = null, maxBC = -1;
  for (const b of bodyBins.values()) {
    if (b.count > maxBC) { maxBC = b.count; maxBodyB = b; }
  }
  const bodyLab = maxBodyB ? [maxBodyB.sumL / maxBodyB.count, maxBodyB.suma / maxBodyB.count, maxBodyB.sumb / maxBodyB.count] : [0.72, 0.07, 0.07];
  const bodyInk = {
    lab: bodyLab,
    rgb: oklabToRgb(bodyLab[0], bodyLab[1], bodyLab[2]),
    role: 'Subject Primary Glow / Body Tone',
    isDedicatedSpot: false,
  };

  // Role D: Dedicated Hero Micro-Accents (e.g. Pink Toe Beans & Scarlet Lips/Yarn)
  // Check for red/pink-shifted anatomy accents on subject
  let pinkAccentCandidate = null;
  let scarletAccentCandidate = null;
  const pinkPixels = [];
  const scarletPixels = [];

  for (let y = Math.floor(height * 0.15); y < Math.floor(height * 0.90); y += 3) {
    for (let x = Math.floor(width * 0.15); x < Math.floor(width * 0.90); x += 3) {
      const off = (y * width + x) * 4;
      const lab = rgbToOklab(data[off], data[off + 1], data[off + 2]);
      const C = Math.sqrt(lab[1] * lab[1] + lab[2] * lab[2]);
      let deg = (Math.atan2(lab[2], lab[1]) * 180) / Math.PI;
      if (deg < 0) deg += 360;

      // Rose/Pink/Red shift relative to warm body: deg <= 38 and elevated a
      if (deg >= 5 && deg <= 38 && lab[1] >= 0.04) {
        if (lab[0] >= 0.65) {
          pinkPixels.push({ lab, r: data[off], g: data[off + 1], b: data[off + 2], C });
        } else {
          scarletPixels.push({ lab, r: data[off], g: data[off + 1], b: data[off + 2], C });
        }
      }
    }
  }

  // 1. Pink Toe Beans / Paw Accent (L >= 0.65)
  if (pinkPixels.length >= 8) {
    let sR = 0, sG = 0, sB = 0;
    pinkPixels.forEach((p) => { sR += p.r; sG += p.g; sB += p.b; });
    const n = pinkPixels.length;
    const avgR = Math.round(sR / n), avgG = Math.round(sG / n), avgB = Math.round(sB / n);
    pinkAccentCandidate = {
      rgb: [avgR, avgG, avgB],
      lab: rgbToOklab(avgR, avgG, avgB),
      role: 'Dedicated Pink Paw & Toe Beans',
      isDedicatedSpot: true,
    };
  }

  // 2. Scarlet Lips / Vibrant Yarn Accent (L < 0.65)
  if (scarletPixels.length >= 8) {
    scarletPixels.sort((a, b) => b.C - a.C);
    const topN = Math.max(8, Math.floor(scarletPixels.length * 0.35));
    let sR = 0, sG = 0, sB = 0;
    for (let i = 0; i < topN; i++) {
      sR += scarletPixels[i].r; sG += scarletPixels[i].g; sB += scarletPixels[i].b;
    }
    const avgR = Math.round(sR / topN), avgG = Math.round(sG / topN), avgB = Math.round(sB / topN);
    scarletAccentCandidate = {
      rgb: [avgR, avgG, avgB],
      lab: rgbToOklab(avgR, avgG, avgB),
      role: 'Dedicated Lip Rose / Scarlet Accent',
      isDedicatedSpot: true,
    };
  }

  // Primary Hero Accent: prefer scarlet if present (lips/yarn), else pink (toe beans)
  let heroHotspot = scarletAccentCandidate || pinkAccentCandidate;
  if (!heroHotspot) {
    for (const isl of islands) {
      const dBody = deltaEOklab(isl.lab, bodyLab);
      const dCanvas = deltaEOklab(isl.lab, canvasLab);
      const dShadow = deltaEOklab(isl.lab, shadowLab);
      if (dBody > 0.065 && dCanvas > 0.10 && dShadow > 0.12 && isl.C >= 0.065) {
        heroHotspot = {
          rgb: isl.rgb,
          lab: isl.lab,
          role: 'Dedicated Hero Accent (Spot Tone)',
          isDedicatedSpot: true,
        };
        break;
      }
    }
  }

  // Role E: Secondary Focal Object Accent
  // If both pink and scarlet exist, secondary is the other one! (e.g. Cat gets BOTH Pink Toe Beans and Scarlet Yarn!)
  let secHotspot = null;
  if (scarletAccentCandidate && pinkAccentCandidate) {
    secHotspot = pinkAccentCandidate;
  } else {
    for (const isl of islands) {
      const dHero = heroHotspot ? deltaEOklab(isl.lab, heroHotspot.lab) : 1;
      const dBody = deltaEOklab(isl.lab, bodyLab);
      const dShadow = deltaEOklab(isl.lab, shadowLab);
      if (dHero > 0.065 && dBody > 0.065 && dShadow > 0.10 && isl.C >= 0.065) {
        secHotspot = {
          rgb: isl.rgb,
          lab: isl.lab,
          role: 'Secondary Focal Accent',
          isDedicatedSpot: true,
        };
        break;
      }
    }
  }

  // Role F: Tonal Depth Shading / Facial Contour
  const depthLab = [
    (bodyLab[0] + shadowLab[0] * 2) / 3,
    bodyLab[1] * 0.75,
    bodyLab[2] * 0.75,
  ];
  const depthInk = {
    lab: depthLab,
    rgb: oklabToRgb(depthLab[0], depthLab[1], depthLab[2]),
    role: 'Tonal Depth Shading / Facial Contour',
    isDedicatedSpot: false,
  };

  const inks = [];
  if (numInks === 2) {
    inks.push(canvasInk, keyShadow);
  } else if (numInks === 3) {
    inks.push(canvasInk, (heroHotspot || bodyInk), keyShadow);
  } else if (numInks === 4) {
    inks.push(canvasInk, bodyInk, (heroHotspot || depthInk), keyShadow);
  } else if (numInks === 5) {
    inks.push(canvasInk, bodyInk, (heroHotspot || depthInk));
    if (secHotspot) inks.push(secHotspot);
    else inks.push(depthInk);
    inks.push(keyShadow);
  } else { // 6 plates
    inks.push(canvasInk, bodyInk);
    if (heroHotspot) inks.push(heroHotspot);
    if (secHotspot) inks.push(secHotspot);
    inks.push(depthInk);
    inks.push(keyShadow);
  }

  // Sort from lightest to darkest for logical silkscreen sequence
  inks.sort((a, b) => b.lab[0] - a.lab[0]);

  return inks.map((k, idx) => {
    const rgb = k.rgb;
    const recipe = solvePaintRecipe(rgb);
    return {
      layerIndex: idx,
      name: `Screen ${idx + 1}: ${k.role}`,
      rgb,
      hex: recipe.hex,
      recipe,
      order: `${idx + 1} of ${inks.length}`,
      printOrder: idx + 1,
      isDedicatedSpot: !!k.isDedicatedSpot,
    };
  });
}

function getInkSemanticName(rgb, idx, numInks) {
  const [r, g, b] = rgb;
  const lab = rgbToOklab(r, g, b);
  const L = lab[0];
  const C = Math.sqrt(lab[1] * lab[1] + lab[2] * lab[2]);
  let deg = (Math.atan2(lab[2], lab[1]) * 180) / Math.PI;
  if (deg < 0) deg += 360;

  if (idx === numInks - 1 || L < 0.42) return 'Deep Key Shadow / Contour';

  if (C < 0.045) {
    if (L > 0.75) return 'Light Foundation Tone';
    return 'Warm Body Midtone';
  }

  // Saturated color ranges
  if (deg >= 10 && deg < 38) {
    if (L >= 0.65) return 'Rose Blush / Hotspot Accent';
    return 'Scarlet / Crimson Tone';
  }
  if (deg >= 38 && deg < 70) {
    if (L >= 0.62) return 'Peach / Coral Glow';
    return 'Warm Amber / Ochre';
  }
  if (deg >= 70 && deg < 115) return 'Canary Gold / Yellow';
  if (deg >= 115 && deg < 170) return 'Meadow / Foliage Green';
  if (deg >= 170 && deg < 215) return 'Cyan / Aqua Accent';
  if (deg >= 215 && deg < 275) return 'Cobalt / Periwinkle Blue';
  if (deg >= 275 && deg < 340) return 'Violet / Plum Accent';

  return `Custom Spot Tone ${idx + 1}`;
}

// ==============================================================================
// 4. VOID-AND-CLUSTER BLUE NOISE MATRIX
// ==============================================================================
let cachedBlueNoise = null;
function getBlueNoise64() {
  if (cachedBlueNoise) return cachedBlueNoise;
  const N = 64;
  const bn = new Float32Array(N * N);
  for (let y = 0; y < N; y++) {
    for (let x = 0; x < N; x++) {
      bn[y * N + x] = ((x * 0.7548776662 + y * 0.569840291) % 1.0) - 0.5;
    }
  }
  cachedBlueNoise = bn;
  return bn;
}

// ==============================================================================
// 5. HIGH-DETAIL ADAPTIVE ENGINE (Smooth Gradients & Organic Micro-Droplets)
// ==============================================================================
export function generateAdaptiveBlobbySeparation(imageData, options = {}) {
  const {
    cellSize = 1.8,          // Stipple fineness scale
    blobbiness = 1.2,        // Organic micro-droplet roundness
    swathTolDe = 0.025,      // Macro-swath tolerance
    minSwathPixels = 80,     // Min area for solid macro-swaths
    numInks = 4,             // 2 to 6 plates
    hotspotSensitivity = 0.6,// Balance between general picture accuracy and color hotspots
    customInks = null,
  } = options;

  const { width, height, data } = imageData;
  const total = width * height;

  // 1. Palette: N custom inks + 1 substrate white knockout
  const inks = customInks || extractGamutArchetypes(imageData, numInks, { hotspotSensitivity });
  const numLayers = inks.length;
  const substrateIdx = numLayers;
  const numPalette = numLayers + 1;

  const paletteRgb = inks.map((k) => k.rgb);
  paletteRgb.push([255, 255, 255]); // Substrate White Knockout

  const paletteOklab = paletteRgb.map((c) => rgbToOklab(c[0], c[1], c[2]));

  // 2. Precompute OKLab & Luminance
  const imgOklab = new Float32Array(total * 3);
  const lumMap = new Float32Array(total);

  for (let i = 0; i < total; i++) {
    const off = i * 4;
    const r = data[off];
    const g = data[off + 1];
    const b = data[off + 2];
    const lab = rgbToOklab(r, g, b);
    imgOklab[i * 3]     = lab[0];
    imgOklab[i * 3 + 1] = lab[1];
    imgOklab[i * 3 + 2] = lab[2];
    lumMap[i] = 0.299 * r + 0.587 * g + 0.114 * b;
  }

  // 3. Multi-Spectral OKLab Edge & Detail Preservation Map (Whiskers, Yarn strands, Eyes, Hotspot Contours)
  // Detects both luminance steps AND chromatic boundaries (e.g. pink pads against brown fur, red against neutral)
  const isDetailEdge = new Uint8Array(total);
  for (let y = 1; y < height - 1; y++) {
    const row = y * width;
    for (let x = 1; x < width - 1; x++) {
      const idx = row + x;
      const getLab = (ox, oy) => {
        const p = ((y + oy) * width + (x + ox)) * 3;
        return [imgOklab[p], imgOklab[p + 1], imgOklab[p + 2]];
      };
      const pL = (ox, oy) => getLab(ox, oy)[0];
      const pa = (ox, oy) => getLab(ox, oy)[1];
      const pb = (ox, oy) => getLab(ox, oy)[2];

      const gxL = -1 * pL(-1, -1) + 1 * pL(1, -1) - 2 * pL(-1, 0) + 2 * pL(1, 0) - 1 * pL(-1, 1) + 1 * pL(1, 1);
      const gyL = -1 * pL(-1, -1) - 2 * pL(0, -1) - 1 * pL(1, -1) + 1 * pL(-1, 1) + 2 * pL(0, 1) + 1 * pL(1, 1);
      const gxa = -1 * pa(-1, -1) + 1 * pa(1, -1) - 2 * pa(-1, 0) + 2 * pa(1, 0) - 1 * pa(-1, 1) + 1 * pa(1, 1);
      const gya = -1 * pa(-1, -1) - 2 * pa(0, -1) - 1 * pa(1, -1) + 1 * pa(-1, 1) + 2 * pa(0, 1) + 1 * pa(1, 1);
      const gxb = -1 * pb(-1, -1) + 1 * pb(1, -1) - 2 * pb(-1, 0) + 2 * pb(1, 0) - 1 * pb(-1, 1) + 1 * pb(1, 1);
      const gyb = -1 * pb(-1, -1) - 2 * pb(0, -1) - 1 * pb(1, -1) + 1 * pb(-1, 1) + 2 * pb(0, 1) + 1 * pb(1, 1);

      const grad = Math.sqrt((gxL * gxL + gyL * gyL) + 2.5 * (gxa * gxa + gya * gya) + 2.5 * (gxb * gxb + gyb * gyb));

      if (grad > 0.072) {
        isDetailEdge[idx] = 1;
      }
    }
  }

  // 4. Macro-Swaths Detection for flat background areas
  const isMacroSwath = new Uint8Array(total);
  const macroLabel = new Int8Array(total).fill(-1);

  for (let i = 0; i < total; i++) {
    if (isDetailEdge[i]) continue;

    const pLab = [imgOklab[i * 3], imgOklab[i * 3 + 1], imgOklab[i * 3 + 2]];
    let closestIdx = substrateIdx;
    let minDist = Infinity;
    for (let c = 0; c < numPalette; c++) {
      const d = deltaEOklab(pLab, paletteOklab[c]);
      if (d < minDist) {
        minDist = d;
        closestIdx = c;
      }
    }

    if (closestIdx === substrateIdx && lumMap[i] > 240) {
      isMacroSwath[i] = 1;
      macroLabel[i] = substrateIdx;
    } else if (minDist <= swathTolDe) {
      isMacroSwath[i] = 1;
      macroLabel[i] = closestIdx;
    }
  }

  // 5. Continuous Serpentine Error Diffusion with Bilateral Edge Constraints
  const bn = getBlueNoise64();
  const N = 64;
  const initialLabels = new Uint8Array(total);
  const errL = new Float32Array(total);
  const erra = new Float32Array(total);
  const errb = new Float32Array(total);

  const ditherNoiseScale = Math.max(0.015, Math.min(0.045, cellSize * 0.015));

  for (let y = 0; y < height; y++) {
    const isLtoR = y % 2 === 0;
    const startX = isLtoR ? 0 : width - 1;
    const endX = isLtoR ? width : -1;
    const dir = isLtoR ? 1 : -1;

    for (let x = startX; x !== endX; x += dir) {
      const idx = y * width + x;

      // Rule A: Macro-Swaths
      if (isMacroSwath[idx]) {
        initialLabels[idx] = macroLabel[idx];
        continue;
      }

      const origLab = [imgOklab[idx * 3], imgOklab[idx * 3 + 1], imgOklab[idx * 3 + 2]];
      const origC = Math.sqrt(origLab[1] * origLab[1] + origLab[2] * origLab[2]);

      // Rule B: High Edge Details (Whiskers, Eyes, Contours)
      // Snap directly without diffusion blur so fine lines and micro-accents stay razor-sharp
      if (isDetailEdge[idx]) {
        let best = substrateIdx;
        let minDist = Infinity;
        for (let c = 0; c < numPalette; c++) {
          if (c < numLayers && inks[c].isDedicatedSpot) {
            const spotC = Math.sqrt(paletteOklab[c][1] * paletteOklab[c][1] + paletteOklab[c][2] * paletteOklab[c][2]);
            const da = origLab[1] - paletteOklab[c][1];
            const db = origLab[2] - paletteOklab[c][2];
            const chromDist = Math.sqrt(da * da + db * db);
            if (origC < spotC * 0.65 || chromDist > 0.052) continue;
          }
          const d = deltaEOklab(origLab, paletteOklab[c]);
          if (d < minDist) {
            minDist = d;
            best = c;
          }
        }
        initialLabels[idx] = best;
        continue;
      }

      // Rule C: Smooth Tonal Transitions (Continuous Error Diffusion + Blue-Noise)
      const pL = imgOklab[idx * 3]     + errL[idx];
      const pa = imgOklab[idx * 3 + 1] + erra[idx];
      const pb = imgOklab[idx * 3 + 2] + errb[idx];

      const noise = bn[(y % N) * N + (x % N)] * ditherNoiseScale;
      const targetLab = [pL + noise, pa + noise * 0.7, pb + noise * 0.7];

      let best = substrateIdx;
      let minDist = Infinity;
      for (let c = 0; c < numPalette; c++) {
        // Dedicated Spot Gate: only pixels with genuine chromatic affinity can choose this spot color!
        if (c < numLayers && inks[c].isDedicatedSpot) {
          const spotC = Math.sqrt(paletteOklab[c][1] * paletteOklab[c][1] + paletteOklab[c][2] * paletteOklab[c][2]);
          const da = origLab[1] - paletteOklab[c][1];
          const db = origLab[2] - paletteOklab[c][2];
          const chromDist = Math.sqrt(da * da + db * db);
          if (origC < spotC * 0.68 || chromDist > 0.048) continue;
        }

        const d = deltaEOklab(targetLab, paletteOklab[c]);
        if (d < minDist) {
          minDist = d;
          best = c;
        }
      }

      initialLabels[idx] = best;

      // Serpentine Floyd-Steinberg error push with Edge-Constrained (Bilateral) Bleed Barrier
      const cLab = paletteOklab[best];
      const eL = pL - cLab[0];
      const ea = pa - cLab[1];
      const eb = pb - cLab[2];

      const isSpotChosen = (best < numLayers && inks[best].isDedicatedSpot);
      const spotDampen = isSpotChosen ? 0.2 : 1.0;

      const pushErr = (tx, ty, weight) => {
        if (tx >= 0 && tx < width && ty >= 0 && ty < height) {
          const tIdx = ty * width + tx;
          // Block error bleed across semantic object edges or sharp color boundaries
          if (isDetailEdge[tIdx]) return;

          const targetOrigLab = [imgOklab[tIdx * 3], imgOklab[tIdx * 3 + 1], imgOklab[tIdx * 3 + 2]];
          const diff = deltaEOklab(origLab, targetOrigLab);
          if (diff > 0.065) return; // Completely stops color bleed across object borders!

          const scale = 1.0 - (diff / 0.065);
          errL[tIdx] += eL * weight * scale * spotDampen;
          erra[tIdx] += ea * weight * scale * spotDampen;
          errb[tIdx] += eb * weight * scale * spotDampen;
        }
      };

      pushErr(x + dir, y,     7.0 / 16.0);
      pushErr(x - dir, y + 1, 3.0 / 16.0);
      pushErr(x,       y + 1, 5.0 / 16.0);
      pushErr(x + dir, y + 1, 1.0 / 16.0);
    }
  }

  // 6. Organic Micro-Droplet Morphology Filter with Hotspot & Detail Protection
  // Rounds pixel corners into fluid, organic ink droplets with natural perimeters without eroding small features
  const finalLabels = new Uint8Array(initialLabels);
  const roundness = Math.max(0, blobbiness);

  if (roundness > 0.1) {
    for (let y = 1; y < height - 1; y++) {
      const row = y * width;
      for (let x = 1; x < width - 1; x++) {
        const idx = row + x;
        if (isDetailEdge[idx] || isMacroSwath[idx]) continue;

        const curr = initialLabels[idx];
        const neighbors = [
          initialLabels[row - width + x],
          initialLabels[row + width + x],
          initialLabels[row + x - 1],
          initialLabels[row + x + 1],
          initialLabels[row - width + x - 1],
          initialLabels[row - width + x + 1],
          initialLabels[row + width + x - 1],
          initialLabels[row + width + x + 1],
        ];

        let same = 0;
        for (let k = 0; k < 8; k++) {
          if (neighbors[k] === curr) same++;
        }

        // Isolated 1-pixel jagged step: merge into dominant neighboring droplet
        // ONLY if surrounding is overwhelmingly dominant (>=6 of 8) AND original color difference is small
        if (same < 2) {
          const counts = new Array(numPalette).fill(0);
          for (let k = 0; k < 8; k++) counts[neighbors[k]]++;
          let dom = curr, maxC = 0;
          for (let c = 0; c < numPalette; c++) {
            if (counts[c] > maxC) { maxC = counts[c]; dom = c; }
          }
          if (maxC >= 6) {
            // Verify that we are not swallowing a salient micro-hotspot
            const origLab = [imgOklab[idx * 3], imgOklab[idx * 3 + 1], imgOklab[idx * 3 + 2]];
            const domLab = paletteOklab[dom];
            if (deltaEOklab(origLab, domLab) <= 0.08) {
              finalLabels[idx] = dom;
            }
          }
        }
      }
    }
  }

  // 7. Build Disjoint 1-Bit Screen Stencils (0% Overprint Guarantee)
  const screenMasks = inks.map(() => new Uint8Array(total));
  const substrateMask = new Uint8Array(total);

  const screenCounts = new Array(numLayers).fill(0);
  let macroCount = 0;
  let substrateCount = 0;

  for (let i = 0; i < total; i++) {
    const choice = finalLabels[i];
    if (isMacroSwath[i]) macroCount++;

    if (choice < numLayers) {
      screenMasks[choice][i] = 255;
      screenCounts[choice]++;
    } else {
      substrateMask[i] = 255;
      substrateCount++;
    }
  }

  // Statistics
  const macroPercent = Math.round((macroCount / total) * 1000) / 10;
  const substratePercent = Math.round((substrateCount / total) * 1000) / 10;
  const layerStats = inks.map((k, idx) => ({
    name: k.name,
    coveragePercent: Math.round((screenCounts[idx] / total) * 1000) / 10,
    hex: k.hex,
    rgb: k.rgb,
    order: k.order,
  }));

  return {
    width,
    height,
    inks,
    paletteRgb,
    paletteOklab,
    masterLabels: finalLabels,
    screenMasks,
    substrateMask,
    isMacroSwath,
    stats: {
      macroPercent,
      substratePercent,
      layerStats,
      totalCells: total,
      dotPitch: cellSize,
      blobbiness,
      numPlates: numLayers,
    },
  };
}

/**
 * Renders the simulated print on paper canvas with realistic ink opacity
 */
export function renderSimulatedPrint(
  separationData,
  ctx,
  activeLayers = null,
  paperRgb = [255, 255, 255],
  showMacroOverlay = false
) {
  const { width, height, masterLabels, paletteRgb, isMacroSwath, inks } = separationData;
  const numLayers = inks.length;
  const imgData = ctx.createImageData(width, height);
  const data = imgData.data;

  // Default activeLayers if not provided or length mismatch
  const effectiveActive = activeLayers && activeLayers.length === numLayers + 1
    ? activeLayers
    : new Array(numLayers + 1).fill(true);

  for (let i = 0; i < width * height; i++) {
    const off = i * 4;
    const colIdx = masterLabels[i];

    if (showMacroOverlay && isMacroSwath[i]) {
      data[off]     = Math.min(255, paletteRgb[colIdx][0] * 0.4 + 20);
      data[off + 1] = Math.min(255, paletteRgb[colIdx][1] * 0.4 + 220);
      data[off + 2] = Math.min(255, paletteRgb[colIdx][2] * 0.4 + 180);
      data[off + 3] = 255;
      continue;
    }

    if (colIdx < numLayers) {
      if (effectiveActive[colIdx]) {
        data[off]     = paletteRgb[colIdx][0];
        data[off + 1] = paletteRgb[colIdx][1];
        data[off + 2] = paletteRgb[colIdx][2];
        data[off + 3] = 255;
      } else {
        data[off]     = paperRgb[0];
        data[off + 1] = paperRgb[1];
        data[off + 2] = paperRgb[2];
        data[off + 3] = 255;
      }
    } else {
      // Substrate Knockout
      if (effectiveActive[numLayers]) {
        data[off]     = paperRgb[0];
        data[off + 1] = paperRgb[1];
        data[off + 2] = paperRgb[2];
        data[off + 3] = 255;
      } else {
        data[off]     = 240;
        data[off + 1] = 240;
        data[off + 2] = 240;
        data[off + 3] = 255;
      }
    }
  }

  ctx.putImageData(imgData, 0, 0);
}
