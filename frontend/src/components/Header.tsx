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
  clinical:       'Clinical Intelligence',
  imaging:        'Imaging Intelligence',
  nlp:            'Medical Intelligence',
  fusion:         'Multimodal',
  explainability: 'Insights',
  assistant:      'AI',
  cases:          'AI',
  analytics:      'Insights',
  'model-info':   'Insights',
  settings:       'System',
};

export const Header: React.FC<HeaderProps> = ({ activeTab }) => {
  return (
    <header className="h-14 flex items-center justify-between px-6 border-b border-zinc-200 dark:border-zinc-800 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-sm shrink-0">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs">
        <span className="text-zinc-400 dark:text-zinc-600">
          {TAB_SECTION[activeTab]}
        </span>
        <span className="text-zinc-300 dark:text-zinc-700">/</span>
        <span className="font-medium text-zinc-700 dark:text-zinc-300">
          {TAB_LABELS[activeTab]}
        </span>
      </div>

      {/* Right controls */}
      <div className="flex items-center gap-2">
        <ThemeToggle />
      </div>
    </header>
  );
};

export default Header;
