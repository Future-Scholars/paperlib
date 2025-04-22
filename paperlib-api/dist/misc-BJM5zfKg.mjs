var commonjsGlobal = typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};

function getDefaultExportFromCjs (x) {
	return x && x.__esModule && Object.prototype.hasOwnProperty.call(x, 'default') ? x['default'] : x;
}

function uid() {
  const randomPart = Math.random().toString(36);
  const timestampPart = Date.now().toString(36);
  return randomPart.slice(randomPart.length - 4) + timestampPart.slice(timestampPart.length - 4);
}

export { commonjsGlobal as c, getDefaultExportFromCjs as g, uid as u };
