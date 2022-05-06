import 'aurelia-polyfills';
import 'aurelia-loader-webpack';
import { bootstrap } from 'aurelia-bootstrapper';
import { StageComponent } from 'aurelia-testing';
import { assert } from 'chai';
import { PLATFORM } from 'aurelia-pal';

describe('app-filesystem-cache/app.test.ts', function () {
  it('works', async function () {
    const component = StageComponent
      .withResources([PLATFORM.moduleName('src/app')])
      .inView('<app >')
      .boundTo({ });
    await component.create(bootstrap);

    assert.include(component.element.textContent.trim(), 'Test');
  });
});
