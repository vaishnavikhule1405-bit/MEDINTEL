import React, { useState } from 'react';
import { SafetyDisclaimer } from '../components/SafetyDisclaimer';
import { Badge } from '../components/Badge';

export const ModelInfoView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'clinical' | 'imaging' | 'nlp' | 'fusion'>('clinical');

  return (
    <div className="space-y-6 animate-fade-in">
      <SafetyDisclaimer />
      
      <div className="flex items-center gap-3">
        <h1 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
          Model Performance
        </h1>
        <span className="text-sm text-zinc-500 dark:text-zinc-400">Research benchmark results across all AI modules</span>
      </div>

      <div className="flex gap-2 border-b border-zinc-200 dark:border-zinc-800 pb-2">
        {(['clinical', 'imaging', 'nlp', 'fusion'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors duration-150 capitalize ${
              activeTab === tab
                ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === 'clinical' && (
        <div className="space-y-6">
          <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">Clinical Symptom Models</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-zinc-200 dark:border-zinc-800">
                  <tr>
                    <th className="py-3 text-xs font-medium tracking-widest uppercase text-zinc-400 dark:text-zinc-600">Model</th>
                    <th className="py-3 text-xs font-medium tracking-widest uppercase text-zinc-400 dark:text-zinc-600">Accuracy</th>
                    <th className="py-3 text-xs font-medium tracking-widest uppercase text-zinc-400 dark:text-zinc-600">Macro-F1</th>
                    <th className="py-3 text-xs font-medium tracking-widest uppercase text-zinc-400 dark:text-zinc-600">Weighted-F1</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                  <tr>
                    <td className="py-3 text-zinc-900 dark:text-zinc-100">XGBoost</td>
                    <td className="py-3 text-zinc-600 dark:text-zinc-400">67.57%</td>
                    <td className="py-3 text-zinc-600 dark:text-zinc-400">38.70%</td>
                    <td className="py-3 text-zinc-600 dark:text-zinc-400">65.12%</td>
                  </tr>
                  <tr>
                    <td className="py-3 text-zinc-900 dark:text-zinc-100">Random Forest</td>
                    <td className="py-3 text-zinc-600 dark:text-zinc-400">40.23%</td>
                    <td className="py-3 text-zinc-600 dark:text-zinc-400">20.75%</td>
                    <td className="py-3 text-zinc-600 dark:text-zinc-400">-</td>
                  </tr>
                  <tr>
                    <td className="py-3 text-zinc-900 dark:text-zinc-100">Logistic Regression</td>
                    <td className="py-3 text-zinc-600 dark:text-zinc-400">33.12%</td>
                    <td className="py-3 text-zinc-600 dark:text-zinc-400">26.12%</td>
                    <td className="py-3 text-zinc-600 dark:text-zinc-400">-</td>
                  </tr>
                </tbody>
              </table>
            </div>
            
            <div className="mt-8">
              <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 mb-4">Per-Class F1 Score Examples</h3>
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-32 text-sm text-zinc-600 dark:text-zinc-400">Pneumonia</div>
                  <div className="flex-1 bg-zinc-100 dark:bg-zinc-800 h-4 rounded-full overflow-hidden">
                    <div className="bg-emerald-500 h-full" style={{ width: '85%' }}></div>
                  </div>
                  <div className="text-sm font-medium text-zinc-900 dark:text-zinc-100">0.85</div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-32 text-sm text-zinc-600 dark:text-zinc-400">Bronchitis</div>
                  <div className="flex-1 bg-zinc-100 dark:bg-zinc-800 h-4 rounded-full overflow-hidden">
                    <div className="bg-emerald-500 h-full" style={{ width: '72%' }}></div>
                  </div>
                  <div className="text-sm font-medium text-zinc-900 dark:text-zinc-100">0.72</div>
                </div>
              </div>
              <div className="mt-4 text-xs text-zinc-500 dark:text-zinc-500">
                Trained on MultiSymptoms dataset (174 features, 37 classes)
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'imaging' && (
        <div className="space-y-6">
          <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">Chest Radiograph Models</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-zinc-200 dark:border-zinc-800">
                  <tr>
                    <th className="py-3 text-xs font-medium tracking-widest uppercase text-zinc-400 dark:text-zinc-600">Model</th>
                    <th className="py-3 text-xs font-medium tracking-widest uppercase text-zinc-400 dark:text-zinc-600">Accuracy</th>
                    <th className="py-3 text-xs font-medium tracking-widest uppercase text-zinc-400 dark:text-zinc-600">ROC-AUC</th>
                    <th className="py-3 text-xs font-medium tracking-widest uppercase text-zinc-400 dark:text-zinc-600">Macro-F1</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                  <tr>
                    <td className="py-3 text-zinc-900 dark:text-zinc-100">Custom CNN</td>
                    <td className="py-3 text-zinc-600 dark:text-zinc-400">84.46%</td>
                    <td className="py-3 text-zinc-600 dark:text-zinc-400">93.25%</td>
                    <td className="py-3 text-zinc-600 dark:text-zinc-400">81.62%</td>
                  </tr>
                  <tr>
                    <td className="py-3 text-zinc-900 dark:text-zinc-100">DenseNet121</td>
                    <td className="py-3 text-zinc-600 dark:text-zinc-400">82.53%</td>
                    <td className="py-3 text-zinc-600 dark:text-zinc-400">92.65%</td>
                    <td className="py-3 text-zinc-600 dark:text-zinc-400">-</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="mt-6 space-y-2">
              <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Architecture Details</h4>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">Custom CNN with 4 blocks + AdaptiveAvgPool2d targeting block4.0 (256 channels) for Grad-CAM. Input resolution 224x224 with ImageNet normalization.</p>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'nlp' && (
        <div className="space-y-6">
          <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">Medical Text Intelligence</h3>
              <Badge variant="development" label="In Development" />
            </div>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
              BioBERT NER + S-PubMedBERT models are planned to extract up to 11 medical entity categories from free-text clinical notes, processing context modifiers such as PRESENT, NEGATED, UNCERTAIN, and HISTORICAL.
            </p>
          </div>
        </div>
      )}

      {activeTab === 'fusion' && (
        <div className="space-y-6">
          <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-sm">
            <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 mb-4">Late Evidence Fusion Engine</h3>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed mb-6">
              Dynamic Heterogeneous Synthesis using nominal weights (Clinical: 0.40, Imaging: 0.40, NLP: 0.20). Dynamically renormalizes remaining weights when modalities are missing.
            </p>
            <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-800">
              <div className="text-xs font-medium tracking-widest uppercase text-zinc-400 dark:text-zinc-600 mb-1">Validation Benchmark</div>
              <div className="text-sm font-medium text-zinc-900 dark:text-zinc-100">500 Synthetic Evaluation Profiles generated for testing.</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
