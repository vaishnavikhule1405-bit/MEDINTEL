import React, { useState } from 'react';
import { SafetyDisclaimer } from '../components/SafetyDisclaimer';
import { Badge } from '../components/Badge';
import { Upload, FileText, Search, Info } from 'lucide-react';

const PLANNED_CATEGORIES = [
  { name: 'PROBLEM', desc: 'Diseases, disorders, and diagnostic findings', color: 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800' },
  { name: 'SYMPTOM', desc: 'Subjective patient complaints & clinical signs', color: 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800' },
  { name: 'MEDICATION', desc: 'Active pharmacotherapy and dosages', color: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800' },
  { name: 'TEST', desc: 'Laboratory, imaging, and diagnostic investigations', color: 'bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-400 border-sky-200 dark:border-sky-800' },
  { name: 'ANATOMY', desc: 'Body organs, anatomical landmarks, and sites', color: 'bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-800' },
  { name: 'PROCEDURE', desc: 'Surgical, interventional, or therapeutic procedures', color: 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800' },
];

const SAMPLE_TRANSCRIPTION = `CHIEF COMPLAINT: Acute productive cough with yellowish sputum, fever of 102.4F, and progressive shortness of breath for 4 days.

HISTORY OF PRESENT ILLNESS: A 58-year-old male presents with worsening dyspnea and pleuritic right-sided chest pain. Patient denies hemoptysis and reports no nausea or vomiting. Past medical history notable for mild asthma.

PHYSICAL EXAMINATION: Temperature 102.4F, respiration 24/min, SpO2 91% on room air. Auscultation reveals crackles over the right lower lung field.

IMPRESSION: Right lower lobe community-acquired pneumonia. Plan: Initiate IV Ceftriaxone 1g daily and Azithromycin 500mg. Chest radiograph ordered.`;

export const NLPView: React.FC = () => {
  const [demoText, setDemoText] = useState(SAMPLE_TRANSCRIPTION);

  return (
    <div className="space-y-6 animate-fade-in">
      <SafetyDisclaimer />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">Medical Reports</h1>
            <Badge variant="development" label="In Development" />
          </div>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">Biomedical NLP entity extraction — coming soon</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <FileText className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              Clinical Notes
            </h2>
            <button disabled className="px-3 py-1.5 rounded-md border border-zinc-200 dark:border-zinc-700 text-zinc-400 dark:text-zinc-500 text-sm font-medium cursor-not-allowed flex items-center gap-2">
              <Upload className="w-4 h-4" />
              Upload PDF
            </button>
          </div>

          <textarea
            value={demoText}
            onChange={(e) => setDemoText(e.target.value)}
            rows={12}
            className="w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50 text-zinc-900 dark:text-zinc-100 p-4 text-sm font-mono leading-relaxed resize-none focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            placeholder="Clinical transcription or EHR progress note..."
          />

          <div className="flex justify-end pt-2">
            <button 
              disabled 
              title="Coming soon"
              className="px-4 py-2 rounded-md bg-zinc-200 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-500 text-sm font-medium cursor-not-allowed transition-colors duration-150"
            >
              Analyze Report
            </button>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6">
            <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 mb-4">Target Clinical Entities</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {PLANNED_CATEGORIES.map((cat) => (
                <div key={cat.name} className="p-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50">
                  <span className={`text-xs font-mono font-medium px-2 py-0.5 rounded-md border ${cat.color}`}>
                    {cat.name}
                  </span>
                  <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-2">{cat.desc}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6">
             <div className="flex items-center gap-2 mb-2">
               <Search className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
               <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">Semantic Retrieval</h2>
             </div>
             <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
               S-PubMedBERT embeddings will index clinical notes to retrieve semantically similar patient presentations across the MTSamples Corpus.
             </p>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/20 p-4 flex gap-3">
        <Info className="w-5 h-5 text-amber-600 dark:text-amber-500 shrink-0 mt-0.5" />
        <p className="text-sm text-amber-800 dark:text-amber-300">
          This interface is prepared for NLP module integration. Backend API endpoints are operational at <code className="font-mono text-xs px-1 py-0.5 rounded bg-amber-100/50 dark:bg-amber-900/30">/api/nlp/analyze</code>.
        </p>
      </div>
    </div>
  );
};
