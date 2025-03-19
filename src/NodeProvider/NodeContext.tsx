import React from 'react';

import type { FNode } from '../interface';

const NodeContext = React.createContext<FNode[]>([]);

export default NodeContext;
