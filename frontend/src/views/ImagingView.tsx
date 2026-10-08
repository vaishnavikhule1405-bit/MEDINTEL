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

  const workflowSteps = [
    {
      title: '1. Upload a chest radiograph',
      description: 'Use a frontal chest X-ray in PNG or JPEG format.',
    },
    {
      title: '2. Run the model',
      description: 'The Custom CNN assigns a Normal vs Pneumonia probability score.',
    },
    {
      title: '3. Review the evidence',
      description: 'Grad-CAM highlights the image regions influencing the result.',
    },
  ];

  const predictionSummary = result
    ? result.predicted_class === 'PNEUMONIA'
      ? 'Pneumonia likely'
      : 'Normal pattern likely'
    : null;

  const confidencePercent = result ? Math.round((result.model_confidence ?? 0) * 100) : 0;

  return (
    <div className="space-y-6 animate-fade-in">
      <SafetyDisclaimer />

      <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-gradient-to-br from-white via-emerald-50/40 to-white dark:from-zinc-900 dark:via-emerald-950/20 dark:to-zinc-900 p-5 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
                Chest X-Ray Analysis
              </h1>
              <Badge variant="operational" />
            </div>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed max-w-2xl">
              This module uses a trained imaging model to screen for pneumonia patterns and highlights the lung regions
              most associated with the prediction.
            </p>
          </div>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-3">
          {workflowSteps.map((step) => (
            <div key={step.title} className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-950/50 p-3">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-400 dark:text-zinc-500">{step.title}</p>
              <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">{step.description}</p>
            </div>
          ))}
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl border border-rose-200 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/40 text-sm text-rose-700 dark:text-rose-400">
          {error}
        </div>
      )}

      {!result ? (
        <div className="grid gap-6 xl:grid-cols-[1.35fr_0.65fr]">
          <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-sm">
            {!selectedFile ? (
              <>
                <div
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onClick={() => fileInputRef.current?.click()}
                  className="min-h-60 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl flex flex-col items-center justify-center p-8 hover:border-emerald-500/80 dark:hover:border-emerald-500/80 hover:bg-emerald-50/20 dark:hover:bg-emerald-950/20 transition-all duration-200 cursor-pointer group"
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".jpg,.jpeg,.png"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform mb-3 shadow-sm">
                    <Upload className="w-6 h-6" />
                  </div>
                  <p className="text-base font-bold text-zinc-900 dark:text-zinc-100 mb-1">Drop a chest X-ray image here</p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">PNG, JPG, or JPEG • research demo only</p>
                </div>

                <div className="mt-5 grid gap-3 md:grid-cols-2">
                  <button
                    onClick={() => loadSample('normal')}
                    disabled={loading}
                    className="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-left p-4 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-all duration-150"
                  >
                    <span className="block text-sm font-semibold text-zinc-900 dark:text-zinc-100">Load normal sample</span>
                    <span className="mt-1 block text-xs text-zinc-500 dark:text-zinc-400">Example without pneumonia findings</span>
                  </button>
                  <button
                    onClick={() => loadSample('pneumonia')}
                    disabled={loading}
                    className="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-left p-4 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-all duration-150"
                  >
                    <span className="block text-sm font-semibold text-zinc-900 dark:text-zinc-100">Load pneumonia sample</span>
                    <span className="mt-1 block text-xs text-zinc-500 dark:text-zinc-400">Example with notable lung opacity</span>
                  </button>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center space-y-4 py-6">
                <div className="flex items-center gap-2.5 text-sm text-zinc-700 dark:text-zinc-300 bg-zinc-50 dark:bg-zinc-800/80 px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700">
                  <FileCheck className="w-5 h-5 text-emerald-500" />
                  <span className="font-semibold">{selectedFile.name}</span>
                  <span className="text-xs text-zinc-400 dark:text-zinc-500 font-mono">
                    ({(selectedFile.size / 1024).toFixed(0)} KB)
                  </span>
                </div>
                <button
                  onClick={handlePredict}
                  disabled={loading}
                  className="flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold transition-all shadow-md shadow-emerald-500/20 active:scale-[0.99]"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Analyzing radiograph...
                    </>
                  ) : (
                    'Analyze radiograph'
                  )}
                </button>
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 shadow-sm">
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-400 dark:text-zinc-500 mb-4">
              What this page does
            </div>
            <div className="space-y-3 text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
              <p>
                This tool is designed for a simple purpose: classify a chest X-ray as likely normal or pneumonia-like,
                then show the regions that most influenced the prediction.
              </p>
              <p>
                It does not diagnose the patient. It produces a model-generated probability estimate based on training data,
                and it is meant to support research or educational review.
              </p>
            </div>
            <div className="mt-5 rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/40 p-3 text-xs text-amber-800 dark:text-amber-300">
              The result should be interpreted alongside clinical context, not as an autonomous medical decision.
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 xl:grid-cols-[1.4fr_0.6fr] gap-6">
            <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 shadow-sm">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-400 dark:text-zinc-500">
                    Visual evidence
                  </p>
                  <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">Comparison of original and model-highlighted image</p>
                </div>
                <div className="rounded-full border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-2.5 py-1 text-[10px] font-semibold uppercase text-zinc-500 dark:text-zinc-400">
                  Layer {result.visual_evidence!.target_layer}
                </div>
              </div>

              <ImageComparator
                originalImage={result.visual_evidence!.original_base64}
                heatmapImage={result.visual_evidence!.heatmap_base64}
                overlayImage={result.visual_evidence!.overlay_base64}
                targetLayer={result.visual_evidence!.target_layer}
                prediction={result.predicted_class}
                probability={result.model_confidence}
              />
            </div>

            <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 space-y-5 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-400 dark:text-zinc-500">
                    Model output
                  </p>
                  <h2 className="mt-1 text-xl font-bold text-zinc-900 dark:text-zinc-100">{predictionSummary}</h2>
                </div>
                <div
                  className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${
                    result.predicted_class === 'PNEUMONIA'
                      ? 'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-400'
                      : 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400'
                  }`}
                >
                  {result.predicted_class}
                </div>
              </div>

              <div className="flex justify-center">
                <GaugeChart value={result.model_confidence} size={150} title="Confidence" />
              </div>

              <div className="space-y-4">
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-600 dark:text-zinc-400">Normal</span>
                    <span className="font-medium text-zinc-900 dark:text-zinc-100">
                      {((result.normal_probability ?? 0) * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="w-full bg-zinc-100 dark:bg-zinc-800 h-2.5 rounded-full overflow-hidden">
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
                  <div className="w-full bg-zinc-100 dark:bg-zinc-800 h-2.5 rounded-full overflow-hidden">
                    <div
                      className="bg-rose-500 h-full transition-all duration-300"
                      style={{ width: `${(result.pneumonia_probability ?? 0) * 100}%` }}
                    />
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/40 p-3">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-400 dark:text-zinc-500">
                  Interpretation
                </p>
                <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                  The model is most confident when one class is clearly dominant. A score near {confidencePercent}% does not
                  confirm a diagnosis; it reflects how strongly the learned image patterns match the trained class.
                </p>
              </div>

              <button
                onClick={() => {
                  setResult(null);
                  setSelectedFile(null);
                }}
                className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-sm font-medium transition-colors duration-150"
              >
                Reset and analyze another image
              </button>
            </div>
          </div>

          <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-sm">
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-400 dark:text-zinc-500">
              Model rationale
            </div>
            <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
              The Grad-CAM overlay highlights lung regions that contributed most strongly to the model&apos;s result. Dark red
              and yellow areas generally indicate stronger activation, but they are not the same as a clinician&apos;s visual
              interpretation.
            </p>

            <div className="mt-5 rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/40 p-3 text-xs text-amber-800 dark:text-amber-300 leading-relaxed">
              {result.disclaimer || 'Heatmaps are generated from model activations and should not replace clinical judgement.'}
            </div>

            <div className="mt-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/40 p-3 text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
              {result.safety_note || 'This is a research prototype, not an autonomous diagnostic system.'}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
