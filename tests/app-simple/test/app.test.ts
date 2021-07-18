import 'aurelia-polyfills';
import 'aurelia-loader-webpack';
import { bootstrap } from 'aurelia-bootstrapper';
import { StageComponent } from 'aurelia-testing';
import { NameTag } from '../src/resources/elements/name-tag';
import { assert } from 'chai';

describe('app-simple/app.test.ts', function () {
  it('works', async function () {
    const component = StageComponent
      .withResources([NameTag] as any)
      .inView('<div><name-tag value.bind="message">')
      .boundTo({ message: 'hello world' });
    await component.create(bootstrap);

    assert.strictEqual(component.element.textContent.trim(), 'Hello, I\'m hello world');
    assert.strictEqual(component.element.querySelector('name-tag').getAttribute('data-name-tag'), 'hello world');
  });
});
