import React from 'react';
import { ThemeToggle } from './ThemeToggle';
import { NavTab } from '../types';

interface HeaderProps {
  activeTab: NavTab;
  setActiveTab: (tab: NavTab) => void;
  onBackToLanding?: () => void;
}

const TAB_LABELS: Record<NavTab, string> = {
  dashboard:      'Dashboard',
  clinical:       'Clinical Assessment',
  imaging:        'Chest X-Ray Analysis',
  nlp:            'Medical Reports',
  fusion:         'Evidence Fusion',
  explainability: 'Explainability',
  assistant:      'Clinical Assistant',
  cases:          'Case Registry',
  analytics:      'Analytics',
  'model-info':   'Model Performance',
  settings:       'Settings',
};

const TAB_SECTION: Record<NavTab, string> = {
  dashboard:      'Overview',
  clinical:       'Assessment',
  imaging:        'Assessment',
  nlp:            'Assessment',
  fusion:         'Evidence',
  explainability: 'Insights',
  assistant:      'Tools',
  cases:          'Records',
  analytics:      'Insights',
  'model-info':   'Insights',
  settings:       'System',
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

      {/* Right controls and product status */}
      <div className="flex items-center gap-4">
        <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 text-2xs font-medium">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
          Research prototype
        </div>
        <ThemeToggle />
      </div>
    </header>
  );
};

export default Header;
