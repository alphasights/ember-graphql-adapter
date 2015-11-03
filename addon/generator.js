export default function Generator() {}

Generator.openingToken = '{';
Generator.closingToken = '}';
Generator.separaterToken = ' ';

Generator.generate = function(operation) {
  let acc = this.openingToken;

  acc = this.openOperation(operation, acc);

  acc = this.generateSelectionSet(operation.selectionSet, acc);

  acc = this.closeOperation(acc);

  return acc;
};

Generator.openOperation = function(operation, acc) {
  return acc + operation.type + this.separaterToken + operation.name + this.separaterToken;
};

Generator.closeOperation = function(acc) {
  return acc + this.closingToken;
};

Generator.generateSelectionSet = function(set, acc) {
  acc = acc + this.openingToken;

  set.forEach((field) => {
    acc = this.generateField(field, acc);
  });

  acc = acc + this.closingToken;

  return acc;
};

Generator.generateField = function(field, acc) {
  return acc + this.separaterToken + field.name + this.separaterToken;
};
