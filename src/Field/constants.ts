import type { FieldState } from '../interface';

export const fieldStateKeysRecord: Record<keyof FieldState, keyof FieldState> = {
  label: 'label',
  name: 'name',
  value: 'value',
  valueType: 'valueType',
  visible: 'visible',
  preserve: 'preserve',
  errors: 'errors',
  validateStatus: 'validateStatus',
  rules: 'rules',
  initialValue: 'initialValue',
  disabled: 'disabled',
  className: 'className',
  description: 'description',
  extendProps: 'extendProps',
};

export const fieldStateKeys: (keyof FieldState)[] = Object.values(fieldStateKeysRecord);
