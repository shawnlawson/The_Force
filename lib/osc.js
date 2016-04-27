(function (window, undefined) {

  'use strict';

  var FLAGS = {
    SOCKET: {
      IS_NOT_INITALIZED: -1,
      IS_CONNECTING: 0,
      IS_OPEN: 1,
      IS_CLOSING: 2,
      IS_CLOSED: 3
    }
  };

  var _options = {
    discardLateMessages: false
  };

  var BUNDLE_TAG = '#bundle';

  var DEFAULT_ADDRESS = '127.0.0.1';
  var DEFAULT_PORT = 8000;

  // helpers

  function _isArray(pItem) {
    return Object.prototype.toString.call(pItem) === '[object Array]';
  }

  function _isInteger(pItem) {
    return typeof pItem === 'number' && pItem % 1 === 0;
  }

  function _now() {
    var date = new Date();
    return date.getTime();
  }

  function _prepareAddress(pAddress) {
    var address = '';
    if (typeof pAddress === 'object') {
      address = '/' + pAddress.join('/');
    } else {
      address = pAddress;
      if (address.length > 1 && address[address.length - 1] === '/') {
        address = address.slice(0, address.length - 1);
      }
      if (address.length > 1 && address[0] !== '/') {
        address = '/' + address;
      }
    }
    return address;
  }

  function _prepareRegExPattern(rPattern) {
    var pattern;

    pattern = rPattern.replace(/\./g, '\\.');
    pattern = pattern.replace(/\(/g, '\\(');
    pattern = pattern.replace(/\)/g, '\\)');

    pattern = pattern.replace(/\{/g, '(');
    pattern = pattern.replace(/\}/g, ')');
    pattern = pattern.replace(/\,/g, '|');

    pattern = pattern.replace(/\[\!/g, '[^');

    pattern = pattern.replace(/\?/g, '.');
    pattern = pattern.replace(/\*/g, '.*');

    return pattern;
  }

  /* EncodeHelper
   * util to encode and merge binary data to Int8Array
   */

  var EncodeHelper = function() {
    this.data = [];
    this.length = 0;
  };

  EncodeHelper.prototype.add = function(aItem) {
    var buf = aItem.encode();
    this.length = this.length + buf.length;
    this.data.push(buf);
    return true;
  };

  EncodeHelper.prototype.merge = function() {
    var merged = new Int8Array(this.length);
    var offset = 0;
    this.data.forEach(function(eItem) {
      merged.set(eItem, offset);
      offset = offset + eItem.length;
    });
    return merged;
  };

  /*
   * OSCEventHandler
   * event callback handling
   */

  var OSCEventHandler = function() {

    // callback subscriptions

    this._callbackHandlers = {
      open: [],
      error: [],
      close: []
    };

    this._addressHandlers = {};

    this._uuid = -1;

    return true;

  };

  // subscribe to event

  OSCEventHandler.prototype.on = function(sEventName, sCallback) {
    var token, address, data, regex;

    if (!((typeof sEventName === 'string' || _isArray(sEventName)) &&
        typeof sCallback === 'function')) {
      throw 'OSCEventHandler Error: on expects string/array as eventName and function as callback';
    }

    token = (++this._uuid).toString();
    data = { token: token, callback: sCallback };

    // event listener

    if (typeof sEventName === 'string' && sEventName in this._callbackHandlers) {
      this._callbackHandlers[sEventName].push(data);
      return token;
    }

    // address listener

    address = _prepareAddress(sEventName);

    regex = new RegExp(/[#*\s\[\],\/{}|\?]/g);

    if (regex.test(address.split('/').join(''))) {
      throw 'OSCEventHandler Error: address string contains invalid characters';
    }

    if (! (address in this._addressHandlers)) {
      this._addressHandlers[address] = [];
    }

    this._addressHandlers[address].push(data);

    return token;
  };

  // unsubscribe to event

  OSCEventHandler.prototype.off = function(sEventName, sToken) {
    var key, success, haystack;

    if (!((typeof sEventName === 'string' || _isArray(sEventName)) && sToken)) {
      throw 'OSCEventHandler Error: off expects string/array as eventName and a proper token';
    }

    success = false;

    if (typeof sEventName === 'string' && this._callbackHandlers[sEventName]) {
      haystack = this._callbackHandlers;
      key = sEventName;
    } else {
      key = _prepareAddress(sEventName);
      haystack = this._addressHandlers;
    }

    if (key in haystack) {
      haystack[key].forEach(function(hItem, hIndex) {
        if (hItem.token === sToken) {
          haystack[key].splice(hIndex, 1);
          success = true;
        }
      });
    }

    return success;
  };

  // notify subscribers

  OSCEventHandler.prototype.notify = function(sEventName, sEventData) {
    var _this, addresses, regex, test;

    if (typeof sEventName !== 'string') {
      throw 'OSCEventHandler Error: notify expects a string';
    }

    // notify event subscribers

    if (this._callbackHandlers[sEventName]) {
      this._callbackHandlers[sEventName].forEach(function(cHandlerItem) {
        cHandlerItem.callback(sEventData);
      });
      return true;
    }

    if (sEventName.length === 0 || sEventName[0] !== '/' ) {
      throw 'OSCEventHandler Error: notify expects a proper address starting with /';
    }

    // notify osc address subscribers

    addresses = Object.keys(this._addressHandlers);
    _this = this;

    addresses.forEach(function(fAddress) {
      regex = new RegExp(_prepareRegExPattern(_prepareAddress(sEventName)), 'g');
      test = regex.test(fAddress);
      if (test && fAddress.length === regex.lastIndex) {
        _this._addressHandlers[fAddress].forEach(function(cHandlerItem) {
          cHandlerItem.callback(sEventData);
        });
      }
    });

    return true;
  };

  // timed notification

  OSCEventHandler.prototype.notifyLater = function(sEventName, sEventData, sTimeTag) {
    var now, _this, data;

    data = sEventData;
    data.timestamp = sTimeTag.milliseconds;

    now = _now();

    if (now >= sTimeTag.milliseconds) {
      if (! _options.discardLateMessages) {
        this.notify(sEventName, data);
      }
    } else {
      _this = this;
      window.setTimeout(function() {
        _this.notify(sEventName, data);
      }, sTimeTag.milliseconds - now );
    }

    return true;
  };

  /*
   * OSCSocket
   * holds all WebSocket handling
   */

  var OSCSocket = function() {
    this._socket = null;
  };

  OSCSocket.prototype.connect = function(sAddress, sPort) {
    if (!( sAddress && sPort)) {
      throw 'OSCSocket Error: missing WebSocket address or port';
    }
    // setting up websocket

    if (this._socket) {
      this.disconnect();
    }

    this._socket = new WebSocket('wss://' + sAddress + ':' + sPort);
    this._socket.binaryType = 'arraybuffer';

    this._socket.onopen = function(sEvent) {
      _oscEventHandler.notify('open', sEvent);
    };

    this._socket.onclose = function(sEvent) {
      _oscEventHandler.notify('close', sEvent);
    };

    this._socket.onerror = function(sEvent) {
      _oscEventHandler.notify('error', sEvent);
    };

    this._socket.onmessage = function(sEvent) {
      var message = new OSCPacket();
      message.decode(sEvent.data);
    };

    return true;
  };

  OSCSocket.prototype.disconnect = function() {
    this._socket.close();
    return true;
  };

  OSCSocket.prototype.status = function() {
    if (this._socket) {
      return this._socket.readyState;
    } else {
      return FLAGS.SOCKET.IS_NOT_INITALIZED;
    }
  };

  OSCSocket.prototype.send = function(sData) {
    if (this._socket) {
      if (sData && sData.buffer && sData.buffer instanceof ArrayBuffer) {
        this._socket.send(sData.buffer);
        return true;
      } else {
        return false;
      }
    } else {
      throw 'OSCSocket Error: WebSocket is not ready to send OSC data';
    }
  };

  /* OSCAtomic
   * holds all atomic OSC data types:
   * Int32, Float32, OSC-Timestamp, OSC-String, OSC-Blob
   */

  var OSCAtomic = {};

  // OSC-String (ASCII)

  OSCAtomic.OSCString = function(sValue) {
    this.value = sValue || '';
    this.offset = 0;
  };

  OSCAtomic.OSCString.prototype.decode = function(sData, sOffset) {

    var i, subarray, str;
    var data = new Int8Array(sData);
    var end = sOffset;

    while (data[end] && end < data.length) { end++; }

    if (end === data.length) {
      throw 'OSCMessage Error: malformed not ending OSC String';
    }

    subarray = data.subarray(sOffset, end);

    str = '';

    for (i = 0; i < subarray.length; i++) {
      str = str + String.fromCharCode(subarray[i]);
    }

    // @TODO check this nicer implementation here, it doesnt work in jasmine specs:
    // this.value = String.fromCharCode.apply(null, data.subarray(sOffset, end));

    this.offset = Math.ceil( ( end + 1 ) / 4 ) * 4;
    this.value = str;

    return this.offset;
  };

  OSCAtomic.OSCString.prototype.encode = function() {
    var len = Math.ceil( ( this.value.length + 1 ) / 4) * 4;
    var buf = new Array(len);
    for (var i = 0; i < len; i++) {
      buf[i] = this.value.charCodeAt(i) || 0;
    }
    return new Int8Array(buf);
  };

  // OSC Integer32 (32-bit big-endian two-complement integer)

  OSCAtomic.Int32 = function(sValue) {
    this.value = sValue || 0;
    this.offset = 0;
  };

  OSCAtomic.Int32.prototype.decode = function(sData, sOffset) {
    var dataView = new DataView(sData, sOffset, 4);
    this.value = dataView.getInt32(0);
    this.offset = sOffset + 4;
    return this.offset;
  };

  OSCAtomic.Int32.prototype.encode = function() {
    var view = new DataView(new ArrayBuffer(4));
    view.setInt32(0, this.value);
    return new Int8Array(view.buffer);
  };

  // OSC Float32 (32-bit big-endian IEEE 754 floating point number)

  OSCAtomic.Float32 = function(sValue) {
    this.value = sValue || 0.0;
    this.offset = 0;
  };

  OSCAtomic.Float32.prototype.decode = function(sData, sOffset) {
    var dataView = new DataView(sData, sOffset, 4);
    this.value = dataView.getFloat32(0);
    this.offset = sOffset + 4;
    return this.offset;
  };

  OSCAtomic.Float32.prototype.encode = function() {
    var view = new DataView(new ArrayBuffer(4));
    view.setFloat32(0, this.value);
    return new Int8Array(view.buffer);
  };

  // OSC-Blob

  OSCAtomic.OSCBlob = function(sValue) {
    this.value = sValue || new Blob();
    this.offset = 0;
  };

  OSCAtomic.OSCBlob.prototype.decode = function(sData, sOffset) {
    var dataView = new DataView(sData, sOffset, 4);
    var blobSize = dataView.getInt32(0);
    var binary = sData.slice(sOffset + 4,  sOffset + 4 + blobSize);
    this.value = new Blob([ binary ]);
    this.offset = sOffset + 4 + blobSize;
    return this.offset;
  };

  OSCAtomic.OSCBlob.prototype.encode = function() {
    var len = Math.ceil( ( this.value.size + 1 ) / 4) * 4;
    var view = new DataView(new ArrayBuffer(len + 4));
    view.setInt32(0, this.value.size);
    view.setInt32(4, this.value);
    return new Int8Array(view.buffer);
  };

  // OSC-Timetag (32+32-bit NTP TimeTag)

  OSCAtomic.OSCTimeTag = function() {
    this.value = '';
    this.seconds = 0;
    this.fraction = 0;
    this.offset = 0;
    this.milliseconds = 0;
  };

  OSCAtomic.OSCTimeTag.prototype.update = function(sMilliseconds) {
    var ms;

    if (sMilliseconds instanceof Date) {
      ms = sMilliseconds.getTime();
    } else {
      ms = sMilliseconds;
    }

    var buf = (ms / 1000.0).toString();

    this.seconds = parseInt(buf.split('.')[0], 10);
    this.fraction = parseInt(buf.split('.')[1], 10);
    this.milliseconds = ms;
    this.value = this.seconds + '.' + this.fraction;

    return true;
  };

  OSCAtomic.OSCTimeTag.prototype.decode = function(sData, sOffset) {
    var dataView = new DataView(sData, sOffset, 8);
    this.seconds = dataView.getInt32(0);
    this.fraction = dataView.getInt32(4);
    this.milliseconds = this.seconds * 1000;
    this.value = this.seconds + '.' + this.fraction;
    this.offset = sOffset + 8;
    return this.offset;
  };

  OSCAtomic.OSCTimeTag.prototype.encode = function() {
    var view = new DataView(new ArrayBuffer(8));
    view.setInt32(0, this.seconds);
    view.setInt32(4, this.fraction);
    return new Int8Array(view.buffer);
  };

  /* OSCPacket
   * unit of transmission of OSC. The contents of an
   * OSC packet must be either an OSC Message or an OSC Bundle.
   */

  var OSCPacket = function() {
    return true;
  };

  OSCPacket.prototype.decode = function(pData, pTimeTag) {
    var first, message, bundle;

    if (pData.byteLength % 4 !== 0) {
      throw 'OSCPackage Error: byteLength has to be a multiple of four';
    }

    // read first string

    first = new OSCAtomic.OSCString();
    first.decode(pData, 0);

    // is this a OSCBundle or OSCMessage?

    if (first.value === BUNDLE_TAG) {
      bundle = new OSCBundle();
      bundle.decode(pData);
      //added start
      message = bundle.bundleElements[0];
      //added end
      if (pTimeTag && bundle.timeTag.value < pTimeTag.value) {
        throw 'OSCPackage Error: timetag of enclosing bundle is past timestamp of enclosed ones';
      }
      //added start
      if (! pTimeTag) {
        _oscEventHandler.notify(message.addressPattern, message);
      } else {
        _oscEventHandler.notifyLater(message.addressPattern, message, pTimeTag);
      }
      //added end
      return bundle;
    } else {
      message = new OSCMessage();
      message.decode(pData);
      if (! pTimeTag) {
        _oscEventHandler.notify(message.addressPattern, message);
      } else {
        _oscEventHandler.notifyLater(message.addressPattern, message, pTimeTag);
      }
      return message;
    }
  };

  OSCPacket.prototype.encode = function(pData) {
    if (pData instanceof OSCMessage) {
      if (pData.address.length === 0) {
        throw 'OSCPacket Error: cant encode OSCMessage since address is empty';
      }
      return pData.encode();
    } else if (pData instanceof OSCBundle) {
      return pData.encode();
    }

    return false;
  };

  /* OSCBundle
   * consists of OSC Messages or other OSC Bundles (recursively)
   */

  var OSCBundle = function() {
    var i, len;
    this.timeTag = new OSCAtomic.OSCTimeTag();
    this.bundleElements = [];

    if (arguments.length > 0) {

      if (_isInteger(arguments[0]) || arguments[0] instanceof Date) {
        this.timeTag.update(arguments[0]);

      } else {

        if (_isArray(arguments[0])) {

          len = arguments[0].length;

          for (i = 0; i < len; i++) {
            if (arguments[0][i] instanceof OSCMessage) {
              this.bundleElements.push(arguments[0][i]);
            } else {
              throw 'OSCBundle Error: argument must be an OSCMessage';
            }
          }

        } else {
          throw 'OSCBundle Error: first argument of constructor must be array of OSCMessages or TimeTag';
        }

        if (arguments.length > 1 && (_isInteger(arguments[1]) || arguments[1] instanceof Date)) {
          this.timeTag.update(arguments[1]);
        }

      }

    }

    return true;
  };

  OSCBundle.prototype.timestamp = function(bMilliseconds) {
    if (bMilliseconds) {
      if (! (_isInteger(bMilliseconds) || bMilliseconds instanceof Date)) {
        throw 'OSCBundle Error: timetag must be an integer (milliseconds) or Date instance';
      }
      this.timeTag.update(bMilliseconds);
    } else {
      return this.timeTag;
    }
  };

  OSCBundle.prototype.add = function(bMessage) {
    if (bMessage && ( bMessage instanceof OSCMessage || bMessage instanceof OSCBundle)) {
      this.bundleElements.push(bMessage);
    } else {
      throw 'OSCBundle Error: proper OSCMessage needed for bundling';
    }
  };

  OSCBundle.prototype.decode = function(bData) {
    var offset, timetag, size, packet;

    timetag = new OSCAtomic.OSCTimeTag();
    offset = timetag.decode(bData, 8);
    this.timeTag = timetag;

    do {
      size = new OSCAtomic.Int32();
      offset = size.decode(bData, offset);
      if (size.value > 0) {
        packet = new OSCPacket();
        this.bundleElements.push(packet.decode(bData.slice(offset, offset + size.value), timetag));
      }
      offset = offset + size.value;
    } while (offset < bData.byteLength);

    return this;
  };

  OSCBundle.prototype.encode = function() {
    var encoder, buf;
    encoder = new EncodeHelper();

    // bundle tag & time tag

    encoder.add(new OSCAtomic.OSCString(BUNDLE_TAG));
    encoder.add(this.timeTag);

    // bundle elements

    this.bundleElements.forEach(function(bPacket) {
      buf = bPacket.encode();
      encoder.add(new OSCAtomic.Int32(buf.length));
      encoder.add(bPacket);
    });

    return encoder.merge();
  };

  /*
   * OSCMessage
   * consists of an OSC Address, OSC Type Tag String and Arguments
   */

  var OSCMessage = function() {
    var i, len, typeString;

    // defaults

    this.addressPattern = '';
    this.typesString = '';
    this.args = [];
    this.timestamp = _now();

    // constructor

    len = arguments.length;

    if (len > 0) {
      if (! (typeof arguments[0] === 'string' || _isArray(arguments[0]))) {
        throw 'OSC.Message Error: first argument (path) must be a string or array';
      }

      this.addressPattern = _prepareAddress(arguments[0]);

      if (len > 1) {
        typeString = '';

        for (i = 1; len > i; i++) {
          if (typeof arguments[i] === 'number') {
            if (_isInteger(arguments[i])) {
              typeString = typeString + 'i';
            } else {
              typeString = typeString + 'f';
            }
          } else if (typeof arguments[i] === 'string') {
            typeString = typeString + 's';
          } else if (arguments[i] instanceof Blob) {
            typeString = typeString + 'b';
          } else {
            throw 'OSCMessage Error: unknown argument type';
          }
          this.args.push(arguments[i]);
        }

        this.typesString = typeString;
      }
    }

    return true;
  };

  OSCMessage.prototype.address = function(mAddress) {
    if (mAddress) {
      if (! (typeof mAddress === 'string' || _isArray(mAddress))) {
        throw 'OSC.Message Error: first argument (path) must be a string or array';
      }
      this.addressPattern = _prepareAddress(mAddress);
    } else {
      return this.addressPattern;
    }
  };

  OSCMessage.prototype.add = function(mArgument) {
    if (mArgument) {
      var type;
      if (typeof mArgument === 'number') {
        if (mArgument % 1 === 0) {
          type = 'i';
        } else {
          type = 'f';
        }
      } else if (typeof mArgument === 'string') {
        type = 's';
      } else if (mArgument instanceof Blob) {
        type = 'b';
      } else {
        throw 'OSCMessage Error: unknown argument type';
      }
      this.args.push(mArgument);
      this.typesString = this.typesString + type;
    } else {
      return false;
    }
  };

  OSCMessage.prototype.decode = function(mData) {

    var address, types, i, args, offset;

    // read address and type string

    address = new OSCAtomic.OSCString();
    address.decode(mData, 0);

    types = new OSCAtomic.OSCString();
    types.decode(mData, address.offset);

    // parse type string

    if (types.length === 0 || types.value[0] !== ',') {
      throw 'OSCMessage Error: malformed or missing OSC TypeString';
    }

    args = [];
    offset = types.offset;

    for (i = 1; i < types.value.length; i++) {

      var next;

      if (types.value[i] === 'i') {
        next = new OSCAtomic.Int32();
      } else if (types.value[i] === 'f') {
        next = new OSCAtomic.Float32();
      } else if (types.value[i] === 's') {
        next = new OSCAtomic.OSCString();
      } else if (types.value[i] === 'b') {
        next = new OSCAtomic.OSCBlob();
      } else {
        throw 'OSCMessage Error: found nonstandard argument type';
      }

      next.decode(mData, offset);
      offset = next.offset;
      args.push(next.value);

    }

    // persist them

    this.addressPattern = address.value;
    this.typesString = types.value.slice(1, types.value.length);
    this.args = args;

    return this;
  };

  OSCMessage.prototype.encode = function() {

    if (this.addressPattern.length === 0 || this.addressPattern[0] !== '/' ) {
      throw 'OSCMessage Error: proper address is needed to encode this message';
    }

    var encoder = new EncodeHelper();

    // address

    encoder.add(new OSCAtomic.OSCString(this.addressPattern));

    if (this.args.length > 0) {

      // type string

      encoder.add(new OSCAtomic.OSCString(',' + this.typesString));

      // arguments

      var argument;

      this.args.forEach(function(eArgument) {
        if (typeof eArgument === 'number') {
          if (eArgument % 1 === 0) {
            argument = new OSCAtomic.Int32(eArgument);
          } else {
            argument = new OSCAtomic.Float32(eArgument);
          }
        } else if (typeof eArgument === 'string') {
          argument = new OSCAtomic.OSCString(eArgument);
        } else if (eArgument instanceof Blob) {
          argument = new OSCAtomic.OSCBlob(eArgument);
        } else {
          throw 'OSCMessage Error: unknown argument type';
        }
        encoder.add(argument);
      });

    }

    return encoder.merge();
  };

  // OSC wrapper object used as main interface

  var _oscEventHandler, _oscSocket;

  var OSC = function(mOptions) {

    // set options

    if (mOptions) {
      Object.keys(mOptions).forEach(function(oKey) {
        if (oKey in _options) {
          _options[oKey] = mOptions[oKey];
        }
      });
    }

    // expose flags

    this.SOCKET = FLAGS.SOCKET;

    // init

    _oscEventHandler = new OSCEventHandler();
    _oscSocket = new OSCSocket();

    // START_SPECS

    // expose specs in dev environment. this
    // will be removed by our grunt build task

    this.__OSCEventHandler = OSCEventHandler;
    this.__OSCSocket = OSCSocket;
    this.__OSCPacket = OSCPacket;
    this.__OSCBundle = OSCBundle;
    this.__OSCMessage = OSCMessage;

    this.test = _oscSocket;

    // END_SPECS

    return true;
  };

  // event handling

  OSC.prototype.on = function(sEventName, sCallback) {
    return _oscEventHandler.on(sEventName, sCallback);
  };

  OSC.prototype.off = function(sEventName, sToken) {
    return _oscEventHandler.off(sEventName, sToken);
  };

  // socket handling

  OSC.prototype.connect = function(sAddress, sPort) {
    var address = sAddress || DEFAULT_ADDRESS;
    var port = sPort || DEFAULT_PORT;
    return _oscSocket.connect(address, port);
  };

  OSC.prototype.disconnect = function() {
    return _oscSocket.disconnect();
  };

  OSC.prototype.status = function() {
    return _oscSocket.status();
  };

  // sending packets

  OSC.prototype.send = function(sData) {
    if (! (sData instanceof OSCMessage || sData instanceof OSCBundle)) {
      throw 'OSC Error: packet must be an OSCMessage or OSCBundle instance';
    }
    var packet = new OSCPacket();
    return _oscSocket.send(packet.encode(sData));
  };

  // public

  window.OSC = OSC;
  window.OSC.Message = OSCMessage;
  window.OSC.Bundle = OSCBundle;

})(window);
