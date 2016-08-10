/* */ 
var EventEmitter = require('events').EventEmitter;
var stream = require('stream');
var util = require('util');
exports.FakeRequest = function() {
  EventEmitter.call(this);
};
util.inherits(exports.FakeRequest, EventEmitter);
exports.FakeRequest.prototype.destroy = function() {};
exports.FakeResponse = function(statusCode, body) {
  if (!body) {
    body = '';
  }
  this.statusCode = statusCode;
  stream.Readable.call(this);
  this.push(body);
  this.push(null);
};
util.inherits(exports.FakeResponse, stream.Readable);
exports.FakeResponse.prototype._read = function() {};
exports.FakeResponse.prototype.destroy = function() {};
exports.generateRandomString = function generateRandomString(length) {
  var length = length || 10;
  var ret = '';
  var alphabet = 'abcdefghijklmnopqrstuvwxyz0123456789';
  for (var i = 0; i < length; i++) {
    ret += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  ret = encodeURI(ret);
  return ret;
};
