import React, { useState } from 'react';
import { Layers, Info, Maximize2, X, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';

interface ImageComparatorProps {
  originalImage: string; // base64 or URL
  heatmapImage: string;
  overlayImage: string;
  targetLayer?: string;
  prediction?: string;
  probability?: number;
}

export const ImageComparator: React.FC<ImageComparatorProps> = ({
  originalImage,
  heatmapImage,
  overlayImage,
  targetLayer = 'block4.0',
  prediction,
  probability,
}) => {
  const [activeTab, setActiveTab] = useState<'overlay' | 'original' | 'heatmap' | 'split'>('overlay');
  const [splitPosition, setSplitPosition] = useState<number>(50);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [zoomLevel, setZoomLevel] = useState<number>(1.0);

  // Format base64 src
  const formatSrc = (src: string) => (src?.startsWith('data:') ? src : `data:image/png;base64,${src}`);

  const handleZoomIn = () => setZoomLevel((prev) => Math.min(2.5, +(prev + 0.25).toFixed(2)));
  const handleZoomOut = () => setZoomLevel((prev) => Math.max(0.75, +(prev - 0.25).toFixed(2)));
  const handleResetZoom = () => setZoomLevel(1.0);

  const renderImageContent = () => {
    const zoomStyle = {
      transform: `scale(${zoomLevel})`,
      transition: 'transform 0.2s ease-out',
    };

    return (
      <div className="relative aspect-square max-h-[460px] mx-auto bg-slate-950 rounded-2xl overflow-hidden border border-slate-200 flex items-center justify-center">
        <div className="w-full h-full flex items-center justify-center overflow-hidden">
          {activeTab === 'overlay' && (
            <img
              src={formatSrc(overlayImage)}
              alt="Grad-CAM Blended Overlay"
              style={zoomStyle}
              className="w-full h-full object-contain"
            />
          )}

          {activeTab === 'original' && (
            <img
              src={formatSrc(originalImage)}
              alt="Original Chest X-Ray"
              style={zoomStyle}
              className="w-full h-full object-contain"
            />
          )}

          {activeTab === 'heatmap' && (
            <img
              src={formatSrc(heatmapImage)}
              alt="Grad-CAM Heatmap"
              style={zoomStyle}
              className="w-full h-full object-contain"
            />
          )}

          {activeTab === 'split' && (
            <div className="relative w-full h-full select-none overflow-hidden" style={zoomStyle}>
              <img
                src={formatSrc(originalImage)}
                alt="Original"
                className="absolute inset-0 w-full h-full object-contain pointer-events-none"
              />
              <div
                className="absolute inset-0 overflow-hidden"
                style={{ width: `${splitPosition}%` }}
              >
                <img
                  src={formatSrc(overlayImage)}
                  alt="Overlay"
                  className="absolute inset-0 w-full h-full object-contain pointer-events-none max-w-none"
                  style={{ width: '100%', height: '100%' }}
                />
              </div>
              {/* Slider Divider Bar */}
              <div
                className="absolute top-0 bottom-0 w-1 bg-white cursor-ew-resize shadow-md"
                style={{ left: `${splitPosition}%` }}
              >
                <div className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-clinical-blue border-2 border-white flex items-center justify-center text-white text-[10px] font-bold shadow">
                  ↔
                </div>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={splitPosition}
                onChange={(e) => setSplitPosition(Number(e.target.value))}
                className="absolute inset-0 opacity-0 cursor-ew-resize w-full h-full"
              />
            </div>
          )}
        </div>

        {/* Prediction Status Badge */}
        {prediction && (
          <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-sm border border-slate-200 px-3 py-1.5 rounded-xl shadow-xs flex items-center gap-2">
            <span
              className={`w-2 h-2 rounded-full ${
                prediction === 'PNEUMONIA' ? 'bg-rose-500 animate-pulse' : 'bg-emerald-500'
              }`}
            />
            <span className="text-xs font-bold text-slate-900 tracking-wide font-mono">
              {prediction}
            </span>
            {probability !== undefined && (
              <span className="text-[11px] font-mono text-slate-500">
                ({(probability * 100).toFixed(1)}%)
              </span>
            )}
          </div>
        )}

        {/* Viewer Tools Floating Toolbar: Zoom, Reset, Fullscreen */}
        <div className="absolute bottom-3 right-3 flex items-center gap-1.5 bg-white/90 backdrop-blur-sm p-1 rounded-xl shadow-xs border border-slate-200">
          <button
            onClick={handleZoomIn}
            className="p-1.5 hover:bg-slate-100 text-slate-700 rounded-lg transition"
            title="Zoom In"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleZoomOut}
            className="p-1.5 hover:bg-slate-100 text-slate-700 rounded-lg transition"
            title="Zoom Out"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          {zoomLevel !== 1.0 && (
            <button
              onClick={handleResetZoom}
              className="p-1.5 hover:bg-slate-100 text-slate-700 rounded-lg transition"
              title="Reset Zoom (100%)"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          )}
          <div className="w-px h-4 bg-slate-200" />
          <button
            onClick={() => setIsFullscreen(true)}
            className="p-1.5 hover:bg-slate-100 text-slate-700 rounded-lg transition"
            title="Fullscreen Inspection"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
      {/* Header Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-3.5 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-clinical-blue" />
          <h3 className="text-sm font-bold text-slate-900">Grad-CAM Visual Model Evidence</h3>
          <span className="text-[10px] font-mono bg-sky-50 text-clinical-blue border border-sky-200 px-2 py-0.5 rounded font-semibold">
            Layer: {targetLayer}
          </span>
        </div>

        {/* Mode Toggle Pills */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
          <button
            onClick={() => setActiveTab('overlay')}
            className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition ${
              activeTab === 'overlay'
                ? 'bg-white text-clinical-blue shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Overlay
          </button>
          <button
            onClick={() => setActiveTab('original')}
            className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition ${
              activeTab === 'original'
                ? 'bg-white text-clinical-blue shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Original
          </button>
          <button
            onClick={() => setActiveTab('heatmap')}
            className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition ${
              activeTab === 'heatmap'
                ? 'bg-white text-clinical-blue shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Heatmap
          </button>
          <button
            onClick={() => setActiveTab('split')}
            className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition ${
              activeTab === 'split'
                ? 'bg-white text-clinical-blue shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Side-by-Side
          </button>
        </div>
      </div>

      {/* Main Image Area */}
      {renderImageContent()}

      {/* Clinical Explanation & Colormap Legend */}
      <div className="mt-3.5 pt-3 border-t border-slate-100 text-xs text-slate-500 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 max-w-xl">
          <Info className="w-4 h-4 text-clinical-blue shrink-0" />
          <span className="text-[11px] leading-relaxed">
            Visual Explanation: Warm regions indicate higher convolutional activations on layer <code className="font-mono text-slate-700">{targetLayer}</code>. Does not imply clinical lesion localization.
          </span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded bg-red-500" />
            <span className="text-[10px] text-slate-600">High Activation</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded bg-amber-400" />
            <span className="text-[10px] text-slate-600">Moderate</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded bg-blue-600" />
            <span className="text-[10px] text-slate-600">Baseline</span>
          </div>
        </div>
      </div>

      {/* Fullscreen Inspection Modal */}
      {isFullscreen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center p-6">
          <div className="w-full max-w-4xl bg-white rounded-2xl overflow-hidden shadow-2xl p-4 flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-3">
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-slate-900">Visual Explanation Fullscreen Inspection</span>
                <span className="font-mono text-xs text-clinical-blue bg-sky-50 px-2 py-0.5 rounded border border-sky-200">
                  {targetLayer}
                </span>
              </div>
              <button
                onClick={() => setIsFullscreen(false)}
                className="p-1.5 text-slate-500 hover:text-slate-800 bg-slate-100 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="max-h-[75vh] flex items-center justify-center bg-black rounded-xl p-2">
              <img
                src={
                  activeTab === 'original'
                    ? formatSrc(originalImage)
                    : activeTab === 'heatmap'
                    ? formatSrc(heatmapImage)
                    : formatSrc(overlayImage)
                }
                alt="High-resolution radiograph inspection"
                className="max-h-[70vh] object-contain"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
