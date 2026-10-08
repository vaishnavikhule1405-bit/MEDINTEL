import React, { useMemo, useRef, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  Check,
  FileText,
  Info,
  LoaderCircle,
  Search,
  ShieldCheck,
  Sparkles,
  Upload,
  X,
} from 'lucide-react';
import { nlpApi } from '../api/client';
import { Badge } from '../components/Badge';
import { SafetyDisclaimer } from '../components/SafetyDisclaimer';
import { ExtractedEntity, NLPAnalysisResponse } from '../types';

const SAMPLE_TRANSCRIPTION = `CHIEF COMPLAINT: Acute productive cough with yellowish sputum, fever of 102.4F, and progressive shortness of breath for 4 days.

HISTORY OF PRESENT ILLNESS: A 58-year-old male presents with worsening dyspnea and pleuritic right-sided chest pain. Patient denies hemoptysis and reports no nausea or vomiting. Past medical history notable for mild asthma.

PHYSICAL EXAMINATION: Temperature 102.4F, respiration 24/min, SpO2 91% on room air. Auscultation reveals crackles over the right lower lung field.

IMPRESSION: Right lower lobe community-acquired pneumonia. Plan: Initiate IV Ceftriaxone 1g daily and Azithromycin 500mg. Chest radiograph ordered.`;

const ENTITY_CATEGORIES = [
  { key: 'problems', label: 'Problems' },
  { key: 'symptoms', label: 'Symptoms' },
  { key: 'medications', label: 'Medications' },
  { key: 'tests', label: 'Tests' },
  { key: 'procedures', label: 'Procedures' },
  { key: 'anatomy', label: 'Anatomy' },
  { key: 'measurements', label: 'Measurements' },
  { key: 'clinical_events', label: 'Clinical events' },
  { key: 'clinical_history', label: 'Clinical history' },
  { key: 'treatment', label: 'Treatment' },
  { key: 'clinical_attributes', label: 'Clinical attributes' },
] as const;

const ENTITY_FILTERS = [
  { key: 'ALL', label: 'All findings' },
  { key: 'PRESENT', label: 'Present' },
  { key: 'NEGATED', label: 'Negated' },
  { key: 'UNCERTAIN', label: 'Uncertain' },
  { key: 'HISTORICAL', label: 'Historical' },
  { key: 'FAMILY_HISTORY', label: 'Family history' },
] as const;

type EntityFilter = typeof ENTITY_FILTERS[number]['key'];

const STATUS_STYLES: Record<string, string> = {
  PRESENT: 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300',
  NEGATED: 'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-300',
  UNCERTAIN: 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-300',
  HISTORICAL: 'border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-800 dark:bg-violet-950/40 dark:text-violet-300',
  FAMILY_HISTORY: 'border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-800 dark:bg-sky-950/40 dark:text-sky-300',
};

const getStatusLabel = (status: string) =>
  status.toLowerCase().split('_').join(' ');

const formatCount = (value: number) => value.toLocaleString();

