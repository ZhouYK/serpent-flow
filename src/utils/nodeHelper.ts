import type {
  ErrorInfo,
  FieldInstance,
  FieldState,
  FNode,
  FormInstance,
  FormState,
  NodeType,
  SerpentRule,
} from '../interface';
import { NodeValueType, ValidateStatus } from '../interface';

class NodeHelper {
  regex = {
    number: /^[0-9]+$/,
    empty: /^.+$/,
  };

  getType = <A>(arg: A) => Object.prototype.toString.call(arg);

  isPlainObject = (target: unknown): target is Record<string, any> => this.getType(target) === '[object Object]';

  isArray = (target: unknown): target is any[] => this.getType(target) === '[object Array]';

  isEmpty = (value: any) => {
    return value === '' || value === undefined || value === null;
  };

  arrayNode = (target: FNode<FieldState | FormState>) => {
    return target?.valueType === NodeValueType.array;
  };

  objectNode = (target: FNode<FieldState | FormState>) => {
    return target?.valueType === NodeValueType.object;
  };

  isVoidNode = (target: FNode<FieldState | FormState>) => {
    return target?.valueType === NodeValueType.void;
  };

  isAnonymous = (n: any) => {
    if (Object.is(n, null) || Object.is(n, undefined) || Object.is(n, NaN)) {
      return true;
    }
    return !this.regex.empty.test(n);
  };

  isNumber = (n: string) => {
    return this.regex.number.test(`${n}`);
  };

  isForm = (type: NodeType) => {
    return type === 'form';
  };

  isField = (type: NodeType) => {
    return type === 'field';
  };

  // 链接节点
  chainChildNode = (inputNode: FNode, parentNode: FNode) => {
    // 如果传入的 inputNode 已存在于链表中，则不操作
    if (inputNode.parent || inputNode.sibling) {
      console.warn(
        `节点: ${inputNode.name} 已存在，请检查表单的 name 是否重复!`,
      );
      return;
    }
    if (!parentNode.child) {
      parentNode.child = inputNode;
      inputNode.parent = parentNode;
      return;
    }
    let curNode = parentNode.child;
    // todo 每次都从头找最后一个，可能会性能问题，可以优化
    // todo 这里会成环吗？
    while (curNode) {
      if (!curNode.sibling) {
        curNode.sibling = inputNode;
        inputNode.parent = parentNode;
        return;
      }
      curNode = curNode.sibling;
    }
  };

  // 删除节点
  // 只有在节点树中的节点，才谈得上删除
  // 有个问题：节点删除了过后，其他地方通过 useField 获取到节点，并做了监听的，如何处理？
  // 23-06-28: 节点删除过后，如果节点可能再次被链接进入链表，则不解绑监听；如果不可能再次被链接，则解绑监听
  cutNode = (inputNode: FNode) => {
    // 如果 inputNode 没有父节点，就不存在兄弟节点
    // 只处理 child 指针
    if (!inputNode.parent) {
      inputNode.child = null;
      return;
    }
    // 如果 inputNode 是第一个孩子
    if (inputNode === inputNode.parent.child) {
      inputNode.parent.child = inputNode.sibling;
      inputNode.parent = null;
      inputNode.child = null;
      inputNode.sibling = null;
      return;
    }
    // 如果 inputNode 不是第一个孩子
    let cur = inputNode.parent.child;
    while (cur) {
      if (cur.sibling === inputNode) {
        cur.sibling = inputNode.sibling;
        inputNode.parent = null;
        inputNode.sibling = null;
        inputNode.child = null;
        return;
      }
      cur = cur.sibling;
    }
  };

  getFirstChildNotAnonymousToDown = (n: FNode): FNode | null => {
    if (!n) return n;
    if (!this.isAnonymous(n.name)) return n;
    return this.getFirstChildNotAnonymousToDown(n.child);
  };

  getFirstChildNotAnonymousToUp = (n: FNode): FNode | null => {
    if (!n) return n;
    if (!this.isAnonymous(n.name)) return n;
    return this.getFirstChildNotAnonymousToUp(n.parent);
  };

