import React from 'react';

import type { FormContextValue } from '../interface';

const FormContext = React.createContext<FormContextValue>(null);

export default FormContext;
