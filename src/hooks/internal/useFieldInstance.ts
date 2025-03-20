import {
  useCallback, useContext, useEffect, useRef, useState,
} from 'react';

import type { FemoModel } from 'femo';
import { subscribe, useDerivedState } from 'femo';

import type {
  FieldInstance,
  FieldState,
  FNode,
  FPath,
  QueryFieldInstanceOptions,
} from '../../interface';
import { NodeStatusEnum, SearchAction } from '../../interface';
import NodeContext from '../../NodeProvider/NodeContext';
import nodeHelper from '../../utils/nodeHelper';
import parsePath from '../../utils/parsePath';
import hooksHelper from '../helper';

// 所有的搜索都必须在一个 context 下进行.
// 如果传了 context ，则以传入为准；
// 如果没传，统一规定在一个 formNode context 查询，不论所查的 field 还是 form
const useFieldInstance = <V = any>(
  fPath?: FPath,
  options?: QueryFieldInstanceOptions,
): FieldInstance<V> | null => {
  const { context, watch = true, watchedKeys } = options || {};
  const targetModelRef = useRef<FemoModel<FNode>>(null);

  const nodes = useContext(NodeContext);
  const [node] = useDerivedState(() => {
    return nodes?.[0];
  }, [nodes]);

  const [formNode] = useDerivedState(() => {
    return nodes.find((n) => {
      return n.type === 'form';
    });
  }, [nodes]);

  const [contextNodeOrigin] = useDerivedState(() => {
    if (context) {
      return context;
    }

    // 相对路径则以所在的 node 为 context
    if (parsePath.relativePath(fPath)) {
      return node;
    }
    // 绝对路径则以所在的 form node 为 context
    if (parsePath.absolutPath(fPath)) {
      return formNode;
    }
    return formNode;
  }, [context, formNode, fPath]);

  const [contextNodeStatus] = useDerivedState(() => {
    return contextNodeOrigin?.status?.();
  }, [contextNodeOrigin?.status]);

  const [{ pathArr: path, newContext: contextNode }] = useDerivedState(() => {
    if (contextNodeStatus !== NodeStatusEnum.mount) {
      return {
        pathArr: null,
        newContext: null,
      };
    }
    return parsePath.simplifyPath(fPath, contextNodeOrigin);
  }, [fPath, contextNodeOrigin, contextNodeStatus]);

  const [reFindNode, setReFindNode] = useState(null);
  const [, setState] = useState(null);

  const [pathString] = useDerivedState(() => {
    return JSON.stringify(path || '');
  }, [path]);

  const refresh = useCallback(
    (node: FNode, _str: string, action: SearchAction) => {
      switch (action) {
        case SearchAction.node_change:
          {
            targetModelRef.current(node);
          }
          break;
        case SearchAction.node_position_change:
        case SearchAction.node_name_change:
        case SearchAction.node_visible_change: {
          setReFindNode({});
        }
          break;
        default:
      }
    },
    [],
  );

  const [target, targetModel] = useDerivedState<FNode>(
    (preState) => {
      if (!contextNode) return null;
      let tmpTarget = preState;
      // 没有 path，则返回 null
      if (!path) {
        tmpTarget = null;
      } else {
        // 可能会有多个同名节点，取第一个
        // 效果会是一样的，因为同名节点会互相监听、互相同步状态
        [tmpTarget] = nodeHelper.findFieldNodes(contextNode, path);
      }
      // 不管有没有找到目标节点都会去记录
      if (!contextNode?.searchingPath) {
        contextNode.searchingPath = new Map();
      }
      let strSet = contextNode.searchingPath.get(refresh);
      if (!strSet) {
        strSet = new Set();
        contextNode.searchingPath.set(refresh, strSet);
      }
      strSet.add(pathString);
      return tmpTarget;
    },
    [contextNode, pathString, reFindNode],
  );
  targetModelRef.current = targetModel;

  // 清理，避免内存泄漏
  useEffect(() => {
    const curSet = contextNode?.searchingPath?.get(refresh);
    return () => {
      curSet?.delete(pathString);
    };
  }, [pathString]);

  // 清理，避免内存泄漏
  useEffect(() => {
    return () => {
      contextNode?.searchingPath?.delete(refresh);
    };
  }, [contextNode]);

  const [watchedKeysArr] = useDerivedState(() => {
    if (typeof watchedKeys === 'string') return watchedKeys ? [watchedKeys] : [];
    if (!(watchedKeys instanceof Array)) return [];
    return watchedKeys;
  }, [watchedKeys]);

  const prevTargetStateRef = useRef<FieldState<V>>();
  prevTargetStateRef.current = target?.instance?.model?.();

  const componentRefreshRef = useRef<(state: FieldState<V>) => void>();
  componentRefreshRef.current = (targetState?: FieldState<V>) => {
    if (
      watchedKeysArr?.length
      && watchedKeysArr?.every((k) => {
        return Object.is(prevTargetStateRef.current?.[k], targetState?.[k]);
      })
    ) {
      prevTargetStateRef.current = targetState;
      return;
    }
    prevTargetStateRef.current = targetState;
    setState({});
  };

  useEffect(() => {
    if (target && watch) {
      const sub_1 = subscribe(
        [target?.instance?.model],
        (targetState: FieldState<V>) => {
          componentRefreshRef.current(targetState);
        },
        false,
      );
      const sub_2 = subscribe(
        [target?.status],
        () => {
          setState({});
        },
        false,
      );
      return () => {
        sub_1();
        sub_2();
      };
    }
    return undefined;
  }, [target, watch]);

  hooksHelper.mergeStateToInstance(target, target?.instance?.model());
  return target?.instance;
};

export default useFieldInstance;
