import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({ baseDirectory: __dirname });

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "next-env.d.ts",
      "design/**", // design prototypes are not part of the app build
    ],
  },
  {
    rules: {
      // Every image in this portal is a small app logo/brand mark, often a
      // data: URI from the DB — next/image can't optimize those and only adds
      // required width/height plumbing, so plain <img> is the deliberate choice.
      "@next/next/no-img-element": "off",
    },
  },
];

export default eslintConfig;
