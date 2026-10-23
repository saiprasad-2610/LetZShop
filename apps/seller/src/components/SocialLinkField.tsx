import React, { useId } from 'react';
import {
  parseSocialLink,
  SOCIAL_INPUT_EXAMPLES,
  SOCIAL_LINK_MAX,
  SocialPlatform,
} from '@simply/types';
import { useSellerI18n } from '@simply/i18n';

export function SocialLinkField({
  platform,
  label,
  value,
  onChange,
}: {
  platform: SocialPlatform;
  label: React.ReactNode;
  value: string;
  onChange: (value: string) => void;
}) {
  const id = useId();
  const { t } = useSellerI18n();
  const result = parseSocialLink(platform, value);
  return (
    <div className="space-y-1.5 min-w-0">
      <label
        htmlFor={id}
        className="text-xs font-semibold text-slate-700 flex items-center gap-1.5"
      >
        {label}
      </label>
      <input
        id={id}
        type="text"
        value={value}
        maxLength={SOCIAL_LINK_MAX}
        data-social-field={platform}
        aria-invalid={!result.valid || undefined}
        aria-describedby={`${id}-help`}
        onChange={(event) =>
          onChange(event.target.value.slice(0, SOCIAL_LINK_MAX))
        }
        placeholder={SOCIAL_INPUT_EXAMPLES[platform].split(' or ')[0]}
        className={`w-full px-3 py-2 text-xs border rounded-xl focus:ring-1 transition ${result.valid ? 'border-slate-300 focus:border-blue-500 focus:ring-blue-500' : 'border-red-400 focus:border-red-500 focus:ring-red-500'}`}
      />
      <p
        id={`${id}-help`}
        data-social-feedback={platform}
        className={`text-[11px] leading-relaxed break-words ${result.valid ? 'text-slate-500' : 'text-red-700'}`}
        role={!result.valid ? 'alert' : undefined}
      >
        {!result.valid ? t('brandStudio.socialInvalid') + ' ' : ''}
        {t(`brandStudio.socialHelp.${platform}`)}
      </p>
    </div>
  );
}
