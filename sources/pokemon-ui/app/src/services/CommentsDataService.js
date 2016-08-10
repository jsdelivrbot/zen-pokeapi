
function CommentsDataService(config, $q, $http, $log ) {

    var urlApi = config.getConfigByKey('urlApiPokServer');


    return {

        addComment : function(pokemon, comment) {
            $log.debug("CommentsDataService : addComment()");

            return $http.post(urlApi+'pokemons/'+pokemon+'/comments', comment);

        },
        getComments : function(pokemon) {
            $log.debug("CommentsDataService : getComments()");

            var defer = $q.defer();

            $http.get(urlApi+'pokemons/'+pokemon+'/comments')
                .success(function(data) {
                    defer.resolve(data);
                });

            return defer.promise;
        }
    };
}

export default [
    'config', '$q', '$http','$log',
    CommentsDataService
];

