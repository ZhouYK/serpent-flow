import type {
  FieldInstance,
  FieldState,
  FNode,
  FPath,
  QueryFieldInstanceOptions,
} from '../interface';
import useFieldInstance from './internal/useFieldInstance';
import useGenNode from './internal/useGenNode';

export interface UseField {
  <V = any>(): [FieldInstance<V> | null, FNode<FieldState<V>> | null];
  <V = any>(
    // eslint-disable-next-line @typescript-eslint/unified-signatures
    path: FPath,
  ): [FieldInstance<V> | null, FNode<FieldState<V>> | null];
  <V = any>(
    path: FPath,
    // eslint-disable-next-line @typescript-eslint/unified-signatures
    options: QueryFieldInstanceOptions,
  ): [FieldInstance<V> | null, FNode<FieldState<V>> | null];
}

const useField: UseField = (...args: any[]) => {
  const [path, options] = args;
  const instance = useFieldInstance(path, options);
  return [instance, instance?.node] as [FieldInstance<any> | null, FNode<FieldState<any>> | null];
};

export default useField;
