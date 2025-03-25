# serpent-flow
> react form data flow

## 特点
- 完全遵循 react 的数据流动规则
- 兼具响应式数据流的单点监听
- 函数式编程风格
- 数据和展示层完全分离，能与所有 react 的 ui library 集成
- typescript 类型友好

## 安装
```bash
npm install serpent-flow
```

## 使用
#### 写一个表单字段

```tsx
import React, { FC } from 'react'
import { Field } from 'serpent-flow';
import { Input } from 'your ui library';

interface Props {
}

const NameField: FC<Props> = () => {
  return (
    <Field
      name='name'
      label='Name'
      rules={[{
        required: true,
        message: 'Enter name',
      }]}
    >
      <Input placeholder='name' />
    </Field>
  )
}

export default NameField;

```

#### 写一个表单
InfoPage.tsx
```tsx
import React, { FC, useRef } from 'react'
import { Form, FormInstance, } from 'serpent-flow';
import NameField from './NameField';

interface Props {
}

const InfoPage: FC<Props> = () => {

  const formRef = useRef<FormInstance>();

  const onSubmit = () => {
    formRef.current?.validate().then((values) => {
      console.log(values); // { name: 'xxx'} }
    })
  }
  
  return (
    <>
      <Form ref={formRef}>
        <NameField/>
      </Form>
      <button onClick={onSubmit}>submit</button>
    </>
  )
}

export default InfoPage;

```

#### 更进一步：与 ui library 集成

这里以 arco-design 为例

###### 全局设置
```tsx
import React from 'react'
import { SerpentContext, SerpentContextInterface, } from 'serpent-flow'
import FormItem from './FormItem'; // 稍后会详细介绍 FormItem.tsx 的内容

const serpentContextValue: SerpentContextInterface = {
  decorator: FormItem, // 与 arco-design 集成的字段装饰器
  prefix: 'arco', // arco-design 的 类名前缀
}

return (
  <SerpentContext.Provider value={serpentContextValue}>
    {
      // app element
    }
  </SerpentContext.Provider>
)
```

###### 定制 FormItem.tsx

```tsx
import { FormItemProps as ArcoFormItemProps } from '@arco-design/web-react/es/Form/interface';
import instanceHelper from 'serpent-flow/es/utils/instanceHelper';
import type { FC, ReactElement, ReactNode } from 'react';
import React, { useRef } from 'react';

import { Grid, Input, Upload } from '@arco-design/web-react';
import classNames from 'classnames';
import '@arco-design/web-react/es/Form/style/index.less';

import { getClassName } from 'serpent-flow/es/constants';
import {
  FieldState, FormState, SerpentFormItemProps, ValidateStatus, useSerpentContext, useForm,
} from 'serpent-flow';
import FormItemLabel from './FormItemLable';

const { Row } = Grid;
const { Col } = Grid;

const getErrorClassNames = (element: ReactElement, prefix: string) => {
  let errorClassName = '';
  if (element?.type === Input.TextArea) {
    errorClassName = `${prefix}-textarea-error`;
  } else if (element?.type === Input) {
    errorClassName = `${prefix}-input-error`;
  }
  return errorClassName;
};

const transValueToOtherProps = <V = any>(value: V, element: ReactElement) => {
  if (element?.type === Upload) {
    return {
      fileList: value,
    };
  }

  return {
    value,
  };
};

// 设置支持的 arco form item 属性，可视自身需求添加支持的属性
export type SupportedArcoFormItemProps = Pick<
  ArcoFormItemProps,
  'labelCol' | 'colon' | 'required' | 'wrapperCol' | 'layout' | 'requiredSymbol'
>

interface FieldExtendState extends FieldState<any, SupportedArcoFormItemProps> {}

interface FormExtendState extends FormState<any, SupportedArcoFormItemProps> {}

const FormItem: FC<SerpentFormItemProps<FieldExtendState>> = (props) => {
  const {
    children, onChange, fieldState, id,
  } = props;

  const [formInstance] = useForm<any, FormExtendState>();

  const serpentContext = useSerpentContext();
  const { prefix } = serpentContext;

  const propsRef = useRef(props);
  propsRef.current = props;

  const count = React.Children.count(children);

  const hasError = fieldState?.validateStatus === ValidateStatus.error;

  let element: ReactElement | ReactNode = children;
  if (React.isValidElement(children)) {
    element = React.cloneElement(children, {
      // undefined 会被认为没有传 value，从而达不到受控的目的
      ...transValueToOtherProps(Object.is(fieldState?.value, undefined) ? null : fieldState?.value, children),
      // @ts-expect-error onChange 没有在 children 上定义
      onChange,
      id,
      disabled: fieldState?.disabled,
      className: classNames((children?.props as { className?: string })?.className, hasError ? getErrorClassNames(children, prefix) : ''),
    });
  }

  if (count > 1 || count <= 0) {
    element = <>{children}</>;
  }

  const { extendProps: fieldSupportedArcoFormItemProps } = fieldState || {};
  const { extendProps: formSupportedArcoFormItemProps } = formInstance?.state || {};

  const supportedArcoFormItemProps = instanceHelper.merge(fieldSupportedArcoFormItemProps, formSupportedArcoFormItemProps);

  const {
    labelCol = { span: 5, offset: 0 },
    wrapperCol = { span: 19, offset: 0 },
    layout,
    requiredSymbol,
  } = supportedArcoFormItemProps || {};

  return (
    <Row
      className={classNames(
        fieldState?.className,
        getClassName('form-item', prefix),
        {
          [getClassName('form-item-error', prefix)]: hasError,
          [getClassName('form-item-status-error', prefix)]: hasError,
        },
        getClassName(`layout-${layout || 'horizontal'}`, prefix),
      )}
    >
      <Col
        {...labelCol}
        className={classNames(
          getClassName('form-label-item', prefix),
          labelCol?.className,
          {
            [getClassName('label-item-flex', prefix)]: !labelCol,
          },
        )}
      >
        <FormItemLabel
          label={fieldState.label}
          htmlFor={id}
          rules={fieldState.rules}
          showColon={supportedArcoFormItemProps?.colon}
          prefix={prefix}
          requiredSymbol={requiredSymbol}
          required={supportedArcoFormItemProps?.required}
        />
      </Col>
      <Col
        className={classNames(getClassName('form-item-wrapper', prefix), {
          [getClassName('item-wrapper-flex', prefix)]: !wrapperCol,
        })}
        {...wrapperCol}
      >
        <section className={getClassName('form-item-control-wrapper', prefix)}>
          <section
            className={getClassName('form-item-control', prefix)}
            id={id}
          >
            <section
              className={getClassName('form-item-control-children', prefix)}
            >
              {element}
            </section>
          </section>
        </section>
        {hasError ? (
          <section className={getClassName('form-message', prefix)}>
            <section>
              {fieldState?.errors
                ?.map((error) => {
                  return <>{error?.message}<br/></>;
                })}
            </section>
          </section>
        ) : null}
      </Col>
    </Row>
  );
};

export default FormItem;

```

