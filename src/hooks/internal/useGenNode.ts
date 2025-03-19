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
      status: glue<NodeStatusEnum>((s) => {
        // 如果节点是卸载状态，则不执行更新
        // 节点卸载时，可能是 visible false 引起的，此时节点上面的监听此时并没有卸载
        if (
          !node?.instance?.state?.visible
          && node?.status?.() === NodeStatusEnum.unmount
        ) {
          return node?.status();
        }
        return s;
      }, NodeStatusEnum.init),
      valueType: nodeHelper.getDefaultValueType(type),
    };
  });
  return node;
};

export default useGenNode;
