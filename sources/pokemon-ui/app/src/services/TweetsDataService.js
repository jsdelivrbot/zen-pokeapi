
function TweetsDataService(config, $q, $http, $log ) {

    let urlApi = config.getConfigByKey('urlApiPokServer');

    return {

        search : function(query) {
            $log.debug("TweetsDataService : search()");

            var defer = $q.defer();

            $http.get(urlApi+'/tweets/'+query)
                .success(function(data) {
                    defer.resolve(data);
                });

            return defer.promise;
        }
    };
}

export default [
    'config', '$q', '$http','$log',
    TweetsDataService
];

