'use strict';

const { webcrypto } = require('node:crypto');

module.exports = function () {
  return {
    buildSandboxGlobals(defaultGlobals) {
      return {
        ...defaultGlobals,
        AbortController,
        crypto: webcrypto,
        fetch: globalThis.fetch,
      };
    },
  };
};
