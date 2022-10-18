let prettierRule = {}

try {
  // eslint-disable-next-line global-require
  prettierRule = require('./.prettierrc.json')
} catch (_) {
  //
}

module.exports = {
  parser: require.resolve('@typescript-eslint/parser'),

  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module'
  },

  env: {
    browser: true,
    es2021: true,
    node: true
  },

  plugins: ['@typescript-eslint'],

  extends: ['eslint:recommended', 'plugin:@typescript-eslint/eslint-recommended', 'plugin:prettier/recommended'],

  rules: {
    'prettier/prettier': ['error', prettierRule]
  }
}
