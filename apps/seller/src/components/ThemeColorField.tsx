import React, { useEffect, useId, useRef, useState } from 'react';
import { normalizeHexColor } from '@simply/ui';
import { useSellerI18n } from '@simply/i18n';

export function ThemeColorField({ label, value, onChange, onValidityChange }: {
  label: string;
  value: string;
  onChange: (color: string) => void;
  onValidityChange: (valid: boolean) => void;
}) {
  const { t } = useSellerI18n();
  const [draft, setDraft] = useState(value);
  const id = useId();
  const validityCallback = useRef(onValidityChange);
  validityCallback.current = onValidityChange;
  useEffect(() => {
    setDraft((current) => normalizeHexColor(current) === value ? current : value);
    validityCallback.current(true);
  }, [value]);
  const valid = normalizeHexColor(draft) !== null;
  return (
    <div>
      <label htmlFor={id} className="text-xs font-semibold text-slate-700 block mb-1">{label}</label>
      <div className="flex items-center gap-2">
        <input type="color" value={value} aria-label={label} onChange={(event) => {
          const next = normalizeHexColor(event.target.value)!;
          setDraft(next); onChange(next); onValidityChange(true);
        }} className="w-9 h-9 rounded-lg border border-slate-300 cursor-pointer p-0.5" />
        <input id={id} type="text" value={draft} spellCheck={false} maxLength={7} aria-invalid={!valid}
          aria-describedby={!valid ? `${id}-error` : undefined}
          onChange={(event) => {
            const next = event.target.value;
            setDraft(next); const color = normalizeHexColor(next);
            onValidityChange(color !== null); if (color) onChange(color);
          }}
          onBlur={() => { const color = normalizeHexColor(draft); if (color) setDraft(color); }}
          className="text-xs font-mono uppercase px-2 py-1.5 border border-slate-300 rounded-lg w-24" />
      </div>
      {!valid && <p id={`${id}-error`} role="alert" className="text-xs text-red-600 mt-1">{t('brandStudio.validHex')}</p>}
    </div>
  );
}
