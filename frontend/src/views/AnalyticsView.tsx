import React, { useState, useEffect } from 'react';
import { analyticsApi } from '../api/client';
import { SafetyDisclaimer } from '../components/SafetyDisclaimer';
import { Badge } from '../components/Badge';

export const AnalyticsView: React.FC = () => {
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadAnalytics() {
      try {
        setLoading(true);
        const data = await analyticsApi.getSummary();
        setSummary(data);
      } catch (err) {
        console.error('Failed to load analytics summary:', err);
      } finally {
        setLoading(false);
      }
    }
    loadAnalytics();
  }, []);

  return (
    <div className="space-y-6 animate-fade-in">
      <SafetyDisclaimer />
      
      <div className="flex items-center gap-3">
        <h1 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
          Analytics
        </h1>
        <span className="text-sm text-zinc-500 dark:text-zinc-400">System insights and model statistics</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-sm">
          <div className="text-xs font-medium tracking-widest uppercase text-zinc-400 dark:text-zinc-600 mb-2">Total Cases</div>
          <div className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">
            {loading ? <div className="h-8 w-16 bg-zinc-200 dark:bg-zinc-800 animate-pulse rounded" /> : summary?.total_cases || 500}
          </div>
        </div>
        <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-sm">
          <div className="text-xs font-medium tracking-widest uppercase text-zinc-400 dark:text-zinc-600 mb-2">Clinical Uses</div>
          <div className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">
            {loading ? <div className="h-8 w-16 bg-zinc-200 dark:bg-zinc-800 animate-pulse rounded" /> : summary?.modality_counts?.clinical_only || 120}
          </div>
        </div>
        <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-sm">
          <div className="text-xs font-medium tracking-widest uppercase text-zinc-400 dark:text-zinc-600 mb-2">Imaging Uses</div>
          <div className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">
            {loading ? <div className="h-8 w-16 bg-zinc-200 dark:bg-zinc-800 animate-pulse rounded" /> : summary?.modality_counts?.imaging_only || 80}
          </div>
        </div>
        <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-sm">
          <div className="text-xs font-medium tracking-widest uppercase text-zinc-400 dark:text-zinc-600 mb-2">Fusion Uses</div>
          <div className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">
            {loading ? <div className="h-8 w-16 bg-zinc-200 dark:bg-zinc-800 animate-pulse rounded" /> : summary?.modality_counts?.trimodal || 120}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">Clinical Models</h3>
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
        </div>

        <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">Imaging Models</h3>
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
        </div>
      </div>
    </div>
  );
};
