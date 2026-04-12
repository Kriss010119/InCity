import { useState, useEffect, useRef, useCallback } from 'react';
import { MapPin, Loader } from 'lucide-react';
import { Portal } from '../../../../portal/Portal';
import styles from './DestinationInput.module.css';

type Suggestion = {
  display_name: string;
  lat: number;
  lon: number;
  place_id: string;
  type?: string;
  importance?: number;
};

type DestinationInputProps = {
  value: string;
  onChange: (value: string) => void;
  isLocked?: boolean;
  placeholder?: string;
  onMapSelect?: () => void;
  isSelectingOnMap?: boolean;
  onAddressSelect?: (lat: number, lng: number, address: string) => void;
};

const suggestionsCache = new Map<string, Suggestion[]>();
const CACHE_SIZE_LIMIT = 100;
const CACHE_TTL = 1000 * 60 * 60;
const cacheTimestamps = new Map<string, number>();

export const DestinationInput = ({
  value,
  onChange,
  isLocked = false,
  placeholder = "Введите конечную точку",
  onMapSelect,
  isSelectingOnMap = false,
  onAddressSelect
}: DestinationInputProps) => {
  const [query, setQuery] = useState(value);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [suggestionsPosition, setSuggestionsPosition] = useState<{ top: number; left: number } | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const cleanCache = useCallback(() => {
    const now = Date.now();
    for (const [key, timestamp] of cacheTimestamps.entries()) {
      if (now - timestamp > CACHE_TTL) {
        suggestionsCache.delete(key);
        cacheTimestamps.delete(key);
      }
    }
  }, []);

  const fetchSuggestions = useCallback(async (searchQuery: string): Promise<Suggestion[]> => {
    if (suggestionsCache.has(searchQuery)) return suggestionsCache.get(searchQuery) || [];
    if (abortControllerRef.current) abortControllerRef.current.abort();
    abortControllerRef.current = new AbortController();
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=7&countrycodes=ru&addressdetails=1&dedupe=1&extratags=1`,
        {
          signal: abortControllerRef.current.signal,
          headers: { 'User-Agent': 'InCityApp/1.0', 'Accept-Language': 'ru' }
        }
      );
      if (!response.ok) throw new Error('Network response was not ok');
      const data = await response.json();
      const processed = data.map((item: any) => ({
        display_name: item.display_name,
        lat: parseFloat(item.lat),
        lon: parseFloat(item.lon),
        place_id: item.place_id,
        type: item.type,
        importance: item.importance || 0
      })).sort((a: Suggestion, b: Suggestion) => (b.importance || 0) - (a.importance || 0));
      if (processed.length > 0) {
        if (suggestionsCache.size >= CACHE_SIZE_LIMIT) {
          const oldestKey = Array.from(cacheTimestamps.entries()).sort(([, a], [, b]) => a - b)[0]?.[0];
          if (oldestKey) {
            suggestionsCache.delete(oldestKey);
            cacheTimestamps.delete(oldestKey);
          }
        }
        suggestionsCache.set(searchQuery, processed);
        cacheTimestamps.set(searchQuery, Date.now());
      }
      return processed;
    } catch (error) {
      if (error instanceof Error && error.name !== 'AbortError') console.error('Error fetching suggestions:', error);
      return [];
    }
  }, []);

  const debouncedSearch = useCallback((searchQuery: string) => {
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    if (searchQuery.length < 3) {
      setSuggestions([]);
      return;
    }
    debounceTimerRef.current = setTimeout(async () => {
      setIsLoading(true);
      try {
        const results = await fetchSuggestions(searchQuery);
        setSuggestions(results);
      } catch (error) {
        console.error('Search error:', error);
      } finally {
        setIsLoading(false);
      }
    }, 400);
  }, [fetchSuggestions]);

  useEffect(() => {
    setQuery(value);
  }, [value]);

  useEffect(() => {
    if (!isLocked) {
      cleanCache();
      debouncedSearch(query);
    }
  }, [query, debouncedSearch, cleanCache, isLocked]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        suggestionsRef.current && !suggestionsRef.current.contains(e.target as Node) &&
        inputRef.current && !inputRef.current.contains(e.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };
    const handleResize = () => {
      if (showSuggestions && !isMobile) {
        const pos = calculatePosition();
        setSuggestionsPosition(pos);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('resize', handleResize);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('resize', handleResize);
    };
  }, [showSuggestions, isMobile]);

  useEffect(() => {
    return () => {
      if (abortControllerRef.current) abortControllerRef.current.abort();
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, []);

  const calculatePosition = () => {
    if (inputRef.current) {
      const rect = inputRef.current.getBoundingClientRect();
      const dropdownWidth = 400;
      let left = rect.right + 12;
      if (left + dropdownWidth > window.innerWidth) {
        left = rect.left - dropdownWidth - 12;
      }
      return {
        top: rect.top + rect.height / 2,
        left: left,
      };
    }
    return null;
  };

  const handleFocus = () => {
    if (!isLocked) {
      if (!isMobile) {
        const pos = calculatePosition();
        setSuggestionsPosition(pos);
      }
      setShowSuggestions(true);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isLocked) return;
    const newValue = e.target.value;
    setQuery(newValue);
    onChange(newValue);
    setShowSuggestions(true);
    setActiveIndex(-1);
  };

  const handleSuggestionClick = (suggestion: Suggestion) => {
    setQuery(suggestion.display_name);
    onChange(suggestion.display_name);
    if (onAddressSelect) onAddressSelect(suggestion.lat, suggestion.lon, suggestion.display_name);
    setShowSuggestions(false);
    setActiveIndex(-1);
  };

  const handleClear = () => {
    if (isLocked) return;
    setQuery('');
    onChange('');
    setShowSuggestions(false);
    setActiveIndex(-1);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (isLocked) return;
    if (!showSuggestions || suggestions.length === 0) {
      if (e.key === 'Escape' && query) handleClear();
      return;
    }
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setActiveIndex(prev => prev < suggestions.length - 1 ? prev + 1 : prev);
        break;
      case 'ArrowUp':
        e.preventDefault();
        setActiveIndex(prev => prev > 0 ? prev - 1 : -1);
        break;
      case 'Enter':
        e.preventDefault();
        if (activeIndex >= 0) handleSuggestionClick(suggestions[activeIndex]);
        else if (suggestions.length > 0) handleSuggestionClick(suggestions[0]);
        break;
      case 'Escape':
        setShowSuggestions(false);
        setActiveIndex(-1);
        break;
    }
  };

  const highlightMatch = (text: string, searchQuery: string) => {
    if (!searchQuery) return text;
    const escaped = searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(${escaped})`, 'gi');
    return text.split(regex).map((part, i) =>
      regex.test(part) ? <span key={i} className={styles.highlight}>{part}</span> : <span key={i}>{part}</span>
    );
  };

  const formatAddress = (displayName: string) => {
    const parts = displayName.split(', ');
    return parts.length > 3 ? `${parts[0]}, ${parts[1]}, ${parts[2]}...` : displayName;
  };

  const suggestionsContent = suggestions.length > 0 && (
    <div
      ref={suggestionsRef}
      className={styles.suggestionsDropdown}
    >
      {suggestions.map((suggestion, index) => (
        <div
          key={suggestion.place_id}
          className={`${styles.suggestion} ${index === activeIndex ? styles.active : ''}`}
          onClick={() => handleSuggestionClick(suggestion)}
          onMouseEnter={() => setActiveIndex(index)}
        >
          <MapPin size={14} className={styles.suggestionIcon} />
          <div className={styles.suggestionText}>
            {highlightMatch(formatAddress(suggestion.display_name), query)}
            {suggestion.type && (
              <span className={styles.suggestionType}>
                {suggestion.type === 'city' ? 'Город' :
                suggestion.type === 'town' ? 'Город' :
                suggestion.type === 'village' ? 'Деревня' :
                suggestion.type === 'street' ? 'Улица' :
                suggestion.type === 'building' ? 'Здание' :
                suggestion.type === 'amenity' ? 'Место' : ''}
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className={styles.inputGroup}>
      <label className={styles.label}>
        <MapPin size={16} />
        <span>КУДА</span>
      </label>
      <div className={styles.destinationContainer}>
        <div className={styles.autocompleteWrapper}>
          <div className={styles.inputContainer}>
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={handleInputChange}
              onFocus={handleFocus}
              onKeyDown={handleKeyDown}
              disabled={isLocked}
              placeholder={isLocked ? "Точка определена билетом" : placeholder}
              className={`${styles.input} ${isLocked ? styles.inputLocked : ''}`}
              autoComplete="off"
            />
            {!isLocked && (
              <div className={styles.inputIcons}>
                {isLoading && <Loader size={18} className={styles.spinner} />}
              </div>
            )}
          </div>
          
          {!isLocked && showSuggestions && suggestions.length > 0 && !isMobile && suggestionsPosition && (
            <Portal>
              <div className={styles.suggestionsOverlay} onClick={() => setShowSuggestions(false)} />
              <div
                className={styles.suggestionsDropdown}
                style={{
                  position: 'fixed',
                  top: suggestionsPosition.top,
                  left: suggestionsPosition.left,
                  width: '400px',
                  margin: 0,
                  zIndex: 10000
                }}
              >
                {suggestions.map((suggestion, index) => (
                  <div
                    key={suggestion.place_id}
                    className={`${styles.suggestion} ${index === activeIndex ? styles.active : ''}`}
                    onClick={() => handleSuggestionClick(suggestion)}
                    onMouseEnter={() => setActiveIndex(index)}
                  >
                    <MapPin size={14} className={styles.suggestionIcon} />
                    <div className={styles.suggestionText}>
                      {highlightMatch(formatAddress(suggestion.display_name), query)}
                      {suggestion.type && (
                        <span className={styles.suggestionType}>
                          {suggestion.type === 'city' ? 'Город' :
                          suggestion.type === 'town' ? 'Город' :
                          suggestion.type === 'village' ? 'Деревня' :
                          suggestion.type === 'street' ? 'Улица' :
                          suggestion.type === 'building' ? 'Здание' :
                          suggestion.type === 'amenity' ? 'Место' : ''}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </Portal>
          )}
          {!isLocked && showSuggestions && suggestions.length > 0 && isMobile && suggestionsContent}
        </div>
        
        {!isLocked && (
          <button
            type="button"
            onClick={onMapSelect}
            className={`${styles.mapSelectButton} ${isSelectingOnMap ? styles.active : ''}`}
            title="Выбрать на карте"
          >
            <MapPin size={18} />
            <span>{isSelectingOnMap ? 'Отмена' : 'Выбрать на карте'}</span>
          </button>
        )}
      </div>
      {isLocked && <div className={styles.inputHint}>Заблокировано по билету</div>}
    </div>
  );
};