FormItemLable.tsx
```tsx
    import { SupportedArcoFormItemProps } from '@/components/Arco/interface';
import type { ReactElement, ReactNode } from 'react';
import React, { isValidElement } from 'react';

import type { TooltipProps } from '@arco-design/web-react';
import { Tooltip } from '@arco-design/web-react';
import { IconQuestionCircle } from '@arco-design/web-react/icon';
import classNames from 'classnames';
import type {
  FieldState,
} from 'serpent-flow';

const opt = Object.prototype.toString;

export function isArray(obj: any): obj is any[] {
  return opt.call(obj) === '[object Array]';
}

export function isObject(obj: any): obj is { [key: string]: any } {
  return opt.call(obj) === '[object Object]';
}

interface FormItemLabelProps
  extends Pick<SupportedArcoFormItemProps, 'requiredSymbol' | 'required'>,
    Pick<FieldState, 'rules' | 'label'> {
  // eslint-disable-next-line @typescript-eslint/no-redundant-type-constituents
  showColon: boolean | ReactNode;
  prefix: string;
  htmlFor?: string;
  tooltip?: ReactNode;
}

const FormItemLabel: React.FC<FormItemLabelProps> = ({
                                                       htmlFor,
                                                       showColon,
                                                       label,
                                                       requiredSymbol,
                                                       required,
                                                       rules,
                                                       prefix,
                                                       tooltip,
                                                     }) => {
  const symbolPosition = isObject(requiredSymbol)
    ? requiredSymbol.position
    : 'start';

  const symbolNode = !!requiredSymbol && (
    <strong className={`${prefix}-form-item-symbol`}>
      <svg fill="currentColor" viewBox="0 0 1024 1024" width="1em" height="1em">
        <path d="M583.338667 17.066667c18.773333 0 34.133333 15.36 34.133333 34.133333v349.013333l313.344-101.888a34.133333 34.133333 0 0 1 43.008 22.016l42.154667 129.706667a34.133333 34.133333 0 0 1-21.845334 43.178667l-315.733333 102.4 208.896 287.744a34.133333 34.133333 0 0 1-7.509333 47.786666l-110.421334 80.213334a34.133333 34.133333 0 0 1-47.786666-7.509334L505.685333 706.218667 288.426667 1005.226667a34.133333 34.133333 0 0 1-47.786667 7.509333l-110.421333-80.213333a34.133333 34.133333 0 0 1-7.509334-47.786667l214.186667-295.253333L29.013333 489.813333a34.133333 34.133333 0 0 1-22.016-43.008l42.154667-129.877333a34.133333 34.133333 0 0 1 43.008-22.016l320.512 104.106667L412.672 51.2c0-18.773333 15.36-34.133333 34.133333-34.133333h136.533334z" />
      </svg>
    </strong>
  );

  const renderTooltip = () => {
    if (!tooltip) {
      return null;
    }
    const tooltipIconClassName = `${prefix}-form-item-tooltip`;
    let tooltipProps: TooltipProps = {};
    let tooltipIcon = <IconQuestionCircle className={tooltipIconClassName} />;
    if (!isObject(tooltip) || isValidElement(tooltip)) {
      tooltipProps = {
        content: tooltip,
      };
    } else {
      const { icon, ...rest } = tooltip as TooltipProps & {
        icon?: ReactElement;
      };
      tooltipProps = rest;
      if (icon) {
        tooltipIcon = isValidElement(icon)
          ? React.cloneElement(icon as ReactElement, {
            className: classNames(
              tooltipIconClassName,
              (icon as ReactElement).props.className,
            ),
          })
          : icon;
      }
    }
    return <Tooltip {...tooltipProps}>{tooltipIcon}</Tooltip>;
  };

  return label ? (
    <label htmlFor={htmlFor}>
      {symbolPosition !== 'end' && symbolNode} {label}
      {renderTooltip()}
      {symbolPosition === 'end' && <> {symbolNode}</>}
      {/* eslint-disable-next-line no-nested-ternary */}
      {showColon ? (showColon === true ? ':' : showColon) : ''}
    </label>
  ) : null;
};

export default FormItemLabel;

```
###### 定制 ArcoField.tsx

