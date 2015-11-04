import { ArgumentSet, SelectionSet } from '../types';

export default function Operation(type, name, argumentSet, rootSet) {
  this.type = type;
  this.name = name;
  this.argumentSet = argumentSet || new ArgumentSet();
  this.selectionSet = rootSet || new SelectionSet();
}
