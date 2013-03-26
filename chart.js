var runModel = function(config) {

    var margin = {top: 20, right: 60, bottom: 30, left: 60};
    var width = config.width - margin.left - margin.right,
    height = config.height - margin.top - margin.bottom;




// run simulation from sst
dataObject = sst(config.hours, config.route, config.trains, config.randSeed);

// Waiting time data
var drawWaitData = function(dataObj) {

    // structure the data to be divided along direction and set the 'displayVals' (the data to be displayed in chart)
    var convertStationtoDirectionData = function(statData,dir,displayVals) {
        var arr = [];
        for (var i = 0, len = statData.length; i < len; i++) {
            arr[i] = statData[i][dir + 'Bound'];
            arr[i].displayVals = arr[i][displayVals];
        }
        arr.direction = dir + 'Bound';
        arr.desc = displayVals;
        return arr;
    };
    // convert data by direction
    leftBound = convertStationtoDirectionData(dataObj.stations, 'left','queueLength');
    rightBound = convertStationtoDirectionData(dataObj.stations, 'right','queueLength');


    var drawDirection = function(dirData) {
        var svg = d3.select('body').append('svg')
        .attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom)
        .append('g')
        .attr('transform', 'translate(' + margin.left + ',' + margin.top +')');

    //function to draw line
    var line = d3.svg.line()
    .x(function(d, i) {return xScale(new Date(2013, 2, 10, 5, 0, i));})
    .y(function(d, i) { return yScale(d);});

    //Axis and scale info
    var xScale = d3.time.scale()
    .range([0,width]);
    var yScale = d3.scale.linear()
    .range([height, 0]);

    var xAxis = d3.svg.axis()
    .scale(xScale)
    .orient('bottom');
    var yAxis = d3.svg.axis()
    .scale(yScale)
    .orient('left');


    color = d3.scale.category10(); // can handle 10 stations
    color.domain(d3.keys(dirData));

    var platforms = dirData;

    // pass one of the data values and return an array based on the length i
    xScale.domain(d3.extent(platforms[0].displayVals, function(d,i) { return new Date(2013, 2, 10, 5, 0, i);}));
    xScale.ticks(d3.time.hours, 1); // set the ticks

    // go through each direction and find the maximum value
    yScale.domain([
        d3.min(platforms, function(p) {return d3.min(p.displayVals);}),
        d3.max(platforms, function(p) {return d3.max(p.displayVals);})
        ]);

    svg.append('g')
    .attr('class', 'x axis')
    .attr('transform', 'translate(0,' + height + ')')
    .call(xAxis);

    svg.append('g')
    .attr('class', 'y axis')
    .call(yAxis)
    .append('text')
    .attr('transform', 'rotate(-90)')
    .attr('y', 6)
    .attr('dy','.71em')
    .attr('text-anchor', 'end')
    .text(platforms.desc + ' (' + platforms.direction + ')' );

    var waitTime = svg.selectAll('.waitTime')
    .data(platforms)
    .enter().append('g')
    .attr('class', 'waitTime');

    waitTime.append('path')
    .attr({
      'class': 'line',
      'd': function(d) {return line(d.displayVals);}
  })
    .style('stroke', function(d,i) {return color(i);});

    waitTime.append('text')
        .datum(function(d,i) {return {name: d.name, value: d.displayVals[d.displayVals.length - 1], index: new Date(2013, 2, 10, 5, 0, d.displayVals.length)};}) // convert length to time for proper positioning
        .attr({
            'transform': function(d) {return 'translate(' + xScale(d.index) + ',' + yScale(d.value) + ')';},
            'x': 3,
            'dy': '.35em'
        })
        .text(function(d,i) {return i;});
    };
    drawDirection(rightBound);
    drawDirection(leftBound);
};

// Train location/headway data

height2 = 200;
var trainSVG = d3.select('body').append('svg')
.attr('width', width + margin.left + margin.right)
.attr('height', height2 + margin.top / 2 + margin.bottom)
.append('g')
.attr('transform', 'translate(' + margin.left + ',' + margin.top / 2 +')');

var drawTrainData = function(dataObj) {

    //function to draw line
    var line = d3.svg.line()
    .x(function(d, i) {return xScale(new Date(2013, 2, 10, 5, 0, i));})
    .y(function(d, i) { return yScale(d);});

    //Axis and scale info
    var xScale = d3.time.scale()
    .range([0,width]);
    var yScale = d3.scale.linear()
    .range([height2, 0]);

    var xAxis = d3.svg.axis()
    .scale(xScale)
    .orient('bottom');
    var yAxis = d3.svg.axis()
    .scale(yScale)
    .orient('left');

    data = d3.map(dataObj.trains);
    color = d3.scale.category20();
    color.domain(d3.keys(data));


    var trainLocs = color.domain().map(function(name) {
        return {
            name: name,
            values: data[name].leftDist
        };
    });

    xScale.domain(d3.extent(trainLocs[0].values, function(d,i) { return new Date(2013, 2, 10, 5, 0, i);}));
    xScale.ticks(d3.time.hours, 1);

    // go through each direction and find the maximum value
    yScale.domain([
        d3.min(trainLocs, function(p) {return d3.min(p.values);}),
        d3.max(trainLocs, function(p) {return d3.max(p.values);})
        ]);

    trainSVG.append('g')
    .attr('class', 'x axis')
    .attr('transform', 'translate(0,' + height2 + ')')
    .call(xAxis);

    trainSVG.append('g')
    .attr('class', 'y axis')
    .call(yAxis)
    .append('text')
    .attr('transform', 'rotate(-90)')
    .attr('y', 6)
    .attr('dy','.71em')
    .attr('text-anchor', 'end')
    .text('Distance from Leftmost Track Location');

    var trainDist = trainSVG.selectAll('.trainDist')
    .data(trainLocs)
    .enter().append('g')
    .attr('class', 'trainDist');

    trainDist.append('path')
    .attr({
      'class': 'line',
      'd': function(d) {return line(d.values);}
  })
    .style('stroke', function(d) {return color(d.name);});

    trainDist.append('text')
        .datum(function(d,i) {return {name: d.name, value: d.values[d.values.length - 1], index: new Date(2013, 2, 10, 5, 0, d.values.length)};}) // convert length to time for proper positioning
        .attr({
            'transform': function(d) {return 'translate(' + xScale(d.index) + ',' + yScale(d.value) + ')';},
            'x': 3,
            'dy': '.35em'
        })
        .text(function(d) {return d.name;});
    };
    drawWaitData(dataObject);
    drawTrainData(dataObject);
}