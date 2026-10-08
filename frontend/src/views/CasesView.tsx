import React, { useEffect, useState } from 'react';
import { FolderHeart, LoaderCircle, RefreshCw, X } from 'lucide-react';
import { casesApi } from '../api/client';
import { SafetyDisclaimer } from '../components/SafetyDisclaimer';
import { Badge } from '../components/Badge';

const PAGE_SIZE = 50;

interface CaseListRecord {
  id: string;
  case_number?: string | null;
  case_type: string;
  patient_identifier?: string | null;
  title: string;
  primary_condition?: string | null;
  overall_evidence_index: number;
  evidence_level: string;
  cross_modality_relationship: string;
  created_at: string;
  modalities_present: string[];
}

interface CaseDetailRecord extends CaseListRecord {
  case_number?: string | null;
  patient_age?: number | null;
  patient_sex?: string | null;
  clinical_data?: {
    predicted_disease?: string;
    confidence?: number;
    symptoms?: string[];
  } | null;
  imaging_data?: {
    predicted_class?: string;
    normal_probability?: number;
    pneumonia_probability?: number;
    confidence?: number;
  } | null;
  nlp_data?: {
    word_count?: number;
    entities_count?: number;
    negated_count?: number;
    uncertain_count?: number;
  } | null;
  multimodal_data?: {
    overall_evidence_index?: number;
    evidence_level?: string;
    cross_modality_relationship?: string;
    modality_contributions?: Record<string, number>;
  } | null;
  assistant_interactions: Array<{
    user_message?: string;
    assistant_response?: string;
    created_at?: string;
  }>;
}

const formatPercent = (value?: number) =>
  typeof value === 'number' ? `${(value * 100).toFixed(1)}%` : 'Not available';

const getErrorMessage = (error: unknown) =>
  error instanceof Error ? error.message : 'An unexpected error occurred.';

