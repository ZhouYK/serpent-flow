import nodeHelper from '../utils/nodeHelper';
import parsePath from '../utils/parsePath';
import { NodeStatusEnum } from '../interface';
import type {
  FieldState,
  FNode,
  FormState,
  FPath,
  NodeType,
  QueryFieldInstanceOptions,
} from '../interface';

export class HooksHelper {
  mergeStateToInstance = <S>(
    node: FNode,
    state: FieldState<S> | FormState<S>,
  ) => {
    if (!node) return;
    // todo model.silent 更新的属性如果出现在 node 中，也需要同步
    node.name = state?.name;
    // 保持 instance 的引用不变很重要
    Object.assign(node.instance, {
      state,
    });
  };

  propCheck = <V>(
    state: Partial<FieldState<V> | FormState<V>>,
    type: NodeType,
  ) => {
    if (
      'name' in state
      && typeof state.name !== 'string'
      && typeof state.name !== 'undefined'
    ) {
      const strFn = (main: string) => `${main} name should be string`;
      let str = '';
      if (type === 'field') {
        str = strFn('Field');
      } else if (type === 'form') {
        str = strFn('Form');
      }
      throw new Error(str);
    }
  };

  // 节点的查询方法，是 useFieldInstance 的简化版本
  nodeQuery = (
    node: FNode,
    path: FPath,
    options?: Omit<QueryFieldInstanceOptions, 'watch'>,
  ) => {
    const { context } = options || {};

    let contextOrigin = node;
    if (context) {
      contextOrigin = context;
    }
    const contextNodeStatus = contextOrigin?.status?.();

    let pathArr: string[];
    let contextNode;
    if (contextNodeStatus !== NodeStatusEnum.mount) {
      pathArr = null;
      contextNode = null;
    } else {
      const parseResult = parsePath.simplifyPath(path, contextOrigin);
      pathArr = parseResult?.pathArr;
      contextNode = parseResult?.newContext;
    }

    let target: FNode;
    if (!contextNode) {
      target = null;
    } else if (!pathArr) {
      target = null;
    } else {
      [target] = nodeHelper.findFieldNodes(contextNode, pathArr);
    }
    // query 的就不去记录搜索的记录了，在 useFieldInstance 里面做了记录是为了自动刷新
    this.mergeStateToInstance(target, target?.instance?.model());

    return target?.instance;
  };
}

export default new HooksHelper();
