var margin = {top: 20, right: 20, bottom: 30, left: 50};
var width = 960 - margin.left - margin.right,
    height = 500 - margin.top - margin.bottom;

var svg = d3.select('body').append('svg')
    .attr('width', width + margin.left + margin.right)
    .attr('height', height + margin.top + margin.bottom)
    .append('g')
        .attr('transform', 'translate(' + margin.left + ',' + margin.top +')');

var xScale = d3.scale.linear()
                .range([0,width]);
var yScale = d3.scale.linear()
                .range([height, 0]);

var color = d3.scale.category10();

var xAxis = d3.svg.axis()
                .scale(xScale)
                .orient('bottom');
var yAxis = d3.svg.axis()
                .scale(yScale)
                .orient('left');

var line = d3.svg.line()
                .x(function(d, i) {return xScale(i);})
                .y(function(d, i) { return yScale(d)});

function drawData() {
    // get data from sst
    data = d3.map(getSimulationData(1));

    color.domain(d3.keys(data));

    var waitTimes = color.domain().map(function(name) {
        return {
            name: name,
            values: data[name].waitTimes,
        }
    })


    xScale.domain(d3.extent(waitTimes[0].values, function(d,i) { return i;}));

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
            .text('Avg. Delay');

    var waitTime = svg.selectAll('.waitTime')
                        .data(waitTimes)
                        .enter().append('g')
                        .attr('class', 'waitTime');

    pathDesc = function(d) {return line(d.values)};

    waitTime.append('path')
        .attr({
          'class': 'line',
          'd': pathDesc,
        })
        .style('stroke', function(d) {return color(d.name);});
}

drawData();