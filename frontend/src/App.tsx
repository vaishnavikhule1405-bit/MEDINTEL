import React, { useState, useEffect } from 'react';
import { NavTab, AppExperience } from './types';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { LandingView } from './views/LandingView';
import { DashboardView } from './views/DashboardView';
import { ClinicalView } from './views/ClinicalView';
import { ImagingView } from './views/ImagingView';
import { NLPView } from './views/NLPView';
import { FusionView } from './views/FusionView';
import { ExplainabilityView } from './views/ExplainabilityView';
import { AssistantView } from './views/AssistantView';
import { CasesView } from './views/CasesView';
import { AnalyticsView } from './views/AnalyticsView';
import { ModelInfoView } from './views/ModelInfoView';
import { SettingsView } from './views/SettingsView';

export const App: React.FC = () => {
  const getInitialRoute = (): { exp: AppExperience; tab: NavTab } => {
    const hash = window.location.hash.toLowerCase();
    if (hash.startsWith('#app') || hash.startsWith('#/app')) {
      const parts = hash.replace('#/app', '').replace('#app', '').replace('/', '').trim();
      const validTabs: NavTab[] = [
        'dashboard', 'clinical', 'imaging', 'nlp', 'fusion',
        'explainability', 'assistant', 'cases', 'analytics', 'model-info', 'settings',
      ];
      if (validTabs.includes(parts as NavTab)) {
        return { exp: 'app', tab: parts as NavTab };
      }
      return { exp: 'app', tab: 'dashboard' };
    }
    return { exp: 'landing', tab: 'dashboard' };
  };

  const initialRoute = getInitialRoute();
  const [experience, setExperience] = useState<AppExperience>(initialRoute.exp);
  const [activeTab, setActiveTab] = useState<NavTab>(initialRoute.tab);

  useEffect(() => {
    const handleHashChange = () => {
      const route = getInitialRoute();
      setExperience(route.exp);
      setActiveTab(route.tab);
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const handleEnterApp = (tab: NavTab = 'dashboard') => {
    setActiveTab(tab);
    setExperience('app');
    window.location.hash = `#/app/${tab}`;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBackToLanding = () => {
    setExperience('landing');
    window.location.hash = '#/';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleTabChange = (tab: NavTab) => {
    setActiveTab(tab);
    window.location.hash = `#/app/${tab}`;
  };

  if (experience === 'landing') {
    return <LandingView onEnterApp={handleEnterApp} />;
  }

  const renderActiveView = () => {
    switch (activeTab) {
      case 'dashboard':     return <DashboardView setActiveTab={handleTabChange} />;
      case 'clinical':      return <ClinicalView />;
      case 'imaging':       return <ImagingView />;
      case 'nlp':           return <NLPView />;
      case 'fusion':        return <FusionView />;
      case 'explainability':return <ExplainabilityView />;
      case 'assistant':     return <AssistantView />;
      case 'cases':         return <CasesView />;
      case 'analytics':     return <AnalyticsView />;
      case 'model-info':    return <ModelInfoView />;
      case 'settings':      return <SettingsView />;
      default:              return <DashboardView setActiveTab={handleTabChange} />;
    }
  };

  return (
    <div className="flex h-screen bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 overflow-hidden font-sans">
      <Sidebar
        activeTab={activeTab}
        setActiveTab={handleTabChange}
        onBackToLanding={handleBackToLanding}
      />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header
          activeTab={activeTab}
          setActiveTab={handleTabChange}
          onBackToLanding={handleBackToLanding}
        />
        <main className="flex-1 overflow-y-auto p-6 md:p-8 bg-zinc-50 dark:bg-zinc-950">
          <div className="max-w-7xl mx-auto pb-16">
            {renderActiveView()}
          </div>
        </main>
      </div>
    </div>
  );
};

export default App;
