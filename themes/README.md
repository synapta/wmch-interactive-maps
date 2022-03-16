## Develop new css using node 14, e.g.

```
nvm use 14
yarn start
```

Your project will be recompiled every time you save a Sass file in `dist/, see [doc](https://get.foundation/sites/docs/starter-projects.html).

## Create distribution build

```
../build.sh
```

## Create new theme with

```
nvm use 14
npm install --global foundation-cli
foundation new
<choose basic template>
cd themename
yarn
```
