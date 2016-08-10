/* */ 
(function(Buffer) {
  var querystring = require('querystring');
  var request = require('request');
  var endpoints = require('./endpoints');
  exports.makeQueryString = function(obj) {
    var qs = querystring.stringify(obj);
    qs = qs.replace(/\!/g, "%21").replace(/\'/g, "%27").replace(/\(/g, "%28").replace(/\)/g, "%29").replace(/\*/g, "%2A");
    return qs;
  };
  exports.moveParamsIntoPath = function(params, path) {
    var rgxParam = /\/:(\w+)/g;
    var missingParamErr = null;
    path = path.replace(rgxParam, function(hit) {
      var paramName = hit.slice(2);
      var suppliedVal = params[paramName];
      if (!suppliedVal) {
        throw new Error('Twit: Params object is missing a required parameter for this request: `' + paramName + '`');
      }
      var retVal = '/' + suppliedVal;
      delete params[paramName];
      return retVal;
    });
    return path;
  };
  exports.attachBodyInfoToError = function(err, body) {
    err.twitterReply = body;
    if (!body) {
      return;
    }
    if (body.error) {
      err.message = body.error;
      err.allErrors = err.allErrors.concat([body]);
    } else if (body.errors && body.errors.length) {
      err.message = body.errors[0].message;
      err.code = body.errors[0].code;
      err.allErrors = err.allErrors.concat(body.errors);
    }
  };
  exports.makeTwitError = function(message) {
    var err = new Error();
    if (message) {
      err.message = message;
    }
    err.code = null;
    err.allErrors = [];
    err.twitterReply = null;
    return err;
  };
  exports.getBearerToken = function(consumer_key, consumer_secret, cb) {
    var b64Credentials = new Buffer(consumer_key + ':' + consumer_secret).toString('base64');
    request.post({
      url: endpoints.API_HOST + '/oauth2/token',
      headers: {
        'Authorization': 'Basic ' + b64Credentials,
        'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8'
      },
      body: 'grant_type=client_credentials',
      json: true
    }, function(err, res, body) {
      if (err) {
        var error = exports.makeTwitError(err.toString());
        exports.attachBodyInfoToError(error, body);
        return cb(error, body, res);
      }
      if (!body) {
        var error = exports.makeTwitError('Not valid reply from Twitter upon obtaining bearer token');
        exports.attachBodyInfoToError(error, body);
        return cb(error, body, res);
      }
      if (body.token_type !== 'bearer') {
        var error = exports.makeTwitError('Unexpected reply from Twitter upon obtaining bearer token');
        exports.attachBodyInfoToError(error, body);
        return cb(error, body, res);
      }
      return cb(err, body.access_token);
    });
  };
})(require('buffer').Buffer);
