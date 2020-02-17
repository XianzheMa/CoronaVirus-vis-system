/**
 * the margin of the svg element #scatterplot
 */
master.scatterplot.margin = {
    top:30,
    bottom:30,
    left:30,
    right:30
};

master.scatterplot.setScale = function(){
    if(master.level.name === 'China'){
        let xDomain = master.map.range[this.xType];
        let yDomain = master.map.range[this.yType];
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
};


/**
 * a wrapper for messy code setting axes
 */
master.scatterplot.setAxes = function(scatterSvg){
    let xAxis = d3.axisBottom().scale(this.xScale);
    let yAxis = d3.axisLeft().scale(this.yScale);
    if(master.level.name === 'China'){
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
}


master.scatterplot.init = function(){
    "use strict";
    this.RADIUS = 8;
    this.xType = 'confirmed';
    this.yType = 'cured';
    let scatterSvg = d3.select("#scatterplot");
    const boundingBox = scatterSvg.node().getBoundingClientRect();
    this.svgWidth = boundingBox.width;
    this.svgHeight = boundingBox.height;
    this.setScale();
    this.setAxes(scatterSvg);
    
    scatterSvg.append('g')
        .attr('id', 'scatterPointGroup')
        .attr('transform', "translate(" + this.margin.left + "," + this.margin.top + ")")
        .selectAll('circle')
        .data(master.map.availableNames)
        .enter()
        .append('circle')
        .attr('opacity', 1)
        .attr('r', this.RADIUS)
        .attr('cx', function(name){
            let xCount = master.level.getCount(name, master.scatterplot.xType);
            return master.scatterplot.xScale(xCount);
        })
        .attr('cy', function(name){
            let yCount = master.level.getCount(name, master.scatterplot.yType);
            return master.scatterplot.yScale(yCount);
        })
        .attr('fill', function(name){
            let count = master.level.getCount(name, master.map.type);
            return master.map.colorScale(count);
        })
        .attr('class', function(name){
            return master.utils.normalize(name);
        })
        .style('stroke', 'black')
        .style('stroke-width', 0.75);
}

/**
 * move the points according to master.date.now
 * @param {float} duration duration of the transition, 0 means no transition
 */
master.scatterplot.update = function(duration){
    let points = d3.select('#scatterPointGroup')
        .selectAll('circle')
        .transition(duration)
        .attr('cx', function(name){
            let xCount = master.level.getCount(name, master.scatterplot.xType);
            return master.scatterplot.xScale(xCount);
        })
        .attr('cy', function(name){
            let yCount = master.level.getCount(name, master.scatterplot.yType);
            return master.scatterplot.yScale(yCount);
        })
        .attr('fill', function(name){
            let count = master.level.getCount(name, master.map.type);
            return master.map.colorScale(count);
        });
}