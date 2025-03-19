import type { FC, SyntheticEvent } from 'react';
import React, {
  forwardRef,
  useCallback,
  useContext,
  useImperativeHandle,
  useRef,
} from 'react';

import { useDerivedState } from 'femo';
import instanceHelper from '../utils/instanceHelper';
import { useSerpentContext } from '../Context';

import useNode from '../hooks/internal/useNode';
import type { FieldInstance, FieldProps } from '../interface';
import NodeProvider from '../NodeProvider';
import NodeContext from '../NodeProvider/NodeContext';
import { fieldStateKeys } from './constants';

function isSyntheticEvent(e: any): e is SyntheticEvent {
  return (
    e?.constructor?.name === 'SyntheticEvent' || e?.nativeEvent instanceof Event
  );
}

const Field: FC<FieldProps> = forwardRef<FieldInstance, FieldProps>(
  (props, ref) => {
    const {
      children,
      onFieldChange,
      field,
      onChange: onValueChange,
      decorator,
    } = props;

    const globalContext = useSerpentContext();

    const Decorator = decorator || globalContext?.decorator;

    const propsRef = useRef(props);
    propsRef.current = props;

    const onFieldChangeRef = useRef(onFieldChange);
    onFieldChangeRef.current = onFieldChange;

    const onValueChangeRef = useRef(onValueChange);
    onValueChangeRef.current = onValueChange;

    const innerOnFieldChange: FieldProps['onFieldChange'] = (
      state,
      prevState,
      field,
    ) => {
      // onValueChange 和 onFieldChange 执行顺序和下方 onChange 保持一致
      if (!Object.is(state?.value, prevState?.value)) {
        onValueChangeRef.current?.(state?.value);
      }
      onFieldChangeRef.current?.(state, prevState, field);
    };

    const [fieldState, fieldNode] = useNode(
      instanceHelper.filterState(props, fieldStateKeys),
      'field',
      innerOnFieldChange,
      field,
    );

    const fieldNodeRef = useRef(fieldNode);
    fieldNodeRef.current = fieldNode;

    // 缓存 fieldState
    const fieldStateRef = useRef(fieldState);
    fieldStateRef.current = fieldState;

    const contextNodes = useContext(NodeContext);

    const [nodes] = useDerivedState(() => {
      return [fieldNode, ...(contextNodes || [])];
    }, [fieldNode, contextNodes]);

    const onChange = useCallback((...args: any[]) => {
      const [evt] = args;
      let value = evt;
      // todo 需要处理 args，提取 value 传入 model
      if (isSyntheticEvent(evt)) {
        // @ts-expect-error target 上没有 value
        value = evt.target?.value;
      }

      const triggerOnChange = () => {
        // 优先触发 onValueChange
        onValueChangeRef.current?.(value);
        const curState = fieldNodeRef.current?.instance?.model?.();
        onFieldChangeRef.current?.(
          {
            ...curState,
            value,
          },
          fieldStateRef.current,
          fieldNode.instance,
        );
      };

      // 这里需要拦住，避免对 model 的执行造成干扰
      // 虽然在 useNode 中做了 onFieldChange 的触发，但是那是专门为 model 更新触发受控条件更新准备的
      // model 上有 onUpdate 这类的监听，所以尽量减少无关的触发。
      if ('value' in propsRef.current) {
        triggerOnChange();
        return;
      }

      // 📢这里不应该再调 triggerOnChange，因为下面更新后会去执行 innerOnFieldChange 进行通知
      // triggerOnChange();
      fieldNodeRef.current?.instance?.model((s) => ({
        ...s,
        value,
      }));
    }, []);

    useImperativeHandle(ref, () => {
      return fieldNode?.instance;
    });

    // 不可见则卸载组件
    if (!fieldState.visible) {
      return null;
    }

    return (
      <NodeProvider nodes={nodes}>
        <Decorator
          id={fieldNode?.id}
          fieldState={fieldState}
          onChange={onChange}
        >
          {children}
        </Decorator>
      </NodeProvider>
    );
  },
);
export default Field;
