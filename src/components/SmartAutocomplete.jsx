/**
 * SmartAutocomplete — Reusable autocomplete with:
 * - 300ms debounce
 * - Minimum 2 chars
 * - Keyboard navigation (↑↓ + Enter)
 * - Highlight matching substring
 * - Provider badge
 * - Error state
 */
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Search, Loader2, AlertCircle, ChevronDown } from 'lucide-react';

const SmartAutocomplete = ({
  placeholder = 'Search...',
  fetchSuggestions,       // async (query) => [{ id, label, sublabel, code }]
  onSelect,               // (item) => void
  value = '',
  onChange,                // (text) => void
  icon: Icon = Search,
  accentColor = 'indigo',
  providerBadge = null,   // e.g. 'Kiwi' or 'Amadeus'
  className = '',
}) => {
  const [query, setQuery] = useState(value);
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [selected, setSelected] = useState(false);
  const inputRef = useRef(null);
  const listRef = useRef(null);
  const debounceRef = useRef(null);

  // Sync external value
  useEffect(() => {
    if (value !== query && !selected) setQuery(value);
  }, [value]);

  // Debounced fetch
  useEffect(() => {
    if (selected) return;
    if (query.length < 2) {
      setSuggestions([]);
      setOpen(false);
      return;
    }
    setLoading(true);
    setError(null);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      try {
        const results = await fetchSuggestions(query);
        setSuggestions(results || []);
        setOpen((results || []).length > 0);
        setActiveIndex(-1);
      } catch {
        setError('Unable to fetch suggestions');
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => clearTimeout(debounceRef.current);
  }, [query, fetchSuggestions, selected]);

  const handleSelect = useCallback((item) => {
    setQuery(item.label || item.name);
    setSelected(true);
    setOpen(false);
    setSuggestions([]);
    setActiveIndex(-1);
    onSelect?.(item);
    onChange?.(item.label || item.name);
  }, [onSelect, onChange]);

  const handleInputChange = (e) => {
    const val = e.target.value;
    setQuery(val);
    setSelected(false);
    onChange?.(val);
  };

  const handleKeyDown = (e) => {
    if (!open || suggestions.length === 0) return;
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setActiveIndex((prev) => Math.min(prev + 1, suggestions.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setActiveIndex((prev) => Math.max(prev - 1, 0));
        break;
      case 'Enter':
        e.preventDefault();
        if (activeIndex >= 0 && activeIndex < suggestions.length) {
          handleSelect(suggestions[activeIndex]);
        }
        break;
      case 'Escape':
        setOpen(false);
        setActiveIndex(-1);
        break;
    }
  };

  // Scroll active item into view
  useEffect(() => {
    if (activeIndex >= 0 && listRef.current) {
      const el = listRef.current.children[activeIndex];
      el?.scrollIntoView({ block: 'nearest' });
    }
  }, [activeIndex]);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (inputRef.current && !inputRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Highlight matching text
  const highlight = (text, q) => {
    if (!q || q.length < 2) return text;
    const idx = text.toLowerCase().indexOf(q.toLowerCase());
    if (idx === -1) return text;
    return (
      <>
        {text.slice(0, idx)}
        <span className="font-bold text-gray-900 bg-yellow-100 rounded px-0.5">{text.slice(idx, idx + q.length)}</span>
        {text.slice(idx + q.length)}
      </>
    );
  };

  const accentStyles = {
    indigo: { border: 'focus:border-indigo-400', ring: 'focus:ring-indigo-100', bg: 'bg-indigo-50', text: 'text-indigo-600' },
    sky: { border: 'focus:border-sky-400', ring: 'focus:ring-sky-100', bg: 'bg-sky-50', text: 'text-sky-600' },
    violet: { border: 'focus:border-violet-400', ring: 'focus:ring-violet-100', bg: 'bg-violet-50', text: 'text-violet-600' },
  };
  const accent = accentStyles[accentColor] || accentStyles.indigo;

  return (
    <div ref={inputRef} className={`relative ${className}`}>
      <div className="relative">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
          {loading ? (
            <Loader2 size={15} className="text-gray-400 animate-spin" />
          ) : (
            <Icon size={15} className="text-gray-400" />
          )}
        </div>
        <input
          type="text"
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => suggestions.length > 0 && setOpen(true)}
          placeholder={placeholder}
          className={`w-full bg-gray-50 border border-gray-200 rounded-xl pl-9 pr-4 py-3 text-sm outline-none transition-all ${accent.border} ${accent.ring} focus:ring-2`}
          autoComplete="off"
        />
        {providerBadge && (
          <span className={`absolute right-3 top-1/2 -translate-y-1/2 text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${accent.bg} ${accent.text}`}>
            {providerBadge}
          </span>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="absolute z-30 top-full mt-1 w-full bg-red-50 border border-red-200 rounded-xl px-4 py-2.5 flex items-center gap-2 shadow-lg">
          <AlertCircle size={14} className="text-red-500" />
          <span className="text-xs text-red-600 font-medium">{error}</span>
        </div>
      )}

      {/* Dropdown */}
      {open && suggestions.length > 0 && (
        <div
          ref={listRef}
          className="absolute z-30 top-full mt-1.5 w-full bg-white border border-gray-200 rounded-xl shadow-xl max-h-56 overflow-auto"
          style={{ animation: 'slideDown 0.15s ease-out' }}
        >
          {suggestions.map((item, i) => (
            <button
              key={item.id || i}
              onClick={() => handleSelect(item)}
              className={`w-full text-left px-4 py-2.5 text-sm transition-colors flex items-center gap-3
                ${i === activeIndex ? `${accent.bg} ${accent.text}` : 'hover:bg-gray-50 text-gray-700'}
                ${i === 0 ? 'rounded-t-xl' : ''} ${i === suggestions.length - 1 ? 'rounded-b-xl' : ''}`}
            >
              <div className="flex-1 min-w-0">
                <div className="font-medium truncate">
                  {highlight(item.label || item.name || '', query)}
                </div>
                {item.sublabel && (
                  <div className="text-[11px] text-gray-400 truncate">{item.sublabel}</div>
                )}
              </div>
              {item.code && (
                <span className="flex-shrink-0 text-[10px] font-bold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-md">
                  {item.code}
                </span>
              )}
            </button>
          ))}
        </div>
      )}

      <style>{`
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-4px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default SmartAutocomplete;
