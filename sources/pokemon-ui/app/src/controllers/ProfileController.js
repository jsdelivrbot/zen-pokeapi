
function ProfileController( $routeParams, pokemonsDataService, $scope, $location, $log) {

    var self = this;
    self.selected     = null;

    // Load the selected Pokemon by the route
    if($routeParams.pokemon !== null && $routeParams.pokemon !== undefined){
        loadPokemon($routeParams.pokemon);
    }

    function loadPokemon ( pokemon ) {
         pokemonsDataService.getPokemon(pokemon).then(function(pok){
            $log.debug( "ProfileCtrl : getPok={name}", pok.name);
            self.selected = pok;
            $scope.selected = pok;

             self.stats = [];
             for (let stat of pok.stats) {
                 let statObject = {
                     'stats': stat,
                     'options': {
                         displayPrevious: true,
                         barCap: stat.baseStat,
                         trackWidth: 30,
                         barWidth: 15,
                         trackColor: 'rgba(63,81,181,0.2)',
                         barColor: 'rgba(63,81,181,1)',
                         textColor: 'rgba(63,81,181,1)',
                         size: 110,
                         max: stat.maxStat,
                         subText: {
                             enabled: true,
                             text: 'Max : '+stat.maxStat
                         }
                     },
                     'average': pok.averageByType
                 }


                 self.stats.push(statObject);
             }
        }, function(){
            "use strict";
             // if pokemon don't exists, redirect to homepage
             $location.path("/");
         });

    }



}

export default [
     '$routeParams', 'PokemonsDataService', '$scope', '$location', '$log',
    ProfileController
];

