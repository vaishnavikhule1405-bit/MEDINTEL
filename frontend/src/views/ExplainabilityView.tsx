import React, { useState, useEffect } from 'react';
import { explainabilityApi } from '../api/client';
import { SafetyDisclaimer } from '../components/SafetyDisclaimer';
import { Badge } from '../components/Badge';

type XaiTab = 'clinical' | 'imaging' | 'nlp';

export const ExplainabilityView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<XaiTab>('clinical');
  const [globalShap, setGlobalShap] = useState<any>(null);
  const [patientShap, setPatientShap] = useState<any>(null);
  const [gradcamData, setGradcamData] = useState<any>(null);
  const [nlpData, setNlpData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [clinicalCategoryFilter, setClinicalCategoryFilter] = useState<string>('All');
  const [showAllGlobal, setShowAllGlobal] = useState(false);
  const [searchSymptom, setSearchSymptom] = useState('');

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

  // Compute displayed features
  const allFeatures = globalShap?.all_features || [];
  let filteredFeatures = allFeatures;
  if (clinicalCategoryFilter !== 'All') {
    filteredFeatures = filteredFeatures.filter((f: any) => f.category === clinicalCategoryFilter);
  }
  if (searchSymptom.trim()) {
    filteredFeatures = filteredFeatures.filter((f: any) => f.symptom_name.toLowerCase().includes(searchSymptom.toLowerCase()));
  }
  const maxGlobalShap = filteredFeatures.length > 0 ? filteredFeatures[0].mean_abs_shap : 1;
  const displayGlobalFeatures = showAllGlobal ? filteredFeatures : filteredFeatures.slice(0, 15);

  const renderTabs = () => (
    <div className="flex space-x-2 border-b border-zinc-200 dark:border-zinc-800 pb-px mb-8">
      {[
        { id: 'clinical', label: 'Clinical SHAP' },
        { id: 'imaging', label: 'Radiographic Grad-CAM' },
        { id: 'nlp', label: 'Biomedical NLP' }
      ].map(tab => (
        <button
          key={tab.id}
          onClick={() => setActiveTab(tab.id as XaiTab)}
          className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
            activeTab === tab.id
              ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-300'
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      <SafetyDisclaimer />

      {/* Page header */}
      <div>
        <div className="text-xs font-medium tracking-widest uppercase text-zinc-400 dark:text-zinc-600 mb-2">
          Explainability
        </div>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
          XAI Studio
        </h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed mt-2 max-w-3xl">
          Interact with model evidence across all three modalities. Understand why MEDINTEL AI makes decisions via SHAP game-theoretic attribution, Grad-CAM visual evidence, and NLP contextual tagging.
        </p>
      </div>

      {renderTabs()}

      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 text-zinc-500">
          <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-sm">Loading Explainability Artifacts...</p>
        </div>
      ) : (
        <div className="animate-fade-in">
          
          {/* TAB: CLINICAL SHAP */}
          {activeTab === 'clinical' && (
            <div className="space-y-8">
              {/* Patient Level Example */}
              <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden shadow-sm">
                <div className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs font-semibold tracking-widest uppercase text-indigo-600 dark:text-indigo-400 mb-1">
                        Local Attribution
                      </div>
                      <h3 className="text-lg font-medium text-zinc-900 dark:text-zinc-100">Patient-Level SHAP Profile</h3>
                      <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                        Demonstrating how the presence or absence of specific symptoms mathematically pushed the model toward the prediction of <b>{patientShap?.primary_disease || 'Pneumonia'}</b>.
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-wider bg-indigo-50 border border-indigo-200 text-indigo-700 dark:bg-indigo-900/30 dark:border-indigo-800/50 dark:text-indigo-300">
                        Example Case Loaded
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="p-6">
                  <div className="space-y-2">
                    {patientShap?.top_contributions?.map((item: any, idx: number) => {
                      const isPositive = item.shap_value >= 0;
                      const valueText = item.symptom_value === 1 ? 'Present' : 'Absent';
                      const absShap = item.absolute_shap;
                      // Max shap in example is ~0.83
                      const maxAbs = patientShap.top_contributions[0].absolute_shap || 1;
                      const pct = Math.min((absShap / maxAbs) * 100, 100);

                      return (
                        <div key={idx} className="group flex items-center bg-zinc-50 dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800/80 transition-colors p-3 rounded-lg border border-zinc-200 dark:border-zinc-800">
                          <div className="flex-1 flex items-center gap-3">
                            <span className={`flex-shrink-0 w-2 h-2 rounded-full ${isPositive ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                            <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100 w-48 truncate">
                              {item.symptom_name}
                            </span>
                            <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${item.symptom_value === 1 ? 'bg-zinc-200 text-zinc-700 dark:bg-zinc-700 dark:text-zinc-300' : 'bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-500'}`}>
                              {valueText}
                            </span>
                          </div>
                          
                          <div className="flex items-center flex-1 mx-6 h-6 relative">
                             <div className="absolute left-1/2 top-0 bottom-0 w-px bg-zinc-300 dark:bg-zinc-700 z-0" />
                             <div className="w-full flex justify-center z-10">
                                {isPositive ? (
                                  <div className="w-1/2 flex justify-start items-center">
                                     <div className="h-4 bg-emerald-500/90 rounded-r-sm shadow-sm transition-all duration-500" style={{ width: `${pct}%` }} />
                                  </div>
                                ) : (
                                  <div className="w-1/2 flex justify-end items-center">
                                     <div className="h-4 bg-rose-500/90 rounded-l-sm shadow-sm transition-all duration-500" style={{ width: `${pct}%` }} />
                                  </div>
                                )}
                             </div>
                          </div>

                          <div className={`w-24 text-right text-sm font-semibold tabular-nums ${isPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                            {isPositive ? '+' : ''}{item.shap_value.toFixed(4)}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Global Feature Importance */}
              <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm overflow-hidden">
                <div className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs font-semibold tracking-widest uppercase text-indigo-600 dark:text-indigo-400 mb-1">
                        Global Importance
                      </div>
                      <h3 className="text-lg font-medium text-zinc-900 dark:text-zinc-100">TreeSHAP Feature Ranking</h3>
                      <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                        Mean absolute SHAP values across all 174 symptom features from the XGBoost training manifold.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-6 space-y-6">
                  {/* Controls */}
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => setClinicalCategoryFilter('All')}
                        className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-colors ${clinicalCategoryFilter === 'All' ? 'bg-indigo-50 border-indigo-200 text-indigo-700 dark:bg-indigo-900/30 dark:border-indigo-800/50 dark:text-indigo-300' : 'bg-white border-zinc-200 text-zinc-600 hover:bg-zinc-50 dark:bg-zinc-900 dark:border-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-800'}`}
                      >
                        All Systems
                      </button>
                      {globalShap?.category_stats?.map((cat: any) => (
                        <button
                          key={cat.category}
                          onClick={() => setClinicalCategoryFilter(cat.category)}
                          className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-colors ${clinicalCategoryFilter === cat.category ? 'bg-indigo-50 border-indigo-200 text-indigo-700 dark:bg-indigo-900/30 dark:border-indigo-800/50 dark:text-indigo-300' : 'bg-white border-zinc-200 text-zinc-600 hover:bg-zinc-50 dark:bg-zinc-900 dark:border-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-800'}`}
                        >
                          {cat.category} ({cat.count})
                        </button>
                      ))}
                    </div>
                    <div className="relative">
                      <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                      <input
                        type="text"
                        placeholder="Search symptom..."
                        value={searchSymptom}
                        onChange={(e) => setSearchSymptom(e.target.value)}
                        className="pl-9 pr-4 py-2 text-sm bg-zinc-50 border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:bg-zinc-900 dark:border-zinc-800 dark:text-zinc-100"
                      />
                    </div>
                  </div>

                  <div className="space-y-3 pt-2">
                    {displayGlobalFeatures.map((feature: any, idx: number) => (
                      <div key={idx} className="flex items-center text-sm group">
                        <div className="w-56 pr-4">
                          <div className="font-medium text-zinc-900 dark:text-zinc-100 truncate">{feature.symptom_name}</div>
                          <div className="text-[10px] text-zinc-400 dark:text-zinc-500 uppercase tracking-wider truncate mt-0.5">{feature.category}</div>
                        </div>
                        <div className="flex-1 h-3 bg-zinc-100 dark:bg-zinc-800/50 rounded-full overflow-hidden border border-zinc-200 dark:border-zinc-800">
                          <div
                            className="h-full bg-indigo-500/90 dark:bg-indigo-500/80 transition-all duration-500"
                            style={{ width: `${(feature.mean_abs_shap / maxGlobalShap) * 100}%` }}
                          />
                        </div>
                        <div className="w-24 text-right font-mono text-zinc-600 dark:text-zinc-400 pl-4 tabular-nums">
                          {feature.mean_abs_shap.toFixed(4)}
                        </div>
                      </div>
                    ))}
                    {filteredFeatures.length === 0 && (
                      <div className="text-center py-8 text-sm text-zinc-500">No symptoms found matching your criteria.</div>
                    )}
                  </div>
                  
                  {filteredFeatures.length > 15 && (
                    <button
                      onClick={() => setShowAllGlobal(!showAllGlobal)}
                      className="w-full mt-4 px-4 py-2.5 rounded-lg border border-dashed border-zinc-300 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-200 text-sm font-medium transition-all"
                    >
                      {showAllGlobal ? 'Collapse List' : `View All ${filteredFeatures.length} Features`}
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB: IMAGING GRAD-CAM */}
          {activeTab === 'imaging' && gradcamData && (
            <div className="space-y-8">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {gradcamData.cases?.map((caseItem: any, idx: number) => (
                  <div key={idx} className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden shadow-sm flex flex-col">
                    <div className="p-5 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-start">
                      <div>
                         <h3 className="text-lg font-medium text-zinc-900 dark:text-zinc-100">{caseItem.title}</h3>
                         <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1 line-clamp-2">{caseItem.description}</p>
                      </div>
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border ${caseItem.prediction === 'NORMAL' ? 'bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-400' : 'bg-rose-50 border-rose-200 text-rose-700 dark:bg-rose-950/40 dark:border-rose-800 dark:text-rose-400'}`}>
                        {caseItem.prediction} ({(caseItem.confidence * 100).toFixed(1)}%)
                      </span>
                    </div>
                    <div className="p-6 flex-1 flex flex-col">
                      <div className="aspect-square bg-black rounded-lg overflow-hidden border border-zinc-800 relative group">
                        <img 
                          src={`data:image/png;base64,${caseItem.overlay_base64}`} 
                          alt={caseItem.title} 
                          className="w-full h-full object-contain"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                           <p className="text-xs text-white/90">Target Layer: {caseItem.target_layer}</p>
                        </div>
                      </div>
                      <div className="mt-4 bg-zinc-50 dark:bg-zinc-800/50 p-4 rounded-lg border border-zinc-200 dark:border-zinc-700/50">
                        <div className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2">Radiological Finding</div>
                        <p className="text-sm text-zinc-700 dark:text-zinc-300">{caseItem.radiological_finding}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {gradcamData.comparison_artifact && (
                 <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden shadow-sm">
                   <div className="p-5 border-b border-zinc-200 dark:border-zinc-800">
                     <h3 className="text-lg font-medium text-zinc-900 dark:text-zinc-100">{gradcamData.comparison_artifact.title}</h3>
                     <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">{gradcamData.comparison_artifact.description}</p>
                   </div>
                   <div className="p-6 bg-zinc-100 dark:bg-black/20">
                     <img 
                        src={`data:image/png;base64,${gradcamData.comparison_artifact.base64}`} 
                        alt="Comparative Panel" 
                        className="w-full rounded-lg border border-zinc-200 dark:border-zinc-800 shadow-sm"
                     />
                   </div>
                 </div>
              )}
            </div>
          )}

          {/* TAB: NLP */}
          {activeTab === 'nlp' && nlpData && (
             <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm overflow-hidden">
                <div className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs font-semibold tracking-widest uppercase text-indigo-600 dark:text-indigo-400 mb-1">
                        Contextual NLP
                      </div>
                      <h3 className="text-lg font-medium text-zinc-900 dark:text-zinc-100">BioBERT Entity Attribution</h3>
                      <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                        Token-level biomedical entity extraction with contextual negation and uncertainty tagging.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-6 space-y-6">
                  {nlpData.examples.map((example: any, i: number) => {
                     // The NLP JSON format: `text_preview`, `top_entities` array, `medical_specialty`
                     const text = example.text_preview || example.text || "";
                     const entities = example.top_entities || example.entities || [];
                     const specialty = example.medical_specialty || "Clinical Note";

                     return (
                        <div key={i} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg overflow-hidden shadow-sm">
                           <div className="bg-zinc-50 dark:bg-zinc-800/40 px-4 py-2 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-center">
                             <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400 flex items-center gap-2">
                               <svg className="w-4 h-4 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                               </svg>
                               {specialty}
                             </span>
                             {example.sample_name && <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">{example.sample_name}</span>}
                           </div>
                           <div className="p-5">
                             <p className="text-sm text-zinc-800 dark:text-zinc-200 leading-relaxed italic mb-4">
                               "{text}"
                             </p>
                             <div className="flex flex-wrap gap-2">
                               {entities.map((ent: any, j: number) => {
                                 const entityText = ent.entity || ent.text;
                                 const status = ent.status || ent.category;
                                 const conf = ent.confidence;
                                 const isPresent = status === 'PRESENT';
                                 
                                 return (
                                   <div key={j} className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-xs shadow-sm ${
                                      isPresent ? 'bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-900/20 dark:border-emerald-800/30 dark:text-emerald-300' 
                                                : 'bg-rose-50 border-rose-200 text-rose-800 dark:bg-rose-900/20 dark:border-rose-800/30 dark:text-rose-300'
                                   }`}>
                                     <span className={`w-1.5 h-1.5 rounded-full ${isPresent ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                                     <span className="font-semibold">{entityText}</span>
                                     <span className="opacity-60 ml-1 border-l border-current pl-1.5">
                                       {status} • {(conf * 100).toFixed(0)}%
                                     </span>
                                   </div>
                                 )
                               })}
                             </div>
                           </div>
                        </div>
                     )
                  })}
                </div>
             </div>
          )}
        </div>
      )}
    </div>
  );
};
