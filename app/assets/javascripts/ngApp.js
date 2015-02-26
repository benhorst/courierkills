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

    // we add the SVG component to the scatter-load div
    var svg = d3.select("#scatter").append("svg").attr("width", width).attr("height", height).append("g")
        .attr("transform", "translate(" + margins.left + "," + margins.top + ")");

    // this sets the scale that we're using for the X axis. 
    // the domain define the min and max variables to show. In this case, it's the min and max prices of items.
    // this is made a compact piece of code due to d3.extent which gives back the max and min of the price variable within the dataset
    var x = d3.time.scale().domain([killSeries[0].createdOn, Date.now()])
    //    .domain(d3.extent(killSeries, function (d) {
    //    return d.createdOn;
    //}))
    // the range maps the domain to values from 0 to the width minus the left and right margins (used to space out the visualization)
        .range([0, width - margins.left - margins.right]);

    // this does the same as for the y axis but maps from the rating variable to the height to 0. 
    var y = d3.scale.linear()
        .domain(d3.extent(killSeries, function (d) {
        return d.count;
    }))
    // Note that height goes first due to the weird SVG coordinate system
    .range([height - margins.top - margins.bottom, 0]);

    // we add the axes SVG component. At this point, this is just a placeholder. The actual axis will be added in a bit
    svg.append("g").attr("class", "x axis").attr("transform", "translate(0," + y.range()[0] + ")");
    svg.append("g").attr("class", "y axis");

    // this is our X axis label. Nothing too special to see here.
    svg.append("text")
        .attr("fill", "#414241")
        .attr("text-anchor", "end")
        .attr("x", width / 2)
        .attr("y", height - 35)
        .text("Time");


    // this is the actual definition of our x and y axes. The orientation refers to where the labels appear - for the x axis, below or above the line, and for the y axis, left or right of the line. Tick padding refers to how much space between the tick and the label. There are other parameters too - see https://github.com/mbostock/d3/wiki/SVG-Axes for more information
    //var xAxis = d3.svg.axis().scale(x).orient("bottom").tickPadding(2).ticks(5);
    var xDateAxis = d3.svg.axis().scale(x).orient("bottom").ticks(d3.time.hours, 8).tickSize(-height+margins.bottom);
    var yAxis = d3.svg.axis().scale(y).orient("left").tickPadding(2);

    // this is where we select the axis we created a few lines earlier. See how we select the axis item. in our svg we appended a g element with a x/y and axis class. To pull that back up, we do this svg select, then 'call' the appropriate axis object for rendering.    
    svg.selectAll("g.y.axis").call(yAxis);
    //svg.selectAll("g.x.axis").call(xAxis);
    svg.selectAll("g.x.axis").call(xDateAxis);

    // now, we can get down to the data part, and drawing stuff. We are telling D3 that all nodes (g elements with class node) will have data attached to them. The 'key' we use (to let D3 know the uniqueness of items) will be the name. Not usually a great key, but fine for this example.
    var dataNodes = svg.selectAll("g.node").data(killSeries, function (d) {
        return d.id;
    });

    // we 'enter' the data, making the SVG group (to contain a circle and text) with a class node. This corresponds with what we told the data it should be above.
    
    var dataGroup = dataNodes.enter().append("g").attr("class", "node")
    // this is how we set the position of the items. Translate is an incredibly useful function for rotating and positioning items 
    .attr('transform', function (d) {
        return "translate(" + x(d.createdOn) + "," + y(d.count) + ")";
    });

    // we add our first graphics element! A circle! 
    dataGroup.append("circle")
        .attr("r", 5)
        .attr("class", "dot")
        .style("fill", function (d) {
            // remember the ordinal scales? We use the colors scale to get a colour for our manufacturer. Now each node will be coloured
            // by who makes the chocolate. 
            return colors(d.killer);
    });

    // now we add some text, so we can see what each item is.
    dataGroup.append("text")
        .style("text-anchor", "middle")
        .attr("dy", -10)
        .text(function (d) {
            // this shouldn't be a surprising statement.
            return d.killer;
    });

  }
  
}]);
