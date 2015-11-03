export default function SelectionSet() {
  this.push.apply(this, Array.prototype.slice.call(arguments));
}

SelectionSet.prototype = Object.create(Array.prototype);
