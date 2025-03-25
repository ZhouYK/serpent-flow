import type { FC } from 'react';
import React, {
  forwardRef,
  useContext,
  useImperativeHandle,
  useRef,
} from 'react';

import { useDerivedState } from 'femo';
import instanceHelper from '../utils/instanceHelper';
import { formStateKeys } from './constants';
import scrollIntoView from './scroll-into-view-if-needed';

import { defaultState } from '../config';
import FormProvider from '../FormProvider';
import useNode from '../hooks/internal/useNode';
import type { FormInstance, FormProps } from '../interface';
import NodeProvider from '../NodeProvider';
import NodeContext from '../NodeProvider/NodeContext';

const Form: FC<FormProps> = forwardRef<FormInstance, FormProps>(
  (props, ref) => {
    const { children, ...rest } = props;
    const formRef = useRef<HTMLFormElement>();
    const [formState, formNode] = useNode(
      instanceHelper.filterState({
        ...defaultState,
        ...rest,
      }, formStateKeys),
      'form',
    );
    const contextNodes = useContext(NodeContext);

    const [nodes] = useDerivedState(() => {
      return [formNode, ...(contextNodes || [])];
    }, [formNode, contextNodes]);

    useImperativeHandle(ref, () => {
      return formNode.instance;
    });

    formNode.scrollToField = (fieldId: string) => {
      if (!formRef.current) return;
      const fieldNode = formRef.current.querySelector(`#${fieldId}`);

      if (fieldNode) {
        scrollIntoView(fieldNode, {
          behavior: 'smooth',
          block: 'nearest',
          scrollMode: 'if-needed',
        });
      }
    };
    return (
      <NodeProvider nodes={nodes}>
        <FormProvider state={formState} node={formNode}>
          <form autoComplete='off' className={formState?.className} ref={formRef}>{children}</form>
        </FormProvider>
      </NodeProvider>
    );
  },
);

export default Form;
