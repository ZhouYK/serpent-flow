import type { FC } from 'react';
import React from 'react';

import { useDerivedState } from 'femo';

import type { FNode, FormContextValue, FormState } from '../interface';
import FormContext from './FormContext';

interface Props {
  children: any;
  state: FormState;
  node: FNode<FormState>;
}

const SerpentFormItemProvider: FC<Props> = (props) => {
  const { state, node } = props;

  const [value] = useDerivedState<FormContextValue>(() => {
    return {
      state,
      node,
    };
  }, [state, node]);

  return (
    <FormContext.Provider value={value}>{props.children}</FormContext.Provider>
  );
};

export default SerpentFormItemProvider;
