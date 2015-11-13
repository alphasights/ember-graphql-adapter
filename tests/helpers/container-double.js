export default function ContainerDouble(options) {
  this.options = options;
  this.lookup = function(key) {
    return this.options[key];
  };
}
