import { createContext } from 'react';

export type Locale = 'en' | 'es';

export type Translations = {
  [key: string]: string | Translations;
};

export interface I18nContextType {
  locale: Locale;
  changeLocale: (locale: Locale) => void;
  t: (key: string, variables?: { [key: string]: string | number }) => string;
}

export const I18nContext = createContext<I18nContextType>({
  locale: 'es',
  changeLocale: () => {},
  t: (key: string) => key,
});