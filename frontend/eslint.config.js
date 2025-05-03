// eslint.config.js
import js from "@eslint/js";
import globals from "globals";
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";

export default [
  // ignore dist folder entirely
  {
    ignores: ["dist/**"],
  },

  // apply to JS/JSX files
  {
    files: ["**/*.{js,jsx}"],
    languageOptions: {
      ecmaVersion: 2020,
      sourceType: "module",
      ecmaFeatures: { jsx: true },
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    plugins: {
      react,
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      // core JS recommended
      ...js.configs.recommended.rules,

      // React plugin recommended
      ...react.configs.recommended.rules,

      // React hooks
      ...reactHooks.configs.recommended.rules,

      // React Refresh
      ...reactRefresh.configs.recommended.rules,

      // no unused except allow global Motion, etc
      "no-unused-vars": ["error", { varsIgnorePattern: "^(motion|[A-Z_])" }],

      // turn off prop-types
      "react/prop-types": "off",
    },
    settings: {
      react: {
        version: "detect",
      },
    },
  },
];
