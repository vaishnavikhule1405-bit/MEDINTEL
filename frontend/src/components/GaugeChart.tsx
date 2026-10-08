import React from 'react';

interface GaugeChartProps {
  value: number; // 0.0 to 1.0 or 0 to 100
  title: string;
  subtitle?: string;
  size?: number;
  showPercentage?: boolean;
  level?: 'LOW' | 'MODERATE' | 'HIGH' | string;
}

export const GaugeChart: React.FC<GaugeChartProps> = ({
  value,
  title,
  subtitle,
  size = 170,
  showPercentage = true,
  level,
}) => {
  // Normalize value to 0-100
  const normalizedValue = value <= 1.0 ? Math.round(value * 100) : Math.round(value);
  const clampedValue = Math.max(0, Math.min(100, normalizedValue));

  // Determine color theme
  let strokeColor = '#10b981'; // MedIntel emerald
  let badgeColor = 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/60';

  if (level) {
    if (level === 'HIGH' || level === 'CONCORDANT') {
      strokeColor = '#10b981'; // emerald
      badgeColor = 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/60';
    } else if (level === 'MODERATE' || level === 'PARTIAL') {
      strokeColor = '#f59e0b'; // amber
      badgeColor = 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800/60';
    } else {
      strokeColor = '#ef4444'; // rose
      badgeColor = 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800/60';
    }
  } else {
    if (clampedValue >= 75) {
      strokeColor = '#10b981';
      badgeColor = 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/60';
    } else if (clampedValue >= 50) {
      strokeColor = '#0ea5e9';
      badgeColor = 'bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-400 border-sky-200 dark:border-sky-800/60';
    } else if (clampedValue >= 25) {
      strokeColor = '#f59e0b';
      badgeColor = 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800/60';
    } else {
      strokeColor = '#ef4444';
      badgeColor = 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800/60';
    }
  }

  // Semi-circle SVG parameters
  const strokeWidth = 12;
  const radius = (size - strokeWidth) / 2;
  const circumference = Math.PI * radius;
  const strokeDashoffset = circumference - (clampedValue / 100) * circumference;

  return (
    <div className="flex flex-col items-center justify-center p-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm transition-all duration-200">
      <div className="relative flex items-center justify-center" style={{ width: size, height: size / 1.65 }}>
        <svg
          width={size}
          height={size / 1.5}
          className="overflow-visible"
          viewBox={`0 0 ${size} ${size / 1.5}`}
        >
          {/* Background track */}
          <path
            d={`M ${strokeWidth / 2},${size / 2} A ${radius},${radius} 0 0,1 ${size - strokeWidth / 2},${size / 2}`}
            fill="none"
            className="stroke-zinc-100 dark:stroke-zinc-800"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />
          {/* Active progress arc */}
          <path
            d={`M ${strokeWidth / 2},${size / 2} A ${radius},${radius} 0 0,1 ${size - strokeWidth / 2},${size / 2}`}
            fill="none"
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            style={{ transition: 'stroke-dashoffset 0.8s ease-in-out' }}
          />
        </svg>

        {/* Center label */}
        <div className="absolute bottom-1 flex flex-col items-center">
          <span className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 font-mono">
            {clampedValue}{showPercentage ? '%' : ''}
          </span>
          {level && (
            <span className={`text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 mt-0.5 rounded border ${badgeColor}`}>
              {level} Evidence
            </span>
          )}
        </div>
      </div>

      <div className="text-center mt-2.5">
        <h4 className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">{title}</h4>
        {subtitle && <p className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-0.5">{subtitle}</p>}
      </div>
    </div>
  );
};

