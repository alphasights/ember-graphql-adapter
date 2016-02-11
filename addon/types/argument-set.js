import { Argument } from '../types';
import Ember from 'ember';

export default class ArgumentSet extends Array {
  constructor(...args) {
    super();
    this.push(...args);
  }

  push(...args) {
    super.push(...args.filter((arg) => {
      return Ember.typeOf(arg.value) !== 'null';
    }));
  }

  static fromQuery(query) {
    let set = new ArgumentSet();

    Object.keys(query).forEach((key) => {
      let arg = new Argument(key);

      if (Ember.typeOf(query[key]) === 'object') {
        arg.value = this.fromQuery(query[key]);
      } else {
        arg.value = query[key];
      }

      set.push(arg);
    });

    return set;
  }
}
