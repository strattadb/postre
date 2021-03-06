module.exports = {
  root: true,

  parser: '@typescript-eslint/parser',

  parserOptions: {
    ecmaVersion: 2021,
    sourceType: 'module',
    project: './tsconfig.json',
    tsconfigRootDir: './',
    ecmaFeatures: {
      jsx: true,
    },
  },

  plugins: [
    'node',
    'promise',
    'unicorn',
    'jest',
    'import',
    '@typescript-eslint',
    'eslint-comments',
    'prettier',
  ],

  env: {
    es2021: true,
    node: true,
    jest: true,
    browser: false,
  },

  extends: [
    'eslint:recommended',
    'plugin:node/recommended',
    'plugin:promise/recommended',
    'plugin:unicorn/recommended',
    'plugin:jest/recommended',
    'airbnb-base',
    'plugin:@typescript-eslint/recommended',
    'plugin:eslint-comments/recommended',
    'prettier',
  ],

  rules: {
    'no-use-before-define': 'off',
    'no-restricted-syntax': 'off',
    'no-console': 'off',
    'no-undef-init': 'off',
    'no-await-in-loop': 'off',
    'no-undef': 'off',
    'no-unused-vars': 'off',
    'no-restricted-globals': 'off',
    'no-shadow': 'off',
    'prefer-destructuring': 'off',
    'no-multi-str': 'off',
    'no-dupe-class-members': 'off',

    'unicorn/filename-case': 'off',
    'unicorn/prevent-abbreviations': 'off',
    'unicorn/no-process-exit': 'off',
    'unicorn/no-null': 'off',
    'unicorn/no-reduce': 'off',
    'unicorn/no-useless-undefined': 'off',

    'import/no-named-as-default': 'off',
    'import/no-extraneous-dependencies': 'off',
    'import/prefer-default-export': 'off',
    'import/order': ['error', { 'newlines-between': 'always' }],
    'import/extensions': 'off',
    'import/export': 'off',

    'prettier/prettier': 'error',

    'node/no-unsupported-features/es-syntax': 'off',
    'node/no-unsupported-features/node-builtins': 'off',
    'node/no-unpublished-require': 'off',
    'node/no-missing-import': [
      'error',
      {
        tryExtensions: ['.js', '.ts', '.node'],
      },
    ],

    'promise/valid-params': 'off',

    '@typescript-eslint/indent': 'off',
    '@typescript-eslint/no-var-requires': 'off',
    '@typescript-eslint/no-use-before-define': 'off',
    '@typescript-eslint/no-this-alias': 'error',
    '@typescript-eslint/restrict-plus-operands': 'error',
    '@typescript-eslint/prefer-interface': 'off',
    '@typescript-eslint/interface-name-prefix': 'off',
    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/no-unused-vars': 'off',

    'jest/valid-describe': 'off',
  },

  settings: {
    'import/resolver': {
      node: {
        extensions: ['.js', '.ts'],
      },
    },
  },
};
