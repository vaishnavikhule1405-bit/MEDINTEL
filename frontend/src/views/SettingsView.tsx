import React from 'react';
import { useTheme } from '../context/ThemeContext';
import { Sun, Moon, Monitor, Info, Database, Cpu, ShieldCheck } from 'lucide-react';

export const SettingsView: React.FC = () => {
  const { theme, setTheme } = useTheme();

  const themeOptions: { value: 'light' | 'dark'; label: string; Icon: React.ElementType }[] = [
    { value: 'light', label: 'Light', Icon: Sun },
    { value: 'dark',  label: 'Dark',  Icon: Moon },
  ];

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
              {themeOptions.map(({ value, label, Icon }) => (
                <button
                  key={value}
                  onClick={() => setTheme(value)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-md border text-sm font-medium transition-colors duration-150 ${
                    theme === value
                      ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400'
                      : 'border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </button>
              ))}
              <button
                disabled
                title="System preference not yet supported"
                className="flex items-center gap-2 px-4 py-2 rounded-md border border-zinc-200 dark:border-zinc-700 text-zinc-400 dark:text-zinc-600 text-sm font-medium cursor-not-allowed"
              >
                <Monitor className="w-4 h-4" />
                System
              </button>
            </div>
            <p className="text-xs text-zinc-400 dark:text-zinc-600">
              Currently: <span className="font-medium capitalize">{theme}</span> mode. Theme preference is persisted locally.
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
            <h2 className="text-xs font-medium tracking-widest uppercase text-zinc-400 dark:text-zinc-600">System Status</h2>
            <div className="space-y-3">
              {[
                { name: 'Clinical Assessment', status: 'Operational',     dot: 'bg-emerald-500', text: 'text-emerald-600 dark:text-emerald-400' },
                { name: 'Chest X-Ray Analysis', status: 'Operational',    dot: 'bg-emerald-500', text: 'text-emerald-600 dark:text-emerald-400' },
                { name: 'Medical NLP',          status: 'In Development', dot: 'bg-amber-500',   text: 'text-amber-600 dark:text-amber-400' },
                { name: 'Evidence Fusion',      status: 'In Development', dot: 'bg-amber-500',   text: 'text-amber-600 dark:text-amber-400' },
                { name: 'Clinical Assistant',   status: 'Beta',           dot: 'bg-blue-500',    text: 'text-blue-600 dark:text-blue-400' },
              ].map(({ name, status, dot, text }) => (
                <div key={name} className="flex items-center justify-between py-1">
                  <span className="text-sm text-zinc-700 dark:text-zinc-300">{name}</span>
                  <span className={`flex items-center gap-1.5 text-xs font-medium ${text}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
                    {status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsView;
