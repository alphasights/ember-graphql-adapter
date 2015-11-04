import { Argument } from '../types';

export default function ArgumentSet() {
  this.push.apply(this, Array.prototype.slice.call(arguments));
}

ArgumentSet.prototype = Object.create(Array.prototype);
ArgumentSet.fromQuery = function(query) {
  let set = new this();

  Object.keys(query).forEach((key) => {
    set.push(new Argument(key, query[key]));
  });

  return set;
};
