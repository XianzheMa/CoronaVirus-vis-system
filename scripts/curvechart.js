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
    this.RADIUS = 2;
    let curveSvg = d3.select("#curvechart");
    // clear previous children
    curveSvg.selectAll("*").remove();
    const boundingBox = curveSvg.node().getBoundingClientRect();
    let svgWidth = boundingBox.width;
    let svgHeight = boundingBox.height;

    let startDate = master.date.dateArray[master.date.currentStart];
    let endDate = master.date.dateArray[master.date.currentEnd];
    let tickValues = master.date.dateArray.slice(master.date.currentStart, master.date.currentEnd + 1);
    this.xScale = d3.scaleTime()
        .domain([startDate, endDate])
        .range([0, svgWidth - this.margin.right - this.margin.left])
        .clamp(true)
        .nice();

    let xAxisInterval = this.xScale.range()[1] / (master.date.currentEnd - master.date.currentStart);
    /**
     * input: dateIndex; output: it's position on x-axis
     */
    this.xScaleByIndex = function(dateIndex){
        return (dateIndex - master.date.currentStart) * xAxisInterval;
    }

    this.yScale = d3.scaleLinear()
        .domain(master.utils.getRange(this.type))
        .range([svgHeight - this.margin.top - this.margin.bottom, 0]);
    

    curveSvg.append('g')
        .attr('id', 'curve-xAxis')
        .attr('transform', 'translate(' + this.margin.left + "," + (svgHeight - this.margin.bottom) + ")")
        .call(d3.axisBottom().scale(this.xScale).tickValues(tickValues).tickFormat(d3.timeFormat('%b %d')));
    
    curveSvg.append('g')
        .attr('id', 'curve-yAxis')
        .attr("transform", "translate(" + this.margin.left + "," + this.margin.top + ")")
        .call(d3.axisLeft().scale(this.yScale));
    
    curveSvg.append('g')
        .attr('id', 'strokeGroup')
        .attr('transform', "translate(" + this.margin.left + "," + this.margin.top + ")");
    this.setPathsPoints();

    //this.addCurrentPoints();
    // set up curve pieces up to master.date.now
    for(let dateIndex = master.date.currentStart + 1; dateIndex <= master.date.now; dateIndex++){
        this.update(0, dateIndex);
    }

}

/**
 * add points according to master.date.now
 */
//master.curvechart.addCurrentPoints = function(){
    // d3.select('#strokeGroup')
    //     .append('g')
    //     .selectAll('circle')
    //     .data(Array.from(master.utils.selectedNames))
    //     .enter()
    //     .append('circle')
    //     .attr('class', function(name){
    //         return master.utils.normalize(name);
    //     })
    //     .datum(function(name){
    //         return {
    //             'name': name,
    //             'dateId': master.date.now
    //         };
    //     })
    //     .attr('cx', function(d){
    //         return master.curvechart.xScaleByIndex(d.dateId);
    //     })
    //     .attr('cy', function(d){
    //         return master.curvechart.yScale(master.utils.getCount(d.name, master.curvechart.type));
    //     })
    //     .attr('r', this.RADIUS)
    //     .attr('fill', function(d){
    //         return 'black';
    //     });
//};


/**
 * add a new entity on the chart
 */
master.curvechart.add = function(){
    // since adding a new entity on the chart involves (possibly) 
    // changing the scale, position of every curve piece, so for now
    // it's better to start froms scratch
    this.init();
}

/**
 * remove an entity on the chart
 */
master.curvechart.remove = function(){
    // since removing a new entity on the chart involves (possibly) 
    // changing the scale, position of every curve piece, so for now
    // it's better to start froms scratch
    this.init();
}


/**
 * this.pathsPoints is a map, whose (key, value) pairs are (dateIndex, points).
 * points is an array whose elements are point positions on the chart [x, y], having the same position in the array
 * as the corresponding name has in master.utils.selectedNames.
 */
master.curvechart.setPathsPoints = function(){
    this.pathsPoints = new Map();
    let names = Array.from(master.utils.selectedNames);
    
    for(let dateIndex = master.date.currentStart - 1; dateIndex <= master.date.currentEnd + 1; dateIndex++){
        let points = {};
        for(const name of names){
            let rate = master.utils.getCount(name, this.type, dateIndex);
            points[name] = [this.xScaleByIndex(dateIndex), this.yScale(rate)];
        }
        // insert the key, value pair
        this.pathsPoints.set(dateIndex, points);
    }
};


/**
 * extent each curve to one day more
 * @param {float} duration how long the transition will be
 * @param {number} crtdateIndex draw the period within [dateIndex - 1, dateIndex]
 */
master.curvechart.update = function(duration, crtdateIndex = master.date.now){
    let names = Array.from(master.utils.selectedNames);
    let dataArray = new Array(names.length);
    for(let nameIndex = 0; nameIndex < names.length; nameIndex++){
        let data = [];
        for(let dateIndex = crtdateIndex - 2; dateIndex <= crtdateIndex + 1; dateIndex++){
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
        .attr('class', function(d){
            return master.utils.normalize(d[0].name);
        })
        .transition()
        .on('end', master.curvechart.addCurrentPoints())
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

/**
 * mouseover callback function for curve piece on the plot
 *  This method should only be used as a callback, because "this" has a different meaning.
 *  Or, use function.call or function.apply to mock the event call.
 *  In this case, datum should be set as null to distinguish it from normal event calls
 */
master.curvechart.mouseOverEle = function(datum){
    let registerCall = true;
    if(datum === null){
        // called by other mouseOver functions
        registerCall = false;
        
    }
}