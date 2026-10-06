import React, { useState, useEffect } from 'react';
import { isValidIndianMobile, toLocalDigits } from '@simply/validation';

export { toLocalDigits };

interface IndianPhoneInputProps {
  value: string;
  onChange: (canonical: string, raw10: string, isValid: boolean) => void;
  label?: string;
  disabled?: boolean;
  autoFocus?: boolean;
  id?: string;
  placeholder?: string;
  className?: string;
  required?: boolean;
  onBlur?: () => void;
  showError?: boolean;
}

export function IndianPhoneInput({
  value,
  onChange,
  label,
  disabled = false,
  autoFocus = false,
  id,
  placeholder = '98765 43210',
  className = '',
  required = false,
  onBlur,
  showError = true,
}: IndianPhoneInputProps) {
  // Always maintain DISPLAY VALUE only in the local editable input state
  const [displayValue, setDisplayValue] = useState<string>(() => toLocalDigits(value));
  const [touched, setTouched] = useState<boolean>(false);

  // Synchronize incoming value, ensuring it is normalized to display digits only
  useEffect(() => {
    const normalized = toLocalDigits(value);
    if (normalized !== displayValue) {
      setDisplayValue(normalized);
    }
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const localDigits = toLocalDigits(e.target.value);
    setDisplayValue(localDigits);

    const canonical = localDigits.length > 0 ? `+91${localDigits}` : '';
    const valid = isValidIndianMobile(localDigits);
    onChange(canonical, localDigits, valid);
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedText = e.clipboardData.getData('text');
    const localDigits = toLocalDigits(pastedText);
    setDisplayValue(localDigits);

    const canonical = localDigits.length > 0 ? `+91${localDigits}` : '';
    const valid = isValidIndianMobile(localDigits);
    onChange(canonical, localDigits, valid);
  };

  const handleBlur = () => {
    setTouched(true);
    if (onBlur) onBlur();
  };

  const isInvalid = touched && displayValue.length > 0 && !isValidIndianMobile(displayValue);
  const isRequiredMissing = touched && required && displayValue.length === 0;

  return (
    <div className={`w-full ${className}`}>
      {label && (
        <label htmlFor={id} className="block text-xs font-medium text-slate-300 mb-1.5">
          {label}
        </label>
      )}
      <div
        className={`flex items-center rounded-lg bg-slate-950 border transition-colors ${
          isInvalid || isRequiredMissing
            ? 'border-rose-500/80 focus-within:ring-2 focus-within:ring-rose-500/30'
            : 'border-slate-700 focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent'
        }`}
      >
        <div className="flex items-center pl-3.5 pr-2.5 text-slate-400 font-semibold text-sm select-none border-r border-slate-800 shrink-0">
          <span>+91</span>
          <span className="mx-2 text-slate-600 font-light">|</span>
        </div>
        <input
          id={id}
          type="tel"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={10}
          disabled={disabled}
          autoFocus={autoFocus}
          required={required}
          value={displayValue}
          onChange={handleChange}
          onPaste={handlePaste}
          onBlur={handleBlur}
          placeholder={placeholder}
          className="block w-full px-3 py-2.5 bg-transparent text-sm text-white placeholder-slate-500 focus:outline-none tracking-wider font-mono font-medium disabled:opacity-50"
        />
      </div>
      {showError && isInvalid && (
        <p className="mt-1 text-xs text-rose-400 font-medium">Enter a valid 10-digit mobile number.</p>
      )}
      {showError && isRequiredMissing && (
        <p className="mt-1 text-xs text-rose-400 font-medium">Mobile number is required.</p>
      )}
    </div>
  );
}
