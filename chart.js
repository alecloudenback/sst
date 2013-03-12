var margin = {top: 20, right: 60, bottom: 30, left: 60};
var width = 19000 - margin.left - margin.right,
    height = 500 - margin.top - margin.bottom;

var svg = d3.select('body').append('svg')
    .attr('width', width + margin.left + margin.right)
    .attr('height', height + margin.top + margin.bottom)
    .append('g')
        .attr('transform', 'translate(' + margin.left + ',' + margin.top +')');



// run simulation from sst
hours = 200; // how many hours should the model run?
dataObject = getSimulationData(hours);

// Waiting time data
function drawWaitData(dataObj) {
    //function to draw line
    var line = d3.svg.line()
                    .x(function(d, i) {return xScale(new Date(2013, 2, 10, 5, 0, i));})
                    .y(function(d, i) { return yScale(d)});

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

    data = d3.map(dataObj.directions);

    color = d3.scale.category10();
    color.domain(d3.keys(data));

    var waitTimes = color.domain().map(function(name) {
        return {
            name: name,
            values: data[name].queueLength,
        }
    })

    xScale.domain(d3.extent(waitTimes[0].values, function(d,i) { return new Date(2013, 2, 10, 5, 0, i);}));
    xScale.ticks(d3.time.hours, 1);
    // go through each direction and find the maximum value
    yScale.domain([
        d3.min(waitTimes, function(p) {return d3.min(p.values)}),
        d3.max(waitTimes, function(p) {return d3.max(p.values)})
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
            .text('Total Delay');

    var waitTime = svg.selectAll('.waitTime')
                        .data(waitTimes)
                        .enter().append('g')
                        .attr('class', 'waitTime');

    waitTime.append('path')
        .attr({
          'class': 'line',
          'd': function(d) {return line(d.values)},
        })
        .style('stroke', function(d) {return color(d.name);});

    waitTime.append('text')
        .datum(function(d,i) {return {name: d.name, value: d.values[d.values.length - 1], index: new Date(2013, 2, 10, 5, 0, d.values.length)};}) // convert length to time for proper positioning
        .attr({
            'transform': function(d) {return 'translate(' + xScale(d.index) + ',' + yScale(d.value) + ')'},
            'x': 3,
            'dy': '.35em',
        })
        .text(function(d) {return d.name;});
}

// Train location/headway data

height2 = 200;
var trainSVG = d3.select('body').append('svg')
    .attr('width', width + margin.left + margin.right)
    .attr('height', height2 + margin.top / 2 + margin.bottom / 2)
    .append('g')
        .attr('transform', 'translate(' + margin.left + ',' + margin.top / 2 +')');

function drawTrainData(dataObj) {

    //function to draw line
    var line = d3.svg.line()
                    .x(function(d, i) {return xScale(new Date(2013, 2, 10, 5, 0, i));})
                    .y(function(d, i) { return yScale(d)});

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
            values: data[name].leftDist,
        }
    })
    xScale.domain(d3.extent(trainLocs[0].values, function(d,i) { return new Date(2013, 2, 10, 5, 0, i);}));
    xScale.ticks(d3.time.hours, 1);

    // go through each direction and find the maximum value
    yScale.domain([
        d3.min(trainLocs, function(p) {return d3.min(p.values)}),
        d3.max(trainLocs, function(p) {return d3.max(p.values)})
        ]);

    trainSVG.append('g')
        .attr('class', 'x axis')
        .attr('transform', 'translate(0,' + height + ')')
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
          'd': function(d) {return line(d.values)},
        })
        .style('stroke', function(d) {return color(d.name);});

    trainDist.append('text')
        .datum(function(d,i) {return {name: d.name, value: d.values[d.values.length - 1], index: new Date(2013, 2, 10, 5, 0, d.values.length)};}) // convert length to time for proper positioning
        .attr({
            'transform': function(d) {return 'translate(' + xScale(d.index) + ',' + yScale(d.value) + ')'},
            'x': 3,
            'dy': '.35em',
        })
        .text(function(d) {return d.name;});
}
drawWaitData(dataObject);
drawTrainData(dataObject);