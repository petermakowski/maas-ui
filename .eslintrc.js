module.exports = {
  root: true,
  parser: "@typescript-eslint/parser",
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: "module",
    ecmaFeatures: {
      jsx: true,
    },
  },
  settings: {
    react: {
      version: "detect",
    },
    "import/resolver": {
      node: {
        paths: ["src"],
        extensions: [".js", ".jsx", ".ts", ".tsx"],
      },
    },
  },
  env: {
    browser: true,
    amd: true,
    node: true,
  },
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:react/recommended",
    "plugin:react-hooks/recommended",
    "plugin:prettier/recommended", // Make sure this is always the last element in the array.
  ],
  plugins: ["eslint-plugin-import-order", "import", "prettier"],
  rules: {
    "prettier/prettier": ["error", {}, { usePrettierrc: true }],
    "react/react-in-jsx-scope": "off",
    "react/jsx-key": "off",
    "no-prototype-builtins": "off",
    "no-unsafe-optional-chaining": "off",
    "no-case-declarations": "off",
    "react/prop-types": "off",
    "react/no-unescaped-entities": "off",
    "@typescript-eslint/ban-types": [
      "error",
      {
        types: {
          "{}": false,
        },
        extendDefaults: true,
      },
    ],
    "@typescript-eslint/explicit-function-return-type": "off",
    "sort-imports": [
      "error",
      {
        ignoreCase: true,
        ignoreDeclarationSort: true,
      },
    ],
    "import/order": [
      "error",
      {
        pathGroups: [
          {
            pattern: "react",
            group: "external",
            position: "before",
          },
          {
            pattern: "~/app",
            group: "internal",
          },
        ],
        pathGroupsExcludedImportTypes: ["react"],
        "newlines-between": "always",
        alphabetize: {
          order: "asc",
        },
      },
    ],
  },
  overrides: [
    {
      files: ["src/**/*.js?(x)"],
      rules: {
        "no-unused-vars": 2,
      },
    },
    {
      files: ["src/**/*.tsx"],
      rules: {
        "react/no-multi-comp": ["off"],
      },
    },
    {
      files: ["src/**/*.test.[jt]s?(x)"],
      extends: ["plugin:testing-library/react"],
      plugins: ["no-only-tests"],
      rules: {
        "react/display-name": "off",
        "no-only-tests/no-only-tests": "error",
        "testing-library/prefer-find-by": "off",
        "testing-library/prefer-explicit-assert": "error",
        "testing-library/prefer-user-event": [
          "error",
          {
            // Remove once sliders can be updated with user-event
            // https://github.com/testing-library/user-event/issues/871
            allowedMethods: ["change"],
          },
        ],
        "react/no-multi-comp": "off",
      },
    },
    {
      files: ["cypress/**/*.spec.[jt]s?(x)"],
      extends: ["plugin:cypress/recommended", "plugin:prettier/recommended"],
      plugins: ["cypress", "no-only-tests"],
      rules: {
        "no-only-tests/no-only-tests": "error",
        // vanilla framework often hides default inputs and displays styled ones instead
        // because of this we need to use use force option to allow interacting with hidden fields
        "cypress/no-force": "off",
        "prettier/prettier": "error",
      },
    },
    {
      files: ["tests/**/*.[jt]s?(x)"],
      extends: ["plugin:playwright/recommended"],
      rules: {
        // vanilla framework often hides default inputs and displays styled ones instead
        // because of this we need to use use force option to allow interacting with hidden fields
        "playwright/no-force-option": "off",
        "no-only-tests/no-only-tests": "error",
        "prettier/prettier": "error",
      },
    },
  ],
};
