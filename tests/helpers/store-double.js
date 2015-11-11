import Serializer from 'graphql-adapter/serializer';

export default function StoreDouble(map) {
  this.map = map;
  this.modelFor = (type) => { return this.map[type]; };
  this.serializerFor = () => {
    let serializer = new Serializer();
    serializer.store = this;
    return serializer;
  };
}
