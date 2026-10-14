import React, { useState, useEffect, useRef } from 'react';
import { Search, ChevronDown, Check, X } from 'lucide-react';

interface SearchableLocationSelectProps {
  label: string;
  required?: boolean;
  value: string;
  onChange: (value: string) => void;
  options: string[];
  placeholder?: string;
  disabled?: boolean;
  disabledPlaceholder?: string;
  allowCustom?: boolean;
  helperText?: string;
}

export const SearchableLocationSelect: React.FC<SearchableLocationSelectProps> = ({
  label,
  required = false,
  value,
  onChange,
  options,
  placeholder = 'Select...',
  disabled = false,
  disabledPlaceholder = 'Select State first...',
  allowCustom = true,
  helperText,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState<number>(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, []);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen) {
      setSearchQuery('');
      setHighlightedIndex(-1);
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

  // Filter options based on search query
  const filteredOptions = options.filter((opt) =>
    opt.toLowerCase().includes(searchQuery.trim().toLowerCase())
  );

  const trimmedQuery = searchQuery.trim();
  const exactMatchExists = options.some(
    (opt) => opt.toLowerCase() === trimmedQuery.toLowerCase()
  );
  const showCustomOption =
    allowCustom && trimmedQuery.length > 1 && !exactMatchExists;

  const handleSelect = (val: string) => {
    onChange(val);
    setIsOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
    setSearchQuery('');
  };

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;

    if (!isOpen) {
      if (e.key === 'Enter' || e.key === 'ArrowDown' || e.key === ' ') {
        e.preventDefault();
        setIsOpen(true);
      }
      return;
    }

    const totalCount = filteredOptions.length + (showCustomOption ? 1 : 0);

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev + 1) % (totalCount || 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev - 1 + totalCount) % (totalCount || 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (highlightedIndex >= 0 && highlightedIndex < filteredOptions.length) {
        handleSelect(filteredOptions[highlightedIndex]);
      } else if (showCustomOption && highlightedIndex === filteredOptions.length) {
        handleSelect(trimmedQuery);
      } else if (filteredOptions.length > 0) {
        handleSelect(filteredOptions[0]);
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setIsOpen(false);
    }
  };

  return (
    <div className="relative" ref={containerRef} onKeyDown={handleKeyDown}>
      <label className="block text-xs font-semibold text-gray-700 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>

      {/* Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen((prev) => !prev)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        className={`w-full px-3 py-2 text-left rounded-lg text-xs font-medium border flex items-center justify-between transition ${
          disabled
            ? 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed'
            : isOpen
            ? 'border-emerald-600 ring-2 ring-emerald-500/20 bg-white text-gray-900 shadow-xs'
            : value
            ? 'border-gray-300 bg-white text-gray-900 hover:border-gray-400'
            : 'border-gray-300 bg-white text-gray-400 hover:border-gray-400'
        }`}
      >
        <span className="truncate">
          {disabled
            ? disabledPlaceholder
            : value
            ? value
            : placeholder}
        </span>

        <div className="flex items-center gap-1 shrink-0 ml-2">
          {!disabled && value && (
            <span
              onClick={handleClear}
              className="p-0.5 hover:bg-gray-200 rounded-full text-gray-400 hover:text-gray-600 cursor-pointer"
              title="Clear selection"
            >
              <X className="w-3 h-3" />
            </span>
          )}
          <ChevronDown
            className={`w-4 h-4 text-gray-400 transition-transform duration-150 ${
              isOpen ? 'rotate-180 text-emerald-600' : ''
            }`}
          />
        </div>
      </button>

      {helperText && !disabled && (
        <p className="text-[10px] text-gray-500 mt-1">{helperText}</p>
      )}

      {/* Popover Dropdown Menu */}
      {isOpen && !disabled && (
        <div className="absolute z-50 left-0 right-0 mt-1.5 bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-100 text-xs">
          {/* Real-time Search Filter Input */}
          <div className="p-2 border-b border-gray-100 bg-gray-50/70">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-2.5 pointer-events-none" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setHighlightedIndex(0);
                }}
                placeholder={`Search ${label.toLowerCase()}...`}
                className="w-full pl-8 pr-2.5 py-1.5 text-xs bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 text-gray-900 placeholder:text-gray-400"
              />
            </div>
          </div>

          {/* Options List */}
          <ul
            ref={listRef}
            role="listbox"
            className="max-h-56 overflow-y-auto divide-y divide-gray-50 py-1"
          >
            {filteredOptions.length > 0 ? (
              filteredOptions.map((opt, idx) => {
                const isSelected = value.toLowerCase() === opt.toLowerCase();
                const isHighlighted = highlightedIndex === idx;

                return (
                  <li
                    key={opt}
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => handleSelect(opt)}
                    onMouseEnter={() => setHighlightedIndex(idx)}
                    className={`px-3 py-2 flex items-center justify-between cursor-pointer transition ${
                      isSelected
                        ? 'bg-emerald-50 text-emerald-900 font-bold'
                        : isHighlighted
                        ? 'bg-gray-100 text-gray-900'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <span className="truncate">{opt}</span>
                    {isSelected && (
                      <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 ml-2" />
                    )}
                  </li>
                );
              })
            ) : !showCustomOption ? (
              <li className="px-3 py-4 text-center text-gray-400 text-xs">
                No matching locations found
              </li>
            ) : null}

            {/* Custom entry fallback option if town not in standard list */}
            {showCustomOption && (
              <li
                role="option"
                onClick={() => handleSelect(trimmedQuery)}
                onMouseEnter={() => setHighlightedIndex(filteredOptions.length)}
                className={`px-3 py-2 cursor-pointer border-t border-dashed border-gray-200 ${
                  highlightedIndex === filteredOptions.length
                    ? 'bg-emerald-50 text-emerald-900'
                    : 'bg-emerald-50/40 text-emerald-800 hover:bg-emerald-50'
                }`}
              >
                <span className="text-[11px] font-semibold flex items-center gap-1.5">
                  <span>+ Use &quot;{trimmedQuery}&quot;</span>
                  <span className="text-[10px] text-emerald-600 font-normal">
                    (Custom {label})
                  </span>
                </span>
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
};
