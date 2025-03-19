import type { FC } from 'react';
import React from 'react';

import type { FNode } from '../interface';
import NodeContext from './NodeContext';

interface Props {
  children: any;
  nodes: FNode[];
}

const NodeProvider: FC<Props> = (props) => {
  return (
    <NodeContext.Provider value={props.nodes}>
      {props.children}
    </NodeContext.Provider>
  );
};

export default NodeProvider;
