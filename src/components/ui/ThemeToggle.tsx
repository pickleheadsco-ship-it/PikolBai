import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

interface ThemeToggleProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({
  className = '',
  size = 'md',
  showLabel = false,
}) => {
  const { theme, toggleTheme, isDark } = useTheme();

  const sizeClasses = {
    sm: 'p-1.5 rounded-xl text-xs',
    md: 'p-2 rounded-2xl text-xs',
    lg: 'px-3 py-2 rounded-2xl text-sm',
  }[size];

  const iconSizes = {
    sm: 'w-3.5 h-3.5',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  }[size];

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={isDark ? 'Switch to light mode (currently Dark)' : 'Switch to dark mode (currently Light)'}
      className={`relative inline-flex items-center justify-center gap-1.5 font-black transition-all cursor-pointer clay-btn select-none ${
        isDark
          ? 'bg-slate-800 text-amber-400 hover:text-amber-300 hover:bg-slate-700/80 shadow-xs border border-slate-700/60 ring-amber-400/20 hover:ring-2'
          : 'bg-white text-slate-700 hover:text-slate-900 hover:bg-slate-50 shadow-xs border border-slate-200/80 ring-emerald-500/10 hover:ring-2'
      } ${sizeClasses} ${className}`}
    >
      <div className="relative flex items-center justify-center">
        {isDark ? (
          <Sun className={`${iconSizes} text-amber-400 animate-in spin-in-180 duration-300 drop-shadow-[0_0_6px_rgba(251,191,36,0.5)]`} />
        ) : (
          <Moon className={`${iconSizes} text-indigo-600 animate-in spin-in-180 duration-300 drop-shadow-[0_0_4px_rgba(99,102,241,0.3)]`} />
        )}
      </div>

      {showLabel && (
        <span className="font-bold text-xs tracking-tight">
          {isDark ? 'Light' : 'Dark'}
        </span>
      )}
    </button>
  );
};
