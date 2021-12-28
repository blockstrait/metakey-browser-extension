module.exports = {
  globals: {
    window: true,
    location: true,
    console: true,
    origin: true,
    document: true,
  },
  env: {
    webextensions: true,
    es2020: true,
    node: true,
  },
  extends: ['eslint:recommended', 'plugin:react/recommended'],
  plugins: ['import'],
  parserOptions: {
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true,
    },
  },
  settings: {
    react: {
      version: 'detect',
    },
  },
  ignorePatterns: ['*.html', '*.scss', '*.css', '*.png', 'node_modules/'],
  rules: {
    quotes: ['error', 'single', { avoidEscape: true }],
    'comma-dangle': ['error', 'only-multiline'],
    'comma-spacing': ['error', { before: false, after: true }],
    'no-multi-spaces': ['error', { ignoreEOLComments: false }],
    'array-bracket-spacing': ['error', 'never'],
    'array-bracket-newline': ['error', 'consistent'],
    'object-curly-spacing': ['error', 'always'],
    'object-curly-newline': ['error', { multiline: true, consistent: true }],
    'object-property-newline': [
      'error',
      { allowAllPropertiesOnSameLine: true },
    ],
    'keyword-spacing': ['error'],
    'brace-style': ['error', '1tbs', { allowSingleLine: true }],
    'space-before-blocks': 'error',
    curly: ['error', 'multi-line', 'consistent'],
    'import/no-extraneous-dependencies': [
      'error',
      {
        devDependencies: ['**/__tests__/**'],
        optionalDependencies: false,
        peerDependencies: false,
      },
    ],

    'import/no-unresolved': ['error'],

    'import/order': [
      'warn',
      {
        groups: ['builtin', 'external'],
        alphabetize: { order: 'asc', caseInsensitive: true },
      },
    ],

    'no-restricted-imports': [
      'error',
      {
        paths: [
          {
            name: 'punycode',
            message:
              "Package 'punycode' has to be imported with trailing slash, see warning in https://github.com/bestiejs/punycode.js#installation",
          },
        ],
        patterns: ['!punycode/'],
      },
    ],

    'no-duplicate-imports': ['error'],

    'no-shadow': ['off'],

    'key-spacing': ['error'],

    semi: ['error', 'always'],

    'quote-props': ['error', 'as-needed'],

    'no-multiple-empty-lines': ['error'],

    'max-len': [
      'error',
      {
        code: 150,
        ignoreUrls: true,
        ignoreStrings: true,
        ignoreTemplateLiterals: true,
        ignoreComments: true,
        ignoreRegExpLiterals: true,
      },
    ],

    'no-return-await': 'off',

    'no-console': ['off'],

    'no-trailing-spaces': ['error'],

    'dot-notation': ['error'],

    'no-bitwise': ['error'],

    'react/prop-types': 'off',
  },
};
