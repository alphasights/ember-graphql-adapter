export default function ArgumentSet() {
  this.push.apply(this, Array.prototype.slice.call(arguments));
}

ArgumentSet.prototype = Object.create(Array.prototype);
