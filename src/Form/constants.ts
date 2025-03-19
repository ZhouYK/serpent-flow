import type { FormState } from '../interface';

export const formStateKeysRecord: Record<keyof FormState, keyof FormState> = {
  errors: 'errors',
  validateStatus: 'validateStatus',
  className: 'className',
  value: 'value',
  valueType: 'valueType',
  name: 'name',
  visible: 'visible',
  preserve: 'preserve',
  disabled: 'disabled',
  extendProps: 'extendProps',
};

export const formStateKeys: (keyof FormState)[] = Object.values(formStateKeysRecord);
