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
  let strokeColor = '#0284c7'; // clinical sky-600
  let badgeColor = 'bg-sky-50 text-sky-700 border-sky-200';

  if (level) {
    if (level === 'HIGH') {
      strokeColor = '#0d9488'; // teal-600
      badgeColor = 'bg-teal-50 text-teal-700 border-teal-200';
    } else if (level === 'MODERATE') {
      strokeColor = '#d97706'; // amber-600
      badgeColor = 'bg-amber-50 text-amber-700 border-amber-200';
    } else {
      strokeColor = '#e11d48'; // rose-600
      badgeColor = 'bg-rose-50 text-rose-700 border-rose-200';
    }
  } else {
    if (clampedValue >= 75) {
      strokeColor = '#0d9488';
      badgeColor = 'bg-teal-50 text-teal-700 border-teal-200';
    } else if (clampedValue >= 50) {
      strokeColor = '#0284c7';
      badgeColor = 'bg-sky-50 text-sky-700 border-sky-200';
    } else if (clampedValue >= 25) {
      strokeColor = '#d97706';
      badgeColor = 'bg-amber-50 text-amber-700 border-amber-200';
    } else {
      strokeColor = '#e11d48';
      badgeColor = 'bg-rose-50 text-rose-700 border-rose-200';
    }
  }

  // Semi-circle SVG parameters
  const strokeWidth = 12;
  const radius = (size - strokeWidth) / 2;
  const circumference = Math.PI * radius;
  const strokeDashoffset = circumference - (clampedValue / 100) * circumference;

  return (
    <div className="flex flex-col items-center justify-center p-4 bg-white border border-slate-200 rounded-xl shadow-sm">
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
            stroke="#f1f5f9"
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
          <span className="text-2xl font-bold tracking-tight text-slate-900 font-mono">
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
        <h4 className="text-xs font-semibold text-slate-800">{title}</h4>
        {subtitle && <p className="text-[10px] text-slate-500 mt-0.5">{subtitle}</p>}
      </div>
    </div>
  );
};
