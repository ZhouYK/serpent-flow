import { useState } from 'react';

import { glue } from 'femo';
import nodeHelper from '../../utils/nodeHelper';

import type { FNode, NodeStateMap, NodeType } from '../../interface';
import { NodeStatusEnum } from '../../interface';

const useGenNode = <V = any>(
  type: NodeType,
): FNode<NodeStateMap<V>[typeof type]> => {
  const [node] = useState<FNode<NodeStateMap<V>[typeof type]>>(() => {
    return {
      type,
      status: glue<NodeStatusEnum>(NodeStatusEnum.init),
      valueType: nodeHelper.getDefaultValueType(type),
    };
  });
  return node;
};

export default useGenNode;
