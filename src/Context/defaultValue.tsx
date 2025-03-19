import { prefix } from '../constants';
import FormItem from '../FormItem';
import type { SerpentContextInterface } from '../interface';

const defaultValue: SerpentContextInterface = {
  decorator: FormItem,
  prefix,
};

export default defaultValue;
