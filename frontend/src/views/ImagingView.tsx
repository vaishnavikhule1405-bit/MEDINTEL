import React, { useState, useRef } from 'react';
import {
  Upload,
  RefreshCw,
  FileCheck,
} from 'lucide-react';
import { imagingApi } from '../api/client';
import { SafetyDisclaimer } from '../components/SafetyDisclaimer';
import { ImageComparator } from '../components/ImageComparator';
import { GaugeChart } from '../components/GaugeChart';
import { ImagingPredictionResponse } from '../types';
import { Badge } from '../components/Badge';

export const ImagingView: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ImagingPredictionResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setFile(file);
    }
  };

  const setFile = (file: File) => {
    setSelectedFile(file);
    setError(null);
    setResult(null);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const loadSample = async (type: 'normal' | 'pneumonia') => {
    try {
      setLoading(true);
      setError(null);
      setResult(null);
      const res = await fetch(`/api/imaging/sample/${type}`);
      if (!res.ok) throw new Error(`Failed to load sample radiograph: ${res.statusText}`);
      const blob = await res.blob();
      const filename = type === 'normal' ? 'sample_normal_xray.jpeg' : 'sample_pneumonia_xray.jpeg';
      const file = new File([blob], filename, { type: 'image/jpeg' });
      setSelectedFile(file);

      // Execute Custom CNN inference
      const analysis = await imagingApi.predict(file);
      setResult(analysis);
    } catch (err: any) {
      setError(err.message || 'Failed to load sample radiograph');
    } finally {
      setLoading(false);
    }
  };

  const handlePredict = async () => {
    if (!selectedFile) {
      setError('Please select or upload a chest radiograph image.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const res = await imagingApi.predict(selectedFile);
      setResult(res);
    } catch (err: any) {
      setError(err.message || 'Chest radiograph classification failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <SafetyDisclaimer />

      {/* Page Header */}
      <div>
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
            Chest X-Ray Analysis
          </h1>
          <Badge variant="operational" />
        </div>
        <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed mt-1">
          Custom CNN binary classifier with Grad-CAM visual evidence
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-xl border border-rose-200 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/40 text-sm text-rose-700 dark:text-rose-400">
          {error}
        </div>
      )}

      {/* Workspace */}
      {!result ? (
        <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 space-y-6">
          {!selectedFile ? (
            <>
              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onClick={() => fileInputRef.current?.click()}
                className="min-h-48 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl flex flex-col items-center justify-center p-6 hover:border-emerald-400 transition-colors cursor-pointer group"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".jpg,.jpeg,.png"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <Upload className="w-8 h-8 text-zinc-400 group-hover:text-emerald-500 mb-3" />
                <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">Drop chest X-ray here</p>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">or click to browse</p>
              </div>

              <div className="flex items-center justify-center gap-4">
                <button
                  onClick={() => loadSample('normal')}
                  disabled={loading}
                  className="px-4 py-2 rounded-md border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-sm font-medium transition-colors duration-150"
                >
                  Load Normal Sample
                </button>
                <button
                  onClick={() => loadSample('pneumonia')}
                  disabled={loading}
                  className="px-4 py-2 rounded-md border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-sm font-medium transition-colors duration-150"
                >
                  Load Pneumonia Sample
                </button>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center space-y-4">
              <div className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
                <FileCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                <span>{selectedFile.name}</span>
                <span className="text-zinc-400 dark:text-zinc-500">
                  ({(selectedFile.size / 1024).toFixed(0)} KB)
                </span>
              </div>
              <button
                onClick={handlePredict}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium transition-colors duration-150"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  'Analyze Radiograph'
                )}
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            {/* Left: Original X-Ray & Viewer */}
            <div className="lg:col-span-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 flex flex-col items-center">
              <img
                src={`data:image/jpeg;base64,${result.visual_evidence?.original_base64}`}
                alt="Original X-Ray"
                className="max-h-80 object-contain rounded-md mb-6"
              />
              <div className="w-full">
                <ImageComparator
                  originalImage={result.visual_evidence!.original_base64}
                  heatmapImage={result.visual_evidence!.heatmap_base64}
                  overlayImage={result.visual_evidence!.overlay_base64}
                  targetLayer={result.visual_evidence!.target_layer}
                  prediction={result.predicted_class}
                  probability={result.model_confidence}
                />
              </div>
            </div>

            {/* Right: AI Analysis */}
            <div className="lg:col-span-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 space-y-6">
              <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">AI Analysis</h2>

              <div
                className={`px-4 py-3 rounded-md border text-center ${
                  result.predicted_class === 'PNEUMONIA'
                    ? 'bg-rose-50 border-rose-200 text-rose-700 dark:bg-rose-950/40 dark:border-rose-800 dark:text-rose-400'
                    : 'bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-400'
                }`}
              >
                <div className="text-xl font-bold tracking-tight">
                  {result.predicted_class === 'PNEUMONIA' ? 'PNEUMONIA' : 'NORMAL'}
                </div>
              </div>

              <div className="flex justify-center my-6">
                <GaugeChart value={result.model_confidence} size={140} title="Confidence" />
              </div>

              <div className="space-y-4">
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-600 dark:text-zinc-400">Normal</span>
                    <span className="font-medium text-zinc-900 dark:text-zinc-100">
                      {((result.normal_probability ?? 0) * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="w-full bg-zinc-100 dark:bg-zinc-800 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-emerald-500 h-full transition-all duration-300"
                      style={{ width: `${(result.normal_probability ?? 0) * 100}%` }}
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-600 dark:text-zinc-400">Pneumonia</span>
                    <span className="font-medium text-zinc-900 dark:text-zinc-100">
                      {((result.pneumonia_probability ?? 0) * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="w-full bg-zinc-100 dark:bg-zinc-800 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-rose-500 h-full transition-all duration-300"
                      style={{ width: `${(result.pneumonia_probability ?? 0) * 100}%` }}
                    />
                  </div>
                </div>
              </div>

              <div className="text-xs text-zinc-500 dark:text-zinc-500 text-center border-t border-zinc-200 dark:border-zinc-800 pt-4 mt-6">
                Custom CNN &middot; block4.0 Grad-CAM &middot; 84.46% accuracy
              </div>

              <button
                onClick={() => {
                  setResult(null);
                  setSelectedFile(null);
                }}
                className="w-full px-4 py-2 rounded-md border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-sm font-medium transition-colors duration-150 mt-4"
              >
                Reset
              </button>
            </div>
          </div>

          {/* Visual Model Evidence Section */}
          <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 space-y-6">
            <div className="text-xs font-medium tracking-widest uppercase text-zinc-400 dark:text-zinc-600">
              VISUAL MODEL EVIDENCE
            </div>
            
            <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
              Highlighted regions indicate areas that contributed most to the model prediction
            </p>

            <ImageComparator
              originalImage={result.visual_evidence!.original_base64}
              heatmapImage={result.visual_evidence!.heatmap_base64}
              overlayImage={result.visual_evidence!.overlay_base64}
              targetLayer={result.visual_evidence!.target_layer}
              prediction={result.predicted_class}
              probability={result.model_confidence}
            />

            <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400 text-xs font-medium rounded-md mt-4">
              Disclaimer: Heatmaps are generated from model activations and should not replace clinical judgement.
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
