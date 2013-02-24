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
    data = getSimulationData(21).leftBound.waitTimes;
    xScale.domain(d3.extent(data, function(d,i) { return i;}));
    yScale.domain(d3.extent(data));


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

    svg.append('path')
        .datum(data)
        .attr('class', 'line')
        .attr('d', line);
}

drawData();