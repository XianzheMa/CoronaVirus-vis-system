// ! nearly deprecated
master = {}
master.DIM_OPACITY = null;


master.date = {};
master.date.init = function(){};
master.date.dateArray = [];
master.date.length = null;
master.date.startDate = null;
master.date.endDate = null;
master.date.now = null;
master.date.currentStart = null;
master.date.currentEnd = null;

master.level = {};
master.level.name = null;
master.level.data = {};
master.level.changeLevel = function(){};
master.level.geojson = null;

master.utils = {};
master.utils.normalize = function(){};
master.utils.getCount = function(){};
master.utils.parseTime = function(){};
master.utils.time2string = function(){};
master.utils.id2string = function(){};
master.utils.initSelectedNames = function(){};
master.utils.selectedNames = new Set();
master.utils.getRange = function(){};

master.control = {};
master.control.init = function(){};
master.control.beginTransition = function(){};
master.control.update = function(){};
master.control.setList = function(){};
master.control.changeVisibility = function(){};


master.map = {};
master.map.type = null;
master.map.margin = {};
master.map.init = function(){};
master.map.setColorScale = function(){};
master.map.update = function(){};
master.map.setInteraction = function(){};
master.map.colorScale = null;

master.scatterplot = {};
master.scatterplot.margin = {};
master.scatterplot.init = function(){};
master.scatterplot.setScale = function(){};
master.scatterplot.setAxes = function(){};
master.scatterplot.update = function(){};
master.scatterplot.xScale = null;
master.scatterplot.yScale = null;
master.scatterplot.xType = null;
master.scatterplot.yType = null;

master.curvechart = {};
master.curvechart.init = function(){};
master.curvechart.update = function(){};
master.curvechart.type = null;
master.curvechart.xScale = null;
master.curvechart.yScale = null;