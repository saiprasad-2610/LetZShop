import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Search, Check } from 'lucide-react';

interface SearchableSelectProps {
  id?: string;
  label?: string;
  options: string[];
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  disabled?: boolean;
  required?: boolean;
  error?: string | null;
}

export function SearchableSelect({
  id,
  label,
  options,
  value,
  onChange,
  placeholder = 'Select...',
  searchPlaceholder = 'Search...',
  disabled = false,
  required = false,
  error,
}: SearchableSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearch('');
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus search input when opened
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  const filteredOptions = options.filter((opt) =>
    opt.toLowerCase().includes(search.toLowerCase().trim())
  );

  const handleSelect = (opt: string) => {
    onChange(opt);
    setIsOpen(false);
    setSearch('');
  };

  return (
    <div className="w-full relative" ref={containerRef}>
      {label && (
        <label htmlFor={id} className="block text-xs font-medium text-slate-300 mb-1.5">
          {label} {required && <span className="text-rose-400">*</span>}
        </label>
      )}

      {/* Main trigger button */}
      <button
        id={id}
        type="button"
        disabled={disabled}
        onClick={() => {
          if (!disabled) setIsOpen(!isOpen);
        }}
        className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm transition-all text-left bg-slate-900 border ${
          disabled
            ? 'opacity-40 cursor-not-allowed border-slate-800 text-slate-500'
            : error
            ? 'border-rose-500 text-white focus:ring-2 focus:ring-rose-500/30'
            : isOpen
            ? 'border-blue-500 ring-2 ring-blue-500/30 text-white'
            : 'border-slate-700 text-white hover:border-slate-600'
        }`}
      >
        <span className={value ? 'text-white font-medium' : 'text-slate-500'}>
          {value || placeholder}
        </span>
        <ChevronDown
          className={`w-4 h-4 text-slate-400 transition-transform shrink-0 ml-2 ${
            isOpen ? 'rotate-180 text-blue-400' : ''
          }`}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && !disabled && (
        <div className="absolute z-50 mt-1.5 w-full rounded-xl bg-slate-900 border border-slate-700 shadow-2xl overflow-hidden py-1">
          {/* Search box inside dropdown */}
          <div className="p-2 border-b border-slate-800">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                ref={searchInputRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={searchPlaceholder}
                className="w-full pl-8 pr-3 py-1.5 bg-slate-950 border border-slate-700 rounded-md text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Options list */}
          <div className="max-h-56 overflow-y-auto py-1">
            {filteredOptions.length === 0 ? (
              <div className="px-3 py-2 text-xs text-slate-500 text-center">No results found</div>
            ) : (
              filteredOptions.map((opt) => {
                const isSelected = opt === value;
                return (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => handleSelect(opt)}
                    className={`w-full flex items-center justify-between px-3.5 py-2 text-xs text-left transition-colors ${
                      isSelected
                        ? 'bg-blue-600/20 text-blue-300 font-semibold'
                        : 'text-slate-200 hover:bg-slate-800'
                    }`}
                  >
                    <span>{opt}</span>
                    {isSelected && <Check className="w-3.5 h-3.5 text-blue-400 shrink-0 ml-2" />}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}

      {error && <p className="mt-1 text-xs text-rose-400 font-medium">{error}</p>}
    </div>
  );
}