  traverseAnonymousNode = (
    node: FNode,
    callback: (n: FNode) => boolean,
  ): boolean => {
    if (!node) return false;
    if (this.isAnonymous(node.name)) {
      return this.traverseAnonymousNode(node.child, callback);
    }
    if (callback(node)) return true;
    return this.traverseAnonymousNode(node.sibling, callback);
  };

  // 根据路径和起始节点（查找时不包含该节点）查找节点
  // 不查找 form 节点及其后代
  // form 节点作为一个封闭的区块存在（可以把 form 想象成一个进程），就像一个封闭的表单字段运行的上下文。
  // 所以在按路径查找或者取值时，都不能跨表单。
  // form 节点可以匿名，但是匿名节点的特性判断优先级小于 form 节点的特性
  findFieldNodes = (node: FNode, path: string[]): FNode[] => {
    const result: FNode[] = [];
    if (!path || !node) return result;
    const tmpPath = path;
    const { length } = path;
    const cur = node.child;

    const traverse = (node: FNode, depth: number) => {
      if (!node || depth >= length) return;
      if (this.isForm(node.type)) {
        // 跳过 form 节点，寻找其兄弟节点
        traverse(node.sibling, depth);
        return;
      }

      if (this.isAnonymous(node.name)) {
        traverse(node.child, depth);
        traverse(node.sibling, depth);
        return;
      }

      const name = tmpPath[depth];
      if (name === node.name) {
        // 找到了最终的目标之一
        if (depth === length - 1) {
          result.push(node);
          // 继续在兄弟节点找
          traverse(node.sibling, depth);
          return;
        }
        // 在儿子节点找
        traverse(node.child, depth + 1);
        // 继续在兄弟节点找
        traverse(node.sibling, depth);
        return;
      }
      // 没找到，继续在兄弟找
      traverse(node.sibling, depth);
    };
    traverse(cur, 0);
    return result;
  };

  // 根据节点查找最近所属的表单父节点(如果传入的 node 就是表单节点，则返回自己)
  findNearlyParentFormNode = (
    node: FNode,
    skipSelf?: boolean,
  ): FNode | undefined => {
    let cur = node;
    if (skipSelf) {
      if (this.isForm(cur?.type)) {
        cur = cur.parent;
      }
    }
    while (cur) {
      if (this.isForm(cur?.type)) {
        return cur;
      }
      cur = cur.parent;
    }
    return undefined;
  };

  // 根据节点获取：节点以及其子节点的结构化数据
  // 不查找 form 节点及其子节点
  // 同 findNode 对 form 节点的解释
  // todo 添加验证
  getValues = (
    node: FNode<FieldState | FormState>,
    skip?: (n: FNode<FieldState | FormState>) => boolean,
  ) => {
    let result: { [index: string]: any };

    const getValueTemplate = (n: FNode<FieldState | FormState>) => {
      if (this.objectNode(n)) {
        return {};
      }
      if (this.arrayNode(n)) {
        return [];
      }
      return n.instance.model().value;
    };
    const traverse = (
      n: FNode<FieldState | FormState>,
      upperObj?: Record<string, any>,
    ) => {
      if (!n) return;
      if (this.isForm(n.type)) {
        if (upperObj || (skip && skip(n))) {
          traverse(n.sibling, upperObj);
          return;
        }

        upperObj = getValueTemplate(n);

        result = upperObj;
        traverse(n.child, upperObj);
        return;
      }

      if (skip && skip(n)) {
        traverse(n.sibling, upperObj);
        return;
      }
      // 没有值，说明没有找到合适的节点
      if (!result) {
        upperObj = {};
        result = upperObj;
      }

      // 匿名字段直接透传
      // 值类型为 void 的字段直接透传
      if (this.isAnonymous(n.name) || this.isVoidNode(n)) {
        traverse(n.child, upperObj);
        traverse(n.sibling, upperObj);
        return;
      }
      const cur = getValueTemplate(n);
      if (this.isArray(upperObj)) {
        upperObj.push(cur);
      } else if (this.isPlainObject(upperObj)) {
        upperObj[n.name] = cur;
      }
      traverse(n.child, cur);
      traverse(n.sibling, upperObj);
    };

    traverse(node);
    return result;
  };

