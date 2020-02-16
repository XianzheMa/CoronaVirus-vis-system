// master is the global object for this project
let master = {};
d3.queue(1)
    .defer(d3.json, "./json/name/provNameTrans.json")
    .defer(d3.csv, )