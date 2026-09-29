import React, { useState } from 'react';
import { Droplets, Scale, Check, Info, Palette, RotateCcw } from 'lucide-react';
import { DEFAULT_STOCK_PAINTS } from '../utils/blobbyEngine';

export default function PaintLabView({
  separationData,
  stockPaints,
  onUpdateStockPaints,
  onResetStockPaints,
}) {
  const [batchWeight, setBatchWeight] = useState(250); // grams per screen
  const [unit, setUnit] = useState('g'); // 'g' or 'oz'

  if (!separationData) return null;
  const { inks, stats } = separationData;

  const handleStockColorChange = (id, newHex) => {
    // Convert hex to rgb
    const r = parseInt(newHex.slice(1, 3), 16) || 0;
    const g = parseInt(newHex.slice(3, 5), 16) || 0;
    const b = parseInt(newHex.slice(5, 7), 16) || 0;

    const updated = stockPaints.map((p) =>
      p.id === id ? { ...p, hex: newHex, rgb: [r, g, b] } : p
    );
    onUpdateStockPaints(updated);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner: Studio Formulation Overview */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-amber-400 font-semibold text-sm">
            <Droplets className="w-4 h-4" />
            <span>Studio Paint Formulation Lab</span>
          </div>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
            These {inks.length} custom inks were dynamically computed using <strong>Kubelka-Munk subtractive physics</strong> to enclose your artwork's color gamut. Weigh each base paint on a digital scale to mix the exact shade before pouring onto screens.
          </p>
        </div>

        {/* Batch Weight Calculator Controls */}
        <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 flex items-center space-x-3 shrink-0">
          <div className="flex items-center space-x-1.5 text-xs text-slate-300">
            <Scale className="w-4 h-4 text-amber-400" />
            <span className="font-medium">Batch per Screen:</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <input
              type="number"
              min="20"
              max="5000"
              step="10"
              value={batchWeight}
              onChange={(e) => setBatchWeight(Math.max(10, parseInt(e.target.value) || 100))}
              className="w-20 px-2 py-1 bg-slate-900 border border-slate-700 rounded-lg text-xs font-mono text-white text-right focus:outline-none focus:border-amber-400"
            />
            <div className="flex bg-slate-900 rounded-lg border border-slate-800 p-0.5 text-[11px]">
              <button
                onClick={() => setUnit('g')}
                className={`px-1.5 py-0.5 rounded font-mono ${
                  unit === 'g' ? 'bg-slate-800 text-amber-400 font-bold' : 'text-slate-500'
                }`}
              >
                g
              </button>
              <button
                onClick={() => setUnit('oz')}
                className={`px-1.5 py-0.5 rounded font-mono ${
                  unit === 'oz' ? 'bg-slate-800 text-amber-400 font-bold' : 'text-slate-500'
                }`}
              >
                oz
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Dynamic Custom Ink Recipe Cards Grid */}
      <div className={`grid grid-cols-1 md:grid-cols-2 ${inks.length <= 3 ? 'lg:grid-cols-3' : 'lg:grid-cols-4'} gap-4`}>
        {inks.map((ink, idx) => {
          const coverage = stats.layerStats[idx]?.coveragePercent || 0;
          return (
            <div
              key={idx}
              className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between space-y-4 shadow-xl hover:border-slate-700 transition-all"
            >
              {/* Header: Swatch & Name */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                    Print Order: {ink.order}
                  </span>
                  <span className="text-xs text-slate-400 font-medium">
                    Coverage: <strong className="text-slate-200">{coverage}%</strong>
                  </span>
                </div>

                <div className="flex items-center space-x-3">
                  <div
                    className="w-12 h-12 rounded-xl ring-2 ring-white/10 shadow-inner shrink-0"
                    style={{ backgroundColor: ink.hex }}
                  />
                  <div className="min-w-0">
                    <h4 className="text-sm font-bold text-white truncate">{ink.name}</h4>
                    <div className="flex items-center space-x-2 text-[11px] font-mono text-slate-400 mt-0.5">
                      <span>{ink.hex}</span>
                      <span>•</span>
                      <span>RGB({ink.rgb.join(',')})</span>
                    </div>
                  </div>
                </div>

                {/* Subtractive Mix Parts List */}
                <div className="space-y-2 pt-2 border-t border-slate-800/80">
                  <span className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider">
                    Physical Mixing Recipe:
                  </span>
                  <div className="space-y-1.5">
                    {ink.recipe.parts.map((part) => {
                      if (part.percent <= 0) return null;
                      const weightAmount = ((part.percent / 100) * batchWeight).toFixed(1);
                      return (
                        <div
                          key={part.id}
                          className="flex items-center justify-between text-xs py-1 px-2 rounded-lg bg-slate-950/70 border border-slate-800/70"
                        >
                          <span className="text-slate-300 font-medium">{part.name}</span>
                          <div className="flex items-center space-x-2 font-mono">
                            <span className="text-amber-400 font-semibold">{part.percent}%</span>
                            <span className="text-slate-400 text-[11px]">
                              ({weightAmount} {unit})
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Footer info: Fidelity deltaE */}
              <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-500">
                <span>Formulation Fidelity:</span>
                <span className="font-mono text-emerald-400 font-medium">
                  ΔE {ink.recipe.deltaE} (Optimal)
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Stock Paint Base Palette Calibration */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Palette className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-bold text-white">Your Stock Base Inks</h3>
          </div>
          <button
            onClick={onResetStockPaints}
            className="flex items-center space-x-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Stock Primaries</span>
          </button>
        </div>

        <p className="text-xs text-slate-400">
          The algorithm uses these 5 stock inks in your shop to formulate all custom colors. You can calibrate their exact shades to match your brand of plastisol or waterbased inks.
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {stockPaints.map((paint) => (
            <div
              key={paint.id}
              className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-center space-x-3"
            >
              <input
                type="color"
                value={paint.hex}
                onChange={(e) => handleStockColorChange(paint.id, e.target.value)}
                className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0 p-0"
              />
              <div className="min-w-0">
                <span className="text-xs font-semibold text-slate-200 block truncate">
                  {paint.name}
                </span>
                <span className="text-[10px] font-mono text-slate-500 uppercase">
                  {paint.hex}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
