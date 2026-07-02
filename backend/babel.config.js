// Used only by Jest to transform TypeScript test files.
// The production build uses tsc (see "build" script).
module.exports = {
  presets: [
    ['@babel/preset-typescript'],
  ],
  targets: { node: 'current' },
};
