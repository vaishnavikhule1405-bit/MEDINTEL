import React, { useEffect, useState } from 'react';
import { NavTab } from '../types';
import { analyticsApi, casesApi } from '../api/client';
import { SafetyDisclaimer } from '../components/SafetyDisclaimer';
import { Badge } from '../components/Badge';
import { Stethoscope, Image as ImageIcon, FileText, Network, FolderHeart, Activity, ArrowRight, ShieldCheck } from 'lucide-react';

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
    <div className="space-y-8 animate-fade-in">
      {/* Section 1: Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-zinc-200 dark:border-zinc-800">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
              Multimodal Clinical Intelligence
            </h1>
            <span className="text-2xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
              v1.0.0
            </span>
          </div>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            AI-Assisted Decision Support Research & Clinical Evaluation Platform
          </p>
        </div>

        {/* System Health Indicators */}
        <div className="flex flex-wrap items-center gap-3 text-xs font-semibold text-zinc-600 dark:text-zinc-400 bg-white dark:bg-zinc-900 px-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-zinc-900 dark:text-zinc-100 font-medium">All Modules Online</span>
          </div>
          <span className="text-zinc-300 dark:text-zinc-700">•</span>
          <div className="flex items-center gap-1 text-zinc-600 dark:text-zinc-400">
            <Stethoscope className="w-3.5 h-3.5 text-emerald-500" /> Clinical ML
          </div>
          <div className="flex items-center gap-1 text-zinc-600 dark:text-zinc-400">
            <ImageIcon className="w-3.5 h-3.5 text-emerald-500" /> Imaging CNN
          </div>
        </div>
      </div>

      {/* Section 2: Active AI Modules Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <div 
          onClick={() => setActiveTab('clinical')}
          className="group rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 cursor-pointer hover:border-emerald-500/50 dark:hover:border-emerald-500/50 hover:shadow-lg transition-all duration-200"
        >
          <div className="flex items-start justify-between mb-4">
            <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 group-hover:bg-emerald-500 group-hover:text-white transition-colors">
              <Stethoscope className="w-5 h-5" />
            </div>
            <Badge variant="operational" />
          </div>
          <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100 mb-1 flex items-center justify-between">
            Clinical Assessment
            <ArrowRight className="w-4 h-4 text-zinc-400 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
          </h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">XGBoost · 37 classes · 174 symptom vectors</p>
        </div>

        <div 
          onClick={() => setActiveTab('imaging')}
          className="group rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 cursor-pointer hover:border-emerald-500/50 dark:hover:border-emerald-500/50 hover:shadow-lg transition-all duration-200"
        >
          <div className="flex items-start justify-between mb-4">
            <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 group-hover:bg-emerald-500 group-hover:text-white transition-colors">
              <ImageIcon className="w-5 h-5" />
            </div>
            <Badge variant="operational" />
          </div>
          <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100 mb-1 flex items-center justify-between">
            Chest X-Ray
            <ArrowRight className="w-4 h-4 text-zinc-400 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
          </h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">Custom CNN · 84.46% accuracy · Grad-CAM</p>
        </div>

        <div 
          onClick={() => setActiveTab('nlp')}
          className="group rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 cursor-pointer hover:border-amber-500/50 dark:hover:border-amber-500/50 hover:shadow-lg transition-all duration-200"
        >
          <div className="flex items-start justify-between mb-4">
            <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 group-hover:bg-amber-500 group-hover:text-white transition-colors">
              <FileText className="w-5 h-5" />
            </div>
            <Badge variant="development" label="In Development" />
          </div>
          <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100 mb-1 flex items-center justify-between">
            Medical NLP
            <ArrowRight className="w-4 h-4 text-zinc-400 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
          </h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">BioBERT NER · S-PubMedBERT Semantic Index</p>
        </div>

        <div 
          onClick={() => setActiveTab('fusion')}
          className="group rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 cursor-pointer hover:border-amber-500/50 dark:hover:border-amber-500/50 hover:shadow-lg transition-all duration-200"
        >
          <div className="flex items-start justify-between mb-4">
            <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 group-hover:bg-amber-500 group-hover:text-white transition-colors">
              <Network className="w-5 h-5" />
            </div>
            <Badge variant="development" label="In Development" />
          </div>
          <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100 mb-1 flex items-center justify-between">
            Evidence Fusion
            <ArrowRight className="w-4 h-4 text-zinc-400 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
          </h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">Late Fusion Engine · Concordance Index</p>
        </div>
      </div>

      {/* Section 3: Performance Snapshot + Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100">Model Performance Summary</h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">Validated accuracy benchmarks across model architecture types</p>
            </div>
            <button 
              onClick={() => setActiveTab('model-info')}
              className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
            >
              Detailed Benchmarks →
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-zinc-600 dark:text-zinc-400">
              <thead className="text-2xs font-bold tracking-widest uppercase text-zinc-400 dark:text-zinc-500 border-b border-zinc-200 dark:border-zinc-800">
                <tr>
                  <th className="pb-3 font-semibold">Model Architecture</th>
                  <th className="pb-3 font-semibold">Modality</th>
                  <th className="pb-3 font-semibold text-right">Test Accuracy</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
                <tr>
                  <td className="py-3 font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    XGBoost Classifier
                  </td>
                  <td className="py-3 text-xs font-medium">Clinical Symptoms</td>
                  <td className="py-3 text-right font-bold text-zinc-900 dark:text-zinc-100">67.57%</td>
                </tr>
                <tr>
                  <td className="py-3 font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    Custom 4-Block CNN
                  </td>
                  <td className="py-3 text-xs font-medium">Chest Radiographs</td>
                  <td className="py-3 text-right font-bold text-emerald-600 dark:text-emerald-400">84.46%</td>
                </tr>
                <tr>
                  <td className="py-3 font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-zinc-400" />
                    DenseNet121 Baseline
                  </td>
                  <td className="py-3 text-xs font-medium">Chest Radiographs</td>
                  <td className="py-3 text-right font-bold text-zinc-900 dark:text-zinc-100">82.53%</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Quick Launch Panel */}
        <div className="lg:col-span-2 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-sm flex flex-col justify-between space-y-6">
          <div>
            <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100 mb-1">Quick Clinical Launch</h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">Initiate diagnostic assessment or view model explainability</p>
          </div>

          <div className="space-y-3">
            <button 
              onClick={() => setActiveTab('clinical')}
              className="w-full px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold transition-all shadow-md shadow-emerald-500/20 flex items-center justify-center gap-2.5"
            >
              <Stethoscope className="w-4.5 h-4.5" />
              Start Clinical Assessment
            </button>
            <button 
              onClick={() => setActiveTab('imaging')}
              className="w-full px-5 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-sm font-bold transition-colors flex items-center justify-center gap-2.5"
            >
              <ImageIcon className="w-4.5 h-4.5" />
              Analyze Chest X-Ray
            </button>
            <button 
              onClick={() => setActiveTab('explainability')}
              className="w-full px-5 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-sm font-bold transition-colors flex items-center justify-center gap-2.5"
            >
              <Activity className="w-4.5 h-4.5" />
              Open XAI Studio
            </button>
          </div>
        </div>
      </div>

      {/* Section 4: Recent Case Audit Log */}
      <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100">Recent Audit Case Registry</h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">Saved clinical cases and synthetic demonstration records</p>
          </div>
          <button
            onClick={() => setActiveTab('cases')}
            className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline"
          >
            Browse All Cases →
          </button>
        </div>

        {loading ? (
          <div className="space-y-3 py-2">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-12 bg-zinc-100 dark:bg-zinc-800/60 rounded-xl animate-pulse w-full" />
            ))}
          </div>
        ) : recentCases && recentCases.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-zinc-600 dark:text-zinc-400">
              <thead className="text-2xs font-bold tracking-widest uppercase text-zinc-400 dark:text-zinc-500 border-b border-zinc-200 dark:border-zinc-800">
                <tr>
                  <th className="pb-3 font-semibold">Patient Record ID</th>
                  <th className="pb-3 font-semibold">Primary Condition</th>
                  <th className="pb-3 font-semibold">Evidence Concordance</th>
                  <th className="pb-3 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
                {recentCases.map((c) => (
                  <tr key={c.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors">
                    <td className="py-3 font-semibold text-zinc-900 dark:text-zinc-100">{c.patient_identifier || c.id}</td>
                    <td className="py-3 font-medium text-zinc-800 dark:text-zinc-200">{c.primary_condition || 'Respiratory Assessment'}</td>
                    <td className="py-3">
                      <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                        {c.evidence_level || 'HIGH CONCORDANCE'}
                      </span>
                    </td>
                    <td className="py-3 text-right">
                      <button 
                        onClick={() => setActiveTab('cases')}
                        className="text-xs font-bold px-3 py-1 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 hover:bg-emerald-600 hover:text-white transition-colors"
                      >
                        View Record
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-10 flex flex-col items-center justify-center text-zinc-500 dark:text-zinc-400 space-y-2">
            <FolderHeart className="w-10 h-10 text-zinc-400 dark:text-zinc-600" />
            <p className="text-sm font-medium">No saved cases found — launch an assessment to generate diagnostic records</p>
          </div>
        )}
      </div>

      <div className="pt-2">
        <SafetyDisclaimer />
      </div>
    </div>
  );
};
