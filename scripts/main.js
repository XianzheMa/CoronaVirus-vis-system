// TODO: difference between attr and style?

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
        master.level.data = master[name].cities;
    }
};

/**
 * get the count of the type in the region corresponding to the name.
 * date is determined by master.level.now
 * @param {string} name the name of the region
 * @param {string} type one of "confirmed", "cured", "suspected", "dead" and the rates of each one
 * @param {int} dateIndex defaults to master.date.now. Controls which date the count is at.
 * If dateIndex is out of available range [0, length - 1], then returns the startIndex/endIndex's value.
 */
master.utils.getCount = function(name, type, dateIndex = master.date.now){
    if(dateIndex < 0){
        dateIndex = 0;
    }
    else if(dateIndex > master.date.length - 1){
        dateIndex = master.date.length - 1;
    }
    return master.level.data[name].cases[dateIndex][type];
};

/**
 * normalize the name (replace unsupported chars) so that it can be used as class name
 */
master.utils.normalize = function(name){
    return name.replace(/ /g, '_').replace(/\//g, '_');
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

    master.date.init();

    // master.level decides which level of data to show
    master.level.changeLevel('China');
    master.map.init(data[0]);
    master.scatterplot.init();
    master.curvechart.init();
    master.control.init();
};


master.preprocess = function(data){
    let parseTime = d3.timeParse('%m-%d-%Y');
    let types = ['confirmed', 'cured', 'dead', 'suspected'];
    let formatCases = function(cases){
        for(let i = 0; i < cases.length; i ++){
            // parse time
            cases[i].time = parseTime(cases[i].time);
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