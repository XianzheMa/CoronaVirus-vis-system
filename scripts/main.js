// TODO: difference between attr and style?

d3.queue(1)
    .defer(d3.json, "./data/geojson/China.geo.json")
    .defer(d3.json, "./data/DXYArea_short.json")
    .awaitAll(preprocess);

function preprocess(error, data){
    "use strict";
    if(error) throw error;
    // data[0] is china.geo.gson, data[1] is DXYArea_short.csv
    master.data = data[1];

    // get its start date and end date
    master.date = {};
    master.date.length = data[1]['Hubei']['cases'].length;
    master.date.startDate = data[1]['Hubei']['cases'][0]['time'];
    master.date.endDate = data[1]['Hubei']['cases'][master.date.length - 1]['time'];

    // master.province decides which level of data to show, null means the whole country
    master.province = null;
    master.map.drawMap(data[0]);

}