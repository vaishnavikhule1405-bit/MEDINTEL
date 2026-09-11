import React from 'react';
import { Sparkles } from 'lucide-react';

interface SyntheticBadgeProps {
  caseId?: string;
  className?: string;
}

export const SyntheticBadge: React.FC<SyntheticBadgeProps> = ({ caseId, className = '' }) => {
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-200 shadow-sm ${className}`}
      title="Synthesized across independent research datasets for multimodal benchmarking."
    >
      <Sparkles className="w-3 h-3 text-amber-600 shrink-0" />
      <span>SYNTHETIC BENCHMARK</span>
      {caseId && <span className="font-mono text-amber-700 text-[10px]">({caseId})</span>}
    </span>
  );
};
