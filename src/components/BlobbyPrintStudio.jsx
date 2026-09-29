import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  Layers,
  ZoomIn,
  Split,
  Eye,
  EyeOff,
  Sparkles,
  Sliders,
  CheckCircle2,
  Maximize2,
  RefreshCw,
  Info,
  Sun,
} from 'lucide-react';
import { renderSimulatedPrint } from '../utils/blobbyEngine';

export default function BlobbyPrintStudio({
  originalImage,
  adjustedImage,
  separationData,
  onUpdateParams,
  params,
  isProcessing,
}) {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const loupeCanvasRef = useRef(null);

  // View state
  const [viewMode, setViewMode] = useState('composite'); // 'composite', 'split', 'macro_overlay'
  const [splitPos, setSplitPos] = useState(0.5); // 0..1
  const [isDraggingSplit, setIsDraggingSplit] = useState(false);
  const [paperType, setPaperType] = useState('white'); // 'white', 'cotton', 'cream'
  const [activeLayers, setActiveLayers] = useState([]);
  
  // Keep activeLayers in sync with dynamic number of ink layers + 1 substrate knockout
  useEffect(() => {
    if (separationData?.inks) {
      setActiveLayers(new Array(separationData.inks.length + 1).fill(true));
    }
  }, [separationData?.inks?.length]);

  // Zoom Loupe state
  const [showLoupe, setShowLoupe] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0, relX: 0, relY: 0, visible: false });
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });

  // Track rendered canvas dimensions for pixel-perfect 1:1 overlay alignment
  useEffect(() => {
    if (!canvasRef.current) return;
    const updateSize = () => {
      if (canvasRef.current) {
        setCanvasSize({
          width: canvasRef.current.clientWidth,
          height: canvasRef.current.clientHeight,
        });
      }
    };
    updateSize();
    const observer = new ResizeObserver(updateSize);
    observer.observe(canvasRef.current);
    return () => observer.disconnect();
  }, [separationData, viewMode]);

  // Local parameters state
  const [localParams, setLocalParams] = useState(params);
  const debounceTimerRef = useRef(null);

  useEffect(() => {
    setLocalParams(params);
  }, [params]);

  // Real-time slider update with silky 70ms debounce
  const handleParamChange = (key, value) => {
    const updated = { ...localParams, [key]: value };
    setLocalParams(updated);

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    debounceTimerRef.current = setTimeout(() => {
      onUpdateParams(updated);
    }, 70);
  };

  const paperColors = {
    white: { name: 'Pure White', rgb: [255, 255, 255], hex: '#FFFFFF' },
    cotton: { name: 'Rag White', rgb: [248, 246, 240], hex: '#F8F6F0' },
    cream: { name: 'Warm Cream', rgb: [244, 238, 222], hex: '#F4EEDD' },
  };

  // Re-render canvas when separation data, active layers, paper, or overlay changes
  useEffect(() => {
    if (!canvasRef.current || !separationData) return;
    const canvas = canvasRef.current;
    canvas.width = separationData.width;
    canvas.height = separationData.height;
    const ctx = canvas.getContext('2d');

    const paper = paperColors[paperType].rgb;
    const showOverlay = viewMode === 'macro_overlay';

    renderSimulatedPrint(separationData, ctx, activeLayers, paper, showOverlay);
  }, [separationData, activeLayers, paperType, viewMode]);

  // Update Zoom Loupe
  useEffect(() => {
    if (!showLoupe || !mousePos.visible || !canvasRef.current || !loupeCanvasRef.current) return;
    const mainCanvas = canvasRef.current;
    const loupeCanvas = loupeCanvasRef.current;
    const lCtx = loupeCanvas.getContext('2d');

    const zoomFactor = 4;
    const loupeW = loupeCanvas.width;
    const loupeH = loupeCanvas.height;

    const srcW = loupeW / zoomFactor;
    const srcH = loupeH / zoomFactor;
    const srcX = Math.max(0, Math.min(mainCanvas.width - srcW, mousePos.imgX - srcW / 2));
    const srcY = Math.max(0, Math.min(mainCanvas.height - srcH, mousePos.imgY - srcH / 2));

    lCtx.imageSmoothingEnabled = false; // Crisp pixel/blob rendering
    lCtx.clearRect(0, 0, loupeW, loupeH);
    lCtx.drawImage(mainCanvas, srcX, srcY, srcW, srcH, 0, 0, loupeW, loupeH);

    // Crosshair in center of loupe
    lCtx.strokeStyle = 'rgba(251, 191, 36, 0.7)';
    lCtx.lineWidth = 1;
    lCtx.strokeRect(loupeW / 2 - 4, loupeH / 2 - 4, 8, 8);
  }, [showLoupe, mousePos, separationData, activeLayers, paperType, viewMode]);

  // Global drag listener so dragging split handle is smooth even if cursor moves fast or outside container
  useEffect(() => {
    if (!isDraggingSplit) return;

    const handleGlobalMove = (e) => {
      if (!canvasRef.current) return;
      const canvasRect = canvasRef.current.getBoundingClientRect();
      const canvasRelX = Math.max(0, Math.min(1, (e.clientX - canvasRect.left) / (canvasRect.width || 1)));
      setSplitPos(canvasRelX);
    };

    const handleGlobalUp = () => {
      setIsDraggingSplit(false);
    };

    window.addEventListener('mousemove', handleGlobalMove);
    window.addEventListener('mouseup', handleGlobalUp);
    return () => {
      window.removeEventListener('mousemove', handleGlobalMove);
      window.removeEventListener('mouseup', handleGlobalUp);
    };
  }, [isDraggingSplit]);

  // Mouse move handler for Zoom Loupe and Split slider
  const handleMouseMove = (e) => {
    if (!containerRef.current || !canvasRef.current) return;
    const containerRect = containerRef.current.getBoundingClientRect();
    const canvasRect = canvasRef.current.getBoundingClientRect();

    const mouseX = e.clientX - containerRect.left;
    const mouseY = e.clientY - containerRect.top;

    // Relative to the actual canvas for 1:1 pixel accuracy
    const canvasRelX = Math.max(0, Math.min(1, (e.clientX - canvasRect.left) / (canvasRect.width || 1)));
    const canvasRelY = Math.max(0, Math.min(1, (e.clientY - canvasRect.top) / (canvasRect.height || 1)));

    const imgX = canvasRelX * canvasRef.current.width;
    const imgY = canvasRelY * canvasRef.current.height;

    const isOverCanvas =
      e.clientX >= canvasRect.left &&
      e.clientX <= canvasRect.right &&
      e.clientY >= canvasRect.top &&
      e.clientY <= canvasRect.bottom;

    setMousePos({
      x: mouseX,
      y: mouseY,
      relX: canvasRelX,
      relY: canvasRelY,
      imgX,
      imgY,
      visible: isOverCanvas,
    });

    if (isDraggingSplit && viewMode === 'split') {
      setSplitPos(canvasRelX);
    }
  };

  const handleMouseLeave = () => {
    setMousePos((prev) => ({ ...prev, visible: false }));
  };

  const toggleLayer = (index) => {
    setActiveLayers((prev) => {
      const next = [...prev];
      next[index] = !next[index];
      return next;
    });
  };

  const handleApplyParams = () => {
    onUpdateParams(localParams);
  };

  const hasPendingChanges =
    localParams.cellSize !== params.cellSize ||
    localParams.blobbiness !== params.blobbiness ||
    localParams.swathTolDe !== params.swathTolDe ||
    localParams.minSwathPixels !== params.minSwathPixels ||
    localParams.hotspotSensitivity !== params.hotspotSensitivity ||
    localParams.numInks !== params.numInks ||
    localParams.brightness !== params.brightness;

  if (!separationData) {
    return (
      <div className="flex items-center justify-center p-12 text-slate-400">
        Processing image with Adaptive Blobby Separation Engine...
      </div>
    );
  }

  const { stats, inks } = separationData;

  return (
    <div className="space-y-5">
      {/* Top Bar: Engine Status & Key Certifications */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 flex flex-wrap items-center justify-between gap-3 text-xs shadow-lg">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>0.0% Overprint (Opaque Certified)</span>
          </div>
          <div className="hidden sm:flex items-center space-x-2 text-slate-400">
            <span>•</span>
            <span>
              Solid Swaths: <strong className="text-slate-200">{stats.macroPercent}%</strong>
            </span>
            <span>•</span>
            <span>
              Blended Micro-Blobs: <strong className="text-slate-200">{(100 - stats.macroPercent - stats.substratePercent).toFixed(1)}%</strong>
            </span>
            <span>•</span>
            <span>
              Paper Knockout: <strong className="text-slate-200">{stats.substratePercent}%</strong>
            </span>
          </div>
        </div>

        {/* Paper Substrate Preset */}
        <div className="flex items-center space-x-1.5 bg-slate-950 p-1 rounded-lg border border-slate-800">
          <span className="text-[11px] text-slate-500 px-1.5">Paper:</span>
          {Object.entries(paperColors).map(([key, item]) => (
            <button
              key={key}
              onClick={() => setPaperType(key)}
              className={`px-2 py-0.5 rounded text-[11px] font-medium transition-all ${
                paperType === key
                  ? 'bg-slate-800 text-amber-300 font-semibold shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {item.name}
            </button>
          ))}
        </div>
      </div>

      {/* Main Studio Workspace: Canvas & Controls Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">
        
        {/* Left Column: Canvas Viewport (3 Cols on desktop) */}
        <div className="lg:col-span-3 flex flex-col space-y-3">
          {/* Viewport Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-900/60 p-2 rounded-xl border border-slate-800">
            {/* View Mode Switches */}
            <div className="flex items-center space-x-1">
              <button
                onClick={() => setViewMode('composite')}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  viewMode === 'composite'
                    ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Simulated Print</span>
              </button>

              <button
                onClick={() => setViewMode('split')}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  viewMode === 'split'
                    ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                }`}
              >
                <Split className="w-3.5 h-3.5" />
                <span>Split Compare</span>
              </button>

              <button
                onClick={() => setViewMode('macro_overlay')}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  viewMode === 'macro_overlay'
                    ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                }`}
                title="Highlights solid continuous swaths vs. dithered micro-blobs"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Swath Overlay</span>
              </button>
            </div>

            {/* Zoom Loupe Toggle */}
            <button
              onClick={() => setShowLoupe(!showLoupe)}
              className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                showLoupe
                  ? 'bg-amber-500 text-slate-950 border-amber-400 font-semibold'
                  : 'bg-slate-800/80 text-slate-300 border-slate-700 hover:bg-slate-700'
              }`}
            >
              <ZoomIn className="w-3.5 h-3.5" />
              <span>{showLoupe ? 'Loupe Active' : 'Inspect Blobs (4x)'}</span>
            </button>
          </div>

          {/* Interactive Canvas Display */}
          <div
            ref={containerRef}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            className="relative bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden shadow-2xl flex items-center justify-center p-3 select-none"
            style={{ minHeight: '440px' }}
          >
            {/* Centered Canvas & Split Overlay Wrapper */}
            <div
              className={`relative inline-flex items-center justify-center rounded-lg shadow-md overflow-hidden max-w-full max-h-[680px] ${
                viewMode === 'split' ? 'cursor-ew-resize' : ''
              }`}
              onMouseDown={(e) => {
                if (viewMode === 'split') {
                  e.preventDefault();
                  setIsDraggingSplit(true);
                  if (canvasRef.current) {
                    const canvasRect = canvasRef.current.getBoundingClientRect();
                    const canvasRelX = Math.max(
                      0,
                      Math.min(1, (e.clientX - canvasRect.left) / (canvasRect.width || 1))
                    );
                    setSplitPos(canvasRelX);
                  }
                }
              }}
            >
              {/* Background Simulated Print Canvas */}
              <canvas
                ref={canvasRef}
                className="max-w-full max-h-[680px] w-auto h-auto rounded-lg block"
              />

              {/* Split Comparison Overlay */}
              {viewMode === 'split' && (adjustedImage || originalImage) && (
                <>
                  {/* Clipped Original Photo Layer (Left Side) */}
                  <div
                    className="absolute inset-y-0 left-0 overflow-hidden pointer-events-none"
                    style={{ width: `${splitPos * 100}%` }}
                  >
                    <img
                      src={adjustedImage || originalImage}
                      alt="Original (Pre-Pipeline)"
                      className="absolute top-0 left-0 max-w-none max-h-none pointer-events-none rounded-lg"
                      style={{
                        width: canvasSize.width || canvasRef.current?.clientWidth || '100%',
                        height: canvasSize.height || canvasRef.current?.clientHeight || '100%',
                      }}
                    />
                    <div className="absolute top-3 left-3 bg-slate-950/85 text-white text-[11px] font-mono px-2 py-0.5 rounded border border-slate-700 flex items-center space-x-1.5 shadow-md z-10">
                      <span>Original Photo</span>
                      {(localParams.brightness ?? 100) !== 100 && (
                        <span className="text-amber-400 font-semibold">({localParams.brightness}%)</span>
                      )}
                    </div>
                  </div>

                  {/* Simulated Print Label (Right Side) */}
                  <div className="absolute top-3 right-3 bg-slate-950/85 text-amber-300 text-[11px] font-mono px-2 py-0.5 rounded border border-slate-700 flex items-center space-x-1.5 shadow-md z-10 pointer-events-none">
                    <span>Simulated Print</span>
                  </div>

                  {/* Split Line & Handle */}
                  <div
                    onMouseDown={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setIsDraggingSplit(true);
                    }}
                    className="absolute top-0 bottom-0 w-0.5 bg-amber-400 cursor-ew-resize flex items-center justify-center shadow-[0_0_12px_rgba(251,191,36,0.6)] z-20"
                    style={{ left: `${splitPos * 100}%` }}
                  >
                    <div className="w-6 h-6 rounded-full bg-amber-400 text-slate-950 shadow-md flex items-center justify-center text-[10px] font-bold select-none cursor-ew-resize hover:scale-110 active:scale-95 transition-transform">
                      ↔
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Realtime 4x Floating Zoom Loupe */}
            {showLoupe && mousePos.visible && (
              <div
                className="absolute pointer-events-none rounded-xl border-2 border-amber-400 bg-slate-950 overflow-hidden shadow-2xl z-30"
                style={{
                  width: '160px',
                  height: '160px',
                  left: Math.min(
                    containerRef.current?.clientWidth - 170 || 0,
                    Math.max(10, mousePos.x - 80)
                  ),
                  top: Math.max(10, mousePos.y - 180),
                }}
              >
                <canvas
                  ref={loupeCanvasRef}
                  width={160}
                  height={160}
                  className="w-full h-full"
                />
                <div className="absolute bottom-1 right-1 bg-slate-900/90 text-amber-400 font-mono text-[9px] px-1 rounded border border-slate-800">
                  4x Non-Circular Blobs
                </div>
              </div>
            )}
          </div>

          {/* Layer Solo & Visibility Controls */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center space-x-2 text-xs text-slate-400">
              <Layers className="w-3.5 h-3.5 text-amber-400" />
              <span className="font-semibold text-slate-300">Screen Layers:</span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {inks.map((ink, idx) => {
                const isActive = activeLayers[idx];
                return (
                  <button
                    key={idx}
                    onClick={() => toggleLayer(idx)}
                    className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border transition-all ${
                      isActive
                        ? 'bg-slate-800 text-slate-100 border-slate-700 shadow-sm'
                        : 'bg-slate-950/60 text-slate-500 border-slate-800/80 opacity-60 line-through'
                    }`}
                  >
                    <span
                      className="w-3 h-3 rounded-full ring-1 ring-white/20 shrink-0"
                      style={{ backgroundColor: ink.hex }}
                    />
                    <span>{ink.name.split(':')[1] || `Screen ${idx + 1}`}</span>
                    {isActive ? (
                      <Eye className="w-3 h-3 text-slate-400 ml-1" />
                    ) : (
                      <EyeOff className="w-3 h-3 text-slate-600 ml-1" />
                    )}
                  </button>
                );
              })}

              {/* Substrate Knockout Toggle */}
              <button
                onClick={() => toggleLayer(inks.length)}
                className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border transition-all ${
                  activeLayers[inks.length]
                    ? 'bg-slate-800 text-slate-100 border-slate-700'
                    : 'bg-slate-950/60 text-slate-500 border-slate-800 opacity-60 line-through'
                }`}
              >
                <span className="w-3 h-3 rounded-full bg-white ring-1 ring-slate-700 shrink-0" />
                <span>Paper Knockout</span>
                {activeLayers[inks.length] ? (
                  <Eye className="w-3 h-3 text-slate-400 ml-1" />
                ) : (
                  <EyeOff className="w-3 h-3 text-slate-600 ml-1" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Live Algorithm Tuning & Diagnostics */}
        <div className="space-y-4">
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5">
              <div className="flex items-center space-x-2">
                <Sliders className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-semibold text-slate-200">Algorithm Tuning</h3>
              </div>
              <div className="flex items-center space-x-1.5 text-[10px] font-mono">
                {isProcessing ? (
                  <span className="text-amber-400 flex items-center space-x-1 animate-pulse">
                    <RefreshCw className="w-3 h-3 animate-spin" />
                    <span>Rendering...</span>
                  </span>
                ) : (
                  <span className="text-emerald-400/90 flex items-center space-x-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                    <span>Live Auto-Update</span>
                  </span>
                )}
              </div>
            </div>

            {/* Pre-Pipeline Photo Brightness */}
            <div className="space-y-1.5 pb-3 border-b border-slate-800/80 bg-slate-950/40 -mx-4 px-4 py-2.5 rounded-lg border-y border-amber-500/10">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-200 font-semibold flex items-center space-x-1.5">
                  <Sun className="w-3.5 h-3.5 text-amber-400" />
                  <span>Photo Brightness (Pre-Pipeline):</span>
                </span>
                <div className="flex items-center space-x-2">
                  {(localParams.brightness ?? 100) !== 100 && (
                    <button
                      type="button"
                      onClick={() => handleParamChange('brightness', 100)}
                      className="text-[10px] text-slate-400 hover:text-amber-400 font-mono transition-colors underline"
                      title="Reset brightness to 100%"
                    >
                      Reset
                    </button>
                  )}
                  <span className="font-mono text-amber-400 font-bold px-1.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 text-[11px]">
                    {localParams.brightness ?? 100}%
                    {(localParams.brightness ?? 100) === 100
                      ? ' (Normal)'
                      : (localParams.brightness ?? 100) > 100
                      ? ` (+${(localParams.brightness ?? 100) - 100}%)`
                      : ` (-${100 - (localParams.brightness ?? 100)}%)`}
                  </span>
                </div>
              </div>
              <input
                type="range"
                min="0"
                max="200"
                step="1"
                value={localParams.brightness ?? 100}
                onChange={(e) =>
                  handleParamChange('brightness', parseInt(e.target.value))
                }
                className="w-full accent-amber-400 bg-slate-800 h-2 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono px-0.5">
                <span>0% (Black)</span>
                <span className="text-amber-400 font-semibold">100% (Original)</span>
                <span>200% (2x)</span>
              </div>
              <p className="text-[11px] text-slate-500 pt-0.5">
                Scales photo exposure <strong className="text-slate-300">before</strong> gamut extraction and plate separation.
              </p>
            </div>

            {/* 0. Dynamic Screen Plates Count (2 to 6 Plates) */}
            <div className="space-y-1.5 pb-3 border-b border-slate-800/80">
              <div className="flex justify-between text-xs">
                <span className="text-slate-300 font-semibold flex items-center space-x-1">
                  <span>Number of Plates:</span>
                </span>
                <span className="font-mono text-amber-400 font-bold px-1.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/20">
                  {localParams.numInks || inks.length || 4} Plates
                </span>
              </div>
              <input
                type="range"
                min="2"
                max="6"
                step="1"
                value={localParams.numInks || inks.length || 4}
                onChange={(e) =>
                  handleParamChange('numInks', parseInt(e.target.value))
                }
                className="w-full accent-amber-400 bg-slate-800 h-2 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono px-0.5">
                <span>2 (Duo)</span>
                <span>3 (Tri)</span>
                <span className="text-amber-400 font-semibold">4 (Std)</span>
                <span>5 (Exp)</span>
                <span>6 (Max)</span>
              </div>
              <p className="text-[11px] text-slate-500 pt-0.5">
                Adjusts physical screens: 2 for duotone, 4 for standard quad, 5-6 for expanded gamut.
              </p>
            </div>

            {/* 1. Color Hotspots & Local Accent Sensitivity */}
            <div className="space-y-1.5 pb-3 border-b border-slate-800/80">
              <div className="flex justify-between text-xs">
                <span className="text-slate-300 font-semibold flex items-center space-x-1">
                  <span>Color Hotspot Sensitivity:</span>
                </span>
                <span className="font-mono text-amber-400 font-bold px-1.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/20">
                  {Math.round((localParams.hotspotSensitivity ?? 0.6) * 100)}%
                </span>
              </div>
              <input
                type="range"
                min="0.0"
                max="1.0"
                step="0.05"
                value={localParams.hotspotSensitivity ?? 0.6}
                onChange={(e) =>
                  handleParamChange('hotspotSensitivity', parseFloat(e.target.value))
                }
                className="w-full accent-amber-400 bg-slate-800 h-2 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono px-0.5">
                <span>0% (Tonal Fidelity)</span>
                <span className="text-amber-400 font-semibold">
                  {(localParams.hotspotSensitivity ?? 0.6) < 0.35
                    ? 'Global Tones'
                    : (localParams.hotspotSensitivity ?? 0.6) <= 0.70
                    ? 'Dual Balanced'
                    : 'Hero Accents'}
                </span>
                <span>100% (Micro-Spots)</span>
              </div>
              <p className="text-[11px] text-slate-500 pt-0.5">
                Controls dual-objective balance: low values prioritize broad gradients and global fidelity; higher values dedicate screens to localized color hotspots (toe beans, lips, eyes).
              </p>
            </div>

            {/* 2. Stipple Grain Scale / Dot Pitch */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-slate-300 font-medium">Gradient Grain Scale:</span>
                <span className="font-mono text-amber-400">{localParams.cellSize.toFixed(1)}x</span>
              </div>
              <input
                type="range"
                min="1.0"
                max="3.5"
                step="0.1"
                value={localParams.cellSize}
                onChange={(e) =>
                  handleParamChange('cellSize', parseFloat(e.target.value))
                }
                className="w-full accent-amber-400 bg-slate-800 h-1.5 rounded-lg appearance-none cursor-pointer"
              />
              <p className="text-[11px] text-slate-500">
                1.0–1.8x = razor-sharp whiskers & yarn loops; 2.5x+ = bolder silkscreen stipple.
              </p>
            </div>

            {/* 2. Organic Droplet Roundness */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-slate-300 font-medium">Organic Droplet Roundness:</span>
                <span className="font-mono text-amber-400">{localParams.blobbiness.toFixed(1)}</span>
              </div>
              <input
                type="range"
                min="0.0"
                max="2.5"
                step="0.1"
                value={localParams.blobbiness}
                onChange={(e) =>
                  handleParamChange('blobbiness', parseFloat(e.target.value))
                }
                className="w-full accent-amber-400 bg-slate-800 h-1.5 rounded-lg appearance-none cursor-pointer"
              />
              <p className="text-[11px] text-slate-500">
                Turns square pixel steps into rounded, fluid organic ink droplets.
              </p>
            </div>

            {/* 3. Macro-Swath Coalescence Threshold */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-slate-300 font-medium">Solid Swath Tol (ΔE):</span>
                <span className="font-mono text-amber-400">
                  {localParams.swathTolDe.toFixed(3)}
                </span>
              </div>
              <input
                type="range"
                min="0.010"
                max="0.050"
                step="0.002"
                value={localParams.swathTolDe}
                onChange={(e) =>
                  handleParamChange('swathTolDe', parseFloat(e.target.value))
                }
                className="w-full accent-amber-400 bg-slate-800 h-1.5 rounded-lg appearance-none cursor-pointer"
              />
              <p className="text-[11px] text-slate-500">
                Coalesces flat background areas into solid ink pools while protecting texture.
              </p>
            </div>

            {/* 4. Min Swath Pixels */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-slate-300 font-medium">Min Swath Size:</span>
                <span className="font-mono text-amber-400">{localParams.minSwathPixels} px</span>
              </div>
              <input
                type="range"
                min="30"
                max="200"
                step="10"
                value={localParams.minSwathPixels}
                onChange={(e) =>
                  handleParamChange('minSwathPixels', parseInt(e.target.value))
                }
                className="w-full accent-amber-400 bg-slate-800 h-1.5 rounded-lg appearance-none cursor-pointer"
              />
              <p className="text-[11px] text-slate-500">
                Prevents micro-islands from forming solid swaths prematurely.
              </p>
            </div>
          </div>

          {/* Quick Explanation Card */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3.5 text-xs text-slate-400 space-y-2">
            <div className="flex items-center space-x-1.5 text-slate-200 font-medium">
              <Info className="w-3.5 h-3.5 text-amber-400" />
              <span>How This Works</span>
            </div>
            <p className="text-[11px] leading-relaxed">
              1. <strong>In the bucket:</strong> Colors mix subtractively. Yellow + Blue physically produces green.
            </p>
            <p className="text-[11px] leading-relaxed">
              2. <strong>On paper:</strong> Blobs sit side-by-side with <strong>0% overlap</strong>. The eye blends them optically.
            </p>
            <p className="text-[11px] leading-relaxed">
              3. <strong>Macro-swaths:</strong> Flat areas merge into continuous solid shapes to eliminate screen grain where halftoning isn't needed.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
