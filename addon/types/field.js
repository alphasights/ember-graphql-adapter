import { ArgumentSet, SelectionSet } from '../types';

export default function Field(name, argumentSet, selectionSet) {
  this.name = name;
  this.argumentSet = argumentSet || new ArgumentSet();
  this.selectionSet = selectionSet || new SelectionSet();
}
