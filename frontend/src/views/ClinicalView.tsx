import React, { useState, useEffect } from 'react';
import {
  Activity,
  ChevronDown,
  ChevronRight,
  Info,
  LoaderCircle,
  RotateCcw,
  ShieldCheck,
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
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [catalogError, setCatalogError] = useState<string | null>(null);
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [assessedSymptoms, setAssessedSymptoms] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<string>('All');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ClinicalPredictionResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showAllEvidence, setShowAllEvidence] = useState(false);

  useEffect(() => {
    async function fetchSymptoms() {
      setCatalogLoading(true);
      setCatalogError(null);
      try {
        const res = await clinicalApi.getSymptoms();
        if (res && res.all_symptoms) {
          setCatalog(res.all_symptoms);
          const cats = Array.from(new Set(res.all_symptoms.map((s) => s.category))).filter(Boolean);
          setCategories(cats);
        } else {
          setCatalogError('The symptom catalogue returned no data. Please retry.');
        }
      } catch (err) {
        setCatalogError(err instanceof Error ? err.message : 'Failed to load the symptom catalogue.');
      } finally {
        setCatalogLoading(false);
      }
    }
    fetchSymptoms();
  }, []);

  const toggleSymptom = (symptomId: string) => {
    setSelectedSymptoms((prev) =>
      prev.includes(symptomId)
        ? prev.filter((symptom) => symptom !== symptomId)
        : [...prev, symptomId]
    );
    setError(null);
  };

  const selectPreset = (symptoms: string[]) => {
    const catalogIds = new Set(catalog.map((symptom) => symptom.id));
    const availableSymptoms = symptoms.filter((symptom) => catalogIds.has(symptom));
    setSelectedSymptoms(availableSymptoms);
    setError(
      availableSymptoms.length === symptoms.length
        ? null
        : 'Some symptoms in this demo profile are unavailable in the current catalogue.'
    );
  };

  const handleClear = () => {
    setSelectedSymptoms([]);
    setAssessedSymptoms([]);
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
      setAssessedSymptoms([...selectedSymptoms]);
      setShowAllEvidence(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Clinical symptom prediction failed.');
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
  const selectedItems = selectedSymptoms.map((id) => ({
    id,
    name: getSymptomName(id),
    isRare: catalog.find((symptom) => symptom.id === id)?.is_rare ?? false,
  }));
  const resultIsStale =
    result !== null &&
    (assessedSymptoms.length !== selectedSymptoms.length ||
      assessedSymptoms.some((symptom, index) => symptom !== selectedSymptoms[index]));

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-emerald-700 dark:text-emerald-400">
              Clinical intelligence
            </span>
            <Badge variant="research" label="Research prototype" />
          </div>
          <h1 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
            Clinical Assessment
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-zinc-600 dark:text-zinc-400">
            Select symptoms to see model-ranked condition hypotheses and the features that influenced the prediction.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
          <ShieldCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          <span>Decision support only · clinician review required</span>
        </div>
      </div>

      <SafetyDisclaimer />
      <div role="note" className="flex items-start gap-3 rounded-2xl border border-amber-300 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-950/30">
        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-700 dark:text-amber-400" />
        <div>
          <p className="text-sm font-semibold text-amber-900 dark:text-amber-200">Experimental demonstration only — not for patient-care decisions</p>
          <p className="mt-1 text-xs leading-relaxed text-amber-800 dark:text-amber-300">
            The symptom-disease training data is synthetic and contains noisy associations. The bundled sanity checks currently match the expected top class in only 2 of 5 example profiles. Treat every prediction as an unreliable model output, not a diagnosis.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.08fr)_minmax(360px,0.92fr)]">
        {/* Left Column */}
        <div className="space-y-4">
          <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <div className="border-b border-zinc-100 px-5 py-4 dark:border-zinc-800">
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                  <Stethoscope className="h-4 w-4" />
                </span>
                <div>
                  <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">1. Select reported symptoms</h2>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">Choose all that apply, or start with a demo profile</p>
                </div>
              </div>
            </div>
            <div className="space-y-4 p-5">
            {/* Presets */}
            <div className="space-y-2">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Demo profiles · synthetic, not patient data</p>
              <div className="flex overflow-x-auto gap-2 pb-1 scrollbar-hide">
              {PRESET_SCENARIOS.map((preset) => (
                <button
                  key={preset.name}
                  onClick={() => selectPreset(preset.symptoms)}
                  title={preset.description}
                  disabled={catalogLoading}
                  className="shrink-0 rounded-full border border-zinc-200 bg-zinc-50 px-3.5 py-2 text-left text-xs font-semibold text-zinc-700 transition-colors hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-800/80 dark:text-zinc-300 dark:hover:border-emerald-800 dark:hover:bg-emerald-950/40 dark:hover:text-emerald-400"
                >
                  {preset.name}
                </button>
              ))}
              </div>
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search symptoms by name..."
                aria-label="Search symptoms"
                className="w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-600 text-sm pl-9 pr-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
              />
            </div>

            {/* Category filters */}
            <div className="flex overflow-x-auto gap-1.5 pb-1 scrollbar-hide" aria-label="Filter symptoms by category">
              <button
                onClick={() => setActiveCategoryFilter('All')}
                aria-pressed={activeCategoryFilter === 'All'}
                className={`shrink-0 px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                  activeCategoryFilter === 'All'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                }`}
              >
                All
              </button>
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategoryFilter(cat)}
                  aria-pressed={activeCategoryFilter === cat}
                  className={`shrink-0 px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                    activeCategoryFilter === cat
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                {catalogLoading ? 'Loading symptom catalogue…' : `${filteredCatalog.length} symptoms`}
              </span>
              <span className="text-xs text-zinc-500 dark:text-zinc-400">{selectedSymptoms.length} selected</span>
            </div>

            {catalogError ? (
              <div role="alert" className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700 dark:border-rose-800 dark:bg-rose-950/30 dark:text-rose-300">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>Unable to load symptoms: {catalogError}. Refresh the page and try again.</span>
              </div>
            ) : catalogLoading ? (
              <div className="flex min-h-48 items-center justify-center gap-2 rounded-xl border border-dashed border-zinc-200 text-sm text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
                <LoaderCircle className="h-4 w-4 animate-spin" />
                Loading available symptoms…
              </div>
            ) : filteredCatalog.length === 0 ? (
              <div className="flex min-h-32 flex-col items-center justify-center rounded-xl border border-dashed border-zinc-200 px-4 text-center dark:border-zinc-700">
                <p className="text-sm font-medium text-zinc-700 dark:text-zinc-200">No matching symptoms</p>
                <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">Try a different search or category.</p>
              </div>
            ) : (
            /* Symptom Grid */
            <div className="grid max-h-80 grid-cols-1 gap-2 overflow-y-auto pr-1 sm:grid-cols-2">
              {filteredCatalog.map((sym) => {
                const isSelected = selectedSymptoms.includes(sym.id);
                return (
                  <button
                    key={sym.id}
                    onClick={() => toggleSymptom(sym.id)}
                    role="checkbox"
                    aria-checked={isSelected}
                    className={`flex min-h-11 items-center justify-between gap-2 rounded-xl border px-3 py-2.5 text-left text-xs font-medium transition-all ${
                      isSelected
                        ? 'border-emerald-500/80 bg-emerald-50/80 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 shadow-2xs font-semibold'
                        : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 hover:border-zinc-300 dark:hover:border-zinc-700'
                    }`}
                  >
                    <span className="min-w-0">
                      <span className="block truncate">{sym.name}</span>
                      {sym.is_rare && <span className="mt-0.5 block text-[10px] font-normal text-zinc-400">Specialized feature</span>}
                    </span>
                    {isSelected && <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />}
                  </button>
                );
              })}
            </div>
            )}

            {/* Active Vector Shelf */}
            {selectedSymptoms.length > 0 && (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-4 dark:border-emerald-900/70 dark:bg-emerald-950/20">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">Selected for assessment ({selectedSymptoms.length})</span>
                  <button onClick={handleClear} className="inline-flex items-center gap-1 text-xs font-semibold text-rose-600 hover:underline dark:text-rose-400">
                    <RotateCcw className="h-3 w-3" />
                    Clear all
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {selectedItems.map((symptom) => (
                    <button
                      key={symptom.id}
                      type="button"
                      onClick={() => toggleSymptom(symptom.id)}
                      aria-label={`Remove ${symptom.name}`}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-zinc-800 shadow-2xs transition-colors hover:border-rose-300 hover:text-rose-600 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:border-rose-800 dark:hover:text-rose-400"
                    >
                      {symptom.name}
                      {symptom.isRare && <span className="text-[9px] font-normal text-zinc-400">specialized</span>}
                      <X className="w-3 h-3 opacity-60 hover:opacity-100" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            <button
              onClick={handlePredict}
              disabled={loading || catalogLoading || catalogError !== null || selectedSymptoms.length === 0}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3.5 text-sm font-bold text-white shadow-md shadow-emerald-500/20 transition-all hover:bg-emerald-500 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? (
                <>
                  <LoaderCircle className="h-4 w-4 animate-spin" />
                  Evaluating selected symptoms…
                </>
              ) : (
                <>Run assessment <span aria-hidden="true">→</span></>
              )}
            </button>
          </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="min-w-0">
          {error && (
            <div role="alert" className="mb-4 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 dark:border-red-900/50 dark:bg-red-950/30">
              <AlertTriangle className="h-5 w-5 shrink-0 text-red-600 dark:text-red-400" />
              <p className="text-sm text-red-800 dark:text-red-300">{error}</p>
            </div>
          )}

          {!result ? (
            <div className="flex min-h-[420px] flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-300 bg-white px-8 py-12 text-center dark:border-zinc-700 dark:bg-zinc-900">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 dark:bg-emerald-950/40">
                <Activity className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
              </div>
              <h2 className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">Your model output will appear here</h2>
              <p className="mt-1 max-w-sm text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
                Select reported symptoms, then run the assessment to see ranked model predictions and their feature-level explanation.
              </p>
              <div className="mt-5 flex items-center gap-2 text-[11px] text-zinc-400">
                <Info className="h-3.5 w-3.5" />
                Model evidence is not a clinical diagnosis or calibrated risk score.
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {resultIsStale && (
                <div role="status" className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-200">
                  <Info className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>Symptoms have changed since this result. The report below reflects the previous selection; run the assessment again to update it.</span>
                </div>
              )}

              <section className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
                <div className="flex items-center justify-between gap-3 border-b border-zinc-100 px-5 py-4 dark:border-zinc-800">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-emerald-700 dark:text-emerald-400">2. Model output</p>
                    <h2 className="mt-1 text-sm font-semibold text-zinc-900 dark:text-zinc-100">Ranked condition hypotheses</h2>
                  </div>
                  <span className="rounded-lg border border-zinc-200 px-2.5 py-1 text-[10px] font-medium text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
                    XGBoost model
                  </span>
                </div>

                <div className="p-5">
                  <div className="rounded-xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-white p-4 dark:border-emerald-900/70 dark:from-emerald-950/30 dark:to-zinc-900">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-widest text-emerald-700 dark:text-emerald-400">Highest model score</p>
                        <h3 className="mt-1 text-xl font-bold tracking-tight text-zinc-950 dark:text-zinc-50">
                          {result.predicted_disease_display || result.predicted_disease}
                        </h3>
                        <p className="mt-1 text-[11px] text-zinc-500 dark:text-zinc-400">
                          Ranked from {result.active_symptoms_count} recognized selected symptoms
                        </p>
                      </div>
                      <div className="min-w-28 rounded-xl border border-emerald-200 bg-white/80 px-3 py-2 text-right dark:border-emerald-900 dark:bg-zinc-900/70">
                        <p className="text-[10px] uppercase tracking-wide text-zinc-500 dark:text-zinc-400">Model score</p>
                        <p className="mt-0.5 text-lg font-bold tabular-nums text-emerald-700 dark:text-emerald-300">
                          {(result.class_probability * 100).toFixed(1)}%
                        </p>
                      </div>
                    </div>
                  </div>
                  <p className="mt-3 flex items-start gap-2 text-[11px] leading-relaxed text-amber-800 dark:text-amber-300">
                    <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                    This is the model’s class probability, not calibrated patient risk or diagnostic certainty.
                  </p>
                </div>

                <div className="border-t border-zinc-100 px-5 py-4 dark:border-zinc-800">
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <div>
                      <h3 className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">Next-highest model scores</h3>
                      <p className="mt-0.5 text-[10px] text-zinc-500 dark:text-zinc-400">Remaining classes from the model’s top five; not a clinician-reviewed differential</p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    {(result.top_5_predictions || []).slice(1).map((prediction) => {
                      const score = prediction.probability * 100;
                      return (
                        <div key={prediction.disease}>
                          <div className="mb-1.5 flex items-center justify-between gap-3 text-xs">
                            <span className="font-medium text-zinc-700 dark:text-zinc-300">
                              {prediction.disease_display_name || prediction.disease}
                            </span>
                            <span className="shrink-0 tabular-nums text-zinc-500 dark:text-zinc-400">{score.toFixed(1)}%</span>
                          </div>
                          <div className="h-2 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
                            <div
                              className="h-full rounded-full bg-zinc-400 dark:bg-zinc-600"
                              style={{ width: `${Math.max(0, Math.min(100, score))}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </section>

              <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-sky-700 dark:text-sky-400">3. Explanation</p>
                    <h3 className="mt-1 text-sm font-semibold text-zinc-900 dark:text-zinc-100">Features influencing the top class</h3>
                    <p className="mt-1 text-[11px] leading-relaxed text-zinc-500 dark:text-zinc-400">
                      SHAP indicates how each feature value shifted the model output for this class, relative to a model baseline. An unselected symptom can still affect the score because its value is 0; this does not show biological causation.
                    </p>
                  </div>
                  <div className="flex gap-2 text-[10px] text-zinc-500 dark:text-zinc-400">
                    <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-emerald-500" /> Pushes toward</span>
                    <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-rose-500" /> Pushes away</span>
                  </div>
                </div>

                {result.model_evidence && result.model_evidence.length > 0 ? (
                  <div className="mt-4 space-y-3">
                    {(showAllEvidence ? result.model_evidence : result.model_evidence.slice(0, 5)).map((feature) => {
                      const pushesToward = feature.shap_value > 0;
                      const maximumImpact = Math.max(...result.model_evidence.map((item) => item.absolute_impact), 0.0001);
                      const impactPercent = Math.max(4, (feature.absolute_impact / maximumImpact) * 100);
                      return (
                        <div key={feature.symptom_id} className="rounded-xl border border-zinc-100 bg-zinc-50/70 p-3 dark:border-zinc-800 dark:bg-zinc-950/40">
                          <div className="flex items-center justify-between gap-3">
                            <div className="min-w-0">
                              <p className="truncate text-xs font-semibold text-zinc-800 dark:text-zinc-200">{feature.symptom_name}</p>
                              <p className="mt-0.5 text-[10px] text-zinc-500 dark:text-zinc-400">{feature.symptom_value ? 'Input value: present (1)' : 'Input value: absent / not reported (0)'}</p>
                            </div>
                            <span className={`shrink-0 text-[10px] font-semibold ${pushesToward ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-700 dark:text-rose-400'}`}>
                              {pushesToward ? 'Pushes toward' : 'Pushes away'}
                            </span>
                          </div>
                          <div className="mt-2 flex items-center gap-2">
                            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
                              <div className={`h-full rounded-full ${pushesToward ? 'bg-emerald-500' : 'bg-rose-500'}`} style={{ width: `${impactPercent}%` }} />
                            </div>
                            <span className="w-16 text-right font-mono text-[10px] tabular-nums text-zinc-500 dark:text-zinc-400" title="Signed SHAP value">
                              {feature.shap_value > 0 ? '+' : ''}{feature.shap_value.toFixed(4)}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                    {result.model_evidence.length > 5 && (
                      <button
                        type="button"
                        onClick={() => setShowAllEvidence((value) => !value)}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 hover:underline dark:text-emerald-400"
                      >
                        {showAllEvidence ? 'Show fewer features' : `Show all ${result.model_evidence.length} features`}
                        {showAllEvidence ? <ChevronDown className="h-3 w-3 rotate-180" /> : <ChevronRight className="h-3 w-3" />}
                      </button>
                    )}
                  </div>
                ) : (
                  <p className="mt-4 text-xs text-zinc-500 dark:text-zinc-400">No feature-level explanation was returned for this prediction.</p>
                )}
              </section>

              <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
                <h3 className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">Symptoms evaluated</h3>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {(result.active_symptoms || []).map((symptom, index) => (
                    <span key={`${symptom}-${index}`} className="rounded-full border border-zinc-200 bg-zinc-50 px-2.5 py-1 text-[10px] font-medium text-zinc-600 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                      {symptom}
                    </span>
                  ))}
                </div>
                <p className="mt-3 text-[10px] text-zinc-500 dark:text-zinc-400">{result.disclaimer}</p>
              </section>

              <section className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900/70">
                <h3 className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">Model evaluation context</h3>
                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-zinc-600 dark:text-zinc-400">
                  <span>Accuracy: <strong className="font-semibold text-zinc-800 dark:text-zinc-200">{result.model_info.accuracy}</strong></span>
                  <span>Macro F1: <strong className="font-semibold text-zinc-800 dark:text-zinc-200">{result.model_info.macro_f1}</strong></span>
                  <span>Training rows: <strong className="font-semibold text-zinc-800 dark:text-zinc-200">{result.model_info.training_dataset_records}</strong></span>
                </div>
                <p className="mt-2 text-[10px] leading-relaxed text-zinc-500 dark:text-zinc-400">
                  These aggregate evaluation metrics do not guarantee a correct result for an individual symptom combination. This model has not been validated for clinical use.
                </p>
              </section>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
