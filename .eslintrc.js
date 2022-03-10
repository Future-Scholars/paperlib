module.exports = {
  'env': {
    'browser': true,
    'es2021': true,
  },
  'extends': [
    'plugin:vue/essential',
    'google',
  ],
  'parserOptions': {
    'ecmaVersion': 'latest',
    'sourceType': 'module',
  },
  'plugins': [
    'vue',
  ],
  'rules': {
    'max-len': [
      'error',
      {'code': 140},
    ],
    'require-jsdoc': [
      'off',
    ],
    'no-unused-vars': ['off'],
    'vue/no-mutating-props': ['off'],
  },
};
