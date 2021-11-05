import 'aurelia-polyfills';
import 'aurelia-loader-webpack';
import { bootstrap } from 'aurelia-bootstrapper';
import { StageComponent } from 'aurelia-testing';
import { App } from '../src/app';
import { assert } from 'chai';

describe('app-with-css-extract/app.test.ts', function () {
  it('works', async function () {
    const component = StageComponent
      .withResources([App] as any)
      .inView('<app>')
      .boundTo({ });
    await component.create(bootstrap);

    // only assert that there's no runtime error
    // the actual working is tested manually
    assert.include(component.element.textContent, 'Hello');
  });
});
