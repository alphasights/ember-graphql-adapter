import { Argument } from '../types';
import Ember from 'ember';

export default function ArgumentSet() {
  this.push.apply(this, Array.prototype.slice.call(arguments));
}

ArgumentSet.prototype = Object.create(Array.prototype);
ArgumentSet.fromQuery = function(query) {
  let set = new this();

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
};
