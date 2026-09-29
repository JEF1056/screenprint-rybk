import React, { useState, useEffect, useCallback, useRef } from 'react';
import Header from './components/Header';
import ImageUploader from './components/ImageUploader';
import BlobbyPrintStudio from './components/BlobbyPrintStudio';
import FilmPositivesView from './components/FilmPositivesView';
import PaintLabView from './components/PaintLabView';
import {
  DEFAULT_STOCK_PAINTS,
  generateAdaptiveBlobbySeparation,
  applyBrightnessToImageData,
} from './utils/blobbyEngine';
import { createSampleImage } from './utils/sampleImages';

export default function App() {
  const [activeTab, setActiveTab] = useState('studio'); // 'studio', 'films', 'paint'
  const [originalImage, setOriginalImage] = useState(null);
  const [adjustedImage, setAdjustedImage] = useState(null);
  const [imageName, setImageName] = useState('Sunset Mountain (Sample)');
  const [separationData, setSeparatedData] = useState(null);
  const [stockPaints, setStockPaints] = useState(DEFAULT_STOCK_PAINTS);
  const [isProcessing, setIsProcessing] = useState(false);

  // Core algorithm parameters
  const [params, setParams] = useState({
    brightness: 100,          // Pre-pipeline original photo brightness (0% to 200%, 100 = default)
    numInks: 4,               // Number of physical screen plates (2 to 6)
    hotspotSensitivity: 0.6,   // Dual-objective balance between general picture accuracy and color hotspots
    cellSize: 1.8,            // Stipple grain scale (1.5–1.8 = razor sharp whiskers & threads)
    blobbiness: 1.0,          // Organic micro-edge bleed
    swathTolDe: 0.025,        // Delta E OKLab threshold for solid macro-swaths
    minSwathPixels: 80,       // Min contiguous pixels for solid swaths
  });

  const offscreenCanvasRef = useRef(null);

  // Execute the Adaptive Blobby Opaque Screenprint Separation Pipeline
  const processImage = useCallback(
    (dataUrl, currentStockPaints = stockPaints, currentParams = params) => {
      setIsProcessing(true);
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        // Optimal working resolution: up to 1200px max dimension for smooth interactive calculation
        let width = img.naturalWidth || img.width;
        let height = img.naturalHeight || img.height;
        const maxDim = 1000;

        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        if (!offscreenCanvasRef.current) {
          offscreenCanvasRef.current = document.createElement('canvas');
        }
        const canvas = offscreenCanvasRef.current;
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        ctx.drawImage(img, 0, 0, width, height);

        const imgData = ctx.getImageData(0, 0, width, height);

        // Pre-pipeline photo brightness adjustment
        const brightness = currentParams.brightness !== undefined ? currentParams.brightness : 100;
        if (brightness !== 100) {
          applyBrightnessToImageData(imgData, brightness);
          ctx.putImageData(imgData, 0, 0);
        }

        const adjustedUrl = canvas.toDataURL();
        setAdjustedImage(adjustedUrl);

        // Run full adaptive blobby separation engine on pre-adjusted imageData
        const result = generateAdaptiveBlobbySeparation(imgData, {
          numInks: currentParams.numInks || 4,
          hotspotSensitivity: currentParams.hotspotSensitivity !== undefined ? currentParams.hotspotSensitivity : 0.6,
          cellSize: currentParams.cellSize,
          blobbiness: currentParams.blobbiness,
          swathTolDe: currentParams.swathTolDe,
          minSwathPixels: currentParams.minSwathPixels,
          stockPaints: currentStockPaints,
        });

        setSeparatedData(result);
        setIsProcessing(false);
      };
      img.src = dataUrl;
    },
    [stockPaints, params]
  );

  // Initial load with rich sample image
  useEffect(() => {
    const initialSample = createSampleImage('landscape');
    setOriginalImage(initialSample);
    processImage(initialSample, DEFAULT_STOCK_PAINTS, params);
  }, []);

  const handleImageLoaded = (dataUrl, name) => {
    setOriginalImage(dataUrl);
    setImageName(name);
    processImage(dataUrl, stockPaints, params);
  };

  const handleUpdateParams = (newParams) => {
    setParams(newParams);
    if (originalImage) {
      processImage(originalImage, stockPaints, newParams);
    }
  };

  const handleUpdateStockPaints = (newStockPaints) => {
    setStockPaints(newStockPaints);
    if (originalImage) {
      processImage(originalImage, newStockPaints, params);
    }
  };

  const handleResetStockPaints = () => {
    setStockPaints(DEFAULT_STOCK_PAINTS);
    if (originalImage) {
      processImage(originalImage, DEFAULT_STOCK_PAINTS, params);
    }
  };

  const handlePrintAll = () => {
    setActiveTab('films');
    setTimeout(() => {
      window.print();
    }, 200);
  };

  const handleExportAll = () => {
    setActiveTab('films');
  };

  return (
    <div className="min-h-[100dvh] bg-slate-950 text-slate-100 flex flex-col antialiased">
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onPrintAll={handlePrintAll}
        onExportAll={handleExportAll}
        hasImage={!!separationData}
        inks={separationData?.inks}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-5">
        <ImageUploader
          onImageLoaded={handleImageLoaded}
          currentImageName={imageName}
          isProcessing={isProcessing}
          brightness={params.brightness}
          onBrightnessChange={(newBrightness) =>
            handleUpdateParams({ ...params, brightness: newBrightness })
          }
        />

        {separationData && (
          <div>
            {activeTab === 'studio' && (
              <BlobbyPrintStudio
                originalImage={originalImage}
                adjustedImage={adjustedImage}
                separationData={separationData}
                onUpdateParams={handleUpdateParams}
                params={params}
                isProcessing={isProcessing}
              />
            )}

            {activeTab === 'films' && (
              <FilmPositivesView separationData={separationData} />
            )}

            {activeTab === 'paint' && (
              <PaintLabView
                separationData={separationData}
                stockPaints={stockPaints}
                onUpdateStockPaints={handleUpdateStockPaints}
                onResetStockPaints={handleResetStockPaints}
              />
            )}
          </div>
        )}
      </main>

      <footer className="no-print border-t border-slate-900 bg-slate-950 py-5 text-xs text-slate-500">
        <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-slate-400">
            BlobbyPrint Studio — Adaptive Opaque Screenprint Engine (0% Overprint • Kubelka-Munk Formulation • Organic Non-Circular Blobs)
          </p>
          <div className="flex items-center space-x-3 text-slate-500 font-mono text-[11px]">
            <span>OKLab Gamut Enclosure</span>
            <span>•</span>
            <span>Harmonic Noise Warping</span>
            <span>•</span>
            <span>Serpentine Error Diffusion</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
