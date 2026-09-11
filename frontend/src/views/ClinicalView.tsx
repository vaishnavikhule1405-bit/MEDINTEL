import React, { useState, useEffect } from 'react';
import {
  Stethoscope,
  Search,
  Check,
  X,
  AlertTriangle,
} from 'lucide-react';
import { clinicalApi } from '../api/client';
import { SafetyDisclaimer } from '../components/SafetyDisclaimer';
import { Badge } from '../components/Badge';
import { ClinicalPredictionResponse, SymptomItem } from '../types';

// Preset clinical symptom scenarios with exact feature identifiers
const PRESET_SCENARIOS = [
  {
    name: 'Respiratory / Pneumonia Profile',
    description: 'Fever, cough, productive cough, pleuritic chest pain, chills, shortness of breath',
    symptoms: [
      'symptom_fever',
      'symptom_cough',
      'symptom_productive_cough',
      'symptom_pleuritic_chest_pain',
      'symptom_shortness_of_breath',
      'symptom_chills',
      'symptom_fatigue',
    ],
  },
  {
    name: 'Hepatobiliary / Jaundice Profile',
    description: 'Jaundice, abdominal pain, pruritus, fatigue, dark stools',
    symptoms: [
      'symptom_jaundice_symptom',
      'symptom_abdominal_pain',
      'symptom_pruritus',
      'symptom_fatigue',
      'symptom_dark_stools',
    ],
  },
  {
    name: 'Cardiovascular Profile',
    description: 'Exertional chest pain, shortness of breath, palpitations, syncope',
    symptoms: [
      'symptom_chest_pain',
      'symptom_exertional_chest_pain',
      'symptom_shortness_of_breath',
      'symptom_palpitations',
      'symptom_syncope',
    ],
  },
  {
    name: 'Neurological Profile',
    description: 'Headache, dizziness, vertigo, numbness, vision blur',
    symptoms: [
      'symptom_headache',
      'symptom_dizziness',
      'symptom_vertigo',
      'symptom_numbness',
      'symptom_vision_blur',
    ],
  },
];

