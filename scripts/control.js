
master.control.init = function(){
    this.IN_DURATION = 990;
    this.EX_DURATION = 1000;
    d3.select('#startTransition')
        .on('click', function(){
            this.disabled = true;
            master.control.beginTransition();
        });
};

/**
 * begin a new period of transition according to master.date.startDate and master.date.endDate
 */
master.control.beginTransition = function(){
    window.dataUpdatingInterval = window.setInterval(function(){
        master.control.update();
    }, this.EX_DURATION);
};

/**
 * update each chart
 */
master.control.update = function(){
    if(master.date.now < master.date.currentEnd){
        master.date.now = master.date.now + 1;
        master.map.update(this.IN_DURATION);
        master.scatterplot.update(this.IN_DURATION);
        master.curvechart.update(this.IN_DURATION);
    }
    else{
        document.getElementById('startTransition').disabled = false;
        window.clearInterval(window.dataUpdatingInterval);
    }
};