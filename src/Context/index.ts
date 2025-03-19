import { createContext, useContext } from 'react';

import defaultValue from './defaultValue';

export const SerpentContext = createContext(defaultValue);

export const useSerpentContext = () => {
  return useContext(SerpentContext);
};
