/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useCallback } from 'react';
import ruLocale from '../locales/ru.json';

type LocaleStructure = {
  [key: string]: any;
}

type TranslationParams = {
  [key: string]: string | number;
}

export const useLocale = () => {
  const [locale] = useState<LocaleStructure>(ruLocale);
  
  const t = useCallback(<T = string>(key: string, params?: TranslationParams): T => {
    const keys = key.split('.');
    let result: any = locale;
    
    for (const k of keys) {
      if (result && typeof result === 'object' && k in result) {
        result = result[k];
      } else {
        console.warn(`Translation key "${key}" not found`);
        return key as T;
      }
    }
  
    if (params && typeof result === 'string') {
      return result.replace(/\{\{(\w+)\}\}/g, (_, param) => 
        params[param]?.toString() || `{{${param}}}`
      ) as T;
    }
    
    return result as T;
  }, [locale]);
  
  return {
    t,
    locale,
    language: 'ru'
  };
};