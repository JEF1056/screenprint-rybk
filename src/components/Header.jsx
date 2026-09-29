import React from 'react';
import { Printer, Download, Layers, Droplets } from 'lucide-react';

export default function Header({
  activeTab,
  setActiveTab,
  onPrintAll,
  onExportAll,
  hasImage,
  inks = [],
}) {
  const tabs = [
    { id: 'studio', label: 'Studio Print', icon: Layers },
    { id: 'films', label: 'Film Positives', icon: Printer },
    { id: 'paint', label: 'Paint Lab', icon: Droplets },
  ];

  return (
    <header className="no-print bg-slate-950/95 border-b border-slate-800/80 sticky top-0 z-50 backdrop-blur-md">
      <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Brand Identity & Active Ink Indicators */}
          <div className="flex items-center space-x-3">
            <div className="flex items-center -space-x-1 p-1 bg-slate-900 rounded-lg border border-slate-800">
              {inks.length > 0 ? (
                inks.map((ink, idx) => (
                  <span
                    key={idx}
                    className="w-3.5 h-3.5 rounded-full ring-1 ring-slate-900"
                    style={{ backgroundColor: ink.hex }}
                    title={ink.name}
                  />
                ))
              ) : (
                <>
                  <span className="w-3.5 h-3.5 rounded-full bg-[#FFDE00] ring-1 ring-slate-900" />
                  <span className="w-3.5 h-3.5 rounded-full bg-[#D62235] ring-1 ring-slate-900" />
                  <span className="w-3.5 h-3.5 rounded-full bg-[#0E48A8] ring-1 ring-slate-900" />
                  <span className="w-3.5 h-3.5 rounded-full bg-[#161616] ring-1 ring-slate-900" />
                </>
              )}
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-base sm:text-lg font-bold tracking-tight text-white">
                  BlobbyPrint
                </span>
                <span className="text-[10px] font-mono font-medium tracking-wide uppercase px-2 py-0.5 bg-amber-500/10 text-amber-300 border border-amber-500/20 rounded-full hidden sm:inline-block">
                  Adaptive Opaque Engine
                </span>
              </div>
            </div>
          </div>

          {/* Desktop Navigation Tabs */}
          <nav className="hidden md:flex items-center space-x-1 bg-slate-900/80 p-1 rounded-xl border border-slate-800">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-slate-800 text-amber-400 font-semibold shadow-sm border border-slate-700/70'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-amber-400' : 'text-slate-400'}`} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Action Buttons */}
          <div className="flex items-center space-x-2">
            <button
              onClick={onPrintAll}
              disabled={!hasImage}
              className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                hasImage
                  ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md shadow-amber-500/10 active:scale-[0.98]'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed'
              }`}
              title="Print all transparency film sheets with registration marks"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Films</span>
            </button>

            <button
              onClick={onExportAll}
              disabled={!hasImage}
              className={`hidden sm:flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                hasImage
                  ? 'border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200 active:scale-[0.98]'
                  : 'border-slate-800 bg-slate-900 text-slate-600 cursor-not-allowed'
              }`}
              title="Download 1-bit film positive stencils as PNG"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export</span>
            </button>
          </div>
        </div>

        {/* Mobile Navigation Tabs */}
        <nav className="flex md:hidden space-x-1 border-t border-slate-800/60 overflow-x-auto py-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-1 px-3 py-1 rounded-lg text-xs whitespace-nowrap transition-colors ${
                  isActive
                    ? 'bg-slate-800 text-amber-400 font-medium'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
