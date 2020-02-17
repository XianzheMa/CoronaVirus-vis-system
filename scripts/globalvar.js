
master = {}
master.getCount = function(){};

master.date = {};
master.date.length = null;
master.date.startDate = null;
master.date.endDate = null;
master.date.now = null;
master.date.currentStart = null;
master.date.currentEnd = null;

master.level = {};
master.level.name = null;
master.level.data = null;
master.level.changeLevel = function(){};
master.level.getCount = function(){};

master.utils = {};
master.utils.normalize = function(){};

master.control = {};
master.control.init = function(){};
master.control.beginTransition = function(){};
master.control.update = function(){};

master.map = {};
master.map.type = null;
master.map.margin = {};
master.map.init = function(){};
master.map.setColorScale = function(){};
master.map.update = function(){};
master.map.setAvailableNames = function(){};
master.map.setRange = function(){};
master.map.availableNames = [];
master.map.colorScale = null;
master.map.range = {};

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
