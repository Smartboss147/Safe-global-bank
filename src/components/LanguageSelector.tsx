import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { Globe, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const languages = [
  { code: 'en', name: 'English', native: 'English' },
  { code: 'es', name: 'Spanish', native: 'Español' },
  { code: 'zh', name: 'Chinese', native: '中文' },
  { code: 'fr', name: 'French', native: 'Français' },
  { code: 'de', name: 'German', native: 'Deutsch' },
  { code: 'ja', name: 'Japanese', native: '日本語' },
  { code: 'pt', name: 'Portuguese', native: 'Português' },
  { code: 'ru', name: 'Russian', native: 'Русский' },
  { code: 'ar', name: 'Arabic', native: 'العربية' },
  { code: 'hi', name: 'Hindi', native: 'हिन्दी' },
  { code: 'it', name: 'Italian', native: 'Italiano' },
  { code: 'ko', name: 'Korean', native: '한국어' },
  { code: 'nl', name: 'Dutch', native: 'Nederlands' },
  { code: 'tr', name: 'Turkish', native: 'Türkçe' },
  { code: 'vi', name: 'Vietnamese', native: 'Tiếng Việt' },
] as const;

export default function LanguageSelector() {
  const { language, setLanguage } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);

  const currentLang = languages.find(l => l.code === language) || languages[0];

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-200 hover:bg-gray-200 dark:hover:bg-slate-700 text-xs font-semibold transition border border-gray-200 dark:border-slate-700"
        title="Select Language"
      >
        <Globe size={15} className="text-blue-600 dark:text-blue-400" />
        <span className="hidden sm:inline">{currentLang.native}</span>
        <span className="sm:hidden uppercase">{currentLang.code}</span>
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div className="fixed inset-0 z-50" onClick={() => setIsOpen(false)} />
            <motion.div 
              initial={{ opacity: 0, y: 8, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.95 }}
              className="absolute right-0 mt-2 w-52 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl z-50 border border-gray-100 dark:border-slate-700 py-2 max-h-80 overflow-y-auto"
            >
              <div className="px-3 py-2 border-b border-gray-100 dark:border-slate-700">
                <p className="text-[10px] font-bold text-gray-400 dark:text-slate-400 uppercase tracking-wider">Select Language</p>
              </div>
              <div className="py-1">
                {languages.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => {
                      setLanguage(lang.code as any);
                      setIsOpen(false);
                    }}
                    className={`w-full text-left px-4 py-2 text-xs flex items-center justify-between hover:bg-gray-50 dark:hover:bg-slate-700/60 transition ${
                      language === lang.code ? 'text-blue-600 dark:text-blue-400 font-bold bg-blue-50/50 dark:bg-blue-950/30' : 'text-gray-700 dark:text-slate-200 font-medium'
                    }`}
                  >
                    <span>{lang.native} <span className="text-gray-400 dark:text-slate-400 text-[10px]">({lang.name})</span></span>
                    {language === lang.code && <Check size={14} className="text-blue-600 dark:text-blue-400" />}
                  </button>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
