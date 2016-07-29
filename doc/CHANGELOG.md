<a name="1.1.0"></a>
# [1.1.0](https://github.com/aurelia/webpack-plugin/compare/1.0.0...v1.1.0) (2016-07-29)


### Bug Fixes

* **build-resources:** fix a regression caused by scoping support ([d7dec55](https://github.com/aurelia/webpack-plugin/commit/d7dec55))
* **index:** do not reassign moduleId when one with the same name exists already ([fddd9e1](https://github.com/aurelia/webpack-plugin/commit/fddd9e1))


### Features

* **index:** add the option 'nameLocalModules' for manually disabling moduleId remapping ([2f9c89a](https://github.com/aurelia/webpack-plugin/commit/2f9c89a))
* **index:** make naming external modules optional ([af1a745](https://github.com/aurelia/webpack-plugin/commit/af1a745))



<a name="1.0.0"></a>
# [1.0.0](https://github.com/aurelia/webpack-plugin/compare/1.0.0-beta.4.0.1...v1.0.0) (2016-07-27)


### Bug Fixes

* **build-resources:** allow scoped modules ([a2bea83](https://github.com/aurelia/webpack-plugin/commit/a2bea83))
* **build-resources:** allow scoped packages in fixRelativeFromPath ([ae101c6](https://github.com/aurelia/webpack-plugin/commit/ae101c6))
* **build-resources:** allow sibling directories of the same name as modules ([c104ea2](https://github.com/aurelia/webpack-plugin/commit/c104ea2)), closes [#55](https://github.com/aurelia/webpack-plugin/issues/55)
* **build-resources:** do not break when no package.json loaded ([b5b9fae](https://github.com/aurelia/webpack-plugin/commit/b5b9fae))
* **build-resources:** do not break when no packageJson loaded ([5f6f3b4](https://github.com/aurelia/webpack-plugin/commit/5f6f3b4))
* **build-resources:** ignore <require> with template strings ([e30afc2](https://github.com/aurelia/webpack-plugin/commit/e30afc2)), closes [#56](https://github.com/aurelia/webpack-plugin/issues/56)
* **build-resources:** pass absolute path to installedRootModulePaths ([ec3f123](https://github.com/aurelia/webpack-plugin/commit/ec3f123))
* **build-resources:** root module paths can be scoped ([47906ba](https://github.com/aurelia/webpack-plugin/commit/47906ba))
* **index:** use the css loader together with other CSS-processing extensions ([44214e1](https://github.com/aurelia/webpack-plugin/commit/44214e1)), closes [#14](https://github.com/aurelia/webpack-plugin/issues/14)
* **origin-loader:** switch to a more unique variable name ([4223ab2](https://github.com/aurelia/webpack-plugin/commit/4223ab2))


### Features

* **all:** use path-based moduleIds and hook native __webpack_require__ ([54d7c65](https://github.com/aurelia/webpack-plugin/commit/54d7c65))
* **index:** add a warning about depracated features ([0535927](https://github.com/aurelia/webpack-plugin/commit/0535927))
* **index:** allow passing custom loaders to be used by in the Views ([b8f87d6](https://github.com/aurelia/webpack-plugin/commit/b8f87d6))
* **origin-loader:** build resources now set their Origin using aurelia-metadata ([a69b8f0](https://github.com/aurelia/webpack-plugin/commit/a69b8f0))
* **origin-loader:** move origin setting out to loader-webpack ([90a3658](https://github.com/aurelia/webpack-plugin/commit/90a3658))


### BREAKING CHANGES

* origin-loader: requires changes from loader-webpack (https://github.com/aurelia/loader-webpack/commit/b6a3ed0b2b5b7365ccd06151e34786661c1e402a)



<a name="1.0.0-beta.4.0.1"></a>
# [1.0.0-beta.4.0.1](https://github.com/aurelia/webpack-plugin/compare/1.0.0-beta.4.0.0...v1.0.0-beta.4.0.1) (2016-07-12)


### Bug Fixes

* **build-resources:** Fix module resolution for symlinks ([4a5536d](https://github.com/aurelia/webpack-plugin/commit/4a5536d))



<a name="1.0.0-beta.4.0.0"></a>
# [1.0.0-beta.4.0.0](https://github.com/aurelia/webpack-plugin/compare/1.0.0-beta.3.0.0...v1.0.0-beta.4.0.0) (2016-06-24)


### Bug Fixes

* **build-resources:** normalize paths for Windows support ([168c3b5](https://github.com/aurelia/webpack-plugin/commit/168c3b5))
* **build-resources:** remove empty path between modules list ([4cd67d5](https://github.com/aurelia/webpack-plugin/commit/4cd67d5))
* **index:** ensure we have './' at the beginning of the request path ([eded984](https://github.com/aurelia/webpack-plugin/commit/eded984))
* **index:** fix a fatal error; better error handling ([64161c2](https://github.com/aurelia/webpack-plugin/commit/64161c2))


### Features

* **build-resources:** add all dependencies as build resources by default ([30eb24f](https://github.com/aurelia/webpack-plugin/commit/30eb24f))



<a name="1.0.0-beta.2.0.4"></a>
# [1.0.0-beta.2.0.4](https://github.com/aurelia/webpack-plugin/compare/1.0.0-beta.2.0.3...v1.0.0-beta.2.0.4) (2016-06-22)



### 1.0.0-beta.1.0.4

* feat(index): allow specifying module type to load

### 1.0.0-beta.1.0.2

* feat(package): change `webpack` to `peerDependencies`