export const ClinicalView: React.FC = () => {
  const [catalog, setCatalog] = useState<SymptomItem[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<string>('All');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ClinicalPredictionResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchSymptoms() {
      try {
        const res = await clinicalApi.getSymptoms();
        if (res && res.all_symptoms) {
          setCatalog(res.all_symptoms);
          const cats = Array.from(new Set(res.all_symptoms.map((s) => s.category))).filter(Boolean);
          setCategories(cats);

          // Expand the first 3 categories by default
          const exp: Record<string, boolean> = {};
          cats.forEach((c, idx) => {
            exp[c] = idx < 3;
          });
          setExpandedCategories(exp);
        }
      } catch (err: any) {
        console.error('Failed to load symptoms catalog:', err);
      }
    }
    fetchSymptoms();
  }, []);

  const toggleCategoryExpand = (cat: string) => {
    setExpandedCategories((prev) => ({
      ...prev,
      [cat]: !prev[cat],
    }));
  };

  const toggleSymptom = (symptomId: string) => {
    if (selectedSymptoms.includes(symptomId)) {
      setSelectedSymptoms(selectedSymptoms.filter((s) => s !== symptomId));
    } else {
      setSelectedSymptoms([...selectedSymptoms, symptomId]);
    }
  };

  const selectPreset = (symptoms: string[]) => {
    setSelectedSymptoms(symptoms);
    setError(null);
  };

  const handleClear = () => {
    setSelectedSymptoms([]);
    setResult(null);
    setError(null);
  };

  const handlePredict = async () => {
    if (selectedSymptoms.length === 0) {
      setError('Please select at least one symptom to evaluate.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const res = await clinicalApi.predict(selectedSymptoms);
      setResult(res);
    } catch (err: any) {
      setError(err.message || 'Clinical symptom prediction failed.');
    } finally {
      setLoading(false);
    }
  };

  const getSymptomName = (id: string) => {
    const found = catalog.find((c) => c.id === id);
    if (found) return found.name;
    return id.replace(/rare_symptom_|symptom_|_rare|_symptom/g, '').replace(/_/g, ' ');
  };

  // Filter items
  const filteredCatalog = catalog.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase().trim()) ||
      item.id.toLowerCase().includes(searchQuery.toLowerCase().trim());
    if (activeCategoryFilter === 'All') return matchesSearch;
    return matchesSearch && item.category === activeCategoryFilter;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col mb-6">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
            Clinical Assessment
          </h1>
          <Badge variant="operational" />
        </div>
        <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
          Select patient symptoms for AI-assisted differential diagnosis
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-3 space-y-4">
          <SafetyDisclaimer />

          <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-sm">
            {/* Presets */}
            <div className="flex overflow-x-auto gap-2 pb-4 mb-4 border-b border-zinc-200 dark:border-zinc-800 scrollbar-hide">
              {PRESET_SCENARIOS.map((preset) => (
                <button
                  key={preset.name}
                  onClick={() => selectPreset(preset.symptoms)}
                  className="shrink-0 px-3 py-1.5 rounded-full border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors"
                >
                  {preset.name}
                </button>
              ))}
            </div>

            {/* Search */}
            <div className="relative mb-4">
              <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search symptoms..."
                className="w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-600 text-sm pl-9 pr-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>

            {/* Category filters */}
            <div className="flex overflow-x-auto gap-2 pb-2 mb-4 scrollbar-hide">
              <button
                onClick={() => setActiveCategoryFilter('All')}
                className={`shrink-0 px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                  activeCategoryFilter === 'All'
                    ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900'
                    : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                }`}
              >
                All
              </button>
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategoryFilter(cat)}
                  className={`shrink-0 px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                    activeCategoryFilter === cat
                      ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900'
                      : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Symptom Grid */}
            <div className="grid grid-cols-2 gap-2 max-h-80 overflow-y-auto pr-2 mb-6">
              {filteredCatalog.map((sym) => {
                const isSelected = selectedSymptoms.includes(sym.id);
                return (
                  <button
                    key={sym.id}
                    onClick={() => toggleSymptom(sym.id)}
                    className={`flex items-center justify-between px-3 py-2 rounded-lg border text-sm transition-colors text-left ${
                      isSelected
                        ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400'
                        : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 hover:border-zinc-300 dark:hover:border-zinc-700'
                    }`}
                  >
                    <span className="truncate pr-2">{sym.name}</span>
                    {isSelected && <Check className="w-4 h-4 shrink-0" />}
                  </button>
                );
              })}
            </div>

            {/* Active Vector Shelf */}
            {selectedSymptoms.length > 0 && (
              <div className="mb-6 p-4 rounded-lg bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-800">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-medium text-zinc-900 dark:text-zinc-100">
                    Selected Symptoms ({selectedSymptoms.length})
                  </span>
                  <button onClick={handleClear} className="text-xs text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100">
                    Clear all
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {selectedSymptoms.map((id) => (
                    <span
                      key={id}
                      onClick={() => toggleSymptom(id)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-xs font-medium text-zinc-700 dark:text-zinc-300 cursor-pointer hover:border-red-200 hover:text-red-600 dark:hover:border-red-900/50 dark:hover:text-red-400 transition-colors"
                    >
                      {getSymptomName(id)}
                      <X className="w-3 h-3" />
                    </span>
                  ))}
                </div>
              </div>
            )}

            <button
              onClick={handlePredict}
              disabled={loading || selectedSymptoms.length === 0}
              className="w-full px-4 py-3 rounded-md bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium transition-colors duration-150 flex items-center justify-center gap-2"
            >
              {loading ? 'Analyzing...' : 'Run Clinical Assessment'}
            </button>
          </div>
        </div>

        {/* Right Column */}
        <div className="lg:col-span-2">
          {error && (
            <div className="mb-4 p-4 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0" />
              <p className="text-sm text-red-800 dark:text-red-300">{error}</p>
            </div>
          )}

          {!result ? (
            <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-8 flex flex-col items-center justify-center min-h-[400px] text-center">
              <div className="w-12 h-12 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mb-4">
                <Stethoscope className="w-6 h-6 text-zinc-400 dark:text-zinc-500" />
              </div>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">Select symptoms and run assessment</p>
            </div>
          ) : (
            <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-sm space-y-6">
              <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800/50 pb-4">
                <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">AI Assessment Report</h3>
                <span className="text-xs font-medium px-2.5 py-1 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700">
                  Confidence: {((result.model_confidence || result.class_probability || 0) * 100).toFixed(1)}%
                </span>
              </div>

              <div>
                <p className="text-xs font-medium tracking-widest uppercase text-zinc-400 dark:text-zinc-600 mb-2">Primary Prediction</p>
                <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                  {result.predicted_disease_display || result.predicted_disease}
                </div>
              </div>

              <div>
                <p className="text-xs font-medium tracking-widest uppercase text-zinc-400 dark:text-zinc-600 mb-3">Top Differentials</p>
                <div className="space-y-3">
                  {(result.top_5_predictions || []).map((pred, idx) => {
                    const probPercent = ((pred.probability || pred.model_confidence || 0) * 100).toFixed(1);
                    return (
                      <div key={idx}>
                        <div className="flex items-center justify-between text-sm mb-1.5">
                          <span className="font-medium text-zinc-700 dark:text-zinc-300">{pred.disease_display_name || pred.disease}</span>
                          <span className="font-medium text-zinc-500">{probPercent}%</span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${idx === 0 ? 'bg-emerald-500' : 'bg-zinc-400 dark:bg-zinc-600'}`}
                            style={{ width: `${Math.max(2, parseFloat(probPercent))}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {result.model_evidence && result.model_evidence.length > 0 && (
                <div>
                  <p className="text-xs font-medium tracking-widest uppercase text-zinc-400 dark:text-zinc-600 mb-3">SHAP Evidence</p>
                  <div className="space-y-2">
                    {result.model_evidence.slice(0, 5).map((f) => {
                      const isPositive = f.contribution === 'increases_prediction' || f.shap_value > 0;
                      return (
                        <div key={f.symptom_id} className="flex items-center justify-between text-sm p-2 rounded-md bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800">
                          <span className="font-medium text-zinc-700 dark:text-zinc-300">{f.symptom_name}</span>
                          <div className={`h-1.5 rounded-full w-16 ${isPositive ? 'bg-emerald-500' : 'bg-red-500'}`} />
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {result.active_symptoms && result.active_symptoms.length > 0 && (
                <div>
                  <p className="text-xs font-medium tracking-widest uppercase text-zinc-400 dark:text-zinc-600 mb-3">Symptoms Used</p>
                  <div className="flex flex-wrap gap-1.5">
                    {result.active_symptoms.map((sym, i) => (
                      <span key={i} className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700">
                        {sym}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/30">
                <p className="text-[11px] text-amber-800 dark:text-amber-400 leading-relaxed">
                  For clinical decision-support research only. Not a confirmed medical diagnosis. Consult a healthcare professional.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
