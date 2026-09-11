import React, { useState, useEffect } from 'react';
import { explainabilityApi } from '../api/client';
import { SafetyDisclaimer } from '../components/SafetyDisclaimer';
import { Badge } from '../components/Badge';

export const ExplainabilityView: React.FC = () => {
  const [globalShap, setGlobalShap] = useState<any>(null);
  const [patientShap, setPatientShap] = useState<any>(null);
  const [gradcamData, setGradcamData] = useState<any>(null);
  const [nlpData, setNlpData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showAllGlobal, setShowAllGlobal] = useState(false);

  useEffect(() => {
    async function loadXaiData() {
      try {
        setLoading(true);
        const [gShap, pShap, gCam, nlp] = await Promise.all([
          explainabilityApi.getClinicalGlobal().catch(() => null),
          explainabilityApi.getClinicalExample().catch(() => null),
          explainabilityApi.getImagingSamples().catch(() => null),
          explainabilityApi.getNLPExamples(5).catch(() => null),
        ]);
        if (gShap) setGlobalShap(gShap);
        if (pShap) setPatientShap(pShap);
        if (gCam) setGradcamData(gCam);
        if (nlp) setNlpData(nlp);
      } catch (err) {
        console.error('Failed to load XAI data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadXaiData();
  }, []);

  const topGlobalFeatures = globalShap?.top_features || [];
  const maxGlobalShap = topGlobalFeatures.length > 0 ? topGlobalFeatures[0].mean_abs_shap : 1;
  const displayGlobalFeatures = showAllGlobal ? topGlobalFeatures : topGlobalFeatures.slice(0, 20);

  return (
    <div className="space-y-8 animate-fade-in">
      <SafetyDisclaimer />

      {/* Page header */}
      <div>
        <div className="text-xs font-medium tracking-widest uppercase text-zinc-400 dark:text-zinc-600 mb-2">
          Explainability
        </div>
        <h1 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
          XAI Studio
        </h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed mt-1">
          SHAP clinical feature attribution and Grad-CAM visual model evidence
        </p>
      </div>

      {loading ? (
        <div className="text-sm text-zinc-500 dark:text-zinc-400 text-center py-12">
          Loading explainability data...
        </div>
      ) : (
        <>
          {/* Section 1: Clinical SHAP — Global */}
          <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 space-y-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="text-xs font-medium tracking-widest uppercase text-zinc-400 dark:text-zinc-600 mb-1">
                  GLOBAL SHAP IMPORTANCE
                </div>
                <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                  Mean absolute SHAP values across 174 symptom features
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {displayGlobalFeatures.map((feature: any, idx: number) => (
                <div key={idx} className="flex items-center text-sm">
                  <div className="w-48 truncate text-zinc-900 dark:text-zinc-100 pr-4">
                    {feature.symptom_name}
                  </div>
                  <div className="flex-1 h-2 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-600 transition-all duration-300"
                      style={{ width: `${(feature.mean_abs_shap / maxGlobalShap) * 100}%` }}
                    />
                  </div>
                  <div className="w-24 text-right font-medium text-zinc-900 dark:text-zinc-100 pl-4">
                    {feature.mean_abs_shap.toFixed(4)}
                  </div>
                </div>
              ))}
            </div>
            {topGlobalFeatures.length > 20 && (
              <button
                onClick={() => setShowAllGlobal(!showAllGlobal)}
                className="px-4 py-2 rounded-md border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-sm font-medium transition-colors duration-150 mt-4"
              >
                {showAllGlobal ? 'Show Top 20' : 'Show All Features'}
              </button>
            )}
          </div>

          {/* Section 2: Clinical SHAP — Patient Level */}
          <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 space-y-6">
            <div className="text-xs font-medium tracking-widest uppercase text-zinc-400 dark:text-zinc-600 mb-4">
              PATIENT-LEVEL ATTRIBUTION
            </div>
            
            <div className="space-y-3">
              {patientShap?.top_contributions?.map((item: any, idx: number) => {
                const isPositive = item.shap_value >= 0;
                const valueText = item.symptom_value === 1 ? 'Present' : 'Absent';
                return (
                  <div key={idx} className="flex items-center bg-zinc-50 dark:bg-zinc-900 p-3 rounded-lg border border-zinc-200 dark:border-zinc-800">
                    <div className="flex-1 flex flex-col sm:flex-row sm:items-center gap-2">
                      <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100 w-48 truncate">
                        {item.symptom_name}
                      </span>
                      <span className="text-xs font-medium px-2 py-0.5 rounded-md bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 w-16 text-center">
                        {valueText}
                      </span>
                    </div>
                    
                    <div className="flex items-center flex-1 mx-4">
                       <div className="w-full flex justify-center">
                          {isPositive ? (
                            <div className="w-1/2 flex justify-start items-center">
                               <div className="h-2 bg-emerald-500 rounded-r-full" style={{ width: `${Math.min(Math.abs(item.shap_value) * 50, 100)}%` }} />
                            </div>
                          ) : (
                            <div className="w-1/2 flex justify-end items-center">
                               <div className="h-2 bg-rose-500 rounded-l-full" style={{ width: `${Math.min(Math.abs(item.shap_value) * 50, 100)}%` }} />
                            </div>
                          )}
                       </div>
                    </div>

                    <div className={`w-24 text-right text-sm font-medium ${isPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                      {isPositive ? '+' : ''}{item.shap_value.toFixed(4)}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section 3: Imaging — Grad-CAM */}
          <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 space-y-6">
            <div className="text-xs font-medium tracking-widest uppercase text-zinc-400 dark:text-zinc-600 mb-4">
              GRAD-CAM VISUAL EVIDENCE
            </div>
            
            {gradcamData?.sample_artifacts && gradcamData.sample_artifacts.length > 0 ? (
              <div className="space-y-6">
                {gradcamData.sample_artifacts.slice(0, 1).map((artifact: any, i: number) => (
                  <div key={i} className="flex flex-col items-center">
                    <div className="grid grid-cols-3 gap-4 w-full">
                      <div className="flex flex-col items-center">
                        <img src={`data:image/jpeg;base64,${artifact.original_base64}`} alt="Original" className="rounded-md border border-zinc-200 dark:border-zinc-800 w-full object-contain" />
                        <span className="text-xs text-zinc-500 dark:text-zinc-400 mt-2">Original</span>
                      </div>
                      <div className="flex flex-col items-center">
                        <img src={`data:image/jpeg;base64,${artifact.heatmap_base64}`} alt="Heatmap" className="rounded-md border border-zinc-200 dark:border-zinc-800 w-full object-contain" />
                        <span className="text-xs text-zinc-500 dark:text-zinc-400 mt-2">Heatmap</span>
                      </div>
                      <div className="flex flex-col items-center">
                        <img src={`data:image/jpeg;base64,${artifact.overlay_base64}`} alt="Overlay" className="rounded-md border border-zinc-200 dark:border-zinc-800 w-full object-contain" />
                        <span className="text-xs text-zinc-500 dark:text-zinc-400 mt-2">Overlay</span>
                      </div>
                    </div>
                    <p className="text-sm text-zinc-500 dark:text-zinc-500 mt-4 text-center">
                      Target layer: block4.0 &middot; Conv2d 128&rarr;256
                    </p>
                  </div>
                ))}
              </div>
            ) : (
               <div className="text-sm text-zinc-500 dark:text-zinc-400 text-center py-4">No Grad-CAM samples available.</div>
            )}
          </div>

          {/* Section 4: NLP Explainability */}
          <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 space-y-6">
            <div className="text-xs font-medium tracking-widest uppercase text-zinc-400 dark:text-zinc-600 mb-4">
              NLP ENTITY ATTRIBUTION
            </div>
            
            {nlpData?.examples && nlpData.examples.length > 0 ? (
              <div className="space-y-4">
                {nlpData.examples.map((example: any, i: number) => (
                  <div key={i} className="bg-zinc-50 dark:bg-zinc-900 p-4 rounded-lg border border-zinc-200 dark:border-zinc-800">
                    <p className="text-sm text-zinc-900 dark:text-zinc-100 mb-3 font-medium">"{example.text}"</p>
                    <div className="flex flex-wrap gap-2">
                      {example.entities.map((ent: any, j: number) => (
                        <div key={j} className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs">
                          <span className={`w-2 h-2 rounded-full ${ent.category === 'PRESENT' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                          <span className="text-zinc-700 dark:text-zinc-300 font-medium">{ent.text}</span>
                          <span className="text-zinc-400 dark:text-zinc-500 ml-1">{(ent.confidence * 100).toFixed(0)}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
               <div className="text-sm text-zinc-500 dark:text-zinc-400 text-center py-4">No NLP examples available.</div>
            )}
          </div>
        </>
      )}
    </div>
  );
};
