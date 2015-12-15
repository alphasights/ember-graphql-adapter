import { ArgumentSet, SelectionSet } from '../types';

export default class Field {
  constructor(name, alias, argumentSet, selectionSet) {
    this.name = name;
    this.alias = alias;
    this.argumentSet = argumentSet || new ArgumentSet();
    this.selectionSet = selectionSet || new SelectionSet();
  }
}
