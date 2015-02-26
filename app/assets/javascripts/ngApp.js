angular.module('courierkill.app', ['ui.router', 'ngResource', 'ngMaterial'])

.config(['$stateProvider', '$urlRouterProvider', '$locationProvider', function($stateP, $urlRouterP, $lP) {
  $lP.html5Mode({enabled: true, requireBase: false });
  $urlRouterP.otherwise('/a/home');

  $stateP
  .state('home', {
    url: '/a/home',
    templateUrl: '/assets/templates/home.html',
    controller: "MainController as main"
  })
  .state('plot', {
    url: '/a/plot',
    templateUrl: '/assets/templates/plot.html',
    controller: "PlotController as plot"
  });
}])

.controller('MainController', ['$scope', '$resource', '$timeout', '$window', function($s, $resource, $timeout, $w) {
  var self = this;
  $s.Date = $w.Date;
  var killRes = $resource('/courierkill/last');

  function load() {
    $s.loadingkill = killRes.get(function() {
      $s.kill = $s.loadingkill;
    });
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
  return function(timeString, diff) {
     var lastTime = new Date(timeString);
     return (( diff - lastTime) / 1000 / 60 / 60).toFixed(2);
  };
})
.controller('PlotController', ['$scope', '$resource', '$window', function($s, $r, $w) {
  var self = this;
  var d3 = $w.d3;
  var killSeries = $r('/courierkill').query(processAndLoad);

  function processAndLoad() {
    var hash = {};
    killSeries.map(function(el) {
      var killCt = hash[el.killer] || 0;
      el.count = killCt++;
      hash[el.killer] = killCt;

      el.createdOn = (new Date(el.created_at)).getTime();
    });
    killSeries.sort(function(a, b) { return a.createdOn - b.createdOn; });

    loadChart();
  }

  function loadChart() {
    var margins = {
      "left": 40,
      "right": 30,
      "top": 30,
      "bottom": 30
    };
    
    var width = 1200;
    var height = 500;
    
    var colors = d3.scale.category10();

    var svg = d3.select("#scatter").append("svg").attr("width", width).attr("height", height).append("g")
      .attr("transform", "translate(" + margins.left + "," + margins.top + ")");

    var x = d3.time.scale().domain([killSeries[0].createdOn, Date.now()])
      .range([0, width - margins.left - margins.right]);

    var y = d3.scale.linear()
      .domain(d3.extent(killSeries, function (d) {
      return d.count;
    }))
    .range([height - margins.top - margins.bottom, 0]);

    svg.append("g").attr("class", "x axis").attr("transform", "translate(0," + y.range()[0] + ")");
    svg.append("g").attr("class", "y axis");

    svg.append("text")
      .attr("fill", "#414241")
      .attr("text-anchor", "end")
      .attr("x", width / 2)
      .attr("y", height - 35)
      .text("Time");


    //var xAxis = d3.svg.axis().scale(x).orient("bottom").tickPadding(2).ticks(5);
    var xDateAxis = d3.svg.axis().scale(x).orient("bottom").ticks(d3.time.hours, 8).tickSize(-height+margins.bottom);
    var yAxis = d3.svg.axis().scale(y).orient("left").tickPadding(2);

    svg.selectAll("g.y.axis").call(yAxis);
    //svg.selectAll("g.x.axis").call(xAxis);
    svg.selectAll("g.x.axis").call(xDateAxis);

    var dataNodes = svg.selectAll("g.node").data(killSeries, function (d) {
      return d.id;
    });

    
    var dataGroup = dataNodes.enter().append("g").attr("class", "node")
    .attr('transform', function (d) {
      return "translate(" + x(d.createdOn) + "," + y(d.count) + ")";
    });

    dataGroup.append("circle")
      .attr("r", 5)
      .attr("class", "dot")
      .style("fill", function (d) {
          return colors(d.killer);
    });

    dataGroup.append("text")
      .style("text-anchor", "middle")
      .attr("dy", -10)
      .text(function (d) {
          return d.killer;
    });
  }
  
}]);
