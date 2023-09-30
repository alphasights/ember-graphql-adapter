import { ArgumentSet, SelectionSet } from '../types';

export default class Operation {
  constructor(type, name, argumentSet, rootSet) {
    this.type = type;
    this.name = name;
    this.argumentSet = argumentSet || new ArgumentSet();
    this.selectionSet = rootSet || new SelectionSet();
  }
}
