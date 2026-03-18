import React, { createContext, useContext, useState } from 'react';
import { t as _t } from './translations/index';

const LangContext = createContext(null);

export function LangProvider({ children }) {
  const [lang, setLang] = useState(() => localStorage.getItem('kbtu_lang') || 'ru');

  const switchLang = (l) => {
    setLang(l);
    localStorage.setItem('kbtu_lang', l);
  };

  const t = (key, vars) => _t(key, lang, vars);

  return (
    <LangContext.Provider value={{ lang, switchLang, t }}>
      {children}
    </LangContext.Provider>
  );
}

export const useLang = () => useContext(LangContext);
