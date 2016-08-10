/* */ 
(function(process) {
  var EventEmitter = require('events').EventEmitter,
      util = require('util');
  var StreamChannels = function(apiClient, options) {
    helpers.checkStreamChannelsOptions(options, this);
    options.enableChannelsEvents = typeof options.enableChannelsEvents === 'undefined' ? true : options.enableChannelsEvents;
    options.enableRootChannelsEvent = typeof options.enableRootChannelsEvent === 'undefined' ? true : options.enableRootChannelsEvent;
    options.enableKeywordsEvents = typeof options.enableKeywordsEvents === 'undefined' ? false : options.enableKeywordsEvents;
    helpers.preprocessKeywords(options, this);
    this.currentStream = apiClient.stream('statuses/filter', this._getOptionsToPassToApiClient(options));
    EventEmitter.call(this);
    addEvents(this.currentStream, this);
    this.options = options;
  };
  util.inherits(StreamChannels, EventEmitter);
  var defaultEventsToTransmit = ['connect', 'connected', 'disconnect', 'reconnect', 'warning'];
  var addEvents = function(twitterStream, streamChannels) {
    for (var i = 0; i < defaultEventsToTransmit.length; i++) {
      (function(eventName) {
        twitterStream.on(eventName, function(msg) {
          streamChannels.emit(eventName, msg);
        });
      })(defaultEventsToTransmit[i]);
    }
    twitterStream.on('tweet', function(msg) {
      helpers.onTweetEvent(msg, streamChannels);
    });
    return streamChannels;
  };
  var removeEvents = function(twitterStream, streamChannels, options) {
    if (options.removeAllListeners === true) {
      streamChannels.removeAllListeners();
    }
    return streamChannels;
  };
  StreamChannels.prototype._getOptionsToPassToApiClient = function(options) {
    var result = {};
    var dontHandle = ['track', 'enableChannelsEvents', 'enableRootChannelsEvent', 'enableKeywordsEvents'];
    if (typeof options !== 'undefined') {
      for (var key in options) {
        if (dontHandle.indexOf(key) === -1) {
          result[key] = options[key];
        }
      }
    }
    result.track = this.trackedKeywords;
    return result;
  };
  StreamChannels.prototype.start = function() {
    this.currentStream.start();
    return this;
  };
  StreamChannels.prototype.stop = function(options) {
    options = typeof options === 'undefined' ? {} : options;
    options.removeAllListeners = typeof options.removeAllListeners === 'undefined' ? false : options.removeAllListeners;
    this.currentStream.stop();
    removeEvents(this.currentStream, this, options);
    return this;
  };
  StreamChannels.prototype.getChannels = function() {
    return this.channels;
  };
  StreamChannels.prototype.getTrackedKeywords = function() {
    return this.trackedKeywords;
  };
  StreamChannels.prototype.getChannelsKeywordsLowerCasedRegExp = function() {
    return this.channelsKeywordsLowerCasedRegExp;
  };
  module.exports = StreamChannels;
  var helpers = {
    checkStreamChannelsOptions: function(options) {
      if (typeof options === 'undefined') {
        throw new Error('new StreamChannels(options) - options parameter missing');
      } else if (typeof options.track === 'undefined') {
        throw new Error('new StreamChannels(options) - options.track parameter missing');
      } else if (!(typeof options.track === 'object' || typeof options.track === 'string')) {
        throw new Error('new StreamChannels(options) - options.track must be an Object (representing your channels with there keywords), an Array (of keywords) or a String (with comma separeted keywords)');
      }
    },
    preprocessKeywords: function(options, streamChannels) {
      streamChannels.trackedKeywords = [];
      streamChannels.channels = {};
      streamChannels.channelsKeywordsLowerCased = {};
      streamChannels.channelsKeywordsLowerCasedRegExpSafe = {};
      streamChannels.channelsKeywordsLowerCasedRegExp = {};
      if (options.track instanceof Array || typeof options.track === 'string') {
        options.track = {"default": options.track};
      }
      for (var channel in options.track) {
        streamChannels.channels[channel] = keywordsToArray(options.track[channel], []);
        streamChannels.channelsKeywordsLowerCased[channel] = streamChannels.channels[channel].map(function(item) {
          return item.toLowerCase();
        });
        streamChannels.channelsKeywordsLowerCasedRegExpSafe[channel] = streamChannels.channelsKeywordsLowerCased[channel].map(function(item) {
          return regExpEscape(item);
        });
        streamChannels.channelsKeywordsLowerCasedRegExp[channel] = streamChannels.channelsKeywordsLowerCased[channel].length > 0 ? new RegExp(streamChannels.channelsKeywordsLowerCasedRegExpSafe[channel].join('|'), 'g') : null;
        streamChannels.channels[channel].forEach(function(item) {
          if (streamChannels.trackedKeywords.indexOf(item) === -1) {
            streamChannels.trackedKeywords.push(item);
          }
        });
      }
      function keywordsToArray(keywords, result) {
        if (typeof keywords === 'string') {
          result = result.concat(keywords.split(','));
        } else if (keywords instanceof Array) {
          if (keywords.length > 0) {
            for (var i = 0; i < keywords.length; i++) {
              result = keywordsToArray(keywords[i], result);
            }
          }
        }
        return result;
      }
      return streamChannels;
    },
    postprocessTweet: function(tweet, streamChannels) {
      tweet.$channels = {};
      tweet.$keywords = [];
      var i,
          j,
          k;
      var lowerCasedSearch = [];
      var keywordsFound = [],
          tmpKeywords;
      lowerCasedSearch.push(tweet.text.toLowerCase());
      if (tweet.user && tweet.user.screen_name) {
        lowerCasedSearch.push(tweet.user.screen_name.toLowerCase());
      }
      if (tweet.entities && tweet.entities.urls && tweet.entities.urls.length > 0) {
        for (i = 0; i < tweet.entities.urls.length; i++) {
          if (tweet.entities.urls[i].display_url) {
            lowerCasedSearch.push(tweet.entities.urls[i].display_url.toLowerCase());
          }
          if (tweet.entities.urls[i].expanded_url) {
            lowerCasedSearch.push(tweet.entities.urls[i].expanded_url.toLowerCase());
          }
        }
      }
      for (var channel in streamChannels.channelsKeywordsLowerCasedRegExp) {
        keywordsFound = [];
        for (j = 0; j < lowerCasedSearch.length; j++) {
          tmpKeywords = lowerCasedSearch[j].match(streamChannels.channelsKeywordsLowerCasedRegExp[channel]);
          if (tmpKeywords !== null) {
            keywordsFound = keywordsFound.concat(tmpKeywords);
          }
        }
        if (keywordsFound.length > 0) {
          tweet.$channels[channel] = [];
          for (k = 0; k < keywordsFound.length; k++) {
            if (tweet.$channels[channel].indexOf(keywordsFound[k]) === -1) {
              tweet.$channels[channel].push(keywordsFound[k]);
            }
            if (tweet.$keywords.indexOf(keywordsFound[k]) === -1) {
              tweet.$keywords.push(keywordsFound[k]);
            }
          }
        }
      }
      return streamChannels;
    },
    emitPosprocessedTweet: function(tweet, streamChannels) {
      var channel,
          keyword;
      if (streamChannels.options.enableRootChannelsEvent === true) {
        streamChannels.emit('channels', tweet);
      }
      if (streamChannels.options.enableChannelsEvents === true) {
        for (channel in tweet.$channels) {
          streamChannels.emit('channels/' + channel, tweet);
        }
      }
      if (streamChannels.options.enableKeywordsEvents === true) {
        for (channel in tweet.$channels) {
          if (tweet.$channels[channel].length > 0) {
            for (var i = 0; i < tweet.$channels[channel].length; i++) {
              streamChannels.emit('keywords/' + tweet.$channels[channel][i], tweet);
            }
          }
        }
      }
      return streamChannels;
    },
    onTweetEvent: function(tweet, streamChannels) {
      helpers.postprocessTweet(tweet, streamChannels);
      return helpers.emitPosprocessedTweet(tweet, streamChannels);
    }
  };
  var regExpEscape = function(s) {
    return String(s).replace(/([-()\[\]{}+?*.$\^|,:#<!\\])/g, '\\$1').replace(/\x08/g, '\\x08');
  };
})(require('process'));
