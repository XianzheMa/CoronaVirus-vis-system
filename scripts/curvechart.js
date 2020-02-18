/**
 * the margin of #curvechart
 */
master.curvechart.margin = {
    top:30,
    bottom:30,
    left:30,
    right:30
};

/**
 * initialize curvechart (mainly set up its axes)
 */
master.curvechart.init = function(){
    'use strict';
    this.type = 'confirmedRate';
    let curveSvg = d3.select("#curvechart");
    const boundingBox = curveSvg.node().getBoundingClientRect();
    let svgWidth = boundingBox.width;
    let svgHeight = boundingBox.height;

    let startDate = master.date.dateArray[master.date.currentStart];
    let endDate = master.date.dateArray[master.date.currentEnd];
    this.xScale = d3.scaleTime()
        .domain([startDate, endDate])
        .range([0, svgWidth - this.margin.right - this.margin.left])
        .clamp(true)
        .nice();
    this.yScale = d3.scaleLinear()
        .domain(master.map.range[this.type])
        .range([svgHeight - this.margin.top - this.margin.bottom, 0]);
    
    curveSvg.append('g')
        .attr('id', 'curve-xAxis')
        .attr('transform', 'translate(' + this.margin.left + "," + (svgHeight - this.margin.bottom) + ")")
        .call(d3.axisBottom().scale(this.xScale).tickFormat(d3.timeFormat('%b %d')));
    
    curveSvg.append('g')
        .attr('id', 'curve-yAxis')
        .attr("transform", "translate(" + this.margin.left + "," + this.margin.top + ")")
        .call(d3.axisLeft().scale(this.yScale));
    
    curveSvg.append('g')
        .attr('id', 'strokeGroup')
        .attr('transform', "translate(" + this.margin.left + "," + this.margin.top + ")");
    // set up initial points
    // TODO: do it later
    this.setPathsPoints();
    // let points = [[0, 0], [100, 200], [400, 400], [400, 800]];
    // d3.select('#strokeGroup')
    //     .append('path')
    //     .datum(points)
    //     //.attr('stroke', 'steelblue')
    //     // .attr('fill', 'none')
    //     // .attr('stroke-width', '2px')
    //     .attr('d', d3.line().curve(d3.curveCatmullRomOpen))
    //     .transition()
    //     .attrTween('stroke-dasharray', tweenDash);

    // function tweenDash(){
    //     let l = this.getTotalLength();
    //     return d3.interpolateString('0 ' + l, l + ' ' + l);
    // }
}

/**
 * this.pathsPoints is a map, whose (key, value) pairs are (dateIndex, points).
 * points is an array whose elements are point positions on the chart [x, y], having the same position in the array
 * as the corresponding name has in master.map.availableNames.
 */
master.curvechart.setPathsPoints = function(){
    this.pathsPoints = new Map();
    let names = master.map.availableNames;
    let xAxisInterval = this.xScale.range()[1] / (master.date.currentEnd - master.date.currentStart);
    let xScaleByIndex = function(dateIndex){
        return (dateIndex - master.date.currentStart) * xAxisInterval;
    }
    for(let dateIndex = master.date.currentStart - 1; dateIndex <= master.date.currentEnd + 1; dateIndex++){
        let points = {};
        for(const name of names){
            let rate = master.utils.getCount(name, this.type, dateIndex);
            points[name] = [xScaleByIndex(dateIndex), this.yScale(rate)];
        }
        // insert the key, value pair
        this.pathsPoints.set(dateIndex, points);
    }
};


/**
 * extent each curve to one day more
 * @param {float} duration how long the transition will be
 */
master.curvechart.update = function(duration){
    'use strict';
    let names = master.map.availableNames;
    let dataArray = new Array(names.length);
    for(let nameIndex = 0; nameIndex < names.length; nameIndex++){
        let data = [];
        for(let dateIndex = master.date.now - 2; dateIndex <= master.date.now + 1; dateIndex++){
            let point = this.pathsPoints.get(dateIndex)[names[nameIndex]];
            data.push({
                'name': names[nameIndex],
                'point': point
            });
        }
        dataArray[nameIndex] = data;
    }

    let lineGen = d3.line()
        .curve(d3.curveCatmullRomOpen)
        .x(function(d){
            return d.point[0];
        })
        .y(function(d){
            return d.point[1];
        });

    d3.select('#strokeGroup')
        .append('g')
        .selectAll('path')
        .data(dataArray)
        .enter()
        .append('path')
        .attr('d', lineGen)
        .transition()
        .duration(duration)
        .attrTween('stroke-dasharray', tweenDash)
        .attrTween('stroke', tweenStroke);

    function tweenDash(){
        let l = this.getTotalLength();
        return d3.interpolateString('0 ' + l, l + ' ' + l);
    }

    function tweenStroke(){
        // note that each datum bound to it is an array of length 4.
        // Each element is an object with properties: name, point
        let name = d3.select(this).datum()[0].name;
        let now = master.date.now;
        let colorScale = master.map.colorScale;
        let yesterdayCount = master.utils.getCount(name, master.map.type, now - 1);
        let nowCount = master.utils.getCount(name, master.map.type, now);
        return d3.interpolateRgb(colorScale(yesterdayCount), colorScale(nowCount));
    }
};