import { nodeResolve } from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import typescript from "rollup-plugin-typescript2";
import json from "@rollup/plugin-json";
import pkg from "./package.json";
import { terser } from "rollup-plugin-terser";
import replace from "@rollup/plugin-replace";

// delete old typings to avoid issues
require("fs").unlink("dist/index.d.ts", (err) => {});

const production = !process.env.ROLLUP_WATCH;

export default {
  input: "src/index.ts",
  output: [
    {
      file: pkg.main,
      format: "cjs",
    },
    {
      file: pkg.module,
      format: "es",
    },
    {
      file: pkg.browser,
      format: "iife",
      name: "Knock",
    },
  ],
  external: [],
  plugins: [
    replace({
      "process.env.CLIENT": JSON.stringify(`${pkg.name}@${pkg.version}`),
      preventAssignment: true,
    }),
    json(),
    nodeResolve({ browser: true }),
    commonjs(),
    typescript({
      typescript: require("typescript"),
      sourceMap: !production,
      inlineSources: !production,
    }),
    production && terser(),
  ],
};
