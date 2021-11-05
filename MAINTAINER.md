## Cutting a release steps:

For this package specifically, we try to maintain what you see in GH is what you get in npm. This requires latest dist to be checked into master before a release, even though the release process may not come from GH.

Steps:

1. checkout
2. restore dependencies (`npm ci`)
3. update version (`npm version -m 'chore(release): prepare release %s'`)
4. push
5. publish to npm

```shell
# 1
git clone https://github.com/aurelia/webpack-plugin.git

# 2
npm ci

# 3
npm version [major | minor | patch | etc...] -m 'chore(release): prepare release XXXX'

# 4
git push
git push --tag

# 5
npm publish
```
