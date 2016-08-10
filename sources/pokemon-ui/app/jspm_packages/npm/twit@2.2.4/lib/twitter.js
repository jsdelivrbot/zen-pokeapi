/* */ 
(function(process) {
  var assert = require('assert');
  var Promise = require('bluebird');
  var request = require('request');
  var util = require('util');
  var endpoints = require('./endpoints');
  var FileUploader = require('./file_uploader');
  var helpers = require('./helpers');
  var StreamingAPIConnection = require('./streaming-api-connection');
  var STATUS_CODES_TO_ABORT_ON = require('./settings').STATUS_CODES_TO_ABORT_ON;
  var required_for_app_auth = ['consumer_key', 'consumer_secret'];
  var required_for_user_auth = required_for_app_auth.concat(['access_token', 'access_token_secret']);
  var FORMDATA_PATHS = ['media/upload', 'account/update_profile_image', 'account/update_profile_background_image'];
  var JSONPAYLOAD_PATHS = ['media/metadata/create'];
  var Twitter = function(config) {
    if (!(this instanceof Twitter)) {
      return new Twitter(config);
    }
    var self = this;
    var credentials = {
      consumer_key: config.consumer_key,
      consumer_secret: config.consumer_secret,
      access_token: config.access_token,
      access_token_secret: config.access_token_secret,
      app_only_auth: config.app_only_auth
    };
    this._validateConfigOrThrow(config);
    this.config = config;
    this._twitter_time_minus_local_time_ms = 0;
  };
  Twitter.prototype.get = function(path, params, callback) {
    return this.request('GET', path, params, callback);
  };
  Twitter.prototype.post = function(path, params, callback) {
    return this.request('POST', path, params, callback);
  };
  Twitter.prototype.request = function(method, path, params, callback) {
    var self = this;
    assert(method == 'GET' || method == 'POST');
    if (typeof params === 'function') {
      callback = params;
      params = {};
    }
    return new Promise(function(resolve, reject) {
      var _returnErrorToUser = function(err) {
        if (callback && typeof callback === 'function') {
          callback(err, null, null);
        }
        reject(err);
      };
      self._buildReqOpts(method, path, params, false, function(err, reqOpts) {
        if (err) {
          _returnErrorToUser(err);
          return;
        }
        var twitOptions = (params && params.twit_options) || {};
        process.nextTick(function() {
          self._doRestApiRequest(reqOpts, twitOptions, method, function(err, parsedBody, resp) {
            self._updateClockOffsetFromResponse(resp);
            if (self.config.trusted_cert_fingerprints) {
              if (!resp.socket.authorized) {
                var authErrMsg = resp.socket.authorizationError.toString();
                var err = helpers.makeTwitError('The peer certificate was not signed; ' + authErrMsg);
                _returnErrorToUser(err);
                return;
              }
              var fingerprint = resp.socket.getPeerCertificate().fingerprint;
              var trustedFingerprints = self.config.trusted_cert_fingerprints;
              if (trustedFingerprints.indexOf(fingerprint) === -1) {
                var errMsg = util.format('Certificate untrusted. Trusted fingerprints are: %s. Got fingerprint: %s.', trustedFingerprints.join(','), fingerprint);
                var err = new Error(errMsg);
                _returnErrorToUser(err);
                return;
              }
            }
            if (callback && typeof callback === 'function') {
              callback(err, parsedBody, resp);
            }
            resolve({
              data: parsedBody,
              resp: resp
            });
            return;
          });
        });
      });
    });
  };
  Twitter.prototype.postMediaChunked = function(params, cb) {
    var self = this;
    try {
      var fileUploader = new FileUploader(params, self);
    } catch (err) {
      cb(err);
      return;
    }
    fileUploader.upload(cb);
  };
  Twitter.prototype._updateClockOffsetFromResponse = function(resp) {
    var self = this;
    if (resp && resp.headers && resp.headers.date && new Date(resp.headers.date).toString() !== 'Invalid Date') {
      var twitterTimeMs = new Date(resp.headers.date).getTime();
      self._twitter_time_minus_local_time_ms = twitterTimeMs - Date.now();
    }
  };
  Twitter.prototype._buildReqOpts = function(method, path, params, isStreaming, callback) {
    var self = this;
    if (!params) {
      params = {};
    }
    var paramsClone = JSON.parse(JSON.stringify(params));
    var finalParams = this.normalizeParams(paramsClone);
    delete finalParams.twit_options;
    var reqOpts = {
      headers: {
        'Accept': '*/*',
        'User-Agent': 'twit-client'
      },
      gzip: true,
      encoding: null
    };
    if (typeof self.config.timeout_ms !== 'undefined') {
      reqOpts.timeout = self.config.timeout_ms;
    }
    try {
      path = helpers.moveParamsIntoPath(finalParams, path);
    } catch (e) {
      callback(e, null, null);
      return;
    }
    if (isStreaming) {
      var stream_endpoint_map = {
        user: endpoints.USER_STREAM,
        site: endpoints.SITE_STREAM
      };
      var endpoint = stream_endpoint_map[path] || endpoints.PUB_STREAM;
      reqOpts.url = endpoint + path + '.json';
    } else {
      if (path.indexOf('media/') !== -1) {
        reqOpts.url = endpoints.MEDIA_UPLOAD + path + '.json';
      } else {
        reqOpts.url = endpoints.REST_ROOT + path + '.json';
      }
      if (FORMDATA_PATHS.indexOf(path) !== -1) {
        reqOpts.headers['Content-type'] = 'multipart/form-data';
        reqOpts.form = finalParams;
        finalParams = {};
      } else if (JSONPAYLOAD_PATHS.indexOf(path) !== -1) {
        reqOpts.headers['Content-type'] = 'application/json';
        reqOpts.json = true;
        reqOpts.body = finalParams;
        finalParams = {};
      } else {
        reqOpts.headers['Content-type'] = 'application/json';
      }
    }
    if (Object.keys(finalParams).length) {
      var qs = helpers.makeQueryString(finalParams);
      reqOpts.url += '?' + qs;
    }
    if (!self.config.app_only_auth) {
      var oauth_ts = Date.now() + self._twitter_time_minus_local_time_ms;
      reqOpts.oauth = {
        consumer_key: self.config.consumer_key,
        consumer_secret: self.config.consumer_secret,
        token: self.config.access_token,
        token_secret: self.config.access_token_secret,
        timestamp: Math.floor(oauth_ts / 1000).toString()
      };
      callback(null, reqOpts);
      return;
    } else {
      self._getBearerToken(function(err, bearerToken) {
        if (err) {
          callback(err, null);
          return;
        }
        reqOpts.headers['Authorization'] = 'Bearer ' + bearerToken;
        callback(null, reqOpts);
        return;
      });
    }
  };
  Twitter.prototype._doRestApiRequest = function(reqOpts, twitOptions, method, callback) {
    var request_method = request[method.toLowerCase()];
    var req = request_method(reqOpts);
    var body = '';
    var response = null;
    var onRequestComplete = function() {
      if (body !== '') {
        try {
          body = JSON.parse(body);
        } catch (jsonDecodeError) {
          var err = helpers.makeTwitError('JSON decode error: Twitter HTTP response body was not valid JSON');
          err.statusCode = response ? response.statusCode : null;
          err.allErrors.concat({error: jsonDecodeError.toString()});
          callback(err, body, response);
          return;
        }
      }
      if (typeof body === 'object' && (body.error || body.errors)) {
        var err = helpers.makeTwitError('Twitter API Error');
        err.statusCode = response ? response.statusCode : null;
        helpers.attachBodyInfoToError(err, body);
        callback(err, body, response);
        return;
      }
      callback(err, body, response);
    };
    req.on('response', function(res) {
      response = res;
      req.on('data', function(chunk) {
        body += chunk.toString('utf8');
      });
      req.on('end', function() {
        onRequestComplete();
      });
    });
    req.on('error', function(err) {
      if (twitOptions.retry && STATUS_CODES_TO_ABORT_ON.indexOf(err.statusCode) !== -1) {
        self.request(method, path, params, callback);
        return;
      } else {
        err.statusCode = null;
        err.code = null;
        err.allErrors = [];
        helpers.attachBodyInfoToError(err, body);
        callback(err, body, response);
        return;
      }
    });
  };
  Twitter.prototype.stream = function(path, params) {
    var self = this;
    var twitOptions = (params && params.twit_options) || {};
    var streamingConnection = new StreamingAPIConnection();
    self._buildReqOpts('POST', path, params, true, function(err, reqOpts) {
      if (err) {
        streamingConnection.emit('error', err);
        return;
      }
      streamingConnection.reqOpts = reqOpts;
      streamingConnection.twitOptions = twitOptions;
      process.nextTick(function() {
        streamingConnection.start();
      });
    });
    return streamingConnection;
  };
  Twitter.prototype._getBearerToken = function(callback) {
    var self = this;
    if (self._bearerToken) {
      return callback(null, self._bearerToken);
    }
    helpers.getBearerToken(self.config.consumer_key, self.config.consumer_secret, function(err, bearerToken) {
      if (err) {
        callback(err, null);
        return;
      }
      self._bearerToken = bearerToken;
      callback(null, self._bearerToken);
      return;
    });
  };
  Twitter.prototype.normalizeParams = function(params) {
    var normalized = params;
    if (params && typeof params === 'object') {
      Object.keys(params).forEach(function(key) {
        var value = params[key];
        if (Array.isArray(value))
          normalized[key] = value.join(',');
      });
    } else if (!params) {
      normalized = {};
    }
    return normalized;
  };
  Twitter.prototype.setAuth = function(auth) {
    var self = this;
    var configKeys = ['consumer_key', 'consumer_secret', 'access_token', 'access_token_secret'];
    configKeys.forEach(function(k) {
      if (auth[k]) {
        self.config[k] = auth[k];
      }
    });
    this._validateConfigOrThrow(self.config);
  };
  Twitter.prototype.getAuth = function() {
    return this.config;
  };
  Twitter.prototype._validateConfigOrThrow = function(config) {
    if (typeof config !== 'object') {
      throw new TypeError('config must be object, got ' + typeof config);
    }
    if (typeof config.timeout_ms !== 'undefined' && isNaN(Number(config.timeout_ms))) {
      throw new TypeError('Twit config `timeout_ms` must be a Number. Got: ' + config.timeout_ms + '.');
    }
    if (config.app_only_auth) {
      var auth_type = 'app-only auth';
      var required_keys = required_for_app_auth;
    } else {
      var auth_type = 'user auth';
      var required_keys = required_for_user_auth;
    }
    required_keys.forEach(function(req_key) {
      if (!config[req_key]) {
        var err_msg = util.format('Twit config must include `%s` when using %s.', req_key, auth_type);
        throw new Error(err_msg);
      }
    });
  };
  module.exports = Twitter;
})(require('process'));
