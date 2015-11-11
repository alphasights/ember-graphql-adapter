import { ArgumentSet, SelectionSet } from '../types';

export default function Field(name, alias, argumentSet, selectionSet) {
  this.name = name;
  this.alias = alias;
  this.argumentSet = argumentSet || new ArgumentSet();
  this.selectionSet = selectionSet || new SelectionSet();
}
