import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Clock, Mic, Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useMedicineSuggestions } from '@/hooks/use-medicine-suggestions';
import { useRecentSearchesStore } from '@/stores/recent-searches-store';
import { useToast } from '@/hooks/use-toast';
import { VOICE_SEARCH_DEMO_QUERY } from '@/lib/search-constants';
import { cn } from '@/lib/utils';
import type { Medicine } from '@/types';

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (value: string) => void;
  onSelectSuggestion?: (medicine: Medicine) => void;
  className?: string;
}

export function SearchInput({ value, onChange, onSubmit, onSelectSuggestion, className }: SearchInputProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const { queries, add, remove, clearAll } = useRecentSearchesStore();
  const { data: suggestions } = useMedicineSuggestions(value, open);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = value.trim();
    if (trimmed) add(trimmed);
    onSubmit(trimmed);
    setOpen(false);
  };

  const pickSuggestion = (medicine: Medicine) => {
    onChange(medicine.name);
    add(medicine.name);
    onSelectSuggestion?.(medicine);
    onSubmit(medicine.name);
    setOpen(false);
  };

  const pickRecent = (q: string) => {
    onChange(q);
    onSubmit(q);
    setOpen(false);
  };

  const handleVoice = () => {
    onChange(VOICE_SEARCH_DEMO_QUERY);
    toast({ title: t('search.voiceDemo'), description: t('search.voiceDemoHint') });
    onSubmit(VOICE_SEARCH_DEMO_QUERY);
    add(VOICE_SEARCH_DEMO_QUERY);
    setOpen(false);
  };

  const showPanel = open && (value.length >= 2 || queries.length > 0);

  return (
    <div ref={containerRef} className={cn('relative flex-1', className)}>
      <form onSubmit={handleSubmit} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-secondary" />
          <Input
            className="pl-9 pr-9"
            placeholder={t('search.placeholder')}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onFocus={() => setOpen(true)}
            aria-label={t('search.placeholder')}
            aria-expanded={showPanel}
            aria-autocomplete="list"
            data-testid="search-input"
          />
          {value && (
            <button
              type="button"
              className="absolute right-2 top-1/2 -translate-y-1/2 text-text-secondary"
              onClick={() => onChange('')}
              aria-label={t('search.clearQuery')}
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <Button
          type="button"
          variant="secondary"
          size="icon"
          aria-label={t('search.voiceSearch')}
          onClick={handleVoice}
          data-testid="voice-search-btn"
        >
          <Mic className="h-4 w-4" />
        </Button>
      </form>

      {showPanel && (
        <div
          className="absolute left-0 right-0 top-full z-40 mt-1 rounded-[var(--radius-md)] border border-border-subtle bg-surface-base shadow-[var(--elevation-2)] max-h-72 overflow-y-auto"
          data-testid="search-suggestions"
        >
          {value.length >= 2 && suggestions?.data && suggestions.data.length > 0 && (
            <div className="p-2">
              <p className="px-2 py-1 text-xs text-text-secondary">{t('search.suggestions')}</p>
              {suggestions.data.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  className="w-full text-left px-3 py-2 rounded-[var(--radius-sm)] hover:bg-surface-raised text-sm"
                  onClick={() => pickSuggestion(m)}
                >
                  <span className="font-medium">{m.name}</span>
                  {m.genericName && (
                    <span className="block text-xs text-text-secondary">{m.genericName} · {m.company}</span>
                  )}
                </button>
              ))}
            </div>
          )}

          {queries.length > 0 && (
            <div className="p-2 border-t border-border-subtle">
              <div className="flex items-center justify-between px-2 py-1">
                <p className="text-xs text-text-secondary">{t('search.recentSearches')}</p>
                <button type="button" className="text-xs text-primary" onClick={clearAll}>
                  {t('search.clearRecent')}
                </button>
              </div>
              {queries.map((q) => (
                <div key={q} className="flex items-center gap-1">
                  <button
                    type="button"
                    className="flex-1 flex items-center gap-2 px-3 py-2 rounded-[var(--radius-sm)] hover:bg-surface-raised text-sm text-left"
                    onClick={() => pickRecent(q)}
                  >
                    <Clock className="h-3.5 w-3.5 text-text-secondary shrink-0" />
                    {q}
                  </button>
                  <button
                    type="button"
                    className="p-2 text-text-secondary"
                    aria-label={t('search.removeRecent', { query: q })}
                    onClick={() => remove(q)}
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
