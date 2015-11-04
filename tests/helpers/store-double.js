export default function StoreDouble(map) {
  this.map = map;
  this.modelFor = (type) => { return this.map[type]; };
}