export const NLPView: React.FC = () => {
  const [noteText, setNoteText] = useState('');
  const [result, setResult] = useState<NLPAnalysisResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [includeSimilar, setIncludeSimilar] = useState(true);
  const [entityFilter, setEntityFilter] = useState<EntityFilter>('ALL');
  const [inputLabel, setInputLabel] = useState('');
  const [resultLabel, setResultLabel] = useState('');
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const filteredEntities = useMemo(() => {
    if (!result) return [];
    return entityFilter === 'ALL'
      ? result.entities
      : result.entities.filter((entity) => entity.status === entityFilter);
  }, [entityFilter, result]);

  const categoryCounts = useMemo(() => {
    if (!result) return [];
    return ENTITY_CATEGORIES
      .map(({ key, label }) => ({
        label,
        count: result.categorized_entities[key].length,
      }))
      .filter((category) => category.count > 0)
      .sort((left, right) => right.count - left.count);
  }, [result]);

  const analyzeText = async (text: string, label = 'Pasted clinical note') => {
    const trimmedText = text.trim();
    if (!trimmedText) {
      setError('Add clinical note text or load the synthetic sample before analyzing.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await nlpApi.analyze(trimmedText, includeSimilar, 3);
      setResult(response);
      setNoteText(response.original_text);
      setInputLabel(label);
      setResultLabel(label);
      setEntityFilter('ALL');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to analyze the report.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.txt')) {
      setError('Only plain-text .txt reports are supported. PDF upload is not available.');
      event.target.value = '';
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await nlpApi.uploadFile(file, includeSimilar, 3);
      setResult(response);
      setNoteText(response.original_text);
      setInputLabel(file.name);
      setResultLabel(file.name);
      setEntityFilter('ALL');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to upload and analyze the report.');
    } finally {
      setLoading(false);
      event.target.value = '';
    }
  };

  const handleNoteChange = (value: string) => {
    setNoteText(value);
    setError(null);
    setInputLabel('');
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <SafetyDisclaimer />

      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-emerald-700 dark:text-emerald-400">
              Medical intelligence
            </span>
            <Badge variant="operational" label="Research prototype" />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
            Medical Reports
          </h1>
          <p className="mt-1 max-w-2xl text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
            Extract clinical concepts and their context from a note, then review the evidence before drawing conclusions.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
          <ShieldCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          <span>Text analysis · clinician review required</span>
        </div>
      </header>

      <section className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1.25fr)_minmax(280px,0.75fr)]">
        <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-100 px-5 py-4 dark:border-zinc-800">
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                <FileText className="h-4 w-4" />
              </span>
              <div>
                <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">1. Add a clinical note</h2>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">Paste text or upload a plain-text file</p>
              </div>
            </div>
            {inputLabel && (
              <span className="max-w-full truncate rounded-full border border-zinc-200 px-2.5 py-1 text-[11px] text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
                {inputLabel}
              </span>
            )}
          </div>

          <div className="space-y-4 p-5">
            <textarea
              value={noteText}
              onChange={(event) => handleNoteChange(event.target.value)}
              rows={11}
              aria-label="Clinical note text"
              placeholder="Paste a de-identified clinical note here..."
              className="w-full resize-y rounded-xl border border-zinc-200 bg-zinc-50/70 p-4 font-mono text-[13px] leading-6 text-zinc-800 placeholder:font-sans placeholder:text-zinc-400 focus:border-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 dark:border-zinc-700 dark:bg-zinc-950/50 dark:text-zinc-100 dark:placeholder:text-zinc-600"
            />

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-wrap items-center gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".txt,text/plain"
                  className="hidden"
                  onChange={handleUpload}
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={loading}
                  className="inline-flex items-center gap-2 rounded-lg border border-zinc-200 px-3 py-2 text-xs font-medium text-zinc-700 transition-colors hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
                >
                  <Upload className="h-3.5 w-3.5" />
                  Upload .txt
                </button>
                <button
                  type="button"
                  onClick={() => {
                    handleNoteChange(SAMPLE_TRANSCRIPTION);
                    setInputLabel('Synthetic sample note');
                  }}
                  disabled={loading}
                  className="rounded-lg px-3 py-2 text-xs font-medium text-emerald-700 transition-colors hover:bg-emerald-50 disabled:opacity-50 dark:text-emerald-300 dark:hover:bg-emerald-950/40"
                >
                  Use synthetic sample
                </button>
                {noteText && (
                  <button
                    type="button"
                    onClick={() => {
                      handleNoteChange('');
                      setResult(null);
                    }}
                    disabled={loading}
                    className="inline-flex items-center gap-1 rounded-lg px-2 py-2 text-xs text-zinc-500 transition-colors hover:bg-zinc-100 disabled:opacity-50 dark:text-zinc-400 dark:hover:bg-zinc-800"
                  >
                    <X className="h-3.5 w-3.5" />
                    Clear
                  </button>
                )}
              </div>
              <div className="flex items-center justify-between gap-3 sm:justify-end">
                <span className="text-[11px] tabular-nums text-zinc-400">
                  {formatCount(noteText.length)} characters
                </span>
                <button
                  type="button"
                  onClick={() => analyzeText(noteText, inputLabel || 'Pasted clinical note')}
                  disabled={loading || !noteText.trim()}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-xs font-semibold text-white shadow-sm shadow-emerald-900/10 transition-colors hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {loading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                  {loading ? 'Analyzing note' : 'Analyze note'}
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-3 border-t border-zinc-100 pt-3 dark:border-zinc-800 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-[11px] leading-relaxed text-zinc-500 dark:text-zinc-400">
                Upload supports .txt only. Use de-identified text; do not include patient identifiers.
              </p>
              <div className="flex flex-col items-start gap-1 sm:items-end">
                <label className="inline-flex cursor-pointer items-center gap-2 text-xs text-zinc-600 dark:text-zinc-300">
                  <input
                    type="checkbox"
                    checked={includeSimilar}
                    onChange={(event) => setIncludeSimilar(event.target.checked)}
                    disabled={loading}
                    className="h-3.5 w-3.5 rounded border-zinc-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  Include similar reference notes
                </label>
                <p className="max-w-xs text-[10px] leading-relaxed text-zinc-500 dark:text-zinc-400">
                  Similar notes are examples from the MTSamples dataset, not the same patient or the same chart.
                </p>
              </div>
            </div>

            {error && (
              <div role="alert" className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700 dark:border-rose-800 dark:bg-rose-950/30 dark:text-rose-300">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}
          </div>
        </div>

        <aside className="flex flex-col rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300">
              <Activity className="h-4 w-4" />
            </span>
            <div>
              <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">What analysis returns</h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">Evidence to support review</p>
            </div>
          </div>

          <div className="mt-5 space-y-4">
            {[
              ['Clinical concepts', 'Problems, symptoms, medications, tests, anatomy and more'],
              ['Context modifiers', 'Flags negated, uncertain, historical and family-history mentions'],
              ['Reference retrieval', 'Optional similar notes from the MTSamples corpus'],
            ].map(([title, description]) => (
              <div key={title} className="flex gap-3">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                  <Check className="h-3 w-3" />
                </span>
                <div>
                  <p className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">{title}</p>
                  <p className="mt-0.5 text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">{description}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-auto pt-5">
            <p className="text-[11px] leading-relaxed text-zinc-500 dark:text-zinc-400">
              This page helps review clinical text structure and context. Similar notes are dataset examples, not the same patient record.
            </p>
          </div>
        </aside>
      </section>

      {result ? (
        <section className="space-y-5" aria-live="polite">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="mb-1 flex items-center gap-2">
                <h2 className="text-lg font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">2. Review extracted evidence</h2>
                <Badge variant="research" label="Model output" />
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                {resultLabel || 'Clinical note'} · {formatCount(result.word_count)} words analyzed
              </p>
            </div>
            <span className="text-[11px] text-zinc-400">
              {formatCount(result.entities.length)} extracted mentions
            </span>
          </div>

          {noteText.trim() !== result.original_text && (
            <div role="status" className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-800 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-200">
              <Info className="mt-0.5 h-4 w-4 shrink-0" />
              <span>The note has changed since this analysis. Results below are from the previous version; analyze again to refresh them.</span>
            </div>
          )}

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <SummaryCard
              icon={<FileText className="h-4 w-4" />}
              label="Clinical mentions"
              value={result.counts.total_entities}
              detail="Across recognized categories"
              tone="emerald"
            />
            <SummaryCard
              icon={<ShieldCheck className="h-4 w-4" />}
              label="Context flags"
              value={result.counts.negated_count + result.counts.uncertain_count + result.counts.historical_count + result.counts.family_history_count}
              detail={`${result.counts.negated_count} negated · ${result.counts.uncertain_count} uncertain`}
              tone="amber"
            />
            <SummaryCard
              icon={<Search className="h-4 w-4" />}
              label="Reference notes"
              value={result.similar_reports.length}
              detail="Similar MTSamples records returned"
              tone="sky"
            />
          </div>

          <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1.4fr)_minmax(280px,0.6fr)]">
            <div className="rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
              <div className="border-b border-zinc-100 px-5 py-4 dark:border-zinc-800">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Extracted mentions</h3>
                    <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                      Review the concept and how it was described in the note.
                    </p>
                  </div>
                  <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-[11px] font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                    {filteredEntities.length} shown
                  </span>
                </div>
                <div className="mt-4 flex gap-1.5 overflow-x-auto pb-1">
                  {ENTITY_FILTERS.map((filter) => {
                    const count = filter.key === 'ALL'
                      ? result.entities.length
                      : result.entities.filter((entity) => entity.status === filter.key).length;
                    return (
                      <button
                        key={filter.key}
                        type="button"
                        aria-pressed={entityFilter === filter.key}
                        onClick={() => setEntityFilter(filter.key)}
                        className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] font-medium transition-colors ${
                          entityFilter === filter.key
                            ? 'border-emerald-600 bg-emerald-600 text-white'
                            : 'border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:border-zinc-600'
                        }`}
                      >
                        {filter.label}
                        <span className={entityFilter === filter.key ? 'text-emerald-100' : 'text-zinc-400'}>
                          {count}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {filteredEntities.length ? (
                <div className="grid gap-2 p-4 sm:grid-cols-2">
                  {filteredEntities.map((entity, index) => (
                    <EntityCard key={`${entity.text}-${entity.category}-${index}`} entity={entity} />
                  ))}
                </div>
              ) : (
                <div className="px-5 py-10 text-center">
                  <p className="text-sm font-medium text-zinc-700 dark:text-zinc-200">No mentions in this filter</p>
                  <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">Choose another context filter to review findings.</p>
                </div>
              )}
            </div>

            <div className="space-y-5">
              <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
                <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Category breakdown</h3>
                <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">Number of extracted mentions by category</p>
                {categoryCounts.length ? (
                  <div className="mt-4 space-y-3">
                    {categoryCounts.map(({ label, count }) => {
                      const width = `${Math.max(8, (count / Math.max(result.counts.total_entities, 1)) * 100)}%`;
                      return (
                        <div key={label}>
                          <div className="mb-1 flex items-center justify-between text-xs">
                            <span className="text-zinc-600 dark:text-zinc-300">{label}</span>
                            <span className="font-medium tabular-nums text-zinc-800 dark:text-zinc-100">{count}</span>
                          </div>
                          <div className="h-1.5 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
                            <div className="h-full rounded-full bg-emerald-500" style={{ width }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="mt-4 text-xs text-zinc-500 dark:text-zinc-400">No clinical entities were extracted from this note.</p>
                )}
              </div>

              <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
                <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Context detected</h3>
                <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">Mentions marked by the model</p>
                <div className="mt-4 space-y-2">
                  <ContextCount label="Negated" count={result.counts.negated_count} status="NEGATED" />
                  <ContextCount label="Uncertain" count={result.counts.uncertain_count} status="UNCERTAIN" />
                  <ContextCount label="Historical" count={result.counts.historical_count} status="HISTORICAL" />
                  <ContextCount label="Family history" count={result.counts.family_history_count} status="FAMILY_HISTORY" />
                </div>
              </div>
            </div>
          </div>

          {includeSimilar && (
            <div className="rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
              <div className="flex items-start justify-between gap-3 border-b border-zinc-100 px-5 py-4 dark:border-zinc-800">
                <div>
                  <div className="flex items-center gap-2">
                    <Search className="h-4 w-4 text-sky-600 dark:text-sky-400" />
                    <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Similar reference notes</h3>
                  </div>
                  <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                    Retrieved from the MTSamples corpus · not patient-linked records
                  </p>
                </div>
                <Badge variant="research" label={`${result.similar_reports.length} matches`} />
              </div>
              {result.similar_reports.length ? (
                <div className="grid gap-3 p-4 md:grid-cols-2 xl:grid-cols-3">
                  {result.similar_reports.map((report) => (
                    <article key={report.record_id} className="rounded-xl border border-zinc-200 bg-zinc-50/70 p-4 dark:border-zinc-700 dark:bg-zinc-950/40">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <h4 className="truncate text-xs font-semibold text-zinc-900 dark:text-zinc-100">{report.sample_name}</h4>
                          <p className="mt-1 text-[10px] uppercase tracking-wide text-zinc-500 dark:text-zinc-400">{report.medical_specialty}</p>
                        </div>
                        <span className="shrink-0 rounded-lg bg-sky-100 px-2 py-1 text-[11px] font-semibold tabular-nums text-sky-800 dark:bg-sky-950/50 dark:text-sky-300">
                          {(report.similarity_score * 100).toFixed(1)}%
                        </span>
                      </div>
                      <p className="mt-3 line-clamp-3 text-xs leading-relaxed text-zinc-600 dark:text-zinc-400">{report.text_preview}</p>
                      <div className="mt-3 flex items-center justify-between border-t border-zinc-200/70 pt-2.5 text-[10px] text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
                        <span>{report.entity_count} indexed concepts</span>
                        <span>Dataset reference</span>
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <p className="px-5 py-6 text-sm text-zinc-500 dark:text-zinc-400">No similar reference notes were returned for this analysis.</p>
              )}
            </div>
          )}

          <p className="flex items-start gap-2 px-1 text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
            <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            Model-generated evidence only. Use it as a clinical review aid, not a diagnosis.
          </p>
        </section>
      ) : (
        <section className="rounded-2xl border border-dashed border-zinc-300 bg-white/70 px-6 py-8 text-center dark:border-zinc-700 dark:bg-zinc-900/40">
          <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
            <Sparkles className="h-5 w-5" />
          </div>
          <h2 className="mt-3 text-sm font-semibold text-zinc-800 dark:text-zinc-100">Analysis will appear here</h2>
          <p className="mx-auto mt-1 max-w-md text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
            Add a de-identified note and select <strong className="font-semibold text-zinc-700 dark:text-zinc-300">Analyze note</strong> to review extracted concepts and context.
          </p>
        </section>
      )}
    </div>
  );
};

interface SummaryCardProps {
  icon: React.ReactNode;
  label: string;
  value: number;
  detail: string;
  tone: 'emerald' | 'amber' | 'sky';
}

const SummaryCard: React.FC<SummaryCardProps> = ({ icon, label, value, detail, tone }) => {
  const tones = {
    emerald: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300',
    amber: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300',
    sky: 'bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300',
  };

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex items-center gap-2">
        <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${tones[tone]}`}>{icon}</span>
        <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">{label}</span>
      </div>
      <div className="mt-3 text-2xl font-semibold tracking-tight tabular-nums text-zinc-900 dark:text-zinc-50">{formatCount(value)}</div>
      <p className="mt-1 text-[11px] text-zinc-500 dark:text-zinc-400">{detail}</p>
    </div>
  );
};

const EntityCard: React.FC<{ entity: ExtractedEntity }> = ({ entity }) => (
  <article className="rounded-xl border border-zinc-200 bg-white p-3.5 dark:border-zinc-800 dark:bg-zinc-950/40">
    <div className="flex flex-wrap items-start justify-between gap-2">
      <p className="text-sm font-medium leading-snug text-zinc-900 dark:text-zinc-100">{entity.text}</p>
      <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${STATUS_STYLES[entity.status] ?? 'border-zinc-200 bg-zinc-100 text-zinc-600 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300'}`}>
        {getStatusLabel(entity.status)}
      </span>
    </div>
    <div className="mt-2.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[10px] text-zinc-500 dark:text-zinc-400">
      <span className="rounded bg-zinc-100 px-1.5 py-0.5 font-medium uppercase tracking-wide dark:bg-zinc-800">
        {entity.category.split('_').join(' ')}
      </span>
      <span>Model confidence {(entity.confidence * 100).toFixed(0)}%</span>
      {entity.trigger_word && <span>Context: “{entity.trigger_word}”</span>}
    </div>
  </article>
);

const ContextCount: React.FC<{ label: string; count: number; status: string }> = ({ label, count, status }) => (
  <div className="flex items-center justify-between gap-3 rounded-lg bg-zinc-50 px-3 py-2 dark:bg-zinc-950/50">
    <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${STATUS_STYLES[status]}`}>
      {label}
    </span>
    <span className="text-sm font-semibold tabular-nums text-zinc-800 dark:text-zinc-100">{formatCount(count)}</span>
  </div>
);

export default NLPView;