  // 遍历节点
  inspect = (
    node: FNode<FieldState | FormState>,
    callback: (n: FNode<FieldState | FormState>) => [boolean, boolean],
  ) => {
    const traverse = (n: FNode<FieldState | FormState>) => {
      const [down, right] = callback(n);
      if (down && n.child) {
        traverse(n.child);
      }

      if (right && n.sibling) {
        traverse(n.sibling);
      }
    };
    traverse(node);
  };

  genErrorInfoStruct = <V>(
    value: V,
    validateStatus: ValidateStatus,
    node: FNode,
    message?: ErrorInfo<V>['message'],
  ): ErrorInfo<V> => {
    return {
      node,
      value,
      message,
      validateStatus,
    };
  };

  composeRuleValidator =
    <V>(next: SerpentRule<V>['validator'], pre?: SerpentRule<V>['validator']) => (value: V, field: FieldInstance<V>, form: FormInstance<any>) => {
      if (!pre) {
        return next(value, field, form);
      }
      const r = pre(value, field, form);
      if (!r) {
        return next(value, field, form);
      }
      return r;
    };

  runRules = <V>(node: FNode<FieldState<V>>, formNode: FNode<FormState>) => {
    let callback: SerpentRule<V>['validator'];
    let requiredRule: SerpentRule<V>;
    const callbackFn = node.instance?.state?.rules?.reduce((pre, cur) => {
      if (cur?.required || !cur?.validator) {
        if (cur?.required) {
          requiredRule = cur;
        }
        return pre;
      }
      pre = this.composeRuleValidator(cur.validator, pre);
      return pre;
    }, callback);

    if (requiredRule) {
      callback = (
        value: V,
        field: FieldInstance<V>,
        form: FormInstance<any>,
      ) => {
        let r;
        if (requiredRule?.validator) {
          r = requiredRule.validator(value, field, form);
        } else if (this.isEmpty(value)) {
          r = requiredRule?.message;
        }
        if (r) {
          return r;
        }
        return callbackFn?.(value, field, form);
      };
    } else {
      callback = callbackFn;
    }
    return callback?.(
      node.instance?.state?.value,
      node.instance,
      formNode?.instance,
    );
  };

  // 节点 node 执行 validator
  // 返回节点校验的 message 信息，promise 永远是 fullfilled 的
  execValidator = <V>(
    node: FNode<FieldState<V>>,
    formNode: FNode<FormState>,
  ): Promise<ErrorInfo<V>> => {
    return node.validateModel
      .race(Promise.resolve(0))
      .then(() => {
        // 更新校验状态
        node.instance.model.race({
          validateStatus: ValidateStatus.validating,
        });

        const error = this.runRules(node, formNode);
        const errorPromise = Promise.resolve(error)
          .then((e) => {
            return e;
          })
          .catch((err) => {
            return err;
          });
        const { value } = node.instance?.state || {};
        return node.validateModel
          .race(() => {
            return errorPromise.then((res) => {
              let result: FieldState<V> = null;
              if (!res) {
                result = {
                  errors: [],
                  validateStatus: ValidateStatus.success,
                };
                return result;
              }
              const error = this.genErrorInfoStruct(
                value,
                ValidateStatus.error,
                node,
                res,
              );
              result = {
                validateStatus: ValidateStatus.error,
                errors: [error],
              };
              return result;
            });
          })
          .then((data: FieldState<V>) => {
            node.instance.model.race(data);
            return data?.errors?.[0];
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
  };

  getDefaultValueType = (type: NodeType) => {
    return this.isForm(type) ? NodeValueType.object : NodeValueType.string;
  };
}

export default new NodeHelper();
