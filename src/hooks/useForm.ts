import { Context, useContext } from 'react';

import FormContext from '../FormProvider/FormContext';
import { FormContextValue, FormInstance } from '../interface';
import type { FNode, FormState } from '../interface';

const useForm = <V = any, S extends FormState<V> = FormState<V>>(): [FormInstance<V, S> | null, FNode<S> | null] => {
  const formContext = useContext<FormContextValue<V, S>>(FormContext as unknown as Context<FormContextValue<V, S>>);

  return [formContext?.node?.instance, formContext?.node];
};

export default useForm;
