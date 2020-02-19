/**
 * the margin of the svg element #map
 */
master.map.margin = {
    top:15,
    bottom:15,
    left:30,
    right:30
};

/**
 * set master.map.colorScale for coloring later
 */
master.map.setColorScale = function(){
    if(master.level.name === 'China'){
        // in this case we don't need to 'calculate' the best scale
        // because it has been well proposed
        // FIXME: use this color scale only when Hubei is included
        let colorThresholds = [1, 10, 100, 500, 1000, 10000];
        this.colorScale = d3.scaleThreshold()
            .domain(colorThresholds)
            .range(d3.schemeReds[colorThresholds.length + 1]);
    }
}

/**
 * set master.map.availableNames
 */
master.map.setAvailableNames = function(){
    this.availableNames = [];
    this.regions.each(function(d){
        if(d.available){
            master.map.availableNames.push(d.properties.name);
        }
    });
}

/**
 * a pipline for utility setup, including avaliableNames, range
 */
master.map.setUtilities = function(){
    this.setAvailableNames();
    this.setRange();
}
/**
 * set master.map.range, which is used by other charts
 */
master.map.setRange = function(){
    let currentStart = master.date.currentStart;
    let currentEnd = master.date.currentEnd;
    let getRange = function(type){
        let range = [0, 0];
        for(const name of master.map.availableNames){
            let localRange = d3.extent(master.level.data[name].cases.slice(currentStart, currentEnd + 1), function(eachCase){
                return eachCase[type];
            });
            range[0] = Math.min(range[0], localRange[0]);
            range[1] = Math.max(range[1], localRange[1]);
        }
        return range;
    }
    // set range for each type
    let origTypes = ['confirmed', 'suspected', 'cured', 'dead'];
    for(const type of origTypes.slice()){
        origTypes.push(type + 'Rate');
    }
    for(const type of origTypes){
        this.range[type] = getRange(type);
    }
}
/**
 * initialize a map on the svg element #map.
 * @param {object} geojson
 * the geojson data read by d3.json, also used to update master.map.geojson with.
 */
master.map.init = function(geojson){
    "use strict";
    this.type = 'confirmed';
    this.setColorScale();
    let mapSvg = d3.select("#map");
    // clear previous configured children
    mapSvg.selectAll("*").remove();
    const boundingBox = mapSvg.node().getBoundingClientRect();
    const AvailableWidth = boundingBox.width - this.margin.left - this.margin.right;
    const AvailableHeight = boundingBox.height - this.margin.top - this.margin.bottom;


    let projection = d3.geoMercator()
        .fitSize([AvailableWidth, AvailableHeight], geojson);
    let path = d3.geoPath()
        .projection(projection);
    
    let mapRegionGroup = mapSvg.append('g')
        .attr('id', 'mapRegionGroup');

    this.regions = mapRegionGroup.selectAll('path')
        .data(geojson.features)
        .enter()
        .append('path')
        .attr('d', path)
        .attr('class', function(d){
            return master.utils.normalize(d.properties.name);
        })
        .attr('opacity', 1)
        .datum(function(d){
            let name = d.properties.name;
            if(master.level.data.hasOwnProperty(name)){
                d.available = true;
            }
            else{
                d.available = false;
                console.log(name + ' does not exist in DXY data.');
            }
            return d;
        })
        .attr('fill', function(d){
            let name = d.properties.name;
            if(d.available){
                let count = master.utils.getCount(name, master.map.type);
                return master.map.colorScale(count);
            }
            else{
                return 'gray';
            }
        });
    
    // set utilities, used by other charts
    this.setUtilities();
};

/**
 * color the map according to the "caseType" of each region
 * @param {float} duration - the duration of transition
 * time is determined by master.date.now
 */
master.map.update = function(duration){
    this.regions
        .transition()
        .duration(duration)
        .attr('fill', function(d){
        let name = d.properties.name;
        if(d.available){
            let count = master.utils.getCount(name, master.map.type);
            return master.map.colorScale(count);
        }
        else{
            return 'gray';
        }
    });
}