export const CasesView: React.FC = () => {
  const [cases, setCases] = useState<CaseListRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCase, setSelectedCase] = useState<CaseDetailRecord | null>(null);
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [filterType, setFilterType] = useState('ALL');
  const [filterLevel, setFilterLevel] = useState('ALL');
  const [page, setPage] = useState(0);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let active = true;

    const loadCases = async () => {
      setLoading(true);
      setError(null);
      try {
        const caseType = filterType === 'ALL' ? undefined : filterType;
        const level = filterLevel === 'ALL' ? undefined : filterLevel;
        const data = await casesApi.listCases(
          PAGE_SIZE + 1,
          page * PAGE_SIZE,
          caseType,
          level,
          searchQuery.trim() || undefined,
        );
        if (active) {
          setCases(data.slice(0, PAGE_SIZE));
          setHasNextPage(data.length > PAGE_SIZE);
        }
      } catch (err) {
        if (active) {
          setCases([]);
          setHasNextPage(false);
          setError(getErrorMessage(err));
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    void loadCases();
    return () => {
      active = false;
    };
  }, [filterType, filterLevel, page, searchQuery, reloadKey]);

  const handleInspectCase = async (caseId: string) => {
    setSelectedCaseId(caseId);
    setSelectedCase(null);
    setDetailError(null);
    setDetailLoading(true);
    try {
      const detail = await casesApi.getCaseDetail(caseId);
      setSelectedCase(detail);
    } catch (err) {
      setDetailError(getErrorMessage(err));
    } finally {
      setDetailLoading(false);
    }
  };

  const closeDetails = () => {
    setSelectedCaseId(null);
    setSelectedCase(null);
    setDetailError(null);
  };

  const resetPage = () => setPage(0);

  return (
    <div className="space-y-6 animate-fade-in">
      <SafetyDisclaimer />

      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
          Case Registry
        </h1>
        <span className="text-sm text-zinc-500 dark:text-zinc-400">
          Saved case records and their analysis details
        </span>
      </div>

      <div className="flex flex-wrap gap-4 items-center bg-white dark:bg-zinc-900 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
        <select
          value={filterType}
          onChange={(event) => {
            setFilterType(event.target.value);
            resetPage();
          }}
          aria-label="Filter by case type"
          className="rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
        >
          <option value="ALL">All Types</option>
          <option value="LIVE_ANALYSIS">Live Cases</option>
          <option value="SYNTHETIC_DEMONSTRATION">Synthetic Cases</option>
        </select>

        <select
          value={filterLevel}
          onChange={(event) => {
            setFilterLevel(event.target.value);
            resetPage();
          }}
          aria-label="Filter by evidence level"
          className="rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
        >
          <option value="ALL">All Evidence Levels</option>
          <option value="HIGH">High Evidence</option>
          <option value="MODERATE">Moderate Evidence</option>
          <option value="LOW">Low Evidence</option>
        </select>

        <input
          type="search"
          value={searchQuery}
          onChange={(event) => {
            setSearchQuery(event.target.value);
            resetPage();
          }}
          placeholder="Search case ID, patient, title, or condition..."
          aria-label="Search cases"
          className="rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-600 text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 flex-1 min-w-60"
        />
      </div>

      {error && (
        <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
          <span>Could not load cases: {error}</span>
          <button
            type="button"
            onClick={() => setReloadKey((currentKey) => currentKey + 1)}
            className="inline-flex items-center gap-2 font-medium underline"
          >
            <RefreshCw size={14} />
            Retry
          </button>
        </div>
      )}

      <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 flex items-center justify-center gap-3 text-sm text-zinc-500 dark:text-zinc-400" role="status">
            <LoaderCircle className="h-5 w-5 animate-spin" />
            Loading cases...
          </div>
        ) : error ? null : cases.length === 0 ? (
          <div className="p-12 flex flex-col items-center justify-center text-center">
            <FolderHeart className="w-12 h-12 text-zinc-300 dark:text-zinc-600 mb-4" />
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              {searchQuery.trim() || filterType !== 'ALL' || filterLevel !== 'ALL'
                ? 'No cases match your search or filters.'
                : 'There are no saved cases yet.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-zinc-50 dark:bg-zinc-900/50 border-b border-zinc-200 dark:border-zinc-800">
                <tr>
                  <th className="py-3 px-4 text-xs font-medium tracking-widest uppercase text-zinc-400 dark:text-zinc-500">Case ID</th>
                  <th className="py-3 px-4 text-xs font-medium tracking-widest uppercase text-zinc-400 dark:text-zinc-500">Type</th>
                  <th className="py-3 px-4 text-xs font-medium tracking-widest uppercase text-zinc-400 dark:text-zinc-500">Evidence Level</th>
                  <th className="py-3 px-4 text-xs font-medium tracking-widest uppercase text-zinc-400 dark:text-zinc-500">Available Information</th>
                  <th className="py-3 px-4 text-xs font-medium tracking-widest uppercase text-zinc-400 dark:text-zinc-500">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                {cases.map((caseRecord, index) => (
                  <tr
                    key={caseRecord.id}
                    onClick={() => void handleInspectCase(caseRecord.id)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        void handleInspectCase(caseRecord.id);
                      }
                    }}
                    tabIndex={0}
                    aria-label={`Open case ${caseRecord.case_number || caseRecord.id}`}
                    className={`cursor-pointer transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-emerald-500 ${index % 2 === 0 ? 'bg-white dark:bg-zinc-900' : 'bg-zinc-50/50 dark:bg-zinc-900/80'}`}
                  >
                    <td className="py-3 px-4 text-zinc-900 dark:text-zinc-100 font-medium">
                      {caseRecord.case_number || caseRecord.id}
                    </td>
                    <td className="py-3 px-4">
                      {caseRecord.case_type === 'SYNTHETIC_DEMONSTRATION' ? (
                        <Badge variant="synthetic" />
                      ) : caseRecord.case_type === 'LIVE_ANALYSIS' ? (
                        <Badge variant="operational" label="Live" />
                      ) : (
                        <span className="text-zinc-500 dark:text-zinc-400">Unknown</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-zinc-600 dark:text-zinc-400">
                      {caseRecord.evidence_level || 'Not available'}
                    </td>
                    <td className="py-3 px-4 text-zinc-600 dark:text-zinc-400">
                      {caseRecord.modalities_present.length
                        ? caseRecord.modalities_present.join(', ')
                        : 'No analysis details'}
                    </td>
                    <td className="py-3 px-4 text-zinc-600 dark:text-zinc-400">
                      {caseRecord.created_at
                        ? new Date(caseRecord.created_at).toLocaleDateString()
                        : 'Not available'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-zinc-50 dark:bg-zinc-900/50">
          <button
            disabled={page === 0 || loading}
            onClick={() => setPage((currentPage) => Math.max(0, currentPage - 1))}
            className="px-4 py-2 rounded-md border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-sm font-medium transition-colors duration-150 disabled:opacity-50"
          >
            Previous
          </button>
          <span className="text-sm text-zinc-600 dark:text-zinc-400">Page {page + 1}</span>
          <button
            onClick={() => setPage((currentPage) => currentPage + 1)}
            disabled={!hasNextPage || loading}
            className="px-4 py-2 rounded-md border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-sm font-medium transition-colors duration-150 disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>

      {selectedCaseId && (
        <div
          className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
          onClick={closeDetails}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="case-detail-title"
            className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto space-y-6"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-4">
              <h2 id="case-detail-title" className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
                Case Details
              </h2>
              <button
                type="button"
                onClick={closeDetails}
                aria-label="Close case details"
                className="rounded-md p-1 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
              >
                <X size={20} />
              </button>
            </div>

            {detailLoading ? (
              <div role="status" className="flex items-center justify-center gap-3 py-10 text-sm text-zinc-500 dark:text-zinc-400">
                <LoaderCircle className="h-5 w-5 animate-spin" />
                Loading case details...
              </div>
            ) : detailError ? (
              <p role="alert" className="text-sm text-red-700 dark:text-red-300">
                Could not load this case: {detailError}
              </p>
            ) : selectedCase ? (
              <div className="space-y-5 text-sm">
                <section className="space-y-2">
                  <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">
                    {selectedCase.title || 'Case'}
                  </h3>
                  <p className="text-zinc-600 dark:text-zinc-400">
                    ID: {selectedCase.case_number || selectedCase.id}
                  </p>
                  <p className="text-zinc-600 dark:text-zinc-400">
                    Type: {selectedCase.case_type === 'SYNTHETIC_DEMONSTRATION'
                      ? 'Synthetic demonstration'
                      : selectedCase.case_type === 'LIVE_ANALYSIS'
                        ? 'Live analysis'
                        : 'Unknown'}
                  </p>
                  <p className="text-zinc-600 dark:text-zinc-400">
                    Patient: {selectedCase.patient_identifier || 'Not provided'}
                    {selectedCase.patient_age != null ? ` · Age ${selectedCase.patient_age}` : ''}
                    {selectedCase.patient_sex ? ` · ${selectedCase.patient_sex}` : ''}
                  </p>
                  <p className="text-zinc-600 dark:text-zinc-400">
                    Condition: {selectedCase.primary_condition || 'Not available'}
                  </p>
                  <p className="text-zinc-600 dark:text-zinc-400">
                    Evidence level: {selectedCase.evidence_level || 'Not available'}
                    {' · '}Evidence index: {typeof selectedCase.overall_evidence_index === 'number'
                      ? selectedCase.overall_evidence_index.toFixed(2)
                      : 'Not available'}
                  </p>
                  <p className="text-zinc-600 dark:text-zinc-400">
                    Created: {selectedCase.created_at
                      ? new Date(selectedCase.created_at).toLocaleString()
                      : 'Not available'}
                  </p>
                </section>

                {selectedCase.clinical_data && (
                  <section className="space-y-1 border-t border-zinc-200 pt-4 dark:border-zinc-800">
                    <h3 className="font-medium text-zinc-900 dark:text-zinc-100">Clinical</h3>
                    <p className="text-zinc-600 dark:text-zinc-400">
                      Prediction: {selectedCase.clinical_data.predicted_disease || 'Not available'}
                      {' · '}Confidence: {formatPercent(selectedCase.clinical_data.confidence)}
                    </p>
                    <p className="text-zinc-600 dark:text-zinc-400">
                      Symptoms: {selectedCase.clinical_data.symptoms?.length
                        ? selectedCase.clinical_data.symptoms.join(', ')
                        : 'Not recorded'}
                    </p>
                  </section>
                )}

                {selectedCase.imaging_data && (
                  <section className="space-y-1 border-t border-zinc-200 pt-4 dark:border-zinc-800">
                    <h3 className="font-medium text-zinc-900 dark:text-zinc-100">X-ray</h3>
                    <p className="text-zinc-600 dark:text-zinc-400">
                      Prediction: {selectedCase.imaging_data.predicted_class || 'Not available'}
                      {' · '}Confidence: {formatPercent(selectedCase.imaging_data.confidence)}
                    </p>
                    <p className="text-zinc-600 dark:text-zinc-400">
                      Normal: {formatPercent(selectedCase.imaging_data.normal_probability)}
                      {' · '}Pneumonia: {formatPercent(selectedCase.imaging_data.pneumonia_probability)}
                    </p>
                  </section>
                )}

                {selectedCase.nlp_data && (
                  <section className="space-y-1 border-t border-zinc-200 pt-4 dark:border-zinc-800">
                    <h3 className="font-medium text-zinc-900 dark:text-zinc-100">Medical report</h3>
                    <p className="text-zinc-600 dark:text-zinc-400">
                      {selectedCase.nlp_data.entities_count ?? 0} extracted items
                      {' · '}{selectedCase.nlp_data.word_count ?? 0} words
                      {' · '}{selectedCase.nlp_data.negated_count ?? 0} negated
                      {' · '}{selectedCase.nlp_data.uncertain_count ?? 0} uncertain
                    </p>
                  </section>
                )}

                {selectedCase.multimodal_data && (
                  <section className="space-y-1 border-t border-zinc-200 pt-4 dark:border-zinc-800">
                    <h3 className="font-medium text-zinc-900 dark:text-zinc-100">Fusion summary</h3>
                    <p className="text-zinc-600 dark:text-zinc-400">
                      {selectedCase.multimodal_data.evidence_level || 'Not available'}
                      {' · '}{selectedCase.multimodal_data.cross_modality_relationship || 'Relationship not available'}
                    </p>
                  </section>
                )}

                {selectedCase.assistant_interactions.length > 0 && (
                  <section className="space-y-2 border-t border-zinc-200 pt-4 dark:border-zinc-800">
                    <h3 className="font-medium text-zinc-900 dark:text-zinc-100">Assistant conversations</h3>
                    {selectedCase.assistant_interactions.map((interaction, index) => (
                      <div key={`${interaction.created_at || 'interaction'}-${index}`} className="space-y-1 rounded-lg bg-zinc-50 p-3 dark:bg-zinc-800/50">
                        <p className="text-zinc-700 dark:text-zinc-300">
                          You: {interaction.user_message || 'Message not available'}
                        </p>
                        <p className="text-zinc-600 dark:text-zinc-400">
                          Assistant: {interaction.assistant_response || 'Response not available'}
                        </p>
                      </div>
                    ))}
                  </section>
                )}
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
};
