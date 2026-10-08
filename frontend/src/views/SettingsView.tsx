import React, { useCallback, useEffect, useState } from 'react';
import { useTheme, ThemePreference } from '../context/ThemeContext';
import { request } from '../api/client';
import { Sun, Moon, Monitor, Info, Database, Cpu, ShieldCheck, RefreshCw, CircleCheck, CircleAlert, CircleX } from 'lucide-react';

interface ModuleHealth {
  loaded: boolean;
  model_type?: string;
  architecture?: string;
  ner_model?: string;
  task?: string;
  synthetic_demonstration_cases?: number;
}

interface SystemHealth {
  status: 'healthy' | 'degraded' | string;
  timestamp: number;
  models: Record<string, ModuleHealth>;
  device: string;
}

export const SettingsView: React.FC = () => {
  const { theme, preference, setTheme } = useTheme();
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [healthError, setHealthError] = useState<string | null>(null);
  const [healthLoading, setHealthLoading] = useState(true);

  const themeOptions: { value: ThemePreference; label: string; description: string; Icon: React.ElementType }[] = [
    { value: 'light', label: 'Light', description: 'Use the light appearance', Icon: Sun },
    { value: 'dark', label: 'Dark', description: 'Use the dark appearance', Icon: Moon },
    { value: 'system', label: 'System', description: 'Follow your device setting', Icon: Monitor },
  ];

  const loadHealth = useCallback(async () => {
    setHealthLoading(true);
    setHealthError(null);
    try {
      const result = await request<SystemHealth>('/health');
      setHealth(result);
    } catch {
      setHealth(null);
      setHealthError('Could not reach the backend health endpoint. Check that the backend is running, then try again.');
    } finally {
      setHealthLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadHealth();
  }, [loadHealth]);

  const moduleLabels: Record<string, string> = {
    clinical: 'Clinical Assessment',
    imaging: 'Chest X-Ray Analysis',
    nlp: 'Medical NLP',
    fusion: 'Evidence Fusion',
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div>
        <p className="text-xs font-medium tracking-widest uppercase text-zinc-400 dark:text-zinc-600 mb-1">System</p>
        <h1 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">Settings</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">Application preferences and system information</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left column */}
        <div className="space-y-6">
          {/* Appearance */}
          <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 space-y-4">
            <h2 className="text-xs font-medium tracking-widest uppercase text-zinc-400 dark:text-zinc-600">Appearance</h2>
            <div className="flex flex-wrap gap-3">
              {themeOptions.map(({ value, label, description, Icon }) => (
                <button
                  key={value}
                  onClick={() => setTheme(value)}
                  aria-pressed={preference === value}
                  title={description}
                  className={`flex items-center gap-2 px-4 py-2 rounded-md border text-sm font-medium transition-colors duration-150 ${
                    preference === value
                      ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400'
                      : 'border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </button>
              ))}
            </div>
            <p className="text-xs text-zinc-400 dark:text-zinc-600">
              Using <span className="font-medium capitalize">{theme}</span> mode
              {preference === 'system' ? ' based on your device preference.' : '. Your choice is saved on this device.'}
            </p>
          </div>

          {/* About */}
          <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 space-y-4">
            <h2 className="text-xs font-medium tracking-widest uppercase text-zinc-400 dark:text-zinc-600">About MedIntel AI</h2>
            <div className="space-y-4">
              <div>
                <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">v1.0.0 — Research Prototype</div>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                  MedIntel AI is an AI-assisted clinical decision-support platform for investigational research and educational purposes.
                </p>
              </div>
              <div className="space-y-3 pt-3 border-t border-zinc-100 dark:border-zinc-800">
                {[
                  { Icon: Cpu,      label: 'Models',   value: 'XGBoost · Custom CNN · BioBERT' },
                  { Icon: Database, label: 'Datasets', value: 'Independent research datasets' },
                  { Icon: Info,     label: 'License',  value: 'Research & Educational Use' },
                ].map(({ Icon, label, value }) => (
                  <div key={label} className="flex items-start gap-3">
                    <Icon className="w-4 h-4 text-zinc-400 dark:text-zinc-500 shrink-0 mt-0.5" />
                    <div>
                      <div className="text-xs font-medium text-zinc-700 dark:text-zinc-300">{label}</div>
                      <div className="text-xs text-zinc-500 dark:text-zinc-400">{value}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-6">
          {/* Data & Safety */}
          <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 space-y-4">
            <h2 className="text-xs font-medium tracking-widest uppercase text-zinc-400 dark:text-zinc-600">Data & Safety</h2>
            <div className="space-y-4">
              <details className="group">
                <summary className="flex items-center gap-2 text-sm font-medium text-zinc-900 dark:text-zinc-100 cursor-pointer list-none">
                  <ShieldCheck className="w-4 h-4 text-emerald-500" />
                  View Full Safety Disclaimer
                </summary>
                <div className="mt-3 p-4 rounded-lg bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                  MedIntel AI is an AI-assisted clinical decision-support prototype intended for research and educational purposes.
                  Outputs represent mathematical model predictions and do not constitute confirmed diagnoses, prescriptions, or autonomous clinical decisions.
                  Human clinician oversight is strictly required.
                </div>
              </details>
              <div className="space-y-2 text-xs text-zinc-500 dark:text-zinc-400">
                <div className="flex items-start gap-2">
                  <span className="text-emerald-500 shrink-0 mt-0.5">•</span>
                  <span>System uses synthetic demonstration data for training examples — not real patient records.</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-emerald-500 shrink-0 mt-0.5">•</span>
                  <span>Independent datasets are used across modalities. Clinical, imaging, and NLP data do not represent the same patients.</span>
                </div>
              </div>
            </div>
          </div>

          {/* System Status */}
          <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-xs font-medium tracking-widest uppercase text-zinc-400 dark:text-zinc-600">System Status</h2>
                <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">Live status reported by the backend</p>
              </div>
              <button
                type="button"
                onClick={() => void loadHealth()}
                disabled={healthLoading}
                className="inline-flex items-center gap-2 rounded-lg border border-zinc-200 px-3 py-2 text-xs font-medium text-zinc-700 transition-colors hover:bg-zinc-50 disabled:cursor-wait disabled:opacity-60 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${healthLoading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>

            {healthLoading && !health && (
              <p role="status" className="text-sm text-zinc-500 dark:text-zinc-400">Checking backend and model status…</p>
            )}

            {healthError && (
              <div role="alert" className="flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-300">
                <CircleX className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{healthError}</span>
              </div>
            )}

            {health && (
              <>
                <div className={`flex items-center justify-between gap-3 rounded-lg border p-3 ${
                  health.status === 'healthy'
                    ? 'border-emerald-200 bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-950/30'
                    : 'border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/30'
                }`}>
                  <div className="flex items-center gap-2">
                    {health.status === 'healthy'
                      ? <CircleCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                      : <CircleAlert className="h-4 w-4 text-amber-600 dark:text-amber-400" />}
                    <span className="text-sm font-semibold capitalize text-zinc-800 dark:text-zinc-100">{health.status}</span>
                  </div>
                  <span className="text-xs text-zinc-500 dark:text-zinc-400">Compute: {health.device}</span>
                </div>

                <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
                  {Object.entries(health.models).map(([key, module]) => (
                    <div key={key} className="flex items-start justify-between gap-3 py-3 first:pt-1 last:pb-1">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">{moduleLabels[key] || key}</p>
                        <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                          {module.model_type || module.architecture || module.ner_model || module.task || 'Module'}
                          {typeof module.synthetic_demonstration_cases === 'number' ? ` · ${module.synthetic_demonstration_cases} demo cases` : ''}
                        </p>
                      </div>
                      <span className={`shrink-0 flex items-center gap-1.5 text-xs font-medium ${
                        module.loaded ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'
                      }`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${module.loaded ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                        {module.loaded ? 'Loaded' : 'Not loaded'}
                      </span>
                    </div>
                  ))}
                </div>
                <p className="text-[10px] text-zinc-400 dark:text-zinc-500">
                  Last checked {new Date(health.timestamp * 1000).toLocaleTimeString()}
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsView;
