
function PokemonsDataService(config, $q, $http, $log ) {

    var urlApi = config.getConfigByKey('urlApiPokServer');


    return {
        loadAll : function() {

            var defer = $q.defer();

            // get pokemons list
            $http.get( urlApi+'/pokemons')
                .success(function(data) {
                    defer.resolve(data);
                });

            return defer.promise;
        },
        getPokemon : function(pokemon) {
            $log.debug("PokemonsDataService : getPokemon()");

            var defer = $q.defer();

            $http.get(urlApi+'pokemons/'+pokemon)
                .success(function(data) {
                    defer.resolve(data);
                })
                .error(function(){
                    "use strict";
                    defer.reject();
                });

            return defer.promise;
        }
    };
}

export default [
    'config', '$q', '$http','$log',
    PokemonsDataService
];

