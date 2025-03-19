import type { FC, ReactElement, ReactNode } from 'react';
import React, { useRef } from 'react';

import classNames from 'classnames';
import { useSerpentContext } from '../Context';

import { getClassName } from '../constants';
import type { SerpentFormItemProps } from '../interface';

const FormItem: FC<SerpentFormItemProps> = (props) => {
  const {
    children, onChange, fieldState, id,
  } = props;

  const serpentContext = useSerpentContext();
  const { prefix } = serpentContext;

  const propsRef = useRef(props);
  propsRef.current = props;

  const count = React.Children.count(children);

  let element: ReactElement | ReactNode = children;
  if (React.isValidElement(children)) {
    element = React.cloneElement(children, {
      // @ts-expect-error value 没有在 children 上定义
      value: Object.is(fieldState?.value, undefined) ? null : fieldState?.value, // undefined 会被认为没有传 value，从而达不到受控的目的
      onChange,
      id,
    });
  }

  if (count > 1 || count <= 0) {
    element = <>{children}</>;
  }

  const hasError = !!fieldState?.errors?.length;

  return (
    <section
      className={classNames(getClassName('form-item', prefix), {
        [getClassName('form-item-with-error', prefix)]: hasError,
      })}
      style={{ display: 'flex', padding: '16px' }}
    >
      <section className={getClassName('form-item-label', prefix)}>
        {fieldState.label}
      </section>
      <section id={id} className={getClassName('form-item-content', prefix)}>
        {element}
      </section>
      <section className={getClassName('form-item-error', prefix)}>
        {fieldState?.errors
          ?.map((error) => {
            return error?.message;
          })
          ?.join?.('\n')}
      </section>
    </section>
  );
};

export default FormItem;
