/**
 * the margin of the svg element #scatterplot
 */
master.scatterplot.margin = {
    top:30,
    bottom:40,
    left:60,
    right:60
};

master.scatterplot.setScale = function(){
    if(master.utils.selectedNames.has('Hubei') || master.utils.selectedNames.has('Wuhan')){
        let xDomain = master.utils.getRange(this.xType);
        let yDomain = master.utils.getRange(this.yType);
        xDomain[0] = 1; yDomain[0] = 1;
        this.xScale = d3.scaleLog()
            .domain(xDomain)
            .range([0, this.svgWidth - this.margin.left - this.margin.right])
            .base(10)
            .clamp(true)
            .nice();
        this.yScale = d3.scaleLog()
            .domain(yDomain)
            .range([this.svgHeight - this.margin.top - this.margin.bottom, 0])
            .clamp(true)
            .base(10)
            .nice();
    }
    else{
        // use linear scale
        let xDomain = master.utils.getRange(this.xType);
        let yDomain = master.utils.getRange(this.yType);
        this.xScale = d3.scaleLinear()
            .domain(xDomain)
            .range([0, this.svgWidth - this.margin.left - this.margin.right])
            .nice();
        this.yScale = d3.scaleLinear()
            .domain(yDomain)
            .range([this.svgHeight - this.margin.top - this.margin.bottom, 0])
            .nice();
    }
};


/**
 * a wrapper for messy code setting axes
 */
master.scatterplot.setAxes = function(scatterSvg){
    let xAxis = d3.axisBottom().scale(this.xScale);
    let yAxis = d3.axisLeft().scale(this.yScale);
    if(master.utils.selectedNames.has('Hubei') || master.utils.selectedNames.has('Wuhan')){
        let xDomain = this.xScale.domain();
        let yDomain = this.yScale.domain();
        xAxis.ticks(Math.ceil(Math.log10(xDomain[1])), '.0s');
        yAxis.ticks(Math.ceil(Math.log10(yDomain[1])), '.0s');
    }
    
    scatterSvg.append('g')
        .attr('id', 'scatter-xAxis')
        .attr('transform', 'translate(' + this.margin.left + "," + (this.svgHeight - this.margin.bottom) + ")")
        .call(xAxis);
    
        
    scatterSvg.append('g')
        .attr('id', 'scatter-yAxis')
        .attr("transform", "translate(" + this.margin.left + "," + this.margin.top + ")")
        .call(yAxis);
    
    scatterSvg.append('text')
        .attr('class', 'axisText')
        .attr('transform', `translate(${this.margin.left + this.xScale.range()[1]/2},
             ${this.margin.top + this.yScale.range()[0] + 30})`)
        .text(master.utils.readableType(this.xType));

    scatterSvg.append('text')
        .attr('class', 'axisText')
        .attr('transform', `rotate(-90) translate(${-this.margin.top - this.yScale.range()[0]/2},
            ${this.margin.left/2})`)
        .text(master.utils.readableType(this.yType));
    if(master.utils.selectedNames.has('Hubei') || master.utils.selectedNames.has('Wuhan')){
        d3.select('#scatter-xAxis')
        .select('.tick')
        .select('text')
        .text('<=1');

        d3.select('#scatter-yAxis')
        .select('.tick')
        .select('text')
        .text('<=1');
    }    
}


master.scatterplot.init = function(){
    "use strict";
    this.RADIUS = 8;
    this.xType = 'confirmed';
    this.yType = 'cured';
    let scatterSvg = d3.select("#scatterplot");
    // clear previous children
    scatterSvg.selectAll("*").remove();
    const boundingBox = scatterSvg.node().getBoundingClientRect();
    this.svgWidth = boundingBox.width;
    this.svgHeight = boundingBox.height;
    this.setScale();
    this.setAxes(scatterSvg);
    scatterSvg.append('g')
        .attr('id', 'scatterPointGroup')
        .attr('transform', "translate(" + this.margin.left + "," + this.margin.top + ")")
        .selectAll('circle')
        .data(Array.from(master.utils.selectedNames))
        .enter()
        .append('circle')
        .attr('opacity', 1)
        .attr('r', this.RADIUS)
        .attr('cx', function(name){
            let xCount = master.utils.getCount(name, master.scatterplot.xType);
            return master.scatterplot.xScale(xCount);
        })
        .attr('cy', function(name){
            let yCount = master.utils.getCount(name, master.scatterplot.yType);
            return master.scatterplot.yScale(yCount);
        })
        .attr('fill', function(name, nameIndex){
            let count = master.utils.getCount(name, master.map.type);
            return master.map.colorScale(count);
        })
        .attr('class', function(name){
            return master.utils.normalize(name);
        })
        .style('stroke', 'black')
        .style('stroke-width', 0.75)
        .on('mouseover', this.mouseOverEle)
        .on('mouseout', master.utils.mouseOut);
    
}

/**
 * ! this method should only be used as an event handler, because the meaning of this is different
 */
master.scatterplot.mouseOverEle = function(name){
    let registerCall = true;
    if(name === null){
        // called by other mouseOver functions
        registerCall = false;
        name = d3.select(this).datum();
    }
    // put this circle on the top
    d3.select(this).raise();
    const bbox = this.getBoundingClientRect();
    let textArray = [];
    textArray.push(name);
    textArray.push(master.utils.readableType(master.scatterplot.xType) + ": " + master.utils.getCount(name, master.scatterplot.xType));
    textArray.push(master.utils.readableType(master.scatterplot.yType) + ": " + master.utils.getCount(name, master.scatterplot.yType));
    master.utils.tooltip(d3.select('#scatterplot'), bbox, textArray);
    // change other circles' opacity
    const that = this;
    d3.select('#scatterPointGroup')
        .selectAll('circle')
        .filter(function(){
            if(this === that){
                return false;
            }
            return true;
        })
        .transition()
        .attr('opacity', master.DIM_OPACITY);
    if(registerCall){
        const targetClass = '.' + master.utils.normalize(name);
        master.map.mouseOverEle.call(d3.select('#map').select(targetClass).node(), null);
        master.curvechart.mouseOverEle.call(d3.select('#curvechart').select(targetClass).node(), null);
    }
};


/**
 * move the points according to master.date.now
 * @param {float} duration duration of the transition, 0 means no transition
 */
master.scatterplot.update = function(duration){
    d3.select('#scatterPointGroup')
        .selectAll('circle')
        .transition()
        .duration(duration)
        .attr('cx', function(name){
            let xCount = master.utils.getCount(name, master.scatterplot.xType);
            return master.scatterplot.xScale(xCount);
        })
        .attr('cy', function(name){
            let yCount = master.utils.getCount(name, master.scatterplot.yType);
            return master.scatterplot.yScale(yCount);
        })
        .attr('fill', function(name){
            let count = master.utils.getCount(name, master.map.type);
            return master.map.colorScale(count);
        });
};

master.scatterplot.add = function(){
    this.init();
};

master.scatterplot.remove = function(){
    this.init();
};