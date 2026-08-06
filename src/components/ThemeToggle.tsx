import { useTheme } from '../context/ThemeContext';
import { Sun, Moon } from 'lucide-react';

interface ThemeToggleProps {
  className?: string;
  showLabel?: boolean;
}

export default function ThemeToggle({ className = '', showLabel = false }: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      type="button"
      title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
      aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
      className={`p-2 rounded-xl transition-all duration-200 flex items-center gap-2 border ${
        theme === 'dark'
          ? 'bg-slate-800 text-amber-300 border-slate-700 hover:bg-slate-700'
          : 'bg-gray-100 text-slate-700 border-gray-200 hover:bg-gray-200'
      } ${className}`}
    >
      {theme === 'dark' ? (
        <Sun size={18} className="text-amber-300 animate-pulse-subtle" />
      ) : (
        <Moon size={18} className="text-slate-700" />
      )}
      {showLabel && (
        <span className="text-xs font-bold uppercase tracking-wider">
          {theme === 'dark' ? 'Light' : 'Dark'}
        </span>
      )}
    </button>
  );
}