```tsx
import { SupportedArcoFormItemProps } from './FormItem';
import { FieldProps, Field } from 'serpent-flow';
import React, { FC, forwardRef } from 'react';

interface Props extends FieldProps<any, SupportedArcoFormItemProps> {
}

const ArcoField: FC<Props> = forwardRef((props, ref) => {
  const { children, ...rest } = props;
  return (
    <Field
      ref={ref}
      {...rest}
    >
      {children}
    </Field>
  );
});

export default ArcoField;

```

###### 定制 ArcoForm.tsx

```tsx
import { SupportedArcoFormItemProps } from './FormItem';
import { FormProps, Form } from 'serpent-flow';
import React, { FC, forwardRef } from 'react';

interface Props extends FormProps<any, SupportedArcoFormItemProps> {
}

const ArcoForm: FC<Props> = forwardRef((props, ref) => {
  const { children, ...rest } = props;
  return (
    <Form
      ref={ref}
      {...rest}
    >
      {children}
    </Form>
  );
});

export default ArcoForm;

```

###### 改写 NameField.tsx 和 InfoPage.tsx

NameField.tsx
```tsx
import React, { FC } from 'react'
// import { Field } from 'serpent-flow';
import ArcoField from './ArcoField';
import { Input } from 'your ui library';

interface Props {
}

const NameField: FC<Props> = () => {
  return (
    <ArcoField
      name='name'
      label='Name'
      rules={[{
        required: true,
        message: 'Enter name',
      }]}
    >
      <Input placeholder='name' />
    </ArcoField>
  )
}

export default NameField;
```

InfoPage.tsx

```tsx
import React, { FC, useRef } from 'react'
import { FormInstance, } from 'serpent-flow';
import ArcoForm from './ArcoForm';

import NameField from './NameField';

interface Props {
}

const InfoPage: FC<Props> = () => {

  const formRef = useRef<FormInstance>();

  const onSubmit = () => {
    formRef.current?.validate().then((values) => {
      console.log(values); // { name: 'xxx'} }
    })
  }
  
  return (
    <>
      <ArcoForm ref={formRef}>
        <NameField/>
      </ArcoForm>
      <button onClick={onSubmit}>submit</button>
    </>
  )
}

export default InfoPage;
```

## API

#### Form
表单容器，用于包裹表单字段

#### Field
表单字段，用于包裹表单控件

#### useForm

const [formInstance, formNode] = useForm();
获取所在表单实例

###### formInstance.validate

```tsx
formInstance.validate().then((values) => {
  console.log(values);
})
```
###### formInstance.query

```tsx
const nameField = formInstance.query('name');
```

#### useField

const [fieldInstance, fieldNode] = useField(path?: string, options?: QueryFieldInstanceOptions);
获取所在字段实例或者指定字段实例

```tsx
// path 有三种格式：1，以 . 开头；2，以 / 开头；3，其他
const [nameField] = useField('./name'); // 相对路径：相对于所在的 node（可能为 form 节点，也可能为 field 节点） 来查找名字为 name 的字段
const [nameField] = useField('/name'); // 绝对路径：在 form 节点下查找名字为 name 的字段
const [nameField] = useField('name'); // 相对路径：相对于所在的 node（可能为 form 节点，也可能为 field 节点） 来查找名字为 name 的字段
```

###### fieldInstance.validate

```tsx
fieldInstance.validate().then((values) => {
  console.log(values);
})
```

###### fieldInstance.query

```tsx
const nameField = fieldInstance.query(); // 可不传参数
```

###### fieldInstance.model
更新字段状态的函数
```tsx
// 更新字段的值为 Jerry，不用解构 state，会默认 merge 上一次的 state
fieldInstance.mode((state) => {
  return {
    value: 'Jerry'
  }
});

```
更多 model 的使用可以看 [femo](https://github.com/ZhouYK/femo?tab=readme-ov-file#%E8%8A%82%E7%82%B9%E6%96%B9%E6%B3%95)

## 将来会有更多特性
