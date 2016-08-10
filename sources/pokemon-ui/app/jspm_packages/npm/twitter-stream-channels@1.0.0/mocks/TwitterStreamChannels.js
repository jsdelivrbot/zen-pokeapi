/* */ 
(function(process) {
  var highSpeed = process.env.highSpeed ? true : false;
  var StreamChannels = require('../lib/StreamChannels');
  var fs = require('fs');
  var EventEmitter = require('events').EventEmitter,
      util = require('util');
  var nextLoop = (function() {
    if (highSpeed === true) {
      return process.nextTick;
    } else {
      return setTimeout;
    }
  })();
  var TwitMock = function(credentials) {
    credentials = typeof credentials === 'undefined' ? {} : credentials;
    credentials.tweets = typeof credentials.tweets === 'undefined' ? require('./data/tweets.json!systemjs-json') : credentials.tweets;
    credentials.singleRun = typeof credentials.singleRun === 'undefined' ? true : credentials.singleRun;
    credentials.tweetDelay = typeof credentials.tweetDelay === 'undefined' ? 100 : credentials.tweetDelay;
    this._tweetsMock = credentials.tweets;
    this._singleRun = credentials.singleRun;
    this._tweetDelay = credentials.tweetDelay;
  };
  TwitMock.prototype.stream = function(path, params) {
    return (new TwitStreamMock({
      tweets: this._tweetsMock,
      singleRun: this._singleRun,
      tweetDelay: this._tweetDelay
    })).start();
  };
  var TwitStreamMock = function(options) {
    options = typeof options === 'undefined' ? {} : options;
    options.tweets = typeof options.tweets === 'undefined' ? require('./data/tweets.json!systemjs-json') : options.tweets;
    options.singleRun = typeof options.singleRun === 'undefined' ? true : options.singleRun;
    options.tweetDelay = typeof options.tweetDelay === 'undefined' ? 100 : options.tweetDelay;
    this.currentTweetIndex = 0;
    EventEmitter.call(this);
    this.start = function() {
      if (this.abortedBy === null) {
        return this;
      }
      var that = this;
      this.abortedBy = null;
      var emitTweetCb = function() {
        var that = this;
        nextLoop(function() {
          if (that.abortedBy === null) {
            if (options.tweets[that.currentTweetIndex]) {
              options.tweets[that.currentTweetIndex].$index = that.currentTweetIndex;
              that.emit('tweet', options.tweets[that.currentTweetIndex]);
              that.currentTweetIndex++;
            }
            if (that.currentTweetIndex >= options.tweets.length) {
              if (options.singleRun === false) {
                that.currentTweetIndex = 0;
              } else {
                that._twitterDisconnect();
                return false;
              }
            }
            emitTweetCb.call(that);
          }
        }, 1 * options.tweetDelay);
      };
      nextLoop(function() {
        that.emit('connect');
      }, 0);
      nextLoop(function() {
        that.emit('connected');
      }, 1 * options.tweetDelay);
      nextLoop(function() {
        emitTweetCb.call(that);
      }, 2 * options.tweetDelay);
      return this;
    };
    this.stop = function() {
      this.abortedBy = 'twit-client';
      return this;
    };
    this._twitterDisconnect = function() {
      this.abortedBy = 'twitter';
      this.emit('disconnect');
      return this;
    };
  };
  util.inherits(TwitStreamMock, EventEmitter);
  var TwitterStreamChannelsMock = function(credentials) {
    this.apiClient = new TwitMock(credentials);
  };
  TwitterStreamChannelsMock.prototype.getApiClient = function() {
    return this.apiClient;
  };
  TwitterStreamChannelsMock.prototype.streamChannels = function(options) {
    return new StreamChannels(this.apiClient, options);
  };
  module.exports = TwitterStreamChannelsMock;
})(require('process'));
