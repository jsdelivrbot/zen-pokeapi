/* */ 
(function(process) {
  var twit = require('twit');
  var fs = require('fs');
  var MockDataRetriever = function(credentials, options) {
    if (typeof options === 'undefined') {
      throw new Error("options parameter is mandatory");
    }
    if (typeof options.track === 'undefined') {
      throw new Error("options.track parameter is mandatory");
    }
    if (options.track instanceof Array !== true) {
      throw new Error("options.track parameter must be an array of keywords");
    }
    if (options.output === 'undefined') {
      throw new Error("options.output parameter is mandatory");
    }
    if (typeof options.maxNumber === 'undefined') {
      options.maxNumber = 200;
    }
    if (options.maxNumber > 500) {
      options.maxNumber = 500;
    }
    if (typeof options.timeout === 'undefined' || options.timeout > 100000) {
      options.timeout = 100000;
    }
    var date = new Date();
    var client = new twit(credentials);
    var tweets = [];
    var stream = client.stream('statuses/filter', {track: options.track});
    var onEnd = function() {
      stream.stop();
      console.log('');
      console.log('> stopped stream after ' + ((new Date()).getTime() - date.getTime()) + 'ms - ' + tweets.length + ' tweets retrieved');
      if (tweets.length > 0) {
        tweets = JSON.stringify(tweets);
        fs.writeFile(options.output, tweets, function(err, data) {
          console.log('> writing retrieved tweets into file : ' + options.output);
          if (err) {
            console.log('> ! an error occured while writing tweets to file');
          }
          process.exit();
        });
      } else {
        console.log('> ! no tweets retrieved, not writing into file : ' + options.output);
        process.exit();
      }
    };
    stream.on('connect', function() {
      console.log('> connecting to twitter');
    });
    stream.on('connected', function() {
      console.log('> connected to twitter - will disconnect in ' + options.timeout + 'ms or when ' + options.maxNumber + ' tweets are retrieved');
    });
    stream.on('disconnect', function() {
      console.log('> disconnected from twitter - please retry');
    });
    stream.on('tweet', function(tweet) {
      tweets.push(tweet);
      process.stdout.clearLine();
      process.stdout.cursorTo(0);
      process.stdout.write(tweets.length + ' tweets retrieved');
      if (tweets.length >= options.maxNumber) {
        onEnd();
      }
    });
    setTimeout(function() {
      onEnd();
    }, options.timeout);
  };
  module.exports = MockDataRetriever;
})(require('process'));
