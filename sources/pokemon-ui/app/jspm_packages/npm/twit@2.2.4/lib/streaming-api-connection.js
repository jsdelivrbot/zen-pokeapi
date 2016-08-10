/* */ 
var EventEmitter = require('events').EventEmitter;
var util = require('util');
var helpers = require('./helpers');
var Parser = require('./parser');
var request = require('request');
var zlib = require('zlib');
var STATUS_CODES_TO_ABORT_ON = require('./settings').STATUS_CODES_TO_ABORT_ON;
var StreamingAPIConnection = function(reqOpts, twitOptions) {
  this.reqOpts = reqOpts;
  this.twitOptions = twitOptions;
  this._twitter_time_minus_local_time_ms = 0;
  EventEmitter.call(this);
};
util.inherits(StreamingAPIConnection, EventEmitter);
StreamingAPIConnection.prototype._resetConnection = function() {
  if (this.request) {
    this.request.removeAllListeners();
    this.request.destroy();
  }
  if (this.response) {
    this.response.removeAllListeners();
    this.response.destroy();
  }
  if (this.parser) {
    this.parser.removeAllListeners();
  }
  clearTimeout(this._scheduledReconnect);
  delete this._scheduledReconnect;
  this._stopStallAbortTimeout();
};
StreamingAPIConnection.prototype._resetRetryParams = function() {
  this._connectInterval = 0;
  this._usedFirstReconnect = false;
};
StreamingAPIConnection.prototype._startPersistentConnection = function() {
  var self = this;
  self._resetConnection();
  self._setupParser();
  self._resetStallAbortTimeout();
  self._setOauthTimestamp();
  self.request = request.post(this.reqOpts);
  self.emit('connect', self.request);
  self.request.on('response', function(response) {
    self._updateOauthTimestampOffsetFromResponse(response);
    self._usedFirstReconnect = false;
    self._resetStallAbortTimeout();
    self.response = response;
    if (STATUS_CODES_TO_ABORT_ON.indexOf(self.response.statusCode) !== -1) {
      var body = '';
      var compressedBody = '';
      self.response.on('data', function(chunk) {
        compressedBody += chunk.toString('utf8');
      });
      var gunzip = zlib.createGunzip();
      self.response.pipe(gunzip);
      gunzip.on('data', function(chunk) {
        body += chunk.toString('utf8');
      });
      gunzip.on('end', function() {
        try {
          body = JSON.parse(body);
        } catch (jsonDecodeError) {}
        var error = helpers.makeTwitError('Bad Twitter streaming request: ' + self.response.statusCode);
        error.statusCode = response ? response.statusCode : null;
        helpers.attachBodyInfoToError(error, body);
        self.emit('error', error);
        self.stop();
        body = null;
      });
      gunzip.on('error', function(err) {
        var errMsg = 'Gzip error: ' + err.message;
        var twitErr = helpers.makeTwitError(errMsg);
        twitErr.statusCode = self.response.statusCode;
        helpers.attachBodyInfoToError(twitErr, compressedBody);
        self.emit('parser-error', twitErr);
      });
    } else if (self.response.statusCode === 420) {
      self._scheduleReconnect();
    } else {
      var gunzip = zlib.createGunzip();
      self.response.pipe(gunzip);
      gunzip.on('data', function(chunk) {
        self._connectInterval = 0;
        self._resetStallAbortTimeout();
        self.parser.parse(chunk.toString('utf8'));
      });
      gunzip.on('close', self._onClose.bind(self));
      gunzip.on('error', function(err) {
        self.emit('error', err);
      });
      self.response.on('error', function(err) {
        self.emit('error', err);
      });
      self.emit('connected', self.response);
    }
  });
  self.request.on('close', self._onClose.bind(self));
  self.request.on('error', function(err) {
    self._scheduleReconnect.bind(self);
  });
  return self;
};
StreamingAPIConnection.prototype._onClose = function() {
  var self = this;
  self._stopStallAbortTimeout();
  if (self._scheduledReconnect) {
    return;
  }
  self._scheduleReconnect();
};
StreamingAPIConnection.prototype.start = function() {
  this._resetRetryParams();
  this._startPersistentConnection();
  return this;
};
StreamingAPIConnection.prototype.stop = function() {
  this._resetConnection();
  this._resetRetryParams();
  return this;
};
StreamingAPIConnection.prototype._resetStallAbortTimeout = function() {
  var self = this;
  self._stopStallAbortTimeout();
  self._stallAbortTimeout = setTimeout(function() {
    self._scheduleReconnect();
  }, 90000);
  return this;
};
StreamingAPIConnection.prototype._stopStallAbortTimeout = function() {
  clearTimeout(this._stallAbortTimeout);
  delete this._stallAbortTimeout;
  return this;
};
StreamingAPIConnection.prototype._scheduleReconnect = function() {
  var self = this;
  if (self.response && self.response.statusCode === 420) {
    if (!self._connectInterval) {
      self._connectInterval = 60000;
    } else {
      self._connectInterval *= 2;
    }
  } else if (self.response && String(self.response.statusCode).charAt(0) === '5') {
    if (!self._connectInterval) {
      self._connectInterval = 5000;
    } else if (self._connectInterval < 320000) {
      self._connectInterval *= 2;
    } else {
      self._connectInterval = 320000;
    }
  } else {
    if (!self._usedFirstReconnect) {
      self._connectInterval = 0;
      self._usedFirstReconnect = true;
    } else if (self._connectInterval < 16000) {
      self._connectInterval += 250;
    } else {
      self._connectInterval = 16000;
    }
  }
  self._scheduledReconnect = setTimeout(function() {
    self._startPersistentConnection();
  }, self._connectInterval);
  self.emit('reconnect', self.request, self.response, self._connectInterval);
};
StreamingAPIConnection.prototype._setupParser = function() {
  var self = this;
  self.parser = new Parser();
  self.parser.on('element', function(msg) {
    self.emit('message', msg);
    if (msg.delete) {
      self.emit('delete', msg);
    } else if (msg.disconnect) {
      self._handleDisconnect(msg);
    } else if (msg.limit) {
      self.emit('limit', msg);
    } else if (msg.scrub_geo) {
      self.emit('scrub_geo', msg);
    } else if (msg.warning) {
      self.emit('warning', msg);
    } else if (msg.status_withheld) {
      self.emit('status_withheld', msg);
    } else if (msg.user_withheld) {
      self.emit('user_withheld', msg);
    } else if (msg.friends || msg.friends_str) {
      self.emit('friends', msg);
    } else if (msg.direct_message) {
      self.emit('direct_message', msg);
    } else if (msg.event) {
      self.emit('user_event', msg);
      var ev = msg.event;
      if (ev === 'blocked') {
        self.emit('blocked', msg);
      } else if (ev === 'unblocked') {
        self.emit('unblocked', msg);
      } else if (ev === 'favorite') {
        self.emit('favorite', msg);
      } else if (ev === 'unfavorite') {
        self.emit('unfavorite', msg);
      } else if (ev === 'follow') {
        self.emit('follow', msg);
      } else if (ev === 'unfollow') {
        self.emit('unfollow', msg);
      } else if (ev === 'user_update') {
        self.emit('user_update', msg);
      } else if (ev === 'list_created') {
        self.emit('list_created', msg);
      } else if (ev === 'list_destroyed') {
        self.emit('list_destroyed', msg);
      } else if (ev === 'list_updated') {
        self.emit('list_updated', msg);
      } else if (ev === 'list_member_added') {
        self.emit('list_member_added', msg);
      } else if (ev === 'list_member_removed') {
        self.emit('list_member_removed', msg);
      } else if (ev === 'list_user_subscribed') {
        self.emit('list_user_subscribed', msg);
      } else if (ev === 'list_user_unsubscribed') {
        self.emit('list_user_unsubscribed', msg);
      } else if (ev === 'quoted_tweet') {
        self.emit('quoted_tweet', msg);
      } else if (ev === 'favorited_retweet') {
        self.emit('favorited_retweet', msg);
      } else if (ev === 'retweeted_retweet') {
        self.emit('retweeted_retweet', msg);
      } else {
        self.emit('unknown_user_event', msg);
      }
    } else {
      self.emit('tweet', msg);
    }
  });
  self.parser.on('error', function(err) {
    self.emit('parser-error', err);
  });
  self.parser.on('connection-limit-exceeded', function(err) {
    self.emit('error', err);
  });
};
StreamingAPIConnection.prototype._handleDisconnect = function(twitterMsg) {
  this.emit('disconnect', twitterMsg);
  this.stop();
};
StreamingAPIConnection.prototype._setOauthTimestamp = function() {
  var self = this;
  if (self.reqOpts.oauth) {
    var oauth_ts = Date.now() + self._twitter_time_minus_local_time_ms;
    self.reqOpts.oauth.timestamp = Math.floor(oauth_ts / 1000).toString();
  }
};
StreamingAPIConnection.prototype._updateOauthTimestampOffsetFromResponse = function(resp) {
  if (resp && resp.headers && resp.headers.date && new Date(resp.headers.date).toString() !== 'Invalid Date') {
    var twitterTimeMs = new Date(resp.headers.date).getTime();
    this._twitter_time_minus_local_time_ms = twitterTimeMs - Date.now();
  }
};
module.exports = StreamingAPIConnection;
