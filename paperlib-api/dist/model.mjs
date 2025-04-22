import { c as commonjsGlobal, g as getDefaultExportFromCjs, u as uid } from './misc-BJM5zfKg.mjs';
import { g as getFileType } from './url-PcxgGzYe.mjs';

function createCommonjsModule(fn, module) {
	return module = { exports: {} }, fn(module, module.exports), module.exports;
}

var byteLength_1 = byteLength;
var toByteArray_1 = toByteArray;
var fromByteArray_1 = fromByteArray;
var lookup = [];
var revLookup = [];
var Arr = typeof Uint8Array !== 'undefined' ? Uint8Array : Array;
var code = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

for (var i = 0, len = code.length; i < len; ++i) {
  lookup[i] = code[i];
  revLookup[code.charCodeAt(i)] = i;
} // Support decoding URL-safe base64 strings, as Node.js does.
// See: https://en.wikipedia.org/wiki/Base64#URL_applications


revLookup['-'.charCodeAt(0)] = 62;
revLookup['_'.charCodeAt(0)] = 63;

function getLens(b64) {
  var len = b64.length;

  if (len % 4 > 0) {
    throw new Error('Invalid string. Length must be a multiple of 4');
  } // Trim off extra bytes after placeholder bytes are found
  // See: https://github.com/beatgammit/base64-js/issues/42


  var validLen = b64.indexOf('=');
  if (validLen === -1) validLen = len;
  var placeHoldersLen = validLen === len ? 0 : 4 - validLen % 4;
  return [validLen, placeHoldersLen];
} // base64 is 4/3 + up to two characters of the original data


function byteLength(b64) {
  var lens = getLens(b64);
  var validLen = lens[0];
  var placeHoldersLen = lens[1];
  return (validLen + placeHoldersLen) * 3 / 4 - placeHoldersLen;
}

function _byteLength(b64, validLen, placeHoldersLen) {
  return (validLen + placeHoldersLen) * 3 / 4 - placeHoldersLen;
}

function toByteArray(b64) {
  var tmp;
  var lens = getLens(b64);
  var validLen = lens[0];
  var placeHoldersLen = lens[1];
  var arr = new Arr(_byteLength(b64, validLen, placeHoldersLen));
  var curByte = 0; // if there are placeholders, only get up to the last complete 4 chars

  var len = placeHoldersLen > 0 ? validLen - 4 : validLen;
  var i;

  for (i = 0; i < len; i += 4) {
    tmp = revLookup[b64.charCodeAt(i)] << 18 | revLookup[b64.charCodeAt(i + 1)] << 12 | revLookup[b64.charCodeAt(i + 2)] << 6 | revLookup[b64.charCodeAt(i + 3)];
    arr[curByte++] = tmp >> 16 & 0xFF;
    arr[curByte++] = tmp >> 8 & 0xFF;
    arr[curByte++] = tmp & 0xFF;
  }

  if (placeHoldersLen === 2) {
    tmp = revLookup[b64.charCodeAt(i)] << 2 | revLookup[b64.charCodeAt(i + 1)] >> 4;
    arr[curByte++] = tmp & 0xFF;
  }

  if (placeHoldersLen === 1) {
    tmp = revLookup[b64.charCodeAt(i)] << 10 | revLookup[b64.charCodeAt(i + 1)] << 4 | revLookup[b64.charCodeAt(i + 2)] >> 2;
    arr[curByte++] = tmp >> 8 & 0xFF;
    arr[curByte++] = tmp & 0xFF;
  }

  return arr;
}

function tripletToBase64(num) {
  return lookup[num >> 18 & 0x3F] + lookup[num >> 12 & 0x3F] + lookup[num >> 6 & 0x3F] + lookup[num & 0x3F];
}

function encodeChunk(uint8, start, end) {
  var tmp;
  var output = [];

  for (var i = start; i < end; i += 3) {
    tmp = (uint8[i] << 16 & 0xFF0000) + (uint8[i + 1] << 8 & 0xFF00) + (uint8[i + 2] & 0xFF);
    output.push(tripletToBase64(tmp));
  }

  return output.join('');
}

function fromByteArray(uint8) {
  var tmp;
  var len = uint8.length;
  var extraBytes = len % 3; // if we have 1 byte left, pad 2 bytes

  var parts = [];
  var maxChunkLength = 16383; // must be multiple of 3
  // go through the array every three bytes, we'll deal with trailing stuff later

  for (var i = 0, len2 = len - extraBytes; i < len2; i += maxChunkLength) {
    parts.push(encodeChunk(uint8, i, i + maxChunkLength > len2 ? len2 : i + maxChunkLength));
  } // pad the end with zeros, but make sure to not forget the extra bytes


  if (extraBytes === 1) {
    tmp = uint8[len - 1];
    parts.push(lookup[tmp >> 2] + lookup[tmp << 4 & 0x3F] + '==');
  } else if (extraBytes === 2) {
    tmp = (uint8[len - 2] << 8) + uint8[len - 1];
    parts.push(lookup[tmp >> 10] + lookup[tmp >> 4 & 0x3F] + lookup[tmp << 2 & 0x3F] + '=');
  }

  return parts.join('');
}

var base64Js = {
  byteLength: byteLength_1,
  toByteArray: toByteArray_1,
  fromByteArray: fromByteArray_1
};

/*! ieee754. BSD-3-Clause License. Feross Aboukhadijeh <https://feross.org/opensource> */
var read = function read(buffer, offset, isLE, mLen, nBytes) {
  var e, m;
  var eLen = nBytes * 8 - mLen - 1;
  var eMax = (1 << eLen) - 1;
  var eBias = eMax >> 1;
  var nBits = -7;
  var i = isLE ? nBytes - 1 : 0;
  var d = isLE ? -1 : 1;
  var s = buffer[offset + i];
  i += d;
  e = s & (1 << -nBits) - 1;
  s >>= -nBits;
  nBits += eLen;

  for (; nBits > 0; e = e * 256 + buffer[offset + i], i += d, nBits -= 8) {}

  m = e & (1 << -nBits) - 1;
  e >>= -nBits;
  nBits += mLen;

  for (; nBits > 0; m = m * 256 + buffer[offset + i], i += d, nBits -= 8) {}

  if (e === 0) {
    e = 1 - eBias;
  } else if (e === eMax) {
    return m ? NaN : (s ? -1 : 1) * Infinity;
  } else {
    m = m + Math.pow(2, mLen);
    e = e - eBias;
  }

  return (s ? -1 : 1) * m * Math.pow(2, e - mLen);
};

var write = function write(buffer, value, offset, isLE, mLen, nBytes) {
  var e, m, c;
  var eLen = nBytes * 8 - mLen - 1;
  var eMax = (1 << eLen) - 1;
  var eBias = eMax >> 1;
  var rt = mLen === 23 ? Math.pow(2, -24) - Math.pow(2, -77) : 0;
  var i = isLE ? 0 : nBytes - 1;
  var d = isLE ? 1 : -1;
  var s = value < 0 || value === 0 && 1 / value < 0 ? 1 : 0;
  value = Math.abs(value);

  if (isNaN(value) || value === Infinity) {
    m = isNaN(value) ? 1 : 0;
    e = eMax;
  } else {
    e = Math.floor(Math.log(value) / Math.LN2);

    if (value * (c = Math.pow(2, -e)) < 1) {
      e--;
      c *= 2;
    }

    if (e + eBias >= 1) {
      value += rt / c;
    } else {
      value += rt * Math.pow(2, 1 - eBias);
    }

    if (value * c >= 2) {
      e++;
      c /= 2;
    }

    if (e + eBias >= eMax) {
      m = 0;
      e = eMax;
    } else if (e + eBias >= 1) {
      m = (value * c - 1) * Math.pow(2, mLen);
      e = e + eBias;
    } else {
      m = value * Math.pow(2, eBias - 1) * Math.pow(2, mLen);
      e = 0;
    }
  }

  for (; mLen >= 8; buffer[offset + i] = m & 0xff, i += d, m /= 256, mLen -= 8) {}

  e = e << mLen | m;
  eLen += mLen;

  for (; eLen > 0; buffer[offset + i] = e & 0xff, i += d, e /= 256, eLen -= 8) {}

  buffer[offset + i - d] |= s * 128;
};

var ieee754 = {
  read: read,
  write: write
};

var buffer$1 = createCommonjsModule(function (module, exports) {

  var customInspectSymbol = typeof Symbol === 'function' && typeof Symbol['for'] === 'function' ? // eslint-disable-line dot-notation
  Symbol['for']('nodejs.util.inspect.custom') // eslint-disable-line dot-notation
  : null;
  exports.Buffer = Buffer;
  exports.SlowBuffer = SlowBuffer;
  exports.INSPECT_MAX_BYTES = 50;
  var K_MAX_LENGTH = 0x7fffffff;
  exports.kMaxLength = K_MAX_LENGTH;
  /**
   * If `Buffer.TYPED_ARRAY_SUPPORT`:
   *   === true    Use Uint8Array implementation (fastest)
   *   === false   Print warning and recommend using `buffer` v4.x which has an Object
   *               implementation (most compatible, even IE6)
   *
   * Browsers that support typed arrays are IE 10+, Firefox 4+, Chrome 7+, Safari 5.1+,
   * Opera 11.6+, iOS 4.2+.
   *
   * We report that the browser does not support typed arrays if the are not subclassable
   * using __proto__. Firefox 4-29 lacks support for adding new properties to `Uint8Array`
   * (See: https://bugzilla.mozilla.org/show_bug.cgi?id=695438). IE 10 lacks support
   * for __proto__ and has a buggy typed array implementation.
   */

  Buffer.TYPED_ARRAY_SUPPORT = typedArraySupport();

  if (!Buffer.TYPED_ARRAY_SUPPORT && typeof console !== 'undefined' && typeof console.error === 'function') {
    console.error('This browser lacks typed array (Uint8Array) support which is required by ' + '`buffer` v5.x. Use `buffer` v4.x if you require old browser support.');
  }

  function typedArraySupport() {
    // Can typed array instances can be augmented?
    try {
      var arr = new Uint8Array(1);
      var proto = {
        foo: function foo() {
          return 42;
        }
      };
      Object.setPrototypeOf(proto, Uint8Array.prototype);
      Object.setPrototypeOf(arr, proto);
      return arr.foo() === 42;
    } catch (e) {
      return false;
    }
  }

  Object.defineProperty(Buffer.prototype, 'parent', {
    enumerable: true,
    get: function get() {
      if (!Buffer.isBuffer(this)) return undefined;
      return this.buffer;
    }
  });
  Object.defineProperty(Buffer.prototype, 'offset', {
    enumerable: true,
    get: function get() {
      if (!Buffer.isBuffer(this)) return undefined;
      return this.byteOffset;
    }
  });

  function createBuffer(length) {
    if (length > K_MAX_LENGTH) {
      throw new RangeError('The value "' + length + '" is invalid for option "size"');
    } // Return an augmented `Uint8Array` instance


    var buf = new Uint8Array(length);
    Object.setPrototypeOf(buf, Buffer.prototype);
    return buf;
  }
  /**
   * The Buffer constructor returns instances of `Uint8Array` that have their
   * prototype changed to `Buffer.prototype`. Furthermore, `Buffer` is a subclass of
   * `Uint8Array`, so the returned instances will have all the node `Buffer` methods
   * and the `Uint8Array` methods. Square bracket notation works as expected -- it
   * returns a single octet.
   *
   * The `Uint8Array` prototype remains unmodified.
   */


  function Buffer(arg, encodingOrOffset, length) {
    // Common case.
    if (typeof arg === 'number') {
      if (typeof encodingOrOffset === 'string') {
        throw new TypeError('The "string" argument must be of type string. Received type number');
      }

      return allocUnsafe(arg);
    }

    return from(arg, encodingOrOffset, length);
  }

  Buffer.poolSize = 8192; // not used by this implementation

  function from(value, encodingOrOffset, length) {
    if (typeof value === 'string') {
      return fromString(value, encodingOrOffset);
    }

    if (ArrayBuffer.isView(value)) {
      return fromArrayView(value);
    }

    if (value == null) {
      throw new TypeError('The first argument must be one of type string, Buffer, ArrayBuffer, Array, ' + 'or Array-like Object. Received type ' + babelHelpers["typeof"](value));
    }

    if (isInstance(value, ArrayBuffer) || value && isInstance(value.buffer, ArrayBuffer)) {
      return fromArrayBuffer(value, encodingOrOffset, length);
    }

    if (typeof SharedArrayBuffer !== 'undefined' && (isInstance(value, SharedArrayBuffer) || value && isInstance(value.buffer, SharedArrayBuffer))) {
      return fromArrayBuffer(value, encodingOrOffset, length);
    }

    if (typeof value === 'number') {
      throw new TypeError('The "value" argument must not be of type number. Received type number');
    }

    var valueOf = value.valueOf && value.valueOf();

    if (valueOf != null && valueOf !== value) {
      return Buffer.from(valueOf, encodingOrOffset, length);
    }

    var b = fromObject(value);
    if (b) return b;

    if (typeof Symbol !== 'undefined' && Symbol.toPrimitive != null && typeof value[Symbol.toPrimitive] === 'function') {
      return Buffer.from(value[Symbol.toPrimitive]('string'), encodingOrOffset, length);
    }

    throw new TypeError('The first argument must be one of type string, Buffer, ArrayBuffer, Array, ' + 'or Array-like Object. Received type ' + babelHelpers["typeof"](value));
  }
  /**
   * Functionally equivalent to Buffer(arg, encoding) but throws a TypeError
   * if value is a number.
   * Buffer.from(str[, encoding])
   * Buffer.from(array)
   * Buffer.from(buffer)
   * Buffer.from(arrayBuffer[, byteOffset[, length]])
   **/


  Buffer.from = function (value, encodingOrOffset, length) {
    return from(value, encodingOrOffset, length);
  }; // Note: Change prototype *after* Buffer.from is defined to workaround Chrome bug:
  // https://github.com/feross/buffer/pull/148


  Object.setPrototypeOf(Buffer.prototype, Uint8Array.prototype);
  Object.setPrototypeOf(Buffer, Uint8Array);

  function assertSize(size) {
    if (typeof size !== 'number') {
      throw new TypeError('"size" argument must be of type number');
    } else if (size < 0) {
      throw new RangeError('The value "' + size + '" is invalid for option "size"');
    }
  }

  function alloc(size, fill, encoding) {
    assertSize(size);

    if (size <= 0) {
      return createBuffer(size);
    }

    if (fill !== undefined) {
      // Only pay attention to encoding if it's a string. This
      // prevents accidentally sending in a number that would
      // be interpreted as a start offset.
      return typeof encoding === 'string' ? createBuffer(size).fill(fill, encoding) : createBuffer(size).fill(fill);
    }

    return createBuffer(size);
  }
  /**
   * Creates a new filled Buffer instance.
   * alloc(size[, fill[, encoding]])
   **/


  Buffer.alloc = function (size, fill, encoding) {
    return alloc(size, fill, encoding);
  };

  function allocUnsafe(size) {
    assertSize(size);
    return createBuffer(size < 0 ? 0 : checked(size) | 0);
  }
  /**
   * Equivalent to Buffer(num), by default creates a non-zero-filled Buffer instance.
   * */


  Buffer.allocUnsafe = function (size) {
    return allocUnsafe(size);
  };
  /**
   * Equivalent to SlowBuffer(num), by default creates a non-zero-filled Buffer instance.
   */


  Buffer.allocUnsafeSlow = function (size) {
    return allocUnsafe(size);
  };

  function fromString(string, encoding) {
    if (typeof encoding !== 'string' || encoding === '') {
      encoding = 'utf8';
    }

    if (!Buffer.isEncoding(encoding)) {
      throw new TypeError('Unknown encoding: ' + encoding);
    }

    var length = byteLength(string, encoding) | 0;
    var buf = createBuffer(length);
    var actual = buf.write(string, encoding);

    if (actual !== length) {
      // Writing a hex string, for example, that contains invalid characters will
      // cause everything after the first invalid character to be ignored. (e.g.
      // 'abxxcd' will be treated as 'ab')
      buf = buf.slice(0, actual);
    }

    return buf;
  }

  function fromArrayLike(array) {
    var length = array.length < 0 ? 0 : checked(array.length) | 0;
    var buf = createBuffer(length);

    for (var i = 0; i < length; i += 1) {
      buf[i] = array[i] & 255;
    }

    return buf;
  }

  function fromArrayView(arrayView) {
    if (isInstance(arrayView, Uint8Array)) {
      var copy = new Uint8Array(arrayView);
      return fromArrayBuffer(copy.buffer, copy.byteOffset, copy.byteLength);
    }

    return fromArrayLike(arrayView);
  }

  function fromArrayBuffer(array, byteOffset, length) {
    if (byteOffset < 0 || array.byteLength < byteOffset) {
      throw new RangeError('"offset" is outside of buffer bounds');
    }

    if (array.byteLength < byteOffset + (length || 0)) {
      throw new RangeError('"length" is outside of buffer bounds');
    }

    var buf;

    if (byteOffset === undefined && length === undefined) {
      buf = new Uint8Array(array);
    } else if (length === undefined) {
      buf = new Uint8Array(array, byteOffset);
    } else {
      buf = new Uint8Array(array, byteOffset, length);
    } // Return an augmented `Uint8Array` instance


    Object.setPrototypeOf(buf, Buffer.prototype);
    return buf;
  }

  function fromObject(obj) {
    if (Buffer.isBuffer(obj)) {
      var len = checked(obj.length) | 0;
      var buf = createBuffer(len);

      if (buf.length === 0) {
        return buf;
      }

      obj.copy(buf, 0, 0, len);
      return buf;
    }

    if (obj.length !== undefined) {
      if (typeof obj.length !== 'number' || numberIsNaN(obj.length)) {
        return createBuffer(0);
      }

      return fromArrayLike(obj);
    }

    if (obj.type === 'Buffer' && Array.isArray(obj.data)) {
      return fromArrayLike(obj.data);
    }
  }

  function checked(length) {
    // Note: cannot use `length < K_MAX_LENGTH` here because that fails when
    // length is NaN (which is otherwise coerced to zero.)
    if (length >= K_MAX_LENGTH) {
      throw new RangeError('Attempt to allocate Buffer larger than maximum ' + 'size: 0x' + K_MAX_LENGTH.toString(16) + ' bytes');
    }

    return length | 0;
  }

  function SlowBuffer(length) {
    if (+length != length) {
      // eslint-disable-line eqeqeq
      length = 0;
    }

    return Buffer.alloc(+length);
  }

  Buffer.isBuffer = function isBuffer(b) {
    return b != null && b._isBuffer === true && b !== Buffer.prototype; // so Buffer.isBuffer(Buffer.prototype) will be false
  };

  Buffer.compare = function compare(a, b) {
    if (isInstance(a, Uint8Array)) a = Buffer.from(a, a.offset, a.byteLength);
    if (isInstance(b, Uint8Array)) b = Buffer.from(b, b.offset, b.byteLength);

    if (!Buffer.isBuffer(a) || !Buffer.isBuffer(b)) {
      throw new TypeError('The "buf1", "buf2" arguments must be one of type Buffer or Uint8Array');
    }

    if (a === b) return 0;
    var x = a.length;
    var y = b.length;

    for (var i = 0, len = Math.min(x, y); i < len; ++i) {
      if (a[i] !== b[i]) {
        x = a[i];
        y = b[i];
        break;
      }
    }

    if (x < y) return -1;
    if (y < x) return 1;
    return 0;
  };

  Buffer.isEncoding = function isEncoding(encoding) {
    switch (String(encoding).toLowerCase()) {
      case 'hex':
      case 'utf8':
      case 'utf-8':
      case 'ascii':
      case 'latin1':
      case 'binary':
      case 'base64':
      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return true;

      default:
        return false;
    }
  };

  Buffer.concat = function concat(list, length) {
    if (!Array.isArray(list)) {
      throw new TypeError('"list" argument must be an Array of Buffers');
    }

    if (list.length === 0) {
      return Buffer.alloc(0);
    }

    var i;

    if (length === undefined) {
      length = 0;

      for (i = 0; i < list.length; ++i) {
        length += list[i].length;
      }
    }

    var buffer = Buffer.allocUnsafe(length);
    var pos = 0;

    for (i = 0; i < list.length; ++i) {
      var buf = list[i];

      if (isInstance(buf, Uint8Array)) {
        if (pos + buf.length > buffer.length) {
          Buffer.from(buf).copy(buffer, pos);
        } else {
          Uint8Array.prototype.set.call(buffer, buf, pos);
        }
      } else if (!Buffer.isBuffer(buf)) {
        throw new TypeError('"list" argument must be an Array of Buffers');
      } else {
        buf.copy(buffer, pos);
      }

      pos += buf.length;
    }

    return buffer;
  };

  function byteLength(string, encoding) {
    if (Buffer.isBuffer(string)) {
      return string.length;
    }

    if (ArrayBuffer.isView(string) || isInstance(string, ArrayBuffer)) {
      return string.byteLength;
    }

    if (typeof string !== 'string') {
      throw new TypeError('The "string" argument must be one of type string, Buffer, or ArrayBuffer. ' + 'Received type ' + babelHelpers["typeof"](string));
    }

    var len = string.length;
    var mustMatch = arguments.length > 2 && arguments[2] === true;
    if (!mustMatch && len === 0) return 0; // Use a for loop to avoid recursion

    var loweredCase = false;

    for (;;) {
      switch (encoding) {
        case 'ascii':
        case 'latin1':
        case 'binary':
          return len;

        case 'utf8':
        case 'utf-8':
          return utf8ToBytes(string).length;

        case 'ucs2':
        case 'ucs-2':
        case 'utf16le':
        case 'utf-16le':
          return len * 2;

        case 'hex':
          return len >>> 1;

        case 'base64':
          return base64ToBytes(string).length;

        default:
          if (loweredCase) {
            return mustMatch ? -1 : utf8ToBytes(string).length; // assume utf8
          }

          encoding = ('' + encoding).toLowerCase();
          loweredCase = true;
      }
    }
  }

  Buffer.byteLength = byteLength;

  function slowToString(encoding, start, end) {
    var loweredCase = false; // No need to verify that "this.length <= MAX_UINT32" since it's a read-only
    // property of a typed array.
    // This behaves neither like String nor Uint8Array in that we set start/end
    // to their upper/lower bounds if the value passed is out of range.
    // undefined is handled specially as per ECMA-262 6th Edition,
    // Section 13.3.3.7 Runtime Semantics: KeyedBindingInitialization.

    if (start === undefined || start < 0) {
      start = 0;
    } // Return early if start > this.length. Done here to prevent potential uint32
    // coercion fail below.


    if (start > this.length) {
      return '';
    }

    if (end === undefined || end > this.length) {
      end = this.length;
    }

    if (end <= 0) {
      return '';
    } // Force coercion to uint32. This will also coerce falsey/NaN values to 0.


    end >>>= 0;
    start >>>= 0;

    if (end <= start) {
      return '';
    }

    if (!encoding) encoding = 'utf8';

    while (true) {
      switch (encoding) {
        case 'hex':
          return hexSlice(this, start, end);

        case 'utf8':
        case 'utf-8':
          return utf8Slice(this, start, end);

        case 'ascii':
          return asciiSlice(this, start, end);

        case 'latin1':
        case 'binary':
          return latin1Slice(this, start, end);

        case 'base64':
          return base64Slice(this, start, end);

        case 'ucs2':
        case 'ucs-2':
        case 'utf16le':
        case 'utf-16le':
          return utf16leSlice(this, start, end);

        default:
          if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding);
          encoding = (encoding + '').toLowerCase();
          loweredCase = true;
      }
    }
  } // This property is used by `Buffer.isBuffer` (and the `is-buffer` npm package)
  // to detect a Buffer instance. It's not possible to use `instanceof Buffer`
  // reliably in a browserify context because there could be multiple different
  // copies of the 'buffer' package in use. This method works even for Buffer
  // instances that were created from another copy of the `buffer` package.
  // See: https://github.com/feross/buffer/issues/154


  Buffer.prototype._isBuffer = true;

  function swap(b, n, m) {
    var i = b[n];
    b[n] = b[m];
    b[m] = i;
  }

  Buffer.prototype.swap16 = function swap16() {
    var len = this.length;

    if (len % 2 !== 0) {
      throw new RangeError('Buffer size must be a multiple of 16-bits');
    }

    for (var i = 0; i < len; i += 2) {
      swap(this, i, i + 1);
    }

    return this;
  };

  Buffer.prototype.swap32 = function swap32() {
    var len = this.length;

    if (len % 4 !== 0) {
      throw new RangeError('Buffer size must be a multiple of 32-bits');
    }

    for (var i = 0; i < len; i += 4) {
      swap(this, i, i + 3);
      swap(this, i + 1, i + 2);
    }

    return this;
  };

  Buffer.prototype.swap64 = function swap64() {
    var len = this.length;

    if (len % 8 !== 0) {
      throw new RangeError('Buffer size must be a multiple of 64-bits');
    }

    for (var i = 0; i < len; i += 8) {
      swap(this, i, i + 7);
      swap(this, i + 1, i + 6);
      swap(this, i + 2, i + 5);
      swap(this, i + 3, i + 4);
    }

    return this;
  };

  Buffer.prototype.toString = function toString() {
    var length = this.length;
    if (length === 0) return '';
    if (arguments.length === 0) return utf8Slice(this, 0, length);
    return slowToString.apply(this, arguments);
  };

  Buffer.prototype.toLocaleString = Buffer.prototype.toString;

  Buffer.prototype.equals = function equals(b) {
    if (!Buffer.isBuffer(b)) throw new TypeError('Argument must be a Buffer');
    if (this === b) return true;
    return Buffer.compare(this, b) === 0;
  };

  Buffer.prototype.inspect = function inspect() {
    var str = '';
    var max = exports.INSPECT_MAX_BYTES;
    str = this.toString('hex', 0, max).replace(/(.{2})/g, '$1 ').trim();
    if (this.length > max) str += ' ... ';
    return '<Buffer ' + str + '>';
  };

  if (customInspectSymbol) {
    Buffer.prototype[customInspectSymbol] = Buffer.prototype.inspect;
  }

  Buffer.prototype.compare = function compare(target, start, end, thisStart, thisEnd) {
    if (isInstance(target, Uint8Array)) {
      target = Buffer.from(target, target.offset, target.byteLength);
    }

    if (!Buffer.isBuffer(target)) {
      throw new TypeError('The "target" argument must be one of type Buffer or Uint8Array. ' + 'Received type ' + babelHelpers["typeof"](target));
    }

    if (start === undefined) {
      start = 0;
    }

    if (end === undefined) {
      end = target ? target.length : 0;
    }

    if (thisStart === undefined) {
      thisStart = 0;
    }

    if (thisEnd === undefined) {
      thisEnd = this.length;
    }

    if (start < 0 || end > target.length || thisStart < 0 || thisEnd > this.length) {
      throw new RangeError('out of range index');
    }

    if (thisStart >= thisEnd && start >= end) {
      return 0;
    }

    if (thisStart >= thisEnd) {
      return -1;
    }

    if (start >= end) {
      return 1;
    }

    start >>>= 0;
    end >>>= 0;
    thisStart >>>= 0;
    thisEnd >>>= 0;
    if (this === target) return 0;
    var x = thisEnd - thisStart;
    var y = end - start;
    var len = Math.min(x, y);
    var thisCopy = this.slice(thisStart, thisEnd);
    var targetCopy = target.slice(start, end);

    for (var i = 0; i < len; ++i) {
      if (thisCopy[i] !== targetCopy[i]) {
        x = thisCopy[i];
        y = targetCopy[i];
        break;
      }
    }

    if (x < y) return -1;
    if (y < x) return 1;
    return 0;
  }; // Finds either the first index of `val` in `buffer` at offset >= `byteOffset`,
  // OR the last index of `val` in `buffer` at offset <= `byteOffset`.
  //
  // Arguments:
  // - buffer - a Buffer to search
  // - val - a string, Buffer, or number
  // - byteOffset - an index into `buffer`; will be clamped to an int32
  // - encoding - an optional encoding, relevant is val is a string
  // - dir - true for indexOf, false for lastIndexOf


  function bidirectionalIndexOf(buffer, val, byteOffset, encoding, dir) {
    // Empty buffer means no match
    if (buffer.length === 0) return -1; // Normalize byteOffset

    if (typeof byteOffset === 'string') {
      encoding = byteOffset;
      byteOffset = 0;
    } else if (byteOffset > 0x7fffffff) {
      byteOffset = 0x7fffffff;
    } else if (byteOffset < -0x80000000) {
      byteOffset = -0x80000000;
    }

    byteOffset = +byteOffset; // Coerce to Number.

    if (numberIsNaN(byteOffset)) {
      // byteOffset: it it's undefined, null, NaN, "foo", etc, search whole buffer
      byteOffset = dir ? 0 : buffer.length - 1;
    } // Normalize byteOffset: negative offsets start from the end of the buffer


    if (byteOffset < 0) byteOffset = buffer.length + byteOffset;

    if (byteOffset >= buffer.length) {
      if (dir) return -1;else byteOffset = buffer.length - 1;
    } else if (byteOffset < 0) {
      if (dir) byteOffset = 0;else return -1;
    } // Normalize val


    if (typeof val === 'string') {
      val = Buffer.from(val, encoding);
    } // Finally, search either indexOf (if dir is true) or lastIndexOf


    if (Buffer.isBuffer(val)) {
      // Special case: looking for empty string/buffer always fails
      if (val.length === 0) {
        return -1;
      }

      return arrayIndexOf(buffer, val, byteOffset, encoding, dir);
    } else if (typeof val === 'number') {
      val = val & 0xFF; // Search for a byte value [0-255]

      if (typeof Uint8Array.prototype.indexOf === 'function') {
        if (dir) {
          return Uint8Array.prototype.indexOf.call(buffer, val, byteOffset);
        } else {
          return Uint8Array.prototype.lastIndexOf.call(buffer, val, byteOffset);
        }
      }

      return arrayIndexOf(buffer, [val], byteOffset, encoding, dir);
    }

    throw new TypeError('val must be string, number or Buffer');
  }

  function arrayIndexOf(arr, val, byteOffset, encoding, dir) {
    var indexSize = 1;
    var arrLength = arr.length;
    var valLength = val.length;

    if (encoding !== undefined) {
      encoding = String(encoding).toLowerCase();

      if (encoding === 'ucs2' || encoding === 'ucs-2' || encoding === 'utf16le' || encoding === 'utf-16le') {
        if (arr.length < 2 || val.length < 2) {
          return -1;
        }

        indexSize = 2;
        arrLength /= 2;
        valLength /= 2;
        byteOffset /= 2;
      }
    }

    function read(buf, i) {
      if (indexSize === 1) {
        return buf[i];
      } else {
        return buf.readUInt16BE(i * indexSize);
      }
    }

    var i;

    if (dir) {
      var foundIndex = -1;

      for (i = byteOffset; i < arrLength; i++) {
        if (read(arr, i) === read(val, foundIndex === -1 ? 0 : i - foundIndex)) {
          if (foundIndex === -1) foundIndex = i;
          if (i - foundIndex + 1 === valLength) return foundIndex * indexSize;
        } else {
          if (foundIndex !== -1) i -= i - foundIndex;
          foundIndex = -1;
        }
      }
    } else {
      if (byteOffset + valLength > arrLength) byteOffset = arrLength - valLength;

      for (i = byteOffset; i >= 0; i--) {
        var found = true;

        for (var j = 0; j < valLength; j++) {
          if (read(arr, i + j) !== read(val, j)) {
            found = false;
            break;
          }
        }

        if (found) return i;
      }
    }

    return -1;
  }

  Buffer.prototype.includes = function includes(val, byteOffset, encoding) {
    return this.indexOf(val, byteOffset, encoding) !== -1;
  };

  Buffer.prototype.indexOf = function indexOf(val, byteOffset, encoding) {
    return bidirectionalIndexOf(this, val, byteOffset, encoding, true);
  };

  Buffer.prototype.lastIndexOf = function lastIndexOf(val, byteOffset, encoding) {
    return bidirectionalIndexOf(this, val, byteOffset, encoding, false);
  };

  function hexWrite(buf, string, offset, length) {
    offset = Number(offset) || 0;
    var remaining = buf.length - offset;

    if (!length) {
      length = remaining;
    } else {
      length = Number(length);

      if (length > remaining) {
        length = remaining;
      }
    }

    var strLen = string.length;

    if (length > strLen / 2) {
      length = strLen / 2;
    }

    for (var i = 0; i < length; ++i) {
      var parsed = parseInt(string.substr(i * 2, 2), 16);
      if (numberIsNaN(parsed)) return i;
      buf[offset + i] = parsed;
    }

    return i;
  }

  function utf8Write(buf, string, offset, length) {
    return blitBuffer(utf8ToBytes(string, buf.length - offset), buf, offset, length);
  }

  function asciiWrite(buf, string, offset, length) {
    return blitBuffer(asciiToBytes(string), buf, offset, length);
  }

  function base64Write(buf, string, offset, length) {
    return blitBuffer(base64ToBytes(string), buf, offset, length);
  }

  function ucs2Write(buf, string, offset, length) {
    return blitBuffer(utf16leToBytes(string, buf.length - offset), buf, offset, length);
  }

  Buffer.prototype.write = function write(string, offset, length, encoding) {
    // Buffer#write(string)
    if (offset === undefined) {
      encoding = 'utf8';
      length = this.length;
      offset = 0; // Buffer#write(string, encoding)
    } else if (length === undefined && typeof offset === 'string') {
      encoding = offset;
      length = this.length;
      offset = 0; // Buffer#write(string, offset[, length][, encoding])
    } else if (isFinite(offset)) {
      offset = offset >>> 0;

      if (isFinite(length)) {
        length = length >>> 0;
        if (encoding === undefined) encoding = 'utf8';
      } else {
        encoding = length;
        length = undefined;
      }
    } else {
      throw new Error('Buffer.write(string, encoding, offset[, length]) is no longer supported');
    }

    var remaining = this.length - offset;
    if (length === undefined || length > remaining) length = remaining;

    if (string.length > 0 && (length < 0 || offset < 0) || offset > this.length) {
      throw new RangeError('Attempt to write outside buffer bounds');
    }

    if (!encoding) encoding = 'utf8';
    var loweredCase = false;

    for (;;) {
      switch (encoding) {
        case 'hex':
          return hexWrite(this, string, offset, length);

        case 'utf8':
        case 'utf-8':
          return utf8Write(this, string, offset, length);

        case 'ascii':
        case 'latin1':
        case 'binary':
          return asciiWrite(this, string, offset, length);

        case 'base64':
          // Warning: maxLength not taken into account in base64Write
          return base64Write(this, string, offset, length);

        case 'ucs2':
        case 'ucs-2':
        case 'utf16le':
        case 'utf-16le':
          return ucs2Write(this, string, offset, length);

        default:
          if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding);
          encoding = ('' + encoding).toLowerCase();
          loweredCase = true;
      }
    }
  };

  Buffer.prototype.toJSON = function toJSON() {
    return {
      type: 'Buffer',
      data: Array.prototype.slice.call(this._arr || this, 0)
    };
  };

  function base64Slice(buf, start, end) {
    if (start === 0 && end === buf.length) {
      return base64Js.fromByteArray(buf);
    } else {
      return base64Js.fromByteArray(buf.slice(start, end));
    }
  }

  function utf8Slice(buf, start, end) {
    end = Math.min(buf.length, end);
    var res = [];
    var i = start;

    while (i < end) {
      var firstByte = buf[i];
      var codePoint = null;
      var bytesPerSequence = firstByte > 0xEF ? 4 : firstByte > 0xDF ? 3 : firstByte > 0xBF ? 2 : 1;

      if (i + bytesPerSequence <= end) {
        var secondByte, thirdByte, fourthByte, tempCodePoint;

        switch (bytesPerSequence) {
          case 1:
            if (firstByte < 0x80) {
              codePoint = firstByte;
            }

            break;

          case 2:
            secondByte = buf[i + 1];

            if ((secondByte & 0xC0) === 0x80) {
              tempCodePoint = (firstByte & 0x1F) << 0x6 | secondByte & 0x3F;

              if (tempCodePoint > 0x7F) {
                codePoint = tempCodePoint;
              }
            }

            break;

          case 3:
            secondByte = buf[i + 1];
            thirdByte = buf[i + 2];

            if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80) {
              tempCodePoint = (firstByte & 0xF) << 0xC | (secondByte & 0x3F) << 0x6 | thirdByte & 0x3F;

              if (tempCodePoint > 0x7FF && (tempCodePoint < 0xD800 || tempCodePoint > 0xDFFF)) {
                codePoint = tempCodePoint;
              }
            }

            break;

          case 4:
            secondByte = buf[i + 1];
            thirdByte = buf[i + 2];
            fourthByte = buf[i + 3];

            if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80 && (fourthByte & 0xC0) === 0x80) {
              tempCodePoint = (firstByte & 0xF) << 0x12 | (secondByte & 0x3F) << 0xC | (thirdByte & 0x3F) << 0x6 | fourthByte & 0x3F;

              if (tempCodePoint > 0xFFFF && tempCodePoint < 0x110000) {
                codePoint = tempCodePoint;
              }
            }

        }
      }

      if (codePoint === null) {
        // we did not generate a valid codePoint so insert a
        // replacement char (U+FFFD) and advance only 1 byte
        codePoint = 0xFFFD;
        bytesPerSequence = 1;
      } else if (codePoint > 0xFFFF) {
        // encode to utf16 (surrogate pair dance)
        codePoint -= 0x10000;
        res.push(codePoint >>> 10 & 0x3FF | 0xD800);
        codePoint = 0xDC00 | codePoint & 0x3FF;
      }

      res.push(codePoint);
      i += bytesPerSequence;
    }

    return decodeCodePointsArray(res);
  } // Based on http://stackoverflow.com/a/22747272/680742, the browser with
  // the lowest limit is Chrome, with 0x10000 args.
  // We go 1 magnitude less, for safety


  var MAX_ARGUMENTS_LENGTH = 0x1000;

  function decodeCodePointsArray(codePoints) {
    var len = codePoints.length;

    if (len <= MAX_ARGUMENTS_LENGTH) {
      return String.fromCharCode.apply(String, codePoints); // avoid extra slice()
    } // Decode in chunks to avoid "call stack size exceeded".


    var res = '';
    var i = 0;

    while (i < len) {
      res += String.fromCharCode.apply(String, codePoints.slice(i, i += MAX_ARGUMENTS_LENGTH));
    }

    return res;
  }

  function asciiSlice(buf, start, end) {
    var ret = '';
    end = Math.min(buf.length, end);

    for (var i = start; i < end; ++i) {
      ret += String.fromCharCode(buf[i] & 0x7F);
    }

    return ret;
  }

  function latin1Slice(buf, start, end) {
    var ret = '';
    end = Math.min(buf.length, end);

    for (var i = start; i < end; ++i) {
      ret += String.fromCharCode(buf[i]);
    }

    return ret;
  }

  function hexSlice(buf, start, end) {
    var len = buf.length;
    if (!start || start < 0) start = 0;
    if (!end || end < 0 || end > len) end = len;
    var out = '';

    for (var i = start; i < end; ++i) {
      out += hexSliceLookupTable[buf[i]];
    }

    return out;
  }

  function utf16leSlice(buf, start, end) {
    var bytes = buf.slice(start, end);
    var res = ''; // If bytes.length is odd, the last 8 bits must be ignored (same as node.js)

    for (var i = 0; i < bytes.length - 1; i += 2) {
      res += String.fromCharCode(bytes[i] + bytes[i + 1] * 256);
    }

    return res;
  }

  Buffer.prototype.slice = function slice(start, end) {
    var len = this.length;
    start = ~~start;
    end = end === undefined ? len : ~~end;

    if (start < 0) {
      start += len;
      if (start < 0) start = 0;
    } else if (start > len) {
      start = len;
    }

    if (end < 0) {
      end += len;
      if (end < 0) end = 0;
    } else if (end > len) {
      end = len;
    }

    if (end < start) end = start;
    var newBuf = this.subarray(start, end); // Return an augmented `Uint8Array` instance

    Object.setPrototypeOf(newBuf, Buffer.prototype);
    return newBuf;
  };
  /*
   * Need to make sure that buffer isn't trying to write out of bounds.
   */


  function checkOffset(offset, ext, length) {
    if (offset % 1 !== 0 || offset < 0) throw new RangeError('offset is not uint');
    if (offset + ext > length) throw new RangeError('Trying to access beyond buffer length');
  }

  Buffer.prototype.readUintLE = Buffer.prototype.readUIntLE = function readUIntLE(offset, byteLength, noAssert) {
    offset = offset >>> 0;
    byteLength = byteLength >>> 0;
    if (!noAssert) checkOffset(offset, byteLength, this.length);
    var val = this[offset];
    var mul = 1;
    var i = 0;

    while (++i < byteLength && (mul *= 0x100)) {
      val += this[offset + i] * mul;
    }

    return val;
  };

  Buffer.prototype.readUintBE = Buffer.prototype.readUIntBE = function readUIntBE(offset, byteLength, noAssert) {
    offset = offset >>> 0;
    byteLength = byteLength >>> 0;

    if (!noAssert) {
      checkOffset(offset, byteLength, this.length);
    }

    var val = this[offset + --byteLength];
    var mul = 1;

    while (byteLength > 0 && (mul *= 0x100)) {
      val += this[offset + --byteLength] * mul;
    }

    return val;
  };

  Buffer.prototype.readUint8 = Buffer.prototype.readUInt8 = function readUInt8(offset, noAssert) {
    offset = offset >>> 0;
    if (!noAssert) checkOffset(offset, 1, this.length);
    return this[offset];
  };

  Buffer.prototype.readUint16LE = Buffer.prototype.readUInt16LE = function readUInt16LE(offset, noAssert) {
    offset = offset >>> 0;
    if (!noAssert) checkOffset(offset, 2, this.length);
    return this[offset] | this[offset + 1] << 8;
  };

  Buffer.prototype.readUint16BE = Buffer.prototype.readUInt16BE = function readUInt16BE(offset, noAssert) {
    offset = offset >>> 0;
    if (!noAssert) checkOffset(offset, 2, this.length);
    return this[offset] << 8 | this[offset + 1];
  };

  Buffer.prototype.readUint32LE = Buffer.prototype.readUInt32LE = function readUInt32LE(offset, noAssert) {
    offset = offset >>> 0;
    if (!noAssert) checkOffset(offset, 4, this.length);
    return (this[offset] | this[offset + 1] << 8 | this[offset + 2] << 16) + this[offset + 3] * 0x1000000;
  };

  Buffer.prototype.readUint32BE = Buffer.prototype.readUInt32BE = function readUInt32BE(offset, noAssert) {
    offset = offset >>> 0;
    if (!noAssert) checkOffset(offset, 4, this.length);
    return this[offset] * 0x1000000 + (this[offset + 1] << 16 | this[offset + 2] << 8 | this[offset + 3]);
  };

  Buffer.prototype.readIntLE = function readIntLE(offset, byteLength, noAssert) {
    offset = offset >>> 0;
    byteLength = byteLength >>> 0;
    if (!noAssert) checkOffset(offset, byteLength, this.length);
    var val = this[offset];
    var mul = 1;
    var i = 0;

    while (++i < byteLength && (mul *= 0x100)) {
      val += this[offset + i] * mul;
    }

    mul *= 0x80;
    if (val >= mul) val -= Math.pow(2, 8 * byteLength);
    return val;
  };

  Buffer.prototype.readIntBE = function readIntBE(offset, byteLength, noAssert) {
    offset = offset >>> 0;
    byteLength = byteLength >>> 0;
    if (!noAssert) checkOffset(offset, byteLength, this.length);
    var i = byteLength;
    var mul = 1;
    var val = this[offset + --i];

    while (i > 0 && (mul *= 0x100)) {
      val += this[offset + --i] * mul;
    }

    mul *= 0x80;
    if (val >= mul) val -= Math.pow(2, 8 * byteLength);
    return val;
  };

  Buffer.prototype.readInt8 = function readInt8(offset, noAssert) {
    offset = offset >>> 0;
    if (!noAssert) checkOffset(offset, 1, this.length);
    if (!(this[offset] & 0x80)) return this[offset];
    return (0xff - this[offset] + 1) * -1;
  };

  Buffer.prototype.readInt16LE = function readInt16LE(offset, noAssert) {
    offset = offset >>> 0;
    if (!noAssert) checkOffset(offset, 2, this.length);
    var val = this[offset] | this[offset + 1] << 8;
    return val & 0x8000 ? val | 0xFFFF0000 : val;
  };

  Buffer.prototype.readInt16BE = function readInt16BE(offset, noAssert) {
    offset = offset >>> 0;
    if (!noAssert) checkOffset(offset, 2, this.length);
    var val = this[offset + 1] | this[offset] << 8;
    return val & 0x8000 ? val | 0xFFFF0000 : val;
  };

  Buffer.prototype.readInt32LE = function readInt32LE(offset, noAssert) {
    offset = offset >>> 0;
    if (!noAssert) checkOffset(offset, 4, this.length);
    return this[offset] | this[offset + 1] << 8 | this[offset + 2] << 16 | this[offset + 3] << 24;
  };

  Buffer.prototype.readInt32BE = function readInt32BE(offset, noAssert) {
    offset = offset >>> 0;
    if (!noAssert) checkOffset(offset, 4, this.length);
    return this[offset] << 24 | this[offset + 1] << 16 | this[offset + 2] << 8 | this[offset + 3];
  };

  Buffer.prototype.readFloatLE = function readFloatLE(offset, noAssert) {
    offset = offset >>> 0;
    if (!noAssert) checkOffset(offset, 4, this.length);
    return ieee754.read(this, offset, true, 23, 4);
  };

  Buffer.prototype.readFloatBE = function readFloatBE(offset, noAssert) {
    offset = offset >>> 0;
    if (!noAssert) checkOffset(offset, 4, this.length);
    return ieee754.read(this, offset, false, 23, 4);
  };

  Buffer.prototype.readDoubleLE = function readDoubleLE(offset, noAssert) {
    offset = offset >>> 0;
    if (!noAssert) checkOffset(offset, 8, this.length);
    return ieee754.read(this, offset, true, 52, 8);
  };

  Buffer.prototype.readDoubleBE = function readDoubleBE(offset, noAssert) {
    offset = offset >>> 0;
    if (!noAssert) checkOffset(offset, 8, this.length);
    return ieee754.read(this, offset, false, 52, 8);
  };

  function checkInt(buf, value, offset, ext, max, min) {
    if (!Buffer.isBuffer(buf)) throw new TypeError('"buffer" argument must be a Buffer instance');
    if (value > max || value < min) throw new RangeError('"value" argument is out of bounds');
    if (offset + ext > buf.length) throw new RangeError('Index out of range');
  }

  Buffer.prototype.writeUintLE = Buffer.prototype.writeUIntLE = function writeUIntLE(value, offset, byteLength, noAssert) {
    value = +value;
    offset = offset >>> 0;
    byteLength = byteLength >>> 0;

    if (!noAssert) {
      var maxBytes = Math.pow(2, 8 * byteLength) - 1;
      checkInt(this, value, offset, byteLength, maxBytes, 0);
    }

    var mul = 1;
    var i = 0;
    this[offset] = value & 0xFF;

    while (++i < byteLength && (mul *= 0x100)) {
      this[offset + i] = value / mul & 0xFF;
    }

    return offset + byteLength;
  };

  Buffer.prototype.writeUintBE = Buffer.prototype.writeUIntBE = function writeUIntBE(value, offset, byteLength, noAssert) {
    value = +value;
    offset = offset >>> 0;
    byteLength = byteLength >>> 0;

    if (!noAssert) {
      var maxBytes = Math.pow(2, 8 * byteLength) - 1;
      checkInt(this, value, offset, byteLength, maxBytes, 0);
    }

    var i = byteLength - 1;
    var mul = 1;
    this[offset + i] = value & 0xFF;

    while (--i >= 0 && (mul *= 0x100)) {
      this[offset + i] = value / mul & 0xFF;
    }

    return offset + byteLength;
  };

  Buffer.prototype.writeUint8 = Buffer.prototype.writeUInt8 = function writeUInt8(value, offset, noAssert) {
    value = +value;
    offset = offset >>> 0;
    if (!noAssert) checkInt(this, value, offset, 1, 0xff, 0);
    this[offset] = value & 0xff;
    return offset + 1;
  };

  Buffer.prototype.writeUint16LE = Buffer.prototype.writeUInt16LE = function writeUInt16LE(value, offset, noAssert) {
    value = +value;
    offset = offset >>> 0;
    if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0);
    this[offset] = value & 0xff;
    this[offset + 1] = value >>> 8;
    return offset + 2;
  };

  Buffer.prototype.writeUint16BE = Buffer.prototype.writeUInt16BE = function writeUInt16BE(value, offset, noAssert) {
    value = +value;
    offset = offset >>> 0;
    if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0);
    this[offset] = value >>> 8;
    this[offset + 1] = value & 0xff;
    return offset + 2;
  };

  Buffer.prototype.writeUint32LE = Buffer.prototype.writeUInt32LE = function writeUInt32LE(value, offset, noAssert) {
    value = +value;
    offset = offset >>> 0;
    if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0);
    this[offset + 3] = value >>> 24;
    this[offset + 2] = value >>> 16;
    this[offset + 1] = value >>> 8;
    this[offset] = value & 0xff;
    return offset + 4;
  };

  Buffer.prototype.writeUint32BE = Buffer.prototype.writeUInt32BE = function writeUInt32BE(value, offset, noAssert) {
    value = +value;
    offset = offset >>> 0;
    if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0);
    this[offset] = value >>> 24;
    this[offset + 1] = value >>> 16;
    this[offset + 2] = value >>> 8;
    this[offset + 3] = value & 0xff;
    return offset + 4;
  };

  Buffer.prototype.writeIntLE = function writeIntLE(value, offset, byteLength, noAssert) {
    value = +value;
    offset = offset >>> 0;

    if (!noAssert) {
      var limit = Math.pow(2, 8 * byteLength - 1);
      checkInt(this, value, offset, byteLength, limit - 1, -limit);
    }

    var i = 0;
    var mul = 1;
    var sub = 0;
    this[offset] = value & 0xFF;

    while (++i < byteLength && (mul *= 0x100)) {
      if (value < 0 && sub === 0 && this[offset + i - 1] !== 0) {
        sub = 1;
      }

      this[offset + i] = (value / mul >> 0) - sub & 0xFF;
    }

    return offset + byteLength;
  };

  Buffer.prototype.writeIntBE = function writeIntBE(value, offset, byteLength, noAssert) {
    value = +value;
    offset = offset >>> 0;

    if (!noAssert) {
      var limit = Math.pow(2, 8 * byteLength - 1);
      checkInt(this, value, offset, byteLength, limit - 1, -limit);
    }

    var i = byteLength - 1;
    var mul = 1;
    var sub = 0;
    this[offset + i] = value & 0xFF;

    while (--i >= 0 && (mul *= 0x100)) {
      if (value < 0 && sub === 0 && this[offset + i + 1] !== 0) {
        sub = 1;
      }

      this[offset + i] = (value / mul >> 0) - sub & 0xFF;
    }

    return offset + byteLength;
  };

  Buffer.prototype.writeInt8 = function writeInt8(value, offset, noAssert) {
    value = +value;
    offset = offset >>> 0;
    if (!noAssert) checkInt(this, value, offset, 1, 0x7f, -0x80);
    if (value < 0) value = 0xff + value + 1;
    this[offset] = value & 0xff;
    return offset + 1;
  };

  Buffer.prototype.writeInt16LE = function writeInt16LE(value, offset, noAssert) {
    value = +value;
    offset = offset >>> 0;
    if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000);
    this[offset] = value & 0xff;
    this[offset + 1] = value >>> 8;
    return offset + 2;
  };

  Buffer.prototype.writeInt16BE = function writeInt16BE(value, offset, noAssert) {
    value = +value;
    offset = offset >>> 0;
    if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000);
    this[offset] = value >>> 8;
    this[offset + 1] = value & 0xff;
    return offset + 2;
  };

  Buffer.prototype.writeInt32LE = function writeInt32LE(value, offset, noAssert) {
    value = +value;
    offset = offset >>> 0;
    if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000);
    this[offset] = value & 0xff;
    this[offset + 1] = value >>> 8;
    this[offset + 2] = value >>> 16;
    this[offset + 3] = value >>> 24;
    return offset + 4;
  };

  Buffer.prototype.writeInt32BE = function writeInt32BE(value, offset, noAssert) {
    value = +value;
    offset = offset >>> 0;
    if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000);
    if (value < 0) value = 0xffffffff + value + 1;
    this[offset] = value >>> 24;
    this[offset + 1] = value >>> 16;
    this[offset + 2] = value >>> 8;
    this[offset + 3] = value & 0xff;
    return offset + 4;
  };

  function checkIEEE754(buf, value, offset, ext, max, min) {
    if (offset + ext > buf.length) throw new RangeError('Index out of range');
    if (offset < 0) throw new RangeError('Index out of range');
  }

  function writeFloat(buf, value, offset, littleEndian, noAssert) {
    value = +value;
    offset = offset >>> 0;

    if (!noAssert) {
      checkIEEE754(buf, value, offset, 4);
    }

    ieee754.write(buf, value, offset, littleEndian, 23, 4);
    return offset + 4;
  }

  Buffer.prototype.writeFloatLE = function writeFloatLE(value, offset, noAssert) {
    return writeFloat(this, value, offset, true, noAssert);
  };

  Buffer.prototype.writeFloatBE = function writeFloatBE(value, offset, noAssert) {
    return writeFloat(this, value, offset, false, noAssert);
  };

  function writeDouble(buf, value, offset, littleEndian, noAssert) {
    value = +value;
    offset = offset >>> 0;

    if (!noAssert) {
      checkIEEE754(buf, value, offset, 8);
    }

    ieee754.write(buf, value, offset, littleEndian, 52, 8);
    return offset + 8;
  }

  Buffer.prototype.writeDoubleLE = function writeDoubleLE(value, offset, noAssert) {
    return writeDouble(this, value, offset, true, noAssert);
  };

  Buffer.prototype.writeDoubleBE = function writeDoubleBE(value, offset, noAssert) {
    return writeDouble(this, value, offset, false, noAssert);
  }; // copy(targetBuffer, targetStart=0, sourceStart=0, sourceEnd=buffer.length)


  Buffer.prototype.copy = function copy(target, targetStart, start, end) {
    if (!Buffer.isBuffer(target)) throw new TypeError('argument should be a Buffer');
    if (!start) start = 0;
    if (!end && end !== 0) end = this.length;
    if (targetStart >= target.length) targetStart = target.length;
    if (!targetStart) targetStart = 0;
    if (end > 0 && end < start) end = start; // Copy 0 bytes; we're done

    if (end === start) return 0;
    if (target.length === 0 || this.length === 0) return 0; // Fatal error conditions

    if (targetStart < 0) {
      throw new RangeError('targetStart out of bounds');
    }

    if (start < 0 || start >= this.length) throw new RangeError('Index out of range');
    if (end < 0) throw new RangeError('sourceEnd out of bounds'); // Are we oob?

    if (end > this.length) end = this.length;

    if (target.length - targetStart < end - start) {
      end = target.length - targetStart + start;
    }

    var len = end - start;

    if (this === target && typeof Uint8Array.prototype.copyWithin === 'function') {
      // Use built-in when available, missing from IE11
      this.copyWithin(targetStart, start, end);
    } else {
      Uint8Array.prototype.set.call(target, this.subarray(start, end), targetStart);
    }

    return len;
  }; // Usage:
  //    buffer.fill(number[, offset[, end]])
  //    buffer.fill(buffer[, offset[, end]])
  //    buffer.fill(string[, offset[, end]][, encoding])


  Buffer.prototype.fill = function fill(val, start, end, encoding) {
    // Handle string cases:
    if (typeof val === 'string') {
      if (typeof start === 'string') {
        encoding = start;
        start = 0;
        end = this.length;
      } else if (typeof end === 'string') {
        encoding = end;
        end = this.length;
      }

      if (encoding !== undefined && typeof encoding !== 'string') {
        throw new TypeError('encoding must be a string');
      }

      if (typeof encoding === 'string' && !Buffer.isEncoding(encoding)) {
        throw new TypeError('Unknown encoding: ' + encoding);
      }

      if (val.length === 1) {
        var code = val.charCodeAt(0);

        if (encoding === 'utf8' && code < 128 || encoding === 'latin1') {
          // Fast path: If `val` fits into a single byte, use that numeric value.
          val = code;
        }
      }
    } else if (typeof val === 'number') {
      val = val & 255;
    } else if (typeof val === 'boolean') {
      val = Number(val);
    } // Invalid ranges are not set to a default, so can range check early.


    if (start < 0 || this.length < start || this.length < end) {
      throw new RangeError('Out of range index');
    }

    if (end <= start) {
      return this;
    }

    start = start >>> 0;
    end = end === undefined ? this.length : end >>> 0;
    if (!val) val = 0;
    var i;

    if (typeof val === 'number') {
      for (i = start; i < end; ++i) {
        this[i] = val;
      }
    } else {
      var bytes = Buffer.isBuffer(val) ? val : Buffer.from(val, encoding);
      var len = bytes.length;

      if (len === 0) {
        throw new TypeError('The value "' + val + '" is invalid for argument "value"');
      }

      for (i = 0; i < end - start; ++i) {
        this[i + start] = bytes[i % len];
      }
    }

    return this;
  }; // HELPER FUNCTIONS
  // ================


  var INVALID_BASE64_RE = /[^+/0-9A-Za-z-_]/g;

  function base64clean(str) {
    // Node takes equal signs as end of the Base64 encoding
    str = str.split('=')[0]; // Node strips out invalid characters like \n and \t from the string, base64-js does not

    str = str.trim().replace(INVALID_BASE64_RE, ''); // Node converts strings with length < 2 to ''

    if (str.length < 2) return ''; // Node allows for non-padded base64 strings (missing trailing ===), base64-js does not

    while (str.length % 4 !== 0) {
      str = str + '=';
    }

    return str;
  }

  function utf8ToBytes(string, units) {
    units = units || Infinity;
    var codePoint;
    var length = string.length;
    var leadSurrogate = null;
    var bytes = [];

    for (var i = 0; i < length; ++i) {
      codePoint = string.charCodeAt(i); // is surrogate component

      if (codePoint > 0xD7FF && codePoint < 0xE000) {
        // last char was a lead
        if (!leadSurrogate) {
          // no lead yet
          if (codePoint > 0xDBFF) {
            // unexpected trail
            if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD);
            continue;
          } else if (i + 1 === length) {
            // unpaired lead
            if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD);
            continue;
          } // valid lead


          leadSurrogate = codePoint;
          continue;
        } // 2 leads in a row


        if (codePoint < 0xDC00) {
          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD);
          leadSurrogate = codePoint;
          continue;
        } // valid surrogate pair


        codePoint = (leadSurrogate - 0xD800 << 10 | codePoint - 0xDC00) + 0x10000;
      } else if (leadSurrogate) {
        // valid bmp char, but last char was a lead
        if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD);
      }

      leadSurrogate = null; // encode utf8

      if (codePoint < 0x80) {
        if ((units -= 1) < 0) break;
        bytes.push(codePoint);
      } else if (codePoint < 0x800) {
        if ((units -= 2) < 0) break;
        bytes.push(codePoint >> 0x6 | 0xC0, codePoint & 0x3F | 0x80);
      } else if (codePoint < 0x10000) {
        if ((units -= 3) < 0) break;
        bytes.push(codePoint >> 0xC | 0xE0, codePoint >> 0x6 & 0x3F | 0x80, codePoint & 0x3F | 0x80);
      } else if (codePoint < 0x110000) {
        if ((units -= 4) < 0) break;
        bytes.push(codePoint >> 0x12 | 0xF0, codePoint >> 0xC & 0x3F | 0x80, codePoint >> 0x6 & 0x3F | 0x80, codePoint & 0x3F | 0x80);
      } else {
        throw new Error('Invalid code point');
      }
    }

    return bytes;
  }

  function asciiToBytes(str) {
    var byteArray = [];

    for (var i = 0; i < str.length; ++i) {
      // Node's code seems to be doing this and not & 0x7F..
      byteArray.push(str.charCodeAt(i) & 0xFF);
    }

    return byteArray;
  }

  function utf16leToBytes(str, units) {
    var c, hi, lo;
    var byteArray = [];

    for (var i = 0; i < str.length; ++i) {
      if ((units -= 2) < 0) break;
      c = str.charCodeAt(i);
      hi = c >> 8;
      lo = c % 256;
      byteArray.push(lo);
      byteArray.push(hi);
    }

    return byteArray;
  }

  function base64ToBytes(str) {
    return base64Js.toByteArray(base64clean(str));
  }

  function blitBuffer(src, dst, offset, length) {
    for (var i = 0; i < length; ++i) {
      if (i + offset >= dst.length || i >= src.length) break;
      dst[i + offset] = src[i];
    }

    return i;
  } // ArrayBuffer or Uint8Array objects from other contexts (i.e. iframes) do not pass
  // the `instanceof` check but they should be treated as of that type.
  // See: https://github.com/feross/buffer/issues/166


  function isInstance(obj, type) {
    return obj instanceof type || obj != null && obj.constructor != null && obj.constructor.name != null && obj.constructor.name === type.name;
  }

  function numberIsNaN(obj) {
    // For IE11 support
    return obj !== obj; // eslint-disable-line no-self-compare
  } // Create lookup table for `toString('hex')`
  // See: https://github.com/feross/buffer/issues/219


  var hexSliceLookupTable = function () {
    var alphabet = '0123456789abcdef';
    var table = new Array(256);

    for (var i = 0; i < 16; ++i) {
      var i16 = i * 16;

      for (var j = 0; j < 16; ++j) {
        table[i16 + j] = alphabet[i] + alphabet[j];
      }
    }

    return table;
  }();
});
var buffer_1 = buffer$1.Buffer;
buffer$1.SlowBuffer;
buffer$1.INSPECT_MAX_BYTES;
buffer$1.kMaxLength;

/*! *****************************************************************************
Copyright (c) Microsoft Corporation.

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
PERFORMANCE OF THIS SOFTWARE.
***************************************************************************** */

/* global Reflect, Promise */
var _extendStatics = function extendStatics(d, b) {
  _extendStatics = Object.setPrototypeOf || {
    __proto__: []
  } instanceof Array && function (d, b) {
    d.__proto__ = b;
  } || function (d, b) {
    for (var p in b) {
      if (b.hasOwnProperty(p)) d[p] = b[p];
    }
  };

  return _extendStatics(d, b);
};

function __extends$1(d, b) {
  _extendStatics(d, b);

  function __() {
    this.constructor = d;
  }

  d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
}

/** @public */
var BSONError = /** @class */ (function (_super) {
    __extends$1(BSONError, _super);
    function BSONError(message) {
        var _this = _super.call(this, message) || this;
        Object.setPrototypeOf(_this, BSONError.prototype);
        return _this;
    }
    Object.defineProperty(BSONError.prototype, "name", {
        get: function () {
            return 'BSONError';
        },
        enumerable: false,
        configurable: true
    });
    return BSONError;
}(Error));
/** @public */
var BSONTypeError = /** @class */ (function (_super) {
    __extends$1(BSONTypeError, _super);
    function BSONTypeError(message) {
        var _this = _super.call(this, message) || this;
        Object.setPrototypeOf(_this, BSONTypeError.prototype);
        return _this;
    }
    Object.defineProperty(BSONTypeError.prototype, "name", {
        get: function () {
            return 'BSONTypeError';
        },
        enumerable: false,
        configurable: true
    });
    return BSONTypeError;
}(TypeError));

function checkForMath(potentialGlobal) {
    // eslint-disable-next-line eqeqeq
    return potentialGlobal && potentialGlobal.Math == Math && potentialGlobal;
}
// https://github.com/zloirock/core-js/issues/86#issuecomment-115759028
function getGlobal() {
    // eslint-disable-next-line no-undef
    return (checkForMath(typeof globalThis === 'object' && globalThis) ||
        checkForMath(typeof window === 'object' && window) ||
        checkForMath(typeof self === 'object' && self) ||
        checkForMath(typeof global === 'object' && global) ||
        Function('return this')());
}
function isReactNative() {
    var g = getGlobal();
    return typeof g.navigator === 'object' && g.navigator.product === 'ReactNative';
}
var insecureRandomBytes = function insecureRandomBytes(size) {
    var insecureWarning = isReactNative()
        ? 'BSON: For React Native please polyfill crypto.getRandomValues, e.g. using: https://www.npmjs.com/package/react-native-get-random-values.'
        : 'BSON: No cryptographic implementation for random bytes present, falling back to a less secure implementation.';
    console.warn(insecureWarning);
    var result = buffer_1.alloc(size);
    for (var i = 0; i < size; ++i)
        result[i] = Math.floor(Math.random() * 256);
    return result;
};
var detectRandomBytes = function () {
    if (typeof window !== 'undefined') {
        // browser crypto implementation(s)
        var target_1 = window.crypto || window.msCrypto; // allow for IE11
        if (target_1 && target_1.getRandomValues) {
            return function (size) { return target_1.getRandomValues(buffer_1.alloc(size)); };
        }
    }
    if (typeof global !== 'undefined' && global.crypto && global.crypto.getRandomValues) {
        // allow for RN packages such as https://www.npmjs.com/package/react-native-get-random-values to populate global
        return function (size) { return global.crypto.getRandomValues(buffer_1.alloc(size)); };
    }
    var requiredRandomBytes;
    try {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        requiredRandomBytes = require('crypto').randomBytes;
    }
    catch (e) {
        // keep the fallback
    }
    // NOTE: in transpiled cases the above require might return null/undefined
    return requiredRandomBytes || insecureRandomBytes;
};
var randomBytes = detectRandomBytes();
function isAnyArrayBuffer(value) {
    return ['[object ArrayBuffer]', '[object SharedArrayBuffer]'].includes(Object.prototype.toString.call(value));
}
function isUint8Array(value) {
    return Object.prototype.toString.call(value) === '[object Uint8Array]';
}
function isRegExp(d) {
    return Object.prototype.toString.call(d) === '[object RegExp]';
}
// To ensure that 0.4 of node works correctly
function isDate(d) {
    return isObjectLike(d) && Object.prototype.toString.call(d) === '[object Date]';
}
/**
 * @internal
 * this is to solve the `'someKey' in x` problem where x is unknown.
 * https://github.com/typescript-eslint/typescript-eslint/issues/1071#issuecomment-541955753
 */
function isObjectLike(candidate) {
    return typeof candidate === 'object' && candidate !== null;
}
function deprecate(fn, message) {
    var warned = false;
    function deprecated() {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        if (!warned) {
            console.warn(message);
            warned = true;
        }
        return fn.apply(this, args);
    }
    return deprecated;
}

/**
 * Makes sure that, if a Uint8Array is passed in, it is wrapped in a Buffer.
 *
 * @param potentialBuffer - The potential buffer
 * @returns Buffer the input if potentialBuffer is a buffer, or a buffer that
 * wraps a passed in Uint8Array
 * @throws BSONTypeError If anything other than a Buffer or Uint8Array is passed in
 */
function ensureBuffer(potentialBuffer) {
    if (ArrayBuffer.isView(potentialBuffer)) {
        return buffer_1.from(potentialBuffer.buffer, potentialBuffer.byteOffset, potentialBuffer.byteLength);
    }
    if (isAnyArrayBuffer(potentialBuffer)) {
        return buffer_1.from(potentialBuffer);
    }
    throw new BSONTypeError('Must use either Buffer or TypedArray');
}

// Validation regex for v4 uuid (validates with or without dashes)
var VALIDATION_REGEX = /^(?:[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}|[0-9a-f]{12}4[0-9a-f]{3}[89ab][0-9a-f]{15})$/i;
var uuidValidateString = function (str) {
    return typeof str === 'string' && VALIDATION_REGEX.test(str);
};
var uuidHexStringToBuffer = function (hexString) {
    if (!uuidValidateString(hexString)) {
        throw new BSONTypeError('UUID string representations must be a 32 or 36 character hex string (dashes excluded/included). Format: "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" or "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx".');
    }
    var sanitizedHexString = hexString.replace(/-/g, '');
    return buffer_1.from(sanitizedHexString, 'hex');
};
var bufferToUuidHexString = function (buffer, includeDashes) {
    if (includeDashes === void 0) { includeDashes = true; }
    return includeDashes
        ? buffer.toString('hex', 0, 4) +
            '-' +
            buffer.toString('hex', 4, 6) +
            '-' +
            buffer.toString('hex', 6, 8) +
            '-' +
            buffer.toString('hex', 8, 10) +
            '-' +
            buffer.toString('hex', 10, 16)
        : buffer.toString('hex');
};

var BYTE_LENGTH = 16;
var kId$1 = Symbol('id');
/**
 * A class representation of the BSON UUID type.
 * @public
 */
var UUID = /** @class */ (function () {
    /**
     * Create an UUID type
     *
     * @param input - Can be a 32 or 36 character hex string (dashes excluded/included) or a 16 byte binary Buffer.
     */
    function UUID(input) {
        if (typeof input === 'undefined') {
            // The most common use case (blank id, new UUID() instance)
            this.id = UUID.generate();
        }
        else if (input instanceof UUID) {
            this[kId$1] = buffer_1.from(input.id);
            this.__id = input.__id;
        }
        else if (ArrayBuffer.isView(input) && input.byteLength === BYTE_LENGTH) {
            this.id = ensureBuffer(input);
        }
        else if (typeof input === 'string') {
            this.id = uuidHexStringToBuffer(input);
        }
        else {
            throw new BSONTypeError('Argument passed in UUID constructor must be a UUID, a 16 byte Buffer or a 32/36 character hex string (dashes excluded/included, format: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx).');
        }
    }
    Object.defineProperty(UUID.prototype, "id", {
        /**
         * The UUID bytes
         * @readonly
         */
        get: function () {
            return this[kId$1];
        },
        set: function (value) {
            this[kId$1] = value;
            if (UUID.cacheHexString) {
                this.__id = bufferToUuidHexString(value);
            }
        },
        enumerable: false,
        configurable: true
    });
    /**
     * Generate a 16 byte uuid v4 buffer used in UUIDs
     */
    /**
     * Returns the UUID id as a 32 or 36 character hex string representation, excluding/including dashes (defaults to 36 character dash separated)
     * @param includeDashes - should the string exclude dash-separators.
     * */
    UUID.prototype.toHexString = function (includeDashes) {
        if (includeDashes === void 0) { includeDashes = true; }
        if (UUID.cacheHexString && this.__id) {
            return this.__id;
        }
        var uuidHexString = bufferToUuidHexString(this.id, includeDashes);
        if (UUID.cacheHexString) {
            this.__id = uuidHexString;
        }
        return uuidHexString;
    };
    /**
     * Converts the id into a 36 character (dashes included) hex string, unless a encoding is specified.
     */
    UUID.prototype.toString = function (encoding) {
        return encoding ? this.id.toString(encoding) : this.toHexString();
    };
    /**
     * Converts the id into its JSON string representation.
     * A 36 character (dashes included) hex string in the format: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
     */
    UUID.prototype.toJSON = function () {
        return this.toHexString();
    };
    /**
     * Compares the equality of this UUID with `otherID`.
     *
     * @param otherId - UUID instance to compare against.
     */
    UUID.prototype.equals = function (otherId) {
        if (!otherId) {
            return false;
        }
        if (otherId instanceof UUID) {
            return otherId.id.equals(this.id);
        }
        try {
            return new UUID(otherId).id.equals(this.id);
        }
        catch (_a) {
            return false;
        }
    };
    /**
     * Creates a Binary instance from the current UUID.
     */
    UUID.prototype.toBinary = function () {
        return new Binary(this.id, Binary.SUBTYPE_UUID);
    };
    /**
     * Generates a populated buffer containing a v4 uuid
     */
    UUID.generate = function () {
        var bytes = randomBytes(BYTE_LENGTH);
        // Per 4.4, set bits for version and `clock_seq_hi_and_reserved`
        // Kindly borrowed from https://github.com/uuidjs/uuid/blob/master/src/v4.js
        bytes[6] = (bytes[6] & 0x0f) | 0x40;
        bytes[8] = (bytes[8] & 0x3f) | 0x80;
        return buffer_1.from(bytes);
    };
    /**
     * Checks if a value is a valid bson UUID
     * @param input - UUID, string or Buffer to validate.
     */
    UUID.isValid = function (input) {
        if (!input) {
            return false;
        }
        if (input instanceof UUID) {
            return true;
        }
        if (typeof input === 'string') {
            return uuidValidateString(input);
        }
        if (isUint8Array(input)) {
            // check for length & uuid version (https://tools.ietf.org/html/rfc4122#section-4.1.3)
            if (input.length !== BYTE_LENGTH) {
                return false;
            }
            try {
                // get this byte as hex:             xxxxxxxx-xxxx-XXxx-xxxx-xxxxxxxxxxxx
                // check first part as uuid version: xxxxxxxx-xxxx-Xxxx-xxxx-xxxxxxxxxxxx
                return parseInt(input[6].toString(16)[0], 10) === Binary.SUBTYPE_UUID;
            }
            catch (_a) {
                return false;
            }
        }
        return false;
    };
    /**
     * Creates an UUID from a hex string representation of an UUID.
     * @param hexString - 32 or 36 character hex string (dashes excluded/included).
     */
    UUID.createFromHexString = function (hexString) {
        var buffer = uuidHexStringToBuffer(hexString);
        return new UUID(buffer);
    };
    /**
     * Converts to a string representation of this Id.
     *
     * @returns return the 36 character hex string representation.
     * @internal
     */
    UUID.prototype[Symbol.for('nodejs.util.inspect.custom')] = function () {
        return this.inspect();
    };
    UUID.prototype.inspect = function () {
        return "new UUID(\"" + this.toHexString() + "\")";
    };
    return UUID;
}());
Object.defineProperty(UUID.prototype, '_bsontype', { value: 'UUID' });

/**
 * A class representation of the BSON Binary type.
 * @public
 * @category BSONType
 */
var Binary = /** @class */ (function () {
    /**
     * @param buffer - a buffer object containing the binary data.
     * @param subType - the option binary type.
     */
    function Binary(buffer, subType) {
        if (!(this instanceof Binary))
            return new Binary(buffer, subType);
        if (!(buffer == null) &&
            !(typeof buffer === 'string') &&
            !ArrayBuffer.isView(buffer) &&
            !(buffer instanceof ArrayBuffer) &&
            !Array.isArray(buffer)) {
            throw new BSONTypeError('Binary can only be constructed from string, Buffer, TypedArray, or Array<number>');
        }
        this.sub_type = subType !== null && subType !== void 0 ? subType : Binary.BSON_BINARY_SUBTYPE_DEFAULT;
        if (buffer == null) {
            // create an empty binary buffer
            this.buffer = buffer_1.alloc(Binary.BUFFER_SIZE);
            this.position = 0;
        }
        else {
            if (typeof buffer === 'string') {
                // string
                this.buffer = buffer_1.from(buffer, 'binary');
            }
            else if (Array.isArray(buffer)) {
                // number[]
                this.buffer = buffer_1.from(buffer);
            }
            else {
                // Buffer | TypedArray | ArrayBuffer
                this.buffer = ensureBuffer(buffer);
            }
            this.position = this.buffer.byteLength;
        }
    }
    /**
     * Updates this binary with byte_value.
     *
     * @param byteValue - a single byte we wish to write.
     */
    Binary.prototype.put = function (byteValue) {
        // If it's a string and a has more than one character throw an error
        if (typeof byteValue === 'string' && byteValue.length !== 1) {
            throw new BSONTypeError('only accepts single character String');
        }
        else if (typeof byteValue !== 'number' && byteValue.length !== 1)
            throw new BSONTypeError('only accepts single character Uint8Array or Array');
        // Decode the byte value once
        var decodedByte;
        if (typeof byteValue === 'string') {
            decodedByte = byteValue.charCodeAt(0);
        }
        else if (typeof byteValue === 'number') {
            decodedByte = byteValue;
        }
        else {
            decodedByte = byteValue[0];
        }
        if (decodedByte < 0 || decodedByte > 255) {
            throw new BSONTypeError('only accepts number in a valid unsigned byte range 0-255');
        }
        if (this.buffer.length > this.position) {
            this.buffer[this.position++] = decodedByte;
        }
        else {
            var buffer = buffer_1.alloc(Binary.BUFFER_SIZE + this.buffer.length);
            // Combine the two buffers together
            this.buffer.copy(buffer, 0, 0, this.buffer.length);
            this.buffer = buffer;
            this.buffer[this.position++] = decodedByte;
        }
    };
    /**
     * Writes a buffer or string to the binary.
     *
     * @param sequence - a string or buffer to be written to the Binary BSON object.
     * @param offset - specify the binary of where to write the content.
     */
    Binary.prototype.write = function (sequence, offset) {
        offset = typeof offset === 'number' ? offset : this.position;
        // If the buffer is to small let's extend the buffer
        if (this.buffer.length < offset + sequence.length) {
            var buffer = buffer_1.alloc(this.buffer.length + sequence.length);
            this.buffer.copy(buffer, 0, 0, this.buffer.length);
            // Assign the new buffer
            this.buffer = buffer;
        }
        if (ArrayBuffer.isView(sequence)) {
            this.buffer.set(ensureBuffer(sequence), offset);
            this.position =
                offset + sequence.byteLength > this.position ? offset + sequence.length : this.position;
        }
        else if (typeof sequence === 'string') {
            this.buffer.write(sequence, offset, sequence.length, 'binary');
            this.position =
                offset + sequence.length > this.position ? offset + sequence.length : this.position;
        }
    };
    /**
     * Reads **length** bytes starting at **position**.
     *
     * @param position - read from the given position in the Binary.
     * @param length - the number of bytes to read.
     */
    Binary.prototype.read = function (position, length) {
        length = length && length > 0 ? length : this.position;
        // Let's return the data based on the type we have
        return this.buffer.slice(position, position + length);
    };
    /**
     * Returns the value of this binary as a string.
     * @param asRaw - Will skip converting to a string
     * @remarks
     * This is handy when calling this function conditionally for some key value pairs and not others
     */
    Binary.prototype.value = function (asRaw) {
        asRaw = !!asRaw;
        // Optimize to serialize for the situation where the data == size of buffer
        if (asRaw && this.buffer.length === this.position) {
            return this.buffer;
        }
        // If it's a node.js buffer object
        if (asRaw) {
            return this.buffer.slice(0, this.position);
        }
        return this.buffer.toString('binary', 0, this.position);
    };
    /** the length of the binary sequence */
    Binary.prototype.length = function () {
        return this.position;
    };
    Binary.prototype.toJSON = function () {
        return this.buffer.toString('base64');
    };
    Binary.prototype.toString = function (format) {
        return this.buffer.toString(format);
    };
    /** @internal */
    Binary.prototype.toExtendedJSON = function (options) {
        options = options || {};
        var base64String = this.buffer.toString('base64');
        var subType = Number(this.sub_type).toString(16);
        if (options.legacy) {
            return {
                $binary: base64String,
                $type: subType.length === 1 ? '0' + subType : subType
            };
        }
        return {
            $binary: {
                base64: base64String,
                subType: subType.length === 1 ? '0' + subType : subType
            }
        };
    };
    Binary.prototype.toUUID = function () {
        if (this.sub_type === Binary.SUBTYPE_UUID) {
            return new UUID(this.buffer.slice(0, this.position));
        }
        throw new BSONError("Binary sub_type \"" + this.sub_type + "\" is not supported for converting to UUID. Only \"" + Binary.SUBTYPE_UUID + "\" is currently supported.");
    };
    /** @internal */
    Binary.fromExtendedJSON = function (doc, options) {
        options = options || {};
        var data;
        var type;
        if ('$binary' in doc) {
            if (options.legacy && typeof doc.$binary === 'string' && '$type' in doc) {
                type = doc.$type ? parseInt(doc.$type, 16) : 0;
                data = buffer_1.from(doc.$binary, 'base64');
            }
            else {
                if (typeof doc.$binary !== 'string') {
                    type = doc.$binary.subType ? parseInt(doc.$binary.subType, 16) : 0;
                    data = buffer_1.from(doc.$binary.base64, 'base64');
                }
            }
        }
        else if ('$uuid' in doc) {
            type = 4;
            data = uuidHexStringToBuffer(doc.$uuid);
        }
        if (!data) {
            throw new BSONTypeError("Unexpected Binary Extended JSON format " + JSON.stringify(doc));
        }
        return new Binary(data, type);
    };
    /** @internal */
    Binary.prototype[Symbol.for('nodejs.util.inspect.custom')] = function () {
        return this.inspect();
    };
    Binary.prototype.inspect = function () {
        var asBuffer = this.value(true);
        return "new Binary(Buffer.from(\"" + asBuffer.toString('hex') + "\", \"hex\"), " + this.sub_type + ")";
    };
    /**
     * Binary default subtype
     * @internal
     */
    Binary.BSON_BINARY_SUBTYPE_DEFAULT = 0;
    /** Initial buffer default size */
    Binary.BUFFER_SIZE = 256;
    /** Default BSON type */
    Binary.SUBTYPE_DEFAULT = 0;
    /** Function BSON type */
    Binary.SUBTYPE_FUNCTION = 1;
    /** Byte Array BSON type */
    Binary.SUBTYPE_BYTE_ARRAY = 2;
    /** Deprecated UUID BSON type @deprecated Please use SUBTYPE_UUID */
    Binary.SUBTYPE_UUID_OLD = 3;
    /** UUID BSON type */
    Binary.SUBTYPE_UUID = 4;
    /** MD5 BSON type */
    Binary.SUBTYPE_MD5 = 5;
    /** Encrypted BSON type */
    Binary.SUBTYPE_ENCRYPTED = 6;
    /** Column BSON type */
    Binary.SUBTYPE_COLUMN = 7;
    /** User BSON type */
    Binary.SUBTYPE_USER_DEFINED = 128;
    return Binary;
}());
Object.defineProperty(Binary.prototype, '_bsontype', { value: 'Binary' });

/**
 * A class representation of the BSON Code type.
 * @public
 * @category BSONType
 */
var Code = /** @class */ (function () {
    /**
     * @param code - a string or function.
     * @param scope - an optional scope for the function.
     */
    function Code(code, scope) {
        if (!(this instanceof Code))
            return new Code(code, scope);
        this.code = code;
        this.scope = scope;
    }
    Code.prototype.toJSON = function () {
        return { code: this.code, scope: this.scope };
    };
    /** @internal */
    Code.prototype.toExtendedJSON = function () {
        if (this.scope) {
            return { $code: this.code, $scope: this.scope };
        }
        return { $code: this.code };
    };
    /** @internal */
    Code.fromExtendedJSON = function (doc) {
        return new Code(doc.$code, doc.$scope);
    };
    /** @internal */
    Code.prototype[Symbol.for('nodejs.util.inspect.custom')] = function () {
        return this.inspect();
    };
    Code.prototype.inspect = function () {
        var codeJson = this.toJSON();
        return "new Code(\"" + codeJson.code + "\"" + (codeJson.scope ? ", " + JSON.stringify(codeJson.scope) : '') + ")";
    };
    return Code;
}());
Object.defineProperty(Code.prototype, '_bsontype', { value: 'Code' });

/** @internal */
function isDBRefLike(value) {
    return (isObjectLike(value) &&
        value.$id != null &&
        typeof value.$ref === 'string' &&
        (value.$db == null || typeof value.$db === 'string'));
}
/**
 * A class representation of the BSON DBRef type.
 * @public
 * @category BSONType
 */
var DBRef = /** @class */ (function () {
    /**
     * @param collection - the collection name.
     * @param oid - the reference ObjectId.
     * @param db - optional db name, if omitted the reference is local to the current db.
     */
    function DBRef(collection, oid, db, fields) {
        if (!(this instanceof DBRef))
            return new DBRef(collection, oid, db, fields);
        // check if namespace has been provided
        var parts = collection.split('.');
        if (parts.length === 2) {
            db = parts.shift();
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            collection = parts.shift();
        }
        this.collection = collection;
        this.oid = oid;
        this.db = db;
        this.fields = fields || {};
    }
    Object.defineProperty(DBRef.prototype, "namespace", {
        // Property provided for compatibility with the 1.x parser
        // the 1.x parser used a "namespace" property, while 4.x uses "collection"
        /** @internal */
        get: function () {
            return this.collection;
        },
        set: function (value) {
            this.collection = value;
        },
        enumerable: false,
        configurable: true
    });
    DBRef.prototype.toJSON = function () {
        var o = Object.assign({
            $ref: this.collection,
            $id: this.oid
        }, this.fields);
        if (this.db != null)
            o.$db = this.db;
        return o;
    };
    /** @internal */
    DBRef.prototype.toExtendedJSON = function (options) {
        options = options || {};
        var o = {
            $ref: this.collection,
            $id: this.oid
        };
        if (options.legacy) {
            return o;
        }
        if (this.db)
            o.$db = this.db;
        o = Object.assign(o, this.fields);
        return o;
    };
    /** @internal */
    DBRef.fromExtendedJSON = function (doc) {
        var copy = Object.assign({}, doc);
        delete copy.$ref;
        delete copy.$id;
        delete copy.$db;
        return new DBRef(doc.$ref, doc.$id, doc.$db, copy);
    };
    /** @internal */
    DBRef.prototype[Symbol.for('nodejs.util.inspect.custom')] = function () {
        return this.inspect();
    };
    DBRef.prototype.inspect = function () {
        // NOTE: if OID is an ObjectId class it will just print the oid string.
        var oid = this.oid === undefined || this.oid.toString === undefined ? this.oid : this.oid.toString();
        return "new DBRef(\"" + this.namespace + "\", new ObjectId(\"" + oid + "\")" + (this.db ? ", \"" + this.db + "\"" : '') + ")";
    };
    return DBRef;
}());
Object.defineProperty(DBRef.prototype, '_bsontype', { value: 'DBRef' });

/**
 * wasm optimizations, to do native i64 multiplication and divide
 */
var wasm = undefined;
try {
    wasm = new WebAssembly.Instance(new WebAssembly.Module(
    // prettier-ignore
    new Uint8Array([0, 97, 115, 109, 1, 0, 0, 0, 1, 13, 2, 96, 0, 1, 127, 96, 4, 127, 127, 127, 127, 1, 127, 3, 7, 6, 0, 1, 1, 1, 1, 1, 6, 6, 1, 127, 1, 65, 0, 11, 7, 50, 6, 3, 109, 117, 108, 0, 1, 5, 100, 105, 118, 95, 115, 0, 2, 5, 100, 105, 118, 95, 117, 0, 3, 5, 114, 101, 109, 95, 115, 0, 4, 5, 114, 101, 109, 95, 117, 0, 5, 8, 103, 101, 116, 95, 104, 105, 103, 104, 0, 0, 10, 191, 1, 6, 4, 0, 35, 0, 11, 36, 1, 1, 126, 32, 0, 173, 32, 1, 173, 66, 32, 134, 132, 32, 2, 173, 32, 3, 173, 66, 32, 134, 132, 126, 34, 4, 66, 32, 135, 167, 36, 0, 32, 4, 167, 11, 36, 1, 1, 126, 32, 0, 173, 32, 1, 173, 66, 32, 134, 132, 32, 2, 173, 32, 3, 173, 66, 32, 134, 132, 127, 34, 4, 66, 32, 135, 167, 36, 0, 32, 4, 167, 11, 36, 1, 1, 126, 32, 0, 173, 32, 1, 173, 66, 32, 134, 132, 32, 2, 173, 32, 3, 173, 66, 32, 134, 132, 128, 34, 4, 66, 32, 135, 167, 36, 0, 32, 4, 167, 11, 36, 1, 1, 126, 32, 0, 173, 32, 1, 173, 66, 32, 134, 132, 32, 2, 173, 32, 3, 173, 66, 32, 134, 132, 129, 34, 4, 66, 32, 135, 167, 36, 0, 32, 4, 167, 11, 36, 1, 1, 126, 32, 0, 173, 32, 1, 173, 66, 32, 134, 132, 32, 2, 173, 32, 3, 173, 66, 32, 134, 132, 130, 34, 4, 66, 32, 135, 167, 36, 0, 32, 4, 167, 11])), {}).exports;
}
catch (_a) {
    // no wasm support
}
var TWO_PWR_16_DBL = 1 << 16;
var TWO_PWR_24_DBL = 1 << 24;
var TWO_PWR_32_DBL = TWO_PWR_16_DBL * TWO_PWR_16_DBL;
var TWO_PWR_64_DBL = TWO_PWR_32_DBL * TWO_PWR_32_DBL;
var TWO_PWR_63_DBL = TWO_PWR_64_DBL / 2;
/** A cache of the Long representations of small integer values. */
var INT_CACHE = {};
/** A cache of the Long representations of small unsigned integer values. */
var UINT_CACHE = {};
/**
 * A class representing a 64-bit integer
 * @public
 * @category BSONType
 * @remarks
 * The internal representation of a long is the two given signed, 32-bit values.
 * We use 32-bit pieces because these are the size of integers on which
 * Javascript performs bit-operations.  For operations like addition and
 * multiplication, we split each number into 16 bit pieces, which can easily be
 * multiplied within Javascript's floating-point representation without overflow
 * or change in sign.
 * In the algorithms below, we frequently reduce the negative case to the
 * positive case by negating the input(s) and then post-processing the result.
 * Note that we must ALWAYS check specially whether those values are MIN_VALUE
 * (-2^63) because -MIN_VALUE == MIN_VALUE (since 2^63 cannot be represented as
 * a positive number, it overflows back into a negative).  Not handling this
 * case would often result in infinite recursion.
 * Common constant values ZERO, ONE, NEG_ONE, etc. are found as static properties on this class.
 */
var Long = /** @class */ (function () {
    /**
     * Constructs a 64 bit two's-complement integer, given its low and high 32 bit values as *signed* integers.
     *  See the from* functions below for more convenient ways of constructing Longs.
     *
     * Acceptable signatures are:
     * - Long(low, high, unsigned?)
     * - Long(bigint, unsigned?)
     * - Long(string, unsigned?)
     *
     * @param low - The low (signed) 32 bits of the long
     * @param high - The high (signed) 32 bits of the long
     * @param unsigned - Whether unsigned or not, defaults to signed
     */
    function Long(low, high, unsigned) {
        if (low === void 0) { low = 0; }
        if (!(this instanceof Long))
            return new Long(low, high, unsigned);
        if (typeof low === 'bigint') {
            Object.assign(this, Long.fromBigInt(low, !!high));
        }
        else if (typeof low === 'string') {
            Object.assign(this, Long.fromString(low, !!high));
        }
        else {
            this.low = low | 0;
            this.high = high | 0;
            this.unsigned = !!unsigned;
        }
        Object.defineProperty(this, '__isLong__', {
            value: true,
            configurable: false,
            writable: false,
            enumerable: false
        });
    }
    /**
     * Returns a Long representing the 64 bit integer that comes by concatenating the given low and high bits.
     * Each is assumed to use 32 bits.
     * @param lowBits - The low 32 bits
     * @param highBits - The high 32 bits
     * @param unsigned - Whether unsigned or not, defaults to signed
     * @returns The corresponding Long value
     */
    Long.fromBits = function (lowBits, highBits, unsigned) {
        return new Long(lowBits, highBits, unsigned);
    };
    /**
     * Returns a Long representing the given 32 bit integer value.
     * @param value - The 32 bit integer in question
     * @param unsigned - Whether unsigned or not, defaults to signed
     * @returns The corresponding Long value
     */
    Long.fromInt = function (value, unsigned) {
        var obj, cachedObj, cache;
        if (unsigned) {
            value >>>= 0;
            if ((cache = 0 <= value && value < 256)) {
                cachedObj = UINT_CACHE[value];
                if (cachedObj)
                    return cachedObj;
            }
            obj = Long.fromBits(value, (value | 0) < 0 ? -1 : 0, true);
            if (cache)
                UINT_CACHE[value] = obj;
            return obj;
        }
        else {
            value |= 0;
            if ((cache = -128 <= value && value < 128)) {
                cachedObj = INT_CACHE[value];
                if (cachedObj)
                    return cachedObj;
            }
            obj = Long.fromBits(value, value < 0 ? -1 : 0, false);
            if (cache)
                INT_CACHE[value] = obj;
            return obj;
        }
    };
    /**
     * Returns a Long representing the given value, provided that it is a finite number. Otherwise, zero is returned.
     * @param value - The number in question
     * @param unsigned - Whether unsigned or not, defaults to signed
     * @returns The corresponding Long value
     */
    Long.fromNumber = function (value, unsigned) {
        if (isNaN(value))
            return unsigned ? Long.UZERO : Long.ZERO;
        if (unsigned) {
            if (value < 0)
                return Long.UZERO;
            if (value >= TWO_PWR_64_DBL)
                return Long.MAX_UNSIGNED_VALUE;
        }
        else {
            if (value <= -TWO_PWR_63_DBL)
                return Long.MIN_VALUE;
            if (value + 1 >= TWO_PWR_63_DBL)
                return Long.MAX_VALUE;
        }
        if (value < 0)
            return Long.fromNumber(-value, unsigned).neg();
        return Long.fromBits(value % TWO_PWR_32_DBL | 0, (value / TWO_PWR_32_DBL) | 0, unsigned);
    };
    /**
     * Returns a Long representing the given value, provided that it is a finite number. Otherwise, zero is returned.
     * @param value - The number in question
     * @param unsigned - Whether unsigned or not, defaults to signed
     * @returns The corresponding Long value
     */
    Long.fromBigInt = function (value, unsigned) {
        return Long.fromString(value.toString(), unsigned);
    };
    /**
     * Returns a Long representation of the given string, written using the specified radix.
     * @param str - The textual representation of the Long
     * @param unsigned - Whether unsigned or not, defaults to signed
     * @param radix - The radix in which the text is written (2-36), defaults to 10
     * @returns The corresponding Long value
     */
    Long.fromString = function (str, unsigned, radix) {
        if (str.length === 0)
            throw Error('empty string');
        if (str === 'NaN' || str === 'Infinity' || str === '+Infinity' || str === '-Infinity')
            return Long.ZERO;
        if (typeof unsigned === 'number') {
            // For goog.math.long compatibility
            (radix = unsigned), (unsigned = false);
        }
        else {
            unsigned = !!unsigned;
        }
        radix = radix || 10;
        if (radix < 2 || 36 < radix)
            throw RangeError('radix');
        var p;
        if ((p = str.indexOf('-')) > 0)
            throw Error('interior hyphen');
        else if (p === 0) {
            return Long.fromString(str.substring(1), unsigned, radix).neg();
        }
        // Do several (8) digits each time through the loop, so as to
        // minimize the calls to the very expensive emulated div.
        var radixToPower = Long.fromNumber(Math.pow(radix, 8));
        var result = Long.ZERO;
        for (var i = 0; i < str.length; i += 8) {
            var size = Math.min(8, str.length - i), value = parseInt(str.substring(i, i + size), radix);
            if (size < 8) {
                var power = Long.fromNumber(Math.pow(radix, size));
                result = result.mul(power).add(Long.fromNumber(value));
            }
            else {
                result = result.mul(radixToPower);
                result = result.add(Long.fromNumber(value));
            }
        }
        result.unsigned = unsigned;
        return result;
    };
    /**
     * Creates a Long from its byte representation.
     * @param bytes - Byte representation
     * @param unsigned - Whether unsigned or not, defaults to signed
     * @param le - Whether little or big endian, defaults to big endian
     * @returns The corresponding Long value
     */
    Long.fromBytes = function (bytes, unsigned, le) {
        return le ? Long.fromBytesLE(bytes, unsigned) : Long.fromBytesBE(bytes, unsigned);
    };
    /**
     * Creates a Long from its little endian byte representation.
     * @param bytes - Little endian byte representation
     * @param unsigned - Whether unsigned or not, defaults to signed
     * @returns The corresponding Long value
     */
    Long.fromBytesLE = function (bytes, unsigned) {
        return new Long(bytes[0] | (bytes[1] << 8) | (bytes[2] << 16) | (bytes[3] << 24), bytes[4] | (bytes[5] << 8) | (bytes[6] << 16) | (bytes[7] << 24), unsigned);
    };
    /**
     * Creates a Long from its big endian byte representation.
     * @param bytes - Big endian byte representation
     * @param unsigned - Whether unsigned or not, defaults to signed
     * @returns The corresponding Long value
     */
    Long.fromBytesBE = function (bytes, unsigned) {
        return new Long((bytes[4] << 24) | (bytes[5] << 16) | (bytes[6] << 8) | bytes[7], (bytes[0] << 24) | (bytes[1] << 16) | (bytes[2] << 8) | bytes[3], unsigned);
    };
    /**
     * Tests if the specified object is a Long.
     */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/explicit-module-boundary-types
    Long.isLong = function (value) {
        return isObjectLike(value) && value['__isLong__'] === true;
    };
    /**
     * Converts the specified value to a Long.
     * @param unsigned - Whether unsigned or not, defaults to signed
     */
    Long.fromValue = function (val, unsigned) {
        if (typeof val === 'number')
            return Long.fromNumber(val, unsigned);
        if (typeof val === 'string')
            return Long.fromString(val, unsigned);
        // Throws for non-objects, converts non-instanceof Long:
        return Long.fromBits(val.low, val.high, typeof unsigned === 'boolean' ? unsigned : val.unsigned);
    };
    /** Returns the sum of this and the specified Long. */
    Long.prototype.add = function (addend) {
        if (!Long.isLong(addend))
            addend = Long.fromValue(addend);
        // Divide each number into 4 chunks of 16 bits, and then sum the chunks.
        var a48 = this.high >>> 16;
        var a32 = this.high & 0xffff;
        var a16 = this.low >>> 16;
        var a00 = this.low & 0xffff;
        var b48 = addend.high >>> 16;
        var b32 = addend.high & 0xffff;
        var b16 = addend.low >>> 16;
        var b00 = addend.low & 0xffff;
        var c48 = 0, c32 = 0, c16 = 0, c00 = 0;
        c00 += a00 + b00;
        c16 += c00 >>> 16;
        c00 &= 0xffff;
        c16 += a16 + b16;
        c32 += c16 >>> 16;
        c16 &= 0xffff;
        c32 += a32 + b32;
        c48 += c32 >>> 16;
        c32 &= 0xffff;
        c48 += a48 + b48;
        c48 &= 0xffff;
        return Long.fromBits((c16 << 16) | c00, (c48 << 16) | c32, this.unsigned);
    };
    /**
     * Returns the sum of this and the specified Long.
     * @returns Sum
     */
    Long.prototype.and = function (other) {
        if (!Long.isLong(other))
            other = Long.fromValue(other);
        return Long.fromBits(this.low & other.low, this.high & other.high, this.unsigned);
    };
    /**
     * Compares this Long's value with the specified's.
     * @returns 0 if they are the same, 1 if the this is greater and -1 if the given one is greater
     */
    Long.prototype.compare = function (other) {
        if (!Long.isLong(other))
            other = Long.fromValue(other);
        if (this.eq(other))
            return 0;
        var thisNeg = this.isNegative(), otherNeg = other.isNegative();
        if (thisNeg && !otherNeg)
            return -1;
        if (!thisNeg && otherNeg)
            return 1;
        // At this point the sign bits are the same
        if (!this.unsigned)
            return this.sub(other).isNegative() ? -1 : 1;
        // Both are positive if at least one is unsigned
        return other.high >>> 0 > this.high >>> 0 ||
            (other.high === this.high && other.low >>> 0 > this.low >>> 0)
            ? -1
            : 1;
    };
    /** This is an alias of {@link Long.compare} */
    Long.prototype.comp = function (other) {
        return this.compare(other);
    };
    /**
     * Returns this Long divided by the specified. The result is signed if this Long is signed or unsigned if this Long is unsigned.
     * @returns Quotient
     */
    Long.prototype.divide = function (divisor) {
        if (!Long.isLong(divisor))
            divisor = Long.fromValue(divisor);
        if (divisor.isZero())
            throw Error('division by zero');
        // use wasm support if present
        if (wasm) {
            // guard against signed division overflow: the largest
            // negative number / -1 would be 1 larger than the largest
            // positive number, due to two's complement.
            if (!this.unsigned &&
                this.high === -0x80000000 &&
                divisor.low === -1 &&
                divisor.high === -1) {
                // be consistent with non-wasm code path
                return this;
            }
            var low = (this.unsigned ? wasm.div_u : wasm.div_s)(this.low, this.high, divisor.low, divisor.high);
            return Long.fromBits(low, wasm.get_high(), this.unsigned);
        }
        if (this.isZero())
            return this.unsigned ? Long.UZERO : Long.ZERO;
        var approx, rem, res;
        if (!this.unsigned) {
            // This section is only relevant for signed longs and is derived from the
            // closure library as a whole.
            if (this.eq(Long.MIN_VALUE)) {
                if (divisor.eq(Long.ONE) || divisor.eq(Long.NEG_ONE))
                    return Long.MIN_VALUE;
                // recall that -MIN_VALUE == MIN_VALUE
                else if (divisor.eq(Long.MIN_VALUE))
                    return Long.ONE;
                else {
                    // At this point, we have |other| >= 2, so |this/other| < |MIN_VALUE|.
                    var halfThis = this.shr(1);
                    approx = halfThis.div(divisor).shl(1);
                    if (approx.eq(Long.ZERO)) {
                        return divisor.isNegative() ? Long.ONE : Long.NEG_ONE;
                    }
                    else {
                        rem = this.sub(divisor.mul(approx));
                        res = approx.add(rem.div(divisor));
                        return res;
                    }
                }
            }
            else if (divisor.eq(Long.MIN_VALUE))
                return this.unsigned ? Long.UZERO : Long.ZERO;
            if (this.isNegative()) {
                if (divisor.isNegative())
                    return this.neg().div(divisor.neg());
                return this.neg().div(divisor).neg();
            }
            else if (divisor.isNegative())
                return this.div(divisor.neg()).neg();
            res = Long.ZERO;
        }
        else {
            // The algorithm below has not been made for unsigned longs. It's therefore
            // required to take special care of the MSB prior to running it.
            if (!divisor.unsigned)
                divisor = divisor.toUnsigned();
            if (divisor.gt(this))
                return Long.UZERO;
            if (divisor.gt(this.shru(1)))
                // 15 >>> 1 = 7 ; with divisor = 8 ; true
                return Long.UONE;
            res = Long.UZERO;
        }
        // Repeat the following until the remainder is less than other:  find a
        // floating-point that approximates remainder / other *from below*, add this
        // into the result, and subtract it from the remainder.  It is critical that
        // the approximate value is less than or equal to the real value so that the
        // remainder never becomes negative.
        rem = this;
        while (rem.gte(divisor)) {
            // Approximate the result of division. This may be a little greater or
            // smaller than the actual value.
            approx = Math.max(1, Math.floor(rem.toNumber() / divisor.toNumber()));
            // We will tweak the approximate result by changing it in the 48-th digit or
            // the smallest non-fractional digit, whichever is larger.
            var log2 = Math.ceil(Math.log(approx) / Math.LN2);
            var delta = log2 <= 48 ? 1 : Math.pow(2, log2 - 48);
            // Decrease the approximation until it is smaller than the remainder.  Note
            // that if it is too large, the product overflows and is negative.
            var approxRes = Long.fromNumber(approx);
            var approxRem = approxRes.mul(divisor);
            while (approxRem.isNegative() || approxRem.gt(rem)) {
                approx -= delta;
                approxRes = Long.fromNumber(approx, this.unsigned);
                approxRem = approxRes.mul(divisor);
            }
            // We know the answer can't be zero... and actually, zero would cause
            // infinite recursion since we would make no progress.
            if (approxRes.isZero())
                approxRes = Long.ONE;
            res = res.add(approxRes);
            rem = rem.sub(approxRem);
        }
        return res;
    };
    /**This is an alias of {@link Long.divide} */
    Long.prototype.div = function (divisor) {
        return this.divide(divisor);
    };
    /**
     * Tests if this Long's value equals the specified's.
     * @param other - Other value
     */
    Long.prototype.equals = function (other) {
        if (!Long.isLong(other))
            other = Long.fromValue(other);
        if (this.unsigned !== other.unsigned && this.high >>> 31 === 1 && other.high >>> 31 === 1)
            return false;
        return this.high === other.high && this.low === other.low;
    };
    /** This is an alias of {@link Long.equals} */
    Long.prototype.eq = function (other) {
        return this.equals(other);
    };
    /** Gets the high 32 bits as a signed integer. */
    Long.prototype.getHighBits = function () {
        return this.high;
    };
    /** Gets the high 32 bits as an unsigned integer. */
    Long.prototype.getHighBitsUnsigned = function () {
        return this.high >>> 0;
    };
    /** Gets the low 32 bits as a signed integer. */
    Long.prototype.getLowBits = function () {
        return this.low;
    };
    /** Gets the low 32 bits as an unsigned integer. */
    Long.prototype.getLowBitsUnsigned = function () {
        return this.low >>> 0;
    };
    /** Gets the number of bits needed to represent the absolute value of this Long. */
    Long.prototype.getNumBitsAbs = function () {
        if (this.isNegative()) {
            // Unsigned Longs are never negative
            return this.eq(Long.MIN_VALUE) ? 64 : this.neg().getNumBitsAbs();
        }
        var val = this.high !== 0 ? this.high : this.low;
        var bit;
        for (bit = 31; bit > 0; bit--)
            if ((val & (1 << bit)) !== 0)
                break;
        return this.high !== 0 ? bit + 33 : bit + 1;
    };
    /** Tests if this Long's value is greater than the specified's. */
    Long.prototype.greaterThan = function (other) {
        return this.comp(other) > 0;
    };
    /** This is an alias of {@link Long.greaterThan} */
    Long.prototype.gt = function (other) {
        return this.greaterThan(other);
    };
    /** Tests if this Long's value is greater than or equal the specified's. */
    Long.prototype.greaterThanOrEqual = function (other) {
        return this.comp(other) >= 0;
    };
    /** This is an alias of {@link Long.greaterThanOrEqual} */
    Long.prototype.gte = function (other) {
        return this.greaterThanOrEqual(other);
    };
    /** This is an alias of {@link Long.greaterThanOrEqual} */
    Long.prototype.ge = function (other) {
        return this.greaterThanOrEqual(other);
    };
    /** Tests if this Long's value is even. */
    Long.prototype.isEven = function () {
        return (this.low & 1) === 0;
    };
    /** Tests if this Long's value is negative. */
    Long.prototype.isNegative = function () {
        return !this.unsigned && this.high < 0;
    };
    /** Tests if this Long's value is odd. */
    Long.prototype.isOdd = function () {
        return (this.low & 1) === 1;
    };
    /** Tests if this Long's value is positive. */
    Long.prototype.isPositive = function () {
        return this.unsigned || this.high >= 0;
    };
    /** Tests if this Long's value equals zero. */
    Long.prototype.isZero = function () {
        return this.high === 0 && this.low === 0;
    };
    /** Tests if this Long's value is less than the specified's. */
    Long.prototype.lessThan = function (other) {
        return this.comp(other) < 0;
    };
    /** This is an alias of {@link Long#lessThan}. */
    Long.prototype.lt = function (other) {
        return this.lessThan(other);
    };
    /** Tests if this Long's value is less than or equal the specified's. */
    Long.prototype.lessThanOrEqual = function (other) {
        return this.comp(other) <= 0;
    };
    /** This is an alias of {@link Long.lessThanOrEqual} */
    Long.prototype.lte = function (other) {
        return this.lessThanOrEqual(other);
    };
    /** Returns this Long modulo the specified. */
    Long.prototype.modulo = function (divisor) {
        if (!Long.isLong(divisor))
            divisor = Long.fromValue(divisor);
        // use wasm support if present
        if (wasm) {
            var low = (this.unsigned ? wasm.rem_u : wasm.rem_s)(this.low, this.high, divisor.low, divisor.high);
            return Long.fromBits(low, wasm.get_high(), this.unsigned);
        }
        return this.sub(this.div(divisor).mul(divisor));
    };
    /** This is an alias of {@link Long.modulo} */
    Long.prototype.mod = function (divisor) {
        return this.modulo(divisor);
    };
    /** This is an alias of {@link Long.modulo} */
    Long.prototype.rem = function (divisor) {
        return this.modulo(divisor);
    };
    /**
     * Returns the product of this and the specified Long.
     * @param multiplier - Multiplier
     * @returns Product
     */
    Long.prototype.multiply = function (multiplier) {
        if (this.isZero())
            return Long.ZERO;
        if (!Long.isLong(multiplier))
            multiplier = Long.fromValue(multiplier);
        // use wasm support if present
        if (wasm) {
            var low = wasm.mul(this.low, this.high, multiplier.low, multiplier.high);
            return Long.fromBits(low, wasm.get_high(), this.unsigned);
        }
        if (multiplier.isZero())
            return Long.ZERO;
        if (this.eq(Long.MIN_VALUE))
            return multiplier.isOdd() ? Long.MIN_VALUE : Long.ZERO;
        if (multiplier.eq(Long.MIN_VALUE))
            return this.isOdd() ? Long.MIN_VALUE : Long.ZERO;
        if (this.isNegative()) {
            if (multiplier.isNegative())
                return this.neg().mul(multiplier.neg());
            else
                return this.neg().mul(multiplier).neg();
        }
        else if (multiplier.isNegative())
            return this.mul(multiplier.neg()).neg();
        // If both longs are small, use float multiplication
        if (this.lt(Long.TWO_PWR_24) && multiplier.lt(Long.TWO_PWR_24))
            return Long.fromNumber(this.toNumber() * multiplier.toNumber(), this.unsigned);
        // Divide each long into 4 chunks of 16 bits, and then add up 4x4 products.
        // We can skip products that would overflow.
        var a48 = this.high >>> 16;
        var a32 = this.high & 0xffff;
        var a16 = this.low >>> 16;
        var a00 = this.low & 0xffff;
        var b48 = multiplier.high >>> 16;
        var b32 = multiplier.high & 0xffff;
        var b16 = multiplier.low >>> 16;
        var b00 = multiplier.low & 0xffff;
        var c48 = 0, c32 = 0, c16 = 0, c00 = 0;
        c00 += a00 * b00;
        c16 += c00 >>> 16;
        c00 &= 0xffff;
        c16 += a16 * b00;
        c32 += c16 >>> 16;
        c16 &= 0xffff;
        c16 += a00 * b16;
        c32 += c16 >>> 16;
        c16 &= 0xffff;
        c32 += a32 * b00;
        c48 += c32 >>> 16;
        c32 &= 0xffff;
        c32 += a16 * b16;
        c48 += c32 >>> 16;
        c32 &= 0xffff;
        c32 += a00 * b32;
        c48 += c32 >>> 16;
        c32 &= 0xffff;
        c48 += a48 * b00 + a32 * b16 + a16 * b32 + a00 * b48;
        c48 &= 0xffff;
        return Long.fromBits((c16 << 16) | c00, (c48 << 16) | c32, this.unsigned);
    };
    /** This is an alias of {@link Long.multiply} */
    Long.prototype.mul = function (multiplier) {
        return this.multiply(multiplier);
    };
    /** Returns the Negation of this Long's value. */
    Long.prototype.negate = function () {
        if (!this.unsigned && this.eq(Long.MIN_VALUE))
            return Long.MIN_VALUE;
        return this.not().add(Long.ONE);
    };
    /** This is an alias of {@link Long.negate} */
    Long.prototype.neg = function () {
        return this.negate();
    };
    /** Returns the bitwise NOT of this Long. */
    Long.prototype.not = function () {
        return Long.fromBits(~this.low, ~this.high, this.unsigned);
    };
    /** Tests if this Long's value differs from the specified's. */
    Long.prototype.notEquals = function (other) {
        return !this.equals(other);
    };
    /** This is an alias of {@link Long.notEquals} */
    Long.prototype.neq = function (other) {
        return this.notEquals(other);
    };
    /** This is an alias of {@link Long.notEquals} */
    Long.prototype.ne = function (other) {
        return this.notEquals(other);
    };
    /**
     * Returns the bitwise OR of this Long and the specified.
     */
    Long.prototype.or = function (other) {
        if (!Long.isLong(other))
            other = Long.fromValue(other);
        return Long.fromBits(this.low | other.low, this.high | other.high, this.unsigned);
    };
    /**
     * Returns this Long with bits shifted to the left by the given amount.
     * @param numBits - Number of bits
     * @returns Shifted Long
     */
    Long.prototype.shiftLeft = function (numBits) {
        if (Long.isLong(numBits))
            numBits = numBits.toInt();
        if ((numBits &= 63) === 0)
            return this;
        else if (numBits < 32)
            return Long.fromBits(this.low << numBits, (this.high << numBits) | (this.low >>> (32 - numBits)), this.unsigned);
        else
            return Long.fromBits(0, this.low << (numBits - 32), this.unsigned);
    };
    /** This is an alias of {@link Long.shiftLeft} */
    Long.prototype.shl = function (numBits) {
        return this.shiftLeft(numBits);
    };
    /**
     * Returns this Long with bits arithmetically shifted to the right by the given amount.
     * @param numBits - Number of bits
     * @returns Shifted Long
     */
    Long.prototype.shiftRight = function (numBits) {
        if (Long.isLong(numBits))
            numBits = numBits.toInt();
        if ((numBits &= 63) === 0)
            return this;
        else if (numBits < 32)
            return Long.fromBits((this.low >>> numBits) | (this.high << (32 - numBits)), this.high >> numBits, this.unsigned);
        else
            return Long.fromBits(this.high >> (numBits - 32), this.high >= 0 ? 0 : -1, this.unsigned);
    };
    /** This is an alias of {@link Long.shiftRight} */
    Long.prototype.shr = function (numBits) {
        return this.shiftRight(numBits);
    };
    /**
     * Returns this Long with bits logically shifted to the right by the given amount.
     * @param numBits - Number of bits
     * @returns Shifted Long
     */
    Long.prototype.shiftRightUnsigned = function (numBits) {
        if (Long.isLong(numBits))
            numBits = numBits.toInt();
        numBits &= 63;
        if (numBits === 0)
            return this;
        else {
            var high = this.high;
            if (numBits < 32) {
                var low = this.low;
                return Long.fromBits((low >>> numBits) | (high << (32 - numBits)), high >>> numBits, this.unsigned);
            }
            else if (numBits === 32)
                return Long.fromBits(high, 0, this.unsigned);
            else
                return Long.fromBits(high >>> (numBits - 32), 0, this.unsigned);
        }
    };
    /** This is an alias of {@link Long.shiftRightUnsigned} */
    Long.prototype.shr_u = function (numBits) {
        return this.shiftRightUnsigned(numBits);
    };
    /** This is an alias of {@link Long.shiftRightUnsigned} */
    Long.prototype.shru = function (numBits) {
        return this.shiftRightUnsigned(numBits);
    };
    /**
     * Returns the difference of this and the specified Long.
     * @param subtrahend - Subtrahend
     * @returns Difference
     */
    Long.prototype.subtract = function (subtrahend) {
        if (!Long.isLong(subtrahend))
            subtrahend = Long.fromValue(subtrahend);
        return this.add(subtrahend.neg());
    };
    /** This is an alias of {@link Long.subtract} */
    Long.prototype.sub = function (subtrahend) {
        return this.subtract(subtrahend);
    };
    /** Converts the Long to a 32 bit integer, assuming it is a 32 bit integer. */
    Long.prototype.toInt = function () {
        return this.unsigned ? this.low >>> 0 : this.low;
    };
    /** Converts the Long to a the nearest floating-point representation of this value (double, 53 bit mantissa). */
    Long.prototype.toNumber = function () {
        if (this.unsigned)
            return (this.high >>> 0) * TWO_PWR_32_DBL + (this.low >>> 0);
        return this.high * TWO_PWR_32_DBL + (this.low >>> 0);
    };
    /** Converts the Long to a BigInt (arbitrary precision). */
    Long.prototype.toBigInt = function () {
        return BigInt(this.toString());
    };
    /**
     * Converts this Long to its byte representation.
     * @param le - Whether little or big endian, defaults to big endian
     * @returns Byte representation
     */
    Long.prototype.toBytes = function (le) {
        return le ? this.toBytesLE() : this.toBytesBE();
    };
    /**
     * Converts this Long to its little endian byte representation.
     * @returns Little endian byte representation
     */
    Long.prototype.toBytesLE = function () {
        var hi = this.high, lo = this.low;
        return [
            lo & 0xff,
            (lo >>> 8) & 0xff,
            (lo >>> 16) & 0xff,
            lo >>> 24,
            hi & 0xff,
            (hi >>> 8) & 0xff,
            (hi >>> 16) & 0xff,
            hi >>> 24
        ];
    };
    /**
     * Converts this Long to its big endian byte representation.
     * @returns Big endian byte representation
     */
    Long.prototype.toBytesBE = function () {
        var hi = this.high, lo = this.low;
        return [
            hi >>> 24,
            (hi >>> 16) & 0xff,
            (hi >>> 8) & 0xff,
            hi & 0xff,
            lo >>> 24,
            (lo >>> 16) & 0xff,
            (lo >>> 8) & 0xff,
            lo & 0xff
        ];
    };
    /**
     * Converts this Long to signed.
     */
    Long.prototype.toSigned = function () {
        if (!this.unsigned)
            return this;
        return Long.fromBits(this.low, this.high, false);
    };
    /**
     * Converts the Long to a string written in the specified radix.
     * @param radix - Radix (2-36), defaults to 10
     * @throws RangeError If `radix` is out of range
     */
    Long.prototype.toString = function (radix) {
        radix = radix || 10;
        if (radix < 2 || 36 < radix)
            throw RangeError('radix');
        if (this.isZero())
            return '0';
        if (this.isNegative()) {
            // Unsigned Longs are never negative
            if (this.eq(Long.MIN_VALUE)) {
                // We need to change the Long value before it can be negated, so we remove
                // the bottom-most digit in this base and then recurse to do the rest.
                var radixLong = Long.fromNumber(radix), div = this.div(radixLong), rem1 = div.mul(radixLong).sub(this);
                return div.toString(radix) + rem1.toInt().toString(radix);
            }
            else
                return '-' + this.neg().toString(radix);
        }
        // Do several (6) digits each time through the loop, so as to
        // minimize the calls to the very expensive emulated div.
        var radixToPower = Long.fromNumber(Math.pow(radix, 6), this.unsigned);
        // eslint-disable-next-line @typescript-eslint/no-this-alias
        var rem = this;
        var result = '';
        // eslint-disable-next-line no-constant-condition
        while (true) {
            var remDiv = rem.div(radixToPower);
            var intval = rem.sub(remDiv.mul(radixToPower)).toInt() >>> 0;
            var digits = intval.toString(radix);
            rem = remDiv;
            if (rem.isZero()) {
                return digits + result;
            }
            else {
                while (digits.length < 6)
                    digits = '0' + digits;
                result = '' + digits + result;
            }
        }
    };
    /** Converts this Long to unsigned. */
    Long.prototype.toUnsigned = function () {
        if (this.unsigned)
            return this;
        return Long.fromBits(this.low, this.high, true);
    };
    /** Returns the bitwise XOR of this Long and the given one. */
    Long.prototype.xor = function (other) {
        if (!Long.isLong(other))
            other = Long.fromValue(other);
        return Long.fromBits(this.low ^ other.low, this.high ^ other.high, this.unsigned);
    };
    /** This is an alias of {@link Long.isZero} */
    Long.prototype.eqz = function () {
        return this.isZero();
    };
    /** This is an alias of {@link Long.lessThanOrEqual} */
    Long.prototype.le = function (other) {
        return this.lessThanOrEqual(other);
    };
    /*
     ****************************************************************
     *                  BSON SPECIFIC ADDITIONS                     *
     ****************************************************************
     */
    Long.prototype.toExtendedJSON = function (options) {
        if (options && options.relaxed)
            return this.toNumber();
        return { $numberLong: this.toString() };
    };
    Long.fromExtendedJSON = function (doc, options) {
        var result = Long.fromString(doc.$numberLong);
        return options && options.relaxed ? result.toNumber() : result;
    };
    /** @internal */
    Long.prototype[Symbol.for('nodejs.util.inspect.custom')] = function () {
        return this.inspect();
    };
    Long.prototype.inspect = function () {
        return "new Long(\"" + this.toString() + "\"" + (this.unsigned ? ', true' : '') + ")";
    };
    Long.TWO_PWR_24 = Long.fromInt(TWO_PWR_24_DBL);
    /** Maximum unsigned value. */
    Long.MAX_UNSIGNED_VALUE = Long.fromBits(0xffffffff | 0, 0xffffffff | 0, true);
    /** Signed zero */
    Long.ZERO = Long.fromInt(0);
    /** Unsigned zero. */
    Long.UZERO = Long.fromInt(0, true);
    /** Signed one. */
    Long.ONE = Long.fromInt(1);
    /** Unsigned one. */
    Long.UONE = Long.fromInt(1, true);
    /** Signed negative one. */
    Long.NEG_ONE = Long.fromInt(-1);
    /** Maximum signed value. */
    Long.MAX_VALUE = Long.fromBits(0xffffffff | 0, 0x7fffffff | 0, false);
    /** Minimum signed value. */
    Long.MIN_VALUE = Long.fromBits(0, 0x80000000 | 0, false);
    return Long;
}());
Object.defineProperty(Long.prototype, '__isLong__', { value: true });
Object.defineProperty(Long.prototype, '_bsontype', { value: 'Long' });

var PARSE_STRING_REGEXP = /^(\+|-)?(\d+|(\d*\.\d*))?(E|e)?([-+])?(\d+)?$/;
var PARSE_INF_REGEXP = /^(\+|-)?(Infinity|inf)$/i;
var PARSE_NAN_REGEXP = /^(\+|-)?NaN$/i;
var EXPONENT_MAX = 6111;
var EXPONENT_MIN = -6176;
var EXPONENT_BIAS = 6176;
var MAX_DIGITS = 34;
// Nan value bits as 32 bit values (due to lack of longs)
var NAN_BUFFER = [
    0x7c, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00
].reverse();
// Infinity value bits 32 bit values (due to lack of longs)
var INF_NEGATIVE_BUFFER = [
    0xf8, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00
].reverse();
var INF_POSITIVE_BUFFER = [
    0x78, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00
].reverse();
var EXPONENT_REGEX = /^([-+])?(\d+)?$/;
// Extract least significant 5 bits
var COMBINATION_MASK = 0x1f;
// Extract least significant 14 bits
var EXPONENT_MASK = 0x3fff;
// Value of combination field for Inf
var COMBINATION_INFINITY = 30;
// Value of combination field for NaN
var COMBINATION_NAN = 31;
// Detect if the value is a digit
function isDigit(value) {
    return !isNaN(parseInt(value, 10));
}
// Divide two uint128 values
function divideu128(value) {
    var DIVISOR = Long.fromNumber(1000 * 1000 * 1000);
    var _rem = Long.fromNumber(0);
    if (!value.parts[0] && !value.parts[1] && !value.parts[2] && !value.parts[3]) {
        return { quotient: value, rem: _rem };
    }
    for (var i = 0; i <= 3; i++) {
        // Adjust remainder to match value of next dividend
        _rem = _rem.shiftLeft(32);
        // Add the divided to _rem
        _rem = _rem.add(new Long(value.parts[i], 0));
        value.parts[i] = _rem.div(DIVISOR).low;
        _rem = _rem.modulo(DIVISOR);
    }
    return { quotient: value, rem: _rem };
}
// Multiply two Long values and return the 128 bit value
function multiply64x2(left, right) {
    if (!left && !right) {
        return { high: Long.fromNumber(0), low: Long.fromNumber(0) };
    }
    var leftHigh = left.shiftRightUnsigned(32);
    var leftLow = new Long(left.getLowBits(), 0);
    var rightHigh = right.shiftRightUnsigned(32);
    var rightLow = new Long(right.getLowBits(), 0);
    var productHigh = leftHigh.multiply(rightHigh);
    var productMid = leftHigh.multiply(rightLow);
    var productMid2 = leftLow.multiply(rightHigh);
    var productLow = leftLow.multiply(rightLow);
    productHigh = productHigh.add(productMid.shiftRightUnsigned(32));
    productMid = new Long(productMid.getLowBits(), 0)
        .add(productMid2)
        .add(productLow.shiftRightUnsigned(32));
    productHigh = productHigh.add(productMid.shiftRightUnsigned(32));
    productLow = productMid.shiftLeft(32).add(new Long(productLow.getLowBits(), 0));
    // Return the 128 bit result
    return { high: productHigh, low: productLow };
}
function lessThan(left, right) {
    // Make values unsigned
    var uhleft = left.high >>> 0;
    var uhright = right.high >>> 0;
    // Compare high bits first
    if (uhleft < uhright) {
        return true;
    }
    else if (uhleft === uhright) {
        var ulleft = left.low >>> 0;
        var ulright = right.low >>> 0;
        if (ulleft < ulright)
            return true;
    }
    return false;
}
function invalidErr(string, message) {
    throw new BSONTypeError("\"" + string + "\" is not a valid Decimal128 string - " + message);
}
/**
 * A class representation of the BSON Decimal128 type.
 * @public
 * @category BSONType
 */
var Decimal128 = /** @class */ (function () {
    /**
     * @param bytes - a buffer containing the raw Decimal128 bytes in little endian order,
     *                or a string representation as returned by .toString()
     */
    function Decimal128(bytes) {
        if (!(this instanceof Decimal128))
            return new Decimal128(bytes);
        if (typeof bytes === 'string') {
            this.bytes = Decimal128.fromString(bytes).bytes;
        }
        else if (isUint8Array(bytes)) {
            if (bytes.byteLength !== 16) {
                throw new BSONTypeError('Decimal128 must take a Buffer of 16 bytes');
            }
            this.bytes = bytes;
        }
        else {
            throw new BSONTypeError('Decimal128 must take a Buffer or string');
        }
    }
    /**
     * Create a Decimal128 instance from a string representation
     *
     * @param representation - a numeric string representation.
     */
    Decimal128.fromString = function (representation) {
        // Parse state tracking
        var isNegative = false;
        var sawRadix = false;
        var foundNonZero = false;
        // Total number of significant digits (no leading or trailing zero)
        var significantDigits = 0;
        // Total number of significand digits read
        var nDigitsRead = 0;
        // Total number of digits (no leading zeros)
        var nDigits = 0;
        // The number of the digits after radix
        var radixPosition = 0;
        // The index of the first non-zero in *str*
        var firstNonZero = 0;
        // Digits Array
        var digits = [0];
        // The number of digits in digits
        var nDigitsStored = 0;
        // Insertion pointer for digits
        var digitsInsert = 0;
        // The index of the first non-zero digit
        var firstDigit = 0;
        // The index of the last digit
        var lastDigit = 0;
        // Exponent
        var exponent = 0;
        // loop index over array
        var i = 0;
        // The high 17 digits of the significand
        var significandHigh = new Long(0, 0);
        // The low 17 digits of the significand
        var significandLow = new Long(0, 0);
        // The biased exponent
        var biasedExponent = 0;
        // Read index
        var index = 0;
        // Naively prevent against REDOS attacks.
        // TODO: implementing a custom parsing for this, or refactoring the regex would yield
        //       further gains.
        if (representation.length >= 7000) {
            throw new BSONTypeError('' + representation + ' not a valid Decimal128 string');
        }
        // Results
        var stringMatch = representation.match(PARSE_STRING_REGEXP);
        var infMatch = representation.match(PARSE_INF_REGEXP);
        var nanMatch = representation.match(PARSE_NAN_REGEXP);
        // Validate the string
        if ((!stringMatch && !infMatch && !nanMatch) || representation.length === 0) {
            throw new BSONTypeError('' + representation + ' not a valid Decimal128 string');
        }
        if (stringMatch) {
            // full_match = stringMatch[0]
            // sign = stringMatch[1]
            var unsignedNumber = stringMatch[2];
            // stringMatch[3] is undefined if a whole number (ex "1", 12")
            // but defined if a number w/ decimal in it (ex "1.0, 12.2")
            var e = stringMatch[4];
            var expSign = stringMatch[5];
            var expNumber = stringMatch[6];
            // they provided e, but didn't give an exponent number. for ex "1e"
            if (e && expNumber === undefined)
                invalidErr(representation, 'missing exponent power');
            // they provided e, but didn't give a number before it. for ex "e1"
            if (e && unsignedNumber === undefined)
                invalidErr(representation, 'missing exponent base');
            if (e === undefined && (expSign || expNumber)) {
                invalidErr(representation, 'missing e before exponent');
            }
        }
        // Get the negative or positive sign
        if (representation[index] === '+' || representation[index] === '-') {
            isNegative = representation[index++] === '-';
        }
        // Check if user passed Infinity or NaN
        if (!isDigit(representation[index]) && representation[index] !== '.') {
            if (representation[index] === 'i' || representation[index] === 'I') {
                return new Decimal128(buffer_1.from(isNegative ? INF_NEGATIVE_BUFFER : INF_POSITIVE_BUFFER));
            }
            else if (representation[index] === 'N') {
                return new Decimal128(buffer_1.from(NAN_BUFFER));
            }
        }
        // Read all the digits
        while (isDigit(representation[index]) || representation[index] === '.') {
            if (representation[index] === '.') {
                if (sawRadix)
                    invalidErr(representation, 'contains multiple periods');
                sawRadix = true;
                index = index + 1;
                continue;
            }
            if (nDigitsStored < 34) {
                if (representation[index] !== '0' || foundNonZero) {
                    if (!foundNonZero) {
                        firstNonZero = nDigitsRead;
                    }
                    foundNonZero = true;
                    // Only store 34 digits
                    digits[digitsInsert++] = parseInt(representation[index], 10);
                    nDigitsStored = nDigitsStored + 1;
                }
            }
            if (foundNonZero)
                nDigits = nDigits + 1;
            if (sawRadix)
                radixPosition = radixPosition + 1;
            nDigitsRead = nDigitsRead + 1;
            index = index + 1;
        }
        if (sawRadix && !nDigitsRead)
            throw new BSONTypeError('' + representation + ' not a valid Decimal128 string');
        // Read exponent if exists
        if (representation[index] === 'e' || representation[index] === 'E') {
            // Read exponent digits
            var match = representation.substr(++index).match(EXPONENT_REGEX);
            // No digits read
            if (!match || !match[2])
                return new Decimal128(buffer_1.from(NAN_BUFFER));
            // Get exponent
            exponent = parseInt(match[0], 10);
            // Adjust the index
            index = index + match[0].length;
        }
        // Return not a number
        if (representation[index])
            return new Decimal128(buffer_1.from(NAN_BUFFER));
        // Done reading input
        // Find first non-zero digit in digits
        firstDigit = 0;
        if (!nDigitsStored) {
            firstDigit = 0;
            lastDigit = 0;
            digits[0] = 0;
            nDigits = 1;
            nDigitsStored = 1;
            significantDigits = 0;
        }
        else {
            lastDigit = nDigitsStored - 1;
            significantDigits = nDigits;
            if (significantDigits !== 1) {
                while (digits[firstNonZero + significantDigits - 1] === 0) {
                    significantDigits = significantDigits - 1;
                }
            }
        }
        // Normalization of exponent
        // Correct exponent based on radix position, and shift significand as needed
        // to represent user input
        // Overflow prevention
        if (exponent <= radixPosition && radixPosition - exponent > 1 << 14) {
            exponent = EXPONENT_MIN;
        }
        else {
            exponent = exponent - radixPosition;
        }
        // Attempt to normalize the exponent
        while (exponent > EXPONENT_MAX) {
            // Shift exponent to significand and decrease
            lastDigit = lastDigit + 1;
            if (lastDigit - firstDigit > MAX_DIGITS) {
                // Check if we have a zero then just hard clamp, otherwise fail
                var digitsString = digits.join('');
                if (digitsString.match(/^0+$/)) {
                    exponent = EXPONENT_MAX;
                    break;
                }
                invalidErr(representation, 'overflow');
            }
            exponent = exponent - 1;
        }
        while (exponent < EXPONENT_MIN || nDigitsStored < nDigits) {
            // Shift last digit. can only do this if < significant digits than # stored.
            if (lastDigit === 0 && significantDigits < nDigitsStored) {
                exponent = EXPONENT_MIN;
                significantDigits = 0;
                break;
            }
            if (nDigitsStored < nDigits) {
                // adjust to match digits not stored
                nDigits = nDigits - 1;
            }
            else {
                // adjust to round
                lastDigit = lastDigit - 1;
            }
            if (exponent < EXPONENT_MAX) {
                exponent = exponent + 1;
            }
            else {
                // Check if we have a zero then just hard clamp, otherwise fail
                var digitsString = digits.join('');
                if (digitsString.match(/^0+$/)) {
                    exponent = EXPONENT_MAX;
                    break;
                }
                invalidErr(representation, 'overflow');
            }
        }
        // Round
        // We've normalized the exponent, but might still need to round.
        if (lastDigit - firstDigit + 1 < significantDigits) {
            var endOfString = nDigitsRead;
            // If we have seen a radix point, 'string' is 1 longer than we have
            // documented with ndigits_read, so inc the position of the first nonzero
            // digit and the position that digits are read to.
            if (sawRadix) {
                firstNonZero = firstNonZero + 1;
                endOfString = endOfString + 1;
            }
            // if negative, we need to increment again to account for - sign at start.
            if (isNegative) {
                firstNonZero = firstNonZero + 1;
                endOfString = endOfString + 1;
            }
            var roundDigit = parseInt(representation[firstNonZero + lastDigit + 1], 10);
            var roundBit = 0;
            if (roundDigit >= 5) {
                roundBit = 1;
                if (roundDigit === 5) {
                    roundBit = digits[lastDigit] % 2 === 1 ? 1 : 0;
                    for (i = firstNonZero + lastDigit + 2; i < endOfString; i++) {
                        if (parseInt(representation[i], 10)) {
                            roundBit = 1;
                            break;
                        }
                    }
                }
            }
            if (roundBit) {
                var dIdx = lastDigit;
                for (; dIdx >= 0; dIdx--) {
                    if (++digits[dIdx] > 9) {
                        digits[dIdx] = 0;
                        // overflowed most significant digit
                        if (dIdx === 0) {
                            if (exponent < EXPONENT_MAX) {
                                exponent = exponent + 1;
                                digits[dIdx] = 1;
                            }
                            else {
                                return new Decimal128(buffer_1.from(isNegative ? INF_NEGATIVE_BUFFER : INF_POSITIVE_BUFFER));
                            }
                        }
                    }
                }
            }
        }
        // Encode significand
        // The high 17 digits of the significand
        significandHigh = Long.fromNumber(0);
        // The low 17 digits of the significand
        significandLow = Long.fromNumber(0);
        // read a zero
        if (significantDigits === 0) {
            significandHigh = Long.fromNumber(0);
            significandLow = Long.fromNumber(0);
        }
        else if (lastDigit - firstDigit < 17) {
            var dIdx = firstDigit;
            significandLow = Long.fromNumber(digits[dIdx++]);
            significandHigh = new Long(0, 0);
            for (; dIdx <= lastDigit; dIdx++) {
                significandLow = significandLow.multiply(Long.fromNumber(10));
                significandLow = significandLow.add(Long.fromNumber(digits[dIdx]));
            }
        }
        else {
            var dIdx = firstDigit;
            significandHigh = Long.fromNumber(digits[dIdx++]);
            for (; dIdx <= lastDigit - 17; dIdx++) {
                significandHigh = significandHigh.multiply(Long.fromNumber(10));
                significandHigh = significandHigh.add(Long.fromNumber(digits[dIdx]));
            }
            significandLow = Long.fromNumber(digits[dIdx++]);
            for (; dIdx <= lastDigit; dIdx++) {
                significandLow = significandLow.multiply(Long.fromNumber(10));
                significandLow = significandLow.add(Long.fromNumber(digits[dIdx]));
            }
        }
        var significand = multiply64x2(significandHigh, Long.fromString('100000000000000000'));
        significand.low = significand.low.add(significandLow);
        if (lessThan(significand.low, significandLow)) {
            significand.high = significand.high.add(Long.fromNumber(1));
        }
        // Biased exponent
        biasedExponent = exponent + EXPONENT_BIAS;
        var dec = { low: Long.fromNumber(0), high: Long.fromNumber(0) };
        // Encode combination, exponent, and significand.
        if (significand.high.shiftRightUnsigned(49).and(Long.fromNumber(1)).equals(Long.fromNumber(1))) {
            // Encode '11' into bits 1 to 3
            dec.high = dec.high.or(Long.fromNumber(0x3).shiftLeft(61));
            dec.high = dec.high.or(Long.fromNumber(biasedExponent).and(Long.fromNumber(0x3fff).shiftLeft(47)));
            dec.high = dec.high.or(significand.high.and(Long.fromNumber(0x7fffffffffff)));
        }
        else {
            dec.high = dec.high.or(Long.fromNumber(biasedExponent & 0x3fff).shiftLeft(49));
            dec.high = dec.high.or(significand.high.and(Long.fromNumber(0x1ffffffffffff)));
        }
        dec.low = significand.low;
        // Encode sign
        if (isNegative) {
            dec.high = dec.high.or(Long.fromString('9223372036854775808'));
        }
        // Encode into a buffer
        var buffer = buffer_1.alloc(16);
        index = 0;
        // Encode the low 64 bits of the decimal
        // Encode low bits
        buffer[index++] = dec.low.low & 0xff;
        buffer[index++] = (dec.low.low >> 8) & 0xff;
        buffer[index++] = (dec.low.low >> 16) & 0xff;
        buffer[index++] = (dec.low.low >> 24) & 0xff;
        // Encode high bits
        buffer[index++] = dec.low.high & 0xff;
        buffer[index++] = (dec.low.high >> 8) & 0xff;
        buffer[index++] = (dec.low.high >> 16) & 0xff;
        buffer[index++] = (dec.low.high >> 24) & 0xff;
        // Encode the high 64 bits of the decimal
        // Encode low bits
        buffer[index++] = dec.high.low & 0xff;
        buffer[index++] = (dec.high.low >> 8) & 0xff;
        buffer[index++] = (dec.high.low >> 16) & 0xff;
        buffer[index++] = (dec.high.low >> 24) & 0xff;
        // Encode high bits
        buffer[index++] = dec.high.high & 0xff;
        buffer[index++] = (dec.high.high >> 8) & 0xff;
        buffer[index++] = (dec.high.high >> 16) & 0xff;
        buffer[index++] = (dec.high.high >> 24) & 0xff;
        // Return the new Decimal128
        return new Decimal128(buffer);
    };
    /** Create a string representation of the raw Decimal128 value */
    Decimal128.prototype.toString = function () {
        // Note: bits in this routine are referred to starting at 0,
        // from the sign bit, towards the coefficient.
        // decoded biased exponent (14 bits)
        var biased_exponent;
        // the number of significand digits
        var significand_digits = 0;
        // the base-10 digits in the significand
        var significand = new Array(36);
        for (var i = 0; i < significand.length; i++)
            significand[i] = 0;
        // read pointer into significand
        var index = 0;
        // true if the number is zero
        var is_zero = false;
        // the most significant significand bits (50-46)
        var significand_msb;
        // temporary storage for significand decoding
        var significand128 = { parts: [0, 0, 0, 0] };
        // indexing variables
        var j, k;
        // Output string
        var string = [];
        // Unpack index
        index = 0;
        // Buffer reference
        var buffer = this.bytes;
        // Unpack the low 64bits into a long
        // bits 96 - 127
        var low = buffer[index++] | (buffer[index++] << 8) | (buffer[index++] << 16) | (buffer[index++] << 24);
        // bits 64 - 95
        var midl = buffer[index++] | (buffer[index++] << 8) | (buffer[index++] << 16) | (buffer[index++] << 24);
        // Unpack the high 64bits into a long
        // bits 32 - 63
        var midh = buffer[index++] | (buffer[index++] << 8) | (buffer[index++] << 16) | (buffer[index++] << 24);
        // bits 0 - 31
        var high = buffer[index++] | (buffer[index++] << 8) | (buffer[index++] << 16) | (buffer[index++] << 24);
        // Unpack index
        index = 0;
        // Create the state of the decimal
        var dec = {
            low: new Long(low, midl),
            high: new Long(midh, high)
        };
        if (dec.high.lessThan(Long.ZERO)) {
            string.push('-');
        }
        // Decode combination field and exponent
        // bits 1 - 5
        var combination = (high >> 26) & COMBINATION_MASK;
        if (combination >> 3 === 3) {
            // Check for 'special' values
            if (combination === COMBINATION_INFINITY) {
                return string.join('') + 'Infinity';
            }
            else if (combination === COMBINATION_NAN) {
                return 'NaN';
            }
            else {
                biased_exponent = (high >> 15) & EXPONENT_MASK;
                significand_msb = 0x08 + ((high >> 14) & 0x01);
            }
        }
        else {
            significand_msb = (high >> 14) & 0x07;
            biased_exponent = (high >> 17) & EXPONENT_MASK;
        }
        // unbiased exponent
        var exponent = biased_exponent - EXPONENT_BIAS;
        // Create string of significand digits
        // Convert the 114-bit binary number represented by
        // (significand_high, significand_low) to at most 34 decimal
        // digits through modulo and division.
        significand128.parts[0] = (high & 0x3fff) + ((significand_msb & 0xf) << 14);
        significand128.parts[1] = midh;
        significand128.parts[2] = midl;
        significand128.parts[3] = low;
        if (significand128.parts[0] === 0 &&
            significand128.parts[1] === 0 &&
            significand128.parts[2] === 0 &&
            significand128.parts[3] === 0) {
            is_zero = true;
        }
        else {
            for (k = 3; k >= 0; k--) {
                var least_digits = 0;
                // Perform the divide
                var result = divideu128(significand128);
                significand128 = result.quotient;
                least_digits = result.rem.low;
                // We now have the 9 least significant digits (in base 2).
                // Convert and output to string.
                if (!least_digits)
                    continue;
                for (j = 8; j >= 0; j--) {
                    // significand[k * 9 + j] = Math.round(least_digits % 10);
                    significand[k * 9 + j] = least_digits % 10;
                    // least_digits = Math.round(least_digits / 10);
                    least_digits = Math.floor(least_digits / 10);
                }
            }
        }
        // Output format options:
        // Scientific - [-]d.dddE(+/-)dd or [-]dE(+/-)dd
        // Regular    - ddd.ddd
        if (is_zero) {
            significand_digits = 1;
            significand[index] = 0;
        }
        else {
            significand_digits = 36;
            while (!significand[index]) {
                significand_digits = significand_digits - 1;
                index = index + 1;
            }
        }
        // the exponent if scientific notation is used
        var scientific_exponent = significand_digits - 1 + exponent;
        // The scientific exponent checks are dictated by the string conversion
        // specification and are somewhat arbitrary cutoffs.
        //
        // We must check exponent > 0, because if this is the case, the number
        // has trailing zeros.  However, we *cannot* output these trailing zeros,
        // because doing so would change the precision of the value, and would
        // change stored data if the string converted number is round tripped.
        if (scientific_exponent >= 34 || scientific_exponent <= -7 || exponent > 0) {
            // Scientific format
            // if there are too many significant digits, we should just be treating numbers
            // as + or - 0 and using the non-scientific exponent (this is for the "invalid
            // representation should be treated as 0/-0" spec cases in decimal128-1.json)
            if (significand_digits > 34) {
                string.push("" + 0);
                if (exponent > 0)
                    string.push('E+' + exponent);
                else if (exponent < 0)
                    string.push('E' + exponent);
                return string.join('');
            }
            string.push("" + significand[index++]);
            significand_digits = significand_digits - 1;
            if (significand_digits) {
                string.push('.');
            }
            for (var i = 0; i < significand_digits; i++) {
                string.push("" + significand[index++]);
            }
            // Exponent
            string.push('E');
            if (scientific_exponent > 0) {
                string.push('+' + scientific_exponent);
            }
            else {
                string.push("" + scientific_exponent);
            }
        }
        else {
            // Regular format with no decimal place
            if (exponent >= 0) {
                for (var i = 0; i < significand_digits; i++) {
                    string.push("" + significand[index++]);
                }
            }
            else {
                var radix_position = significand_digits + exponent;
                // non-zero digits before radix
                if (radix_position > 0) {
                    for (var i = 0; i < radix_position; i++) {
                        string.push("" + significand[index++]);
                    }
                }
                else {
                    string.push('0');
                }
                string.push('.');
                // add leading zeros after radix
                while (radix_position++ < 0) {
                    string.push('0');
                }
                for (var i = 0; i < significand_digits - Math.max(radix_position - 1, 0); i++) {
                    string.push("" + significand[index++]);
                }
            }
        }
        return string.join('');
    };
    Decimal128.prototype.toJSON = function () {
        return { $numberDecimal: this.toString() };
    };
    /** @internal */
    Decimal128.prototype.toExtendedJSON = function () {
        return { $numberDecimal: this.toString() };
    };
    /** @internal */
    Decimal128.fromExtendedJSON = function (doc) {
        return Decimal128.fromString(doc.$numberDecimal);
    };
    /** @internal */
    Decimal128.prototype[Symbol.for('nodejs.util.inspect.custom')] = function () {
        return this.inspect();
    };
    Decimal128.prototype.inspect = function () {
        return "new Decimal128(\"" + this.toString() + "\")";
    };
    return Decimal128;
}());
Object.defineProperty(Decimal128.prototype, '_bsontype', { value: 'Decimal128' });

/**
 * A class representation of the BSON Double type.
 * @public
 * @category BSONType
 */
var Double = /** @class */ (function () {
    /**
     * Create a Double type
     *
     * @param value - the number we want to represent as a double.
     */
    function Double(value) {
        if (!(this instanceof Double))
            return new Double(value);
        if (value instanceof Number) {
            value = value.valueOf();
        }
        this.value = +value;
    }
    /**
     * Access the number value.
     *
     * @returns returns the wrapped double number.
     */
    Double.prototype.valueOf = function () {
        return this.value;
    };
    Double.prototype.toJSON = function () {
        return this.value;
    };
    Double.prototype.toString = function (radix) {
        return this.value.toString(radix);
    };
    /** @internal */
    Double.prototype.toExtendedJSON = function (options) {
        if (options && (options.legacy || (options.relaxed && isFinite(this.value)))) {
            return this.value;
        }
        // NOTE: JavaScript has +0 and -0, apparently to model limit calculations. If a user
        // explicitly provided `-0` then we need to ensure the sign makes it into the output
        if (Object.is(Math.sign(this.value), -0)) {
            return { $numberDouble: "-" + this.value.toFixed(1) };
        }
        var $numberDouble;
        if (Number.isInteger(this.value)) {
            $numberDouble = this.value.toFixed(1);
            if ($numberDouble.length >= 13) {
                $numberDouble = this.value.toExponential(13).toUpperCase();
            }
        }
        else {
            $numberDouble = this.value.toString();
        }
        return { $numberDouble: $numberDouble };
    };
    /** @internal */
    Double.fromExtendedJSON = function (doc, options) {
        var doubleValue = parseFloat(doc.$numberDouble);
        return options && options.relaxed ? doubleValue : new Double(doubleValue);
    };
    /** @internal */
    Double.prototype[Symbol.for('nodejs.util.inspect.custom')] = function () {
        return this.inspect();
    };
    Double.prototype.inspect = function () {
        var eJSON = this.toExtendedJSON();
        return "new Double(" + eJSON.$numberDouble + ")";
    };
    return Double;
}());
Object.defineProperty(Double.prototype, '_bsontype', { value: 'Double' });

/**
 * A class representation of a BSON Int32 type.
 * @public
 * @category BSONType
 */
var Int32 = /** @class */ (function () {
    /**
     * Create an Int32 type
     *
     * @param value - the number we want to represent as an int32.
     */
    function Int32(value) {
        if (!(this instanceof Int32))
            return new Int32(value);
        if (value instanceof Number) {
            value = value.valueOf();
        }
        this.value = +value | 0;
    }
    /**
     * Access the number value.
     *
     * @returns returns the wrapped int32 number.
     */
    Int32.prototype.valueOf = function () {
        return this.value;
    };
    Int32.prototype.toString = function (radix) {
        return this.value.toString(radix);
    };
    Int32.prototype.toJSON = function () {
        return this.value;
    };
    /** @internal */
    Int32.prototype.toExtendedJSON = function (options) {
        if (options && (options.relaxed || options.legacy))
            return this.value;
        return { $numberInt: this.value.toString() };
    };
    /** @internal */
    Int32.fromExtendedJSON = function (doc, options) {
        return options && options.relaxed ? parseInt(doc.$numberInt, 10) : new Int32(doc.$numberInt);
    };
    /** @internal */
    Int32.prototype[Symbol.for('nodejs.util.inspect.custom')] = function () {
        return this.inspect();
    };
    Int32.prototype.inspect = function () {
        return "new Int32(" + this.valueOf() + ")";
    };
    return Int32;
}());
Object.defineProperty(Int32.prototype, '_bsontype', { value: 'Int32' });

/**
 * A class representation of the BSON MaxKey type.
 * @public
 * @category BSONType
 */
var MaxKey = /** @class */ (function () {
    function MaxKey() {
        if (!(this instanceof MaxKey))
            return new MaxKey();
    }
    /** @internal */
    MaxKey.prototype.toExtendedJSON = function () {
        return { $maxKey: 1 };
    };
    /** @internal */
    MaxKey.fromExtendedJSON = function () {
        return new MaxKey();
    };
    /** @internal */
    MaxKey.prototype[Symbol.for('nodejs.util.inspect.custom')] = function () {
        return this.inspect();
    };
    MaxKey.prototype.inspect = function () {
        return 'new MaxKey()';
    };
    return MaxKey;
}());
Object.defineProperty(MaxKey.prototype, '_bsontype', { value: 'MaxKey' });

/**
 * A class representation of the BSON MinKey type.
 * @public
 * @category BSONType
 */
var MinKey = /** @class */ (function () {
    function MinKey() {
        if (!(this instanceof MinKey))
            return new MinKey();
    }
    /** @internal */
    MinKey.prototype.toExtendedJSON = function () {
        return { $minKey: 1 };
    };
    /** @internal */
    MinKey.fromExtendedJSON = function () {
        return new MinKey();
    };
    /** @internal */
    MinKey.prototype[Symbol.for('nodejs.util.inspect.custom')] = function () {
        return this.inspect();
    };
    MinKey.prototype.inspect = function () {
        return 'new MinKey()';
    };
    return MinKey;
}());
Object.defineProperty(MinKey.prototype, '_bsontype', { value: 'MinKey' });

// Regular expression that checks for hex value
var checkForHexRegExp = new RegExp('^[0-9a-fA-F]{24}$');
// Unique sequence for the current process (initialized on first use)
var PROCESS_UNIQUE = null;
var kId = Symbol('id');
/**
 * A class representation of the BSON ObjectId type.
 * @public
 * @category BSONType
 */
var ObjectId = /** @class */ (function () {
    /**
     * Create an ObjectId type
     *
     * @param inputId - Can be a 24 character hex string, 12 byte binary Buffer, or a number.
     */
    function ObjectId(inputId) {
        if (!(this instanceof ObjectId))
            return new ObjectId(inputId);
        // workingId is set based on type of input and whether valid id exists for the input
        var workingId;
        if (typeof inputId === 'object' && inputId && 'id' in inputId) {
            if (typeof inputId.id !== 'string' && !ArrayBuffer.isView(inputId.id)) {
                throw new BSONTypeError('Argument passed in must have an id that is of type string or Buffer');
            }
            if ('toHexString' in inputId && typeof inputId.toHexString === 'function') {
                workingId = buffer_1.from(inputId.toHexString(), 'hex');
            }
            else {
                workingId = inputId.id;
            }
        }
        else {
            workingId = inputId;
        }
        // the following cases use workingId to construct an ObjectId
        if (workingId == null || typeof workingId === 'number') {
            // The most common use case (blank id, new objectId instance)
            // Generate a new id
            this[kId] = ObjectId.generate(typeof workingId === 'number' ? workingId : undefined);
        }
        else if (ArrayBuffer.isView(workingId) && workingId.byteLength === 12) {
            this[kId] = ensureBuffer(workingId);
        }
        else if (typeof workingId === 'string') {
            if (workingId.length === 12) {
                var bytes = buffer_1.from(workingId);
                if (bytes.byteLength === 12) {
                    this[kId] = bytes;
                }
                else {
                    throw new BSONTypeError('Argument passed in must be a string of 12 bytes');
                }
            }
            else if (workingId.length === 24 && checkForHexRegExp.test(workingId)) {
                this[kId] = buffer_1.from(workingId, 'hex');
            }
            else {
                throw new BSONTypeError('Argument passed in must be a string of 12 bytes or a string of 24 hex characters or an integer');
            }
        }
        else {
            throw new BSONTypeError('Argument passed in does not match the accepted types');
        }
        // If we are caching the hex string
        if (ObjectId.cacheHexString) {
            this.__id = this.id.toString('hex');
        }
    }
    Object.defineProperty(ObjectId.prototype, "id", {
        /**
         * The ObjectId bytes
         * @readonly
         */
        get: function () {
            return this[kId];
        },
        set: function (value) {
            this[kId] = value;
            if (ObjectId.cacheHexString) {
                this.__id = value.toString('hex');
            }
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(ObjectId.prototype, "generationTime", {
        /**
         * The generation time of this ObjectId instance
         * @deprecated Please use getTimestamp / createFromTime which returns an int32 epoch
         */
        get: function () {
            return this.id.readInt32BE(0);
        },
        set: function (value) {
            // Encode time into first 4 bytes
            this.id.writeUInt32BE(value, 0);
        },
        enumerable: false,
        configurable: true
    });
    /** Returns the ObjectId id as a 24 character hex string representation */
    ObjectId.prototype.toHexString = function () {
        if (ObjectId.cacheHexString && this.__id) {
            return this.__id;
        }
        var hexString = this.id.toString('hex');
        if (ObjectId.cacheHexString && !this.__id) {
            this.__id = hexString;
        }
        return hexString;
    };
    /**
     * Update the ObjectId index
     * @privateRemarks
     * Used in generating new ObjectId's on the driver
     * @internal
     */
    ObjectId.getInc = function () {
        return (ObjectId.index = (ObjectId.index + 1) % 0xffffff);
    };
    /**
     * Generate a 12 byte id buffer used in ObjectId's
     *
     * @param time - pass in a second based timestamp.
     */
    ObjectId.generate = function (time) {
        if ('number' !== typeof time) {
            time = Math.floor(Date.now() / 1000);
        }
        var inc = ObjectId.getInc();
        var buffer = buffer_1.alloc(12);
        // 4-byte timestamp
        buffer.writeUInt32BE(time, 0);
        // set PROCESS_UNIQUE if yet not initialized
        if (PROCESS_UNIQUE === null) {
            PROCESS_UNIQUE = randomBytes(5);
        }
        // 5-byte process unique
        buffer[4] = PROCESS_UNIQUE[0];
        buffer[5] = PROCESS_UNIQUE[1];
        buffer[6] = PROCESS_UNIQUE[2];
        buffer[7] = PROCESS_UNIQUE[3];
        buffer[8] = PROCESS_UNIQUE[4];
        // 3-byte counter
        buffer[11] = inc & 0xff;
        buffer[10] = (inc >> 8) & 0xff;
        buffer[9] = (inc >> 16) & 0xff;
        return buffer;
    };
    /**
     * Converts the id into a 24 character hex string for printing
     *
     * @param format - The Buffer toString format parameter.
     */
    ObjectId.prototype.toString = function (format) {
        // Is the id a buffer then use the buffer toString method to return the format
        if (format)
            return this.id.toString(format);
        return this.toHexString();
    };
    /** Converts to its JSON the 24 character hex string representation. */
    ObjectId.prototype.toJSON = function () {
        return this.toHexString();
    };
    /**
     * Compares the equality of this ObjectId with `otherID`.
     *
     * @param otherId - ObjectId instance to compare against.
     */
    ObjectId.prototype.equals = function (otherId) {
        if (otherId === undefined || otherId === null) {
            return false;
        }
        if (otherId instanceof ObjectId) {
            return this[kId][11] === otherId[kId][11] && this[kId].equals(otherId[kId]);
        }
        if (typeof otherId === 'string' &&
            ObjectId.isValid(otherId) &&
            otherId.length === 12 &&
            isUint8Array(this.id)) {
            return otherId === buffer_1.prototype.toString.call(this.id, 'latin1');
        }
        if (typeof otherId === 'string' && ObjectId.isValid(otherId) && otherId.length === 24) {
            return otherId.toLowerCase() === this.toHexString();
        }
        if (typeof otherId === 'string' && ObjectId.isValid(otherId) && otherId.length === 12) {
            return buffer_1.from(otherId).equals(this.id);
        }
        if (typeof otherId === 'object' &&
            'toHexString' in otherId &&
            typeof otherId.toHexString === 'function') {
            var otherIdString = otherId.toHexString();
            var thisIdString = this.toHexString().toLowerCase();
            return typeof otherIdString === 'string' && otherIdString.toLowerCase() === thisIdString;
        }
        return false;
    };
    /** Returns the generation date (accurate up to the second) that this ID was generated. */
    ObjectId.prototype.getTimestamp = function () {
        var timestamp = new Date();
        var time = this.id.readUInt32BE(0);
        timestamp.setTime(Math.floor(time) * 1000);
        return timestamp;
    };
    /** @internal */
    ObjectId.createPk = function () {
        return new ObjectId();
    };
    /**
     * Creates an ObjectId from a second based number, with the rest of the ObjectId zeroed out. Used for comparisons or sorting the ObjectId.
     *
     * @param time - an integer number representing a number of seconds.
     */
    ObjectId.createFromTime = function (time) {
        var buffer = buffer_1.from([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
        // Encode time into first 4 bytes
        buffer.writeUInt32BE(time, 0);
        // Return the new objectId
        return new ObjectId(buffer);
    };
    /**
     * Creates an ObjectId from a hex string representation of an ObjectId.
     *
     * @param hexString - create a ObjectId from a passed in 24 character hexstring.
     */
    ObjectId.createFromHexString = function (hexString) {
        // Throw an error if it's not a valid setup
        if (typeof hexString === 'undefined' || (hexString != null && hexString.length !== 24)) {
            throw new BSONTypeError('Argument passed in must be a single String of 12 bytes or a string of 24 hex characters');
        }
        return new ObjectId(buffer_1.from(hexString, 'hex'));
    };
    /**
     * Checks if a value is a valid bson ObjectId
     *
     * @param id - ObjectId instance to validate.
     */
    ObjectId.isValid = function (id) {
        if (id == null)
            return false;
        try {
            new ObjectId(id);
            return true;
        }
        catch (_a) {
            return false;
        }
    };
    /** @internal */
    ObjectId.prototype.toExtendedJSON = function () {
        if (this.toHexString)
            return { $oid: this.toHexString() };
        return { $oid: this.toString('hex') };
    };
    /** @internal */
    ObjectId.fromExtendedJSON = function (doc) {
        return new ObjectId(doc.$oid);
    };
    /**
     * Converts to a string representation of this Id.
     *
     * @returns return the 24 character hex string representation.
     * @internal
     */
    ObjectId.prototype[Symbol.for('nodejs.util.inspect.custom')] = function () {
        return this.inspect();
    };
    ObjectId.prototype.inspect = function () {
        return "new ObjectId(\"" + this.toHexString() + "\")";
    };
    /** @internal */
    ObjectId.index = Math.floor(Math.random() * 0xffffff);
    return ObjectId;
}());
// Deprecated methods
Object.defineProperty(ObjectId.prototype, 'generate', {
    value: deprecate(function (time) { return ObjectId.generate(time); }, 'Please use the static `ObjectId.generate(time)` instead')
});
Object.defineProperty(ObjectId.prototype, 'getInc', {
    value: deprecate(function () { return ObjectId.getInc(); }, 'Please use the static `ObjectId.getInc()` instead')
});
Object.defineProperty(ObjectId.prototype, 'get_inc', {
    value: deprecate(function () { return ObjectId.getInc(); }, 'Please use the static `ObjectId.getInc()` instead')
});
Object.defineProperty(ObjectId, 'get_inc', {
    value: deprecate(function () { return ObjectId.getInc(); }, 'Please use the static `ObjectId.getInc()` instead')
});
Object.defineProperty(ObjectId.prototype, '_bsontype', { value: 'ObjectID' });

function alphabetize(str) {
    return str.split('').sort().join('');
}
/**
 * A class representation of the BSON RegExp type.
 * @public
 * @category BSONType
 */
var BSONRegExp = /** @class */ (function () {
    /**
     * @param pattern - The regular expression pattern to match
     * @param options - The regular expression options
     */
    function BSONRegExp(pattern, options) {
        if (!(this instanceof BSONRegExp))
            return new BSONRegExp(pattern, options);
        this.pattern = pattern;
        this.options = alphabetize(options !== null && options !== void 0 ? options : '');
        if (this.pattern.indexOf('\x00') !== -1) {
            throw new BSONError("BSON Regex patterns cannot contain null bytes, found: " + JSON.stringify(this.pattern));
        }
        if (this.options.indexOf('\x00') !== -1) {
            throw new BSONError("BSON Regex options cannot contain null bytes, found: " + JSON.stringify(this.options));
        }
        // Validate options
        for (var i = 0; i < this.options.length; i++) {
            if (!(this.options[i] === 'i' ||
                this.options[i] === 'm' ||
                this.options[i] === 'x' ||
                this.options[i] === 'l' ||
                this.options[i] === 's' ||
                this.options[i] === 'u')) {
                throw new BSONError("The regular expression option [" + this.options[i] + "] is not supported");
            }
        }
    }
    BSONRegExp.parseOptions = function (options) {
        return options ? options.split('').sort().join('') : '';
    };
    /** @internal */
    BSONRegExp.prototype.toExtendedJSON = function (options) {
        options = options || {};
        if (options.legacy) {
            return { $regex: this.pattern, $options: this.options };
        }
        return { $regularExpression: { pattern: this.pattern, options: this.options } };
    };
    /** @internal */
    BSONRegExp.fromExtendedJSON = function (doc) {
        if ('$regex' in doc) {
            if (typeof doc.$regex !== 'string') {
                // This is for $regex query operators that have extended json values.
                if (doc.$regex._bsontype === 'BSONRegExp') {
                    return doc;
                }
            }
            else {
                return new BSONRegExp(doc.$regex, BSONRegExp.parseOptions(doc.$options));
            }
        }
        if ('$regularExpression' in doc) {
            return new BSONRegExp(doc.$regularExpression.pattern, BSONRegExp.parseOptions(doc.$regularExpression.options));
        }
        throw new BSONTypeError("Unexpected BSONRegExp EJSON object form: " + JSON.stringify(doc));
    };
    return BSONRegExp;
}());
Object.defineProperty(BSONRegExp.prototype, '_bsontype', { value: 'BSONRegExp' });

/**
 * A class representation of the BSON Symbol type.
 * @public
 * @category BSONType
 */
var BSONSymbol = /** @class */ (function () {
    /**
     * @param value - the string representing the symbol.
     */
    function BSONSymbol(value) {
        if (!(this instanceof BSONSymbol))
            return new BSONSymbol(value);
        this.value = value;
    }
    /** Access the wrapped string value. */
    BSONSymbol.prototype.valueOf = function () {
        return this.value;
    };
    BSONSymbol.prototype.toString = function () {
        return this.value;
    };
    /** @internal */
    BSONSymbol.prototype.inspect = function () {
        return "new BSONSymbol(\"" + this.value + "\")";
    };
    BSONSymbol.prototype.toJSON = function () {
        return this.value;
    };
    /** @internal */
    BSONSymbol.prototype.toExtendedJSON = function () {
        return { $symbol: this.value };
    };
    /** @internal */
    BSONSymbol.fromExtendedJSON = function (doc) {
        return new BSONSymbol(doc.$symbol);
    };
    /** @internal */
    BSONSymbol.prototype[Symbol.for('nodejs.util.inspect.custom')] = function () {
        return this.inspect();
    };
    return BSONSymbol;
}());
Object.defineProperty(BSONSymbol.prototype, '_bsontype', { value: 'Symbol' });

/** @public */
var LongWithoutOverridesClass = Long;
/**
 * @public
 * @category BSONType
 * */
var Timestamp = /** @class */ (function (_super) {
    __extends$1(Timestamp, _super);
    function Timestamp(low, high) {
        var _this = this;
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        ///@ts-expect-error
        if (!(_this instanceof Timestamp))
            return new Timestamp(low, high);
        if (Long.isLong(low)) {
            _this = _super.call(this, low.low, low.high, true) || this;
        }
        else if (isObjectLike(low) && typeof low.t !== 'undefined' && typeof low.i !== 'undefined') {
            _this = _super.call(this, low.i, low.t, true) || this;
        }
        else {
            _this = _super.call(this, low, high, true) || this;
        }
        Object.defineProperty(_this, '_bsontype', {
            value: 'Timestamp',
            writable: false,
            configurable: false,
            enumerable: false
        });
        return _this;
    }
    Timestamp.prototype.toJSON = function () {
        return {
            $timestamp: this.toString()
        };
    };
    /** Returns a Timestamp represented by the given (32-bit) integer value. */
    Timestamp.fromInt = function (value) {
        return new Timestamp(Long.fromInt(value, true));
    };
    /** Returns a Timestamp representing the given number value, provided that it is a finite number. Otherwise, zero is returned. */
    Timestamp.fromNumber = function (value) {
        return new Timestamp(Long.fromNumber(value, true));
    };
    /**
     * Returns a Timestamp for the given high and low bits. Each is assumed to use 32 bits.
     *
     * @param lowBits - the low 32-bits.
     * @param highBits - the high 32-bits.
     */
    Timestamp.fromBits = function (lowBits, highBits) {
        return new Timestamp(lowBits, highBits);
    };
    /**
     * Returns a Timestamp from the given string, optionally using the given radix.
     *
     * @param str - the textual representation of the Timestamp.
     * @param optRadix - the radix in which the text is written.
     */
    Timestamp.fromString = function (str, optRadix) {
        return new Timestamp(Long.fromString(str, true, optRadix));
    };
    /** @internal */
    Timestamp.prototype.toExtendedJSON = function () {
        return { $timestamp: { t: this.high >>> 0, i: this.low >>> 0 } };
    };
    /** @internal */
    Timestamp.fromExtendedJSON = function (doc) {
        return new Timestamp(doc.$timestamp);
    };
    /** @internal */
    Timestamp.prototype[Symbol.for('nodejs.util.inspect.custom')] = function () {
        return this.inspect();
    };
    Timestamp.prototype.inspect = function () {
        return "new Timestamp({ t: " + this.getHighBits() + ", i: " + this.getLowBits() + " })";
    };
    Timestamp.MAX_VALUE = Long.MAX_UNSIGNED_VALUE;
    return Timestamp;
}(LongWithoutOverridesClass));

function isBSONType(value) {
    return (isObjectLike(value) && Reflect.has(value, '_bsontype') && typeof value._bsontype === 'string');
}
// INT32 boundaries
var BSON_INT32_MAX$1 = 0x7fffffff;
var BSON_INT32_MIN$1 = -0x80000000;
// INT64 boundaries
var BSON_INT64_MAX$1 = 0x7fffffffffffffff;
var BSON_INT64_MIN$1 = -0x8000000000000000;
// all the types where we don't need to do any special processing and can just pass the EJSON
//straight to type.fromExtendedJSON
var keysToCodecs = {
    $oid: ObjectId,
    $binary: Binary,
    $uuid: Binary,
    $symbol: BSONSymbol,
    $numberInt: Int32,
    $numberDecimal: Decimal128,
    $numberDouble: Double,
    $numberLong: Long,
    $minKey: MinKey,
    $maxKey: MaxKey,
    $regex: BSONRegExp,
    $regularExpression: BSONRegExp,
    $timestamp: Timestamp
};
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function deserializeValue(value, options) {
    if (options === void 0) { options = {}; }
    if (typeof value === 'number') {
        if (options.relaxed || options.legacy) {
            return value;
        }
        // if it's an integer, should interpret as smallest BSON integer
        // that can represent it exactly. (if out of range, interpret as double.)
        if (Math.floor(value) === value) {
            if (value >= BSON_INT32_MIN$1 && value <= BSON_INT32_MAX$1)
                return new Int32(value);
            if (value >= BSON_INT64_MIN$1 && value <= BSON_INT64_MAX$1)
                return Long.fromNumber(value);
        }
        // If the number is a non-integer or out of integer range, should interpret as BSON Double.
        return new Double(value);
    }
    // from here on out we're looking for bson types, so bail if its not an object
    if (value == null || typeof value !== 'object')
        return value;
    // upgrade deprecated undefined to null
    if (value.$undefined)
        return null;
    var keys = Object.keys(value).filter(function (k) { return k.startsWith('$') && value[k] != null; });
    for (var i = 0; i < keys.length; i++) {
        var c = keysToCodecs[keys[i]];
        if (c)
            return c.fromExtendedJSON(value, options);
    }
    if (value.$date != null) {
        var d = value.$date;
        var date = new Date();
        if (options.legacy) {
            if (typeof d === 'number')
                date.setTime(d);
            else if (typeof d === 'string')
                date.setTime(Date.parse(d));
        }
        else {
            if (typeof d === 'string')
                date.setTime(Date.parse(d));
            else if (Long.isLong(d))
                date.setTime(d.toNumber());
            else if (typeof d === 'number' && options.relaxed)
                date.setTime(d);
        }
        return date;
    }
    if (value.$code != null) {
        var copy = Object.assign({}, value);
        if (value.$scope) {
            copy.$scope = deserializeValue(value.$scope);
        }
        return Code.fromExtendedJSON(value);
    }
    if (isDBRefLike(value) || value.$dbPointer) {
        var v = value.$ref ? value : value.$dbPointer;
        // we run into this in a "degenerate EJSON" case (with $id and $ref order flipped)
        // because of the order JSON.parse goes through the document
        if (v instanceof DBRef)
            return v;
        var dollarKeys = Object.keys(v).filter(function (k) { return k.startsWith('$'); });
        var valid_1 = true;
        dollarKeys.forEach(function (k) {
            if (['$ref', '$id', '$db'].indexOf(k) === -1)
                valid_1 = false;
        });
        // only make DBRef if $ keys are all valid
        if (valid_1)
            return DBRef.fromExtendedJSON(v);
    }
    return value;
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function serializeArray(array, options) {
    return array.map(function (v, index) {
        options.seenObjects.push({ propertyName: "index " + index, obj: null });
        try {
            return serializeValue(v, options);
        }
        finally {
            options.seenObjects.pop();
        }
    });
}
function getISOString(date) {
    var isoStr = date.toISOString();
    // we should only show milliseconds in timestamp if they're non-zero
    return date.getUTCMilliseconds() !== 0 ? isoStr : isoStr.slice(0, -5) + 'Z';
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function serializeValue(value, options) {
    if ((typeof value === 'object' || typeof value === 'function') && value !== null) {
        var index = options.seenObjects.findIndex(function (entry) { return entry.obj === value; });
        if (index !== -1) {
            var props = options.seenObjects.map(function (entry) { return entry.propertyName; });
            var leadingPart = props
                .slice(0, index)
                .map(function (prop) { return prop + " -> "; })
                .join('');
            var alreadySeen = props[index];
            var circularPart = ' -> ' +
                props
                    .slice(index + 1, props.length - 1)
                    .map(function (prop) { return prop + " -> "; })
                    .join('');
            var current = props[props.length - 1];
            var leadingSpace = ' '.repeat(leadingPart.length + alreadySeen.length / 2);
            var dashes = '-'.repeat(circularPart.length + (alreadySeen.length + current.length) / 2 - 1);
            throw new BSONTypeError('Converting circular structure to EJSON:\n' +
                ("    " + leadingPart + alreadySeen + circularPart + current + "\n") +
                ("    " + leadingSpace + "\\" + dashes + "/"));
        }
        options.seenObjects[options.seenObjects.length - 1].obj = value;
    }
    if (Array.isArray(value))
        return serializeArray(value, options);
    if (value === undefined)
        return null;
    if (value instanceof Date || isDate(value)) {
        var dateNum = value.getTime(), 
        // is it in year range 1970-9999?
        inRange = dateNum > -1 && dateNum < 253402318800000;
        if (options.legacy) {
            return options.relaxed && inRange
                ? { $date: value.getTime() }
                : { $date: getISOString(value) };
        }
        return options.relaxed && inRange
            ? { $date: getISOString(value) }
            : { $date: { $numberLong: value.getTime().toString() } };
    }
    if (typeof value === 'number' && (!options.relaxed || !isFinite(value))) {
        // it's an integer
        if (Math.floor(value) === value) {
            var int32Range = value >= BSON_INT32_MIN$1 && value <= BSON_INT32_MAX$1, int64Range = value >= BSON_INT64_MIN$1 && value <= BSON_INT64_MAX$1;
            // interpret as being of the smallest BSON integer type that can represent the number exactly
            if (int32Range)
                return { $numberInt: value.toString() };
            if (int64Range)
                return { $numberLong: value.toString() };
        }
        return { $numberDouble: value.toString() };
    }
    if (value instanceof RegExp || isRegExp(value)) {
        var flags = value.flags;
        if (flags === undefined) {
            var match = value.toString().match(/[gimuy]*$/);
            if (match) {
                flags = match[0];
            }
        }
        var rx = new BSONRegExp(value.source, flags);
        return rx.toExtendedJSON(options);
    }
    if (value != null && typeof value === 'object')
        return serializeDocument(value, options);
    return value;
}
var BSON_TYPE_MAPPINGS = {
    Binary: function (o) { return new Binary(o.value(), o.sub_type); },
    Code: function (o) { return new Code(o.code, o.scope); },
    DBRef: function (o) { return new DBRef(o.collection || o.namespace, o.oid, o.db, o.fields); },
    Decimal128: function (o) { return new Decimal128(o.bytes); },
    Double: function (o) { return new Double(o.value); },
    Int32: function (o) { return new Int32(o.value); },
    Long: function (o) {
        return Long.fromBits(
        // underscore variants for 1.x backwards compatibility
        o.low != null ? o.low : o.low_, o.low != null ? o.high : o.high_, o.low != null ? o.unsigned : o.unsigned_);
    },
    MaxKey: function () { return new MaxKey(); },
    MinKey: function () { return new MinKey(); },
    ObjectID: function (o) { return new ObjectId(o); },
    ObjectId: function (o) { return new ObjectId(o); },
    BSONRegExp: function (o) { return new BSONRegExp(o.pattern, o.options); },
    Symbol: function (o) { return new BSONSymbol(o.value); },
    Timestamp: function (o) { return Timestamp.fromBits(o.low, o.high); }
};
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function serializeDocument(doc, options) {
    if (doc == null || typeof doc !== 'object')
        throw new BSONError('not an object instance');
    var bsontype = doc._bsontype;
    if (typeof bsontype === 'undefined') {
        // It's a regular object. Recursively serialize its property values.
        var _doc = {};
        for (var name in doc) {
            options.seenObjects.push({ propertyName: name, obj: null });
            try {
                _doc[name] = serializeValue(doc[name], options);
            }
            finally {
                options.seenObjects.pop();
            }
        }
        return _doc;
    }
    else if (isBSONType(doc)) {
        // the "document" is really just a BSON type object
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        var outDoc = doc;
        if (typeof outDoc.toExtendedJSON !== 'function') {
            // There's no EJSON serialization function on the object. It's probably an
            // object created by a previous version of this library (or another library)
            // that's duck-typing objects to look like they were generated by this library).
            // Copy the object into this library's version of that type.
            var mapper = BSON_TYPE_MAPPINGS[doc._bsontype];
            if (!mapper) {
                throw new BSONTypeError('Unrecognized or invalid _bsontype: ' + doc._bsontype);
            }
            outDoc = mapper(outDoc);
        }
        // Two BSON types may have nested objects that may need to be serialized too
        if (bsontype === 'Code' && outDoc.scope) {
            outDoc = new Code(outDoc.code, serializeValue(outDoc.scope, options));
        }
        else if (bsontype === 'DBRef' && outDoc.oid) {
            outDoc = new DBRef(serializeValue(outDoc.collection, options), serializeValue(outDoc.oid, options), serializeValue(outDoc.db, options), serializeValue(outDoc.fields, options));
        }
        return outDoc.toExtendedJSON(options);
    }
    else {
        throw new BSONError('_bsontype must be a string, but was: ' + typeof bsontype);
    }
}
/**
 * EJSON parse / stringify API
 * @public
 */
// the namespace here is used to emulate `export * as EJSON from '...'`
// which as of now (sept 2020) api-extractor does not support
// eslint-disable-next-line @typescript-eslint/no-namespace
var EJSON;
(function (EJSON) {
    /**
     * Parse an Extended JSON string, constructing the JavaScript value or object described by that
     * string.
     *
     * @example
     * ```js
     * const { EJSON } = require('bson');
     * const text = '{ "int32": { "$numberInt": "10" } }';
     *
     * // prints { int32: { [String: '10'] _bsontype: 'Int32', value: '10' } }
     * console.log(EJSON.parse(text, { relaxed: false }));
     *
     * // prints { int32: 10 }
     * console.log(EJSON.parse(text));
     * ```
     */
    function parse(text, options) {
        var finalOptions = Object.assign({}, { relaxed: true, legacy: false }, options);
        // relaxed implies not strict
        if (typeof finalOptions.relaxed === 'boolean')
            finalOptions.strict = !finalOptions.relaxed;
        if (typeof finalOptions.strict === 'boolean')
            finalOptions.relaxed = !finalOptions.strict;
        return JSON.parse(text, function (key, value) {
            if (key.indexOf('\x00') !== -1) {
                throw new BSONError("BSON Document field names cannot contain null bytes, found: " + JSON.stringify(key));
            }
            return deserializeValue(value, finalOptions);
        });
    }
    EJSON.parse = parse;
    /**
     * Converts a BSON document to an Extended JSON string, optionally replacing values if a replacer
     * function is specified or optionally including only the specified properties if a replacer array
     * is specified.
     *
     * @param value - The value to convert to extended JSON
     * @param replacer - A function that alters the behavior of the stringification process, or an array of String and Number objects that serve as a whitelist for selecting/filtering the properties of the value object to be included in the JSON string. If this value is null or not provided, all properties of the object are included in the resulting JSON string
     * @param space - A String or Number object that's used to insert white space into the output JSON string for readability purposes.
     * @param options - Optional settings
     *
     * @example
     * ```js
     * const { EJSON } = require('bson');
     * const Int32 = require('mongodb').Int32;
     * const doc = { int32: new Int32(10) };
     *
     * // prints '{"int32":{"$numberInt":"10"}}'
     * console.log(EJSON.stringify(doc, { relaxed: false }));
     *
     * // prints '{"int32":10}'
     * console.log(EJSON.stringify(doc));
     * ```
     */
    function stringify(value, 
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    replacer, space, options) {
        if (space != null && typeof space === 'object') {
            options = space;
            space = 0;
        }
        if (replacer != null && typeof replacer === 'object' && !Array.isArray(replacer)) {
            options = replacer;
            replacer = undefined;
            space = 0;
        }
        var serializeOptions = Object.assign({ relaxed: true, legacy: false }, options, {
            seenObjects: [{ propertyName: '(root)', obj: null }]
        });
        var doc = serializeValue(value, serializeOptions);
        return JSON.stringify(doc, replacer, space);
    }
    EJSON.stringify = stringify;
    /**
     * Serializes an object to an Extended JSON string, and reparse it as a JavaScript object.
     *
     * @param value - The object to serialize
     * @param options - Optional settings passed to the `stringify` function
     */
    function serialize(value, options) {
        options = options || {};
        return JSON.parse(stringify(value, options));
    }
    EJSON.serialize = serialize;
    /**
     * Deserializes an Extended JSON object into a plain JavaScript object with native/BSON types
     *
     * @param ejson - The Extended JSON object to deserialize
     * @param options - Optional settings passed to the parse method
     */
    function deserialize(ejson, options) {
        options = options || {};
        return parse(JSON.stringify(ejson), options);
    }
    EJSON.deserialize = deserialize;
})(EJSON || (EJSON = {}));
var bsonGlobal = getGlobal();
if (bsonGlobal.Map) {
    bsonGlobal.Map;
}
else {
    // We will return a polyfill
    /** @class */ ((function () {
        function Map(array) {
            if (array === void 0) { array = []; }
            this._keys = [];
            this._values = {};
            for (var i = 0; i < array.length; i++) {
                if (array[i] == null)
                    continue; // skip null and undefined
                var entry = array[i];
                var key = entry[0];
                var value = entry[1];
                // Add the key to the list of keys in order
                this._keys.push(key);
                // Add the key and value to the values dictionary with a point
                // to the location in the ordered keys list
                this._values[key] = { v: value, i: this._keys.length - 1 };
            }
        }
        Map.prototype.clear = function () {
            this._keys = [];
            this._values = {};
        };
        Map.prototype.delete = function (key) {
            var value = this._values[key];
            if (value == null)
                return false;
            // Delete entry
            delete this._values[key];
            // Remove the key from the ordered keys list
            this._keys.splice(value.i, 1);
            return true;
        };
        Map.prototype.entries = function () {
            var _this = this;
            var index = 0;
            return {
                next: function () {
                    var key = _this._keys[index++];
                    return {
                        value: key !== undefined ? [key, _this._values[key].v] : undefined,
                        done: key !== undefined ? false : true
                    };
                }
            };
        };
        Map.prototype.forEach = function (callback, self) {
            self = self || this;
            for (var i = 0; i < this._keys.length; i++) {
                var key = this._keys[i];
                // Call the forEach callback
                callback.call(self, this._values[key].v, key, self);
            }
        };
        Map.prototype.get = function (key) {
            return this._values[key] ? this._values[key].v : undefined;
        };
        Map.prototype.has = function (key) {
            return this._values[key] != null;
        };
        Map.prototype.keys = function () {
            var _this = this;
            var index = 0;
            return {
                next: function () {
                    var key = _this._keys[index++];
                    return {
                        value: key !== undefined ? key : undefined,
                        done: key !== undefined ? false : true
                    };
                }
            };
        };
        Map.prototype.set = function (key, value) {
            if (this._values[key]) {
                this._values[key].v = value;
                return this;
            }
            // Add the key to the list of keys in order
            this._keys.push(key);
            // Add the key and value to the values dictionary with a point
            // to the location in the ordered keys list
            this._values[key] = { v: value, i: this._keys.length - 1 };
            return this;
        };
        Map.prototype.values = function () {
            var _this = this;
            var index = 0;
            return {
                next: function () {
                    var key = _this._keys[index++];
                    return {
                        value: key !== undefined ? _this._values[key].v : undefined,
                        done: key !== undefined ? false : true
                    };
                }
            };
        };
        Object.defineProperty(Map.prototype, "size", {
            get: function () {
                return this._keys.length;
            },
            enumerable: false,
            configurable: true
        });
        return Map;
    })());
}
/**
 * Any integer up to 2^53 can be precisely represented by a double.
 * @internal
 */
var JS_INT_MAX = Math.pow(2, 53);
/**
 * Any integer down to -2^53 can be precisely represented by a double.
 * @internal
 */
var JS_INT_MIN = -Math.pow(2, 53);

// Internal long versions
Long.fromNumber(JS_INT_MAX);
Long.fromNumber(JS_INT_MIN);

/** @internal */
// Default Max Size
var MAXSIZE = 1024 * 1024 * 17;
// Current Internal Temporary Serialization Buffer
buffer_1.alloc(MAXSIZE);

class Categorizer {
  static schema;
  _id;
  _partition;
  name;
  color;
  count = 0;
  children;
  constructor(object, initObjectId = false) {
    this._id = object?._id ? new ObjectId(object._id) : "";
    this._partition = object?._partition || "";
    this.name = object?.name || "";
    this.color = object?.color || "blue";
    this.children = object?.children?.map((child) => new Categorizer(child)) || [];
    if (initObjectId) {
      this._id = new ObjectId();
    }
    return new Proxy(this, {
      set: (target, prop, value) => {
        if (prop === "_id" && value) {
          this._id = new ObjectId(value);
        } else {
          target[prop] = value;
        }
        return true;
      }
    });
  }
  initialize(object) {
    this._id = object._id ? new ObjectId(object._id) : "";
    this._partition = object._partition || "";
    this.name = object.name || "";
    this.color = object.color || "blue";
    this.children = object.children?.map((child) => new Categorizer().initialize(child)) || [];
    return this;
  }
}
class PaperTag extends Categorizer {
  static schema = {
    name: "PaperTag",
    primaryKey: "_id",
    properties: {
      _id: "objectId",
      _partition: "string?",
      name: "string",
      color: "string?",
      count: "int",
      children: "PaperTag[]"
    }
  };
  constructor(object, initObjectId = false) {
    super(object, initObjectId);
  }
}
class PaperFolder extends Categorizer {
  static schema = {
    name: "PaperFolder",
    primaryKey: "_id",
    properties: {
      _id: "objectId",
      _partition: "string?",
      name: "string",
      color: "string?",
      count: "int",
      children: "PaperFolder[]"
    }
  };
  constructor(object, initObjectId = false) {
    super(object, initObjectId);
  }
}

class Feed {
  static schema = {
    name: "Feed",
    primaryKey: "_id",
    properties: {
      _id: "objectId",
      id: "objectId",
      _partition: "string?",
      name: "string",
      count: "int",
      color: "string?",
      url: "string"
    }
  };
  _id;
  id;
  _partition;
  name;
  count;
  color;
  url;
  constructor(object, initObjectId = false) {
    this._id = object?._id ? new ObjectId(object._id) : "";
    this.id = object?._id ? new ObjectId(object._id) : "";
    this.id = this.id ? this.id : this._id;
    this._id = this._id ? this._id : this.id;
    this._partition = object?._partition || "";
    this.name = object?.name || "";
    this.count = object?.count || 0;
    this.color = object?.color;
    this.url = object?.url || "";
    if (initObjectId) {
      this._id = new ObjectId();
      this.id = this._id;
    }
  }
  initialize(object) {
    this._id = object._id ? new ObjectId(object._id) : "";
    this.id = object._id ? new ObjectId(object._id) : "";
    this.id = this.id ? this.id : this._id;
    this._id = this._id ? this._id : this.id;
    this._partition = object._partition || "";
    this.name = object.name || "";
    this.count = object.count || 0;
    this.color = object.color;
    this.url = object.url || "";
    return this;
  }
}

class FeedEntity {
  static schema = {
    name: "FeedEntity",
    primaryKey: "_id",
    properties: {
      id: "objectId",
      _id: "objectId",
      _partition: "string?",
      addTime: "date",
      feed: "Feed",
      feedTime: "date",
      title: "string",
      authors: "string",
      abstract: "string",
      publication: "string",
      pubTime: "string",
      pubType: "int",
      doi: "string",
      arxiv: "string",
      mainURL: "string",
      pages: "string",
      volume: "string",
      number: "string",
      publisher: "string",
      read: "bool"
    }
  };
  _id;
  id;
  _partition;
  addTime;
  feed;
  feedTime;
  title;
  authors;
  abstract;
  publication;
  pubTime;
  pubType;
  doi;
  arxiv;
  mainURL;
  pages;
  volume;
  number;
  publisher;
  read;
  constructor(object, initObjectId = false) {
    this._id = object?._id ? new ObjectId(object?._id) : "";
    this.id = object?.id ? new ObjectId(object?.id) : "";
    this.id = this.id ? this.id : this._id;
    this._id = this._id ? this._id : this.id;
    this._partition = object?._partition || "";
    this.addTime = object?.addTime || /* @__PURE__ */ new Date();
    this.feed = object?.feed || new Feed({}, initObjectId);
    this.feedTime = object?.feedTime || /* @__PURE__ */ new Date();
    this.title = object?.title || "";
    this.authors = object?.authors || "";
    this.abstract = object?.abstract || "";
    this.publication = object?.publication || "";
    this.pubTime = object?.pubTime || "";
    this.pubType = object?.pubType || 0;
    this.doi = object?.doi || "";
    this.arxiv = object?.arxiv || "";
    this.mainURL = object?.mainURL || "";
    this.pages = object?.pages || "";
    this.volume = object?.volume || "";
    this.number = object?.number || "";
    this.publisher = object?.publisher || "";
    this.read = object?.read || false;
    if (initObjectId) {
      this._id = new ObjectId();
      this.id = this._id;
    }
    return new Proxy(this, {
      set: (target, prop, value) => {
        if ((prop === "_id" || prop === "id") && value) {
          this._id = new ObjectId(value);
          this.id = this._id;
        } else {
          target[prop] = value;
        }
        return true;
      }
    });
  }
  initialize(object) {
    this._id = object._id ? new ObjectId(object._id) : "";
    this.id = object._id ? new ObjectId(object._id) : "";
    this.id = this.id ? this.id : this._id;
    this._id = this._id ? this._id : this.id;
    this._partition = object._partition || "";
    this.addTime = object.addTime || /* @__PURE__ */ new Date();
    this.feed = object.feed || new Feed({}, true);
    this.feedTime = object.feedTime || /* @__PURE__ */ new Date();
    this.title = object.title || "";
    this.authors = object.authors || "";
    this.abstract = object.abstract || "";
    this.publication = object.publication || "";
    this.pubTime = object.pubTime || "";
    this.pubType = object.pubType || 0;
    this.doi = object.doi || "";
    this.arxiv = object.arxiv || "";
    this.mainURL = object.mainURL || "";
    this.pages = object.pages || "";
    this.volume = object.volume || "";
    this.number = object.number || "";
    this.publisher = object.publisher || "";
    this.read = object.read || false;
    return this;
  }
  fromPaper(paperEntity) {
    this.title = paperEntity.title;
    this.authors = paperEntity.authors;
    this.publication = paperEntity.publication;
    this.pubTime = paperEntity.pubTime;
    this.pubType = paperEntity.pubType;
    this.doi = paperEntity.doi;
    this.arxiv = paperEntity.arxiv;
    this.mainURL = paperEntity.mainURL;
    this.pages = paperEntity.pages;
    this.volume = paperEntity.volume;
    this.number = paperEntity.number;
    this.publisher = paperEntity.publisher;
  }
}

var dist = {exports: {}};

var main = {};

var mathmlToLatex = {};

var mathmlElementToLatexConverterAdapter = {};

var converters = {};

var math = {};

var mathmlElementToLatexConverter = {};

var hasRequiredMathmlElementToLatexConverter;

function requireMathmlElementToLatexConverter () {
	if (hasRequiredMathmlElementToLatexConverter) return mathmlElementToLatexConverter;
	hasRequiredMathmlElementToLatexConverter = 1;
	Object.defineProperty(mathmlElementToLatexConverter, "__esModule", { value: true });
	mathmlElementToLatexConverter.mathMLElementToLaTeXConverter = void 0;
	var mathml_element_to_latex_converter_adapter_1 = requireMathmlElementToLatexConverterAdapter();
	var mathMLElementToLaTeXConverter = function (mathMLElement) {
	    return new mathml_element_to_latex_converter_adapter_1.MathMLElementToLatexConverterAdapter(mathMLElement).toLatexConverter();
	};
	mathmlElementToLatexConverter.mathMLElementToLaTeXConverter = mathMLElementToLaTeXConverter;
	return mathmlElementToLatexConverter;
}

var normalizeWhitespace = {};

Object.defineProperty(normalizeWhitespace, "__esModule", { value: true });
normalizeWhitespace.normalizeWhiteSpaces = void 0;
var normalizeWhiteSpaces = function (str) {
    return str.replace(/\s+/g, ' ');
};
normalizeWhitespace.normalizeWhiteSpaces = normalizeWhiteSpaces;

var hasRequiredMath;

function requireMath () {
	if (hasRequiredMath) return math;
	hasRequiredMath = 1;
	Object.defineProperty(math, "__esModule", { value: true });
	math.Math = void 0;
	var mathml_element_to_latex_converter_1 = requireMathmlElementToLatexConverter();
	var normalize_whitespace_1 = normalizeWhitespace;
	var Math = /** @class */ (function () {
	    function Math(mathElement) {
	        this._mathmlElement = mathElement;
	    }
	    Math.prototype.convert = function () {
	        var unnormalizedLatex = this._mathmlElement.children
	            .map(function (child) { return mathml_element_to_latex_converter_1.mathMLElementToLaTeXConverter(child); })
	            .map(function (converter) { return converter.convert(); })
	            .join('');
	        return normalize_whitespace_1.normalizeWhiteSpaces(unnormalizedLatex);
	    };
	    return Math;
	}());
	math.Math = Math;
	return math;
}

var mi = {};

var helpers = {};

var wrappers = {};

var bracket = {};

var wrapper = {};

Object.defineProperty(wrapper, "__esModule", { value: true });
wrapper.Wrapper = void 0;
var Wrapper = /** @class */ (function () {
    function Wrapper(open, close) {
        this._open = open;
        this._close = close;
    }
    Wrapper.prototype.wrap = function (str) {
        return this._open + str + this._close;
    };
    return Wrapper;
}());
wrapper.Wrapper = Wrapper;

Object.defineProperty(bracket, "__esModule", { value: true });
bracket.BracketWrapper = void 0;
var wrapper_1$2 = wrapper;
var BracketWrapper = /** @class */ (function () {
    function BracketWrapper() {
        this._open = '{';
        this._close = '}';
    }
    BracketWrapper.prototype.wrap = function (str) {
        return new wrapper_1$2.Wrapper(this._open, this._close).wrap(str);
    };
    return BracketWrapper;
}());
bracket.BracketWrapper = BracketWrapper;

var parenthesis = {};

Object.defineProperty(parenthesis, "__esModule", { value: true });
parenthesis.ParenthesisWrapper = void 0;
var wrapper_1$1 = wrapper;
var ParenthesisWrapper = /** @class */ (function () {
    function ParenthesisWrapper() {
        this._open = '\\left(';
        this._close = '\\right)';
    }
    ParenthesisWrapper.prototype.wrap = function (str) {
        return new wrapper_1$1.Wrapper(this._open, this._close).wrap(str);
    };
    ParenthesisWrapper.prototype.wrapIfMoreThanOneChar = function (str) {
        if (str.length <= 1)
            return str;
        return this.wrap(str);
    };
    return ParenthesisWrapper;
}());
parenthesis.ParenthesisWrapper = ParenthesisWrapper;

var generic = {};

Object.defineProperty(generic, "__esModule", { value: true });
generic.GenericWrapper = void 0;
var wrapper_1 = wrapper;
var GenericWrapper = /** @class */ (function () {
    function GenericWrapper(open, close) {
        this._open = '\\left' + open;
        this._close = '\\right' + close;
    }
    GenericWrapper.prototype.wrap = function (str) {
        return new wrapper_1.Wrapper(this._open, this._close).wrap(str);
    };
    return GenericWrapper;
}());
generic.GenericWrapper = GenericWrapper;

(function (exports) {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.GenericWrapper = exports.ParenthesisWrapper = exports.BracketWrapper = void 0;
	var bracket_1 = bracket;
	Object.defineProperty(exports, "BracketWrapper", { enumerable: true, get: function () { return bracket_1.BracketWrapper; } });
	var parenthesis_1 = parenthesis;
	Object.defineProperty(exports, "ParenthesisWrapper", { enumerable: true, get: function () { return parenthesis_1.ParenthesisWrapper; } });
	var generic_1 = generic;
	Object.defineProperty(exports, "GenericWrapper", { enumerable: true, get: function () { return generic_1.GenericWrapper; } }); 
} (wrappers));

var joinWithManySeparators = {};

Object.defineProperty(joinWithManySeparators, "__esModule", { value: true });
joinWithManySeparators.JoinWithManySeparators = void 0;
var JoinWithManySeparators = /** @class */ (function () {
    function JoinWithManySeparators(separators) {
        this._separators = separators;
    }
    JoinWithManySeparators.join = function (arr, separators) {
        return new JoinWithManySeparators(separators)._join(arr);
    };
    JoinWithManySeparators.prototype._join = function (arr) {
        var _this = this;
        return arr.reduce(function (joinedStr, currentStr, currentIndex, strArr) {
            var separator = currentIndex === strArr.length - 1 ? '' : _this._get(currentIndex);
            return joinedStr + currentStr + separator;
        }, '');
    };
    JoinWithManySeparators.prototype._get = function (index) {
        if (this._separators[index])
            return this._separators[index];
        return this._separators.length > 0 ? this._separators[this._separators.length - 1] : ',';
    };
    return JoinWithManySeparators;
}());
joinWithManySeparators.JoinWithManySeparators = JoinWithManySeparators;

var hasRequiredHelpers;

function requireHelpers () {
	if (hasRequiredHelpers) return helpers;
	hasRequiredHelpers = 1;
	(function (exports) {
		var __createBinding = (commonjsGlobal && commonjsGlobal.__createBinding) || (Object.create ? (function(o, m, k, k2) {
		    if (k2 === undefined) k2 = k;
		    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
		}) : (function(o, m, k, k2) {
		    if (k2 === undefined) k2 = k;
		    o[k2] = m[k];
		}));
		var __exportStar = (commonjsGlobal && commonjsGlobal.__exportStar) || function(m, exports) {
		    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
		};
		Object.defineProperty(exports, "__esModule", { value: true });
		__exportStar(wrappers, exports);
		__exportStar(joinWithManySeparators, exports);
		__exportStar(requireMathmlElementToLatexConverter(), exports);
		__exportStar(normalizeWhitespace, exports); 
	} (helpers));
	return helpers;
}

var syntax = {};

var allMathOperatorsByChar = {};

Object.defineProperty(allMathOperatorsByChar, "__esModule", { value: true });
allMathOperatorsByChar.allMathOperatorsByChar = void 0;
allMathOperatorsByChar.allMathOperatorsByChar = {
    _: '\\underline',
    '&#x23E1;': '\\underbrace',
    '&#x23E0;': '\\overbrace',
    '&#x23DF;': '\\underbrace',
    '&#x23DE;': '\\overbrace',
    '&#x23DD;': '\\underbrace',
    '&#x23DC;': '\\overbrace',
    '&#x23B5;': '\\underbrace',
    '&#x23B4;': '\\overbrace',
    '&#x20DC;': '\\square',
    '&#x20DB;': '\\square',
    '&#x2064;': '',
    '&#x2057;': "''''",
    '&#x203E;': '\\bar',
    '&#x2037;': '```',
    '&#x2036;': '``',
    '&#x2035;': '`',
    '&#x2034;': "'''",
    '&#x2033;': "''",
    '&#x201F;': '``',
    '&#x201E;': ',,',
    '&#x201B;': '`',
    '&#x201A;': ',',
    '&#x302;': '\\hat',
    '&#x2F7;': '\\sim',
    '&#x2DD;': '\\sim',
    '&#x2DC;': '\\sim',
    '&#x2DA;': '\\circ',
    '&#x2D9;': '\\cdot',
    '&#x2D8;': '',
    '&#x2CD;': '\\_',
    '&#x2CB;': 'ˋ',
    '&#x2CA;': 'ˊ',
    '&#x2C9;': 'ˉ',
    '&#x2C7;': '',
    '&#x2C6;': '\\hat',
    '&#xBA;': 'o',
    '&#xB9;': '1',
    '&#xB8;': '¸',
    '&#xB4;': '´',
    '&#xB3;': '3',
    '&#xB2;': '2',
    '&#xB0;': '\\circ',
    '&#xAF;': '\\bar',
    '&#xAA;': 'a',
    '&#xA8;': '\\cdot\\cdot',
    '~': '\\sim',
    '`': '`',
    '^': '\\hat',
    '--': '--',
    '++': '++',
    '&amp;': '\\&',
    '&#x2061;': '',
    '&#x221C;': '\\sqrt[4]{}',
    '&#x221B;': '\\sqrt[3]{}',
    '&#x221A;': '\\sqrt{}',
    '&#x2146;': 'd',
    '&#x2145;': '\\mathbb{D}',
    '?': '?',
    '@': '@',
    '//': '//',
    '!!': '!!',
    '!': '!',
    '&#x266F;': '\\#',
    '&#x266E;': '',
    '&#x266D;': '',
    '&#x2032;': "'",
    '&lt;>': '<>',
    '**': '\\star\\star',
    '&#x2207;': '\\nabla',
    '&#x2202;': '\\partial',
    '&#x2299;': '\\bigodot',
    '&#xAC;': '\\neg',
    '&#x2222;': '\\measuredangle',
    '&#x2221;': '\\measuredangle',
    '&#x2220;': '\\angle',
    '&#xF7;': '\\div',
    '/': '/',
    '&#x2216;': '\\backslash',
    '\\': '\\backslash',
    '%': '\\%',
    '&#x2297;': '\\bigotimes',
    '&#xB7;': '\\cdot',
    '&#x2A3F;': '\\coprod',
    '&#x2A2F;': '\\times',
    '&#x22C5;': '\\cdot',
    '&#x22A1;': '\\boxdot',
    '&#x22A0;': '\\boxtimes',
    '&#x2062;': '',
    '&#x2043;': '-',
    '&#x2022;': '\\cdot',
    '&#xD7;': '\\times',
    '.': '.',
    '*': '\\star',
    '&#x222A;': '\\cup',
    '&#x2229;': '\\cap',
    '&#x2210;': '\\coprod',
    '&#x220F;': '\\prod',
    '&#x2240;': '',
    '&#x2AFF;': '',
    '&#x2AFC;': '\\mid\\mid\\mid',
    '&#x2A09;': '\\times',
    '&#x2A08;': '',
    '&#x2A07;': '',
    '&#x2A06;': '\\sqcup',
    '&#x2A05;': '\\sqcap',
    '&#x2A02;': '\\otimes',
    '&#x2A00;': '\\odot',
    '&#x22C2;': '\\cap',
    '&#x22C1;': '\\vee',
    '&#x22C0;': '\\wedge',
    '&#x2A04;': '\\uplus',
    '&#x2A03;': '\\cup',
    '&#x22C3;': '\\cup',
    '&#x2A1C;': '\\underline{\\int}',
    '&#x2A1B;': '\\overline{\\int}',
    '&#x2A1A;': '\\int',
    '&#x2A19;': '\\int',
    '&#x2A18;': '\\int',
    '&#x2A17;': '\\int',
    '&#x2A16;': '\\oint',
    '&#x2A15;': '\\oint',
    '&#x2A14;': '\\int',
    '&#x2A13;': '\\int',
    '&#x2A12;': '\\int',
    '&#x2A11;': '\\int',
    '&#x2A10;': '\\int',
    '&#x2A0F;': '\\bcancel{\\int}',
    '&#x2A0E;': '',
    '&#x2A0D;': '\\hcancel{\\int}',
    '&#x2A0C;': '\\iiiint',
    '&#x2233;': '\\oint',
    '&#x2232;': '\\oint',
    '&#x2231;': '\\int',
    '&#x2230;': '\\oiint',
    '&#x222F;': '\\oiint',
    '&#x222E;': '\\oint',
    '&#x222B;': '\\int',
    '&#x2A01;': '\\oplus',
    '&#x2298;': '\\oslash',
    '&#x2296;': '\\ominus',
    '&#x2295;': '\\oplus',
    '&#x222D;': '\\iiint',
    '&#x222C;': '\\iint',
    '&#x2A0B;': '',
    '&#x2A0A;': '',
    '&#x2211;': '\\sum',
    '&#x229F;': '\\boxminus',
    '&#x229E;': '\\boxplus',
    '&#x2214;': '\\dot{+}',
    '&#x2213;': '+-',
    '&#x2212;': '-',
    '&#xB1;': '\\pm',
    '-': '-',
    '+': '+',
    '&#x2B46;': '\\Rrightarrow',
    '&#x2B45;': '\\Lleftarrow',
    '&#x29F4;': ':\\rightarrow',
    '&#x29EF;': '',
    '&#x29DF;': '\\bullet-\\bullet',
    '&#x299F;': '\\angle',
    '&#x299E;': '\\measuredangle',
    '&#x299D;': '\\measuredangle',
    '&#x299C;': '\\perp',
    '&#x299B;': '\\measuredangle',
    '&#x299A;': '',
    '&#x2999;': '\\vdots',
    '&#x297F;': '',
    '&#x297E;': '',
    '&#x297D;': '\\prec',
    '&#x297C;': '\\succ',
    '&#x297B;': '\\underset{\\rightarrow}{\\supset}',
    '&#x297A;': '',
    '&#x2979;': '\\underset{\\rightarrow}{\\subset}',
    '&#x2978;': '\\underset{\\rightarrow}{>}',
    '&#x2977;': '',
    '&#x2976;': '\\underset{\\leftarrow}{<}',
    '&#x2975;': '\\underset{\\approx}{\\rightarrow}',
    '&#x2974;': '\\underset{\\sim}{\\rightarrow}',
    '&#x2973;': '\\underset{\\sim}{\\leftarrow}',
    '&#x2972;': '\\overset{\\sim}{\\rightarrow}',
    '&#x2971;': '\\overset{=}{\\rightarrow}',
    '&#x2970;': '',
    '&#x296F;': '',
    '&#x296E;': '',
    '&#x296D;': '\\overline{\\rightharpoondown}',
    '&#x296C;': '\\underline{\\rightharpoonup}',
    '&#x296B;': '\\overline{\\leftharpoondown}',
    '&#x296A;': '\\underline{\\leftharpoonup}',
    '&#x2969;': '\\rightleftharpoons',
    '&#x2968;': '\\rightleftharpoons',
    '&#x2967;': '\\rightleftharpoons',
    '&#x2966;': '\\rightleftharpoons',
    '&#x2965;': '\\Downarrow',
    '&#x2964;': '\\Rightarrow',
    '&#x2963;': '\\Uparrow',
    '&#x2962;': '\\Leftarrow',
    '&#x2961;': '\\downarrow',
    '&#x2960;': '\\uparrow',
    '&#x295F;': '\\rightarrow',
    '&#x295E;': '\\leftarrow',
    '&#x295D;': '\\downarrow',
    '&#x295C;': '\\uparrow',
    '&#x295B;': '\\rightarrow',
    '&#x295A;': '\\leftarrow',
    '&#x2959;': '\\downarrow',
    '&#x2958;': '\\uparrow',
    '&#x2957;': '\\rightarrow',
    '&#x2956;': '\\leftarrow',
    '&#x2955;': '\\downarrow',
    '&#x2954;': '\\uparrow',
    '&#x2953;': '\\rightarrow',
    '&#x2952;': '\\leftarrow',
    '&#x2951;': '\\updownarrow',
    '&#x2950;': '\\leftrightarrow',
    '&#x294F;': '\\updownarrow',
    '&#x294E;': '\\leftrightarrow',
    '&#x294D;': '\\updownarrow',
    '&#x294C;': '\\updownarrow',
    '&#x294B;': '\\leftrightarrow',
    '&#x294A;': '\\leftrightarrow',
    '&#x2949;': '',
    '&#x2948;': '\\leftrightarrow',
    '&#x2947;': '\\nrightarrow',
    '&#x2946;': '',
    '&#x2945;': '',
    '&#x2944;': '\\rightleftarrows',
    '&#x2943;': '\\leftrightarrows',
    '&#x2942;': '\\rightleftarrows',
    '&#x2941;': '\\circlearrowright',
    '&#x2940;': '\\circlearrowleft',
    '&#x293F;': '\\rightarrow',
    '&#x293E;': '\\leftarrow',
    '&#x293D;': '',
    '&#x293C;': '',
    '&#x293B;': '',
    '&#x293A;': '',
    '&#x2939;': '',
    '&#x2938;': '',
    '&#x2937;': '\\Rsh',
    '&#x2936;': '\\Lsh',
    '&#x2935;': '\\downarrow',
    '&#x2934;': '\\uparrow',
    '&#x2933;': '\\leadsto',
    '&#x2932;': '',
    '&#x2931;': '',
    '&#x2930;': '',
    '&#x292F;': '',
    '&#x292E;': '',
    '&#x292D;': '',
    '&#x292C;': '\\times',
    '&#x292B;': '\\times',
    '&#x292A;': '',
    '&#x2929;': '',
    '&#x2928;': '',
    '&#x2927;': '',
    '&#x2926;': '',
    '&#x2925;': '',
    '&#x2924;': '',
    '&#x2923;': '',
    '&#x2922;': '',
    '&#x2921;': '',
    '&#x2920;': '\\mapsto\\cdot',
    '&#x291F;': '\\cdot\\leftarrow',
    '&#x291E;': '\\rightarrow\\cdot',
    '&#x291D;': '\\leftarrow',
    '&#x291C;': '\\rightarrow',
    '&#x291B;': '\\leftarrow',
    '&#x291A;': '\\rightarrow',
    '&#x2919;': '\\leftarrow',
    '&#x2918;': '\\rightarrow',
    '&#x2917;': '\\rightarrow',
    '&#x2916;': '\\rightarrow',
    '&#x2915;': '\\rightarrow',
    '&#x2914;': '\\rightarrow',
    '&#x2913;': '\\downarrow',
    '&#x2912;': '\\uparrow',
    '&#x2911;': '\\rightarrow',
    '&#x2910;': '\\rightarrow',
    '&#x290F;': '\\rightarrow',
    '&#x290E;': '\\leftarrow',
    '&#x290D;': '\\rightarrow',
    '&#x290C;': '\\leftarrow',
    '&#x290B;': '\\Downarrow',
    '&#x290A;': '\\Uparrow',
    '&#x2909;': '\\uparrow',
    '&#x2908;': '\\downarrow',
    '&#x2907;': '\\Rightarrow',
    '&#x2906;': '\\Leftarrow',
    '&#x2905;': '\\mapsto',
    '&#x2904;': '\\nLeftrightarrow',
    '&#x2903;': '\\nRightarrow',
    '&#x2902;': '\\nLeftarrow',
    '&#x2901;': '\\rightsquigarrow',
    '&#x2900;': '\\rightsquigarrow',
    '&#x27FF;': '\\rightsquigarrow',
    '&#x27FE;': '\\Rightarrow',
    '&#x27FD;': '\\Leftarrow',
    '&#x27FC;': '\\mapsto',
    '&#x27FB;': '\\leftarrow',
    '&#x27FA;': '\\Longleftrightarrow',
    '&#x27F9;': '\\Longrightarrow',
    '&#x27F8;': '\\Longleftarrow',
    '&#x27F7;': '\\leftrightarrow',
    '&#x27F6;': '\\rightarrow',
    '&#x27F5;': '\\leftarrow',
    '&#x27F1;': '\\Downarrow',
    '&#x27F0;': '\\Uparrow',
    '&#x22B8;': '\\rightarrow',
    '&#x21FF;': '\\leftrightarrow',
    '&#x21FE;': '\\rightarrow',
    '&#x21FD;': '\\leftarrow',
    '&#x21FC;': '\\nleftrightarrow',
    '&#x21FB;': '\\nrightarrow',
    '&#x21FA;': '\\nleftarrow',
    '&#x21F9;': '\\nleftrightarrow',
    '&#x21F8;': '\\nrightarrow',
    '&#x21F7;': '\\nleftarrow',
    '&#x21F6;': '\\Rrightarrow',
    '&#x21F5;': '',
    '&#x21F4;': '\\rightarrow',
    '&#x21F3;': '\\Updownarrow',
    '&#x21F2;': '\\searrow',
    '&#x21F1;': '\\nwarrow',
    '&#x21F0;': '\\Leftarrow',
    '&#x21EF;': '\\Uparrow',
    '&#x21EE;': '\\Uparrow',
    '&#x21ED;': '\\Uparrow',
    '&#x21EC;': '\\Uparrow',
    '&#x21EB;': '\\Uparrow',
    '&#x21EA;': '\\Uparrow',
    '&#x21E9;': '\\Downarrow',
    '&#x21E8;': '\\Rightarrow',
    '&#x21E7;': '\\Uparrow',
    '&#x21E6;': '\\Leftarrow',
    '&#x21E5;': '\\rightarrow',
    '&#x21E4;': '\\leftarrow',
    '&#x21E3;': '\\downarrow',
    '&#x21E2;': '\\rightarrow',
    '&#x21E1;': '\\uparrow',
    '&#x21E0;': '\\leftarrow',
    '&#x21DF;': '\\downarrow',
    '&#x21DE;': '\\uparrow',
    '&#x21DD;': '\\rightsquigarrow',
    '&#x21DC;': '\\leftarrow',
    '&#x21DB;': '\\Rrightarrow',
    '&#x21DA;': '\\Lleftarrow',
    '&#x21D9;': '\\swarrow',
    '&#x21D8;': '\\searrow',
    '&#x21D7;': '\\nearrow',
    '&#x21D6;': '\\nwarrow',
    '&#x21D5;': '\\Updownarrow',
    '&#x21D4;': '\\Leftrightarrow',
    '&#x21D3;': '\\Downarrow',
    '&#x21D2;': '\\Rightarrow',
    '&#x21D1;': '\\Uparrow',
    '&#x21D0;': '\\Leftarrow',
    '&#x21CF;': '\\nRightarrow',
    '&#x21CE;': '\\nLeftrightarrow',
    '&#x21CD;': '\\nLeftarrow',
    '&#x21CC;': '\\rightleftharpoons',
    '&#x21CB;': '\\leftrightharpoons',
    '&#x21CA;': '\\downdownarrows',
    '&#x21C9;': '\\rightrightarrows',
    '&#x21C8;': '\\upuparrows',
    '&#x21C7;': '\\leftleftarrows',
    '&#x21C6;': '\\leftrightarrows',
    '&#x21C5;': '',
    '&#x21C4;': '\\rightleftarrows',
    '&#x21C3;': '\\downharpoonleft',
    '&#x21C2;': '\\downharpoonright',
    '&#x21C1;': '\\rightharpoondown',
    '&#x21C0;': '\\rightharpoonup',
    '&#x21BF;': '\\upharpoonleft',
    '&#x21BE;': '\\upharpoonright',
    '&#x21BD;': '\\leftharpoondown',
    '&#x21BC;': '\\leftharpoonup',
    '&#x21BB;': '\\circlearrowright',
    '&#x21BA;': '\\circlearrowleft',
    '&#x21B9;': '\\leftrightarrows',
    '&#x21B8;': '\\overline{\\nwarrow}',
    '&#x21B7;': '\\curvearrowright',
    '&#x21B6;': '\\curvearrowleft',
    '&#x21B5;': '\\swarrow',
    '&#x21B4;': '\\searrow',
    '&#x21B3;': '\\Rsh',
    '&#x21B2;': '\\Lsh',
    '&#x21B1;': '\\Rsh',
    '&#x21B0;': '\\Lsh',
    '&#x21AF;': '\\swarrow',
    '&#x21AE;': '',
    '&#x21AD;': '\\leftrightsquigarrow',
    '&#x21AC;': '\\looparrowright',
    '&#x21AB;': '\\looparrowleft',
    '&#x21AA;': '\\hookrightarrow',
    '&#x21A9;': '\\hookleftarrow',
    '&#x21A8;': '\\underline{\\updownarrow}',
    '&#x21A7;': '\\downarrow',
    '&#x21A6;': '\\rightarrowtail',
    '&#x21A5;': '\\uparrow',
    '&#x21A4;': '\\leftarrowtail',
    '&#x21A3;': '\\rightarrowtail',
    '&#x21A2;': '\\leftarrowtail',
    '&#x21A1;': '\\downarrow',
    '&#x21A0;': '\\twoheadrightarrow',
    '&#x219F;': '\\uparrow',
    '&#x219E;': '\\twoheadleftarrow',
    '&#x219D;': '\\nearrow',
    '&#x219C;': '\\nwarrow',
    '&#x219B;': '',
    '&#x219A;': '',
    '&#x2199;': '\\swarrow',
    '&#x2198;': '\\searrow',
    '&#x2197;': '\\nearrow',
    '&#x2196;': '\\nwarrow',
    '&#x2195;': '\\updownarrow',
    '&#x2194;': '\\leftrightarrow',
    '&#x2193;': '\\downarrow',
    '&#x2192;': '\\rightarrow',
    '&#x2191;': '\\uparrow',
    '&#x2190;': '\\leftarrow',
    '|||': '\\left|||\\right.',
    '||': '\\left||\\right.',
    '|': '\\left|\\right.',
    '&#x2AFE;': '',
    '&#x2AFD;': '//',
    '&#x2AFB;': '///',
    '&#x2AFA;': '',
    '&#x2AF9;': '',
    '&#x2AF8;': '',
    '&#x2AF7;': '',
    '&#x2AF6;': '\\vdots',
    '&#x2AF5;': '',
    '&#x2AF4;': '',
    '&#x2AF3;': '',
    '&#x2AF2;': '\\nparallel',
    '&#x2AF1;': '',
    '&#x2AF0;': '',
    '&#x2AEF;': '',
    '&#x2AEE;': '\\bcancel{\\mid}',
    '&#x2AED;': '',
    '&#x2AEC;': '',
    '&#x2AEB;': '',
    '&#x2AEA;': '',
    '&#x2AE9;': '',
    '&#x2AE8;': '\\underline{\\perp}',
    '&#x2AE7;': '\\overline{\\top}',
    '&#x2AE6;': '',
    '&#x2AE5;': '',
    '&#x2AE4;': '',
    '&#x2AE3;': '',
    '&#x2AE2;': '',
    '&#x2AE1;': '',
    '&#x2AE0;': '\\perp',
    '&#x2ADF;': '\\top',
    '&#x2ADE;': '\\dashv',
    '&#x2ADD;&#x338;': '',
    '&#x2ADD;': '',
    '&#x2ADB;': '\\pitchfork',
    '&#x2ADA;': '',
    '&#x2AD9;': '',
    '&#x2AD8;': '',
    '&#x2AD7;': '',
    '&#x2AD6;': '',
    '&#x2AD5;': '',
    '&#x2AD4;': '',
    '&#x2AD3;': '',
    '&#x2AD2;': '',
    '&#x2AD1;': '',
    '&#x2AD0;': '',
    '&#x2ACF;': '',
    '&#x2ACE;': '',
    '&#x2ACD;': '',
    '&#x2ACC;': '\\underset{\\neq}{\\supset}',
    '&#x2ACB;': '\\underset{\\neq}{\\subset}',
    '&#x2ACA;': '\\underset{\\approx}{\\supset}',
    '&#x2AC9;': '\\underset{\\approx}{\\subset}',
    '&#x2AC8;': '\\underset{\\sim}{\\supset}',
    '&#x2AC7;': '\\underset{\\sim}{\\subset}',
    '&#x2AC6;': '\\supseteqq',
    '&#x2AC5;': '\\subseteqq',
    '&#x2AC4;': '\\dot{\\supseteq}',
    '&#x2AC3;': '\\dot{\\subseteq}',
    '&#x2AC2;': '\\underset{\\times}{\\supset}',
    '&#x2AC1;': '\\underset{\\times}{\\subset}',
    '&#x2AC0;': '\\underset{+}{\\supset}',
    '&#x2ABF;': '\\underset{+}{\\subset}',
    '&#x2ABE;': '',
    '&#x2ABD;': '',
    '&#x2ABC;': '\\gg ',
    '&#x2ABB;': '\\ll',
    '&#x2ABA;': '\\underset{\\cancel{\\approx}}{\\succ}',
    '&#x2AB9;': '\\underset{\\cancel{\\approx}}{\\prec}',
    '&#x2AB8;': '\\underset{\\approx}{\\succ}',
    '&#x2AB7;': '\\underset{\\approx}{\\prec}',
    '&#x2AB6;': '\\underset{\\cancel{=}}{\\succ}',
    '&#x2AB5;': '\\underset{\\cancel{=}}{\\prec}',
    '&#x2AB4;': '\\underset{=}{\\succ}',
    '&#x2AB3;': '\\underset{=}{\\prec}',
    '&#x2AB2;': '',
    '&#x2AB1;': '',
    '&#x2AAE;': '',
    '&#x2AAD;': '\\underline{\\hcancel{>}}',
    '&#x2AAC;': '\\underline{\\hcancel{>}}',
    '&#x2AAB;': '\\hcancel{>}',
    '&#x2AAA;': '\\hcancel{<}',
    '&#x2AA9;': '',
    '&#x2AA8;': '',
    '&#x2AA7;': '\\vartriangleright',
    '&#x2AA6;': '\\vartriangleleft',
    '&#x2AA5;': '><',
    '&#x2AA4;': '><',
    '&#x2AA3;': '\\underline{\\ll}',
    '&#x2AA2;&#x338;': '\\cancel{\\gg}',
    '&#x2AA2;': '\\gg',
    '&#x2AA1;&#x338;': '\\cancel{\\ll}',
    '&#x2AA1;': '\\ll',
    '&#x2AA0;': '\\overset{\\sim}{\\geqq}',
    '&#x2A9F;': '\\overset{\\sim}{\\leqq}',
    '&#x2A9E;': '\\overset{\\sim}{>}',
    '&#x2A9D;': '\\overset{\\sim}{<}',
    '&#x2A9C;': '',
    '&#x2A9B;': '',
    '&#x2A9A;': '\\overset{=}{>}',
    '&#x2A99;': '\\overset{=}{<}',
    '&#x2A98;': '',
    '&#x2A97;': '',
    '&#x2A96;': '',
    '&#x2A95;': '',
    '&#x2A94;': '',
    '&#x2A93;': '',
    '&#x2A92;': '\\underset{=}{\\gtrless}',
    '&#x2A91;': '\\underset{=}{\\lessgtr}',
    '&#x2A90;': '\\underset{<}{\\gtrsim}',
    '&#x2A8F;': '\\underset{>}{\\lesssim}',
    '&#x2A8E;': '\\underset{\\simeq}{>}',
    '&#x2A8D;': '\\underset{\\simeq}{<}',
    '&#x2A8C;': '\\gtreqqless',
    '&#x2A8B;': '\\lesseqqgtr',
    '&#x2A8A;': '\\underset{\\cancel{\\approx}}{>}',
    '&#x2A89;': '\\underset{\\approx}{<}',
    '&#x2A86;': '\\underset{\\approx}{>}',
    '&#x2A85;': '\\underset{\\approx}{<}',
    '&#x2A84;': '',
    '&#x2A83;': '',
    '&#x2A82;': '',
    '&#x2A81;': '',
    '&#x2A80;': '',
    '&#x2A7F;': '',
    '&#x2A7E;&#x338;': '\\bcancel{\\geq}',
    '&#x2A7E;': '\\geq',
    '&#x2A7D;&#x338;': '\\bcancel{\\leq}',
    '&#x2A7D;': '\\leq',
    '&#x2A7C;': '',
    '&#x2A7B;': '',
    '&#x2A7A;': '',
    '&#x2A79;': '',
    '&#x2A78;': '\\overset{\\dots}{\\equiv}',
    '&#x2A77;': '',
    '&#x2A76;': '===',
    '&#x2A75;': '==',
    '&#x2A74;': '::=',
    '&#x2A73;': '',
    '&#x2A72;': '\\underset{=}{+}',
    '&#x2A71;': '\\overset{=}{+}',
    '&#x2A70;': '\\overset{\\approx}{=}',
    '&#x2A6F;': '\\overset{\\wedge}{=}',
    '&#x2A6E;': '\\overset{*}{=}',
    '&#x2A6D;': '\\dot{\\approx}',
    '&#x2A6C;': '',
    '&#x2A6B;': '',
    '&#x2A6A;': '\\dot{\\sim}',
    '&#x2A69;': '',
    '&#x2A68;': '',
    '&#x2A67;': '\\dot{\\equiv}',
    '&#x2A66;': '\\underset{\\cdot}{=}',
    '&#x2A65;': '',
    '&#x2A64;': '',
    '&#x2A63;': '\\underset{=}{\\vee}',
    '&#x2A62;': '\\overset{=}{\\vee}',
    '&#x2A61;': 'ul(vv)',
    '&#x2A60;': '\\underset{=}{\\wedge}',
    '&#x2A5F;': '\\underline{\\wedge}',
    '&#x2A5E;': '\\overset{=}{\\wedge}',
    '&#x2A5D;': '\\hcancel{\\vee}',
    '&#x2A5C;': '\\hcancel{\\wedge}',
    '&#x2A5B;': '',
    '&#x2A5A;': '',
    '&#x2A59;': '',
    '&#x2A58;': '\\vee',
    '&#x2A57;': '\\wedge',
    '&#x2A56;': '',
    '&#x2A55;': '',
    '&#x2A54;': '',
    '&#x2A53;': '',
    '&#x2A52;': '\\dot{\\vee}',
    '&#x2A51;': '\\dot{\\wedge}',
    '&#x2A50;': '',
    '&#x2A4F;': '',
    '&#x2A4E;': '',
    '&#x2A4D;': '\\overline{\\cap}',
    '&#x2A4C;': '\\overline{\\cup}',
    '&#x2A4B;': '',
    '&#x2A4A;': '',
    '&#x2A49;': '',
    '&#x2A48;': '',
    '&#x2A47;': '',
    '&#x2A46;': '',
    '&#x2A45;': '',
    '&#x2A44;': '',
    '&#x2A43;': '\\overline{\\cap}',
    '&#x2A42;': '\\overline{\\cup}',
    '&#x2A41;': '',
    '&#x2A40;': '',
    '&#x2A3E;': '',
    '&#x2A3D;': '\\llcorner',
    '&#x2A3C;': '\\lrcorner',
    '&#x2A3B;': '',
    '&#x2A3A;': '',
    '&#x2A39;': '',
    '&#x2A38;': '',
    '&#x2A37;': '',
    '&#x2A36;': '\\hat{\\otimes}',
    '&#x2A35;': '',
    '&#x2A34;': '',
    '&#x2A33;': '',
    '&#x2A32;': '\\underline{\\times}',
    '&#x2A31;': '\\underline{\\times}',
    '&#x2A30;': '\\dot{\\times}',
    '&#x2A2E;': '',
    '&#x2A2D;': '',
    '&#x2A2C;': '',
    '&#x2A2B;': '',
    '&#x2A2A;': '',
    '&#x2A29;': '',
    '&#x2A28;': '',
    '&#x2A27;': '',
    '&#x2A26;': '\\underset{\\sim}{+}',
    '&#x2A25;': '\\underset{\\circ}{+}',
    '&#x2A24;': '\\overset{\\sim}{+}',
    '&#x2A23;': '\\hat{+}',
    '&#x2A22;': '\\dot{+}',
    '&#x2A21;': '\\upharpoonright',
    '&#x2A20;': '>>',
    '&#x2A1F;': '',
    '&#x2A1E;': '\\triangleleft',
    '&#x2A1D;': '\\bowtie',
    '&#x29FF;': '',
    '&#x29FE;': '+',
    '&#x29FB;': '\\hcancel{|||}',
    '&#x29FA;': '\\hcancel{||}',
    '&#x29F9;': '\\backslash',
    '&#x29F8;': '/',
    '&#x29F7;': 'hcancel{\backslash}',
    '&#x29F6;': '',
    '&#x29F5;': '\\backslash',
    '&#x29F2;': '\\Phi',
    '&#x29F1;': '',
    '&#x29F0;': '',
    '&#x29EE;': '',
    '&#x29ED;': '',
    '&#x29EC;': '',
    '&#x29EB;': '\\lozenge',
    '&#x29EA;': '',
    '&#x29E9;': '',
    '&#x29E8;': '',
    '&#x29E7;': '\\ddagger',
    '&#x29E2;': '\\sqcup\\sqcup',
    '&#x29E1;': '',
    '&#x29E0;': '\\square',
    '&#x29DE;': '',
    '&#x29DD;': '',
    '&#x29DC;': '',
    '&#x29DB;': '\\{\\{',
    '&#x29D9;': '\\{',
    '&#x29D8;': '\\}',
    '&#x29D7;': '',
    '&#x29D6;': '',
    '&#x29D5;': '\\bowtie',
    '&#x29D4;': '\\bowtie',
    '&#x29D3;': '\\bowtie',
    '&#x29D2;': '\\bowtie',
    '&#x29D1;': '\\bowtie',
    '&#x29D0;&#x338;': '| \\not\\triangleright',
    '&#x29D0;': '| \\triangleright',
    '&#x29CF;&#x338;': '\\not\\triangleleft |',
    '&#x29CF;': '\\triangleleft |',
    '&#x29CE;': '',
    '&#x29CD;': '\\triangle',
    '&#x29CC;': '',
    '&#x29CB;': '\\underline{\\triangle}',
    '&#x29CA;': '\\dot{\\triangle}',
    '&#x29C9;': '',
    '&#x29C8;': '\\boxed{\\circ}',
    '&#x29C7;': '\\boxed{\\circ}',
    '&#x29C6;': '\\boxed{\\rightarrow}',
    '&#x29C5;': '\\bcancel{\\square}',
    '&#x29C4;': '\\cancel{\\square}',
    '&#x29C3;': '\\odot',
    '&#x29C2;': '\\odot',
    '&#x29BF;': '\\odot',
    '&#x29BE;': '\\odot',
    '&#x29BD;': '\\varnothing',
    '&#x29BC;': '\\oplus',
    '&#x29BB;': '\\otimes',
    '&#x29BA;': '',
    '&#x29B9;': '\\varnothing',
    '&#x29B8;': '\\varnothing',
    '&#x29B7;': '\\ominus',
    '&#x29B6;': '\\ominus',
    '&#x29B5;': '\\ominus',
    '&#x29B4;': '\\vec{\\varnothing}',
    '&#x29B3;': '\\vec{\\varnothing}',
    '&#x29B2;': '\\dot{\\varnothing}',
    '&#x29B1;': '\\overline{\\varnothing}',
    '&#x29B0;': '\\varnothing',
    '&#x29AF;': '',
    '&#x29AE;': '',
    '&#x29AD;': '',
    '&#x29AC;': '',
    '&#x29AB;': '',
    '&#x29AA;': '',
    '&#x29A9;': '',
    '&#x29A8;': '',
    '&#x29A7;': '',
    '&#x29A6;': '',
    '&#x29A5;': '',
    '&#x29A4;': '',
    '&#x29A3;': '',
    '&#x29A2;': '',
    '&#x29A1;': '\\not\\lor',
    '&#x29A0;': '\\bcancel{>}',
    '&#x2982;': ':',
    '&#x2981;': '\\circ',
    '&#x2758;': '|',
    '&#x25B2;': '\\bigtriangleup',
    '&#x22FF;': '\\Epsilon',
    '&#x22FE;': '\\overline{\\ni}',
    '&#x22FD;': '\\overline{\\ni}',
    '&#x22FC;': '\\in',
    '&#x22FB;': '\\in',
    '&#x22FA;': '\\in',
    '&#x22F9;': '\\underline{\\in}',
    '&#x22F8;': '\\underline{\\in}',
    '&#x22F7;': '\\overline{\\in}',
    '&#x22F6;': '\\overline{\\in}',
    '&#x22F5;': '\\dot{\\in}',
    '&#x22F4;': '\\in',
    '&#x22F3;': '\\in',
    '&#x22F2;': '\\in',
    '&#x22F0;': '\\ddots',
    '&#x22E9;': '\\underset{\\sim}{\\succ}',
    '&#x22E8;': '\\underset{\\sim}{\\prec}',
    '&#x22E7;': '\\underset{\\not\\sim}{>}',
    '&#x22E6;': '\\underset{\\not\\sim}{<}',
    '&#x22E5;': '\\not\\sqsupseteq',
    '&#x22E4;': '\\not\\sqsubseteq',
    '&#x22E3;': '\\not\\sqsupseteq',
    '&#x22E2;': '\\not\\sqsubseteq',
    '&#x22E1;': '\\nsucc',
    '&#x22E0;': '\\nprec',
    '&#x22DF;': '\\succ',
    '&#x22DE;': '\\prec',
    '&#x22DD;': '\\overline{>}',
    '&#x22DC;': '\\overline{<}',
    '&#x22DB;': '\\underset{>}{\\leq}',
    '&#x22DA;': '\\underset{<}{\\geq}',
    '&#x22D5;': '\\#',
    '&#x22D3;': '\\cup',
    '&#x22D2;': '\\cap',
    '&#x22D1;': '\\supset',
    '&#x22D0;': '\\subset',
    '&#x22CF;': '\\wedge',
    '&#x22CE;': '\\vee',
    '&#x22CD;': '\\simeq',
    '&#x22C8;': '\\bowtie',
    '&#x22C7;': '\\ast',
    '&#x22C6;': '\\star',
    '&#x22C4;': '\\diamond',
    '&#x22BF;': '\\triangle',
    '&#x22BE;': '\\measuredangle',
    '&#x22BD;': '\\overline{\\lor}',
    '&#x22BC;': '\\overline{\\land}',
    '&#x22BB;': '\\underline{\\lor}',
    '&#x22BA;': '\\top',
    '&#x22B9;': '',
    '&#x22B7;': '\\circ\\multimap',
    '&#x22B6;': '\\circ\\multimap',
    '&#x22B3;': '\\triangleright',
    '&#x22B2;': '\\triangleleft',
    '&#x22B1;': '\\succ',
    '&#x22B0;': '\\prec',
    '&#x22AB;': '|\\models',
    '&#x22AA;': '|\\models',
    '&#x22A7;': '\\models',
    '&#x22A6;': '\\vdash',
    '&#x229D;': '\\ominus',
    '&#x229C;': '\\ominus',
    '&#x229B;': '\\odot',
    '&#x229A;': '\\odot',
    '&#x2294;': '\\sqcup',
    '&#x2293;': '\\sqcap',
    '&#x2292;': '\\sqsupseteq',
    '&#x2291;': '\\sqsubseteq',
    '&#x2290;&#x338;': '\\not\\sqsupset',
    '&#x2290;': '\\sqsupset',
    '&#x228F;&#x338;': '\\not\\sqsubset',
    '&#x228F;': '\\sqsubset',
    '&#x228E;': '\\cup',
    '&#x228D;': '\\cup',
    '&#x228C;': '\\cup',
    '&#x227F;&#x338;': '\\not\\succsim',
    '&#x227F;': '\\succsim',
    '&#x227E;': '\\precsim',
    '&#x2279;': '\\not\\overset{>}{<}',
    '&#x2278;': '\\not\\overset{>}{<}',
    '&#x2277;': '\\overset{>}{<}',
    '&#x2276;': '\\overset{<}{>}',
    '&#x2275;': '\\not\\geg',
    '&#x2274;': '\\not\\leq',
    '&#x2273;': '\\geg',
    '&#x2272;': '\\leq',
    '&#x226C;': '',
    '&#x2267;': '\\geg',
    '&#x2266;&#x338;': '\\not\\leq',
    '&#x2266;': '\\leq',
    '&#x2263;': '\\overset{=}{=} ',
    '&#x225E;': '\\overset{m}{=} ',
    '&#x225D;': '\\overset{def}{=}',
    '&#x2258;': '=',
    '&#x2256;': '=',
    '&#x2255;': '=:',
    '&#x2253;': '\\doteq',
    '&#x2252;': '\\doteq',
    '&#x2251;': '\\doteq',
    '&#x2250;': '\\doteq',
    '&#x224F;&#x338;': '',
    '&#x224F;': '',
    '&#x224E;&#x338;': '',
    '&#x224E;': '',
    '&#x224C;': '\\approx',
    '&#x224B;': '\\approx',
    '&#x224A;': '\\approx',
    '&#x2242;&#x338;': '\\neq',
    '&#x2242;': '=',
    '&#x223F;': '\\sim',
    '&#x223E;': '\\infty',
    '&#x223D;&#x331;': '\\sim',
    '&#x223D;': '\\sim',
    '&#x223B;': '\\sim',
    '&#x223A;': ':-:',
    '&#x2239;': '-:',
    '&#x2238;': '\\bot',
    '&#x2237;': '::',
    '&#x2236;': ':',
    '&#x2223;': '|',
    '&#x221F;': '\\llcorner',
    '&#x2219;': '\\cdot',
    '&#x2218;': '\\circ',
    '&#x2217;': '*',
    '&#x2215;': '/',
    '&#x220E;': '\\square',
    '&#x220D;': '\\ni',
    '&#x220A;': '\\in',
    '&#x2206;': '\\Delta',
    '&#x2044;': '/',
    '&#x2AB0;&#x338;': '\\nsucceq',
    '&#x2AB0;': '\\succeq',
    '&#x2AAF;&#x338;': '\\npreceq',
    '&#x2AAF;': '\\preceq',
    '&#x2A88;': '\\ngeqslant',
    '&#x2A87;': '\\nleqslant',
    '&#x29F3;': '\\Phi',
    '&#x29E6;': '\\models',
    '&#x29E5;': '\\not\\equiv',
    '&#x29E4;': '\\approx\\neq',
    '&#x29E3;': '\\neq',
    '&#x29C1;': '\\circle',
    '&#x29C0;': '\\circle',
    '&#x25E6;': '\\circle',
    '&#x25D7;': '\\circle',
    '&#x25D6;': '\\circle',
    '&#x25CF;': '\\circle',
    '&#x25CE;': '\\circledcirc',
    '&#x25CD;': '\\circledcirc',
    '&#x25CC;': '\\circledcirc',
    '&#x25C9;': '\\circledcirc',
    '&#x25C8;': '\\diamond',
    '&#x25C7;': '\\diamond',
    '&#x25C6;': '\\diamond',
    '&#x25C5;': '\\triangleleft',
    '&#x25C4;': '\\triangleleft',
    '&#x25C3;': '\\triangleleft',
    '&#x25C2;': '\\triangleleft',
    '&#x25C1;': '\\triangleleft',
    '&#x25C0;': '\\triangleleft',
    '&#x25BF;': '\\triangledown',
    '&#x25BE;': '\\triangledown',
    '&#x25BD;': '\\triangledown',
    '&#x25BC;': '\\triangledown',
    '&#x25B9;': '\\triangleright',
    '&#x25B8;': '\\triangleright',
    '&#x25B7;': '\\triangleright',
    '&#x25B6;': '\\triangleright',
    '&#x25B5;': '\\triangle',
    '&#x25B4;': '\\triangle',
    '&#x25B3;': '\\triangle',
    '&#x25B1;': '\\square',
    '&#x25B0;': '\\square',
    '&#x25AF;': '\\square',
    '&#x25AE;': '\\square',
    '&#x25AD;': '\\square',
    '&#x25AB;': '\\square',
    '&#x25AA;': '\\square',
    '&#x25A1;': '\\square',
    '&#x25A0;': '\\square',
    '&#x22ED;': '\\not\\triangleright',
    '&#x22EC;': '\\not\\triangleleft',
    '&#x22EB;': '\\not\\triangleright',
    '&#x22EA;': '\\not\\triangleleft',
    '&#x22D9;': '\\ggg',
    '&#x22D8;': '\\lll',
    '&#x22D7;': '*>',
    '&#x22D6;': '<*',
    '&#x22D4;': '\\pitchfork',
    '&#x22CC;': '',
    '&#x22CB;': '',
    '&#x22CA;': '\\rtimes',
    '&#x22C9;': '\\ltimes',
    '&#x22B5;': '\\triangleright',
    '&#x22B4;': '',
    '&#x22A5;': '\\bot',
    '&#x2281;': '\\nsucc',
    '&#x2280;': '\\preceq',
    '&#x227D;': '\\succeq',
    '&#x227C;': '\\preceq',
    '&#x227B;': '\\succ',
    '&#x227A;': '\\prec',
    '&#x2271;': '\\geq/',
    '&#x2270;': '\\leq/',
    '&#x226D;': '\\neq',
    '&#x226B;&#x338;': '\\not\\gg',
    '&#x226B;': '\\gg',
    '&#x226A;&#x338;': '\\not\\ll',
    '&#x226A;': '\\ll',
    '&#x2269;': '\\ngeqslant',
    '&#x2268;': '\\nleqslant',
    '&#x2261;': '\\equiv',
    '&#x225F;': '\\doteq',
    '&#x225C;': '\\triangleq',
    '&#x225B;': '\\doteq',
    '&#x225A;': '\\triangleq',
    '&#x2259;': '\\triangleq',
    '&#x2257;': '\\doteq',
    '&#x2254;': ':=',
    '&#x224D;': '\\asymp',
    '&#x2247;': '\\ncong',
    '&#x2246;': '\\ncong',
    '&#x2245;': '\\cong',
    '&#x2244;': '\\not\\simeq',
    '&#x2243;': '\\simeq',
    '&#x2241;': '\\not\\sim',
    '&#x2226;': '\\not\\parallel',
    '&#x2225;': '\\parallel',
    '&#x2224;': '\\not|',
    '&#x221D;': '\\propto',
    '==': '==',
    '=': '=',
    ':=': ':=',
    '/=': '=',
    '-=': '-=',
    '+=': '+=',
    '*=': '*=',
    '!=': '!=',
    '&#x2260;': '\\neq',
    '&#x2262;': '\\equiv /',
    '&#x2249;': '\\approx /',
    '&#x223C;': 'sim',
    '&#x2248;': '\\approx',
    '&#x226E;': '</',
    '&lt;': '<',
    '&#x226F;': '>/',
    '>=': '>=',
    '>': '>',
    '&#x2265;': '\\geq',
    '&#x2264;': '\\leq',
    '&lt;=': '<=',
    '&#x228B;': '\\supsetneq',
    '&#x228A;': '\\subsetneq',
    '&#x2289;': '\\nsupseteq',
    '&#x2288;': '\\nsubseteq',
    '&#x2287;': '\\supseteq',
    '&#x2286;': '\\subseteq',
    '&#x2285;': '\\not\\supset',
    '&#x2284;': '\\not\\subset',
    '&#x2283;&#x20D2;': '\\supset |',
    '&#x2283;': '\\supset',
    '&#x2282;&#x20D2;': '\\subset |',
    '&#x2282;': '\\subset',
    '&#x220C;': '\\not\\in',
    '&#x2209;': '\\notin',
    '&#x2208;': '\\in',
    '&#x2201;': 'C',
    '&#x2204;': '\\nexists',
    '&#x2203;': '\\exists',
    '&#x2200;': '\\forall',
    '&#x2227;': '\\land',
    '&amp;&amp;': '\\&\\&',
    '&#x2228;': '\\lor',
    '&#x22AF;': '\\cancel{\\vDash}',
    '&#x22AE;': '\\cancel{\\Vdash}',
    '&#x22AD;': '\\nvDash',
    '&#x22AC;': '\\nvDash',
    '&#x22A9;': '\\Vdash',
    '&#x22A8;': '\\vDash',
    '&#x22A4;': '\\top',
    '&#x22A3;': '\\dashv',
    '&#x22A2;': '\\vdash',
    '&#x220B;': '\\ni',
    '&#x22F1;': '\\ddots',
    '&#x22EF;': '\\hdots',
    '&#x22EE;': '\\vdots',
    '&#x2026;': '\\hdots',
    '&#x3F6;': '\\ni',
    ':': ':',
    '...': '\\cdots',
    '..': '..',
    '->': '->',
    '&#x2235;': '\\because',
    '&#x2234;': '\\therefore ',
    '&#x2063;': '',
    ',': ',',
    ';': ';',
    '&#x29FD;': '\\}',
    '&#x29FC;': '\\{',
    '&#x2998;': '\\]',
    '&#x2997;': '\\[',
    '&#x2996;': '\\ll',
    '&#x2995;': '\\gg',
    '&#x2994;': '\\gg',
    '&#x2993;': '\\ll',
    '&#x2992;': '\\gg',
    '&#x2991;': '\\ll',
    '&#x2990;': '\\]',
    '&#x298F;': '\\]',
    '&#x298E;': '\\]',
    '&#x298D;': '\\[',
    '&#x298C;': '\\[',
    '&#x298B;': '\\]',
    '&#x298A;': '\\triangleright',
    '&#x2989;': '\\triangleleft',
    '&#x2988;': '|\\)',
    '&#x2987;': '\\(|',
    '&#x2986;': '|\\)',
    '&#x2985;': '\\(\\(',
    '&#x2984;': '|\\}',
    '&#x2983;': '\\{|',
    '&#x2980;': '\\||',
    '&#x27EF;': '\\left. \\right]',
    '&#x27EE;': '\\left[ \\right.',
    '&#x27ED;': '\\left. \\right]]',
    '&#x27EC;': '\\left[[ \\right.',
    '&#x27EB;': '\\gg',
    '&#x27EA;': '\\ll',
    '&#x27E9;': '\\rangle',
    '&#x27E8;': '\\langle',
    '&#x27E7;': '\\left. \\right]]',
    '&#x27E6;': '\\left[[ \\right.',
    '&#x2773;': '\\left.\\right)',
    '&#x2772;': '\\left(\\right.',
    '&#x232A;': '\\rangle',
    '&#x2329;': '\\langle',
    '&#x230B;': '\\rfloor',
    '&#x230A;': '\\lfloor',
    '&#x2309;': '\\rceil',
    '&#x2308;': '\\lceil',
    '&#x2016;': '\\parallel',
    '}': '\\left.\\right}',
    '{': '\\left{\\right.',
    ']': '\\left]\\right.',
    '[': '\\left[\\right.',
    ')': '\\left.\\right)',
    '(': '\\left(\\right.',
    '&#x201D;': '"',
    '&#x201C;': '``',
    '&#x2019;': "'",
    '&#x2018;': '`',
    '%CE%B1': '\\alpha',
    '%CE%B2': '\\beta',
    '%CE%B3': '\\gamma',
    '%CE%93': '\\Gamma',
    '%CE%B4': '\\delta',
    '%CE%94': '\\Delta',
    '%CF%B5': '\\epsilon',
    '%CE%B6': '\\zeta',
    '%CE%B7': '\\eta',
    '%CE%B8': '\\theta',
    '%CE%98': '\\Theta',
    '%CE%B9': '\\iota',
    '%CE%BA': '\\kappa',
    '%CE%BB': '\\lambda',
    '%CE%BC': '\\mu',
    '%CE%BD': '\\nu',
    '%CE%BF': '\\omicron',
    '%CF%80': '\\pi',
    '%CE%A0': '\\Pi',
    '%CF%81': '\\pho',
    '%CF%83': '\\sigma',
    '%CE%A3': '\\Sigma',
    '%CF%84': '\\tau',
    '%CF%85': '\\upsilon',
    '%CE%A5': '\\Upsilon',
    '%CF%95': '\\phi',
    '%CE%A6': '\\Phi',
    '%CF%87': '\\chi',
    '%CF%88': '\\psi',
    '%CE%A8': '\\Psi',
    '%CF%89': '\\omega',
    '%CE%A9': '\\Omega',
};

var allMathOperatorsByGlyph = {};

Object.defineProperty(allMathOperatorsByGlyph, "__esModule", { value: true });
allMathOperatorsByGlyph.allMathOperatorsByGlyph = void 0;
allMathOperatorsByGlyph.allMathOperatorsByGlyph = {
    _: '\\underline',
    '⏡': '\\underbrace',
    '⏠': '\\overbrace',
    '⏟': '\\underbrace',
    '⏞': '\\overbrace',
    '⏝': '\\underbrace',
    '⏜': '\\overbrace',
    '⎵': '\\underbrace',
    '⎴': '\\overbrace',
    '⃜': '\\square',
    '⃛': '\\square',
    '⁤': '',
    '⁗': "''''",
    '‾': '\\bar',
    '‷': '```',
    '‶': '``',
    '‵': '`',
    '‴': "'''",
    '″': "''",
    '‟': '``',
    '„': ',,',
    '‛': '`',
    '‚': ',',
    '^': '\\hat',
    '˷': '\\sim',
    '˝': '\\sim',
    '˜': '\\sim',
    '˚': '\\circ',
    '˙': '\\cdot',
    '˘': '',
    ˍ: '\\_',
    ˋ: 'ˋ',
    ˊ: 'ˊ',
    ˉ: 'ˉ',
    ˇ: '',
    ˆ: '\\hat',
    º: 'o',
    '¹': '1',
    '¸': '¸',
    '´': '´',
    '³': '3',
    '²': '2',
    '°': '\\circ',
    '¯': '\\bar',
    ª: 'a',
    '¨': '\\cdot\\cdot',
    '~': '\\sim',
    '`': '`',
    '--': '--',
    '++': '++',
    '&': '\\&',
    '∜': '\\sqrt[4]{}',
    '∛': '\\sqrt[3]{}',
    '√': '\\sqrt{}',
    ⅆ: 'd',
    ⅅ: '\\mathbb{D}',
    '?': '?',
    '@': '@',
    '//': '//',
    '!!': '!!',
    '!': '!',
    '♯': '\\#',
    '♮': '',
    '♭': '',
    '′': "'",
    '<>': '<>',
    '**': '\\star\\star',
    '∇': '\\nabla',
    '∂': '\\partial',
    '⊙': '\\bigodot',
    '¬': '\\neg',
    '∢': '\\measuredangle',
    '∡': '\\measuredangle',
    '∠': '\\angle',
    '÷': '\\div',
    '/': '/',
    '∖': '\\backslash',
    '\\': '\\backslash',
    '%': '\\%',
    '⊗': '\\bigotimes',
    '·': '\\cdot',
    '⨿': '\\coprod',
    '⨯': '\\times',
    '⋅': '\\cdot',
    '⊡': '\\boxdot',
    '⊠': '\\boxtimes',
    '⁢': '',
    '⁃': '-',
    '•': '\\cdot',
    '×': '\\times',
    '.': '.',
    '*': '\\star',
    '∪': '\\cup',
    '∩': '\\cap',
    '∐': '\\coprod',
    '∏': '\\prod',
    '≀': '',
    '⫿': '',
    '⫼': '\\mid\\mid\\mid',
    '⨉': '\\times',
    '⨈': '',
    '⨇': '',
    '⨆': '\\sqcup',
    '⨅': '\\sqcap',
    '⨂': '\\otimes',
    '⨀': '\\odot',
    '⋂': '\\cap',
    '⋁': '\\vee',
    '⋀': '\\wedge',
    '⨄': '\\uplus',
    '⨃': '\\cup',
    '⋃': '\\cup',
    '⨜': '\\underline{\\int}',
    '⨛': '\\overline{\\int}',
    '⨚': '\\int',
    '⨙': '\\int',
    '⨘': '\\int',
    '⨗': '\\int',
    '⨖': '\\oint',
    '⨕': '\\oint',
    '⨔': '\\int',
    '⨓': '\\int',
    '⨒': '\\int',
    '⨑': '\\int',
    '⨐': '\\int',
    '⨏': '\\bcancel{\\int}',
    '⨎': '',
    '⨍': '\\hcancel{\\int}',
    '⨌': '\\iiiint',
    '∳': '\\oint',
    '∲': '\\oint',
    '∱': '\\int',
    '∰': '\\oiint',
    '∯': '\\oiint',
    '∮': '\\oint',
    '∫': '\\int',
    '⨁': '\\oplus',
    '⊘': '\\oslash',
    '⊖': '\\ominus',
    '⊕': '\\oplus',
    '∭': '\\iiint',
    '∬': '\\iint',
    '⨋': '',
    '⨊': '',
    '∑': '\\sum',
    '⊟': '\\boxminus',
    '⊞': '\\boxplus',
    '∔': '\\dot{+}',
    '∓': '+-',
    '−': '-',
    '±': '\\pm',
    '-': '-',
    '+': '+',
    '⭆': '\\Rrightarrow',
    '⭅': '\\Lleftarrow',
    '⧴': ':\\rightarrow',
    '⧯': '',
    '⧟': '\\bullet-\\bullet',
    '⦟': '\\angle',
    '⦞': '\\measuredangle',
    '⦝': '\\measuredangle',
    '⦜': '\\perp',
    '⦛': '\\measuredangle',
    '⦚': '',
    '⦙': '\\vdots',
    '⥿': '',
    '⥾': '',
    '⥽': '\\prec',
    '⥼': '\\succ',
    '⥻': '\\underset{\\rightarrow}{\\supset}',
    '⥺': '',
    '⥹': '\\underset{\\rightarrow}{\\subset}',
    '⥸': '\\underset{\\rightarrow}{>}',
    '⥷': '',
    '⥶': '\\underset{\\leftarrow}{<}',
    '⥵': '\\underset{\\approx}{\\rightarrow}',
    '⥴': '\\underset{\\sim}{\\rightarrow}',
    '⥳': '\\underset{\\sim}{\\leftarrow}',
    '⥲': '\\overset{\\sim}{\\rightarrow}',
    '⥱': '\\overset{=}{\\rightarrow}',
    '⥰': '',
    '⥯': '',
    '⥮': '',
    '⥭': '\\overline{\\rightharpoondown}',
    '⥬': '\\underline{\\rightharpoonup}',
    '⥫': '\\overline{\\leftharpoondown}',
    '⥪': '\\underline{\\leftharpoonup}',
    '⥩': '\\rightleftharpoons',
    '⥨': '\\rightleftharpoons',
    '⥧': '\\rightleftharpoons',
    '⥦': '\\rightleftharpoons',
    '⥥': '\\Downarrow',
    '⥤': '\\Rightarrow',
    '⥣': '\\Uparrow',
    '⥢': '\\Leftarrow',
    '⥡': '\\downarrow',
    '⥠': '\\uparrow',
    '⥟': '\\rightarrow',
    '⥞': '\\leftarrow',
    '⥝': '\\downarrow',
    '⥜': '\\uparrow',
    '⥛': '\\rightarrow',
    '⥚': '\\leftarrow',
    '⥙': '\\downarrow',
    '⥘': '\\uparrow',
    '⥗': '\\rightarrow',
    '⥖': '\\leftarrow',
    '⥕': '\\downarrow',
    '⥔': '\\uparrow',
    '⥓': '\\rightarrow',
    '⥒': '\\leftarrow',
    '⥑': '\\updownarrow',
    '⥐': '\\leftrightarrow',
    '⥏': '\\updownarrow',
    '⥎': '\\leftrightarrow',
    '⥍': '\\updownarrow',
    '⥌': '\\updownarrow',
    '⥋': '\\leftrightarrow',
    '⥊': '\\leftrightarrow',
    '⥉': '',
    '⥈': '\\leftrightarrow',
    '⥇': '\\nrightarrow',
    '⥆': '',
    '⥅': '',
    '⥄': '\\rightleftarrows',
    '⥃': '\\leftrightarrows',
    '⥂': '\\rightleftarrows',
    '⥁': '\\circlearrowright',
    '⥀': '\\circlearrowleft',
    '⤿': '\\rightarrow',
    '⤾': '\\leftarrow',
    '⤽': '',
    '⤼': '',
    '⤻': '',
    '⤺': '',
    '⤹': '',
    '⤸': '',
    '⤷': '\\Rsh',
    '⤶': '\\Lsh',
    '⤵': '\\downarrow',
    '⤴': '\\uparrow',
    '⤳': '\\leadsto',
    '⤲': '',
    '⤱': '',
    '⤰': '',
    '⤯': '',
    '⤮': '',
    '⤭': '',
    '⤬': '\\times',
    '⤫': '\\times',
    '⤪': '',
    '⤩': '',
    '⤨': '',
    '⤧': '',
    '⤦': '',
    '⤥': '',
    '⤤': '',
    '⤣': '',
    '⤢': '',
    '⤡': '',
    '⤠': '\\mapsto\\cdot',
    '⤟': '\\cdot\\leftarrow',
    '⤞': '\\rightarrow\\cdot',
    '⤝': '\\leftarrow',
    '⤜': '\\rightarrow',
    '⤛': '\\leftarrow',
    '⤚': '\\rightarrow',
    '⤙': '\\leftarrow',
    '⤘': '\\rightarrow',
    '⤗': '\\rightarrow',
    '⤖': '\\rightarrow',
    '⤕': '\\rightarrow',
    '⤔': '\\rightarrow',
    '⤓': '\\downarrow',
    '⤒': '\\uparrow',
    '⤑': '\\rightarrow',
    '⤐': '\\rightarrow',
    '⤏': '\\rightarrow',
    '⤎': '\\leftarrow',
    '⤍': '\\rightarrow',
    '⤌': '\\leftarrow',
    '⤋': '\\Downarrow',
    '⤊': '\\Uparrow',
    '⤉': '\\uparrow',
    '⤈': '\\downarrow',
    '⤇': '\\Rightarrow',
    '⤆': '\\Leftarrow',
    '⤅': '\\mapsto',
    '⤄': '\\nLeftrightarrow',
    '⤃': '\\nRightarrow',
    '⤂': '\\nLeftarrow',
    '⤁': '\\rightsquigarrow',
    '⤀': '\\rightsquigarrow',
    '⟿': '\\rightsquigarrow',
    '⟾': '\\Rightarrow',
    '⟽': '\\Leftarrow',
    '⟼': '\\mapsto',
    '⟻': '\\leftarrow',
    '⟺': '\\Longleftrightarrow',
    '⟹': '\\Longrightarrow',
    '⟸': '\\Longleftarrow',
    '⟷': '\\leftrightarrow',
    '⟶': '\\rightarrow',
    '⟵': '\\leftarrow',
    '⟱': '\\Downarrow',
    '⟰': '\\Uparrow',
    '⊸': '\\rightarrow',
    '⇿': '\\leftrightarrow',
    '⇾': '\\rightarrow',
    '⇽': '\\leftarrow',
    '⇼': '\\nleftrightarrow',
    '⇻': '\\nrightarrow',
    '⇺': '\\nleftarrow',
    '⇹': '\\nleftrightarrow',
    '⇸': '\\nrightarrow',
    '⇷': '\\nleftarrow',
    '⇶': '\\Rrightarrow',
    '⇵': '',
    '⇴': '\\rightarrow',
    '⇳': '\\Updownarrow',
    '⇲': '\\searrow',
    '⇱': '\\nwarrow',
    '⇰': '\\Leftarrow',
    '⇯': '\\Uparrow',
    '⇮': '\\Uparrow',
    '⇭': '\\Uparrow',
    '⇬': '\\Uparrow',
    '⇫': '\\Uparrow',
    '⇪': '\\Uparrow',
    '⇩': '\\Downarrow',
    '⇨': '\\Rightarrow',
    '⇧': '\\Uparrow',
    '⇦': '\\Leftarrow',
    '⇥': '\\rightarrow',
    '⇤': '\\leftarrow',
    '⇣': '\\downarrow',
    '⇢': '\\rightarrow',
    '⇡': '\\uparrow',
    '⇠': '\\leftarrow',
    '⇟': '\\downarrow',
    '⇞': '\\uparrow',
    '⇝': '\\rightsquigarrow',
    '⇜': '\\leftarrow',
    '⇛': '\\Rrightarrow',
    '⇚': '\\Lleftarrow',
    '⇙': '\\swarrow',
    '⇘': '\\searrow',
    '⇗': '\\nearrow',
    '⇖': '\\nwarrow',
    '⇕': '\\Updownarrow',
    '⇔': '\\Leftrightarrow',
    '⇓': '\\Downarrow',
    '⇒': '\\Rightarrow',
    '⇑': '\\Uparrow',
    '⇐': '\\Leftarrow',
    '⇏': '\\nRightarrow',
    '⇎': '\\nLeftrightarrow',
    '⇍': '\\nLeftarrow',
    '⇌': '\\rightleftharpoons',
    '⇋': '\\leftrightharpoons',
    '⇊': '\\downdownarrows',
    '⇉': '\\rightrightarrows',
    '⇈': '\\upuparrows',
    '⇇': '\\leftleftarrows',
    '⇆': '\\leftrightarrows',
    '⇅': '',
    '⇄': '\\rightleftarrows',
    '⇃': '\\downharpoonleft',
    '⇂': '\\downharpoonright',
    '⇁': '\\rightharpoondown',
    '⇀': '\\rightharpoonup',
    '↿': '\\upharpoonleft',
    '↾': '\\upharpoonright',
    '↽': '\\leftharpoondown',
    '↼': '\\leftharpoonup',
    '↻': '\\circlearrowright',
    '↺': '\\circlearrowleft',
    '↹': '\\leftrightarrows',
    '↸': '\\overline{\\nwarrow}',
    '↷': '\\curvearrowright',
    '↶': '\\curvearrowleft',
    '↵': '\\swarrow',
    '↴': '\\searrow',
    '↳': '\\Rsh',
    '↲': '\\Lsh',
    '↱': '\\Rsh',
    '↰': '\\Lsh',
    '↯': '\\swarrow',
    '↮': '',
    '↭': '\\leftrightsquigarrow',
    '↬': '\\looparrowright',
    '↫': '\\looparrowleft',
    '↪': '\\hookrightarrow',
    '↩': '\\hookleftarrow',
    '↨': '\\underline{\\updownarrow}',
    '↧': '\\downarrow',
    '↦': '\\rightarrowtail',
    '↥': '\\uparrow',
    '↤': '\\leftarrowtail',
    '↣': '\\rightarrowtail',
    '↢': '\\leftarrowtail',
    '↡': '\\downarrow',
    '↠': '\\twoheadrightarrow',
    '↟': '\\uparrow',
    '↞': '\\twoheadleftarrow',
    '↝': '\\nearrow',
    '↜': '\\nwarrow',
    '↛': '',
    '↚': '',
    '↙': '\\swarrow',
    '↘': '\\searrow',
    '↗': '\\nearrow',
    '↖': '\\nwarrow',
    '↕': '\\updownarrow',
    '↔': '\\leftrightarrow',
    '↓': '\\downarrow',
    '→': '\\rightarrow',
    '↑': '\\uparrow',
    '←': '\\leftarrow',
    '|||': '\\left|||\\right.',
    '||': '\\left||\\right.',
    '|': '\\left|\\right.',
    '⫾': '',
    '⫽': '//',
    '⫻': '///',
    '⫺': '',
    '⫹': '',
    '⫸': '',
    '⫷': '',
    '⫶': '\\vdots',
    '⫵': '',
    '⫴': '',
    '⫳': '',
    '⫲': '\\nparallel',
    '⫱': '',
    '⫰': '',
    '⫯': '',
    '⫮': '\\bcancel{\\mid}',
    '⫭': '',
    '⫬': '',
    '⫫': '',
    '⫪': '',
    '⫩': '',
    '⫨': '\\underline{\\perp}',
    '⫧': '\\overline{\\top}',
    '⫦': '',
    '⫥': '',
    '⫤': '',
    '⫣': '',
    '⫢': '',
    '⫡': '',
    '⫠': '\\perp',
    '⫟': '\\top',
    '⫞': '\\dashv',
    '⫝̸': '',
    '⫝': '',
    '⫛': '\\pitchfork',
    '⫚': '',
    '⫙': '',
    '⫘': '',
    '⫗': '',
    '⫖': '',
    '⫕': '',
    '⫔': '',
    '⫓': '',
    '⫒': '',
    '⫑': '',
    '⫐': '',
    '⫏': '',
    '⫎': '',
    '⫍': '',
    '⫌': '\\underset{\\neq}{\\supset}',
    '⫋': '\\underset{\\neq}{\\subset}',
    '⫊': '\\underset{\\approx}{\\supset}',
    '⫉': '\\underset{\\approx}{\\subset}',
    '⫈': '\\underset{\\sim}{\\supset}',
    '⫇': '\\underset{\\sim}{\\subset}',
    '⫆': '\\supseteqq',
    '⫅': '\\subseteqq',
    '⫄': '\\dot{\\supseteq}',
    '⫃': '\\dot{\\subseteq}',
    '⫂': '\\underset{\\times}{\\supset}',
    '⫁': '\\underset{\\times}{\\subset}',
    '⫀': '\\underset{+}{\\supset}',
    '⪿': '\\underset{+}{\\subset}',
    '⪾': '',
    '⪽': '',
    '⪼': '\\gg ',
    '⪻': '\\ll',
    '⪺': '\\underset{\\cancel{\\approx}}{\\succ}',
    '⪹': '\\underset{\\cancel{\\approx}}{\\prec}',
    '⪸': '\\underset{\\approx}{\\succ}',
    '⪷': '\\underset{\\approx}{\\prec}',
    '⪶': '\\underset{\\cancel{=}}{\\succ}',
    '⪵': '\\underset{\\cancel{=}}{\\prec}',
    '⪴': '\\underset{=}{\\succ}',
    '⪳': '\\underset{=}{\\prec}',
    '⪲': '',
    '⪱': '',
    '⪮': '',
    '⪭': '\\underline{\\hcancel{>}}',
    '⪬': '\\underline{\\hcancel{>}}',
    '⪫': '\\hcancel{>}',
    '⪪': '\\hcancel{<}',
    '⪩': '',
    '⪨': '',
    '⪧': '\\vartriangleright',
    '⪦': '\\vartriangleleft',
    '⪥': '><',
    '⪤': '><',
    '⪣': '\\underline{\\ll}',
    '⪢̸': '\\cancel{\\gg}',
    '⪢': '\\gg',
    '⪡̸': '\\cancel{\\ll}',
    '⪡': '\\ll',
    '⪠': '\\overset{\\sim}{\\geqq}',
    '⪟': '\\overset{\\sim}{\\leqq}',
    '⪞': '\\overset{\\sim}{>}',
    '⪝': '\\overset{\\sim}{<}',
    '⪜': '',
    '⪛': '',
    '⪚': '\\overset{=}{>}',
    '⪙': '\\overset{=}{<}',
    '⪘': '',
    '⪗': '',
    '⪖': '',
    '⪕': '',
    '⪔': '',
    '⪓': '',
    '⪒': '\\underset{=}{\\gtrless}',
    '⪑': '\\underset{=}{\\lessgtr}',
    '⪐': '\\underset{<}{\\gtrsim}',
    '⪏': '\\underset{>}{\\lesssim}',
    '⪎': '\\underset{\\simeq}{>}',
    '⪍': '\\underset{\\simeq}{<}',
    '⪌': '\\gtreqqless',
    '⪋': '\\lesseqqgtr',
    '⪊': '\\underset{\\cancel{\\approx}}{>}',
    '⪉': '\\underset{\\approx}{<}',
    '⪆': '\\underset{\\approx}{>}',
    '⪅': '\\underset{\\approx}{<}',
    '⪄': '',
    '⪃': '',
    '⪂': '',
    '⪁': '',
    '⪀': '',
    '⩿': '',
    '⩾̸': '\\bcancel{\\geq}',
    '⩾': '\\geq',
    '⩽̸': '\\bcancel{\\leq}',
    '⩽': '\\leq',
    '⩼': '',
    '⩻': '',
    '⩺': '',
    '⩹': '',
    '⩸': '\\overset{\\dots}{\\equiv}',
    '⩷': '',
    '⩶': '===',
    '⩵': '==',
    '⩴': '::=',
    '⩳': '',
    '⩲': '\\underset{=}{+}',
    '⩱': '\\overset{=}{+}',
    '⩰': '\\overset{\\approx}{=}',
    '⩯': '\\overset{\\wedge}{=}',
    '⩮': '\\overset{*}{=}',
    '⩭': '\\dot{\\approx}',
    '⩬': '',
    '⩫': '',
    '⩪': '\\dot{\\sim}',
    '⩩': '',
    '⩨': '',
    '⩧': '\\dot{\\equiv}',
    '⩦': '\\underset{\\cdot}{=}',
    '⩥': '',
    '⩤': '',
    '⩣': '\\underset{=}{\\vee}',
    '⩢': '\\overset{=}{\\vee}',
    '⩡': 'ul(vv)',
    '⩠': '\\underset{=}{\\wedge}',
    '⩟': '\\underline{\\wedge}',
    '⩞': '\\overset{=}{\\wedge}',
    '⩝': '\\hcancel{\\vee}',
    '⩜': '\\hcancel{\\wedge}',
    '⩛': '',
    '⩚': '',
    '⩙': '',
    '⩘': '\\vee',
    '⩗': '\\wedge',
    '⩖': '',
    '⩕': '',
    '⩔': '',
    '⩓': '',
    '⩒': '\\dot{\\vee}',
    '⩑': '\\dot{\\wedge}',
    '⩐': '',
    '⩏': '',
    '⩎': '',
    '⩍': '\\overline{\\cap}',
    '⩌': '\\overline{\\cup}',
    '⩋': '',
    '⩊': '',
    '⩉': '',
    '⩈': '',
    '⩇': '',
    '⩆': '',
    '⩅': '',
    '⩄': '',
    '⩃': '\\overline{\\cap}',
    '⩂': '\\overline{\\cup}',
    '⩁': '',
    '⩀': '',
    '⨾': '',
    '⨽': '\\llcorner',
    '⨼': '\\lrcorner',
    '⨻': '',
    '⨺': '',
    '⨹': '',
    '⨸': '',
    '⨷': '',
    '⨶': '\\hat{\\otimes}',
    '⨵': '',
    '⨴': '',
    '⨳': '',
    '⨲': '\\underline{\\times}',
    '⨱': '\\underline{\\times}',
    '⨰': '\\dot{\\times}',
    '⨮': '',
    '⨭': '',
    '⨬': '',
    '⨫': '',
    '⨪': '',
    '⨩': '',
    '⨨': '',
    '⨧': '',
    '⨦': '\\underset{\\sim}{+}',
    '⨥': '\\underset{\\circ}{+}',
    '⨤': '\\overset{\\sim}{+}',
    '⨣': '\\hat{+}',
    '⨢': '\\dot{+}',
    '⨡': '\\upharpoonright',
    '⨠': '>>',
    '⨟': '',
    '⨞': '\\triangleleft',
    '⨝': '\\bowtie',
    '⧿': '',
    '⧾': '+',
    '⧻': '\\hcancel{|||}',
    '⧺': '\\hcancel{||}',
    '⧹': '\\backslash',
    '⧸': '/',
    '⧷': 'hcancel{\backslash}',
    '⧶': '',
    '⧵': '\\backslash',
    '⧲': '\\Phi',
    '⧱': '',
    '⧰': '',
    '⧮': '',
    '⧭': '',
    '⧬': '',
    '⧫': '\\lozenge',
    '⧪': '',
    '⧩': '',
    '⧨': '',
    '⧧': '\\ddagger',
    '⧢': '\\sqcup\\sqcup',
    '⧡': '',
    '⧠': '\\square',
    '⧞': '',
    '⧝': '',
    '⧜': '',
    '⧛': '\\{\\{',
    '⧙': '\\{',
    '⧘': '\\}',
    '⧗': '',
    '⧖': '',
    '⧕': '\\bowtie',
    '⧔': '\\bowtie',
    '⧓': '\\bowtie',
    '⧒': '\\bowtie',
    '⧑': '\\bowtie',
    '⧐̸': '| \\not\\triangleright',
    '⧐': '| \\triangleright',
    '⧏̸': '\\not\\triangleleft |',
    '⧏': '\\triangleleft |',
    '⧎': '',
    '⧍': '\\triangle',
    '⧌': '',
    '⧋': '\\underline{\\triangle}',
    '⧊': '\\dot{\\triangle}',
    '⧉': '',
    '⧈': '\\boxed{\\circ}',
    '⧇': '\\boxed{\\circ}',
    '⧆': '\\boxed{\\rightarrow}',
    '⧅': '\\bcancel{\\square}',
    '⧄': '\\cancel{\\square}',
    '⧃': '\\odot',
    '⧂': '\\odot',
    '⦿': '\\odot',
    '⦾': '\\odot',
    '⦽': '\\varnothing',
    '⦼': '\\oplus',
    '⦻': '\\otimes',
    '⦺': '',
    '⦹': '\\varnothing',
    '⦸': '\\varnothing',
    '⦷': '\\ominus',
    '⦶': '\\ominus',
    '⦵': '\\ominus',
    '⦴': '\\vec{\\varnothing}',
    '⦳': '\\vec{\\varnothing}',
    '⦲': '\\dot{\\varnothing}',
    '⦱': '\\overline{\\varnothing}',
    '⦰': '\\varnothing',
    '⦯': '',
    '⦮': '',
    '⦭': '',
    '⦬': '',
    '⦫': '',
    '⦪': '',
    '⦩': '',
    '⦨': '',
    '⦧': '',
    '⦦': '',
    '⦥': '',
    '⦤': '',
    '⦣': '',
    '⦢': '',
    '⦡': '\\not\\lor',
    '⦠': '\\bcancel{>}',
    '⦂': ':',
    '⦁': '\\circ',
    '❘': '|',
    '▲': '\\bigtriangleup',
    '⋿': '\\Epsilon',
    '⋾': '\\overline{\\ni}',
    '⋽': '\\overline{\\ni}',
    '⋼': '\\in',
    '⋻': '\\in',
    '⋺': '\\in',
    '⋹': '\\underline{\\in}',
    '⋸': '\\underline{\\in}',
    '⋷': '\\overline{\\in}',
    '⋶': '\\overline{\\in}',
    '⋵': '\\dot{\\in}',
    '⋴': '\\in',
    '⋳': '\\in',
    '⋲': '\\in',
    '⋰': '\\ddots',
    '⋩': '\\underset{\\sim}{\\succ}',
    '⋨': '\\underset{\\sim}{\\prec}',
    '⋧': '\\underset{\\not\\sim}{>}',
    '⋦': '\\underset{\\not\\sim}{<}',
    '⋥': '\\not\\sqsupseteq',
    '⋤': '\\not\\sqsubseteq',
    '⋣': '\\not\\sqsupseteq',
    '⋢': '\\not\\sqsubseteq',
    '⋡': '\\nsucc',
    '⋠': '\\nprec',
    '⋟': '\\succ',
    '⋞': '\\prec',
    '⋝': '\\overline{>}',
    '⋜': '\\overline{<}',
    '⋛': '\\underset{>}{\\leq}',
    '⋚': '\\underset{<}{\\geq}',
    '⋕': '\\#',
    '⋓': '\\cup',
    '⋒': '\\cap',
    '⋑': '\\supset',
    '⋐': '\\subset',
    '⋏': '\\wedge',
    '⋎': '\\vee',
    '⋍': '\\simeq',
    '⋈': '\\bowtie',
    '⋇': '\\ast',
    '⋆': '\\star',
    '⋄': '\\diamond',
    '⊿': '\\triangle',
    '⊾': '\\measuredangle',
    '⊽': '\\overline{\\lor}',
    '⊼': '\\overline{\\land}',
    '⊻': '\\underline{\\lor}',
    '⊺': '\\top',
    '⊹': '',
    '⊷': '\\circ\\multimap',
    '⊶': '\\circ\\multimap',
    '⊳': '\\triangleright',
    '⊲': '\\triangleleft',
    '⊱': '\\succ',
    '⊰': '\\prec',
    '⊫': '|\\models',
    '⊪': '|\\models',
    '⊧': '\\models',
    '⊦': '\\vdash',
    '⊝': '\\ominus',
    '⊜': '\\ominus',
    '⊛': '\\odot',
    '⊚': '\\odot',
    '⊔': '\\sqcup',
    '⊓': '\\sqcap',
    '⊒': '\\sqsupseteq',
    '⊑': '\\sqsubseteq',
    '⊐̸': '\\not\\sqsupset',
    '⊐': '\\sqsupset',
    '⊏̸': '\\not\\sqsubset',
    '⊏': '\\sqsubset',
    '⊎': '\\cup',
    '⊍': '\\cup',
    '⊌': '\\cup',
    '≿̸': '\\not\\succsim',
    '≿': '\\succsim',
    '≾': '\\precsim',
    '≹': '\\not\\overset{>}{<}',
    '≸': '\\not\\overset{>}{<}',
    '≷': '\\overset{>}{<}',
    '≶': '\\overset{<}{>}',
    '≵': '\\not\\geg',
    '≴': '\\not\\leq',
    '≳': '\\geg',
    '≲': '\\leq',
    '≬': '',
    '≧': '\\geg',
    '≦̸': '\\not\\leq',
    '≦': '\\leq',
    '≣': '\\overset{=}{=} ',
    '≞': '\\overset{m}{=} ',
    '≝': '\\overset{def}{=}',
    '≘': '=',
    '≖': '=',
    '≕': '=:',
    '≓': '\\doteq',
    '≒': '\\doteq',
    '≑': '\\doteq',
    '≐': '\\doteq',
    '≏̸': '',
    '≏': '',
    '≎̸': '',
    '≎': '',
    '≌': '\\approx',
    '≋': '\\approx',
    '≊': '\\approx',
    '≂̸': '\\neq',
    '≂': '=',
    '∿': '\\sim',
    '∾': '\\infty',
    '∽̱': '\\sim',
    '∽': '\\sim',
    '∻': '\\sim',
    '∺': ':-:',
    '∹': '-:',
    '∸': '\\bot',
    '∷': '::',
    '∶': ':',
    '∣': '|',
    '∟': '\\llcorner',
    '∙': '\\cdot',
    '∘': '\\circ',
    '∗': '*',
    '∕': '/',
    '∎': '\\square',
    '∍': '\\ni',
    '∊': '\\in',
    '∆': '\\Delta',
    '⁄': '/',
    '⪰̸': '\\nsucceq',
    '⪰': '\\succeq',
    '⪯̸': '\\npreceq',
    '⪯': '\\preceq',
    '⪈': '\\ngeqslant',
    '⪇': '\\nleqslant',
    '⧳': '\\Phi',
    '⧦': '\\models',
    '⧥': '\\not\\equiv',
    '⧤': '\\approx\\neq',
    '⧣': '\\neq',
    '⧁': '\\circle',
    '⧀': '\\circle',
    '◦': '\\circle',
    '◗': '\\circle',
    '◖': '\\circle',
    '●': '\\circle',
    '◎': '\\circledcirc',
    '◍': '\\circledcirc',
    '◌': '\\circledcirc',
    '◉': '\\circledcirc',
    '◈': '\\diamond',
    '◇': '\\diamond',
    '◆': '\\diamond',
    '◅': '\\triangleleft',
    '◄': '\\triangleleft',
    '◃': '\\triangleleft',
    '◂': '\\triangleleft',
    '◁': '\\triangleleft',
    '◀': '\\triangleleft',
    '▿': '\\triangledown',
    '▾': '\\triangledown',
    '▽': '\\triangledown',
    '▼': '\\triangledown',
    '▹': '\\triangleright',
    '▸': '\\triangleright',
    '▷': '\\triangleright',
    '▶': '\\triangleright',
    '▵': '\\triangle',
    '▴': '\\triangle',
    '△': '\\triangle',
    '▱': '\\square',
    '▰': '\\square',
    '▯': '\\square',
    '▮': '\\square',
    '▭': '\\square',
    '▫': '\\square',
    '▪': '\\square',
    '□': '\\square',
    '■': '\\square',
    '⋭': '\\not\\triangleright',
    '⋬': '\\not\\triangleleft',
    '⋫': '\\not\\triangleright',
    '⋪': '\\not\\triangleleft',
    '⋙': '\\ggg',
    '⋘': '\\lll',
    '⋗': '*>',
    '⋖': '<*',
    '⋔': '\\pitchfork',
    '⋌': '',
    '⋋': '',
    '⋊': '\\rtimes',
    '⋉': '\\ltimes',
    '⊵': '\\triangleright',
    '\\triangleleft': '',
    '⊥': '\\bot',
    '⊁': '\\nsucc',
    '⊀': '\\preceq',
    '≽': '\\succeq',
    '≼': '\\preceq',
    '≻': '\\succ',
    '≺': '\\prec',
    '≱': '\\geq/',
    '≰': '\\leq/',
    '≭': '\\neq',
    '≫̸': '\\not\\gg',
    '≫': '\\gg',
    '≪̸': '\\not\\ll',
    '≪': '\\ll',
    '≩': '\\ngeqslant',
    '≨': '\\nleqslant',
    '≡': '\\equiv',
    '≟': '\\doteq',
    '≜': '\\triangleq',
    '≛': '\\doteq',
    '≚': '\\triangleq',
    '≙': '\\triangleq',
    '≗': '\\doteq',
    '≔': ':=',
    '≍': '\\asymp',
    '≇': '\\ncong',
    '≆': '\\ncong',
    '≅': '\\cong',
    '≄': '\\not\\simeq',
    '≃': '\\simeq',
    '≁': '\\not\\sim',
    '∦': '\\not\\parallel',
    '∥': '\\parallel',
    '∤': '\\not|',
    '∝': '\\propto',
    '==': '==',
    '=': '=',
    ':=': ':=',
    '/=': '=',
    '-=': '-=',
    '+=': '+=',
    '*=': '*=',
    '!=': '!=',
    '≠': '\\neq',
    '≢': '\\equiv /',
    '≉': '\\approx /',
    '∼': 'sim',
    '≈': '\\approx',
    '≮': '</',
    '<': '<',
    '≯': '>/',
    '>=': '>=',
    '>': '>',
    '≥': '\\geq',
    '≤': '\\leq',
    '<=': '<=',
    '⊋': '\\supsetneq',
    '⊊': '\\subsetneq',
    '⊉': '\\nsupseteq',
    '⊈': '\\nsubseteq',
    '⊇': '\\supseteq',
    '⊆': '\\subseteq',
    '⊅': '\\not\\supset',
    '⊄': '\\not\\subset',
    '⊃⃒': '\\supset |',
    '⊃': '\\supset',
    '⊂⃒': '\\subset |',
    '⊂': '\\subset',
    '∌': '\\not\\in',
    '∉': '\\notin',
    '∈': '\\in',
    '∁': 'C',
    '∄': '\\nexists',
    '∃': '\\exists',
    '∀': '\\forall',
    '∧': '\\land',
    '&&': '\\&\\&',
    '∨': '\\lor',
    '⊯': '\\cancel{\\vDash}',
    '⊮': '\\cancel{\\Vdash}',
    '⊭': '\\nvDash',
    '⊬': '\\nvDash',
    '⊩': '\\Vdash',
    '⊨': '\\vDash',
    '⊤': '\\top',
    '⊣': '\\dashv',
    '⊢': '\\vdash',
    '∋': '\\ni',
    '⋱': '\\ddots',
    '⋯': '\\hdots',
    '⋮': '\\vdots',
    '…': '\\hdots',
    '϶': '\\ni',
    ':': ':',
    '...': '\\cdots',
    '..': '..',
    '->': '->',
    '∵': '\\because',
    '∴': '\\therefore ',
    '⁣': '',
    ',': ',',
    ';': ';',
    '⧽': '\\}',
    '⧼': '\\{',
    '⦘': '\\]',
    '⦗': '\\[',
    '⦖': '\\ll',
    '⦕': '\\gg',
    '⦔': '\\gg',
    '⦓': '\\ll',
    '⦒': '\\gg',
    '⦑': '\\ll',
    '⦐': '\\]',
    '⦏': '\\]',
    '⦎': '\\]',
    '⦍': '\\[',
    '⦌': '\\[',
    '⦋': '\\]',
    '⦊': '\\triangleright',
    '⦉': '\\triangleleft',
    '⦈': '|\\)',
    '⦇': '\\(|',
    '⦆': '|\\)',
    '⦅': '\\(\\(',
    '⦄': '|\\}',
    '⦃': '\\{|',
    '⦀': '\\||',
    '⟯': '\\left. \\right]',
    '⟮': '\\left[ \\right.',
    '⟭': '\\left. \\right]]',
    '⟬': '\\left[[ \\right.',
    '⟫': '\\gg',
    '⟪': '\\ll',
    '⟩': '\\rangle',
    '⟨': '\\langle',
    '⟧': '\\left. \\right]]',
    '⟦': '\\left[[ \\right.',
    '❳': '\\left.\\right)',
    '❲': '\\left(\\right.',
    '〉': '\\rangle',
    '〈': '\\langle',
    '⌋': '\\rfloor',
    '⌊': '\\lfloor',
    '⌉': '\\rceil',
    '⌈': '\\lceil',
    '‖': '\\parallel',
    '}': '\\left.\\right}',
    '{': '\\left{\\right.',
    ']': '\\left]\\right.',
    '[': '\\left[\\right.',
    ')': '\\left.\\right)',
    '(': '\\left(\\right.',
    '”': '"',
    '“': '``',
    '’': "'",
    '‘': '`',
    α: '\\alpha',
    β: '\\beta',
    γ: '\\gamma',
    Γ: '\\Gamma',
    δ: '\\delta',
    Δ: '\\Delta',
    ϵ: '\\epsilon',
    ζ: '\\zeta',
    η: '\\eta',
    θ: '\\theta',
    Θ: '\\Theta',
    ι: '\\iota',
    κ: '\\kappa',
    λ: '\\lambda',
    μ: '\\mu',
    ν: '\\nu',
    ο: '\\omicron',
    π: '\\pi',
    Π: '\\Pi',
    ρ: '\\pho',
    σ: '\\sigma',
    Σ: '\\Sigma',
    τ: '\\tau',
    υ: '\\upsilon',
    Υ: '\\Upsilon',
    ϕ: '\\phi',
    Φ: '\\Phi',
    χ: '\\chi',
    ψ: '\\psi',
    Ψ: '\\Psi',
    ω: '\\omega',
    Ω: '\\Omega',
};

var allMathSymbolsByChar = {};

Object.defineProperty(allMathSymbolsByChar, "__esModule", { value: true });
allMathSymbolsByChar.allMathSymbolsByChar = void 0;
allMathSymbolsByChar.allMathSymbolsByChar = {
    '&#xA0;': '\\textrm{ }',
    '&#x2203;': '\\exists',
    '&#x2200;': '\\forall',
    '&#x21D4;': '\\iff',
    '&#x21D2;': '=>',
    '&#xAC;': '\\neg',
    '&#x2124;': '\\mathbb{Z}',
    '&#x211D;': '\\mathbb{R}',
    '&#x211A;': '\\mathbb{Q}',
    '&#x2115;': '\\mathbb{N}',
    '&#x2102;': 'CC',
    '&#x25A1;': '\\square',
    '&#x22C4;': '\\diamond',
    '&#x25B3;': '\\triangle',
    '&#x2322;': '\\frown',
    '&#x2220;': '\\angle',
    '&#x22F1;': '\\ddots',
    '&#x22EE;': '\\vdots',
    '&#x2235;': '\\because',
    '&#x2234;': '\\therefore',
    '&#x2135;': '\\aleph',
    '&#x2205;': '\\oslash',
    '&#xB1;': '\\pm',
    '&#x2207;': '\\nabla',
    '&#x2202;': '\\partial',
    '&#x222E;': '\\oint',
    '&#x222B;': '\\int',
    '&#x22C3;': '\\cup',
    '&#x222A;': '\\cup',
    '&#x22C2;': '\\cap',
    '&#x2229;': '\\cap',
    '&#x22C1;': '\\vee',
    '&#x2228;': '\\vee',
    '&#x22C0;': '\\wedge',
    '&#x2227;': '\\wedge',
    '&#x220F;': '\\prod',
    '&#x2211;': '\\sum',
    '&#x2299;': '\\bigodot',
    '&#x2297;': '\\bigoplus',
    '&#x2295;': 'o+',
    '&#x2218;': '@',
    '&#x22C8;': '\\bowtie',
    '&#x22CA;': '\\rtimes',
    '&#x22C9;': '\\ltimes',
    '&#xF7;': '\\div',
    '&#xD7;': '\\times',
    '\\': '\\backslash',
    '&#x22C6;': '\\star',
    '&#x2217;': '\\star',
    '&#x22C5;': '\\cdot',
    '&#x3A9;': '\\Omega',
    '&#x3C9;': '\\omega',
    '&#x3A8;': '\\Psi',
    '&#x3C8;': '\\psi',
    '&#x3C7;': '\\chi',
    '&#x3C6;': '\\varphi',
    '&#x3A6;': '\\Phi',
    '&#x3D5;': '\\phi',
    '&#x3C5;': '\\upsilon',
    '&#x3C4;': '\\tau',
    '&#x3A3;': '\\Sigma',
    '&#x3C3;': '\\sigma',
    '&#x3C1;': '\\rho',
    '&#x3A0;': '\\Pi',
    '&#x3C0;': '\\pi',
    '&#x39E;': '\\Xi',
    '&#x3BE;': '\\xi',
    '&#x3BD;': '\\nu',
    '&#x3BC;': '\\mu',
    '&#x39B;': '\\Lambda',
    '&#x3BB;': '\\lambda',
    '&#x3BA;': '\\kappa',
    '&#x3B9;': '\\iota',
    '&#x3D1;': '\\vartheta',
    '&#x398;': '\\Theta',
    '&#x3B8;': '\\theta',
    '&#x3B7;': '\\eta',
    '&#x3B6;': '\\zeta',
    '&#x25B;': '\\varepsilon',
    '&#x3B5;': '\\epsilon',
    '&#x394;': '\\Delta',
    '&#x3B4;': '\\delta',
    '&#x393;': '\\Gamma',
    '&#x3B3;': '\\gamma',
    '&#x3B2;': '\\beta',
    '&#x3B1;': '\\alpha',
    '&#x221E;': '\\infty',
};

var allMathSymbolsByGlyph = {};

Object.defineProperty(allMathSymbolsByGlyph, "__esModule", { value: true });
allMathSymbolsByGlyph.allMathSymbolsByGlyph = void 0;
allMathSymbolsByGlyph.allMathSymbolsByGlyph = {
    ' ': '\\textrm{ }',
    '∃': '\\exists',
    '∀': '\\forall',
    '⇔': '\\iff',
    '⇒': '=>',
    '¬': '\\neg',
    '□': '\\square',
    '⋄': '\\diamond',
    '△': '\\triangle',
    '⌢': '\\frown',
    '∠': '\\angle',
    '⋱': '\\ddots',
    '⋮': '\\vdots',
    '∵': '\\because',
    '∴': '\\therefore',
    ℵ: '\\aleph',
    '∅': '\\oslash',
    '±': '\\pm',
    '∇': '\\nabla',
    '∂': '\\partial',
    '∮': '\\oint',
    '∫': '\\int',
    '⋃': '\\cup',
    '∪': '\\cup',
    '⋂': '\\cap',
    '∩': '\\cap',
    '⋁': '\\vee',
    '∨': '\\vee',
    '⋀': '\\wedge',
    '∧': '\\wedge',
    '∏': '\\prod',
    '∑': '\\sum',
    '⊙': '\\bigodot',
    '⊗': '\\bigoplus',
    '⊕': 'o+',
    '∘': '@',
    '⋈': '\\bowtie',
    '⋊': '\\rtimes',
    '⋉': '\\ltimes',
    '÷': '\\div',
    '×': '\\times',
    '\\': '\\backslash',
    '⋆': '\\star',
    '∗': '\\star',
    '⋅': '\\cdot',
    Ω: '\\Omega',
    ω: '\\omega',
    Ψ: '\\Psi',
    ψ: '\\psi',
    χ: '\\chi',
    φ: '\\varphi',
    Φ: '\\Phi',
    ϕ: '\\phi',
    υ: '\\upsilon',
    τ: '\\tau',
    Σ: '\\Sigma',
    σ: '\\sigma',
    ρ: '\\rho',
    Π: '\\Pi',
    π: '\\pi',
    Ξ: '\\Xi',
    ξ: '\\xi',
    ν: '\\nu',
    μ: '\\mu',
    Λ: '\\Lambda',
    λ: '\\lambda',
    κ: '\\kappa',
    ι: '\\iota',
    ϑ: '\\vartheta',
    Θ: '\\Theta',
    θ: '\\theta',
    η: '\\eta',
    ζ: '\\zeta',
    ɛ: '\\varepsilon',
    ε: '\\epsilon',
    Δ: '\\Delta',
    δ: '\\delta',
    Γ: '\\Gamma',
    γ: '\\gamma',
    β: '\\beta',
    α: '\\alpha',
    '∞': '\\infty',
};

var latexAccents = {};

Object.defineProperty(latexAccents, "__esModule", { value: true });
latexAccents.latexAccents = void 0;
latexAccents.latexAccents = ['\\hat', '\\bar', '\\underbrace', '\\overbrace'];

(function (exports) {
	var __createBinding = (commonjsGlobal && commonjsGlobal.__createBinding) || (Object.create ? (function(o, m, k, k2) {
	    if (k2 === undefined) k2 = k;
	    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
	}) : (function(o, m, k, k2) {
	    if (k2 === undefined) k2 = k;
	    o[k2] = m[k];
	}));
	var __exportStar = (commonjsGlobal && commonjsGlobal.__exportStar) || function(m, exports) {
	    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
	};
	Object.defineProperty(exports, "__esModule", { value: true });
	__exportStar(allMathOperatorsByChar, exports);
	__exportStar(allMathOperatorsByGlyph, exports);
	__exportStar(allMathSymbolsByChar, exports);
	__exportStar(allMathSymbolsByGlyph, exports);
	__exportStar(latexAccents, exports); 
} (syntax));

var hasRequiredMi;

function requireMi () {
	if (hasRequiredMi) return mi;
	hasRequiredMi = 1;
	Object.defineProperty(mi, "__esModule", { value: true });
	mi.MI = void 0;
	var helpers_1 = requireHelpers();
	var syntax_1 = syntax;
	var MI = /** @class */ (function () {
	    function MI(mathElement) {
	        this._mathmlElement = mathElement;
	    }
	    MI.prototype.convert = function () {
	        var normalizedValue = helpers_1.normalizeWhiteSpaces(this._mathmlElement.value);
	        if (normalizedValue === ' ')
	            return Character.apply(normalizedValue);
	        var trimmedValue = normalizedValue.trim();
	        return Character.apply(trimmedValue);
	    };
	    return MI;
	}());
	mi.MI = MI;
	var Character = /** @class */ (function () {
	    function Character(value) {
	        this._value = value;
	    }
	    Character.apply = function (value) {
	        return new Character(value)._apply();
	    };
	    Character.prototype._apply = function () {
	        return this._findByCharacter() || this._findByGlyph() || this._value;
	    };
	    Character.prototype._findByCharacter = function () {
	        return syntax_1.allMathSymbolsByChar[this._value];
	    };
	    Character.prototype._findByGlyph = function () {
	        return syntax_1.allMathSymbolsByGlyph[this._value];
	    };
	    return Character;
	}());
	return mi;
}

var mo = {};

var hasRequiredMo;

function requireMo () {
	if (hasRequiredMo) return mo;
	hasRequiredMo = 1;
	Object.defineProperty(mo, "__esModule", { value: true });
	mo.MO = void 0;
	var helpers_1 = requireHelpers();
	var syntax_1 = syntax;
	var MO = /** @class */ (function () {
	    function MO(mathElement) {
	        this._mathmlElement = mathElement;
	    }
	    MO.prototype.convert = function () {
	        var normalizedValue = helpers_1.normalizeWhiteSpaces(this._mathmlElement.value);
	        var trimmedValue = normalizedValue.trim();
	        return Operator.operate(trimmedValue);
	    };
	    return MO;
	}());
	mo.MO = MO;
	var Operator = /** @class */ (function () {
	    function Operator(value) {
	        this._value = value;
	    }
	    Operator.operate = function (value) {
	        return new Operator(value)._operate();
	    };
	    Operator.prototype._operate = function () {
	        return this._findByCharacter() || this._findByGlyph() || this._value;
	    };
	    Operator.prototype._findByCharacter = function () {
	        return syntax_1.allMathOperatorsByChar[this._value];
	    };
	    Operator.prototype._findByGlyph = function () {
	        return syntax_1.allMathOperatorsByGlyph[this._value];
	    };
	    return Operator;
	}());
	return mo;
}

var mn = {};

var hasRequiredMn;

function requireMn () {
	if (hasRequiredMn) return mn;
	hasRequiredMn = 1;
	Object.defineProperty(mn, "__esModule", { value: true });
	mn.MN = void 0;
	var helpers_1 = requireHelpers();
	var MN = /** @class */ (function () {
	    function MN(mathElement) {
	        this._mathmlElement = mathElement;
	    }
	    MN.prototype.convert = function () {
	        var normalizedValue = helpers_1.normalizeWhiteSpaces(this._mathmlElement.value);
	        return normalizedValue.trim();
	    };
	    return MN;
	}());
	mn.MN = MN;
	return mn;
}

var msqrt = {};

var hasRequiredMsqrt;

function requireMsqrt () {
	if (hasRequiredMsqrt) return msqrt;
	hasRequiredMsqrt = 1;
	Object.defineProperty(msqrt, "__esModule", { value: true });
	msqrt.MSqrt = void 0;
	var helpers_1 = requireHelpers();
	var MSqrt = /** @class */ (function () {
	    function MSqrt(mathElement) {
	        this._mathmlElement = mathElement;
	    }
	    MSqrt.prototype.convert = function () {
	        var latexJoinedChildren = this._mathmlElement.children
	            .map(function (child) { return helpers_1.mathMLElementToLaTeXConverter(child); })
	            .map(function (converter) { return converter.convert(); })
	            .join(' ');
	        return "\\sqrt{" + latexJoinedChildren + "}";
	    };
	    return MSqrt;
	}());
	msqrt.MSqrt = MSqrt;
	return msqrt;
}

var mfenced = {};

var hasRequiredMfenced;

function requireMfenced () {
	if (hasRequiredMfenced) return mfenced;
	hasRequiredMfenced = 1;
	Object.defineProperty(mfenced, "__esModule", { value: true });
	mfenced.MFenced = void 0;
	var mathml_element_to_latex_converter_1 = requireMathmlElementToLatexConverter();
	var helpers_1 = requireHelpers();
	var MFenced = /** @class */ (function () {
	    function MFenced(mathmlElement) {
	        this._mathmlElement = mathmlElement;
	        this._open = this._mathmlElement.attributes.open || '';
	        this._close = this._mathmlElement.attributes.close || '';
	        this._separators = Array.from(this._mathmlElement.attributes.separators || '');
	    }
	    MFenced.prototype.convert = function () {
	        var latexChildren = this._mathmlElement.children
	            .map(function (child) { return mathml_element_to_latex_converter_1.mathMLElementToLaTeXConverter(child); })
	            .map(function (converter) { return converter.convert(); });
	        if (this._isThereRelativeOfName(this._mathmlElement.children, 'mtable'))
	            return new Matrix(this._open, this._close).apply(latexChildren);
	        return new Vector(this._open, this._close, this._separators).apply(latexChildren);
	    };
	    MFenced.prototype._isThereRelativeOfName = function (mathmlElements, elementName) {
	        var _this = this;
	        return mathmlElements.some(function (child) { return child.name === elementName || _this._isThereRelativeOfName(child.children, elementName); });
	    };
	    return MFenced;
	}());
	mfenced.MFenced = MFenced;
	var Vector = /** @class */ (function () {
	    function Vector(open, close, separators) {
	        this._open = open || '(';
	        this._close = close || ')';
	        this._separators = separators;
	    }
	    Vector.prototype.apply = function (latexContents) {
	        var contentWithoutWrapper = helpers_1.JoinWithManySeparators.join(latexContents, this._separators);
	        return new helpers_1.GenericWrapper(this._open, this._close).wrap(contentWithoutWrapper);
	    };
	    return Vector;
	}());
	var Matrix = /** @class */ (function () {
	    function Matrix(open, close) {
	        this._genericCommand = 'matrix';
	        this._separators = new Separators(open, close);
	    }
	    Matrix.prototype.apply = function (latexContents) {
	        var command = this._command;
	        var matrix = "\\begin{" + command + "}\n" + latexContents.join('') + "\n\\end{" + command + "}";
	        return command === this._genericCommand ? this._separators.wrap(matrix) : matrix;
	    };
	    Object.defineProperty(Matrix.prototype, "_command", {
	        get: function () {
	            if (this._separators.areParentheses())
	                return 'pmatrix';
	            if (this._separators.areSquareBrackets())
	                return 'bmatrix';
	            if (this._separators.areBrackets())
	                return 'Bmatrix';
	            if (this._separators.areDivides())
	                return 'vmatrix';
	            if (this._separators.areParallels())
	                return 'Vmatrix';
	            if (this._separators.areNotEqual())
	                return this._genericCommand;
	            return 'bmatrix';
	        },
	        enumerable: false,
	        configurable: true
	    });
	    return Matrix;
	}());
	var Separators = /** @class */ (function () {
	    function Separators(open, close) {
	        this._open = open;
	        this._close = close;
	    }
	    Separators.prototype.wrap = function (str) {
	        return new helpers_1.GenericWrapper(this._open, this._close).wrap(str);
	    };
	    Separators.prototype.areParentheses = function () {
	        return this._compare('(', ')');
	    };
	    Separators.prototype.areSquareBrackets = function () {
	        return this._compare('[', ']');
	    };
	    Separators.prototype.areBrackets = function () {
	        return this._compare('{', '}');
	    };
	    Separators.prototype.areDivides = function () {
	        return this._compare('|', '|');
	    };
	    Separators.prototype.areParallels = function () {
	        return this._compare('||', '||');
	    };
	    Separators.prototype.areNotEqual = function () {
	        return this._open !== this._close;
	    };
	    Separators.prototype._compare = function (openToCompare, closeToCompare) {
	        return this._open === openToCompare && this._close === closeToCompare;
	    };
	    return Separators;
	}());
	return mfenced;
}

var mfrac = {};

var errors = {};

var invalidNumberOfChildren = {};

var __extends = (commonjsGlobal && commonjsGlobal.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(invalidNumberOfChildren, "__esModule", { value: true });
invalidNumberOfChildren.InvalidNumberOfChildrenError = void 0;
var InvalidNumberOfChildrenError = /** @class */ (function (_super) {
    __extends(InvalidNumberOfChildrenError, _super);
    function InvalidNumberOfChildrenError(tagName, expectedNumberOfChild, currentNumberOfChild, comparison) {
        if (comparison === void 0) { comparison = 'exactly'; }
        var _this = _super.call(this, tagName + " tag must have " + comparison + " " + expectedNumberOfChild + " children. It's actually " + currentNumberOfChild) || this;
        _this.name = 'InvalidNumberOfChildrenError';
        return _this;
    }
    return InvalidNumberOfChildrenError;
}(Error));
invalidNumberOfChildren.InvalidNumberOfChildrenError = InvalidNumberOfChildrenError;

(function (exports) {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.InvalidNumberOfChildrenError = void 0;
	var invalid_number_of_children_1 = invalidNumberOfChildren;
	Object.defineProperty(exports, "InvalidNumberOfChildrenError", { enumerable: true, get: function () { return invalid_number_of_children_1.InvalidNumberOfChildrenError; } }); 
} (errors));

var hasRequiredMfrac;

function requireMfrac () {
	if (hasRequiredMfrac) return mfrac;
	hasRequiredMfrac = 1;
	Object.defineProperty(mfrac, "__esModule", { value: true });
	mfrac.MFrac = void 0;
	var errors_1 = errors;
	var helpers_1 = requireHelpers();
	var MFrac = /** @class */ (function () {
	    function MFrac(mathElement) {
	        this._mathmlElement = mathElement;
	    }
	    MFrac.prototype.convert = function () {
	        var _a = this._mathmlElement, children = _a.children, name = _a.name;
	        var childrenLength = children.length;
	        if (childrenLength !== 2)
	            throw new errors_1.InvalidNumberOfChildrenError(name, 2, childrenLength);
	        var num = helpers_1.mathMLElementToLaTeXConverter(children[0]).convert();
	        var den = helpers_1.mathMLElementToLaTeXConverter(children[1]).convert();
	        if (this._isBevelled())
	            return this._wrapIfMoreThanOneChar(num) + "/" + this._wrapIfMoreThanOneChar(den);
	        return "\\frac{" + num + "}{" + den + "}";
	    };
	    MFrac.prototype._wrapIfMoreThanOneChar = function (str) {
	        return new helpers_1.ParenthesisWrapper().wrapIfMoreThanOneChar(str);
	    };
	    MFrac.prototype._isBevelled = function () {
	        return !!this._mathmlElement.attributes.bevelled;
	    };
	    return MFrac;
	}());
	mfrac.MFrac = MFrac;
	return mfrac;
}

var mroot = {};

var hasRequiredMroot;

function requireMroot () {
	if (hasRequiredMroot) return mroot;
	hasRequiredMroot = 1;
	Object.defineProperty(mroot, "__esModule", { value: true });
	mroot.MRoot = void 0;
	var helpers_1 = requireHelpers();
	var errors_1 = errors;
	var MRoot = /** @class */ (function () {
	    function MRoot(mathElement) {
	        this._mathmlElement = mathElement;
	    }
	    MRoot.prototype.convert = function () {
	        var _a = this._mathmlElement, name = _a.name, children = _a.children;
	        var childrenLength = children.length;
	        if (childrenLength !== 2)
	            throw new errors_1.InvalidNumberOfChildrenError(name, 2, childrenLength);
	        var content = helpers_1.mathMLElementToLaTeXConverter(children[0]).convert();
	        var rootIndex = helpers_1.mathMLElementToLaTeXConverter(children[1]).convert();
	        return "\\sqrt[" + rootIndex + "]{" + content + "}";
	    };
	    return MRoot;
	}());
	mroot.MRoot = MRoot;
	return mroot;
}

var maction = {};

var hasRequiredMaction;

function requireMaction () {
	if (hasRequiredMaction) return maction;
	hasRequiredMaction = 1;
	Object.defineProperty(maction, "__esModule", { value: true });
	maction.MAction = void 0;
	var mathml_element_to_latex_converter_1 = requireMathmlElementToLatexConverter();
	var MAction = /** @class */ (function () {
	    function MAction(mathElement) {
	        this._mathmlElement = mathElement;
	    }
	    MAction.prototype.convert = function () {
	        var children = this._mathmlElement.children;
	        if (this._isToggle())
	            return children
	                .map(function (child) { return mathml_element_to_latex_converter_1.mathMLElementToLaTeXConverter(child); })
	                .map(function (converter) { return converter.convert(); })
	                .join(' \\Longrightarrow ');
	        return mathml_element_to_latex_converter_1.mathMLElementToLaTeXConverter(children[0]).convert();
	    };
	    MAction.prototype._isToggle = function () {
	        var actiontype = this._mathmlElement.attributes.actiontype;
	        return actiontype === 'toggle' || !actiontype;
	    };
	    return MAction;
	}());
	maction.MAction = MAction;
	return maction;
}

var menclose = {};

var hasRequiredMenclose;

function requireMenclose () {
	if (hasRequiredMenclose) return menclose;
	hasRequiredMenclose = 1;
	Object.defineProperty(menclose, "__esModule", { value: true });
	menclose.MEnclose = void 0;
	var mathml_element_to_latex_converter_1 = requireMathmlElementToLatexConverter();
	var MEnclose = /** @class */ (function () {
	    function MEnclose(mathElement) {
	        this._mathmlElement = mathElement;
	    }
	    MEnclose.prototype.convert = function () {
	        var latexJoinedChildren = this._mathmlElement.children
	            .map(function (child) { return mathml_element_to_latex_converter_1.mathMLElementToLaTeXConverter(child); })
	            .map(function (converter) { return converter.convert(); })
	            .join(' ');
	        if (this._notation === 'actuarial')
	            return "\\overline{\\left." + latexJoinedChildren + "\\right|}";
	        if (this._notation === 'radical')
	            return "\\sqrt{" + latexJoinedChildren + "}";
	        if (['box', 'roundedbox', 'circle'].includes(this._notation))
	            return "\\boxed{" + latexJoinedChildren + "}";
	        if (this._notation === 'left')
	            return "\\left|" + latexJoinedChildren;
	        if (this._notation === 'right')
	            return latexJoinedChildren + "\\right|";
	        if (this._notation === 'top')
	            return "\\overline{" + latexJoinedChildren + "}";
	        if (this._notation === 'bottom')
	            return "\\underline{" + latexJoinedChildren + "}";
	        if (this._notation === 'updiagonalstrike')
	            return "\\cancel{" + latexJoinedChildren + "}";
	        if (this._notation === 'downdiagonalstrike')
	            return "\\bcancel{" + latexJoinedChildren + "}";
	        if (this._notation === 'updiagonalarrow')
	            return "\\cancelto{}{" + latexJoinedChildren + "}";
	        if (['verticalstrike', 'horizontalstrike'].includes(this._notation))
	            return "\\hcancel{" + latexJoinedChildren + "}";
	        if (this._notation === 'madruwb')
	            return "\\underline{" + latexJoinedChildren + "\\right|}";
	        if (this._notation === 'phasorangle')
	            return "{\\angle \\underline{" + latexJoinedChildren + "}}";
	        return "\\overline{\\left.\\right)" + latexJoinedChildren + "}";
	    };
	    Object.defineProperty(MEnclose.prototype, "_notation", {
	        get: function () {
	            return this._mathmlElement.attributes.notation || 'longdiv';
	        },
	        enumerable: false,
	        configurable: true
	    });
	    return MEnclose;
	}());
	menclose.MEnclose = MEnclose;
	return menclose;
}

var merror = {};

var hasRequiredMerror;

function requireMerror () {
	if (hasRequiredMerror) return merror;
	hasRequiredMerror = 1;
	Object.defineProperty(merror, "__esModule", { value: true });
	merror.MError = void 0;
	var mathml_element_to_latex_converter_1 = requireMathmlElementToLatexConverter();
	var MError = /** @class */ (function () {
	    function MError(mathElement) {
	        this._mathmlElement = mathElement;
	    }
	    MError.prototype.convert = function () {
	        var latexJoinedChildren = this._mathmlElement.children
	            .map(function (child) { return mathml_element_to_latex_converter_1.mathMLElementToLaTeXConverter(child); })
	            .map(function (converter) { return converter.convert(); })
	            .join(' ');
	        return "\\color{red}{" + latexJoinedChildren + "}";
	    };
	    return MError;
	}());
	merror.MError = MError;
	return merror;
}

var mphantom = {};

Object.defineProperty(mphantom, "__esModule", { value: true });
mphantom.MPhantom = void 0;
var MPhantom = /** @class */ (function () {
    function MPhantom(mathElement) {
        this._mathmlElement = mathElement;
    }
    MPhantom.prototype.convert = function () {
        return '';
    };
    return MPhantom;
}());
mphantom.MPhantom = MPhantom;

var msup = {};

var hasRequiredMsup;

function requireMsup () {
	if (hasRequiredMsup) return msup;
	hasRequiredMsup = 1;
	Object.defineProperty(msup, "__esModule", { value: true });
	msup.MSup = void 0;
	var helpers_1 = requireHelpers();
	var errors_1 = errors;
	var MSup = /** @class */ (function () {
	    function MSup(mathElement) {
	        this._mathmlElement = mathElement;
	    }
	    MSup.prototype.convert = function () {
	        var _a = this._mathmlElement, name = _a.name, children = _a.children;
	        var childrenLength = children.length;
	        if (childrenLength !== 2)
	            throw new errors_1.InvalidNumberOfChildrenError(name, 2, childrenLength);
	        var base = helpers_1.mathMLElementToLaTeXConverter(children[0]).convert();
	        var exponent = helpers_1.mathMLElementToLaTeXConverter(children[1]).convert();
	        return new helpers_1.ParenthesisWrapper().wrapIfMoreThanOneChar(base) + "^" + new helpers_1.BracketWrapper().wrap(exponent);
	    };
	    return MSup;
	}());
	msup.MSup = MSup;
	return msup;
}

var msub = {};

var hasRequiredMsub;

function requireMsub () {
	if (hasRequiredMsub) return msub;
	hasRequiredMsub = 1;
	Object.defineProperty(msub, "__esModule", { value: true });
	msub.MSub = void 0;
	var helpers_1 = requireHelpers();
	var errors_1 = errors;
	var MSub = /** @class */ (function () {
	    function MSub(mathElement) {
	        this._mathmlElement = mathElement;
	    }
	    MSub.prototype.convert = function () {
	        var _a = this._mathmlElement, name = _a.name, children = _a.children;
	        var childrenLength = children.length;
	        if (childrenLength !== 2)
	            throw new errors_1.InvalidNumberOfChildrenError(name, 2, childrenLength);
	        var base = helpers_1.mathMLElementToLaTeXConverter(children[0]).convert();
	        var subscript = helpers_1.mathMLElementToLaTeXConverter(children[1]).convert();
	        return new helpers_1.ParenthesisWrapper().wrapIfMoreThanOneChar(base) + "_" + new helpers_1.BracketWrapper().wrap(subscript);
	    };
	    return MSub;
	}());
	msub.MSub = MSub;
	return msub;
}

var msubsup = {};

var hasRequiredMsubsup;

function requireMsubsup () {
	if (hasRequiredMsubsup) return msubsup;
	hasRequiredMsubsup = 1;
	Object.defineProperty(msubsup, "__esModule", { value: true });
	msubsup.MSubsup = void 0;
	var helpers_1 = requireHelpers();
	var errors_1 = errors;
	var MSubsup = /** @class */ (function () {
	    function MSubsup(mathElement) {
	        this._mathmlElement = mathElement;
	    }
	    MSubsup.prototype.convert = function () {
	        var _a = this._mathmlElement, name = _a.name, children = _a.children;
	        var childrenLength = children.length;
	        if (childrenLength !== 3)
	            throw new errors_1.InvalidNumberOfChildrenError(name, 3, childrenLength);
	        var base = helpers_1.mathMLElementToLaTeXConverter(children[0]).convert();
	        var sub = helpers_1.mathMLElementToLaTeXConverter(children[1]).convert();
	        var sup = helpers_1.mathMLElementToLaTeXConverter(children[2]).convert();
	        var wrappedSub = new helpers_1.BracketWrapper().wrap(sub);
	        var wrappedSup = new helpers_1.BracketWrapper().wrap(sup);
	        return this._wrapInParenthesisIfThereIsSpace(base) + "_" + wrappedSub + "^" + wrappedSup;
	    };
	    MSubsup.prototype._wrapInParenthesisIfThereIsSpace = function (str) {
	        if (!str.match(/\s+/g))
	            return str;
	        return new helpers_1.ParenthesisWrapper().wrap(str);
	    };
	    return MSubsup;
	}());
	msubsup.MSubsup = MSubsup;
	return msubsup;
}

var mmultiscripts = {};

var hasRequiredMmultiscripts;

function requireMmultiscripts () {
	if (hasRequiredMmultiscripts) return mmultiscripts;
	hasRequiredMmultiscripts = 1;
	Object.defineProperty(mmultiscripts, "__esModule", { value: true });
	mmultiscripts.MMultiscripts = void 0;
	var helpers_1 = requireHelpers();
	var errors_1 = errors;
	var MMultiscripts = /** @class */ (function () {
	    function MMultiscripts(mathElement) {
	        this._mathmlElement = mathElement;
	    }
	    MMultiscripts.prototype.convert = function () {
	        var _a = this._mathmlElement, name = _a.name, children = _a.children;
	        var childrenLength = children.length;
	        if (childrenLength < 3)
	            throw new errors_1.InvalidNumberOfChildrenError(name, 3, childrenLength, 'at least');
	        var baseContent = helpers_1.mathMLElementToLaTeXConverter(children[0]).convert();
	        return this._prescriptLatex() + this._wrapInParenthesisIfThereIsSpace(baseContent) + this._postscriptLatex();
	    };
	    MMultiscripts.prototype._prescriptLatex = function () {
	        var children = this._mathmlElement.children;
	        var sub;
	        var sup;
	        if (this._isPrescripts(children[1])) {
	            sub = children[2];
	            sup = children[3];
	        }
	        else if (this._isPrescripts(children[3])) {
	            sub = children[4];
	            sup = children[5];
	        }
	        else
	            return '';
	        var subLatex = helpers_1.mathMLElementToLaTeXConverter(sub).convert();
	        var supLatex = helpers_1.mathMLElementToLaTeXConverter(sup).convert();
	        return "\\_{" + subLatex + "}^{" + supLatex + "}";
	    };
	    MMultiscripts.prototype._postscriptLatex = function () {
	        var children = this._mathmlElement.children;
	        if (this._isPrescripts(children[1]))
	            return '';
	        var sub = children[1];
	        var sup = children[2];
	        var subLatex = helpers_1.mathMLElementToLaTeXConverter(sub).convert();
	        var supLatex = helpers_1.mathMLElementToLaTeXConverter(sup).convert();
	        return "_{" + subLatex + "}^{" + supLatex + "}";
	    };
	    MMultiscripts.prototype._wrapInParenthesisIfThereIsSpace = function (str) {
	        if (!str.match(/\s+/g))
	            return str;
	        return new helpers_1.ParenthesisWrapper().wrap(str);
	    };
	    MMultiscripts.prototype._isPrescripts = function (child) {
	        return (child === null || child === void 0 ? void 0 : child.name) === 'mprescripts';
	    };
	    return MMultiscripts;
	}());
	mmultiscripts.MMultiscripts = MMultiscripts;
	return mmultiscripts;
}

var mtext = {};

Object.defineProperty(mtext, "__esModule", { value: true });
mtext.MText = void 0;
var MText = /** @class */ (function () {
    function MText(mathElement) {
        this._mathmlElement = mathElement;
    }
    MText.prototype.convert = function () {
        var _a = this._mathmlElement, attributes = _a.attributes, value = _a.value;
        return new TextCommand(attributes.mathvariant).apply(value);
    };
    return MText;
}());
mtext.MText = MText;
var TextCommand = /** @class */ (function () {
    function TextCommand(mathvariant) {
        this._mathvariant = mathvariant || 'normal';
    }
    TextCommand.prototype.apply = function (value) {
        return this._commands.reduce(function (acc, command, index) {
            if (index === 0)
                return command + "{" + value + "}";
            return command + "{" + acc + "}";
        }, '');
    };
    Object.defineProperty(TextCommand.prototype, "_commands", {
        get: function () {
            switch (this._mathvariant) {
                case 'bold':
                    return ['\\textbf'];
                case 'italic':
                    return ['\\textit'];
                case 'bold-italic':
                    return ['\\textit', '\\textbf'];
                case 'double-struck':
                    return ['\\mathbb'];
                case 'monospace':
                    return ['\\mathtt'];
                case 'bold-fraktur':
                case 'fraktur':
                    return ['\\mathfrak'];
                default:
                    return ['\\text'];
            }
        },
        enumerable: false,
        configurable: true
    });
    return TextCommand;
}());

var munderover = {};

var hasRequiredMunderover;

function requireMunderover () {
	if (hasRequiredMunderover) return munderover;
	hasRequiredMunderover = 1;
	Object.defineProperty(munderover, "__esModule", { value: true });
	munderover.MUnderover = void 0;
	var helpers_1 = requireHelpers();
	var errors_1 = errors;
	var MUnderover = /** @class */ (function () {
	    function MUnderover(mathElement) {
	        this._mathmlElement = mathElement;
	    }
	    MUnderover.prototype.convert = function () {
	        var _a = this._mathmlElement, name = _a.name, children = _a.children;
	        var childrenLength = children.length;
	        if (childrenLength !== 3)
	            throw new errors_1.InvalidNumberOfChildrenError(name, 3, childrenLength);
	        var base = helpers_1.mathMLElementToLaTeXConverter(children[0]).convert();
	        var underContent = helpers_1.mathMLElementToLaTeXConverter(children[1]).convert();
	        var overContent = helpers_1.mathMLElementToLaTeXConverter(children[2]).convert();
	        return base + "_{" + underContent + "}^{" + overContent + "}";
	    };
	    return MUnderover;
	}());
	munderover.MUnderover = MUnderover;
	return munderover;
}

var mtable = {};

var hasRequiredMtable;

function requireMtable () {
	if (hasRequiredMtable) return mtable;
	hasRequiredMtable = 1;
	Object.defineProperty(mtable, "__esModule", { value: true });
	mtable.MTable = void 0;
	var helpers_1 = requireHelpers();
	var MTable = /** @class */ (function () {
	    function MTable(mathElement) {
	        this._mathmlElement = mathElement;
	        this._addFlagRecursiveIfName(this._mathmlElement.children, 'mtable', 'innerTable');
	    }
	    MTable.prototype.convert = function () {
	        var tableContent = this._mathmlElement.children
	            .map(function (child) { return helpers_1.mathMLElementToLaTeXConverter(child); })
	            .map(function (converter) { return converter.convert(); })
	            .join(' \\\\\n');
	        return this._hasFlag('innerTable') ? this._wrap(tableContent) : tableContent;
	    };
	    MTable.prototype._wrap = function (latex) {
	        return "\\begin{matrix}" + latex + "\\end{matrix}";
	    };
	    MTable.prototype._addFlagRecursiveIfName = function (mathmlElements, name, flag) {
	        var _this = this;
	        mathmlElements.forEach(function (mathmlElement) {
	            if (mathmlElement.name === name)
	                mathmlElement.attributes[flag] = flag;
	            _this._addFlagRecursiveIfName(mathmlElement.children, name, flag);
	        });
	    };
	    MTable.prototype._hasFlag = function (flag) {
	        return !!this._mathmlElement.attributes[flag];
	    };
	    return MTable;
	}());
	mtable.MTable = MTable;
	return mtable;
}

var mtr = {};

var hasRequiredMtr;

function requireMtr () {
	if (hasRequiredMtr) return mtr;
	hasRequiredMtr = 1;
	Object.defineProperty(mtr, "__esModule", { value: true });
	mtr.MTr = void 0;
	var helpers_1 = requireHelpers();
	var MTr = /** @class */ (function () {
	    function MTr(mathElement) {
	        this._mathmlElement = mathElement;
	    }
	    MTr.prototype.convert = function () {
	        return this._mathmlElement.children
	            .map(function (child) { return helpers_1.mathMLElementToLaTeXConverter(child); })
	            .map(function (converter) { return converter.convert(); })
	            .join(' & ');
	    };
	    return MTr;
	}());
	mtr.MTr = MTr;
	return mtr;
}

var genericSpacingWrapper = {};

var hasRequiredGenericSpacingWrapper;

function requireGenericSpacingWrapper () {
	if (hasRequiredGenericSpacingWrapper) return genericSpacingWrapper;
	hasRequiredGenericSpacingWrapper = 1;
	Object.defineProperty(genericSpacingWrapper, "__esModule", { value: true });
	genericSpacingWrapper.GenericSpacingWrapper = void 0;
	var helpers_1 = requireHelpers();
	var GenericSpacingWrapper = /** @class */ (function () {
	    function GenericSpacingWrapper(mathElement) {
	        this._mathmlElement = mathElement;
	    }
	    GenericSpacingWrapper.prototype.convert = function () {
	        return this._mathmlElement.children
	            .map(function (child) { return helpers_1.mathMLElementToLaTeXConverter(child); })
	            .map(function (converter) { return converter.convert(); })
	            .join(' ');
	    };
	    return GenericSpacingWrapper;
	}());
	genericSpacingWrapper.GenericSpacingWrapper = GenericSpacingWrapper;
	return genericSpacingWrapper;
}

var genericUnderOver = {};

var hasRequiredGenericUnderOver;

function requireGenericUnderOver () {
	if (hasRequiredGenericUnderOver) return genericUnderOver;
	hasRequiredGenericUnderOver = 1;
	Object.defineProperty(genericUnderOver, "__esModule", { value: true });
	genericUnderOver.GenericUnderOver = void 0;
	var mathml_element_to_latex_converter_1 = requireMathmlElementToLatexConverter();
	var errors_1 = errors;
	var latex_accents_1 = latexAccents;
	var GenericUnderOver = /** @class */ (function () {
	    function GenericUnderOver(mathElement) {
	        this._mathmlElement = mathElement;
	    }
	    GenericUnderOver.prototype.convert = function () {
	        var _a = this._mathmlElement, name = _a.name, children = _a.children;
	        var childrenLength = children.length;
	        if (childrenLength !== 2)
	            throw new errors_1.InvalidNumberOfChildrenError(name, 2, childrenLength);
	        var content = mathml_element_to_latex_converter_1.mathMLElementToLaTeXConverter(children[0]).convert();
	        var accent = mathml_element_to_latex_converter_1.mathMLElementToLaTeXConverter(children[1]).convert();
	        return this._applyCommand(content, accent);
	    };
	    GenericUnderOver.prototype._applyCommand = function (content, accent) {
	        var type = this._mathmlElement.name.match(/under/) ? TagTypes.Under : TagTypes.Over;
	        return new UnderOverSetter(type).apply(content, accent);
	    };
	    return GenericUnderOver;
	}());
	genericUnderOver.GenericUnderOver = GenericUnderOver;
	var UnderOverSetter = /** @class */ (function () {
	    function UnderOverSetter(type) {
	        this._type = type;
	    }
	    UnderOverSetter.prototype.apply = function (content, accent) {
	        return latex_accents_1.latexAccents.includes(accent) ? accent + "{" + content + "}" : this._defaultCommand + "{" + accent + "}{" + content + "}";
	    };
	    Object.defineProperty(UnderOverSetter.prototype, "_defaultCommand", {
	        get: function () {
	            if (this._type === TagTypes.Under)
	                return '\\underset';
	            return '\\overset';
	        },
	        enumerable: false,
	        configurable: true
	    });
	    return UnderOverSetter;
	}());
	var TagTypes;
	(function (TagTypes) {
	    TagTypes[TagTypes["Under"] = 0] = "Under";
	    TagTypes[TagTypes["Over"] = 1] = "Over";
	})(TagTypes || (TagTypes = {}));
	return genericUnderOver;
}

var hasRequiredConverters;

function requireConverters () {
	if (hasRequiredConverters) return converters;
	hasRequiredConverters = 1;
	(function (exports) {
		Object.defineProperty(exports, "__esModule", { value: true });
		exports.GenericUnderOver = exports.GenericSpacingWrapper = exports.MTr = exports.MTable = exports.MUnderover = exports.MText = exports.MMultiscripts = exports.MSubsup = exports.MSub = exports.MSup = exports.MPhantom = exports.MError = exports.MEnclose = exports.MAction = exports.MRoot = exports.MFrac = exports.MFenced = exports.MSqrt = exports.MN = exports.MO = exports.MI = exports.Math = void 0;
		var math_1 = requireMath();
		Object.defineProperty(exports, "Math", { enumerable: true, get: function () { return math_1.Math; } });
		var mi_1 = requireMi();
		Object.defineProperty(exports, "MI", { enumerable: true, get: function () { return mi_1.MI; } });
		var mo_1 = requireMo();
		Object.defineProperty(exports, "MO", { enumerable: true, get: function () { return mo_1.MO; } });
		var mn_1 = requireMn();
		Object.defineProperty(exports, "MN", { enumerable: true, get: function () { return mn_1.MN; } });
		var msqrt_1 = requireMsqrt();
		Object.defineProperty(exports, "MSqrt", { enumerable: true, get: function () { return msqrt_1.MSqrt; } });
		var mfenced_1 = requireMfenced();
		Object.defineProperty(exports, "MFenced", { enumerable: true, get: function () { return mfenced_1.MFenced; } });
		var mfrac_1 = requireMfrac();
		Object.defineProperty(exports, "MFrac", { enumerable: true, get: function () { return mfrac_1.MFrac; } });
		var mroot_1 = requireMroot();
		Object.defineProperty(exports, "MRoot", { enumerable: true, get: function () { return mroot_1.MRoot; } });
		var maction_1 = requireMaction();
		Object.defineProperty(exports, "MAction", { enumerable: true, get: function () { return maction_1.MAction; } });
		var menclose_1 = requireMenclose();
		Object.defineProperty(exports, "MEnclose", { enumerable: true, get: function () { return menclose_1.MEnclose; } });
		var merror_1 = requireMerror();
		Object.defineProperty(exports, "MError", { enumerable: true, get: function () { return merror_1.MError; } });
		var mphantom_1 = mphantom;
		Object.defineProperty(exports, "MPhantom", { enumerable: true, get: function () { return mphantom_1.MPhantom; } });
		var msup_1 = requireMsup();
		Object.defineProperty(exports, "MSup", { enumerable: true, get: function () { return msup_1.MSup; } });
		var msub_1 = requireMsub();
		Object.defineProperty(exports, "MSub", { enumerable: true, get: function () { return msub_1.MSub; } });
		var msubsup_1 = requireMsubsup();
		Object.defineProperty(exports, "MSubsup", { enumerable: true, get: function () { return msubsup_1.MSubsup; } });
		var mmultiscripts_1 = requireMmultiscripts();
		Object.defineProperty(exports, "MMultiscripts", { enumerable: true, get: function () { return mmultiscripts_1.MMultiscripts; } });
		var mtext_1 = mtext;
		Object.defineProperty(exports, "MText", { enumerable: true, get: function () { return mtext_1.MText; } });
		var munderover_1 = requireMunderover();
		Object.defineProperty(exports, "MUnderover", { enumerable: true, get: function () { return munderover_1.MUnderover; } });
		var mtable_1 = requireMtable();
		Object.defineProperty(exports, "MTable", { enumerable: true, get: function () { return mtable_1.MTable; } });
		var mtr_1 = requireMtr();
		Object.defineProperty(exports, "MTr", { enumerable: true, get: function () { return mtr_1.MTr; } });
		var generic_spacing_wrapper_1 = requireGenericSpacingWrapper();
		Object.defineProperty(exports, "GenericSpacingWrapper", { enumerable: true, get: function () { return generic_spacing_wrapper_1.GenericSpacingWrapper; } });
		var generic_under_over_1 = requireGenericUnderOver();
		Object.defineProperty(exports, "GenericUnderOver", { enumerable: true, get: function () { return generic_under_over_1.GenericUnderOver; } }); 
	} (converters));
	return converters;
}

var hasRequiredMathmlElementToLatexConverterAdapter;

function requireMathmlElementToLatexConverterAdapter () {
	if (hasRequiredMathmlElementToLatexConverterAdapter) return mathmlElementToLatexConverterAdapter;
	hasRequiredMathmlElementToLatexConverterAdapter = 1;
	var __createBinding = (commonjsGlobal && commonjsGlobal.__createBinding) || (Object.create ? (function(o, m, k, k2) {
	    if (k2 === undefined) k2 = k;
	    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
	}) : (function(o, m, k, k2) {
	    if (k2 === undefined) k2 = k;
	    o[k2] = m[k];
	}));
	var __setModuleDefault = (commonjsGlobal && commonjsGlobal.__setModuleDefault) || (Object.create ? (function(o, v) {
	    Object.defineProperty(o, "default", { enumerable: true, value: v });
	}) : function(o, v) {
	    o["default"] = v;
	});
	var __importStar = (commonjsGlobal && commonjsGlobal.__importStar) || function (mod) {
	    if (mod && mod.__esModule) return mod;
	    var result = {};
	    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
	    __setModuleDefault(result, mod);
	    return result;
	};
	Object.defineProperty(mathmlElementToLatexConverterAdapter, "__esModule", { value: true });
	mathmlElementToLatexConverterAdapter.MathMLElementToLatexConverterAdapter = void 0;
	var ToLatexConverters = __importStar(requireConverters());
	var MathMLElementToLatexConverterAdapter = /** @class */ (function () {
	    function MathMLElementToLatexConverterAdapter(mathMLElement) {
	        this._mathMLElement = mathMLElement;
	    }
	    MathMLElementToLatexConverterAdapter.prototype.toLatexConverter = function () {
	        var name = this._mathMLElement.name;
	        var Converter = fromMathMLElementToLatexConverter[name] || ToLatexConverters.GenericSpacingWrapper;
	        return new Converter(this._mathMLElement);
	    };
	    return MathMLElementToLatexConverterAdapter;
	}());
	mathmlElementToLatexConverterAdapter.MathMLElementToLatexConverterAdapter = MathMLElementToLatexConverterAdapter;
	var fromMathMLElementToLatexConverter = {
	    math: ToLatexConverters.Math,
	    mi: ToLatexConverters.MI,
	    mo: ToLatexConverters.MO,
	    mn: ToLatexConverters.MN,
	    msqrt: ToLatexConverters.MSqrt,
	    mfenced: ToLatexConverters.MFenced,
	    mfrac: ToLatexConverters.MFrac,
	    mroot: ToLatexConverters.MRoot,
	    maction: ToLatexConverters.MAction,
	    menclose: ToLatexConverters.MEnclose,
	    merror: ToLatexConverters.MError,
	    mphantom: ToLatexConverters.MPhantom,
	    msup: ToLatexConverters.MSup,
	    msub: ToLatexConverters.MSub,
	    msubsup: ToLatexConverters.MSubsup,
	    mmultiscripts: ToLatexConverters.MMultiscripts,
	    mtext: ToLatexConverters.MText,
	    munderover: ToLatexConverters.MUnderover,
	    mtable: ToLatexConverters.MTable,
	    mtr: ToLatexConverters.MTr,
	    mover: ToLatexConverters.GenericUnderOver,
	    munder: ToLatexConverters.GenericUnderOver,
	    mrow: ToLatexConverters.GenericSpacingWrapper,
	    mpadded: ToLatexConverters.GenericSpacingWrapper,
	};
	return mathmlElementToLatexConverterAdapter;
}

var factories = {};

var makeToMathElementsConverter$1 = {};

var xmldomToMathmlElements = {};

var xmldomToMathmlElementAdapter = {};

var domParser = {};

var entities = {};

entities.entityMap = {
       lt: '<',
       gt: '>',
       amp: '&',
       quot: '"',
       apos: "'",
       Agrave: "À",
       Aacute: "Á",
       Acirc: "Â",
       Atilde: "Ã",
       Auml: "Ä",
       Aring: "Å",
       AElig: "Æ",
       Ccedil: "Ç",
       Egrave: "È",
       Eacute: "É",
       Ecirc: "Ê",
       Euml: "Ë",
       Igrave: "Ì",
       Iacute: "Í",
       Icirc: "Î",
       Iuml: "Ï",
       ETH: "Ð",
       Ntilde: "Ñ",
       Ograve: "Ò",
       Oacute: "Ó",
       Ocirc: "Ô",
       Otilde: "Õ",
       Ouml: "Ö",
       Oslash: "Ø",
       Ugrave: "Ù",
       Uacute: "Ú",
       Ucirc: "Û",
       Uuml: "Ü",
       Yacute: "Ý",
       THORN: "Þ",
       szlig: "ß",
       agrave: "à",
       aacute: "á",
       acirc: "â",
       atilde: "ã",
       auml: "ä",
       aring: "å",
       aelig: "æ",
       ccedil: "ç",
       egrave: "è",
       eacute: "é",
       ecirc: "ê",
       euml: "ë",
       igrave: "ì",
       iacute: "í",
       icirc: "î",
       iuml: "ï",
       eth: "ð",
       ntilde: "ñ",
       ograve: "ò",
       oacute: "ó",
       ocirc: "ô",
       otilde: "õ",
       ouml: "ö",
       oslash: "ø",
       ugrave: "ù",
       uacute: "ú",
       ucirc: "û",
       uuml: "ü",
       yacute: "ý",
       thorn: "þ",
       yuml: "ÿ",
       nbsp: "\u00a0",
       iexcl: "¡",
       cent: "¢",
       pound: "£",
       curren: "¤",
       yen: "¥",
       brvbar: "¦",
       sect: "§",
       uml: "¨",
       copy: "©",
       ordf: "ª",
       laquo: "«",
       not: "¬",
       shy: "­­",
       reg: "®",
       macr: "¯",
       deg: "°",
       plusmn: "±",
       sup2: "²",
       sup3: "³",
       acute: "´",
       micro: "µ",
       para: "¶",
       middot: "·",
       cedil: "¸",
       sup1: "¹",
       ordm: "º",
       raquo: "»",
       frac14: "¼",
       frac12: "½",
       frac34: "¾",
       iquest: "¿",
       times: "×",
       divide: "÷",
       forall: "∀",
       part: "∂",
       exist: "∃",
       empty: "∅",
       nabla: "∇",
       isin: "∈",
       notin: "∉",
       ni: "∋",
       prod: "∏",
       sum: "∑",
       minus: "−",
       lowast: "∗",
       radic: "√",
       prop: "∝",
       infin: "∞",
       ang: "∠",
       and: "∧",
       or: "∨",
       cap: "∩",
       cup: "∪",
       'int': "∫",
       there4: "∴",
       sim: "∼",
       cong: "≅",
       asymp: "≈",
       ne: "≠",
       equiv: "≡",
       le: "≤",
       ge: "≥",
       sub: "⊂",
       sup: "⊃",
       nsub: "⊄",
       sube: "⊆",
       supe: "⊇",
       oplus: "⊕",
       otimes: "⊗",
       perp: "⊥",
       sdot: "⋅",
       Alpha: "Α",
       Beta: "Β",
       Gamma: "Γ",
       Delta: "Δ",
       Epsilon: "Ε",
       Zeta: "Ζ",
       Eta: "Η",
       Theta: "Θ",
       Iota: "Ι",
       Kappa: "Κ",
       Lambda: "Λ",
       Mu: "Μ",
       Nu: "Ν",
       Xi: "Ξ",
       Omicron: "Ο",
       Pi: "Π",
       Rho: "Ρ",
       Sigma: "Σ",
       Tau: "Τ",
       Upsilon: "Υ",
       Phi: "Φ",
       Chi: "Χ",
       Psi: "Ψ",
       Omega: "Ω",
       alpha: "α",
       beta: "β",
       gamma: "γ",
       delta: "δ",
       epsilon: "ε",
       zeta: "ζ",
       eta: "η",
       theta: "θ",
       iota: "ι",
       kappa: "κ",
       lambda: "λ",
       mu: "μ",
       nu: "ν",
       xi: "ξ",
       omicron: "ο",
       pi: "π",
       rho: "ρ",
       sigmaf: "ς",
       sigma: "σ",
       tau: "τ",
       upsilon: "υ",
       phi: "φ",
       chi: "χ",
       psi: "ψ",
       omega: "ω",
       thetasym: "ϑ",
       upsih: "ϒ",
       piv: "ϖ",
       OElig: "Œ",
       oelig: "œ",
       Scaron: "Š",
       scaron: "š",
       Yuml: "Ÿ",
       fnof: "ƒ",
       circ: "ˆ",
       tilde: "˜",
       ensp: " ",
       emsp: " ",
       thinsp: " ",
       zwnj: "‌",
       zwj: "‍",
       lrm: "‎",
       rlm: "‏",
       ndash: "–",
       mdash: "—",
       lsquo: "‘",
       rsquo: "’",
       sbquo: "‚",
       ldquo: "“",
       rdquo: "”",
       bdquo: "„",
       dagger: "†",
       Dagger: "‡",
       bull: "•",
       hellip: "…",
       permil: "‰",
       prime: "′",
       Prime: "″",
       lsaquo: "‹",
       rsaquo: "›",
       oline: "‾",
       euro: "€",
       trade: "™",
       larr: "←",
       uarr: "↑",
       rarr: "→",
       darr: "↓",
       harr: "↔",
       crarr: "↵",
       lceil: "⌈",
       rceil: "⌉",
       lfloor: "⌊",
       rfloor: "⌋",
       loz: "◊",
       spades: "♠",
       clubs: "♣",
       hearts: "♥",
       diams: "♦"
};

var sax = {};

//[4]   	NameStartChar	   ::=   	":" | [A-Z] | "_" | [a-z] | [#xC0-#xD6] | [#xD8-#xF6] | [#xF8-#x2FF] | [#x370-#x37D] | [#x37F-#x1FFF] | [#x200C-#x200D] | [#x2070-#x218F] | [#x2C00-#x2FEF] | [#x3001-#xD7FF] | [#xF900-#xFDCF] | [#xFDF0-#xFFFD] | [#x10000-#xEFFFF]
//[4a]   	NameChar	   ::=   	NameStartChar | "-" | "." | [0-9] | #xB7 | [#x0300-#x036F] | [#x203F-#x2040]
//[5]   	Name	   ::=   	NameStartChar (NameChar)*
var nameStartChar = /[A-Z_a-z\xC0-\xD6\xD8-\xF6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD]/;//\u10000-\uEFFFF
var nameChar = new RegExp("[\\-\\.0-9"+nameStartChar.source.slice(1,-1)+"\\u00B7\\u0300-\\u036F\\u203F-\\u2040]");
var tagNamePattern = new RegExp('^'+nameStartChar.source+nameChar.source+'*(?:\:'+nameStartChar.source+nameChar.source+'*)?$');
//var tagNamePattern = /^[a-zA-Z_][\w\-\.]*(?:\:[a-zA-Z_][\w\-\.]*)?$/
//var handlers = 'resolveEntity,getExternalSubset,characters,endDocument,endElement,endPrefixMapping,ignorableWhitespace,processingInstruction,setDocumentLocator,skippedEntity,startDocument,startElement,startPrefixMapping,notationDecl,unparsedEntityDecl,error,fatalError,warning,attributeDecl,elementDecl,externalEntityDecl,internalEntityDecl,comment,endCDATA,endDTD,endEntity,startCDATA,startDTD,startEntity'.split(',')

//S_TAG,	S_ATTR,	S_EQ,	S_ATTR_NOQUOT_VALUE
//S_ATTR_SPACE,	S_ATTR_END,	S_TAG_SPACE, S_TAG_CLOSE
var S_TAG = 0;//tag name offerring
var S_ATTR = 1;//attr name offerring 
var S_ATTR_SPACE=2;//attr name end and space offer
var S_EQ = 3;//=space?
var S_ATTR_NOQUOT_VALUE = 4;//attr value(no quot value only)
var S_ATTR_END = 5;//attr value end and no space(quot end)
var S_TAG_SPACE = 6;//(attr value end || tag end ) && (space offer)
var S_TAG_CLOSE = 7;//closed el<el />

function XMLReader$1(){
	
}

XMLReader$1.prototype = {
	parse:function(source,defaultNSMap,entityMap){
		var domBuilder = this.domBuilder;
		domBuilder.startDocument();
		_copy(defaultNSMap ,defaultNSMap = {});
		parse(source,defaultNSMap,entityMap,
				domBuilder,this.errorHandler);
		domBuilder.endDocument();
	}
};
function parse(source,defaultNSMapCopy,entityMap,domBuilder,errorHandler){
	function fixedFromCharCode(code) {
		// String.prototype.fromCharCode does not supports
		// > 2 bytes unicode chars directly
		if (code > 0xffff) {
			code -= 0x10000;
			var surrogate1 = 0xd800 + (code >> 10)
				, surrogate2 = 0xdc00 + (code & 0x3ff);

			return String.fromCharCode(surrogate1, surrogate2);
		} else {
			return String.fromCharCode(code);
		}
	}
	function entityReplacer(a){
		var k = a.slice(1,-1);
		if(k in entityMap){
			return entityMap[k]; 
		}else if(k.charAt(0) === '#'){
			return fixedFromCharCode(parseInt(k.substr(1).replace('x','0x')))
		}else {
			errorHandler.error('entity not found:'+a);
			return a;
		}
	}
	function appendText(end){//has some bugs
		if(end>start){
			var xt = source.substring(start,end).replace(/&#?\w+;/g,entityReplacer);
			locator&&position(start);
			domBuilder.characters(xt,0,end-start);
			start = end;
		}
	}
	function position(p,m){
		while(p>=lineEnd && (m = linePattern.exec(source))){
			lineStart = m.index;
			lineEnd = lineStart + m[0].length;
			locator.lineNumber++;
			//console.log('line++:',locator,startPos,endPos)
		}
		locator.columnNumber = p-lineStart+1;
	}
	var lineStart = 0;
	var lineEnd = 0;
	var linePattern = /.*(?:\r\n?|\n)|.*$/g;
	var locator = domBuilder.locator;
	
	var parseStack = [{currentNSMap:defaultNSMapCopy}];
	var closeMap = {};
	var start = 0;
	while(true){
		try{
			var tagStart = source.indexOf('<',start);
			if(tagStart<0){
				if(!source.substr(start).match(/^\s*$/)){
					var doc = domBuilder.doc;
	    			var text = doc.createTextNode(source.substr(start));
	    			doc.appendChild(text);
	    			domBuilder.currentElement = text;
				}
				return;
			}
			if(tagStart>start){
				appendText(tagStart);
			}
			switch(source.charAt(tagStart+1)){
			case '/':
				var end = source.indexOf('>',tagStart+3);
				var tagName = source.substring(tagStart+2,end);
				var config = parseStack.pop();
				if(end<0){
					
	        		tagName = source.substring(tagStart+2).replace(/[\s<].*/,'');
	        		//console.error('#@@@@@@'+tagName)
	        		errorHandler.error("end tag name: "+tagName+' is not complete:'+config.tagName);
	        		end = tagStart+1+tagName.length;
	        	}else if(tagName.match(/\s</)){
	        		tagName = tagName.replace(/[\s<].*/,'');
	        		errorHandler.error("end tag name: "+tagName+' maybe not complete');
	        		end = tagStart+1+tagName.length;
				}
				//console.error(parseStack.length,parseStack)
				//console.error(config);
				var localNSMap = config.localNSMap;
				var endMatch = config.tagName == tagName;
				var endIgnoreCaseMach = endMatch || config.tagName&&config.tagName.toLowerCase() == tagName.toLowerCase();
		        if(endIgnoreCaseMach){
		        	domBuilder.endElement(config.uri,config.localName,tagName);
					if(localNSMap){
						for(var prefix in localNSMap){
							domBuilder.endPrefixMapping(prefix) ;
						}
					}
					if(!endMatch){
		            	errorHandler.fatalError("end tag name: "+tagName+' is not match the current start tagName:'+config.tagName );
					}
		        }else {
		        	parseStack.push(config);
		        }
				
				end++;
				break;
				// end elment
			case '?':// <?...?>
				locator&&position(tagStart);
				end = parseInstruction(source,tagStart,domBuilder);
				break;
			case '!':// <!doctype,<![CDATA,<!--
				locator&&position(tagStart);
				end = parseDCC(source,tagStart,domBuilder,errorHandler);
				break;
			default:
				locator&&position(tagStart);
				var el = new ElementAttributes();
				var currentNSMap = parseStack[parseStack.length-1].currentNSMap;
				//elStartEnd
				var end = parseElementStartPart(source,tagStart,el,currentNSMap,entityReplacer,errorHandler);
				var len = el.length;
				
				
				if(!el.closed && fixSelfClosed(source,end,el.tagName,closeMap)){
					el.closed = true;
					if(!entityMap.nbsp){
						errorHandler.warning('unclosed xml attribute');
					}
				}
				if(locator && len){
					var locator2 = copyLocator(locator,{});
					//try{//attribute position fixed
					for(var i = 0;i<len;i++){
						var a = el[i];
						position(a.offset);
						a.locator = copyLocator(locator,{});
					}
					//}catch(e){console.error('@@@@@'+e)}
					domBuilder.locator = locator2;
					if(appendElement$1(el,domBuilder,currentNSMap)){
						parseStack.push(el);
					}
					domBuilder.locator = locator;
				}else {
					if(appendElement$1(el,domBuilder,currentNSMap)){
						parseStack.push(el);
					}
				}
				
				
				
				if(el.uri === 'http://www.w3.org/1999/xhtml' && !el.closed){
					end = parseHtmlSpecialContent(source,end,el.tagName,entityReplacer,domBuilder);
				}else {
					end++;
				}
			}
		}catch(e){
			errorHandler.error('element parse error: '+e);
			//errorHandler.error('element parse error: '+e);
			end = -1;
			//throw e;
		}
		if(end>start){
			start = end;
		}else {
			//TODO: 这里有可能sax回退，有位置错误风险
			appendText(Math.max(tagStart,start)+1);
		}
	}
}
function copyLocator(f,t){
	t.lineNumber = f.lineNumber;
	t.columnNumber = f.columnNumber;
	return t;
}

/**
 * @see #appendElement(source,elStartEnd,el,selfClosed,entityReplacer,domBuilder,parseStack);
 * @return end of the elementStartPart(end of elementEndPart for selfClosed el)
 */
function parseElementStartPart(source,start,el,currentNSMap,entityReplacer,errorHandler){
	var attrName;
	var value;
	var p = ++start;
	var s = S_TAG;//status
	while(true){
		var c = source.charAt(p);
		switch(c){
		case '=':
			if(s === S_ATTR){//attrName
				attrName = source.slice(start,p);
				s = S_EQ;
			}else if(s === S_ATTR_SPACE){
				s = S_EQ;
			}else {
				//fatalError: equal must after attrName or space after attrName
				throw new Error('attribute equal must after attrName');
			}
			break;
		case '\'':
		case '"':
			if(s === S_EQ || s === S_ATTR //|| s == S_ATTR_SPACE
				){//equal
				if(s === S_ATTR){
					errorHandler.warning('attribute value must after "="');
					attrName = source.slice(start,p);
				}
				start = p+1;
				p = source.indexOf(c,start);
				if(p>0){
					value = source.slice(start,p).replace(/&#?\w+;/g,entityReplacer);
					el.add(attrName,value,start-1);
					s = S_ATTR_END;
				}else {
					//fatalError: no end quot match
					throw new Error('attribute value no end \''+c+'\' match');
				}
			}else if(s == S_ATTR_NOQUOT_VALUE){
				value = source.slice(start,p).replace(/&#?\w+;/g,entityReplacer);
				//console.log(attrName,value,start,p)
				el.add(attrName,value,start);
				//console.dir(el)
				errorHandler.warning('attribute "'+attrName+'" missed start quot('+c+')!!');
				start = p+1;
				s = S_ATTR_END;
			}else {
				//fatalError: no equal before
				throw new Error('attribute value must after "="');
			}
			break;
		case '/':
			switch(s){
			case S_TAG:
				el.setTagName(source.slice(start,p));
			case S_ATTR_END:
			case S_TAG_SPACE:
			case S_TAG_CLOSE:
				s =S_TAG_CLOSE;
				el.closed = true;
			case S_ATTR_NOQUOT_VALUE:
			case S_ATTR:
			case S_ATTR_SPACE:
				break;
			//case S_EQ:
			default:
				throw new Error("attribute invalid close char('/')")
			}
			break;
		case ''://end document
			//throw new Error('unexpected end of input')
			errorHandler.error('unexpected end of input');
			if(s == S_TAG){
				el.setTagName(source.slice(start,p));
			}
			return p;
		case '>':
			switch(s){
			case S_TAG:
				el.setTagName(source.slice(start,p));
			case S_ATTR_END:
			case S_TAG_SPACE:
			case S_TAG_CLOSE:
				break;//normal
			case S_ATTR_NOQUOT_VALUE://Compatible state
			case S_ATTR:
				value = source.slice(start,p);
				if(value.slice(-1) === '/'){
					el.closed  = true;
					value = value.slice(0,-1);
				}
			case S_ATTR_SPACE:
				if(s === S_ATTR_SPACE){
					value = attrName;
				}
				if(s == S_ATTR_NOQUOT_VALUE){
					errorHandler.warning('attribute "'+value+'" missed quot(")!!');
					el.add(attrName,value.replace(/&#?\w+;/g,entityReplacer),start);
				}else {
					if(currentNSMap[''] !== 'http://www.w3.org/1999/xhtml' || !value.match(/^(?:disabled|checked|selected)$/i)){
						errorHandler.warning('attribute "'+value+'" missed value!! "'+value+'" instead!!');
					}
					el.add(value,value,start);
				}
				break;
			case S_EQ:
				throw new Error('attribute value missed!!');
			}
//			console.log(tagName,tagNamePattern,tagNamePattern.test(tagName))
			return p;
		/*xml space '\x20' | #x9 | #xD | #xA; */
		case '\u0080':
			c = ' ';
		default:
			if(c<= ' '){//space
				switch(s){
				case S_TAG:
					el.setTagName(source.slice(start,p));//tagName
					s = S_TAG_SPACE;
					break;
				case S_ATTR:
					attrName = source.slice(start,p);
					s = S_ATTR_SPACE;
					break;
				case S_ATTR_NOQUOT_VALUE:
					var value = source.slice(start,p).replace(/&#?\w+;/g,entityReplacer);
					errorHandler.warning('attribute "'+value+'" missed quot(")!!');
					el.add(attrName,value,start);
				case S_ATTR_END:
					s = S_TAG_SPACE;
					break;
				//case S_TAG_SPACE:
				//case S_EQ:
				//case S_ATTR_SPACE:
				//	void();break;
				//case S_TAG_CLOSE:
					//ignore warning
				}
			}else {//not space
//S_TAG,	S_ATTR,	S_EQ,	S_ATTR_NOQUOT_VALUE
//S_ATTR_SPACE,	S_ATTR_END,	S_TAG_SPACE, S_TAG_CLOSE
				switch(s){
				//case S_TAG:void();break;
				//case S_ATTR:void();break;
				//case S_ATTR_NOQUOT_VALUE:void();break;
				case S_ATTR_SPACE:
					el.tagName;
					if(currentNSMap[''] !== 'http://www.w3.org/1999/xhtml' || !attrName.match(/^(?:disabled|checked|selected)$/i)){
						errorHandler.warning('attribute "'+attrName+'" missed value!! "'+attrName+'" instead2!!');
					}
					el.add(attrName,attrName,start);
					start = p;
					s = S_ATTR;
					break;
				case S_ATTR_END:
					errorHandler.warning('attribute space is required"'+attrName+'"!!');
				case S_TAG_SPACE:
					s = S_ATTR;
					start = p;
					break;
				case S_EQ:
					s = S_ATTR_NOQUOT_VALUE;
					start = p;
					break;
				case S_TAG_CLOSE:
					throw new Error("elements closed character '/' and '>' must be connected to");
				}
			}
		}//end outer switch
		//console.log('p++',p)
		p++;
	}
}
/**
 * @return true if has new namespace define
 */
function appendElement$1(el,domBuilder,currentNSMap){
	var tagName = el.tagName;
	var localNSMap = null;
	//var currentNSMap = parseStack[parseStack.length-1].currentNSMap;
	var i = el.length;
	while(i--){
		var a = el[i];
		var qName = a.qName;
		var value = a.value;
		var nsp = qName.indexOf(':');
		if(nsp>0){
			var prefix = a.prefix = qName.slice(0,nsp);
			var localName = qName.slice(nsp+1);
			var nsPrefix = prefix === 'xmlns' && localName;
		}else {
			localName = qName;
			prefix = null;
			nsPrefix = qName === 'xmlns' && '';
		}
		//can not set prefix,because prefix !== ''
		a.localName = localName ;
		//prefix == null for no ns prefix attribute 
		if(nsPrefix !== false){//hack!!
			if(localNSMap == null){
				localNSMap = {};
				//console.log(currentNSMap,0)
				_copy(currentNSMap,currentNSMap={});
				//console.log(currentNSMap,1)
			}
			currentNSMap[nsPrefix] = localNSMap[nsPrefix] = value;
			a.uri = 'http://www.w3.org/2000/xmlns/';
			domBuilder.startPrefixMapping(nsPrefix, value); 
		}
	}
	var i = el.length;
	while(i--){
		a = el[i];
		var prefix = a.prefix;
		if(prefix){//no prefix attribute has no namespace
			if(prefix === 'xml'){
				a.uri = 'http://www.w3.org/XML/1998/namespace';
			}if(prefix !== 'xmlns'){
				a.uri = currentNSMap[prefix || ''];
				
				//{console.log('###'+a.qName,domBuilder.locator.systemId+'',currentNSMap,a.uri)}
			}
		}
	}
	var nsp = tagName.indexOf(':');
	if(nsp>0){
		prefix = el.prefix = tagName.slice(0,nsp);
		localName = el.localName = tagName.slice(nsp+1);
	}else {
		prefix = null;//important!!
		localName = el.localName = tagName;
	}
	//no prefix element has default namespace
	var ns = el.uri = currentNSMap[prefix || ''];
	domBuilder.startElement(ns,localName,tagName,el);
	//endPrefixMapping and startPrefixMapping have not any help for dom builder
	//localNSMap = null
	if(el.closed){
		domBuilder.endElement(ns,localName,tagName);
		if(localNSMap){
			for(prefix in localNSMap){
				domBuilder.endPrefixMapping(prefix); 
			}
		}
	}else {
		el.currentNSMap = currentNSMap;
		el.localNSMap = localNSMap;
		//parseStack.push(el);
		return true;
	}
}
function parseHtmlSpecialContent(source,elStartEnd,tagName,entityReplacer,domBuilder){
	if(/^(?:script|textarea)$/i.test(tagName)){
		var elEndStart =  source.indexOf('</'+tagName+'>',elStartEnd);
		var text = source.substring(elStartEnd+1,elEndStart);
		if(/[&<]/.test(text)){
			if(/^script$/i.test(tagName)){
				//if(!/\]\]>/.test(text)){
					//lexHandler.startCDATA();
					domBuilder.characters(text,0,text.length);
					//lexHandler.endCDATA();
					return elEndStart;
				//}
			}//}else{//text area
				text = text.replace(/&#?\w+;/g,entityReplacer);
				domBuilder.characters(text,0,text.length);
				return elEndStart;
			//}
			
		}
	}
	return elStartEnd+1;
}
function fixSelfClosed(source,elStartEnd,tagName,closeMap){
	//if(tagName in closeMap){
	var pos = closeMap[tagName];
	if(pos == null){
		//console.log(tagName)
		pos =  source.lastIndexOf('</'+tagName+'>');
		if(pos<elStartEnd){//忘记闭合
			pos = source.lastIndexOf('</'+tagName);
		}
		closeMap[tagName] =pos;
	}
	return pos<elStartEnd;
	//} 
}
function _copy(source,target){
	for(var n in source){target[n] = source[n];}
}
function parseDCC(source,start,domBuilder,errorHandler){//sure start with '<!'
	var next= source.charAt(start+2);
	switch(next){
	case '-':
		if(source.charAt(start + 3) === '-'){
			var end = source.indexOf('-->',start+4);
			//append comment source.substring(4,end)//<!--
			if(end>start){
				domBuilder.comment(source,start+4,end-start-4);
				return end+3;
			}else {
				errorHandler.error("Unclosed comment");
				return -1;
			}
		}else {
			//error
			return -1;
		}
	default:
		if(source.substr(start+3,6) == 'CDATA['){
			var end = source.indexOf(']]>',start+9);
			domBuilder.startCDATA();
			domBuilder.characters(source,start+9,end-start-9);
			domBuilder.endCDATA(); 
			return end+3;
		}
		//<!DOCTYPE
		//startDTD(java.lang.String name, java.lang.String publicId, java.lang.String systemId) 
		var matchs = split(source,start);
		var len = matchs.length;
		if(len>1 && /!doctype/i.test(matchs[0][0])){
			var name = matchs[1][0];
			var pubid = false;
			var sysid = false;
			if(len>3){
				if(/^public$/i.test(matchs[2][0])){
					pubid = matchs[3][0];
					sysid = len>4 && matchs[4][0];
				}else if(/^system$/i.test(matchs[2][0])){
					sysid = matchs[3][0];
				}
			}
			var lastMatch = matchs[len-1];
			domBuilder.startDTD(name,pubid && pubid.replace(/^(['"])(.*?)\1$/,'$2'),
					sysid && sysid.replace(/^(['"])(.*?)\1$/,'$2'));
			domBuilder.endDTD();
			
			return lastMatch.index+lastMatch[0].length
		}
	}
	return -1;
}



function parseInstruction(source,start,domBuilder){
	var end = source.indexOf('?>',start);
	if(end){
		var match = source.substring(start,end).match(/^<\?(\S*)\s*([\s\S]*?)\s*$/);
		if(match){
			match[0].length;
			domBuilder.processingInstruction(match[1], match[2]) ;
			return end+2;
		}else {//error
			return -1;
		}
	}
	return -1;
}

/**
 * @param source
 */
function ElementAttributes(source){
	
}
ElementAttributes.prototype = {
	setTagName:function(tagName){
		if(!tagNamePattern.test(tagName)){
			throw new Error('invalid tagName:'+tagName)
		}
		this.tagName = tagName;
	},
	add:function(qName,value,offset){
		if(!tagNamePattern.test(qName)){
			throw new Error('invalid attribute:'+qName)
		}
		this[this.length++] = {qName:qName,value:value,offset:offset};
	},
	length:0,
	getLocalName:function(i){return this[i].localName},
	getLocator:function(i){return this[i].locator},
	getQName:function(i){return this[i].qName},
	getURI:function(i){return this[i].uri},
	getValue:function(i){return this[i].value}
//	,getIndex:function(uri, localName)){
//		if(localName){
//			
//		}else{
//			var qName = uri
//		}
//	},
//	getValue:function(){return this.getValue(this.getIndex.apply(this,arguments))},
//	getType:function(uri,localName){}
//	getType:function(i){},
};



function split(source,start){
	var match;
	var buf = [];
	var reg = /'[^']+'|"[^"]+"|[^\s<>\/=]+=?|(\/?\s*>|<)/g;
	reg.lastIndex = start;
	reg.exec(source);//skip <
	while(match = reg.exec(source)){
		buf.push(match);
		if(match[1])return buf;
	}
}

sax.XMLReader = XMLReader$1;

var dom = {};

/*
 * DOM Level 2
 * Object DOMException
 * @see http://www.w3.org/TR/REC-DOM-Level-1/ecma-script-language-binding.html
 * @see http://www.w3.org/TR/2000/REC-DOM-Level-2-Core-20001113/ecma-script-binding.html
 */

function copy(src,dest){
	for(var p in src){
		dest[p] = src[p];
	}
}
/**
^\w+\.prototype\.([_\w]+)\s*=\s*((?:.*\{\s*?[\r\n][\s\S]*?^})|\S.*?(?=[;\r\n]));?
^\w+\.prototype\.([_\w]+)\s*=\s*(\S.*?(?=[;\r\n]));?
 */
function _extends(Class,Super){
	var pt = Class.prototype;
	if(!(pt instanceof Super)){
		function t(){}		t.prototype = Super.prototype;
		t = new t();
		copy(pt,t);
		Class.prototype = pt = t;
	}
	if(pt.constructor != Class){
		if(typeof Class != 'function'){
			console.error("unknow Class:"+Class);
		}
		pt.constructor = Class;
	}
}
var htmlns = 'http://www.w3.org/1999/xhtml' ;
// Node Types
var NodeType = {};
var ELEMENT_NODE                = NodeType.ELEMENT_NODE                = 1;
var ATTRIBUTE_NODE              = NodeType.ATTRIBUTE_NODE              = 2;
var TEXT_NODE                   = NodeType.TEXT_NODE                   = 3;
var CDATA_SECTION_NODE          = NodeType.CDATA_SECTION_NODE          = 4;
var ENTITY_REFERENCE_NODE       = NodeType.ENTITY_REFERENCE_NODE       = 5;
var ENTITY_NODE                 = NodeType.ENTITY_NODE                 = 6;
var PROCESSING_INSTRUCTION_NODE = NodeType.PROCESSING_INSTRUCTION_NODE = 7;
var COMMENT_NODE                = NodeType.COMMENT_NODE                = 8;
var DOCUMENT_NODE               = NodeType.DOCUMENT_NODE               = 9;
var DOCUMENT_TYPE_NODE          = NodeType.DOCUMENT_TYPE_NODE          = 10;
var DOCUMENT_FRAGMENT_NODE      = NodeType.DOCUMENT_FRAGMENT_NODE      = 11;
var NOTATION_NODE               = NodeType.NOTATION_NODE               = 12;

// ExceptionCode
var ExceptionCode = {};
var ExceptionMessage = {};
ExceptionCode.INDEX_SIZE_ERR              = ((ExceptionMessage[1]="Index size error"),1);
ExceptionCode.DOMSTRING_SIZE_ERR          = ((ExceptionMessage[2]="DOMString size error"),2);
var HIERARCHY_REQUEST_ERR       = ExceptionCode.HIERARCHY_REQUEST_ERR       = ((ExceptionMessage[3]="Hierarchy request error"),3);
ExceptionCode.WRONG_DOCUMENT_ERR          = ((ExceptionMessage[4]="Wrong document"),4);
ExceptionCode.INVALID_CHARACTER_ERR       = ((ExceptionMessage[5]="Invalid character"),5);
ExceptionCode.NO_DATA_ALLOWED_ERR         = ((ExceptionMessage[6]="No data allowed"),6);
ExceptionCode.NO_MODIFICATION_ALLOWED_ERR = ((ExceptionMessage[7]="No modification allowed"),7);
var NOT_FOUND_ERR               = ExceptionCode.NOT_FOUND_ERR               = ((ExceptionMessage[8]="Not found"),8);
ExceptionCode.NOT_SUPPORTED_ERR           = ((ExceptionMessage[9]="Not supported"),9);
var INUSE_ATTRIBUTE_ERR         = ExceptionCode.INUSE_ATTRIBUTE_ERR         = ((ExceptionMessage[10]="Attribute in use"),10);
//level2
ExceptionCode.INVALID_STATE_ERR        	= ((ExceptionMessage[11]="Invalid state"),11);
ExceptionCode.SYNTAX_ERR               	= ((ExceptionMessage[12]="Syntax error"),12);
ExceptionCode.INVALID_MODIFICATION_ERR 	= ((ExceptionMessage[13]="Invalid modification"),13);
ExceptionCode.NAMESPACE_ERR           	= ((ExceptionMessage[14]="Invalid namespace"),14);
ExceptionCode.INVALID_ACCESS_ERR      	= ((ExceptionMessage[15]="Invalid access"),15);


function DOMException(code, message) {
	if(message instanceof Error){
		var error = message;
	}else {
		error = this;
		Error.call(this, ExceptionMessage[code]);
		this.message = ExceptionMessage[code];
		if(Error.captureStackTrace) Error.captureStackTrace(this, DOMException);
	}
	error.code = code;
	if(message) this.message = this.message + ": " + message;
	return error;
}DOMException.prototype = Error.prototype;
copy(ExceptionCode,DOMException);
/**
 * @see http://www.w3.org/TR/2000/REC-DOM-Level-2-Core-20001113/core.html#ID-536297177
 * The NodeList interface provides the abstraction of an ordered collection of nodes, without defining or constraining how this collection is implemented. NodeList objects in the DOM are live.
 * The items in the NodeList are accessible via an integral index, starting from 0.
 */
function NodeList() {
}NodeList.prototype = {
	/**
	 * The number of nodes in the list. The range of valid child node indices is 0 to length-1 inclusive.
	 * @standard level1
	 */
	length:0, 
	/**
	 * Returns the indexth item in the collection. If index is greater than or equal to the number of nodes in the list, this returns null.
	 * @standard level1
	 * @param index  unsigned long 
	 *   Index into the collection.
	 * @return Node
	 * 	The node at the indexth position in the NodeList, or null if that is not a valid index. 
	 */
	item: function(index) {
		return this[index] || null;
	},
	toString:function(isHTML,nodeFilter){
		for(var buf = [], i = 0;i<this.length;i++){
			serializeToString(this[i],buf,isHTML,nodeFilter);
		}
		return buf.join('');
	}
};
function LiveNodeList(node,refresh){
	this._node = node;
	this._refresh = refresh;
	_updateLiveList(this);
}
function _updateLiveList(list){
	var inc = list._node._inc || list._node.ownerDocument._inc;
	if(list._inc != inc){
		var ls = list._refresh(list._node);
		//console.log(ls.length)
		__set__(list,'length',ls.length);
		copy(ls,list);
		list._inc = inc;
	}
}
LiveNodeList.prototype.item = function(i){
	_updateLiveList(this);
	return this[i];
};

_extends(LiveNodeList,NodeList);
/**
 * 
 * Objects implementing the NamedNodeMap interface are used to represent collections of nodes that can be accessed by name. Note that NamedNodeMap does not inherit from NodeList; NamedNodeMaps are not maintained in any particular order. Objects contained in an object implementing NamedNodeMap may also be accessed by an ordinal index, but this is simply to allow convenient enumeration of the contents of a NamedNodeMap, and does not imply that the DOM specifies an order to these Nodes.
 * NamedNodeMap objects in the DOM are live.
 * used for attributes or DocumentType entities 
 */
function NamedNodeMap() {
}
function _findNodeIndex(list,node){
	var i = list.length;
	while(i--){
		if(list[i] === node){return i}
	}
}

function _addNamedNode(el,list,newAttr,oldAttr){
	if(oldAttr){
		list[_findNodeIndex(list,oldAttr)] = newAttr;
	}else {
		list[list.length++] = newAttr;
	}
	if(el){
		newAttr.ownerElement = el;
		var doc = el.ownerDocument;
		if(doc){
			oldAttr && _onRemoveAttribute(doc,el,oldAttr);
			_onAddAttribute(doc,el,newAttr);
		}
	}
}
function _removeNamedNode(el,list,attr){
	//console.log('remove attr:'+attr)
	var i = _findNodeIndex(list,attr);
	if(i>=0){
		var lastIndex = list.length-1;
		while(i<lastIndex){
			list[i] = list[++i];
		}
		list.length = lastIndex;
		if(el){
			var doc = el.ownerDocument;
			if(doc){
				_onRemoveAttribute(doc,el,attr);
				attr.ownerElement = null;
			}
		}
	}else {
		throw DOMException(NOT_FOUND_ERR,new Error(el.tagName+'@'+attr))
	}
}
NamedNodeMap.prototype = {
	length:0,
	item:NodeList.prototype.item,
	getNamedItem: function(key) {
//		if(key.indexOf(':')>0 || key == 'xmlns'){
//			return null;
//		}
		//console.log()
		var i = this.length;
		while(i--){
			var attr = this[i];
			//console.log(attr.nodeName,key)
			if(attr.nodeName == key){
				return attr;
			}
		}
	},
	setNamedItem: function(attr) {
		var el = attr.ownerElement;
		if(el && el!=this._ownerElement){
			throw new DOMException(INUSE_ATTRIBUTE_ERR);
		}
		var oldAttr = this.getNamedItem(attr.nodeName);
		_addNamedNode(this._ownerElement,this,attr,oldAttr);
		return oldAttr;
	},
	/* returns Node */
	setNamedItemNS: function(attr) {// raises: WRONG_DOCUMENT_ERR,NO_MODIFICATION_ALLOWED_ERR,INUSE_ATTRIBUTE_ERR
		var el = attr.ownerElement, oldAttr;
		if(el && el!=this._ownerElement){
			throw new DOMException(INUSE_ATTRIBUTE_ERR);
		}
		oldAttr = this.getNamedItemNS(attr.namespaceURI,attr.localName);
		_addNamedNode(this._ownerElement,this,attr,oldAttr);
		return oldAttr;
	},

	/* returns Node */
	removeNamedItem: function(key) {
		var attr = this.getNamedItem(key);
		_removeNamedNode(this._ownerElement,this,attr);
		return attr;
		
		
	},// raises: NOT_FOUND_ERR,NO_MODIFICATION_ALLOWED_ERR
	
	//for level2
	removeNamedItemNS:function(namespaceURI,localName){
		var attr = this.getNamedItemNS(namespaceURI,localName);
		_removeNamedNode(this._ownerElement,this,attr);
		return attr;
	},
	getNamedItemNS: function(namespaceURI, localName) {
		var i = this.length;
		while(i--){
			var node = this[i];
			if(node.localName == localName && node.namespaceURI == namespaceURI){
				return node;
			}
		}
		return null;
	}
};
/**
 * @see http://www.w3.org/TR/REC-DOM-Level-1/level-one-core.html#ID-102161490
 */
function DOMImplementation$1(/* Object */ features) {
	this._features = {};
	if (features) {
		for (var feature in features) {
			 this._features = features[feature];
		}
	}
}
DOMImplementation$1.prototype = {
	hasFeature: function(/* string */ feature, /* string */ version) {
		var versions = this._features[feature.toLowerCase()];
		if (versions && (!version || version in versions)) {
			return true;
		} else {
			return false;
		}
	},
	// Introduced in DOM Level 2:
	createDocument:function(namespaceURI,  qualifiedName, doctype){// raises:INVALID_CHARACTER_ERR,NAMESPACE_ERR,WRONG_DOCUMENT_ERR
		var doc = new Document();
		doc.implementation = this;
		doc.childNodes = new NodeList();
		doc.doctype = doctype;
		if(doctype){
			doc.appendChild(doctype);
		}
		if(qualifiedName){
			var root = doc.createElementNS(namespaceURI,qualifiedName);
			doc.appendChild(root);
		}
		return doc;
	},
	// Introduced in DOM Level 2:
	createDocumentType:function(qualifiedName, publicId, systemId){// raises:INVALID_CHARACTER_ERR,NAMESPACE_ERR
		var node = new DocumentType();
		node.name = qualifiedName;
		node.nodeName = qualifiedName;
		node.publicId = publicId;
		node.systemId = systemId;
		// Introduced in DOM Level 2:
		//readonly attribute DOMString        internalSubset;
		
		//TODO:..
		//  readonly attribute NamedNodeMap     entities;
		//  readonly attribute NamedNodeMap     notations;
		return node;
	}
};


/**
 * @see http://www.w3.org/TR/2000/REC-DOM-Level-2-Core-20001113/core.html#ID-1950641247
 */

function Node() {
}
Node.prototype = {
	firstChild : null,
	lastChild : null,
	previousSibling : null,
	nextSibling : null,
	attributes : null,
	parentNode : null,
	childNodes : null,
	ownerDocument : null,
	nodeValue : null,
	namespaceURI : null,
	prefix : null,
	localName : null,
	// Modified in DOM Level 2:
	insertBefore:function(newChild, refChild){//raises 
		return _insertBefore(this,newChild,refChild);
	},
	replaceChild:function(newChild, oldChild){//raises 
		this.insertBefore(newChild,oldChild);
		if(oldChild){
			this.removeChild(oldChild);
		}
	},
	removeChild:function(oldChild){
		return _removeChild(this,oldChild);
	},
	appendChild:function(newChild){
		return this.insertBefore(newChild,null);
	},
	hasChildNodes:function(){
		return this.firstChild != null;
	},
	cloneNode:function(deep){
		return cloneNode(this.ownerDocument||this,this,deep);
	},
	// Modified in DOM Level 2:
	normalize:function(){
		var child = this.firstChild;
		while(child){
			var next = child.nextSibling;
			if(next && next.nodeType == TEXT_NODE && child.nodeType == TEXT_NODE){
				this.removeChild(next);
				child.appendData(next.data);
			}else {
				child.normalize();
				child = next;
			}
		}
	},
  	// Introduced in DOM Level 2:
	isSupported:function(feature, version){
		return this.ownerDocument.implementation.hasFeature(feature,version);
	},
    // Introduced in DOM Level 2:
    hasAttributes:function(){
    	return this.attributes.length>0;
    },
    lookupPrefix:function(namespaceURI){
    	var el = this;
    	while(el){
    		var map = el._nsMap;
    		//console.dir(map)
    		if(map){
    			for(var n in map){
    				if(map[n] == namespaceURI){
    					return n;
    				}
    			}
    		}
    		el = el.nodeType == ATTRIBUTE_NODE?el.ownerDocument : el.parentNode;
    	}
    	return null;
    },
    // Introduced in DOM Level 3:
    lookupNamespaceURI:function(prefix){
    	var el = this;
    	while(el){
    		var map = el._nsMap;
    		//console.dir(map)
    		if(map){
    			if(prefix in map){
    				return map[prefix] ;
    			}
    		}
    		el = el.nodeType == ATTRIBUTE_NODE?el.ownerDocument : el.parentNode;
    	}
    	return null;
    },
    // Introduced in DOM Level 3:
    isDefaultNamespace:function(namespaceURI){
    	var prefix = this.lookupPrefix(namespaceURI);
    	return prefix == null;
    }
};


function _xmlEncoder(c){
	return c == '<' && '&lt;' ||
         c == '>' && '&gt;' ||
         c == '&' && '&amp;' ||
         c == '"' && '&quot;' ||
         '&#'+c.charCodeAt()+';'
}


copy(NodeType,Node);
copy(NodeType,Node.prototype);

/**
 * @param callback return true for continue,false for break
 * @return boolean true: break visit;
 */
function _visitNode(node,callback){
	if(callback(node)){
		return true;
	}
	if(node = node.firstChild){
		do{
			if(_visitNode(node,callback)){return true}
        }while(node=node.nextSibling)
    }
}



function Document(){
}
function _onAddAttribute(doc,el,newAttr){
	doc && doc._inc++;
	var ns = newAttr.namespaceURI ;
	if(ns == 'http://www.w3.org/2000/xmlns/'){
		//update namespace
		el._nsMap[newAttr.prefix?newAttr.localName:''] = newAttr.value;
	}
}
function _onRemoveAttribute(doc,el,newAttr,remove){
	doc && doc._inc++;
	var ns = newAttr.namespaceURI ;
	if(ns == 'http://www.w3.org/2000/xmlns/'){
		//update namespace
		delete el._nsMap[newAttr.prefix?newAttr.localName:''];
	}
}
function _onUpdateChild(doc,el,newChild){
	if(doc && doc._inc){
		doc._inc++;
		//update childNodes
		var cs = el.childNodes;
		if(newChild){
			cs[cs.length++] = newChild;
		}else {
			//console.log(1)
			var child = el.firstChild;
			var i = 0;
			while(child){
				cs[i++] = child;
				child =child.nextSibling;
			}
			cs.length = i;
		}
	}
}

/**
 * attributes;
 * children;
 * 
 * writeable properties:
 * nodeValue,Attr:value,CharacterData:data
 * prefix
 */
function _removeChild(parentNode,child){
	var previous = child.previousSibling;
	var next = child.nextSibling;
	if(previous){
		previous.nextSibling = next;
	}else {
		parentNode.firstChild = next;
	}
	if(next){
		next.previousSibling = previous;
	}else {
		parentNode.lastChild = previous;
	}
	_onUpdateChild(parentNode.ownerDocument,parentNode);
	return child;
}
/**
 * preformance key(refChild == null)
 */
function _insertBefore(parentNode,newChild,nextChild){
	var cp = newChild.parentNode;
	if(cp){
		cp.removeChild(newChild);//remove and update
	}
	if(newChild.nodeType === DOCUMENT_FRAGMENT_NODE){
		var newFirst = newChild.firstChild;
		if (newFirst == null) {
			return newChild;
		}
		var newLast = newChild.lastChild;
	}else {
		newFirst = newLast = newChild;
	}
	var pre = nextChild ? nextChild.previousSibling : parentNode.lastChild;

	newFirst.previousSibling = pre;
	newLast.nextSibling = nextChild;
	
	
	if(pre){
		pre.nextSibling = newFirst;
	}else {
		parentNode.firstChild = newFirst;
	}
	if(nextChild == null){
		parentNode.lastChild = newLast;
	}else {
		nextChild.previousSibling = newLast;
	}
	do{
		newFirst.parentNode = parentNode;
	}while(newFirst !== newLast && (newFirst= newFirst.nextSibling))
	_onUpdateChild(parentNode.ownerDocument||parentNode,parentNode);
	//console.log(parentNode.lastChild.nextSibling == null)
	if (newChild.nodeType == DOCUMENT_FRAGMENT_NODE) {
		newChild.firstChild = newChild.lastChild = null;
	}
	return newChild;
}
function _appendSingleChild(parentNode,newChild){
	var cp = newChild.parentNode;
	if(cp){
		var pre = parentNode.lastChild;
		cp.removeChild(newChild);//remove and update
		var pre = parentNode.lastChild;
	}
	var pre = parentNode.lastChild;
	newChild.parentNode = parentNode;
	newChild.previousSibling = pre;
	newChild.nextSibling = null;
	if(pre){
		pre.nextSibling = newChild;
	}else {
		parentNode.firstChild = newChild;
	}
	parentNode.lastChild = newChild;
	_onUpdateChild(parentNode.ownerDocument,parentNode,newChild);
	return newChild;
	//console.log("__aa",parentNode.lastChild.nextSibling == null)
}
Document.prototype = {
	//implementation : null,
	nodeName :  '#document',
	nodeType :  DOCUMENT_NODE,
	doctype :  null,
	documentElement :  null,
	_inc : 1,
	
	insertBefore :  function(newChild, refChild){//raises 
		if(newChild.nodeType == DOCUMENT_FRAGMENT_NODE){
			var child = newChild.firstChild;
			while(child){
				var next = child.nextSibling;
				this.insertBefore(child,refChild);
				child = next;
			}
			return newChild;
		}
		if(this.documentElement == null && newChild.nodeType == ELEMENT_NODE){
			this.documentElement = newChild;
		}
		
		return _insertBefore(this,newChild,refChild),(newChild.ownerDocument = this),newChild;
	},
	removeChild :  function(oldChild){
		if(this.documentElement == oldChild){
			this.documentElement = null;
		}
		return _removeChild(this,oldChild);
	},
	// Introduced in DOM Level 2:
	importNode : function(importedNode,deep){
		return importNode(this,importedNode,deep);
	},
	// Introduced in DOM Level 2:
	getElementById :	function(id){
		var rtv = null;
		_visitNode(this.documentElement,function(node){
			if(node.nodeType == ELEMENT_NODE){
				if(node.getAttribute('id') == id){
					rtv = node;
					return true;
				}
			}
		});
		return rtv;
	},
	
	getElementsByClassName: function(className) {
		var pattern = new RegExp("(^|\\s)" + className + "(\\s|$)");
		return new LiveNodeList(this, function(base) {
			var ls = [];
			_visitNode(base.documentElement, function(node) {
				if(node !== base && node.nodeType == ELEMENT_NODE) {
					if(pattern.test(node.getAttribute('class'))) {
						ls.push(node);
					}
				}
			});
			return ls;
		});
	},
	
	//document factory method:
	createElement :	function(tagName){
		var node = new Element();
		node.ownerDocument = this;
		node.nodeName = tagName;
		node.tagName = tagName;
		node.childNodes = new NodeList();
		var attrs	= node.attributes = new NamedNodeMap();
		attrs._ownerElement = node;
		return node;
	},
	createDocumentFragment :	function(){
		var node = new DocumentFragment();
		node.ownerDocument = this;
		node.childNodes = new NodeList();
		return node;
	},
	createTextNode :	function(data){
		var node = new Text();
		node.ownerDocument = this;
		node.appendData(data);
		return node;
	},
	createComment :	function(data){
		var node = new Comment();
		node.ownerDocument = this;
		node.appendData(data);
		return node;
	},
	createCDATASection :	function(data){
		var node = new CDATASection();
		node.ownerDocument = this;
		node.appendData(data);
		return node;
	},
	createProcessingInstruction :	function(target,data){
		var node = new ProcessingInstruction();
		node.ownerDocument = this;
		node.tagName = node.target = target;
		node.nodeValue= node.data = data;
		return node;
	},
	createAttribute :	function(name){
		var node = new Attr();
		node.ownerDocument	= this;
		node.name = name;
		node.nodeName	= name;
		node.localName = name;
		node.specified = true;
		return node;
	},
	createEntityReference :	function(name){
		var node = new EntityReference();
		node.ownerDocument	= this;
		node.nodeName	= name;
		return node;
	},
	// Introduced in DOM Level 2:
	createElementNS :	function(namespaceURI,qualifiedName){
		var node = new Element();
		var pl = qualifiedName.split(':');
		var attrs	= node.attributes = new NamedNodeMap();
		node.childNodes = new NodeList();
		node.ownerDocument = this;
		node.nodeName = qualifiedName;
		node.tagName = qualifiedName;
		node.namespaceURI = namespaceURI;
		if(pl.length == 2){
			node.prefix = pl[0];
			node.localName = pl[1];
		}else {
			//el.prefix = null;
			node.localName = qualifiedName;
		}
		attrs._ownerElement = node;
		return node;
	},
	// Introduced in DOM Level 2:
	createAttributeNS :	function(namespaceURI,qualifiedName){
		var node = new Attr();
		var pl = qualifiedName.split(':');
		node.ownerDocument = this;
		node.nodeName = qualifiedName;
		node.name = qualifiedName;
		node.namespaceURI = namespaceURI;
		node.specified = true;
		if(pl.length == 2){
			node.prefix = pl[0];
			node.localName = pl[1];
		}else {
			//el.prefix = null;
			node.localName = qualifiedName;
		}
		return node;
	}
};
_extends(Document,Node);


function Element() {
	this._nsMap = {};
}Element.prototype = {
	nodeType : ELEMENT_NODE,
	hasAttribute : function(name){
		return this.getAttributeNode(name)!=null;
	},
	getAttribute : function(name){
		var attr = this.getAttributeNode(name);
		return attr && attr.value || '';
	},
	getAttributeNode : function(name){
		return this.attributes.getNamedItem(name);
	},
	setAttribute : function(name, value){
		var attr = this.ownerDocument.createAttribute(name);
		attr.value = attr.nodeValue = "" + value;
		this.setAttributeNode(attr);
	},
	removeAttribute : function(name){
		var attr = this.getAttributeNode(name);
		attr && this.removeAttributeNode(attr);
	},
	
	//four real opeartion method
	appendChild:function(newChild){
		if(newChild.nodeType === DOCUMENT_FRAGMENT_NODE){
			return this.insertBefore(newChild,null);
		}else {
			return _appendSingleChild(this,newChild);
		}
	},
	setAttributeNode : function(newAttr){
		return this.attributes.setNamedItem(newAttr);
	},
	setAttributeNodeNS : function(newAttr){
		return this.attributes.setNamedItemNS(newAttr);
	},
	removeAttributeNode : function(oldAttr){
		//console.log(this == oldAttr.ownerElement)
		return this.attributes.removeNamedItem(oldAttr.nodeName);
	},
	//get real attribute name,and remove it by removeAttributeNode
	removeAttributeNS : function(namespaceURI, localName){
		var old = this.getAttributeNodeNS(namespaceURI, localName);
		old && this.removeAttributeNode(old);
	},
	
	hasAttributeNS : function(namespaceURI, localName){
		return this.getAttributeNodeNS(namespaceURI, localName)!=null;
	},
	getAttributeNS : function(namespaceURI, localName){
		var attr = this.getAttributeNodeNS(namespaceURI, localName);
		return attr && attr.value || '';
	},
	setAttributeNS : function(namespaceURI, qualifiedName, value){
		var attr = this.ownerDocument.createAttributeNS(namespaceURI, qualifiedName);
		attr.value = attr.nodeValue = "" + value;
		this.setAttributeNode(attr);
	},
	getAttributeNodeNS : function(namespaceURI, localName){
		return this.attributes.getNamedItemNS(namespaceURI, localName);
	},
	
	getElementsByTagName : function(tagName){
		return new LiveNodeList(this,function(base){
			var ls = [];
			_visitNode(base,function(node){
				if(node !== base && node.nodeType == ELEMENT_NODE && (tagName === '*' || node.tagName == tagName)){
					ls.push(node);
				}
			});
			return ls;
		});
	},
	getElementsByTagNameNS : function(namespaceURI, localName){
		return new LiveNodeList(this,function(base){
			var ls = [];
			_visitNode(base,function(node){
				if(node !== base && node.nodeType === ELEMENT_NODE && (namespaceURI === '*' || node.namespaceURI === namespaceURI) && (localName === '*' || node.localName == localName)){
					ls.push(node);
				}
			});
			return ls;
			
		});
	}
};
Document.prototype.getElementsByTagName = Element.prototype.getElementsByTagName;
Document.prototype.getElementsByTagNameNS = Element.prototype.getElementsByTagNameNS;


_extends(Element,Node);
function Attr() {
}Attr.prototype.nodeType = ATTRIBUTE_NODE;
_extends(Attr,Node);


function CharacterData() {
}CharacterData.prototype = {
	data : '',
	substringData : function(offset, count) {
		return this.data.substring(offset, offset+count);
	},
	appendData: function(text) {
		text = this.data+text;
		this.nodeValue = this.data = text;
		this.length = text.length;
	},
	insertData: function(offset,text) {
		this.replaceData(offset,0,text);
	
	},
	appendChild:function(newChild){
		throw new Error(ExceptionMessage[HIERARCHY_REQUEST_ERR])
	},
	deleteData: function(offset, count) {
		this.replaceData(offset,count,"");
	},
	replaceData: function(offset, count, text) {
		var start = this.data.substring(0,offset);
		var end = this.data.substring(offset+count);
		text = start + text + end;
		this.nodeValue = this.data = text;
		this.length = text.length;
	}
};
_extends(CharacterData,Node);
function Text() {
}Text.prototype = {
	nodeName : "#text",
	nodeType : TEXT_NODE,
	splitText : function(offset) {
		var text = this.data;
		var newText = text.substring(offset);
		text = text.substring(0, offset);
		this.data = this.nodeValue = text;
		this.length = text.length;
		var newNode = this.ownerDocument.createTextNode(newText);
		if(this.parentNode){
			this.parentNode.insertBefore(newNode, this.nextSibling);
		}
		return newNode;
	}
};
_extends(Text,CharacterData);
function Comment() {
}Comment.prototype = {
	nodeName : "#comment",
	nodeType : COMMENT_NODE
};
_extends(Comment,CharacterData);

function CDATASection() {
}CDATASection.prototype = {
	nodeName : "#cdata-section",
	nodeType : CDATA_SECTION_NODE
};
_extends(CDATASection,CharacterData);


function DocumentType() {
}DocumentType.prototype.nodeType = DOCUMENT_TYPE_NODE;
_extends(DocumentType,Node);

function Notation() {
}Notation.prototype.nodeType = NOTATION_NODE;
_extends(Notation,Node);

function Entity$1() {
}Entity$1.prototype.nodeType = ENTITY_NODE;
_extends(Entity$1,Node);

function EntityReference() {
}EntityReference.prototype.nodeType = ENTITY_REFERENCE_NODE;
_extends(EntityReference,Node);

function DocumentFragment() {
}DocumentFragment.prototype.nodeName =	"#document-fragment";
DocumentFragment.prototype.nodeType =	DOCUMENT_FRAGMENT_NODE;
_extends(DocumentFragment,Node);


function ProcessingInstruction() {
}
ProcessingInstruction.prototype.nodeType = PROCESSING_INSTRUCTION_NODE;
_extends(ProcessingInstruction,Node);
function XMLSerializer(){}
XMLSerializer.prototype.serializeToString = function(node,isHtml,nodeFilter){
	return nodeSerializeToString.call(node,isHtml,nodeFilter);
};
Node.prototype.toString = nodeSerializeToString;
function nodeSerializeToString(isHtml,nodeFilter){
	var buf = [];
	var refNode = this.nodeType == 9 && this.documentElement || this;
	var prefix = refNode.prefix;
	var uri = refNode.namespaceURI;
	
	if(uri && prefix == null){
		//console.log(prefix)
		var prefix = refNode.lookupPrefix(uri);
		if(prefix == null){
			//isHTML = true;
			var visibleNamespaces=[
			{namespace:uri,prefix:null}
			//{namespace:uri,prefix:''}
			];
		}
	}
	serializeToString(this,buf,isHtml,nodeFilter,visibleNamespaces);
	//console.log('###',this.nodeType,uri,prefix,buf.join(''))
	return buf.join('');
}
function needNamespaceDefine(node,isHTML, visibleNamespaces) {
	var prefix = node.prefix||'';
	var uri = node.namespaceURI;
	if (!prefix && !uri){
		return false;
	}
	if (prefix === "xml" && uri === "http://www.w3.org/XML/1998/namespace" 
		|| uri == 'http://www.w3.org/2000/xmlns/'){
		return false;
	}
	
	var i = visibleNamespaces.length; 
	//console.log('@@@@',node.tagName,prefix,uri,visibleNamespaces)
	while (i--) {
		var ns = visibleNamespaces[i];
		// get namespace prefix
		//console.log(node.nodeType,node.tagName,ns.prefix,prefix)
		if (ns.prefix == prefix){
			return ns.namespace != uri;
		}
	}
	//console.log(isHTML,uri,prefix=='')
	//if(isHTML && prefix ==null && uri == 'http://www.w3.org/1999/xhtml'){
	//	return false;
	//}
	//node.flag = '11111'
	//console.error(3,true,node.flag,node.prefix,node.namespaceURI)
	return true;
}
function serializeToString(node,buf,isHTML,nodeFilter,visibleNamespaces){
	if(nodeFilter){
		node = nodeFilter(node);
		if(node){
			if(typeof node == 'string'){
				buf.push(node);
				return;
			}
		}else {
			return;
		}
		//buf.sort.apply(attrs, attributeSorter);
	}
	switch(node.nodeType){
	case ELEMENT_NODE:
		if (!visibleNamespaces) visibleNamespaces = [];
		visibleNamespaces.length;
		var attrs = node.attributes;
		var len = attrs.length;
		var child = node.firstChild;
		var nodeName = node.tagName;
		
		isHTML =  (htmlns === node.namespaceURI) ||isHTML; 
		buf.push('<',nodeName);
		
		
		
		for(var i=0;i<len;i++){
			// add namespaces for attributes
			var attr = attrs.item(i);
			if (attr.prefix == 'xmlns') {
				visibleNamespaces.push({ prefix: attr.localName, namespace: attr.value });
			}else if(attr.nodeName == 'xmlns'){
				visibleNamespaces.push({ prefix: '', namespace: attr.value });
			}
		}
		for(var i=0;i<len;i++){
			var attr = attrs.item(i);
			if (needNamespaceDefine(attr,isHTML, visibleNamespaces)) {
				var prefix = attr.prefix||'';
				var uri = attr.namespaceURI;
				var ns = prefix ? ' xmlns:' + prefix : " xmlns";
				buf.push(ns, '="' , uri , '"');
				visibleNamespaces.push({ prefix: prefix, namespace:uri });
			}
			serializeToString(attr,buf,isHTML,nodeFilter,visibleNamespaces);
		}
		// add namespace for current node		
		if (needNamespaceDefine(node,isHTML, visibleNamespaces)) {
			var prefix = node.prefix||'';
			var uri = node.namespaceURI;
			var ns = prefix ? ' xmlns:' + prefix : " xmlns";
			buf.push(ns, '="' , uri , '"');
			visibleNamespaces.push({ prefix: prefix, namespace:uri });
		}
		
		if(child || isHTML && !/^(?:meta|link|img|br|hr|input)$/i.test(nodeName)){
			buf.push('>');
			//if is cdata child node
			if(isHTML && /^script$/i.test(nodeName)){
				while(child){
					if(child.data){
						buf.push(child.data);
					}else {
						serializeToString(child,buf,isHTML,nodeFilter,visibleNamespaces);
					}
					child = child.nextSibling;
				}
			}else
			{
				while(child){
					serializeToString(child,buf,isHTML,nodeFilter,visibleNamespaces);
					child = child.nextSibling;
				}
			}
			buf.push('</',nodeName,'>');
		}else {
			buf.push('/>');
		}
		// remove added visible namespaces
		//visibleNamespaces.length = startVisibleNamespaces;
		return;
	case DOCUMENT_NODE:
	case DOCUMENT_FRAGMENT_NODE:
		var child = node.firstChild;
		while(child){
			serializeToString(child,buf,isHTML,nodeFilter,visibleNamespaces);
			child = child.nextSibling;
		}
		return;
	case ATTRIBUTE_NODE:
		return buf.push(' ',node.name,'="',node.value.replace(/[<&"]/g,_xmlEncoder),'"');
	case TEXT_NODE:
		return buf.push(node.data.replace(/[<&]/g,_xmlEncoder));
	case CDATA_SECTION_NODE:
		return buf.push( '<![CDATA[',node.data,']]>');
	case COMMENT_NODE:
		return buf.push( "<!--",node.data,"-->");
	case DOCUMENT_TYPE_NODE:
		var pubid = node.publicId;
		var sysid = node.systemId;
		buf.push('<!DOCTYPE ',node.name);
		if(pubid){
			buf.push(' PUBLIC "',pubid);
			if (sysid && sysid!='.') {
				buf.push( '" "',sysid);
			}
			buf.push('">');
		}else if(sysid && sysid!='.'){
			buf.push(' SYSTEM "',sysid,'">');
		}else {
			var sub = node.internalSubset;
			if(sub){
				buf.push(" [",sub,"]");
			}
			buf.push(">");
		}
		return;
	case PROCESSING_INSTRUCTION_NODE:
		return buf.push( "<?",node.target," ",node.data,"?>");
	case ENTITY_REFERENCE_NODE:
		return buf.push( '&',node.nodeName,';');
	//case ENTITY_NODE:
	//case NOTATION_NODE:
	default:
		buf.push('??',node.nodeName);
	}
}
function importNode(doc,node,deep){
	var node2;
	switch (node.nodeType) {
	case ELEMENT_NODE:
		node2 = node.cloneNode(false);
		node2.ownerDocument = doc;
		//var attrs = node2.attributes;
		//var len = attrs.length;
		//for(var i=0;i<len;i++){
			//node2.setAttributeNodeNS(importNode(doc,attrs.item(i),deep));
		//}
	case DOCUMENT_FRAGMENT_NODE:
		break;
	case ATTRIBUTE_NODE:
		deep = true;
		break;
	//case ENTITY_REFERENCE_NODE:
	//case PROCESSING_INSTRUCTION_NODE:
	////case TEXT_NODE:
	//case CDATA_SECTION_NODE:
	//case COMMENT_NODE:
	//	deep = false;
	//	break;
	//case DOCUMENT_NODE:
	//case DOCUMENT_TYPE_NODE:
	//cannot be imported.
	//case ENTITY_NODE:
	//case NOTATION_NODE：
	//can not hit in level3
	//default:throw e;
	}
	if(!node2){
		node2 = node.cloneNode(false);//false
	}
	node2.ownerDocument = doc;
	node2.parentNode = null;
	if(deep){
		var child = node.firstChild;
		while(child){
			node2.appendChild(importNode(doc,child,deep));
			child = child.nextSibling;
		}
	}
	return node2;
}
//
//var _relationMap = {firstChild:1,lastChild:1,previousSibling:1,nextSibling:1,
//					attributes:1,childNodes:1,parentNode:1,documentElement:1,doctype,};
function cloneNode(doc,node,deep){
	var node2 = new node.constructor();
	for(var n in node){
		var v = node[n];
		if(typeof v != 'object' ){
			if(v != node2[n]){
				node2[n] = v;
			}
		}
	}
	if(node.childNodes){
		node2.childNodes = new NodeList();
	}
	node2.ownerDocument = doc;
	switch (node2.nodeType) {
	case ELEMENT_NODE:
		var attrs	= node.attributes;
		var attrs2	= node2.attributes = new NamedNodeMap();
		var len = attrs.length;
		attrs2._ownerElement = node2;
		for(var i=0;i<len;i++){
			node2.setAttributeNode(cloneNode(doc,attrs.item(i),true));
		}
		break;	case ATTRIBUTE_NODE:
		deep = true;
	}
	if(deep){
		var child = node.firstChild;
		while(child){
			node2.appendChild(cloneNode(doc,child,deep));
			child = child.nextSibling;
		}
	}
	return node2;
}

function __set__(object,key,value){
	object[key] = value;
}
//do dynamic
try{
	if(Object.defineProperty){
		Object.defineProperty(LiveNodeList.prototype,'length',{
			get:function(){
				_updateLiveList(this);
				return this.$$length;
			}
		});
		Object.defineProperty(Node.prototype,'textContent',{
			get:function(){
				return getTextContent(this);
			},
			set:function(data){
				switch(this.nodeType){
				case ELEMENT_NODE:
				case DOCUMENT_FRAGMENT_NODE:
					while(this.firstChild){
						this.removeChild(this.firstChild);
					}
					if(data || String(data)){
						this.appendChild(this.ownerDocument.createTextNode(data));
					}
					break;
				default:
					//TODO:
					this.data = data;
					this.value = data;
					this.nodeValue = data;
				}
			}
		});
		
		function getTextContent(node){
			switch(node.nodeType){
			case ELEMENT_NODE:
			case DOCUMENT_FRAGMENT_NODE:
				var buf = [];
				node = node.firstChild;
				while(node){
					if(node.nodeType!==7 && node.nodeType !==8){
						buf.push(getTextContent(node));
					}
					node = node.nextSibling;
				}
				return buf.join('');
			default:
				return node.nodeValue;
			}
		}
		__set__ = function(object,key,value){
			//console.log(value)
			object['$$'+key] = value;
		};
	}
}catch(e){//ie8
}

//if(typeof require == 'function'){
	dom.Node = Node;
	dom.DOMImplementation = DOMImplementation$1;
	dom.XMLSerializer = XMLSerializer;

function DOMParser(options){
	this.options = options ||{locator:{}};
}

DOMParser.prototype.parseFromString = function(source,mimeType){
	var options = this.options;
	var sax =  new XMLReader();
	var domBuilder = options.domBuilder || new DOMHandler();//contentHandler and LexicalHandler
	var errorHandler = options.errorHandler;
	var locator = options.locator;
	var defaultNSMap = options.xmlns||{};
	var isHTML = /\/x?html?$/.test(mimeType);//mimeType.toLowerCase().indexOf('html') > -1;
  	var entityMap = isHTML?htmlEntity.entityMap:{'lt':'<','gt':'>','amp':'&','quot':'"','apos':"'"};
	if(locator){
		domBuilder.setDocumentLocator(locator);
	}

	sax.errorHandler = buildErrorHandler(errorHandler,domBuilder,locator);
	sax.domBuilder = options.domBuilder || domBuilder;
	if(isHTML){
		defaultNSMap['']= 'http://www.w3.org/1999/xhtml';
	}
	defaultNSMap.xml = defaultNSMap.xml || 'http://www.w3.org/XML/1998/namespace';
	if(source && typeof source === 'string'){
		sax.parse(source,defaultNSMap,entityMap);
	}else {
		sax.errorHandler.error("invalid doc source");
	}
	return domBuilder.doc;
};
function buildErrorHandler(errorImpl,domBuilder,locator){
	if(!errorImpl){
		if(domBuilder instanceof DOMHandler){
			return domBuilder;
		}
		errorImpl = domBuilder ;
	}
	var errorHandler = {};
	var isCallback = errorImpl instanceof Function;
	locator = locator||{};
	function build(key){
		var fn = errorImpl[key];
		if(!fn && isCallback){
			fn = errorImpl.length == 2?function(msg){errorImpl(key,msg);}:errorImpl;
		}
		errorHandler[key] = fn && function(msg){
			fn('[xmldom '+key+']\t'+msg+_locator(locator));
		}||function(){};
	}
	build('warning');
	build('error');
	build('fatalError');
	return errorHandler;
}

//console.log('#\n\n\n\n\n\n\n####')
/**
 * +ContentHandler+ErrorHandler
 * +LexicalHandler+EntityResolver2
 * -DeclHandler-DTDHandler
 *
 * DefaultHandler:EntityResolver, DTDHandler, ContentHandler, ErrorHandler
 * DefaultHandler2:DefaultHandler,LexicalHandler, DeclHandler, EntityResolver2
 * @link http://www.saxproject.org/apidoc/org/xml/sax/helpers/DefaultHandler.html
 */
function DOMHandler() {
    this.cdata = false;
}
function position(locator,node){
	node.lineNumber = locator.lineNumber;
	node.columnNumber = locator.columnNumber;
}
/**
 * @see org.xml.sax.ContentHandler#startDocument
 * @link http://www.saxproject.org/apidoc/org/xml/sax/ContentHandler.html
 */
DOMHandler.prototype = {
	startDocument : function() {
    	this.doc = new DOMImplementation().createDocument(null, null, null);
    	if (this.locator) {
        	this.doc.documentURI = this.locator.systemId;
    	}
	},
	startElement:function(namespaceURI, localName, qName, attrs) {
		var doc = this.doc;
	    var el = doc.createElementNS(namespaceURI, qName||localName);
	    var len = attrs.length;
	    appendElement(this, el);
	    this.currentElement = el;

		this.locator && position(this.locator,el);
	    for (var i = 0 ; i < len; i++) {
	        var namespaceURI = attrs.getURI(i);
	        var value = attrs.getValue(i);
	        var qName = attrs.getQName(i);
			var attr = doc.createAttributeNS(namespaceURI, qName);
			this.locator &&position(attrs.getLocator(i),attr);
			attr.value = attr.nodeValue = value;
			el.setAttributeNode(attr);
	    }
	},
	endElement:function(namespaceURI, localName, qName) {
		var current = this.currentElement;
		current.tagName;
		this.currentElement = current.parentNode;
	},
	startPrefixMapping:function(prefix, uri) {
	},
	endPrefixMapping:function(prefix) {
	},
	processingInstruction:function(target, data) {
	    var ins = this.doc.createProcessingInstruction(target, data);
	    this.locator && position(this.locator,ins);
	    appendElement(this, ins);
	},
	ignorableWhitespace:function(ch, start, length) {
	},
	characters:function(chars, start, length) {
		chars = _toString.apply(this,arguments);
		//console.log(chars)
		if(chars){
			if (this.cdata) {
				var charNode = this.doc.createCDATASection(chars);
			} else {
				var charNode = this.doc.createTextNode(chars);
			}
			if(this.currentElement){
				this.currentElement.appendChild(charNode);
			}else if(/^\s*$/.test(chars)){
				this.doc.appendChild(charNode);
				//process xml
			}
			this.locator && position(this.locator,charNode);
		}
	},
	skippedEntity:function(name) {
	},
	endDocument:function() {
		this.doc.normalize();
	},
	setDocumentLocator:function (locator) {
	    if(this.locator = locator){// && !('lineNumber' in locator)){
	    	locator.lineNumber = 0;
	    }
	},
	//LexicalHandler
	comment:function(chars, start, length) {
		chars = _toString.apply(this,arguments);
	    var comm = this.doc.createComment(chars);
	    this.locator && position(this.locator,comm);
	    appendElement(this, comm);
	},

	startCDATA:function() {
	    //used in characters() methods
	    this.cdata = true;
	},
	endCDATA:function() {
	    this.cdata = false;
	},

	startDTD:function(name, publicId, systemId) {
		var impl = this.doc.implementation;
	    if (impl && impl.createDocumentType) {
	        var dt = impl.createDocumentType(name, publicId, systemId);
	        this.locator && position(this.locator,dt);
	        appendElement(this, dt);
	    }
	},
	/**
	 * @see org.xml.sax.ErrorHandler
	 * @link http://www.saxproject.org/apidoc/org/xml/sax/ErrorHandler.html
	 */
	warning:function(error) {
		console.warn('[xmldom warning]\t'+error,_locator(this.locator));
	},
	error:function(error) {
		console.error('[xmldom error]\t'+error,_locator(this.locator));
	},
	fatalError:function(error) {
		console.error('[xmldom fatalError]\t'+error,_locator(this.locator));
	    throw error;
	}
};
function _locator(l){
	if(l){
		return '\n@'+(l.systemId ||'')+'#[line:'+l.lineNumber+',col:'+l.columnNumber+']'
	}
}
function _toString(chars,start,length){
	if(typeof chars == 'string'){
		return chars.substr(start,length)
	}else {//java sax connect width xmldom on rhino(what about: "? && !(chars instanceof String)")
		if(chars.length >= start+length || start){
			return new java.lang.String(chars,start,length)+'';
		}
		return chars;
	}
}

/*
 * @link http://www.saxproject.org/apidoc/org/xml/sax/ext/LexicalHandler.html
 * used method of org.xml.sax.ext.LexicalHandler:
 *  #comment(chars, start, length)
 *  #startCDATA()
 *  #endCDATA()
 *  #startDTD(name, publicId, systemId)
 *
 *
 * IGNORED method of org.xml.sax.ext.LexicalHandler:
 *  #endDTD()
 *  #startEntity(name)
 *  #endEntity(name)
 *
 *
 * @link http://www.saxproject.org/apidoc/org/xml/sax/ext/DeclHandler.html
 * IGNORED method of org.xml.sax.ext.DeclHandler
 * 	#attributeDecl(eName, aName, type, mode, value)
 *  #elementDecl(name, model)
 *  #externalEntityDecl(name, publicId, systemId)
 *  #internalEntityDecl(name, value)
 * @link http://www.saxproject.org/apidoc/org/xml/sax/ext/EntityResolver2.html
 * IGNORED method of org.xml.sax.EntityResolver2
 *  #resolveEntity(String name,String publicId,String baseURI,String systemId)
 *  #resolveEntity(publicId, systemId)
 *  #getExternalSubset(name, baseURI)
 * @link http://www.saxproject.org/apidoc/org/xml/sax/DTDHandler.html
 * IGNORED method of org.xml.sax.DTDHandler
 *  #notationDecl(name, publicId, systemId) {};
 *  #unparsedEntityDecl(name, publicId, systemId, notationName) {};
 */
"endDTD,startEntity,endEntity,attributeDecl,elementDecl,externalEntityDecl,internalEntityDecl,resolveEntity,getExternalSubset,notationDecl,unparsedEntityDecl".replace(/\w+/g,function(key){
	DOMHandler.prototype[key] = function(){return null};
});

/* Private static helpers treated below as private instance methods, so don't need to add these to the public API; we might use a Relator to also get rid of non-standard public properties */
function appendElement (hander,node) {
    if (!hander.currentElement) {
        hander.doc.appendChild(node);
    } else {
        hander.currentElement.appendChild(node);
    }
}//appendChild and setAttributeNS are preformance key

//if(typeof require == 'function'){
var htmlEntity = entities;
var XMLReader = sax.XMLReader;
var DOMImplementation = domParser.DOMImplementation = dom.DOMImplementation;
domParser.XMLSerializer = dom.XMLSerializer ;
domParser.DOMParser = DOMParser;

var __importDefault = (commonjsGlobal && commonjsGlobal.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(xmldomToMathmlElementAdapter, "__esModule", { value: true });
xmldomToMathmlElementAdapter.XmlToMathMLAdapter = void 0;
var xmldom_1 = __importDefault(domParser);
var XmlToMathMLAdapter = /** @class */ (function () {
    function XmlToMathMLAdapter(elementsConvertor, errorHandler) {
        this._xml = '';
        this._elementsConvertor = elementsConvertor;
        this._errorHandler = errorHandler;
        this._xmlDOM = new xmldom_1.default.DOMParser({
            locator: this._errorHandler.errorLocator,
            errorHandler: this._fixError.bind(this),
        });
    }
    XmlToMathMLAdapter.prototype.convert = function (xml) {
        this._xml = this._removeLineBreaks(xml);
        return this._elementsConvertor.convert(this._mathMLElements);
    };
    XmlToMathMLAdapter.prototype._fixError = function (errorMessage) {
        this._xml = this._errorHandler.fixError(this._xml, errorMessage);
    };
    XmlToMathMLAdapter.prototype._removeLineBreaks = function (xml) {
        var LINE_BREAK = /\n|\r\n|\r/g;
        return xml.replace(LINE_BREAK, '');
    };
    Object.defineProperty(XmlToMathMLAdapter.prototype, "_mathMLElements", {
        get: function () {
            var elements = this._xmlDOM.parseFromString(this._xml).getElementsByTagName('math');
            if (this._errorHandler.isThereAnyErrors()) {
                this._errorHandler.cleanErrors();
                elements = this._xmlDOM.parseFromString(this._xml).getElementsByTagName('math');
            }
            return Array.from(elements);
        },
        enumerable: false,
        configurable: true
    });
    return XmlToMathMLAdapter;
}());
xmldomToMathmlElementAdapter.XmlToMathMLAdapter = XmlToMathMLAdapter;

var errorHandler = {};

Object.defineProperty(errorHandler, "__esModule", { value: true });
errorHandler.ErrorHandler = void 0;
var ErrorHandler = /** @class */ (function () {
    function ErrorHandler() {
        this._errors = [];
        this.errorLocator = {};
    }
    ErrorHandler.prototype.fixError = function (xml, errorMessage) {
        if (!this._isMissingAttributeValueError(errorMessage))
            return xml;
        this._errors.push(errorMessage);
        return this._fixMissingAttribute(errorMessage, xml);
    };
    ErrorHandler.prototype.isThereAnyErrors = function () {
        return this._errors.length > 0;
    };
    ErrorHandler.prototype.cleanErrors = function () {
        this._errors = [];
    };
    ErrorHandler.prototype._fixMissingAttribute = function (errorMessage, xml) {
        var missingAttribute = errorMessage.split('"')[1];
        if (missingAttribute)
            return xml.replace(this._matchMissingValueForAttribute(missingAttribute), '');
        while (this._mathGenericMissingValue().exec(xml)) {
            xml = xml.replace(this._mathGenericMissingValue(), '$1$3');
        }
        return xml;
    };
    ErrorHandler.prototype._matchMissingValueForAttribute = function (attribute) {
        return new RegExp("(" + attribute + "=(?!(\"|')))|(" + attribute + "(?!(\"|')))", 'gm');
    };
    ErrorHandler.prototype._mathGenericMissingValue = function () {
        return /(\<.* )(\w+=(?!\"|\'))(.*\>)/gm;
    };
    ErrorHandler.prototype._isMissingAttributeValueError = function (errorMessage) {
        return ((!!errorMessage.includes('attribute') && !!errorMessage.includes('missed')) ||
            errorMessage.includes('attribute value missed'));
    };
    return ErrorHandler;
}());
errorHandler.ErrorHandler = ErrorHandler;

var xmldomElementsToMathmlElementsAdapter = {};

Object.defineProperty(xmldomElementsToMathmlElementsAdapter, "__esModule", { value: true });
xmldomElementsToMathmlElementsAdapter.ElementsToMathMLAdapter = void 0;
var ElementsToMathMLAdapter = /** @class */ (function () {
    function ElementsToMathMLAdapter() {
    }
    ElementsToMathMLAdapter.prototype.convert = function (els) {
        var _this = this;
        return els.filter(function (el) { return el.tagName !== undefined; }).map(function (el) { return _this._convertElement(el); });
    };
    ElementsToMathMLAdapter.prototype._convertElement = function (el) {
        return {
            name: el.tagName,
            attributes: this._convertElementAttributes(el.attributes),
            value: this._hasElementChild(el) ? '' : el.textContent || '',
            children: this._hasElementChild(el)
                ? this.convert(Array.from(el.childNodes))
                : [],
        };
    };
    ElementsToMathMLAdapter.prototype._convertElementAttributes = function (attributes) {
        return Array.from(attributes).reduce(function (acc, attr) {
            var _a;
            return Object.assign((_a = {}, _a[attr.nodeName] = attr.nodeValue === attr.nodeName ? '' : attr.nodeValue, _a), acc);
        }, {});
    };
    ElementsToMathMLAdapter.prototype._hasElementChild = function (el) {
        var childNodes = el.childNodes;
        return !!childNodes && childNodes.length !== 0 && this._isThereAnyNoTextNode(childNodes);
    };
    ElementsToMathMLAdapter.prototype._isThereAnyNoTextNode = function (children) {
        return Array.from(children).some(function (child) { return child.nodeName !== '#text'; });
    };
    return ElementsToMathMLAdapter;
}());
xmldomElementsToMathmlElementsAdapter.ElementsToMathMLAdapter = ElementsToMathMLAdapter;

(function (exports) {
	var __createBinding = (commonjsGlobal && commonjsGlobal.__createBinding) || (Object.create ? (function(o, m, k, k2) {
	    if (k2 === undefined) k2 = k;
	    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
	}) : (function(o, m, k, k2) {
	    if (k2 === undefined) k2 = k;
	    o[k2] = m[k];
	}));
	var __exportStar = (commonjsGlobal && commonjsGlobal.__exportStar) || function(m, exports) {
	    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
	};
	Object.defineProperty(exports, "__esModule", { value: true });
	__exportStar(xmldomToMathmlElementAdapter, exports);
	__exportStar(errorHandler, exports);
	__exportStar(xmldomElementsToMathmlElementsAdapter, exports); 
} (xmldomToMathmlElements));

Object.defineProperty(makeToMathElementsConverter$1, "__esModule", { value: true });
makeToMathElementsConverter$1.makeToMathElementsConverter = void 0;
var xmldom_to_mathml_elements_1 = xmldomToMathmlElements;
var makeToMathElementsConverter = function () {
    var elementsToMathMLAdapter = new xmldom_to_mathml_elements_1.ElementsToMathMLAdapter();
    var errorHandler = new xmldom_to_mathml_elements_1.ErrorHandler();
    return new xmldom_to_mathml_elements_1.XmlToMathMLAdapter(elementsToMathMLAdapter, errorHandler);
};
makeToMathElementsConverter$1.makeToMathElementsConverter = makeToMathElementsConverter;

(function (exports) {
	var __createBinding = (commonjsGlobal && commonjsGlobal.__createBinding) || (Object.create ? (function(o, m, k, k2) {
	    if (k2 === undefined) k2 = k;
	    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
	}) : (function(o, m, k, k2) {
	    if (k2 === undefined) k2 = k;
	    o[k2] = m[k];
	}));
	var __exportStar = (commonjsGlobal && commonjsGlobal.__exportStar) || function(m, exports) {
	    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
	};
	Object.defineProperty(exports, "__esModule", { value: true });
	__exportStar(makeToMathElementsConverter$1, exports); 
} (factories));

Object.defineProperty(mathmlToLatex, "__esModule", { value: true });
mathmlToLatex.MathMLToLaTeX = void 0;
var mathml_element_to_latex_converter_adapter_1 = requireMathmlElementToLatexConverterAdapter();
var factories_1 = factories;
var MathMLToLaTeX = /** @class */ (function () {
    function MathMLToLaTeX() {
    }
    MathMLToLaTeX.convert = function (mathml) {
        var mathmlElements = factories_1.makeToMathElementsConverter().convert(mathml);
        var mathmlElementsToLaTeXConverters = mathmlElements.map(function (mathMLElement) {
            return new mathml_element_to_latex_converter_adapter_1.MathMLElementToLatexConverterAdapter(mathMLElement).toLatexConverter();
        });
        return mathmlElementsToLaTeXConverters.map(function (toLatexConverters) { return toLatexConverters.convert(); }).join('');
    };
    return MathMLToLaTeX;
}());
mathmlToLatex.MathMLToLaTeX = MathMLToLaTeX;

(function (exports) {
	var __createBinding = (commonjsGlobal && commonjsGlobal.__createBinding) || (Object.create ? (function(o, m, k, k2) {
	    if (k2 === undefined) k2 = k;
	    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
	}) : (function(o, m, k, k2) {
	    if (k2 === undefined) k2 = k;
	    o[k2] = m[k];
	}));
	var __exportStar = (commonjsGlobal && commonjsGlobal.__exportStar) || function(m, exports) {
	    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
	};
	Object.defineProperty(exports, "__esModule", { value: true });
	__exportStar(mathmlToLatex, exports); 
} (main));

(function (module, exports) {
	Object.defineProperty(exports, "__esModule", { value: true });
	var main_1 = main;
	exports.default = main_1.MathMLToLaTeX;
	module.exports = main_1.MathMLToLaTeX; 
} (dist, dist.exports));

var distExports = dist.exports;
const Mathml2latex = /*@__PURE__*/getDefaultExportFromCjs(distExports);

class PaperEntity {
  static schema = {
    name: "PaperEntity",
    primaryKey: "_id",
    properties: {
      id: "objectId",
      _id: "objectId",
      _partition: "string?",
      addTime: "date",
      title: "string",
      authors: "string",
      publication: "string",
      pubTime: "string",
      pubType: "int",
      doi: "string",
      arxiv: "string",
      mainURL: "string",
      supURLs: {
        type: "list",
        objectType: "string"
      },
      rating: "int",
      tags: {
        type: "list",
        objectType: "PaperTag"
      },
      folders: {
        type: "list",
        objectType: "PaperFolder"
      },
      flag: "bool",
      note: "string",
      codes: {
        type: "list",
        objectType: "string"
      },
      pages: "string",
      volume: "string",
      number: "string",
      publisher: "string"
    }
  };
  _id;
  id;
  _partition;
  addTime;
  title;
  authors;
  publication;
  pubTime;
  pubType;
  doi;
  arxiv;
  mainURL;
  supURLs;
  rating;
  tags;
  folders;
  flag;
  note;
  codes;
  pages;
  volume;
  number;
  publisher;
  constructor(object, initObjectId = false) {
    this._id = object?._id ? new ObjectId(object._id) : "";
    this.id = object?._id ? new ObjectId(object._id) : "";
    this.id = this.id ? this.id : this._id;
    this._id = this._id ? this._id : this.id;
    this._partition = object?._partition || "";
    this.addTime = object?.addTime || /* @__PURE__ */ new Date();
    this.title = object?.title || "";
    this.authors = object?.authors || "";
    this.publication = object?.publication || "";
    this.pubTime = object?.pubTime || "";
    this.pubType = object?.pubType || 0;
    this.doi = object?.doi || "";
    this.arxiv = object?.arxiv || "";
    this.mainURL = object?.mainURL || "";
    this.supURLs = object?.supURLs?.map((url) => url) || [];
    this.rating = object?.rating || 0;
    this.tags = object?.tags?.map((tag) => new PaperTag(tag, false)) || [];
    this.folders = object?.folders?.map((folder) => new PaperFolder(folder, false)) || [];
    this.flag = object?.flag || false;
    this.note = object?.note || "";
    this.codes = object?.codes?.map((code) => code) || [];
    this.pages = object?.pages || "";
    this.volume = object?.volume || "";
    this.number = object?.number || "";
    this.publisher = object?.publisher || "";
    if (initObjectId) {
      this._id = new ObjectId();
      this.id = this._id;
    }
    return new Proxy(this, {
      set: (target, prop, value) => {
        if (prop === "title") {
          target.setValue("title", value, true);
        } else if ((prop === "_id" || prop === "id") && value) {
          this._id = new ObjectId(value);
          this.id = this._id;
        } else {
          target[prop] = value;
        }
        return true;
      }
    });
  }
  setValue(key, value, format = false) {
    if (format && value) {
      const mathmlRegex1 = /<math\b[^>]*>([\s\S]*?)<\/math>/gm;
      const mathmlRegex2 = /<mml:math\b[^>]*>([\s\S]*?)<\/mml:math>/gm;
      const mathmlRegex3 = /<mrow\b[^>]*>([\s\S]*?)<\/mrow>/gm;
      for (const regex of [mathmlRegex1, mathmlRegex2, mathmlRegex3]) {
        if (regex.test(value)) {
          const mathmls = value.match(regex);
          if (mathmls) {
            for (const mathml of mathmls) {
              const latex = Mathml2latex.convert(mathml.replaceAll("mml:", ""));
              value = value.replace(mathml, "$" + latex + "$");
            }
          }
        }
      }
    }
    this[key] = value;
  }
  initialize(object) {
    this._id = object._id ? new ObjectId(object._id) : "";
    this.id = object._id ? new ObjectId(object._id) : "";
    this.id = this.id ? this.id : this._id;
    this._id = this._id ? this._id : this.id;
    this._partition = object._partition || "";
    this.addTime = object.addTime || /* @__PURE__ */ new Date();
    this.title = object.title || "";
    this.authors = object.authors || "";
    this.publication = object.publication || "";
    this.pubTime = object.pubTime || "";
    this.pubType = object.pubType || 0;
    this.doi = object.doi || "";
    this.arxiv = object.arxiv || "";
    this.mainURL = object.mainURL || "";
    this.supURLs = object.supURLs || [];
    this.rating = object.rating || 0;
    this.tags = object.tags?.map((tag) => new PaperTag(tag, false)) || [];
    this.folders = object.folders?.map((folder) => new PaperFolder(folder, false)) || [];
    this.flag = object.flag || false;
    this.note = object.note || "";
    this.codes = object.codes || [];
    this.pages = object.pages || "";
    this.volume = object.volume || "";
    this.number = object.number || "";
    this.publisher = object.publisher || "";
    return this;
  }
  fromFeed(feedEntity) {
    this.title = feedEntity.title;
    this.authors = feedEntity.authors;
    this.publication = feedEntity.publication;
    this.pubTime = feedEntity.pubTime;
    this.pubType = feedEntity.pubType;
    this.doi = feedEntity.doi;
    this.arxiv = feedEntity.arxiv;
    this.mainURL = feedEntity.mainURL;
    this.pages = feedEntity.pages;
    this.volume = feedEntity.volume;
    this.number = feedEntity.number;
    this.publisher = feedEntity.publisher;
    return this;
  }
}

class Supplementary {
  static schema = {
    name: "Supplementary",
    embedded: true,
    properties: {
      _id: "string",
      url: "string",
      name: "string"
    }
  };
  _id;
  url;
  name;
  constructor(object) {
    this.initialize(object || {});
    return new Proxy(this, {
      set: (target, prop, value) => {
        if (prop === "_id" && value) {
          this._id = uid();
        } else {
          target[prop] = value;
        }
        return true;
      }
    });
  }
  initialize(object) {
    this._id = object._id || new ObjectId().toString();
    this.url = object.url || "";
    this.name = object.name || getFileType(this.url).toUpperCase();
    return this;
  }
}

class Entity {
  static schema = {
    name: "Entity",
    primaryKey: "_id",
    properties: {
      _id: "objectId",
      _partition: "string?",
      // deprecated, for old realm cloud only, will be removed in the future
      addTime: "date",
      library: "string",
      type: "string",
      abstract: "string?",
      defaultSup: "string?",
      supplementaries: "Supplementary{}",
      doi: "string?",
      arxiv: "string?",
      issn: "string?",
      isbn: "string?",
      title: "string",
      authors: "string",
      journal: "string?",
      booktitle: "string?",
      year: "string",
      month: "string?",
      volume: "string?",
      number: "string?",
      pages: "string?",
      publisher: "string?",
      series: "string?",
      edition: "string?",
      editor: "string?",
      howpublished: "string?",
      organization: "string?",
      school: "string?",
      institution: "string?",
      address: "string?",
      rating: "int?",
      tags: {
        type: "list",
        objectType: "PaperTag"
      },
      folders: {
        type: "list",
        objectType: "PaperFolder"
      },
      flag: "bool?",
      note: "string?",
      read: "bool?",
      feed: "Feed?"
    }
  };
  _id;
  _partition;
  // deprecated, for old realm cloud only, will be removed in the future
  addTime;
  library;
  type;
  abstract;
  defaultSup;
  supplementaries;
  doi;
  arxiv;
  issn;
  isbn;
  title;
  authors;
  journal;
  booktitle;
  year;
  month;
  volume;
  number;
  pages;
  publisher;
  series;
  edition;
  editor;
  howpublished;
  organization;
  school;
  institution;
  address;
  rating;
  tags;
  folders;
  flag;
  note;
  read;
  feed;
  constructor(object, initObjectId = false) {
    this.initialize(object || {}, initObjectId);
    return new Proxy(this, {
      set: (target, prop, value) => {
        if (prop === "title") {
          target.setValue("title", value, true);
        } else if (prop === "_id" && value) {
          this._id = new ObjectId(value);
        } else {
          target[prop] = value;
        }
        return true;
      }
    });
  }
  setValue(key, value, format = false) {
    if (format && value) {
      const mathmlRegex1 = /<math\b[^>]*>([\s\S]*?)<\/math>/gm;
      const mathmlRegex2 = /<mml:math\b[^>]*>([\s\S]*?)<\/mml:math>/gm;
      const mathmlRegex3 = /<mrow\b[^>]*>([\s\S]*?)<\/mrow>/gm;
      for (const regex of [mathmlRegex1, mathmlRegex2, mathmlRegex3]) {
        if (regex.test(value)) {
          const mathmls = value.match(regex);
          if (mathmls) {
            for (const mathml of mathmls) {
              const latex = Mathml2latex.convert(mathml.replaceAll("mml:", ""));
              value = value.replace(mathml, "$" + latex + "$");
            }
          }
        }
      }
    }
    this[key] = value;
  }
  initialize(object, initObjectId = true) {
    this._id = object?._id ? new ObjectId(object._id) : "";
    this._partition = object?._partition;
    this.addTime = object?.addTime || /* @__PURE__ */ new Date();
    this.library = object?.library || "main";
    this.type = object?.type || "article";
    this.abstract = object?.abstract;
    this.defaultSup = object?.defaultSup ? object.defaultSup : void 0;
    this.supplementaries = object?.supplementaries ? Object.entries(object.supplementaries).reduce(
      (acc, [key, value]) => {
        acc[key] = new Supplementary(value);
        return acc;
      },
      {}
    ) : {};
    this.doi = object?.doi;
    this.arxiv = object?.arxiv;
    this.issn = object?.issn;
    this.isbn = object?.isbn;
    this.title = object?.title || "";
    this.authors = object?.authors || "";
    this.journal = object?.journal;
    this.booktitle = object?.booktitle;
    this.year = object?.year || "";
    this.month = object?.month;
    this.volume = object?.volume;
    this.number = object?.number;
    this.pages = object?.pages;
    this.publisher = object?.publisher;
    this.series = object?.series;
    this.edition = object?.edition;
    this.editor = object?.editor;
    this.howpublished = object?.howpublished;
    this.organization = object?.organization;
    this.school = object?.school;
    this.institution = object?.institution;
    this.address = object?.address;
    this.rating = object?.rating;
    this.tags = object?.tags?.map((tag) => new PaperTag(tag, false)) || [];
    this.folders = object?.folders?.map((folder) => new PaperFolder(folder, false)) || [];
    this.flag = object?.flag;
    this.note = object?.note;
    this.read = object?.read;
    this.feed = object?.feed ? new Feed(object.feed, false) : void 0;
    if (initObjectId) {
      this._id = new ObjectId();
    }
    return this;
  }
}

class PaperSmartFilter {
  static schema = {
    name: "PaperSmartFilter",
    primaryKey: "_id",
    properties: {
      _id: "objectId",
      _partition: "string?",
      name: "string",
      filter: "string",
      color: "string?",
      children: "PaperSmartFilter[]"
    }
  };
  _id = "";
  _partition = "";
  name = "";
  filter = "";
  color;
  children = [];
  constructor(object, initObjectId = false) {
    this._id = object?._id ? new ObjectId(object._id) : "";
    this._partition = object?._partition || "";
    this.name = object?.name || "";
    this.filter = object?.filter || "";
    this.color = object?.color || "blue";
    this.children = object?.children?.map((child) => new PaperSmartFilter(child)) || [];
    if (initObjectId) {
      this._id = new ObjectId();
    }
    return new Proxy(this, {
      set: (target, prop, value) => {
        if (prop === "_id" && value) {
          this._id = new ObjectId(value);
        } else {
          target[prop] = value;
        }
        return true;
      }
    });
  }
  initialize(object) {
    this._id = object._id ? new ObjectId(object._id) : "";
    this._partition = object._partition || "";
    this.name = object.name || "";
    this.filter = object.filter || "";
    this.color = object.color || "blue";
    this.children = object.children?.map(
      (child) => new PaperSmartFilter().initialize(child)
    ) || [];
    return this;
  }
}

export { Entity, Feed, FeedEntity, PaperEntity, PaperFolder, PaperSmartFilter, PaperTag };
