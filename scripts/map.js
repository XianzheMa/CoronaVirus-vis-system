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
 * initialize a map on the svg element #map.
 * @param {object} geojson
 * the geojson data read by d3.json, also used to update master.map.geojson with.
 */
master.map.init = function(){
    "use strict";
    let geojson = master.level.geojson;
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
                return 'lightgray';
            }
        });
     // set interaction
     this.setInteraction();
};

// ! should only be used as event handlers, since 'this' is not used traditionally.
master.map.mouseOverMapEle = function(datum){
    let name = datum.properties.name;
    let isSelected = master.utils.selectedNames.has(name);
    if(isSelected === false){
        // if it is not selected, no need to do anything special, except for those unavailable regions
        if(datum.available){
            return;
        }
    }
    let registerCall = true;
    if(datum === null){
        // called by other mouseOver functions
        registerCall = false;
        datum = d3.select(this).datum();
    }
    const bbox = this.getBoundingClientRect();
    const parentBbox = document.getElementById("map").getBoundingClientRect();
    let textArray = [];
    // name
    textArray.push(datum.properties.name);

    if(datum.available === true){
        textArray.push(master.utils.readableType(master.map.type) + ": " + master.utils.getCount(name, master.map.type));
    }
    else{
        textArray.push(master.utils.readableType(master.map.type) + ": unavailable");
    }
    master.utils.tooltip(d3.select('#map'), bbox, parentBbox, textArray);
    // change other regions' opacity
    const that = this;
    d3.select("#mapRegionGroup")
            .selectAll("path")
            .filter(function(d){
                if(this === that){
                    return false;
                }
                else if(d.available === false){
                    return false;
                }
                return true;
            })
            .transition()
            .attr("opacity", master.DIM_OPACITY);
    if(registerCall){
        // only when it is selected & available could it be linked to others
        if(datum.available){
            const targetClass = '.' + master.utils.normalize(name);
            master.scatterplot.mouseOverScatterEle.call(d3.select('#scatterplot').select(targetClass).node(), null);
        }
    }
}
master.map.setInteraction = function(){
    d3.select('#mapRegionGroup')
        .selectAll('path')
        .on('mouseover', this.mouseOverMapEle)
        .on('mouseout', master.utils.mouseOut)
        .on('click', mouseClick);
    
    function mouseClick(datum){
        if(datum.available === false){
            // it cannot be selected
            return;
        }
        let name = datum.properties.name;
        let selectedSet = master.utils.selectedNames;
        let isSelected = selectedSet.has(name);
        if(isSelected === true){
            // deselect it
            selectedSet.delete(name);
            d3.select(this)
                .transition()
                .attr('opacity', master.DIM_OPACITY);
            master.scatterplot.init();
            master.curvechart.init();
            master.utils.mouseOut();
            // light selected up
            const that = this;
            d3.select('#mapRegionGroup')
                .selectAll('path')
                .filter(function(d){
                    let name = d.properties.name;
                    if(selectedSet.has(name)){
                        return true;
                    }
                    return false;
                })
                .transition()
                .attr('opacity', 1);
        }
        else{
            // select it
            selectedSet.add(name);
            d3.select(this)
                .attr('opacity', 1);
            master.scatterplot.init();
            master.curvechart.init();
            // mouse over it
            master.map.mouseOverMapEle.call(this, datum);
        }
    }
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
            return 'lightgray';
        }
    });
}
