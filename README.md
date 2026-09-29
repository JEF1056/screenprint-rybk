# RYBK Screenprint Studio

A specialized React web application that converts color photos into **printable 4-color screenprinting film positives** using **Red, Yellow, Blue, and Black (RYBK)** paints, and automatically formulates the **exact paint mix ratios** needed for your print run.

---

## 🎨 Why RYBK Instead of Industrial CMYK?

Traditional commercial printing uses **CMYK** (Cyan, Magenta, Yellow, Black) inks. However, fine artists, printmakers, and DIY screenprinters often have standard artist acrylics or screen inks in **Red, Yellow, Blue, and Black**:
- **Yellow (0°)**: Subtractive base that absorbs blue light, setting highlight vibrancy.
- **Red (75°)**: Warm primary that overlays yellow to produce oranges and fiery reds.
- **Blue (15°)**: Cool primary that overlays yellow to create greens, and overlays red to create purples and deep indigos.
- **Black (45°)**: Key shadow plate for sharp registration, dark outlines, and tonal depth.

---

## ✨ Features

1. **Subtractive Color Separation Engine**:
   - Decomposes RGB imagery into physical **Yellow, Red, Blue, and Black** ink channels.
   - Built-in **Under Color Removal (UCR)** and **Gray Component Replacement (GCR)** to prevent ink pooling and smearing on paper.
   - Color profile presets: *Artist Primaries*, *Vibrant Process*, and *Vintage Poster*.

2. **Moiré-Free Halftone & Screening**:
   - **AM Halftone Screen**: Rotated angle matrix (Yellow: 0°, Red: 75°, Blue: 15°, Black: 45°) to eliminate visual moiré clashing.
   - **Atkinson Dithering**: Classic 3/4 error diffusion popularized by Risograph art.
   - **Floyd-Steinberg Dithering**: Smooth stochastic screening.
   - **Bayer Matrix 8x8**: Retro ordered dithering.
   - **Continuous Grayscale**: For direct RIP software workflows.

3. **Printable Film Positives Layout**:
   - **Precision Registration Targets**: Corner and center crosshairs with circular targets for alignment.
   - **Exposure Step Wedge**: 10%–100% density calibration strips on film margins to test UV exposure units.
   - **Plate Metadata Stamp**: Plate name, print order, angle, LPI, and surface coverage percentage.
   - **One-Click Browser Print**: Formatted with `@media print` page breaks to print all 4 transparency sheets onto film/acetate.
   - **High-Res PNG Export**: Download individual screen film positives.

4. **Automatic Paint Mix & Ratio Calculator**:
   - Calculates exact pigment and base volumes in **milliliters (ml)** and **fluid ounces (fl oz)** plus kitchen approximations (tbsp/tsp).
   - Accounts for **print sheet size** (US Letter, 11x14, 11x17, 18x24, A4, A3, or custom dimensions).
   - Accounts for **edition size** (e.g., 10, 25, 50 prints) and **mesh count** (156, 200, 230, 280, 305).
   - Calculates **Squeegee Reservoir Margin** (+25ml safety flood pool).
   - **Transparent Extender Base Formulator**: Recommends the exact ratio of acrylic paint to transparent screenprint base so colors blend subtractively instead of masking each other.

5. **Live Screenprint Simulation**:
   - Real-time simulation of stacked ink layers using the Beer-Lambert subtractive light transmission model.
   - Toggle individual screen layers ON/OFF (see Yellow + Red = Orange, etc.).
   - Test against multiple substrates: *Cotton Rag White*, *Bright Pure White*, *Warm Cream / Vellum*, and *Kraft Cardboard*.
   - Split-screen comparison slider to compare original photo vs printed outcome.

---

## 🚀 Running the App

The development server is running at:
```bash
http://localhost:3000/
```

To run manually or rebuild:
```bash
# Start Vite development server
npm run dev

# Build production bundle
npm run build

# Preview production build
npm run preview
```
