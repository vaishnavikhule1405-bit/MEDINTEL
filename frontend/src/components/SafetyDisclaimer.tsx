import React, { useState } from 'react';
import { ShieldAlert, ChevronDown, ChevronUp } from 'lucide-react';

export const SafetyDisclaimer: React.FC = () => {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="rounded-lg border border-amber-200 dark:border-amber-800/60 bg-amber-50 dark:bg-amber-950/30 px-4 py-2.5 text-xs">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <ShieldAlert className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
          <p className="text-amber-800 dark:text-amber-300 font-medium truncate">
            AI-assisted clinical decision support — not a substitute for professional medical judgment.
          </p>
        </div>
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1 text-amber-700 dark:text-amber-400 hover:text-amber-900 dark:hover:text-amber-200 transition-colors shrink-0 text-2xs font-medium"
        >
          {expanded ? 'Less' : 'Details'}
          {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        </button>
      </div>

      {expanded && (
        <div className="mt-2.5 pt-2.5 border-t border-amber-200 dark:border-amber-800/60 text-amber-800 dark:text-amber-300 space-y-1 leading-relaxed">
          <p>
            MedIntel AI is an AI-assisted clinical decision-support prototype intended for research and educational purposes.
            Outputs represent mathematical model predictions and do not constitute confirmed diagnoses, prescriptions, or autonomous clinical decisions.
          </p>
          <p>
            Human clinician oversight is strictly required. Datasets used for training are independent research datasets and do not represent the same patients across modalities.
          </p>
        </div>
      )}
    </div>
  );
};

export default SafetyDisclaimer;
