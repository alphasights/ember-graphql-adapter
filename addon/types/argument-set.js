import { typeOf } from '@ember/utils';
import { Argument } from '../types';

export default class ArgumentSet {
  constructor(...args) {
    this.items = [...args];
  }

  push(...args) {
    let filteredArgs = args.filter((arg) => {
      if (typeOf(arg) === 'object') {
        return typeOf(arg.value) !== 'undefined';
      } else {
        return typeOf(arg) !== 'undefined';
      }
    });

    this.items.push(...filteredArgs);
  }

  pop() {
    return this.items.pop();
  }

  toArray() {
    return new Array(...this.items);
  }

  get length() {
    return this.toArray().length;
  }

  get(index) {
    return this.toArray()[index];
  }

  static fromQuery(query) {
    let set = new ArgumentSet();

    Object.keys(query).forEach((key) => {
      let arg = new Argument(key);

      if (typeOf(query[key]) === 'object') {
        arg.value = this.fromQuery(query[key]);
      } else {
        arg.value = query[key];
      }

      set.push(arg);
    });

    return set;
  }
}
