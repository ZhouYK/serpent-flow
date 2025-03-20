import {
  glue, GlueConflictPolicy, mergeCurToPre, runtimeVar, useDerivedState, useDerivedStateWithModel, useUpdateEffect,
} from 'femo';
import {
  useCallback, useContext, useEffect, useRef, useState,
} from 'react';

import { defaultState } from '../../config';
import {
  ErrorInfo, FieldProps, FieldState, FNode, FormState, NodeStateMap, NodeStatusEnum, NodeType, SearchAction, ValidateStatus,
} from '../../interface';
import NodeContext from '../../NodeProvider/NodeContext';
import instanceHelper from '../../utils/instanceHelper';
import nodeHelper from '../../utils/nodeHelper';
import hooksHelper from '../helper';

let nodeId = 0;

const useNode = <V>(
  initState: Partial<FieldState<V> | FormState<V>>,
  type: NodeType,
  onFieldChange?: FieldProps['onFieldChange'],
  field?: FNode<NodeStateMap<V>[typeof type]>,
): [NodeStateMap<V>[typeof type], FNode<NodeStateMap<V>[typeof type]>] => {
  const {
    label, value, visible, preserve, name, disabled, ...restInitState
  } = initState;
  const initStateRef = useRef(initState);
  initStateRef.current = initState;

  const controlledKeysRef = useRef<Set<string>>();
  controlledKeysRef.current = new Set(Object.keys(initState));

  const reducerRef = useRef(null);
  const nodeRef = useRef<FNode<FieldState<V>>>(null);

  const parentNodes = useContext(NodeContext);
  const [parentNode] = useDerivedState(() => {
    return parentNodes?.[0];
  }, [parentNodes]);

  // 第一个非匿名的父节点
  const [validParentNode] = useDerivedState(() => {
    const target = parentNodes.find((n) => {
      return !nodeHelper.isAnonymous(n.name);
    });
    return target || parentNodes[parentNodes.length - 1];
  }, [parentNodes]);

  const reducer = useCallback((s: typeof initState) => {
    // 如果节点是卸载状态，则不执行更新
    // 节点卸载时，可能是 visible false 引起的，此时节点上面的监听此时并没有卸载
    if (
      !s?.visible
      && nodeRef?.current?.status?.() === NodeStatusEnum.unmount
    ) {
      return nodeRef.current?.instance?.model();
    }
    return reducerRef.current(s);
  }, []);

  const [instance] = useState(() => {
    return instanceHelper.createInstance(
      { ...defaultState, ...initState },
      reducer,
    );
  });

  const insRef = useRef(instance);

  reducerRef.current = (st: typeof initState) => {
    const config = insRef.current?.model?.config();
    const curState = insRef.current?.model();
    // 如果 state 没有变化，则不合并
    // 如果来源于 useDerivedStateWithModel 更新（受控属性更新），则直接返回。
    // 因为这个就是最终的值
    if (Object.is(st, curState) || runtimeVar.runtimeFromDerived) {
      return st;
    }

    // 其他的更新
    const tmpSt = { ...st };
    const onFieldChangeState = config.updatePolicy === GlueConflictPolicy.merge
      ? mergeCurToPre([curState, st])
      : st;
    // 非受控属性更新
    // uncontrolledUpdate 为 true，不一定能确定非受控属性发生了变化，唯一能确定的是 model 的 state 发生了变化
    let uncontrolledUpdate = false;
    // 需要将受控属性的更新无效化
    // 无效化过后需要将这些受控属性的更新通知到外部，通过 onFieldChange，走外部的受控更新
    // controlledUpdate 为 true 可以明确有受控属性发生变化了
    let controlledUpdate = false;
    Object.keys(curState || {}).forEach((key) => {
      // 下一个 state 里面有 key
      const nextValue = st[key];
      if (key in st) {
        delete tmpSt[key];
        // key 是受控属性
        if (controlledKeysRef.current.has(key)) {
          const initValue = initStateRef.current[key];
          // 下一个 state 里面对应的值不相等
          if (!Object.is(initValue, nextValue)) {
            controlledUpdate = true;
          }
          // 受控属性不能改变
          st[key] = initValue;
        } else {
          // key 是非受控属性
          uncontrolledUpdate = true;
        }
        return;
      }
      // 下一个 state 里面没有 key
      // key 是受控属性，则需要补上
      if (controlledKeysRef.current.has(key)) {
        const initValue = initStateRef.current[key];
        if (!Object.is(initValue, nextValue)) {
          controlledUpdate = true;
        }
        st[key] = initValue;
      } else {
        // key 是非受控属性
        uncontrolledUpdate = true;
      }
    });

    // 与 curState 比较完过后，st 里面可能还有多余的属性
    Object.keys(tmpSt).forEach((key) => {
      // 多余的属性是受控的，则不改变
      if (controlledKeysRef.current.has(key)) {
        const initValue = initStateRef.current[key];
        const nextValue = st[key];
        if (!Object.is(initValue, nextValue)) {
          controlledUpdate = true;
        }
        st[key] = initValue;
      } else {
        // key 不是受控属性
        uncontrolledUpdate = true;
      }
    });

    // 状态的更新分两部分
    // 1. 受控部分更新走 onFieldChange
    // 2. 非受控部分更新正常走 return，状态数据里面已经将受控部分的变更纠正了，变化的只有非受控部分

    // 只要有变更，都触发 onFieldChange
    // 这部分先走异步，可能潜在会引起组件的渲染导致下面更新 model 过程阻塞
    if (controlledUpdate || uncontrolledUpdate) {
      Promise.resolve().then(() => {
        onFieldChange?.(onFieldChangeState, curState, insRef.current);
      });
    }

    // 情况 2
    // 非受控属性的更新，正常走
    // st 内部受控属性的变化此时已经被纠正
    if (uncontrolledUpdate) {
      return st;
    }
    return curState;
  };

  // 这里查找同层同名的节点，在加入匿名节点后可能会出现：同名节点不在同一个物理层。
  // 这个时候就可能出现查找的时候节点还没有挂载的情况，出现这种情况一定是：两个节点都在挂载中，挂载完成时间会有先后，那么肯定有一个节点挂载的时候，能找到另一个的。
  // 还需要注意，这里的 parentNode 应该向上寻找第一个非匿名节点或者全是匿名节点的情况下找最顶层节点。
  const findSameNameSiblingNode = (n: string) => nodeHelper.findFieldNodes(validParentNode, [n]);

  const [existNode] = useDerivedState(() => {
    const existNodes = findSameNameSiblingNode(name);
    // 同名的节点永远只有一个，直接返回
    return existNodes?.[0];
  }, [name]);

  const [node] = useState<FNode<NodeStateMap<V>[typeof type]>>(() => {
    nodeId += 1;
    // 节点查询
    insRef.current.query = (path, options) => {
      return hooksHelper.nodeQuery(node, path, options);
    };
    const tmpNode = {
      id: `node_${nodeId}`,
      type,
      name: initState.name,
      status: glue<NodeStatusEnum>(NodeStatusEnum.init),
      valueType: initState.valueType || nodeHelper.getDefaultValueType(type),
      instance: insRef.current,
      pushChild: (f: FNode) => {
        if (node.status() === NodeStatusEnum.mount) return;
        nodeHelper.chainChildNode(f, node);
      },
      detach: () => {
        nodeHelper.cutNode(node);
      },
      validateModel: glue(null),
      mountedBy: 0,
    };

    // 有存在的节点直接返回
    if (existNode) {
      return existNode;
    }

    if (field) {
      // field 的中的 status 要保留，因为涉及到查找时 context node 挂载/卸载的通知
      const { status, ...rest } = tmpNode;
      Object.assign(field, rest);
      return field;
    }

    return tmpNode;
  });

  // 保存 node 用来在 node.instance.model 和 node.status 的 reducer 中做 node 的状态判断：判断是否是 mount 状态
  nodeRef.current = node;

  // 在 instance 中保存 node 的引用
  insRef.current.node = node;

  // 通知使用该 node 的地方，更新其他地方获得的 node 的引用
  const noticeNodeConsumeSubscriber = (action: SearchAction) => {
    let index = 0;
    let parent = parentNodes[index];
    // 匿名节点不会有任何关系
    if (nodeHelper.isAnonymous(node.name)) {
      return;
    }
    const path = [node.name];
    while (parent) {
      // 非表单匿名字段需要跳过
      if (
        nodeHelper.isAnonymous(parent.name)
        && !nodeHelper.isForm(parent.type)
      ) {
        index += 1;
        parent = parentNodes[index];
        continue;
      }
      const tmpPath = JSON.stringify(path);
      // eslint-disable-next-line no-loop-func
      parent?.searchingPath?.forEach((value, key) => {
        if (value.has(tmpPath)) {
          key?.(node, tmpPath, action);
        }
      });
      path.unshift(parent.name);
      // form 节点处理完成后就不再追溯了
      if (nodeHelper.isForm(parent?.type)) {
        break;
      }
      index += 1;
      parent = parentNodes[index];
    }
  };

  // 一切 node 挂载的操作都在这里，包括通知和绑定监听
  const pushChild = (action: SearchAction) => {
    parentNode?.pushChild(node);
    node.status.race(NodeStatusEnum.mount);
    // 每次挂载 node 过后，都往上寻找需要该节点的 context node，并执行触发 rerender 的动作
    noticeNodeConsumeSubscriber(action);
  };

  const nodeDetach = () => {
    node.detach();
    // 先通知
    node.status.race(NodeStatusEnum.unmount);
  };

  // （visible 引起的） 或者 （组件本身卸载引起的） 节点卸载只能走这个方法
  const visibleOrUnmountNodeDetach = () => {
    const { preserve } = node?.instance?.state || {};
    if (!preserve) {
      nodeDetach();
      // 都不解绑，由消费方管理
      // unsubscribe([node.instance.model]);
      // unsubscribe([node.status]);
    }
  };

  // 这里 deps 变化会通知 model 的监听者
  // 挂载的时候并不会去执行 callback 更新 model，只有变化的时候才会做该动作
  // TODO 后续通知变更和不通知变更的外部传入属性，可以接受自定义
  const [state] = useDerivedStateWithModel(
    node.instance.model,
    (st) => {
      return {
        ...st,
        ...initState,
      };
    },
    [label, name, value, visible, preserve, disabled],
    false,
  );

  // 这里非关键属性更新，不做通知
  useEffect(() => {
    node.instance.model.silent((state) => {
      return {
        ...state,
        ...restInitState,
      };
    });
  }, [...Object.values(restInitState || {})]);

  hooksHelper.propCheck(state, type);

  useDerivedState(() => {
    hooksHelper.mergeStateToInstance(node, state);
    // 如果节点是表单 node
    if (nodeHelper.isForm(node.type)) {
      node.instance.validate = async () => {
        return new Promise((resolve, reject) => {
          node.validateModel
            .race(Promise.resolve(0))
            .then(() => {
              node.instance.model.race({
                validateStatus: ValidateStatus.validating,
              });
              const errors: Promise<ErrorInfo<V>>[] = [];
              nodeHelper.inspect(node.child, (n) => {
                // 和取值逻辑保持一致，遇到 form 节点不往下校验
                if (nodeHelper.isForm(n.type)) {
                  return [false, true];
                }
                // 是否跳过校验
                if (nodeHelper.skipValidate(node)) {
                  return [true, true];
                }
                const errorPromise = nodeHelper.execValidator(n, node);
                errors.push(errorPromise);
                return [true, true];
              });
              // 每一个 errorPromise 都会是 resolve 状态，因此不用处理 reject
              const errorsPromises = Promise.all(errors);
              node.validateModel
                .race(() => {
                  return errorsPromises.then((errs) => {
                    let result: FormState<V> = null;
                    if (errs.every((er) => !er)) {
                      result = {
                        errors: [],
                        validateStatus: ValidateStatus.success,
                      };
                      return result;
                    }
                    result = {
                      errors: errs,
                      validateStatus: ValidateStatus.error,
                    };
                    return result;
                  });
                })
                .then((data: FormState<V>) => {
                  if (data?.validateStatus === ValidateStatus.success) {
                    resolve(nodeHelper.getValues(node));
                  } else {
                    const errs = data?.errors?.filter((err) => err);
                    reject(errs);
                    node.scrollToField(errs?.[0]?.node?.id);
                  }
                  node.instance.model.race(data);
                })
                .catch(() => {
                  // 竞态的报错信息返回空
                  return undefined;
                });
            })
            .catch(() => {
              // 竞态的报错信息返回空
              return undefined;
            });
        });
      };
    } else {
      const formNode = nodeHelper.findNearlyParentFormNode(node);
      node.instance.validate = async () => {
        if (nodeHelper.skipValidate(node)) {
          return node.instance?.state?.value;
        }
        return new Promise((resolve, reject) => {
          nodeHelper.execValidator(node, formNode).then((data) => {
            if (data?.validateStatus === ValidateStatus.success) {
              resolve(node.instance?.state?.value);
            } else {
              reject(data);
              node.scrollToField(data?.node?.id);
            }
          });
        });
      };
    }
  }, [state]);

  // 针对 value 的变化单独做校验执行
  // 初始时不做校验，只在后续变化时再做
  // 注意📢：由 model 引起的 value 变化（react 刷新）会导致在这里同步的去校验，而校验里面又对 model 做了变更，这就形成了循环调用：自己变化引起自己变化，会被 glue 中的循环依赖检测强制中断
  // 所以需要对 validate 内的调用逻辑做异步处理
  useUpdateEffect(() => {
    node.instance?.validate?.();
  }, [state?.value]);

  useUpdateEffect(() => {
    if (node.status() === NodeStatusEnum.unmount) return;
    if (node.status() === NodeStatusEnum.mount) {
      nodeDetach();
    }
    pushChild(SearchAction.node_position_change);
  }, [parentNode]);

  useUpdateEffect(() => {
    // state 控制显示/隐藏
    if (!state?.visible) {
      visibleOrUnmountNodeDetach();
      return;
    }
    // 出现 unmount 节点只可能有两种可能：
    // 1. 组件节点卸载 2. visible 为 false
    // 情况 1，unmount 的节点不会在一个组件里面出现，因为组件已经卸载了，不存在执行环境了
    // 情况 2，unmount 的节点则可能出现在同一个组件中，当组件 visible 变为 true 时，则会重入节点。
    // 下面的情况属于 情况 2
    if (node.status() === NodeStatusEnum.unmount) {
      if (!node.instance.state.preserve) {
        // TODO 这里重置的状态可能需要调整
        node.instance.model((state) => ({
          ...state,
          value: undefined,
          errors: [],
          validateStatus: ValidateStatus.default,
        }));
      }
      pushChild(SearchAction.node_visible_change);
    }
  }, [state?.visible]);

  useUpdateEffect(() => {
    noticeNodeConsumeSubscriber(SearchAction.node_name_change);
  }, [state?.name]);

  useEffect(() => {
    node.mountedBy += 1;
    pushChild(SearchAction.node_change);
    return () => {
      node.mountedBy -= 1;
      visibleOrUnmountNodeDetach();
    };
  }, []);

  return [state, node];
};

export default useNode;
