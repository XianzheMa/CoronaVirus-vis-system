
/**
 * set up master.level accroding to name
 * @param {string} name the current name of this level
 */
master.level.changeLevel = function(name){
    master.level.name = name;
    if(name === 'China'){
        master.level.data = master.data;
    }
    else{
        master.level.data = master.data[name].cities;
    }
};


master.date.init = function(){
    this.length = master.data['Hubei'].cases.length;
    
    this.dateArray = [];
    for(let i = 0; i < master.date.length; i++){
        this.dateArray.push(master.data['Hubei'].cases[i].time);
    }
    this.currentStart = 0;
    this.currentEnd = master.date.length - 1;
    // master.date.now should be within [currentStart, currentEnd]. It facilitates other widgets getting the correct time
    this.now = master.date.currentStart;
};


master.main = function(error, data){
    "use strict";
    if(error) throw error;
    // data[0] is china.geo.gson, data[1] is DXYArea_short.csv
    master.preprocess(data[1]);
    master.data = data[1];
    master.level.geojson = data[0];
    master.date.init();
    master.DIM_OPACITY = 0.1;
    // master.level decides which level of data to show
    master.level.changeLevel('China');
    master.map.init();
    master.utils.setSelectedNames();
    master.utils.setRange();
    master.scatterplot.init();
    master.curvechart.init();
    master.control.init();
};

/**
 * In two cases this method gets called:
 * 1. The user reselects regions.
 * 2. The user resets time period.
 */
master.reset = function(){
    // set now to currentStart
    master.date.now = master.date.currentStart;
    d3.select('#now')
        .html(master.utils.id2string(master.date.now));
    master.utils.setRange();
    master.map.init();
    master.scatterplot.init();
    master.curvechart.init();
    // no need to reset control
}

master.preprocess = function(data){
    let types = ['confirmed', 'cured', 'dead', 'suspected'];
    let formatCases = function(cases){
        for(let i = 0; i < cases.length; i ++){
            // parse time
            cases[i].time = master.utils.parseTime(cases[i].time);
            // add rate for each type
            for(let type of types){
                let newProperty = type + 'Rate';
                if(i === 0){
                    // first one. rates are set to 0
                    cases[i][newProperty] = 0;
                }
                else{
                    if(cases[i - 1][type] === 0){
                        // the count at previous date is 0. Set rate at this date 0 too.
                        cases[i][newProperty] = 0;
                    }
                    else{
                        cases[i][newProperty] = (cases[i][type] - cases[i - 1][type]) / cases[i - 1][type];
                    }
                }
            }
        }
    }
    for(let province in data){
        // exclude properties inherited from its prototype
        if(data.hasOwnProperty(province)){
            formatCases(data[province].cases);

            let cities = data[province].cities;
            for(let city in cities){
                if(cities.hasOwnProperty(city)){
                    formatCases(cities[city].cases);
                }
            }
        }
    }
};

d3.queue(1)
    .defer(d3.json, "./data/geojson/China.geo.json")
    .defer(d3.json, "./data/DXYArea_short.json")
    .awaitAll(master.main);