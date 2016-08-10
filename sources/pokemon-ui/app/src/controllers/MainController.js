function MainController( pokemonsDataService, $location, $log) {

    var self = this;

    self.selected = null;
    self.loading = false;
    self.noCache = false;
    self.isDisabled = false;
    self.querySearch = querySearch;
    self.selectedItem = null;
    self.pokemons = [];
    self.selectPokemon = selectPokemon;
    self.selectedItemChange = selectPokemon;


    // Load all pokemons
    pokemonsDataService
        .loadAll()
        .then(function (pokemons) {
            self.pokemons = [].concat(pokemons);
        });

    // *********************************
    // Internal methods
    // *********************************
    /**
     * Create filter function for a query string
     */
    function createFilterFor(query) {
        var lowercaseQuery = angular.lowercase(query);
        return function filterFn(pokemon) {
            return (pokemon.name.indexOf(lowercaseQuery) === 0);
        };
    }

    /**
     * Search for pokemons...
     */
    function querySearch(query) {
        return query ? self.pokemons.filter(createFilterFor(query)) : self.pokemons;
    }

    /**
     * Select the current pokemon
     * @param pokemon
     */
    function selectPokemon(pokemon) {
        $log.debug("selectPokemon( {name} ) ", pokemon);
        self.loading = true;
        $location.path(pokemon.name);
    }


}

export default [
    'PokemonsDataService', '$location', '$log',
    MainController
];

