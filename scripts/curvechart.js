/**
 * the margin of #curvechart
 */
master.curvechart.margin = {
    top:70,
    bottom:30,
    left:70,
    right:70
};

/**
 * set up main title and several constants, which only need to be intialized once
 */
// master.curvechart.firstInitial=function(){
//     if(master.curvechart.firstInitial.hasOwnProperty('__DONE__')){
//         return;
//     }
//     master.curvechart.firstInitial.__DONE__ = true;
    
// }
/**
 * initialize curvechart (mainly set up its axes)
 */
master.curvechart.init = function(){
    'use strict';
    this.RADIUS = 2;
    this.EPSILON = 1e-8;
    this.type = 'confirmedRate';
    let curveSvg = d3.select("#curvechart");
    // clear previous children
    curveSvg.selectAll("*").remove();
    
    const boundingBox = curveSvg.node().getBoundingClientRect();
    let svgWidth = boundingBox.width;
    let svgHeight = boundingBox.height;
    // add main title
    d3.select('#curvechart')
        .append('text')
        .attr('text-anchor', 'middle')
        .attr('font-size', 30)
        .attr('font-family','Arial, Helvetica, sans-serif')
        .attr('transform', `translate(${boundingBox.width/2}, ${this.margin.top * 2/3})`)
        .text('Coronavirus Disease Visualization System');
    let startDate = master.date.dateArray[master.date.currentStart];
    let endDate = master.date.dateArray[master.date.currentEnd];
    let tickValues = master.date.dateArray.slice(master.date.currentStart, master.date.currentEnd + 1);
    this.xScale = d3.scaleTime()
        .domain([startDate, endDate])
        .range([0, svgWidth - this.margin.right - this.margin.left])
        .clamp(true);

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
    
    let yAxis = d3.axisLeft().scale(this.yScale);
    if(this.type.endsWith('Rate')){
        yAxis = yAxis.tickFormat(d3.format('.0%'));
    }
    curveSvg.append('g')
        .attr('id', 'curve-yAxis')
        .attr("transform", "translate(" + this.margin.left + "," + this.margin.top + ")")
        .call(yAxis);

    curveSvg.append('text')
        .attr('class', 'axisText')
        .attr('transform', `rotate(-90) translate(${-this.margin.top - this.yScale.range()[0]/2}, ${this.margin.left/2 - 10})`)
        .text(master.utils.readableType(this.type));
    // add a trokeGroup element easing the need to translate every element by the margin
    // and add group elements for each name in master.utils.selectedNames under it
    curveSvg.append('g')
        .attr('id', 'strokeGroup')
        .attr('transform', "translate(" + this.margin.left + "," + this.margin.top + ")")
        .selectAll('g')
        .data(Array.from(master.utils.selectedNames))
        .enter()
        .append('g')
        .attr('class', function(name){
            return name + ' curve';
        })
        .attr('opacity', 1)
        .on('mouseover', this.mouseOverEle)
        .on('mouseout', master.utils.mouseOut);


    this.setPointPositions();


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
 * this.pointPositions is a map, whose (key, value) pairs are (dateIndex, points).
 * points is an array whose elements are point positions on the chart [x, y], having the same position in the array
 * as the corresponding name has in master.utils.selectedNames.
 */
master.curvechart.setPointPositions = function(){
    this.pointPositions = new Map();
    let names = Array.from(master.utils.selectedNames);
    
    for(let dateIndex = master.date.currentStart - 1; dateIndex <= master.date.currentEnd + 1; dateIndex++){
        let points = {};
        for(const name of names){
            let rate = master.utils.getCount(name, this.type, dateIndex);
            points[name] = [this.xScaleByIndex(dateIndex), this.yScale(rate)];
        }
        // insert the key, value pair
        this.pointPositions.set(dateIndex, points);
    }
};


/**
 * extent each curve to one day more
 * @param {float} duration how long the transition will be
 * @param {number} crtdateIndex draw the period within [dateIndex - 1, dateIndex]
 */
master.curvechart.update = function(duration, crtdateIndex = master.date.now){

    let lineGen = d3.line()
        .curve(d3.curveCatmullRomOpen);
    
    d3.select('#strokeGroup')
        .selectAll('g') // select all group elements (corresponding to each name in master.utils.selectedNames)
        .each(function(name, nameIndex){
            d3.select(this)
                .append('path')
                .datum(function(){
                    // return the data points defining the curve path
                    let pathPoints = [];
                    let yesterDayCount = master.utils.getCount(name, master.curvechart.type, crtdateIndex - 1);
                    let todayCount = master.utils.getCount(name, master.curvechart.type, crtdateIndex);
                    if(Math.abs(yesterDayCount - todayCount) < master.curvechart.EPSILON){
                        // just draw a horizontal line
                        let prev_point = master.curvechart.pointPositions.get(crtdateIndex - 1)[name];
                        let now_point = master.curvechart.pointPositions.get(crtdateIndex)[name];
                        pathPoints = [prev_point, prev_point, now_point, now_point];
                    }
                    else{
                        for(let dateIndex = crtdateIndex - 2; dateIndex <= crtdateIndex + 1; dateIndex++){
                            pathPoints.push(master.curvechart.pointPositions.get(dateIndex)[name]);
                        }
                    }
                    return pathPoints;
                })
                .attr('id', 'curve' + crtdateIndex)
                .attr('d', lineGen)
                .datum(function(){ // after generating the path using lineGen, we can abandon the path data
                    return name;
                })
                // .attr('stroke', function(){
                //     return d3.schemeCategory10[nameIndex % 10];
                // })
                .transition()
                .duration(duration)
                .attrTween('stroke-dasharray', tweenDash)
                .attrTween('stroke', tweenStroke);
        });

    function tweenDash(){
        let l = this.getTotalLength();
        return d3.interpolateString('0 ' + l, l + ' ' + l);
    }

    function tweenStroke(){
        let name = d3.select(this).datum();
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
    let highlightedElement = d3.select(this);
    if(datum === null){
        // called by other mouseOver functions
        registerCall = false;
        datum = d3.select(this).datum();
    }
    // put this curve on the top
    highlightedElement.raise();
    // change other curves' opacity
    const that = this;
    d3.select('#curvechart')
        .selectAll('.curve')
        .filter(function(){
            if(this === that){
                return false;
            }
            return true;
        })
        .transition()
        .attr('opacity', master.DIM_OPACITY);
    if(registerCall){
        // first add the tooltip
        let mouseX = d3.mouse(document.getElementById('curvechart'))[0] - master.curvechart.margin.left;
        let xAxisInterval = master.curvechart.xScale.range()[1] / (master.date.currentEnd - master.date.currentStart);
        let dateId = Math.round(mouseX / xAxisInterval) + master.date.currentStart;
        let cx = master.curvechart.xScaleByIndex(dateId);
        let cy = master.curvechart.yScale(master.utils.getCount(datum, master.curvechart.type, dateId));
        let mark = d3.select('#strokeGroup')
            .append('circle')
            .attr('cx', cx)
            .attr('cy', cy)
            .attr('r', master.curvechart.RADIUS)
            .attr('fill', 'black');
        let textArray = [];
        textArray.push(datum);
        textArray.push('date: ' + master.utils.id2readableString(dateId));
        count = master.utils.getCount(datum, master.curvechart.type, dateId);
        if (master.curvechart.type.endsWith('Rate')){
            count = master.utils.decimalToPercent(count);
        }

        textArray.push(master.utils.readableType(master.curvechart.type) + ": ");
        textArray.push(count);
        if(master.curvechart.type.endsWith('Rate')){
            let baseType = master.curvechart.type.slice(0, -4);
            let countNow = master.utils.getCount(datum, baseType, dateId);
            let countBefore = dateId >0 ? master.utils.getCount(datum, baseType, dateId - 1) : 'unavailable';
            textArray.push(master.utils.readableType(baseType) + ': ' + countNow);
            textArray.push(master.utils.readableType(baseType) + ' before: ' + countBefore);
        }
        master.utils.tooltip(d3.select('#curvechart'), mark.node().getBoundingClientRect(), textArray);
        const targetClass = '.' + master.utils.normalize(datum);
        master.map.mouseOverEle.call(d3.select('#map').select(targetClass).node(), null);
        master.scatterplot.mouseOverEle.call(d3.select('#scatterplot').select(targetClass).node(), null);
    }
}