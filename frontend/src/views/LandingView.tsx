import React, { useState } from 'react';
import {
  Brain,
  Menu,
  X,
  Stethoscope,
  Layers,
  FileText,
  BarChart3,
  Eye,
  Shield,
  ArrowRight,
  ChevronRight,
  ChevronDown,
  Sparkles
} from 'lucide-react';
import { NavTab } from '../types';
import { ThemeToggle } from '../components/ThemeToggle';
import { Badge } from '../components/Badge';

interface LandingViewProps {
  onEnterApp: (tab?: NavTab) => void;
}

export const LandingView: React.FC<LandingViewProps> = ({ onEnterApp }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openAccordion, setOpenAccordion] = useState<number | null>(null);

  const scrollToSection = (id: string) => {
    setMobileMenuOpen(false);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const toggleAccordion = (index: number) => {
    setOpenAccordion(openAccordion === index ? null : index);
  };

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950 font-sans antialiased text-zinc-900 dark:text-zinc-100 selection:bg-emerald-500/30">
      {/* 1. Public Navbar */}
      <nav className="sticky top-0 z-50 bg-white/90 dark:bg-zinc-950/90 backdrop-blur-md border-b border-zinc-200 dark:border-zinc-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <Brain className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
              <span className="font-semibold text-lg tracking-tight">MEDINTEL.AI</span>
              <span className="hidden sm:inline-flex items-center text-[10px] font-medium tracking-widest uppercase text-zinc-500 border border-zinc-200 dark:border-zinc-700 px-1.5 py-0.5 rounded bg-zinc-50 dark:bg-zinc-900">
                Research
              </span>
            </div>
            
            <div className="hidden lg:flex items-center gap-6 text-sm font-medium text-zinc-600 dark:text-zinc-400">
              <button onClick={() => scrollToSection('overview')} className="hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors">Platform</button>
              <button onClick={() => scrollToSection('capabilities')} className="hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors">AI Capabilities</button>
              <button onClick={() => scrollToSection('how-it-works')} className="hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors">How It Works</button>
              <button onClick={() => scrollToSection('performance')} className="hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors">Performance</button>
            </div>

            <div className="hidden sm:flex items-center gap-3">
              <ThemeToggle />
              <button
                onClick={() => onEnterApp('dashboard')}
                className="px-4 py-2 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium transition-colors duration-150"
              >
                Launch MedIntel AI
              </button>
            </div>

            <div className="lg:hidden flex items-center gap-2">
              <ThemeToggle />
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>
        
        {mobileMenuOpen && (
          <div className="lg:hidden bg-white dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-800 px-4 py-4 space-y-4 shadow-sm">
            <div className="flex flex-col space-y-3 text-sm font-medium text-zinc-600 dark:text-zinc-400">
              <button onClick={() => scrollToSection('overview')} className="text-left hover:text-zinc-900 dark:hover:text-zinc-100">Platform</button>
              <button onClick={() => scrollToSection('capabilities')} className="text-left hover:text-zinc-900 dark:hover:text-zinc-100">AI Capabilities</button>
              <button onClick={() => scrollToSection('how-it-works')} className="text-left hover:text-zinc-900 dark:hover:text-zinc-100">How It Works</button>
              <button onClick={() => scrollToSection('performance')} className="text-left hover:text-zinc-900 dark:hover:text-zinc-100">Performance</button>
            </div>
            <div className="pt-2">
              <button
                onClick={() => onEnterApp('dashboard')}
                className="w-full text-center px-4 py-2 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium transition-colors duration-150"
              >
                Launch MedIntel AI
              </button>
            </div>
          </div>
        )}
      </nav>

      {/* 2. Hero — Full-bleed 100vh tab background */}
      <section className="relative min-h-screen h-screen flex flex-col justify-between overflow-hidden bg-zinc-950">
        {/* Background Image */}
        <div className="absolute inset-0">
          <img
            src="/hero-bg.jpg"
            alt=""
            className="w-full h-full object-cover"
          />
          <div className="hero-overlay absolute inset-0" />
        </div>

        {/* Hero Content — centered vertically in the viewport */}
        <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 my-auto pt-24 pb-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-end">
            {/* Left Side */}
            <div className="space-y-6 animate-fade-in-up">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4.5 h-4.5 text-emerald-400" />
                <span className="text-xs sm:text-sm font-medium tracking-widest uppercase text-emerald-400">
                  Multimodal Healthcare Intelligence
                </span>
              </div>
              <h1 className="font-display text-5xl sm:text-7xl md:text-8xl lg:text-[6rem] font-bold text-white leading-none tracking-tight">
                Clinical
                <br />
                <span className="text-emerald-400">Intelligence</span>
              </h1>
              <p className="text-xl sm:text-2xl text-white/80 max-w-lg leading-relaxed">
                AI that connects the evidence —<br className="hidden sm:block" />
                from symptoms to scans to decisions.
              </p>
            </div>

            {/* Right Side */}
            <div className="space-y-8 animate-fade-in-up-delay-2">
              <p className="text-base sm:text-lg md:text-xl text-white/70 leading-relaxed max-w-md lg:ml-auto">
                Connect clinical data, chest X-ray imaging, and medical text
                through explainable AI. Get decision support through evidence
                — on your terms.
              </p>
              <div className="lg:flex lg:justify-end">
                <button
                  onClick={() => onEnterApp('dashboard')}
                  className="group flex items-center gap-3 px-8 py-4 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white text-base sm:text-lg font-medium transition-all duration-200 hover:shadow-xl hover:shadow-emerald-500/25"
                >
                  Launch MedIntel AI
                  <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Hero Bottom Bar — pinned to the very bottom edge of the screen */}
        <div className="relative z-10 w-full border-t border-white/15 py-4 bg-zinc-950/40 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between text-xs sm:text-sm font-medium tracking-widest uppercase text-white/50">
            <span>100% EXPLAINABLE AI</span>
            <span>RESEARCH PLATFORM</span>
          </div>
        </div>
      </section>

      {/* 3. Capability strip */}
      <section id="capabilities" className="py-8 bg-zinc-50 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center md:text-left">
            <div className="space-y-1 flex flex-col items-center md:items-start">
              <div className="flex items-center gap-1.5 font-semibold text-zinc-900 dark:text-zinc-100 text-sm">
                <Stethoscope className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                Clinical ML
              </div>
              <div className="text-xs text-zinc-500 dark:text-zinc-400">174 Symptoms &middot; 37 Disease Classes</div>
            </div>
            <div className="space-y-1 flex flex-col items-center md:items-start">
              <div className="flex items-center gap-1.5 font-semibold text-zinc-900 dark:text-zinc-100 text-sm">
                <Layers className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                Computer Vision
              </div>
              <div className="text-xs text-zinc-500 dark:text-zinc-400">Custom CNN &middot; DenseNet121</div>
            </div>
            <div className="space-y-1 flex flex-col items-center md:items-start">
              <div className="flex items-center gap-1.5 font-semibold text-zinc-900 dark:text-zinc-100 text-sm">
                <Eye className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                Explainable AI
              </div>
              <div className="text-xs text-zinc-500 dark:text-zinc-400">SHAP &middot; Grad-CAM</div>
            </div>
            <div className="space-y-1 flex flex-col items-center md:items-start">
              <div className="flex items-center gap-1.5 font-semibold text-zinc-900 dark:text-zinc-100 text-sm">
                <BarChart3 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                Analytics
              </div>
              <div className="text-xs text-zinc-500 dark:text-zinc-400">Model Comparison &middot; Evaluation</div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Platform Intelligence */}
      <section id="overview" className="py-24 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-24">
          <div className="space-y-2 text-center md:text-left">
            <div className="text-xs font-medium tracking-widest uppercase text-zinc-400 dark:text-zinc-600">CAPABILITIES</div>
            <h2 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">Platform Intelligence</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <Badge variant="operational" />
              <h3 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">Clinical Intelligence</h3>
              <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                Structured patient symptom profiles are vectorized into a 174-dimensional binary feature vector and processed through an XGBoost multiclass classifier to generate differential diagnoses across 37 disease categories.
              </p>
            </div>
            <div className="bg-zinc-50 dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-8 shadow-sm flex items-center justify-center">
              <div className="flex flex-wrap justify-center items-center gap-4 text-sm font-medium text-zinc-700 dark:text-zinc-300">
                <div className="px-4 py-2 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-700 rounded-md">Symptoms</div>
                <ArrowRight className="w-4 h-4 text-zinc-400" />
                <div className="px-4 py-2 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-700 rounded-md">XGBoost</div>
                <ArrowRight className="w-4 h-4 text-zinc-400" />
                <div className="px-4 py-2 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-400 rounded-md">Prediction</div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center md:flex-row-reverse">
            <div className="order-2 md:order-1 bg-zinc-50 dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-8 shadow-sm flex items-center justify-center">
              <div className="flex flex-wrap justify-center items-center gap-4 text-sm font-medium text-zinc-700 dark:text-zinc-300">
                <div className="px-4 py-2 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-700 rounded-md">Chest X-ray</div>
                <ArrowRight className="w-4 h-4 text-zinc-400" />
                <div className="px-4 py-2 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-700 rounded-md">Custom CNN</div>
                <ArrowRight className="w-4 h-4 text-zinc-400" />
                <div className="px-4 py-2 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-400 rounded-md">Classification</div>
              </div>
            </div>
            <div className="order-1 md:order-2 space-y-6">
              <Badge variant="operational" />
              <h3 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">Imaging Intelligence</h3>
              <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                Frontal chest radiographs are normalized and evaluated via a bespoke 4-Block PyTorch CNN engineered specifically for lung parenchymal opacities and pneumonia detection.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <Badge variant="development" label="In Development" />
              <h3 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">Medical Intelligence</h3>
              <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                Clinical dictation and EHR discharge summaries parsed via BioBERT named entity recognition with contextual negation tagging and S-PubMedBERT semantic similarity.
              </p>
            </div>
            <div className="bg-zinc-50 dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-8 shadow-sm flex items-center justify-center">
              <div className="flex flex-wrap justify-center items-center gap-4 text-sm font-medium text-zinc-700 dark:text-zinc-300">
                <div className="px-4 py-2 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-700 rounded-md">Medical Text</div>
                <ArrowRight className="w-4 h-4 text-zinc-400" />
                <div className="px-4 py-2 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-700 rounded-md">NLP</div>
                <ArrowRight className="w-4 h-4 text-zinc-400" />
                <div className="px-4 py-2 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-400 rounded-md">Evidence</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. How It Works */}
      <section id="how-it-works" className="py-24 bg-zinc-50 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">How It Works</h2>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">The journey from raw clinical data to actionable decision support.</p>
          </div>

          <div className="space-y-8 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-zinc-200 dark:before:via-zinc-800 before:to-transparent">
            {[
              { num: '01', title: 'INPUT', desc: 'Clinical data, chest X-ray, or unstructured medical text is provided.' },
              { num: '02', title: 'AI ANALYSIS', desc: 'Dedicated models (XGBoost, CNN, NLP) process the inputs independently.' },
              { num: '03', title: 'EXPLAINABILITY', desc: 'SHAP values and Grad-CAM visualizations are generated to interpret the models.' },
              { num: '04', title: 'EVIDENCE', desc: 'Each modality yields independent clinical evidence with statistical confidence.' },
            ].map((step, i) => (
              <div key={i} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                <div className="flex items-center justify-center w-10 h-10 rounded-full border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-zinc-500 dark:text-zinc-400 text-xs font-semibold shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-sm z-10">
                  {step.num}
                </div>
                <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 p-5 rounded-xl shadow-sm">
                  <div className="text-xs font-medium tracking-widest uppercase text-zinc-500 dark:text-zinc-500 mb-1">{step.title}</div>
                  <div className="text-sm text-zinc-600 dark:text-zinc-400">{step.desc}</div>
                </div>
              </div>
            ))}
            <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
              <div className="flex items-center justify-center w-10 h-10 rounded-full border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 text-xs font-semibold shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-sm z-10">
                05
              </div>
              <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 p-5 rounded-xl shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-xs font-medium tracking-widest uppercase text-zinc-500 dark:text-zinc-500">DECISION SUPPORT</div>
                  <Badge variant="development" label="Fusion In Development" />
                </div>
                <div className="text-sm text-zinc-600 dark:text-zinc-400">Dynamic trimodal evidence synthesis weighing all inputs for a consolidated diagnosis.</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Performance */}
      <section id="performance" className="py-24 bg-white dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="space-y-2 text-center md:text-left">
            <div className="text-xs font-medium tracking-widest uppercase text-zinc-400 dark:text-zinc-600">BENCHMARKS</div>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <h2 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">Model Performance</h2>
              <button onClick={() => onEnterApp('model-info')} className="text-sm font-medium text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 flex items-center gap-1">
                View Full Model Comparison <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 p-6 shadow-sm space-y-4">
              <div className="text-sm font-medium text-zinc-600 dark:text-zinc-400">Clinical Intelligence</div>
              <div className="text-3xl font-semibold text-zinc-900 dark:text-zinc-100">67.57%</div>
              <div className="text-xs text-zinc-500">XGBoost &middot; 37 Classes Test Accuracy</div>
            </div>
            <div className="rounded-xl border border-emerald-200 dark:border-emerald-800/50 bg-emerald-50/50 dark:bg-emerald-950/20 p-6 shadow-sm space-y-4">
              <div className="text-sm font-medium text-emerald-800 dark:text-emerald-400">Imaging (Primary)</div>
              <div className="text-3xl font-semibold text-emerald-900 dark:text-emerald-100">84.46%</div>
              <div className="text-xs text-emerald-700/80 dark:text-emerald-400/80">Custom CNN &middot; 93.25% ROC-AUC</div>
            </div>
            <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 p-6 shadow-sm space-y-4">
              <div className="text-sm font-medium text-zinc-600 dark:text-zinc-400">Imaging Benchmark</div>
              <div className="text-3xl font-semibold text-zinc-900 dark:text-zinc-100">82.53%</div>
              <div className="text-xs text-zinc-500">DenseNet121 &middot; 92.65% ROC-AUC</div>
            </div>
          </div>
        </div>
      </section>

      {/* 7. Explainability */}
      <section id="explainability" className="py-24 bg-zinc-50 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">Explainability</h2>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">Transparent AI decision making through standard interpretability techniques.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-6 shadow-sm flex gap-4">
              <div className="p-2 rounded-lg bg-zinc-100 dark:bg-zinc-900 h-fit">
                <BarChart3 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div className="space-y-2">
                <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">Clinical Feature Evidence</h3>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  Exact marginal game-theoretic SHAP values demonstrate which clinical factors drive the prediction for or against a diagnosis.
                </p>
              </div>
            </div>
            <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-6 shadow-sm flex gap-4">
              <div className="p-2 rounded-lg bg-zinc-100 dark:bg-zinc-900 h-fit">
                <Eye className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div className="space-y-2">
                <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">Visual Model Evidence</h3>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  Grad-CAM visualizations applied to radiographic scans reveal the precise parenchymal zones guiding the model's classification.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 8. Technical Details Accordion */}
      <section className="py-24 bg-white dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-800">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">Technical Details</h2>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">Underlying methodology and architecture details.</p>
          </div>

          <div className="space-y-3">
            {[
              {
                title: 'Clinical Model Details',
                content: 'Structured patient symptom profiles are vectorized into a 174-dimensional binary feature vector. The XGBoost multiclass classifier evaluates these against 37 disease classes, utilizing exact TreeSHAP game-theoretic attribution. Model achieves 67.57% Accuracy and 38.70% Macro F1.',
              },
              {
                title: 'Imaging Model Details',
                content: 'Custom 4-Block CNN primary model trained in PyTorch for 224x224 frontal radiographs. Evaluated on a 5,863 holdout set against DenseNet121. Custom CNN selected due to +1.93% accuracy, +0.60% ROC-AUC, and ~18ms CPU latency.',
              },
              {
                title: 'Dataset Details',
                content: 'Clinical module trained on MultiSymptoms Dataset. Imaging module evaluated on the Kaggle Chest X-ray dataset. NLP leverages 4,966 records from the MTSamples semantic index.',
              },
              {
                title: 'Explainability Details',
                content: 'TreeSHAP calculates the exact marginal game-theoretic contribution of each symptom. Dynamic Grad-CAM attention at layer block4.0 highlights focal radiographic findings.',
              },
              {
                title: 'Architecture Overview',
                content: 'Frontend: React 18 + Vite, TypeScript, Tailwind CSS. API Gateway: FastAPI (Python) for asynchronous endpoints. XAI Inference: PyTorch & XGBoost. Persistence layer: SQLAlchemy with SQLite/PostgreSQL.',
              }
            ].map((item, i) => (
              <div key={i} className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 overflow-hidden shadow-sm">
                <button
                  onClick={() => toggleAccordion(i)}
                  className="w-full flex items-center justify-between p-4 text-left focus:outline-none hover:bg-zinc-100 dark:hover:bg-zinc-800/50 transition-colors"
                >
                  <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{item.title}</span>
                  <ChevronDown className={`w-4 h-4 text-zinc-500 transition-transform ${openAccordion === i ? 'rotate-180' : ''}`} />
                </button>
                {openAccordion === i && (
                  <div className="p-4 pt-0 text-sm text-zinc-600 dark:text-zinc-400 border-t border-zinc-200 dark:border-zinc-800 mt-2 bg-white dark:bg-zinc-950">
                    <p className="pt-2">{item.content}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 9. Final CTA */}
      <section className="py-32 bg-zinc-50 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-8">
          <h2 className="text-3xl md:text-4xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
            Explore the Intelligence Behind MedIntel AI
          </h2>
          <button
            onClick={() => onEnterApp('dashboard')}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white text-base font-medium transition-colors duration-150"
          >
            Launch MedIntel AI <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </section>

      {/* 10. Footer */}
      <footer className="bg-zinc-950 text-zinc-400 py-12 text-sm border-t border-zinc-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center md:items-start gap-8">
          <div className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-emerald-500" />
            <span className="font-semibold text-zinc-100 tracking-tight">MEDINTEL.AI</span>
          </div>
          <div className="text-center md:text-left max-w-sm text-xs">
            Prototype clinical decision-support system designed for educational and research evaluation. Not an autonomous diagnostic device.
          </div>
          <div className="flex flex-wrap justify-center items-center gap-6">
            <button onClick={() => scrollToSection('overview')} className="hover:text-zinc-100 transition-colors">Platform</button>
            <button onClick={() => scrollToSection('performance')} className="hover:text-zinc-100 transition-colors">Performance</button>
            <button onClick={() => scrollToSection('explainability')} className="hover:text-zinc-100 transition-colors">Explainability</button>
            <ThemeToggle />
          </div>
        </div>
      </footer>
    </div>
  );
};
