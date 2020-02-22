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
    if(master.utils.selectedNames.has('Hubei') || master.utils.selectedNames.has('Wuhan')){
        // in this case we don't need to 'calculate' the best scale
        // because it has been well proposed
        let colorThresholds = [1, 10, 100, 500, 1000, 10000];
        this.colorScale = d3.scaleThreshold()
        .domain(colorThresholds)
        .range(d3.schemeReds[colorThresholds.length + 1]);
    }
    else{
        // for other cases, just use a linear color scale
        // first get the range
        let initialColor = d3.interpolateReds(0.1);
        let endColor = d3.interpolateReds(1);
        let interpolator = d3.interpolateRgb(initialColor, endColor);
        this.colorScale = d3.scaleSequential(interpolator)
            .domain(master.utils.getRange(this.type, 0, master.date.length - 1));
    }
}

/**
 * set up those marks, constants, etc.
 * 
 * only be executed once.
 */
master.map.firstInitial = function(){
    if(master.map.firstInitial.hasOwnProperty('__DONE__')){
        return;
    }
    master.map.firstInitial.__DONE__ = true;
    this.CLICK_DELAY = 400;
    this.PREVENT = false;
}
/**
 * initialize a map on the svg element #map.
 * gets called on startup or when the map is changed.
 * It would use master.level.geojson to create the map
 */
master.map.init = function(){
    "use strict";
    this.firstInitial();
    let geojson = master.level.geojson;
    this.type = 'confirmed';
    let mapSvg = d3.select("#map");
    // clear previous configured children
    mapSvg.selectAll("*").remove();
    // clear previous selected names
    master.utils.selectedNames.clear();
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
                // when a map is changed, all available names are selected
                // so we add it to master.utils.selectedNames
                master.utils.selectedNames.add(name);
            }
            else{
                d.available = false;
                console.log(name + ' does not exist in DXY data.');
            }
            return d;
        });
    // now selectednames has been set up, we could set up color scale.
    this.setColorScale();
    // color it
    this.update(0);
    // set interaction
    this.setInteraction();
};

// ! should only be used as event handlers, since 'this' is not used traditionally.
master.map.mouseOverEle = function(datum){
    let registerCall = true;
    if(datum === null){
        // called by other mouseOver functions
        registerCall = false;
        datum = d3.select(this).datum();
    }
    let name = datum.properties.name;
    let isSelected = master.utils.selectedNames.has(name);
    if(isSelected === false){
        // if it is not selected, no need to do anything special, except for those unavailable regions
        if(datum.available){
            return;
        }
    }
    const bbox = this.getBoundingClientRect();
    let textArray = [];
    // name
    textArray.push(datum.properties.name);

    if(datum.available === true){
        textArray.push(master.utils.readableType(master.map.type) + ": " + master.utils.getCount(name, master.map.type));
    }
    else{
        textArray.push(master.utils.readableType(master.map.type) + ": unavailable");
    }
    master.utils.tooltip(d3.select('#map'), bbox, textArray);
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
    // change this region's opacity
    d3.select(this)
        .transition()
        .attr('opacity', 1);
    if(registerCall && datum.available){
        // only when it is selected & available could it be linked to others
        const targetClass = '.' + master.utils.normalize(name);
        master.scatterplot.mouseOverEle.call(d3.select('#scatterplot').select(targetClass).node(), null);
        master.curvechart.mouseOverEle.call(d3.select('#curvechart').select(targetClass).node(), null);
    }
}

master.map.setInteraction = function(){
    d3.select('#mapRegionGroup')
        .selectAll('path')
        .on('mouseover', this.mouseOverEle)
        .on('mouseout', master.utils.mouseOut)
        .on('click', clickHandle)
        .on('dblclick', dblclick);
    
    function clickHandle(datum){
        const that = this;
        master.map.timer = setTimeout(function(){
            if(master.map.PREVENT === false){
                click.call(that, datum);
            }
            master.map.PREVENT = false;
            
        }, master.map.CLICK_DELAY);
    }

    function click(datum){
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
            // remove this entity in other two charts
            master.scatterplot.remove(name);
            master.curvechart.remove(name);
            // deleting it essentially means the mouse "moves out of" it.
            master.utils.mouseOut();
            // dim this region's opacity
            d3.select(this)
                .transition()
                .attr('opacity', master.DIM_OPACITY);
        }
        else{
            // select it
            selectedSet.add(name);
            // add this entity in other two charts
            master.scatterplot.add(name);
            master.curvechart.add(name);
            // mouse over it
            master.map.mouseOverEle.call(this, datum);
        }
    }

    function dblclick(datum){
        clearTimeout(master.map.timer);
        master.map.PREVENT = true;
        if(datum.available === false){
            // cannot zoom in on unavailable regions
            return;
        }
        let name = datum.properties.name;
        d3.json('./data/geojson/' + name + '.geo.json', function(error, geojson){
            if(error) throw error;
            master.level.geojson = geojson;
            master.level.changeLevel(name);
            master.map.init();
            master.scatterplot.init();
            master.curvechart.init();
        });
    }
};
/**
 * color the map according to the "caseType" of each region
 * @param {float} duration - the duration of transition
 * time is determined by master.date.now.
 * 
 * also used for immediate color set up by passing 0 as duration
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
