/**
 * the margin of the svg element #map
 */
master.map.margin = {
    top:30,
    bottom:30,
    left:30,
    right:30
};

/**
 * set up master.map.colorScale for coloring later
 * @param {string} caseType should be one of 'confirmed', 'suspected', 'dead' and 'cured'
 */
master.map.setUpColorScale = function(caseType){
    if(master.province == null){
        // in this case we don't need to 'calculate' the best scale
        // because it has been well proposed
        let colorThresholds = [1, 10, 100, 500, 1000, 10000];
        master.map.colorScale = d3.scaleThreshold()
            .domain(colorThresholds)
            .range(d3.schemeReds[colorThresholds.length + 1]);
    }
}

/**
 * set up master.map.localData for convenient reference later
 * according to master.province
 */
master.map.setUpLocalData = function(){
    if(master.province == null){
        // country level
        master.map.localData = master.data;
    }
    else{
        // province level
        master.map.localData = master.data[master.province]['cities'];
    }
}

/**
 * Draw a map on the svg element #map.
 * @param {object} geojson - 
 * the geojson data read by d3.json, also used to update master.map.geojson with.
 */
master.map.drawMap = function(geojson){
    "use strict";
    master.map.setUpLocalData();
    master.map.setUpColorScale();
    let mapSvg = d3.select("#map");
    const boundingBox = mapSvg.node().getBoundingClientRect();
    const svgWidth = boundingBox.width;
    const svgHeight = boundingBox.height;


    let projection = d3.geoMercator()
        .fitSize([svgWidth, svgHeight], geojson);
    let path = d3.geoPath()
        .projection(projection);
    
    let mapRegionGroup = mapSvg.append('g')
        .attr('id', 'mapRegionGroup');

    mapRegionGroup.selectAll('path')
        .data(geojson.features)
        .enter()
        .append('path')
        .attr('d', path)
        .attr('opacity', 1);
    
};

/**
 * color the map accordint to confirmed cases of each region
 * @param {boolean} transition - controls whether a transition is rendered
 * @param {string} time - of format "month-day-year"
 */
master.map.colorMap = function(transition, time){
    let regions = d3.select('#mapRegionGroup')
        .selectAll('path');
    
}