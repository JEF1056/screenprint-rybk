import React, { useRef, useState, useEffect } from 'react';
import { UploadCloud, Image as ImageIcon, Sparkles, ChevronDown, ChevronUp, RefreshCw, Sun } from 'lucide-react';
import { createSampleImage } from '../utils/sampleImages';

export default function ImageUploader({
  onImageLoaded,
  currentImageName,
  isProcessing,
  brightness = 100,
  onBrightnessChange,
}) {
  const fileInputRef = useRef(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [localBrightness, setLocalBrightness] = useState(brightness);
  const debounceRef = useRef(null);

  useEffect(() => {
    setLocalBrightness(brightness);
  }, [brightness]);

  const handleBrightnessChange = (e) => {
    const val = parseInt(e.target.value);
    setLocalBrightness(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      onBrightnessChange?.(val);
    }, 70);
  };

  const handleResetBrightness = () => {
    setLocalBrightness(100);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    onBrightnessChange?.(100);
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      onImageLoaded(event.target.result, file.name);
      setIsExpanded(false);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      onImageLoaded(event.target.result, file.name);
      setIsExpanded(false);
    };
    reader.readAsDataURL(file);
  };

  const loadSample = (type, label) => {
    const dataUrl = createSampleImage(type);
    onImageLoaded(dataUrl, `Sample: ${label}`);
    setIsExpanded(false);
  };

  return (
    <div className="no-print mb-6">
      {/* Compact Status Bar when Image is active and not expanded */}
      {!isExpanded && currentImageName && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 shadow-md">
          <div className="flex items-center space-x-2.5 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-slate-800 border border-slate-700/80 flex items-center justify-center shrink-0">
              {isProcessing ? (
                <RefreshCw className="w-3.5 h-3.5 text-amber-400 animate-spin" />
              ) : (
                <ImageIcon className="w-3.5 h-3.5 text-amber-400" />
              )}
            </div>
            <div className="min-w-0">
              <div className="flex items-center space-x-2">
                <span className="text-xs font-semibold text-slate-200 truncate">
                  {currentImageName}
                </span>
                {isProcessing && (
                  <span className="text-[10px] text-amber-400 font-mono animate-pulse">
                    Processing channels...
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Quick Pre-Pipeline Brightness slider */}
          <div className="flex items-center space-x-2 bg-slate-950/80 px-2.5 py-1.5 rounded-lg border border-slate-800">
            <Sun className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span className="text-[11px] text-slate-400 font-medium hidden sm:inline">
              Brightness:
            </span>
            <input
              type="range"
              min="0"
              max="200"
              step="1"
              value={localBrightness}
              onChange={handleBrightnessChange}
              className="w-16 sm:w-24 accent-amber-400 bg-slate-800 h-1.5 rounded-lg appearance-none cursor-pointer"
              title={`Original photo brightness before separation (${localBrightness}%)`}
            />
            <span className="font-mono text-amber-400 font-bold text-[11px] w-8 text-right">
              {localBrightness}%
            </span>
            {localBrightness !== 100 && (
              <button
                type="button"
                onClick={handleResetBrightness}
                className="text-[10px] text-slate-400 hover:text-amber-400 font-mono underline transition-colors"
                title="Reset to 100%"
              >
                Reset
              </button>
            )}
          </div>

          {/* Quick sample switches & upload button */}
          <div className="flex items-center space-x-2">
            <div className="hidden sm:flex items-center space-x-1 text-xs">
              <span className="text-slate-500 text-[11px] mr-1">Samples:</span>
              <button
                type="button"
                onClick={() => loadSample('landscape', 'Sunset Mountain')}
                className="px-2 py-1 rounded-md bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white text-[11px] font-medium transition-colors"
              >
                Sunset
              </button>
              <button
                type="button"
                onClick={() => loadSample('portrait', 'Pop Face')}
                className="px-2 py-1 rounded-md bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white text-[11px] font-medium transition-colors"
              >
                Portrait
              </button>
              <button
                type="button"
                onClick={() => loadSample('toucan', 'Tropical Bird')}
                className="px-2 py-1 rounded-md bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white text-[11px] font-medium transition-colors"
              >
                Toucan
              </button>
            </div>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center space-x-1.5 px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium transition-all active:scale-[0.98]"
            >
              <UploadCloud className="w-3.5 h-3.5 text-amber-400" />
              <span>Upload New</span>
            </button>

            <button
              type="button"
              onClick={() => setIsExpanded(true)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
              title="Expand dropzone"
            >
              <ChevronDown className="w-4 h-4" />
            </button>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/png, image/jpeg, image/webp"
              className="hidden"
            />
          </div>
        </div>
      )}

      {/* Full Dropzone (when expanded or on initial empty state) */}
      {(isExpanded || !currentImageName) && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center space-x-1.5">
              <UploadCloud className="w-3.5 h-3.5 text-amber-400" />
              <span>Load Image For Screenprint Separation</span>
            </span>
            {currentImageName && (
              <button
                type="button"
                onClick={() => setIsExpanded(false)}
                className="flex items-center space-x-1 text-xs text-slate-400 hover:text-slate-200"
              >
                <span>Collapse</span>
                <ChevronUp className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            {/* Dropzone */}
            <div className="lg:col-span-8">
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className="border border-dashed border-slate-700 hover:border-amber-500/60 bg-slate-950/70 hover:bg-slate-950 transition-all rounded-lg p-6 flex flex-col items-center justify-center text-center cursor-pointer group"
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/png, image/jpeg, image/webp"
                  className="hidden"
                />
                <div className="w-10 h-10 rounded-full bg-slate-800 group-hover:bg-amber-500/10 text-slate-400 group-hover:text-amber-400 flex items-center justify-center mb-2 transition-colors">
                  <UploadCloud className="w-5 h-5" />
                </div>
                <p className="text-xs font-semibold text-slate-200 group-hover:text-white">
                  Drop photo here, or <span className="text-amber-400 underline decoration-amber-500/40">browse file</span>
                </p>
                <p className="text-[11px] text-slate-500 mt-1">
                  PNG, JPG, WebP. High-res photos are automatically separated into printable RYBK channels.
                </p>
              </div>
            </div>

            {/* Presets */}
            <div className="lg:col-span-4 flex flex-col justify-between">
              <span className="text-[11px] font-medium text-slate-400 mb-2 block">
                Or select studio test sample:
              </span>
              <div className="grid grid-cols-3 gap-2 flex-1">
                <button
                  type="button"
                  onClick={() => loadSample('landscape', 'Sunset Mountain')}
                  className="flex flex-col items-center justify-center p-2 rounded-lg bg-slate-950/60 hover:bg-slate-800 border border-slate-800 hover:border-amber-500/50 transition-all text-center"
                >
                  <div className="w-full h-8 rounded bg-gradient-to-br from-amber-500 via-rose-500 to-sky-700 mb-1" />
                  <span className="text-[10px] font-semibold text-slate-200">Sunset</span>
                </button>
                <button
                  type="button"
                  onClick={() => loadSample('portrait', 'Pop Art Face')}
                  className="flex flex-col items-center justify-center p-2 rounded-lg bg-slate-950/60 hover:bg-slate-800 border border-slate-800 hover:border-amber-500/50 transition-all text-center"
                >
                  <div className="w-full h-8 rounded bg-gradient-to-br from-yellow-300 via-rose-400 to-blue-600 mb-1" />
                  <span className="text-[10px] font-semibold text-slate-200">Portrait</span>
                </button>
                <button
                  type="button"
                  onClick={() => loadSample('toucan', 'Tropical Toucan')}
                  className="flex flex-col items-center justify-center p-2 rounded-lg bg-slate-950/60 hover:bg-slate-800 border border-slate-800 hover:border-amber-500/50 transition-all text-center"
                >
                  <div className="w-full h-8 rounded bg-gradient-to-br from-emerald-600 via-yellow-400 to-slate-900 mb-1" />
                  <span className="text-[10px] font-semibold text-slate-200">Toucan</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
