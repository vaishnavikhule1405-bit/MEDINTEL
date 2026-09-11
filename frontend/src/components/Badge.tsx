import React from 'react';

type BadgeVariant = 'operational' | 'development' | 'research' | 'beta' | 'synthetic';

interface BadgeProps {
  variant: BadgeVariant;
  label?: string;
  className?: string;
}

const VARIANT_STYLES: Record<BadgeVariant, { dot: string; text: string; container: string; defaultLabel: string }> = {
  operational: {
    dot: 'bg-emerald-500',
    text: 'text-emerald-700 dark:text-emerald-400',
    container: 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800',
    defaultLabel: 'Operational',
  },
  development: {
    dot: 'bg-amber-500',
    text: 'text-amber-700 dark:text-amber-400',
    container: 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800',
    defaultLabel: 'In Development',
  },
  beta: {
    dot: 'bg-blue-500',
    text: 'text-blue-700 dark:text-blue-400',
    container: 'bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800',
    defaultLabel: 'Beta',
  },
  research: {
    dot: 'bg-purple-500',
    text: 'text-purple-700 dark:text-purple-400',
    container: 'bg-purple-50 dark:bg-purple-950/40 border-purple-200 dark:border-purple-800',
    defaultLabel: 'Research',
  },
  synthetic: {
    dot: 'bg-orange-500',
    text: 'text-orange-700 dark:text-orange-400',
    container: 'bg-orange-50 dark:bg-orange-950/40 border-orange-200 dark:border-orange-800',
    defaultLabel: 'Synthetic Demo',
  },
};

export const Badge: React.FC<BadgeProps> = ({ variant, label, className = '' }) => {
  const styles = VARIANT_STYLES[variant];
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-2xs font-medium border ${styles.container} ${styles.text} ${className}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${styles.dot} shrink-0`} />
      {label ?? styles.defaultLabel}
    </span>
  );
};

export default Badge;
