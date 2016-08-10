
function CommentsController( $routeParams, commentsDataService, $scope, $log) {

    var self = this;
    self.selected     = null;
    $scope.comment = {};
    self.comments = [];

    // Load the selected Pokemon by the route
    if($routeParams.pokemon !== null && $routeParams.pokemon !== undefined){
        self.pokemon = $routeParams.pokemon;
    }

    // Gets comments for the pokemon
    $scope.loadComments = function(){

        commentsDataService
            .getComments(self.pokemon)
            .then(function (comments) {
                self.comments = comments;
            });
    }

    // Add a comment
    $scope.postComment = function() {
        if($scope.comment.author!==undefined && $scope.comment.comment!==undefined ){

            commentsDataService.addComment(self.pokemon, $scope.comment)
                .error(function(){
                    "use strict";
                    self.error = true;
                })
                .success(function(){
                    "use strict";
                    $scope.loadComments();
                });

        }

    }

    $scope.loadComments();

}

export default [
     '$routeParams', 'CommentsDataService', '$scope', '$log',
    CommentsController
];

