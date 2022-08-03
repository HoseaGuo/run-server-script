
import tsPlugin from '@rollup/plugin-typescript';
import { terser } from 'rollup-plugin-terser';
import pkg from './package.json';
import dts from 'rollup-plugin-dts';
import { defineConfig } from 'rollup'

export default defineConfig([
  {
    input: "./source/index.ts",
    output: [
      {
        file: pkg.main,
        format: 'cjs',
        minifyInternalExports: true
      },
      {
        file: pkg.module,
        format: 'es',
        minifyInternalExports: true
      },
      // {
      //   format: 'umd',
      //   file: 'dist/index.min.js',
      //   name: 'PackageName',
      // },
    ],
    plugins: [
      tsPlugin(),
      // terser()
      // nodeResolve(),
      // commonjs()
    ],
  },
  /* 单独生成声明文件 */
  {
    input: "./source/index.ts",
    plugins: [dts()],
    output: {
      format: 'esm',
      file: pkg.types,
    },
  },
])