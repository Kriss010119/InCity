import { useState, useEffect, useRef, useCallback } from 'react';
import { MapPin, Loader, X } from 'lucide-react';
import styles from '../InputPanel.module.css';
import type { AddressAutocompleteProps, SelectedLocation, Suggestion } from '../../../../types';

const CACHE_SIZE_LIMIT = 100;
const CACHE_TTL = 1000 * 60 * 60;
const CHACHE_TIMESTAMPS = new Map<string, number>();
const SUGGESTIONS_CHACHE = new Map<string, Suggestion[]>();

export const AddressAutocomplete = ({ 
  value, 
  onChange, 
  onSelect,
  isLocked = false,
  placeholder = "Введите адрес или точку"
}: AddressAutocompleteProps) => {
  const [query, setQuery] = useState(value);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [, setLastSelected] = useState<SelectedLocation | null>(null);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const cleanCache = useCallback(() => {
    const now = Date.now();
    for (const [key, timestamp] of CHACHE_TIMESTAMPS.entries()) {
      if (now - timestamp > CACHE_TTL) {
        SUGGESTIONS_CHACHE.delete(key);
        CHACHE_TIMESTAMPS.delete(key);
      }
    }
  }, []);

  const parseAddressDetails = (suggestion: Suggestion): SelectedLocation['details'] => {
    const address = suggestion.address || {};
    const city = address.city || address.town || address.village;
    let houseNumber = address.house_number;
    if (!houseNumber && suggestion.display_name) {
      const houseMatch = suggestion.display_name.match(/,?\s*(\d+[A-Za-z]?)(?:\s|,|$)/);
      if (houseMatch) {
        houseNumber = houseMatch[1];
      }
    }

    return {
      city: city,
      street: address.street || address.town || address.village || '',
      house: houseNumber,
      postcode: address.postcode,
      country: address.country
    };
  };

  const fetchSuggestions = useCallback(async (searchQuery: string): Promise<Suggestion[]> => {
    if (SUGGESTIONS_CHACHE.has(searchQuery)) {
      return SUGGESTIONS_CHACHE.get(searchQuery) || [];
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?` +
        `format=json&q=${encodeURIComponent(searchQuery)}&` +
        `limit=7&countrycodes=ru&addressdetails=1&` +
        `extratags=1&namedetails=1&` +
        `accept-language=ru`,
        {
          signal: abortControllerRef.current.signal,
          headers: {
            'User-Agent': 'InCityApp/1.0',
            'Accept-Language': 'ru'
          }
        }
      );
      
      if (!response.ok) {
        throw new Error(`Network response was not ok: ${response.status}`);
      }
      
      const data = await response.json();
      
      const processed = data
        .map((item: any) => ({
          display_name: item.display_name,
          lat: parseFloat(item.lat),
          lon: parseFloat(item.lon),
          place_id: item.place_id,
          type: item.type,
          importance: item.importance || 0,
          address: item.address
        }))
        .sort((a: Suggestion, b: Suggestion) => 
          (b.importance || 0) - (a.importance || 0)
        );

      if (processed.length > 0) {
        if (SUGGESTIONS_CHACHE.size >= CACHE_SIZE_LIMIT) {
          const oldestKey = Array.from(CHACHE_TIMESTAMPS.entries())
            .sort(([, a], [, b]) => a - b)[0]?.[0];
          if (oldestKey) {
            SUGGESTIONS_CHACHE.delete(oldestKey);
            CHACHE_TIMESTAMPS.delete(oldestKey);
          }
        }
        
        SUGGESTIONS_CHACHE.set(searchQuery, processed);
        CHACHE_TIMESTAMPS.set(searchQuery, Date.now());
      }
      
      return processed;
    } catch (error) {
      if (error instanceof Error && error.name !== 'AbortError') {
        console.error('Error fetching suggestions:', error);
      }
      return [];
    }
  }, []);

  const debouncedSearch = useCallback((searchQuery: string) => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    if (searchQuery.length < 3) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    debounceTimerRef.current = setTimeout(async () => {
      setIsLoading(true);
      try {
        const results = await fetchSuggestions(searchQuery);
        setSuggestions(results);
        setShowSuggestions(results.length > 0);
      } catch (error) {
        console.error('Search error:', error);
        setSuggestions([]);
      } finally {
        setIsLoading(false);
      }
    }, 500);
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
        suggestionsRef.current && 
        !suggestionsRef.current.contains(e.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(e.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isLocked) return;
    
    const newValue = e.target.value;
    setQuery(newValue);
    onChange(newValue);
    setShowSuggestions(true);
    setActiveIndex(-1);
  };

  const handleSuggestionClick = (suggestion: Suggestion) => {
    const details = parseAddressDetails(suggestion);
    const selectedLocation: SelectedLocation = {
      lat: suggestion.lat,
      lng: suggestion.lon,
      address: suggestion.display_name,
      placeId: suggestion.place_id,
      details
    };

    setQuery(suggestion.display_name);
    onChange(suggestion.display_name);
    onSelect(selectedLocation);
    setShowSuggestions(false);
    setActiveIndex(-1);
    setLastSelected(selectedLocation);
    
    console.log('Selected location for backend:', {
      coordinates: { lat: suggestion.lat, lng: suggestion.lon },
      placeId: suggestion.place_id,
      details
    });
  };

  const handleClear = () => {
    if (isLocked) return;
    
    setQuery('');
    onChange('');
    setShowSuggestions(false);
    setActiveIndex(-1);
    setLastSelected(null);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (isLocked) return;
    
    if (!showSuggestions || suggestions.length === 0) {
      if (e.key === 'Escape' && query) {
        handleClear();
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setActiveIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
        if (suggestionsRef.current) {
          const activeElement = suggestionsRef.current.children[activeIndex + 1] as HTMLElement;
          activeElement?.scrollIntoView({ block: 'nearest' });
        }
        break;
      case 'ArrowUp':
        e.preventDefault();
        setActiveIndex(prev => prev > 0 ? prev - 1 : -1);
        if (suggestionsRef.current && activeIndex > 0) {
          const activeElement = suggestionsRef.current.children[activeIndex - 1] as HTMLElement;
          activeElement?.scrollIntoView({ block: 'nearest' });
        }
        break;
      case 'Enter':
        e.preventDefault();
        if (activeIndex >= 0 && suggestions[activeIndex]) {
          handleSuggestionClick(suggestions[activeIndex]);
        } else if (suggestions.length > 0) {
          handleSuggestionClick(suggestions[0]);
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        setActiveIndex(-1);
        break;
    }
  };

  return (
    <div className={styles.autocompleteWrapper}>
      <div className={styles.inputContainer}>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleInputChange}
          onFocus={() => !isLocked && query.length >= 3 && setShowSuggestions(true)}
          onKeyDown={handleKeyDown}
          placeholder={isLocked ? "Точка определена билетом" : placeholder}
          disabled={isLocked}
          className={`${styles.input} ${isLocked ? styles.inputLocked : ''}`}
          autoComplete="off"
          aria-label="Поиск адреса"
          aria-expanded={showSuggestions}
          aria-autocomplete="list"
        />
        
        <div className={styles.inputIcons}>
          {isLoading && <Loader size={18} className={styles.spinner} />}
          {!isLoading && query && !isLocked && (
            <button 
              type="button"
              onClick={handleClear}
              className={styles.clearButton}
              title="Очистить"
              aria-label="Очистить"
            >
              <X size={16} />
            </button>
          )}
          <MapPin size={18} className={styles.inputIcon} />
        </div>
      </div>

      {!isLocked && showSuggestions && suggestions.length > 0 && (
        <div 
          ref={suggestionsRef} 
          className={styles.suggestions}
          role="listbox"
          aria-label="Предложения адресов"
        >
          {suggestions.map((suggestion, index) => (
            <div
              key={suggestion.place_id}
              className={`${styles.suggestion} ${index === activeIndex ? styles.active : ''}`}
              onClick={() => handleSuggestionClick(suggestion)}
              onMouseEnter={() => setActiveIndex(index)}
              role="option"
              aria-selected={index === activeIndex}
            >
            </div>
          ))}
        </div>
      )}
    </div>
  );
};