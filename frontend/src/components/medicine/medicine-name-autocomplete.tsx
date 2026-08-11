import { useEffect, useId, useRef, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useMedicineSuggestions } from '@/hooks/use-medicine-suggestions';
import { findReliableMedicineMatch } from '@/lib/medicine-autofill';
import type { Medicine } from '@/types';

type MedicineNameAutocompleteProps = {
  label: string;
  value: string;
  placeholder?: string;
  disabled?: boolean;
  onValueChange: (value: string) => void;
  onMedicineSelect: (medicine: Medicine) => void;
  onExistingMedicineSelect?: (medicine: Medicine) => void;
  inputTestId?: string;
  resultsTestId?: string;
};

export function MedicineNameAutocomplete({
  label,
  value,
  placeholder,
  disabled = false,
  onValueChange,
  onMedicineSelect,
  onExistingMedicineSelect,
  inputTestId = 'medicine-name-input',
  resultsTestId = 'medicine-name-results',
}: MedicineNameAutocompleteProps) {
  const listboxId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const lastAutoApplied = useRef('');
  const [showResults, setShowResults] = useState(false);
  const { data, isFetching } = useMedicineSuggestions(value, !disabled);

  const medicines = data?.data ?? [];

  useEffect(() => {
    if (disabled || value.trim().length < 2) return;
    const reliable = findReliableMedicineMatch(value, medicines);
    if (!reliable) return;
    const key = `${value.trim().toLowerCase()}:${reliable.id}`;
    if (lastAutoApplied.current === key) return;
    lastAutoApplied.current = key;
    onMedicineSelect(reliable);
    setShowResults(false);
  }, [disabled, medicines, onMedicineSelect, value]);

  const handleSelect = (medicine: Medicine) => {
    onValueChange(medicine.name);
    onMedicineSelect(medicine);
    onExistingMedicineSelect?.(medicine);
    setShowResults(false);
  };

  const canShowResults = !disabled && value.trim().length >= 2 && (showResults || medicines.length > 0);

  return (
    <div className="min-w-0">
      <Label htmlFor={inputTestId}>{label}</Label>
      <Input
        id={inputTestId}
        ref={inputRef}
        value={value}
        disabled={disabled}
        placeholder={placeholder}
        data-testid={inputTestId}
        aria-autocomplete="list"
        aria-controls={canShowResults ? listboxId : undefined}
        aria-expanded={canShowResults}
        className="mt-1"
        onChange={(event) => {
          onValueChange(event.target.value);
          lastAutoApplied.current = '';
          setShowResults(event.target.value.trim().length >= 2);
        }}
        onFocus={() => {
          if (value.trim().length >= 2) setShowResults(true);
        }}
      />
      {canShowResults && (
        <div
          id={listboxId}
          role="listbox"
          className="mt-2 max-h-40 overflow-y-auto rounded-[var(--radius-md)] border border-border-subtle bg-surface-base"
          data-testid={resultsTestId}
        >
          {isFetching && medicines.length === 0 ? (
            <p className="p-2 text-sm text-text-secondary">Searching...</p>
          ) : medicines.length > 0 ? (
            medicines.map((medicine) => (
              <button
                key={medicine.id}
                type="button"
                role="option"
                className="w-full min-w-0 p-2 text-left text-sm hover:bg-surface-raised"
                onClick={() => handleSelect(medicine)}
              >
                <span className="block font-medium break-words">{medicine.name}</span>
                <span className="block text-xs text-text-secondary break-words">
                  {[medicine.company, medicine.strength, medicine.packSize].filter(Boolean).join(' · ')}
                </span>
              </button>
            ))
          ) : (
            <p className="p-2 text-sm text-text-secondary">No medicines found. Continue entering manually.</p>
          )}
        </div>
      )}
    </div>
  );
}
