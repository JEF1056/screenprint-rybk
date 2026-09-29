import React, { useRef, useEffect, useState } from 'react';
import { Printer, Download, Eye, Layers, CheckCircle2 } from 'lucide-react';

export default function FilmPositivesView({ separationData }) {
  const [selectedPlate, setSelectedPlate] = useState('all'); // 'all' or 0, 1, 2, 3
  const [invertPlate, setInvertPlate] = useState(false);
  const canvasRefs = useRef([]);

  if (!separationData) {
    return (
      <div className="p-12 text-center text-slate-500">
        No film positives available. Please upload an image first.
      </div>
    );
  }

  const { width, height, inks, screenMasks, stats } = separationData;

  // Draw registration crosshair with outer circle
  const drawRegistrationMark = (ctx, x, y, size = 20) => {
    ctx.save();
    ctx.lineWidth = 1.4;
    ctx.strokeStyle = '#000000';
    ctx.fillStyle = '#000000';

    ctx.beginPath();
    ctx.arc(x, y, size / 2, 0, Math.PI * 2);
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(x, y, size / 4, 0, Math.PI * 2);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(x - size, y);
    ctx.lineTo(x + size, y);
    ctx.moveTo(x, y - size);
    ctx.lineTo(x, y + size);
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(x, y, 1.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  };

  // Render plates onto individual canvases
  useEffect(() => {
    inks.forEach((ink, idx) => {
      const canvas = canvasRefs.current[idx];
      if (!canvas) return;

      const border = 40;
      canvas.width = width + border * 2;
      canvas.height = height + border * 2;
      const ctx = canvas.getContext('2d');

      // Transparent film backing represented as pure white paper for screen exposure
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Render 1-bit stencil
      const imgData = ctx.createImageData(width, height);
      const mask = screenMasks[idx];

      for (let i = 0; i < width * height; i++) {
        const off = i * 4;
        const isDot = mask[i] === 255;
        const isBlack = invertPlate ? !isDot : isDot;

        if (isBlack) {
          // Opaque black on film for UV blocking during screen exposure
          imgData.data[off]     = 0;
          imgData.data[off + 1] = 0;
          imgData.data[off + 2] = 0;
          imgData.data[off + 3] = 255;
        } else {
          // Clear film
          imgData.data[off]     = 255;
          imgData.data[off + 1] = 255;
          imgData.data[off + 2] = 255;
          imgData.data[off + 3] = 255;
        }
      }

      ctx.putImageData(imgData, border, border);

      // Registration Marks in 4 corners and centers
      drawRegistrationMark(ctx, 22, 22);
      drawRegistrationMark(ctx, canvas.width - 22, 22);
      drawRegistrationMark(ctx, 22, canvas.height - 22);
      drawRegistrationMark(ctx, canvas.width - 22, canvas.height - 22);
      drawRegistrationMark(ctx, canvas.width / 2, 22);
      drawRegistrationMark(ctx, canvas.width / 2, canvas.height - 22);

      // Stencil Plate Label & Calibration text
      ctx.fillStyle = '#000000';
      ctx.font = '11px monospace';
      ctx.fillText(
        `SCREEN ${idx + 1} OF ${inks.length} | ${ink.name.toUpperCase()} | ORDER: ${ink.order} | COVERAGE: ${stats.layerStats[idx]?.coveragePercent}%`,
        border,
        25
      );
      ctx.fillText(
        `0% OVERPRINT DISJOINT STENCIL | OPAQUE INK CERTIFIED | REGISTRATION CORNERS ACTIVE`,
        border,
        canvas.height - 12
      );
    });
  }, [separationData, invertPlate, selectedPlate]);

  const handleDownloadPlate = (idx) => {
    const canvas = canvasRefs.current[idx];
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `Stencil_Screen_${idx + 1}_${inks[idx].hex.replace('#', '')}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  const handleDownloadAll = () => {
    inks.forEach((_, idx) => {
      setTimeout(() => {
        handleDownloadPlate(idx);
      }, idx * 250);
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Controls Toolbar */}
      <div className="no-print bg-slate-900/90 border border-slate-800 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4 shadow-lg">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2 text-amber-400 font-semibold text-sm">
            <Printer className="w-4 h-4" />
            <span>1-Bit Film Positives & Stencils</span>
          </div>
          <span className="text-slate-600">|</span>
          <div className="flex items-center space-x-1.5 text-xs text-emerald-400 font-medium">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Strictly Disjoint (0% Overprint)</span>
          </div>
        </div>

        {/* Plate Selector Buttons */}
        <div className="flex items-center space-x-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
          <button
            onClick={() => setSelectedPlate('all')}
            className={`px-2.5 py-1 rounded text-xs font-medium transition-all ${
              selectedPlate === 'all'
                ? 'bg-slate-800 text-amber-400 font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            All {inks.length} Screens
          </button>
          {inks.map((ink, idx) => (
            <button
              key={idx}
              onClick={() => setSelectedPlate(idx)}
              className={`flex items-center space-x-1.5 px-2.5 py-1 rounded text-xs font-medium transition-all ${
                selectedPlate === idx
                  ? 'bg-slate-800 text-amber-400 font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0 ring-1 ring-white/20"
                style={{ backgroundColor: ink.hex }}
              />
              <span>Screen {idx + 1}</span>
            </button>
          ))}
        </div>

        {/* Global Export Actions */}
        <div className="flex items-center space-x-2">
          <label className="flex items-center space-x-1.5 text-xs text-slate-300 cursor-pointer mr-2">
            <input
              type="checkbox"
              checked={invertPlate}
              onChange={(e) => setInvertPlate(e.target.checked)}
              className="accent-amber-400 rounded"
            />
            <span>Invert (Negative)</span>
          </label>

          <button
            onClick={handleDownloadAll}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md transition-all active:scale-[0.98]"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download All Stencils</span>
          </button>
        </div>
      </div>

      {/* Screen Positive Stencils Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {inks.map((ink, idx) => {
          if (selectedPlate !== 'all' && selectedPlate !== idx) return null;
          const coverage = stats.layerStats[idx]?.coveragePercent || 0;

          return (
            <div
              key={idx}
              className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between space-y-3 shadow-xl"
            >
              {/* Stencil Card Header */}
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center space-x-2.5">
                  <span
                    className="w-4 h-4 rounded-full ring-2 ring-white/20"
                    style={{ backgroundColor: ink.hex }}
                  />
                  <div>
                    <h4 className="text-sm font-bold text-white">{ink.name}</h4>
                    <p className="text-[11px] text-slate-400 font-mono">
                      Print Order: {ink.order} • Coverage: {coverage}%
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => handleDownloadPlate(idx)}
                  className="no-print flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors border border-slate-700"
                >
                  <Download className="w-3 h-3" />
                  <span>PNG</span>
                </button>
              </div>

              {/* High-Contrast Canvas Viewport */}
              <div className="bg-white rounded-lg p-2 flex items-center justify-center overflow-hidden shadow-inner">
                <canvas
                  ref={(el) => (canvasRefs.current[idx] = el)}
                  className="max-w-full h-auto object-contain max-h-[480px]"
                />
              </div>

              {/* Recommended Press Specs */}
              <div className="pt-2 flex items-center justify-between text-[11px] text-slate-400 font-mono">
                <span>Mesh: 230–305 (90–120T)</span>
                <span>Squeegee: 70/90/70 Triple Durometer</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
