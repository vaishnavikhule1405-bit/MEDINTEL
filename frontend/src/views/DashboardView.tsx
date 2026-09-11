import React, { useEffect, useState } from 'react';
import { NavTab } from '../types';
import { analyticsApi, casesApi } from '../api/client';
import { SafetyDisclaimer } from '../components/SafetyDisclaimer';
import { Badge } from '../components/Badge';
import { Stethoscope, Image as ImageIcon, FileText, Network, FolderHeart, Activity } from 'lucide-react';

interface DashboardViewProps {
  setActiveTab: (tab: NavTab) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ setActiveTab }) => {
  const [analytics, setAnalytics] = useState<any>(null);
  const [recentCases, setRecentCases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboard() {
      try {
        setLoading(true);
        const [summaryData, casesData] = await Promise.all([
          analyticsApi.getSummary().catch(() => null),
          casesApi.listCases(5, 0).catch(() => []),
        ]);
        if (summaryData) setAnalytics(summaryData);
        if (casesData) setRecentCases(casesData);
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadDashboard();
  }, []);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Section 1: Welcome strip */}
      <div className="w-full">
        <h1 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
          Multimodal Clinical Intelligence
        </h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed mb-4">
          AI-Assisted Decision Support Research Platform
        </p>
        <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-zinc-600 dark:text-zinc-400">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>All systems operational
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>Clinical
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>Imaging
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-500"></span>NLP
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-500"></span>Fusion
          </div>
        </div>
      </div>

      {/* Section 2: Active AI Modules */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div 
          onClick={() => setActiveTab('clinical')}
          className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 cursor-pointer hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors duration-150"
        >
          <div className="flex items-start justify-between mb-3">
            <Stethoscope className="w-5 h-5 text-zinc-700 dark:text-zinc-300" />
            <Badge variant="operational" />
          </div>
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-1">Clinical Assessment</h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">XGBoost · 37 classes · 174 symptoms</p>
        </div>

        <div 
          onClick={() => setActiveTab('imaging')}
          className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 cursor-pointer hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors duration-150"
        >
          <div className="flex items-start justify-between mb-3">
            <ImageIcon className="w-5 h-5 text-zinc-700 dark:text-zinc-300" />
            <Badge variant="operational" />
          </div>
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-1">Chest X-Ray</h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">Custom CNN · 84.46% acc · Grad-CAM</p>
        </div>

        <div 
          className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 cursor-pointer hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors duration-150"
        >
          <div className="flex items-start justify-between mb-3">
            <FileText className="w-5 h-5 text-zinc-700 dark:text-zinc-300" />
            <Badge variant="development" label="In Development" />
          </div>
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-1">Medical NLP</h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">BioBERT NER · Semantic Retrieval</p>
        </div>

        <div 
          className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 cursor-pointer hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors duration-150"
        >
          <div className="flex items-start justify-between mb-3">
            <Network className="w-5 h-5 text-zinc-700 dark:text-zinc-300" />
            <Badge variant="development" label="In Development" />
          </div>
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-1">Evidence Fusion</h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">Trimodal Fusion · Concordance</p>
        </div>
      </div>

      {/* Section 3: Performance + Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">Performance Snapshot</h2>
            <button 
              onClick={() => setActiveTab('model-info')}
              className="text-xs font-medium text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
            >
              View detailed benchmarks →
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-zinc-600 dark:text-zinc-400">
              <thead className="text-xs font-medium tracking-widest uppercase text-zinc-400 dark:text-zinc-600 border-b border-zinc-200 dark:border-zinc-800">
                <tr>
                  <th className="pb-3 font-medium">Model</th>
                  <th className="pb-3 font-medium">Modality</th>
                  <th className="pb-3 font-medium text-right">Accuracy</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/50">
                <tr>
                  <td className="py-3 font-medium text-zinc-900 dark:text-zinc-100">XGBoost</td>
                  <td className="py-3">Clinical</td>
                  <td className="py-3 text-right font-medium">67.57%</td>
                </tr>
                <tr>
                  <td className="py-3 font-medium text-zinc-900 dark:text-zinc-100">Custom CNN</td>
                  <td className="py-3">Imaging</td>
                  <td className="py-3 text-right font-medium">84.46%</td>
                </tr>
                <tr>
                  <td className="py-3 font-medium text-zinc-900 dark:text-zinc-100">DenseNet121</td>
                  <td className="py-3">Imaging</td>
                  <td className="py-3 text-right font-medium">82.53%</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        
        <div className="lg:col-span-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-sm flex flex-col">
          <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 mb-4">Quick Actions</h2>
          <div className="flex flex-col gap-3 mt-auto">
            <button 
              onClick={() => setActiveTab('clinical')}
              className="w-full px-4 py-2 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium transition-colors duration-150 flex items-center justify-center gap-2"
            >
              <Stethoscope className="w-4 h-4" />
              Run Clinical Assessment
            </button>
            <button 
              onClick={() => setActiveTab('imaging')}
              className="w-full px-4 py-2 rounded-md border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-sm font-medium transition-colors duration-150 flex items-center justify-center gap-2"
            >
              <ImageIcon className="w-4 h-4" />
              Analyze X-Ray
            </button>
            <button 
              onClick={() => setActiveTab('model-info')}
              className="w-full px-4 py-2 rounded-md border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-sm font-medium transition-colors duration-150 flex items-center justify-center gap-2"
            >
              <Activity className="w-4 h-4" />
              View Explainability
            </button>
          </div>
        </div>
      </div>

      {/* Section 4: Recent Cases */}
      <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">Recent Cases</h2>
        </div>
        
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-12 bg-zinc-100 dark:bg-zinc-800 rounded animate-pulse w-full"></div>
            ))}
          </div>
        ) : recentCases && recentCases.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-zinc-600 dark:text-zinc-400">
              <thead className="text-xs font-medium tracking-widest uppercase text-zinc-400 dark:text-zinc-600 border-b border-zinc-200 dark:border-zinc-800">
                <tr>
                  <th className="pb-3 font-medium">Identifier</th>
                  <th className="pb-3 font-medium">Primary Condition</th>
                  <th className="pb-3 font-medium">Evidence Level</th>
                  <th className="pb-3 font-medium text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/50">
                {recentCases.map((c) => (
                  <tr key={c.id}>
                    <td className="py-3 font-medium text-zinc-900 dark:text-zinc-100">{c.patient_identifier || c.id}</td>
                    <td className="py-3">{c.primary_condition || 'Respiratory Assessment'}</td>
                    <td className="py-3">
                      <span className="text-xs font-medium px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700">
                        {c.evidence_level || 'MODERATE'}
                      </span>
                    </td>
                    <td className="py-3 text-right">
                      <button 
                        onClick={() => setActiveTab('cases')}
                        className="text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-12 flex flex-col items-center justify-center text-zinc-500 dark:text-zinc-400">
            <FolderHeart className="w-8 h-8 mb-3 text-zinc-400 dark:text-zinc-600" />
            <p className="text-sm">No cases yet — start a clinical assessment</p>
          </div>
        )}
      </div>

      <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800">
        <SafetyDisclaimer />
      </div>
    </div>
  );
};
