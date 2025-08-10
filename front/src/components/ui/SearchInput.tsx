import React, { useState, useEffect, useCallback } from 'react';
import { Search, X } from 'lucide-react';

interface SearchInputProps {
  placeholder?: string;
  onSearch: (query: string) => void;
  className?: string;
  debounceMs?: number;
  showClearButton?: boolean;
  disabled?: boolean;
}

export const SearchInput: React.FC<SearchInputProps> = ({
  placeholder = "Rechercher...",
  onSearch,
  className = "",
  debounceMs = 300,
  showClearButton = true,
  disabled = false
}) => {
  const [query, setQuery] = useState("");

  // Debounced search function
  const debouncedSearch = useCallback(
    debounce((searchQuery: string) => {
      onSearch(searchQuery);
    }, debounceMs),
    [onSearch, debounceMs]
  );

  useEffect(() => {
    debouncedSearch(query);
  }, [query, debouncedSearch]);

  const handleClear = () => {
    setQuery("");
  };

  return (
    <div className={`search-container ${className}`}>
      <Search className="search-icon" />
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={placeholder}
        className={`input search-input ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        disabled={disabled}
      />
      {showClearButton && query && !disabled && (
        <button
          onClick={handleClear}
          className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 hover:bg-canvas-subtle rounded-md transition-colors"
          type="button"
        >
          <X className="w-4 h-4 text-fg-muted" />
        </button>
      )}
    </div>
  );
};

// Debounce utility function
function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

export default SearchInput;
