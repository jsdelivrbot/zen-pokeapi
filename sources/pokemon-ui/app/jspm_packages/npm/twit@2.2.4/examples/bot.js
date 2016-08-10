/* */ 
var Twit = require('../lib/twitter');
var Bot = module.exports = function(config) {
  this.twit = new Twit(config);
};
Bot.prototype.tweet = function(status, callback) {
  if (typeof status !== 'string') {
    return callback(new Error('tweet must be of type String'));
  } else if (status.length > 140) {
    return callback(new Error('tweet is too long: ' + status.length));
  }
  this.twit.post('statuses/update', {status: status}, callback);
};
Bot.prototype.searchFollow = function(params, callback) {
  var self = this;
  self.twit.get('search/tweets', params, function(err, reply) {
    if (err)
      return callback(err);
    var tweets = reply.statuses;
    var rTweet = randIndex(tweets);
    if (typeof rTweet != 'undefined') {
      var target = rTweet.user.id_str;
      self.twit.post('friendships/create', {id: target}, callback);
    }
  });
};
Bot.prototype.retweet = function(params, callback) {
  var self = this;
  self.twit.get('search/tweets', params, function(err, reply) {
    if (err)
      return callback(err);
    var tweets = reply.statuses;
    var randomTweet = randIndex(tweets);
    if (typeof randomTweet != 'undefined')
      self.twit.post('statuses/retweet/:id', {id: randomTweet.id_str}, callback);
  });
};
Bot.prototype.favorite = function(params, callback) {
  var self = this;
  self.twit.get('search/tweets', params, function(err, reply) {
    if (err)
      return callback(err);
    var tweets = reply.statuses;
    var randomTweet = randIndex(tweets);
    if (typeof randomTweet != 'undefined')
      self.twit.post('favorites/create', {id: randomTweet.id_str}, callback);
  });
};
Bot.prototype.mingle = function(callback) {
  var self = this;
  this.twit.get('followers/ids', function(err, reply) {
    if (err) {
      return callback(err);
    }
    var followers = reply.ids,
        randFollower = randIndex(followers);
    self.twit.get('friends/ids', {user_id: randFollower}, function(err, reply) {
      if (err) {
        return callback(err);
      }
      var friends = reply.ids,
          target = randIndex(friends);
      self.twit.post('friendships/create', {id: target}, callback);
    });
  });
};
Bot.prototype.prune = function(callback) {
  var self = this;
  this.twit.get('followers/ids', function(err, reply) {
    if (err)
      return callback(err);
    var followers = reply.ids;
    self.twit.get('friends/ids', function(err, reply) {
      if (err)
        return callback(err);
      var friends = reply.ids,
          pruned = false;
      while (!pruned) {
        var target = randIndex(friends);
        if (!~followers.indexOf(target)) {
          pruned = true;
          self.twit.post('friendships/destroy', {id: target}, callback);
        }
      }
    });
  });
};
function randIndex(arr) {
  var index = Math.floor(arr.length * Math.random());
  return arr[index];
}
;
