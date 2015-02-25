angular.module('courierkill.app', ['ui.router', 'ngResource', 'ngMaterial'])

.config(['$stateProvider', '$urlRouterProvider', '$locationProvider', function($stateP, $urlRouterP, $lP) {
  $lP.html5Mode({enabled: true, requireBase: false });
  $urlRouterP.otherwise('/');

  $stateP
  .state('home', {
    url: '/',
    templateUrl: '/assets/templates/home.html',
    controller: "MainController as main"
  });
}])

.controller('MainController', ['$scope', '$resource', '$timeout', function($s, $resource, $timeout) {
  var self = this;
  var killRes = $resource('/courierkill/last');

  function load() {
    $s.kill = killRes.get();
  }

  function continuousLoad() {
    load();
    $timeout(continuousLoad, 5000);
  }
  continuousLoad();

  $s.reportKill = function() {
    var resetRes = $resource("/reset");
    var params = {};
    if (self.killerInput) {
      params = { killer: self.killerInput };
    }

    var reported = resetRes.get(params);
    reported.$promise.then(load);
  }
}])
.filter('hoursSince', function() {
  return function(timeString) {
     var lastTime = new Date(timeString);
     return (( (Date.now()) - lastTime) / 1000 / 60 / 60).toPrecision(1);
  };
});
