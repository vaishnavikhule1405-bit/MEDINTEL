import React, { useState } from 'react';
import {
  Activity,
  Stethoscope,
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
    label: 'Assessment',
    items: [
      { id: 'clinical', label: 'Clinical Assessment', icon: Stethoscope },
      { id: 'imaging', label: 'Chest X-Ray Analysis', icon: Image },
      { id: 'nlp', label: 'Medical Reports', icon: FileText },
      { id: 'fusion', label: 'Evidence Fusion', icon: Network },
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
    label: 'Tools',
    items: [
      { id: 'assistant', label: 'Clinical Assistant', icon: Bot },
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
      <div className={`flex items-center h-14 border-b border-zinc-200 dark:border-zinc-800/80 px-3.5 gap-2.5 shrink-0`}>
        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shrink-0 shadow-sm shadow-emerald-500/20">
          <Brain className="w-4 h-4 text-white" />
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <span className="text-sm font-bold tracking-tight text-zinc-900 dark:text-zinc-100 block leading-none">
              MEDINTEL<span className="text-emerald-500 dark:text-emerald-400">.AI</span>
            </span>
            <span className="text-2xs text-zinc-400 dark:text-zinc-500 tracking-wide font-medium">Clinical AI Research</span>
          </div>
        )}
      </div>

      {/* Nav Groups */}
      <nav className="flex-1 overflow-y-auto py-3.5 px-2 space-y-4">
        {NAV_GROUPS.map((group) => (
          <div key={group.label}>
            {!collapsed && (
              <p className="px-2 mb-1.5 text-[10px] font-bold tracking-widest uppercase text-zinc-400 dark:text-zinc-500 select-none">
                {group.label}
              </p>
            )}
            <ul className="space-y-1">
              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <li key={item.id}>
                    <button
                      onClick={() => setActiveTab(item.id)}
                      title={collapsed ? item.label : undefined}
                      className={`
                        w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs
                        transition-all duration-150 group relative
                        ${isActive
                          ? 'bg-emerald-50/80 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300 font-semibold border border-emerald-200/60 dark:border-emerald-800/40 shadow-2xs'
                          : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100/80 dark:hover:bg-zinc-900 hover:text-zinc-900 dark:hover:text-zinc-100'
                        }
                      `}
                    >
                      {/* Active indicator bar */}
                      {isActive && (
                        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-4 bg-emerald-500 rounded-r-full shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
                      )}
                      <Icon className={`w-4 h-4 shrink-0 transition-colors ${isActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-zinc-400 dark:text-zinc-500 group-hover:text-zinc-700 dark:group-hover:text-zinc-300'}`} />
                      {!collapsed && (
                        <>
                          <span className="flex-1 text-left truncate leading-tight">{item.label}</span>
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
