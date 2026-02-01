import * as React from 'react';

export interface LanguageSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  value?: string;
  onValueChange?: (value: string) => void;
}

const LANGUAGES = [
  { code: 'ja', name: '日本語 (Japanese)' },
  { code: 'en', name: 'English' },
  { code: 'zh', name: '中文 (Chinese)' },
  { code: 'ko', name: '한국어 (Korean)' },
  { code: 'es', name: 'Español (Spanish)' },
  { code: 'fr', name: 'Français (French)' },
  { code: 'de', name: 'Deutsch (German)' },
  { code: 'it', name: 'Italiano (Italian)' },
  { code: 'pt', name: 'Português (Portuguese)' },
  { code: 'ru', name: 'Русский (Russian)' },
  { code: 'ar', name: 'العربية (Arabic)' },
  { code: 'hi', name: 'हिन्दी (Hindi)' },
];

const LanguageSelect = React.forwardRef<HTMLSelectElement, LanguageSelectProps>(
  ({ className = '', value, onValueChange, ...props }, ref) => {
    const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      onValueChange?.(e.target.value);
    };

    return (
      <select
        ref={ref}
        value={value || 'ja'}
        onChange={handleChange}
        className={`flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
        {...props}
      >
        <option value="" disabled>
          Select a language
        </option>
        {LANGUAGES.map((lang) => (
          <option key={lang.code} value={lang.code}>
            {lang.name}
          </option>
        ))}
      </select>
    );
  }
);
LanguageSelect.displayName = 'LanguageSelect';

export { LanguageSelect, LANGUAGES };
