import React, { useState, useEffect } from 'react';
import { FolderHeart } from 'lucide-react';
import { casesApi } from '../api/client';
import { SafetyDisclaimer } from '../components/SafetyDisclaimer';
import { Badge } from '../components/Badge';

export const CasesView: React.FC = () => {
  const [cases, setCases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCase, setSelectedCase] = useState<any | null>(null);
  const [filterType, setFilterType] = useState<string>('ALL');
  const [filterLevel, setFilterLevel] = useState<string>('ALL');

  const [page, setPage] = useState(0);

  useEffect(() => {
    loadCases();
  }, [filterType, filterLevel, page]);

  const loadCases = async () => {
    try {
      setLoading(true);
      const caseType = filterType === 'ALL' ? undefined : filterType;
      const level = filterLevel === 'ALL' ? undefined : filterLevel;
      const data = await casesApi.listCases(50, page * 50, caseType, level);
      setCases(data);
    } catch (err) {
      console.error('Failed to load cases:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleInspectCase = async (caseId: string) => {
    try {
      const detail = await casesApi.getCaseDetail(caseId);
      setSelectedCase(detail);
    } catch (err) {
      console.error('Failed to inspect case:', err);
    }
  };

  const filteredCases = cases.filter((c) => {
    const idMatch = (c.patient_identifier || c.id || '').toLowerCase().includes(searchQuery.toLowerCase());
    const condMatch = (c.primary_condition || '').toLowerCase().includes(searchQuery.toLowerCase());
    return idMatch || condMatch;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <SafetyDisclaimer />

      <div className="flex items-center gap-3">
        <h1 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
          Case Registry
        </h1>
        <span className="text-sm text-zinc-500 dark:text-zinc-400">Audit trail of clinical consultations</span>
      </div>

      <div className="flex flex-wrap gap-4 items-center bg-white dark:bg-zinc-900 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
        >
          <option value="ALL">All Types</option>
          <option value="LIVE_ANALYSIS">Live Cases</option>
          <option value="SYNTHETIC_DEMONSTRATION">Synthetic Cases</option>
        </select>
        
        <select
          value={filterLevel}
          onChange={(e) => setFilterLevel(e.target.value)}
          className="rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
        >
          <option value="ALL">All Evidence Levels</option>
          <option value="HIGH">High Evidence</option>
          <option value="MODERATE">Moderate Evidence</option>
          <option value="LOW">Low Evidence</option>
        </select>

        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search ID or condition..."
          className="rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-600 text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 flex-1"
        />
      </div>

      <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm overflow-hidden">
        {filteredCases.length === 0 ? (
          <div className="p-12 flex flex-col items-center justify-center text-center">
            <FolderHeart className="w-12 h-12 text-zinc-300 dark:text-zinc-600 mb-4" />
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              {loading ? 'Loading cases...' : 'No cases found matching your criteria.'}
            </p>
          </div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="bg-zinc-50 dark:bg-zinc-900/50 border-b border-zinc-200 dark:border-zinc-800">
              <tr>
                <th className="py-3 px-4 text-xs font-medium tracking-widest uppercase text-zinc-400 dark:text-zinc-600">Case ID</th>
                <th className="py-3 px-4 text-xs font-medium tracking-widest uppercase text-zinc-400 dark:text-zinc-600">Type</th>
                <th className="py-3 px-4 text-xs font-medium tracking-widest uppercase text-zinc-400 dark:text-zinc-600">Evidence Level</th>
                <th className="py-3 px-4 text-xs font-medium tracking-widest uppercase text-zinc-400 dark:text-zinc-600">Modalities</th>
                <th className="py-3 px-4 text-xs font-medium tracking-widest uppercase text-zinc-400 dark:text-zinc-600">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {filteredCases.map((c, i) => (
                <tr 
                  key={c.id} 
                  onClick={() => handleInspectCase(c.id)}
                  className={`cursor-pointer transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/50 ${i % 2 === 0 ? 'bg-white dark:bg-zinc-900' : 'bg-zinc-50/50 dark:bg-zinc-900/80'}`}
                >
                  <td className="py-3 px-4 text-zinc-900 dark:text-zinc-100 font-medium">{c.patient_identifier || c.id}</td>
                  <td className="py-3 px-4">
                    {c.is_synthetic ? <Badge variant="synthetic" /> : <Badge variant="operational" label="Live" />}
                  </td>
                  <td className="py-3 px-4 text-zinc-600 dark:text-zinc-400">{c.evidence_level || 'MODERATE'}</td>
                  <td className="py-3 px-4 text-zinc-600 dark:text-zinc-400">{c.modalities_present ? c.modalities_present.join(', ') : 'Clinical'}</td>
                  <td className="py-3 px-4 text-zinc-600 dark:text-zinc-400">{c.created_at ? new Date(c.created_at).toLocaleDateString() : '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-zinc-50 dark:bg-zinc-900/50">
          <button 
            disabled={page === 0}
            onClick={() => setPage(p => Math.max(0, p - 1))}
            className="px-4 py-2 rounded-md border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-sm font-medium transition-colors duration-150 disabled:opacity-50"
          >
            Previous
          </button>
          <span className="text-sm text-zinc-600 dark:text-zinc-400">Page {page + 1}</span>
          <button 
            onClick={() => setPage(p => p + 1)}
            disabled={filteredCases.length < 50}
            className="px-4 py-2 rounded-md border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-sm font-medium transition-colors duration-150 disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>

      {selectedCase && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">Case Details</h2>
              <button onClick={() => setSelectedCase(null)} className="text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300">Close</button>
            </div>
            <div className="space-y-4">
              <div>
                <div className="text-xs font-medium tracking-widest uppercase text-zinc-400 dark:text-zinc-600 mb-1">ID</div>
                <div className="text-sm text-zinc-900 dark:text-zinc-100">{selectedCase.patient_identifier || selectedCase.id}</div>
              </div>
              <div>
                <div className="text-xs font-medium tracking-widest uppercase text-zinc-400 dark:text-zinc-600 mb-1">Condition</div>
                <div className="text-sm text-zinc-900 dark:text-zinc-100">{selectedCase.primary_condition || 'N/A'}</div>
              </div>
              <div>
                <div className="text-xs font-medium tracking-widest uppercase text-zinc-400 dark:text-zinc-600 mb-1">Clinical Input</div>
                <div className="text-sm text-zinc-600 dark:text-zinc-400">{selectedCase.clinical_input?.symptoms?.join(', ') || 'N/A'}</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
