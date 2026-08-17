import { useTranslation } from 'react-i18next';
import { Globe, ChevronDown } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

export function LanguageSwitcher() {
  const { t, i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const languages = [
    { code: 'en', name: 'English', label: 'English' },
    { code: 'hi', name: 'हिन्दी', label: 'Hindi' },
    { code: 'mr', name: 'मराठी', label: 'Marathi' },
  ];

  const currentLanguage = languages.find((lang) => lang.code === i18n.language) || languages[0];

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleLanguageChange = (code: string) => {
    i18n.changeLanguage(code);
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className="relative inline-block">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-100 transition text-sm font-medium text-slate-700"
        title={t('layout.changeLanguage')}
        aria-label={t('language.selectLanguage')}
        aria-expanded={isOpen}
      >
        <Globe className="h-4 w-4" />
        <span className="hidden sm:inline">{currentLanguage.name}</span>
        <ChevronDown className={`h-4 w-4 transition ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full right-0 mt-2 w-40 bg-white rounded-lg shadow-lg border border-slate-200 z-50">
          {languages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => handleLanguageChange(lang.code)}
              className={`w-full text-left px-4 py-2.5 text-sm font-medium transition ${
                i18n.language === lang.code
                  ? 'bg-gov-50 text-gov-600 border-l-2 border-gov-600'
                  : 'text-slate-700 hover:bg-slate-50'
              }`}
            >
              <span className="flex items-center justify-between">
                <span>{lang.name}</span>
                {i18n.language === lang.code && (
                  <span className="h-2 w-2 rounded-full bg-gov-600" />
                )}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
