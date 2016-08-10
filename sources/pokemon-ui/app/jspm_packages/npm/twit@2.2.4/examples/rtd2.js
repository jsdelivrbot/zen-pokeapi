/* */ 
var Bot = require('./bot'),
    config1 = require('../config1');
var bot = new Bot(config1);
console.log('RTD2: Running.');
function datestring() {
  var d = new Date(Date.now() - 5 * 60 * 60 * 1000);
  return d.getUTCFullYear() + '-' + (d.getUTCMonth() + 1) + '-' + d.getDate();
}
;
setInterval(function() {
  bot.twit.get('followers/ids', function(err, reply) {
    if (err)
      return handleError(err);
    console.log('\n# followers:' + reply.ids.length.toString());
  });
  var rand = Math.random();
  if (rand <= 0.10) {
    var params = {
      q: 'github.com/',
      since: datestring(),
      result_type: 'mixed'
    };
    bot.twit.get('search/tweets', params, function(err, reply) {
      if (err)
        return handleError(err);
      var max = 0,
          popular;
      var tweets = reply.statuses,
          i = tweets.length;
      while (i--) {
        var tweet = tweets[i],
            popularity = tweet.retweet_count;
        if (popularity > max) {
          max = popularity;
          popular = tweet.text;
        }
      }
      bot.tweet(popular, function(err, reply) {
        if (err)
          return handleError(err);
        console.log('\nTweet: ' + (reply ? reply.text : reply));
      });
    });
  } else if (rand <= 0.55) {
    bot.mingle(function(err, reply) {
      if (err)
        return handleError(err);
      var name = reply.screen_name;
      console.log('\nMingle: followed @' + name);
    });
  } else {
    bot.prune(function(err, reply) {
      if (err)
        return handleError(err);
      var name = reply.screen_name;
      console.log('\nPrune: unfollowed @' + name);
    });
  }
}, 40000);
function handleError(err) {
  console.error('response status:', err.statusCode);
  console.error('data:', err.data);
}
