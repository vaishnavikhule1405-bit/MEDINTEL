import React, { useState } from 'react';
import {
  Activity,
  Stethoscope,
  Layers,
  Image,
  FileText,
  Network,
  Bot,
  FolderHeart,
  BarChart3,
  Award,
  ArrowLeft,
  Settings,
  Sparkles,
  Brain,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { NavTab } from '../types';

interface SidebarProps {
  activeTab: NavTab;
  setActiveTab: (tab: NavTab) => void;
  onBackToLanding?: () => void;
}

interface NavItem {
  id: NavTab;
  label: string;
  icon: React.ElementType;
  badge?: 'operational' | 'development' | 'beta';
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    label: 'Overview',
    items: [
      { id: 'dashboard', label: 'Dashboard', icon: Activity },
    ],
  },
  {
    label: 'Clinical Intelligence',
    items: [
      { id: 'clinical', label: 'Clinical Assessment', icon: Stethoscope, badge: 'operational' },
    ],
  },
  {
    label: 'Imaging Intelligence',
    items: [
      { id: 'imaging', label: 'Chest X-Ray Analysis', icon: Image, badge: 'operational' },
    ],
  },
  {
    label: 'Medical Intelligence',
    items: [
      { id: 'nlp', label: 'Medical Reports', icon: FileText, badge: 'development' },
    ],
  },
  {
    label: 'Multimodal',
    items: [
      { id: 'fusion', label: 'Evidence Fusion', icon: Network, badge: 'development' },
    ],
  },
  {
    label: 'Insights',
    items: [
      { id: 'analytics', label: 'Analytics', icon: BarChart3 },
      { id: 'model-info', label: 'Model Performance', icon: Award },
      { id: 'explainability', label: 'Explainability', icon: Sparkles },
    ],
  },
  {
    label: 'AI',
    items: [
      { id: 'assistant', label: 'Clinical Assistant', icon: Bot, badge: 'beta' },
      { id: 'cases', label: 'Case Registry', icon: FolderHeart },
    ],
  },
  {
    label: 'System',
    items: [
      { id: 'settings', label: 'Settings', icon: Settings },
    ],
  },
];

const BADGE_STYLES = {
  operational: 'text-emerald-600 dark:text-emerald-400',
  development:  'text-amber-600 dark:text-amber-400',
  beta:         'text-blue-600 dark:text-blue-400',
};

const BADGE_LABELS = {
  operational: 'Live',
  development: 'Dev',
  beta:        'Beta',
};

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, onBackToLanding }) => {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={`
        relative flex flex-col h-screen bg-white dark:bg-zinc-950
        border-r border-zinc-200 dark:border-zinc-800
        transition-all duration-200 shrink-0
        ${collapsed ? 'w-14' : 'w-52'}
      `}
    >
      {/* Logo */}
      <div className={`flex items-center h-14 border-b border-zinc-200 dark:border-zinc-800 px-3 gap-2.5 shrink-0`}>
        <div className="w-7 h-7 rounded-lg bg-emerald-600 flex items-center justify-center shrink-0">
          <Brain className="w-4 h-4 text-white" />
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <span className="text-sm font-semibold tracking-tight text-zinc-900 dark:text-zinc-100 block leading-none">
              MEDINTEL<span className="text-emerald-600 dark:text-emerald-400">.AI</span>
            </span>
            <span className="text-2xs text-zinc-400 dark:text-zinc-600 tracking-wide">Research Platform</span>
          </div>
        )}
      </div>

      {/* Nav Groups */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-4">
        {NAV_GROUPS.map((group) => (
          <div key={group.label}>
            {!collapsed && (
              <p className="px-2 mb-1 text-2xs font-medium tracking-widest uppercase text-zinc-400 dark:text-zinc-600 select-none">
                {group.label}
              </p>
            )}
            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <li key={item.id}>
                    <button
                      onClick={() => setActiveTab(item.id)}
                      title={collapsed ? item.label : undefined}
                      className={`
                        w-full flex items-center gap-2.5 px-2 py-1.5 rounded-md text-sm
                        transition-colors duration-150 group relative
                        ${isActive
                          ? 'bg-zinc-100 dark:bg-zinc-800/80 text-zinc-900 dark:text-zinc-100 font-medium'
                          : 'text-zinc-500 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-900 hover:text-zinc-800 dark:hover:text-zinc-200'
                        }
                      `}
                    >
                      {/* Active indicator bar */}
                      {isActive && (
                        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 bg-emerald-500 rounded-full" />
                      )}
                      <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-emerald-600 dark:text-emerald-400' : ''}`} />
                      {!collapsed && (
                        <>
                          <span className="flex-1 text-left text-xs leading-snug">{item.label}</span>
                          {item.badge && (
                            <span className={`text-2xs font-medium ${BADGE_STYLES[item.badge]}`}>
                              {BADGE_LABELS[item.badge]}
                            </span>
                          )}
                        </>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="shrink-0 border-t border-zinc-200 dark:border-zinc-800 p-2 space-y-0.5">
        {onBackToLanding && (
          <button
            onClick={onBackToLanding}
            title={collapsed ? 'Back to Landing' : undefined}
            className="w-full flex items-center gap-2.5 px-2 py-1.5 rounded-md text-xs text-zinc-400 dark:text-zinc-600 hover:text-zinc-700 dark:hover:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors duration-150"
          >
            <ArrowLeft className="w-4 h-4 shrink-0" />
            {!collapsed && <span>Back to Home</span>}
          </button>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="w-full flex items-center gap-2.5 px-2 py-1.5 rounded-md text-xs text-zinc-400 dark:text-zinc-600 hover:text-zinc-700 dark:hover:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors duration-150"
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight className="w-4 h-4 shrink-0" /> : <ChevronLeft className="w-4 h-4 shrink-0" />}
          {!collapsed && <span>Collapse</span>}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
