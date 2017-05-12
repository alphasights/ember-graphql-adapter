export default class SelectionSet {
  constructor(...args) {
    this.items = [...args];
  }

  push(...args) {
    this.items.push(...args);
  }

  pop() {
    return this.items.pop();
  }

  toArray() {
    return new Array(...this.items);
  }
}
