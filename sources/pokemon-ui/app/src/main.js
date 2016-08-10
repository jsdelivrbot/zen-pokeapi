"use strict";
import PokemonsDataService from 'app/services/PokemonsDataService';
import CommentsDataService from 'app/services/CommentsDataService';

import TweetsDataService from 'app/services/TweetsDataService';
import MainController from 'app/controllers/MainController';
import CommentsController from 'app/controllers/CommentsController';
import ProfileController from 'app/controllers/ProfileController';
import TweetsController from 'app/controllers/TweetsController';
import 'angular-route';
import 'gilf/ngConfig';
import 'ng-knob';
import { ExternalLogger } from 'utils/LogDecorator';

const URL_ICON_TWITTER = 'assets/svg/twitter.svg';

let $log = new ExternalLogger();
    $log = $log.getInstance( "BOOTSTRAP" );
    $log.debug( "Configuring 'main' module" );

let app = angular.module('main', [ 'ngRoute', 'ngConfig','ui.knob'] )
    .service("CommentsDataService" , CommentsDataService )
    .service("PokemonsDataService" , PokemonsDataService )
    .service("TweetsDataService" , TweetsDataService )
    .controller("MainController" , MainController )
    .controller("CommentsController" , CommentsController )
    .controller("ProfileController" , ProfileController )
    .controller("TweetsController" , TweetsController )
    .config(['$routeProvider', function($routeProvider) {

            // route for the home page
            $routeProvider.when('/', {
                templateUrl : 'src/pages/app.html',
                controller  : 'MainController'
            })
            // route for the selected pokemon page
            .when('/:pokemon', {
                templateUrl : 'src/pages/profile.html',
                controller  : 'ProfileController as ctrl'
            });
    }])
    .config(['configProvider', function (configProvider) {
        configProvider.setConfigUri('src/config/settings.json');
    }])
    .config( ($mdIconProvider) => {

        $log.debug( "Configuring $mdIconProvider" );
        $mdIconProvider
            .icon('twitter' ,URL_ICON_TWITTER, 24)

    });

app.run(function(config){
    config.init();
})

export default app.name;
