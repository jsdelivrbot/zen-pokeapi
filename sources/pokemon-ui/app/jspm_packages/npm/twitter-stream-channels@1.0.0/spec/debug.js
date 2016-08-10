/* */ 
(function(process) {
  var TwitterStreamChannels = require('../../main').getMockedClass();
  var client = new TwitterStreamChannels({});
  var inputTweetsMocks = require('../mocks/data/tweets.json!systemjs-json');
  var stream = client.getApiClient().stream('statuses/filter', {track: "whatever is in the json mock file"});
  var count = 0;
  stream.on('connect', function() {
    console.log('> attempt connecting');
  });
  stream.on('connected', function() {
    console.log('> connected');
  });
  stream.on('tweet', function(tweet) {
    console.log(tweet.text);
    count++;
  });
  setTimeout(function() {
    stream.stop();
    console.log('> stopped stream');
    console.log('> retrieved ' + count + ' tweets / ' + inputTweetsMocks.length + ' tweets were send by the mock');
    process.exit();
  }, 17000);
})(require('process'));
