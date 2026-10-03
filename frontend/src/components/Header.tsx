import React from 'react';
import { ThemeToggle } from './ThemeToggle';
import { NavTab } from '../types';
import { Activity } from 'lucide-react';

interface HeaderProps {
  activeTab: NavTab;
  setActiveTab: (tab: NavTab) => void;
  onBackToLanding?: () => void;
}

const TAB_LABELS: Record<NavTab, string> = {
  dashboard:      'Dashboard Overview',
  clinical:       'Clinical Symptom Assessment',
  imaging:        'Chest X-Ray Analysis',
  nlp:            'Medical Reports NLP',
  fusion:         'Multimodal Evidence Fusion',
  explainability: 'Explainability Studio (XAI)',
  assistant:      'Clinical AI Assistant',
  cases:          'Audit Case Registry',
  analytics:      'System Usage Analytics',
  'model-info':   'Model Benchmarks & Info',
  settings:       'System Configuration',
};

const TAB_SECTION: Record<NavTab, string> = {
  dashboard:      'Overview',
  clinical:       'Clinical ML',
  imaging:        'Computer Vision',
  nlp:            'Biomedical NLP',
  fusion:         'Multimodal',
  explainability: 'Transparency',
  assistant:      'Copilot',
  cases:          'Registry',
  analytics:      'Analytics',
  'model-info':   'Evaluation',
  settings:       'Settings',
};

export const Header: React.FC<HeaderProps> = ({ activeTab }) => {
  return (
    <header className="h-14 flex items-center justify-between px-6 border-b border-zinc-200 dark:border-zinc-800 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-md shrink-0">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2.5 text-xs sm:text-sm">
        <span className="font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider text-2xs">
          {TAB_SECTION[activeTab]}
        </span>
        <span className="text-zinc-300 dark:text-zinc-700">/</span>
        <span className="font-semibold text-zinc-900 dark:text-zinc-100">
          {TAB_LABELS[activeTab]}
        </span>
      </div>

      {/* Right controls & status badge */}
      <div className="flex items-center gap-4">
        <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-emerald-700 dark:text-emerald-400 text-2xs font-semibold">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          AI Models Operational
        </div>
        <ThemeToggle />
      </div>
    </header>
  );
};

export default Header;
