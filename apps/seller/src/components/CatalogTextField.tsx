import React, { useId } from 'react';
import { brandTextLimit, clampCatalogText } from '@simply/types';
import { useSellerI18n } from '@simply/i18n';

export function CatalogTextField({
  label,
  value,
  max,
  onChange,
  placeholder,
  multiline = false,
  rows = 2,
  type = 'text',
  inputClassName,
  labelClassName,
  fieldKey,
}: {
  label: string;
  value: string;
  max: number;
  onChange: (value: string) => void;
  placeholder?: string;
  multiline?: boolean;
  rows?: number;
  type?: React.HTMLInputTypeAttribute;
  inputClassName?: string;
  labelClassName?: string;
  fieldKey?: string;
}) {
  const id = useId();
  const { t } = useSellerI18n();
  const imageResource =
    fieldKey === 'pages.home.heroBannerUrl' ||
    fieldKey === 'pages.about.bannerUrl';
  const effectiveMax = brandTextLimit(value, max, imageResource);
  const props = {
    id,
    value,
    maxLength: effectiveMax,
    onChange: (
      event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
    ) =>
      onChange(
        clampCatalogText(
          event.target.value,
          brandTextLimit(event.target.value, max, imageResource),
        ),
      ),
    placeholder,
    'aria-describedby': `${id}-count`,
    className:
      inputClassName ||
      'w-full px-3 py-2 text-xs border border-slate-300 rounded-xl leading-relaxed',
    'data-brand-field': fieldKey,
  };
  return (
    <div>
      <label
        htmlFor={id}
        className={
          labelClassName || 'block text-xs font-semibold text-slate-700 mb-1'
        }
      >
        {label}
      </label>
      {multiline ? (
        <textarea {...props} rows={rows} />
      ) : (
        <input {...props} type={type} />
      )}
      <p
        id={`${id}-count`}
        data-catalog-counter
        data-brand-counter
        data-at-limit={value.length === effectiveMax || undefined}
        className={`mt-1 text-right text-[11px] tabular-nums ${value.length >= effectiveMax * 0.9 ? 'text-amber-700' : 'text-slate-500'} ${value.length === effectiveMax ? 'font-semibold' : ''}`}
      >
        <span className="sr-only">{t('brandStudio.characterCount')}: </span>
        {value.length} / {effectiveMax}
      </p>
    </div>
  );
}
