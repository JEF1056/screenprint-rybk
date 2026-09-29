/**
 * Procedural Sample Images generator for instant testing
 * Generates colorful canvas images with rich gradients, skin tones, greens, sky blues, and deep shadows.
 */

export function createSampleImage(type = 'landscape') {
  const canvas = document.createElement('canvas');
  canvas.width = 600;
  canvas.height = 450;
  const ctx = canvas.getContext('2d');

  if (type === 'landscape') {
    // Sunset over mountains with vibrant sky, green valley, and deep shadows
    // Sky gradient: Blue -> Orange -> Yellow
    const sky = ctx.createLinearGradient(0, 0, 0, 280);
    sky.addColorStop(0, '#1a365d'); // deep twilight blue
    sky.addColorStop(0.3, '#3182ce'); // blue sky
    sky.addColorStop(0.65, '#e53e3e'); // fiery sunset red
    sky.addColorStop(0.85, '#dd6b20'); // orange
    sky.addColorStop(1, '#ecc94b'); // brilliant yellow horizon
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, 600, 280);

    // Glowing Sun
    ctx.beginPath();
    ctx.arc(300, 220, 48, 0, Math.PI * 2);
    ctx.fillStyle = '#fffdf0';
    ctx.shadowColor = '#f6e05e';
    ctx.shadowBlur = 40;
    ctx.fill();
    ctx.shadowBlur = 0;

    // Distant Purple Mountains (Red + Blue mix)
    ctx.beginPath();
    ctx.moveTo(0, 240);
    ctx.lineTo(120, 160);
    ctx.lineTo(260, 230);
    ctx.lineTo(380, 150);
    ctx.lineTo(520, 220);
    ctx.lineTo(600, 180);
    ctx.lineTo(600, 320);
    ctx.lineTo(0, 320);
    ctx.closePath();
    ctx.fillStyle = '#553c9a';
    ctx.fill();

    // Midground Dark Blue-Green Ridge
    ctx.beginPath();
    ctx.moveTo(0, 260);
    ctx.lineTo(180, 200);
    ctx.lineTo(340, 280);
    ctx.lineTo(480, 220);
    ctx.lineTo(600, 270);
    ctx.lineTo(600, 360);
    ctx.lineTo(0, 360);
    ctx.closePath();
    ctx.fillStyle = '#234e52';
    ctx.fill();

    // Foreground Lush Green Valley (Yellow + Blue)
    const valley = ctx.createLinearGradient(0, 290, 0, 450);
    valley.addColorStop(0, '#38a169');
    valley.addColorStop(0.5, '#2f855a');
    valley.addColorStop(1, '#1c4532');
    ctx.fillStyle = valley;
    ctx.fillRect(0, 290, 600, 160);

    // Foreground Silhouetted Pine Trees (Deep Black details)
    function drawTree(x, y, scale) {
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.moveTo(x, y - 90 * scale);
      ctx.lineTo(x + 25 * scale, y - 50 * scale);
      ctx.lineTo(x + 12 * scale, y - 50 * scale);
      ctx.lineTo(x + 35 * scale, y - 10 * scale);
      ctx.lineTo(x + 18 * scale, y - 10 * scale);
      ctx.lineTo(x + 45 * scale, y + 35 * scale);
      ctx.lineTo(x - 45 * scale, y + 35 * scale);
      ctx.lineTo(x - 18 * scale, y - 10 * scale);
      ctx.lineTo(x - 35 * scale, y - 10 * scale);
      ctx.lineTo(x - 12 * scale, y - 50 * scale);
      ctx.lineTo(x - 25 * scale, y - 50 * scale);
      ctx.closePath();
      ctx.fill();

      // Trunk
      ctx.fillRect(x - 4 * scale, y + 35 * scale, 8 * scale, 25 * scale);
    }

    drawTree(70, 340, 0.9);
    drawTree(120, 360, 0.7);
    drawTree(510, 330, 1.1);
    drawTree(560, 350, 0.8);
    drawTree(440, 370, 0.6);

    // Lake Reflection in foreground
    ctx.beginPath();
    ctx.ellipse(300, 380, 180, 45, 0, 0, Math.PI * 2);
    const lake = ctx.createLinearGradient(120, 350, 480, 410);
    lake.addColorStop(0, '#2b6cb0');
    lake.addColorStop(0.5, '#dd6b20');
    lake.addColorStop(1, '#2c5282');
    ctx.fillStyle = lake;
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#1a202c';
    ctx.stroke();

  } else if (type === 'portrait') {
    // Pop-art style vibrant portrait with warm skin tones, red lips, yellow highlights, blue hair/shadows
    ctx.fillStyle = '#f7fafc';
    ctx.fillRect(0, 0, 600, 450);

    // Background geometric pop-art
    ctx.fillStyle = '#f6e05e';
    ctx.fillRect(0, 0, 300, 450);
    ctx.fillStyle = '#4299e1';
    ctx.fillRect(300, 0, 300, 450);

    // Big sun halo
    ctx.beginPath();
    ctx.arc(300, 225, 180, 0, Math.PI * 2);
    ctx.fillStyle = '#feb2b2';
    ctx.fill();

    // Stylized Face / Head
    ctx.beginPath();
    ctx.ellipse(300, 210, 110, 140, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#fbd38d'; // Warm skin
    ctx.fill();

    // Hair (Deep Blue / Violet)
    ctx.beginPath();
    ctx.arc(300, 170, 135, Math.PI * 0.8, Math.PI * 2.2);
    ctx.fillStyle = '#2b6cb0';
    ctx.fill();

    // Sunglasses / Glasses (Red frames, black lenses)
    ctx.fillStyle = '#e53e3e';
    ctx.fillRect(215, 180, 75, 45);
    ctx.fillRect(310, 180, 75, 45);
    ctx.fillRect(285, 195, 30, 10);
    
    ctx.fillStyle = '#1a202c';
    ctx.fillRect(222, 187, 60, 31);
    ctx.fillRect(317, 187, 60, 31);

    // Lips (Vibrant Red)
    ctx.beginPath();
    ctx.ellipse(300, 280, 35, 15, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#c53030';
    ctx.fill();

    // Bold Black outlines
    ctx.lineWidth = 5;
    ctx.strokeStyle = '#171923';
    ctx.stroke();

  } else {
    // Tropical Toucan / Parrot (Full RYB test: Yellow beak, Red feathers, Blue wings, Black body)
    ctx.fillStyle = '#2d3748';
    ctx.fillRect(0, 0, 600, 450);

    // Jungle foliage gradient (Lush Greens)
    const foliage = ctx.createLinearGradient(0, 0, 600, 450);
    foliage.addColorStop(0, '#22543d');
    foliage.addColorStop(0.5, '#2f855a');
    foliage.addColorStop(1, '#276749');
    ctx.fillStyle = foliage;
    ctx.fillRect(0, 0, 600, 450);

    // Giant jungle leaves
    ctx.fillStyle = '#48bb78';
    for (let i = 0; i < 5; i++) {
      ctx.beginPath();
      ctx.ellipse(100 + i * 110, 80, 80, 140, (i - 2) * 0.3, 0, Math.PI * 2);
      ctx.fill();
    }

    // Bird body (Black)
    ctx.beginPath();
    ctx.ellipse(320, 260, 90, 140, 0.2, 0, Math.PI * 2);
    ctx.fillStyle = '#111827';
    ctx.fill();

    // Bird Wing (Deep Blue with Red fringe)
    ctx.beginPath();
    ctx.ellipse(350, 290, 50, 100, 0.4, 0, Math.PI * 2);
    ctx.fillStyle = '#2b6cb0';
    ctx.fill();

    // Wing accent (Red)
    ctx.beginPath();
    ctx.ellipse(370, 320, 25, 45, 0.4, 0, Math.PI * 2);
    ctx.fillStyle = '#e53e3e';
    ctx.fill();

    // Yellow Beak (Bright Yellow with Red tip)
    ctx.beginPath();
    ctx.moveTo(270, 190);
    ctx.quadraticCurveTo(100, 200, 70, 260);
    ctx.quadraticCurveTo(180, 280, 270, 250);
    ctx.closePath();
    ctx.fillStyle = '#ecc94b';
    ctx.fill();

    // Red beak tip
    ctx.beginPath();
    ctx.moveTo(110, 205);
    ctx.quadraticCurveTo(75, 230, 70, 260);
    ctx.quadraticCurveTo(120, 265, 110, 205);
    ctx.closePath();
    ctx.fillStyle = '#e53e3e';
    ctx.fill();

    // Eye patch (White + Blue ring)
    ctx.beginPath();
    ctx.arc(285, 205, 20, 0, Math.PI * 2);
    ctx.fillStyle = '#3182ce';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(285, 205, 10, 0, Math.PI * 2);
    ctx.fillStyle = '#0f172a';
    ctx.fill();
  }

  return canvas.toDataURL('image/png');
}
