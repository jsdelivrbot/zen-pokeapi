/* */ 
(function(process) {
  var twit = require('twit');
  var StreamChannels = require('./StreamChannels');
  var TwitterStreamChannels = function(credentials) {
    this.apiClient = new twit(credentials);
  };
  TwitterStreamChannels.getMockedClass = function() {
    return require('../mocks/TwitterStreamChannels');
  };
  TwitterStreamChannels.launchMockDataRetriever = function(credentials, options) {
    return new require('./MockDataRetriever')(credentials, options);
  };
  TwitterStreamChannels.prototype.getApiClient = function() {
    return this.apiClient;
  };
  TwitterStreamChannels.prototype.streamChannels = function(options) {
    return new StreamChannels(this.apiClient, options);
  };
  module.exports = TwitterStreamChannels;
})(require('process'));
