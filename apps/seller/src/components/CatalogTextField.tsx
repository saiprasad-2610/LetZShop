import React, { useId } from 'react';
import { clampCatalogText } from '@simply/types';
import { useSellerI18n } from '@simply/i18n';

export function CatalogTextField({ label, value, max, onChange, placeholder, multiline = false }: {
  label: string;
  value: string;
  max: number;
  onChange: (value: string) => void;
  placeholder: string;
  multiline?: boolean;
}) {
  const id = useId();
  const { t } = useSellerI18n();
  const props = {
    id,
    value,
    maxLength: max,
    onChange: (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => onChange(clampCatalogText(event.target.value, max)),
    placeholder,
    'aria-describedby': `${id}-count`,
    className: 'w-full px-3 py-2 text-xs border border-slate-300 rounded-xl leading-relaxed',
  };
  return (
    <div>
      <label htmlFor={id} className="block text-xs font-semibold text-slate-700 mb-1">{label}</label>
      {multiline ? <textarea {...props} rows={2} /> : <input {...props} type="text" />}
      <p id={`${id}-count`} data-catalog-counter className={`mt-1 text-right text-[11px] tabular-nums ${value.length >= max * 0.9 ? 'text-amber-700' : 'text-slate-500'}`}>
        <span className="sr-only">{t('brandStudio.characterCount')}: </span>{value.length} / {max}
      </p>
    </div>
  );
}
