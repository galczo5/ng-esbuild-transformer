const {buildSync} = require('esbuild');
const {copyFileSync} = require('fs');

const buildResult = buildSync({
    entryPoints: ['./index.ts'],
    outfile: './dist/index.js',
    platform: 'node',
    tsconfig: './tsconfig.json'
});

copyFileSync('./package.json', './dist/package.json');

console.log(buildResult);
