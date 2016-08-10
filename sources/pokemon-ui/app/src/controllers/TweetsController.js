
function TweetsController(tweetsDataService, $scope, $routeParams,  $log) {

    var self = this;
    self.search = $routeParams.pokemon;
    self.tweets = [];
    self.onError = false;

    var getResults = function() {
        tweetsDataService.search(self.search).then(function(tweets){
            "use strict";
            self.tweets = tweets;
            self.onError = false;
        });
    }

    getResults();

}

export default [
    'TweetsDataService', '$scope', '$routeParams', '$log',
    TweetsController
];

