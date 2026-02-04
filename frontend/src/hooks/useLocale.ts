/* eslint-disable @typescript-eslint/no-explicit-any */

import { useState } from 'react';

type LocaleStructure = {
  [key: string]: any;
}

import ruLocale from '../locales/ru.json';

export const useLocale = () => {
  const [locale] = useState<LocaleStructure>(ruLocale);
  
  const t = (key: string): any => {
    const keys = key.split('.');
    let result: any = locale;
    
    for (const k of keys) {
      if (result && typeof result === 'object' && k in result) {
        result = result[k];
      } else {
        console.warn(`Translation key "${key}" not found`);
        return key;
      }
    }
    
    return result;
  };
  
  return {
    t,
    locale,
    language: 'ru'
  };
};