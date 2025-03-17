import { dirname } from "path";
import { fileURLToPath } from "url";

import { FlatCompat } from "@eslint/eslintrc";
import eslintPluginImport from "eslint-plugin-import";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    plugins: {
      import: eslintPluginImport,
    },
    rules: {
      "import/order": [
        "error",
        {
          "groups": ["builtin", "external", "internal", "parent", "sibling", "index"],
          "newlines-between": "always",
          "alphabetize": { "order": "asc", "caseInsensitive": true }
        }
      ]
    },
    ignores: [
      ".devcontainer/**",
      ".git/**",
      ".next/**",
      ".node_modules/**",
      ".public/**",
      ".gitignore",
      "src/components/ui/**",
      "components.json",
      "eslint.config.mjs",
      "next.config.ts",
      "next-env.d.ts",
      "postcss.config.mjs",
      "tailwind.config.ts",
      "tsconfig.json",
      "tsconfig.node.json",
      "README.md",
      ".prettierrc.js",
      "package-lock.json",
      "package.json"
    ]
  }
];

export default eslintConfig;
