import { bindable, inject } from 'aurelia-framework';

@inject(Element)
export class NameTag {
  @bindable
  value: string

  constructor(public el: Element) {}

  attached() {
    this.el.setAttribute('data-name-tag', this.value);
  }
}
