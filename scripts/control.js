
master.control.init = function(){
    this.IN_DURATION = 990;
    this.EX_DURATION = 1000;
    d3.select('#startTransition')
        .on('click', function(){
            this.disabled = true;
            master.control.beginTransition();
        });
    d3.select('#now')
        .html(master.utils.id2string(master.date.now));
    this.setList();
    
};

master.control.setList = function(){
    // add options to two dropdown lists
    let startList = d3.select("#startDate");
    let endList = d3.select('#endDate');
    startList.attr('onchange', 'master.control.changeList(1)');
    endList.attr('onchange', 'master.control.changeList(2)');
    for(let dateIndex = 0; dateIndex < master.date.length; dateIndex++){
        let dateString = master.utils.id2string(dateIndex);
        let startOption = startList.append('option')
            .attr('value', dateIndex)
            .attr('id', 'start' + dateString)
            .html(dateString);
        
        let endOption = endList.append('option')
            .attr('value', dateIndex)
            .attr('id', 'end' + dateString)
            .html(dateString);
        // set default value and disable end value
        if(dateIndex ==  0){
            startOption.node().selected = true;
            endOption.node().disabled = true;
        }
        if(dateIndex ==  master.date.length - 1){
            endOption.node().selected = true;
            startOption.node().disabled = true;
        }
    }
};

master.control.changeList = function(symbol){
    // symbol: 1 means startDate and 2 means endDate
    if(symbol === 1){
        let selectedDateId = document.getElementById('startDate').value;
        for(dateId = 0; dateId < master.date.length; dateId++){
            let dateString = master.utils.id2string(dateId);
            if(dateId <= selectedDateId){
                document.getElementById('end' + dateString).disabled = true;
            }
            else{
                document.getElementById('end' + dateString).disabled = false;
            }
        }
        master.date.currentStart = Number(selectedDateId);
    }
    else{
        let selectedDateId = document.getElementById('endDate').value;
        for(dateId = 0; dateId < master.date.length; dateId++){
            let dateString = master.utils.id2string(dateId);
            if(dateId < selectedDateId){
                document.getElementById('start' + dateString).disabled = false;
            }
            else{
                document.getElementById('start' + dateString).disabled = true;
            }
        }
        master.date.currentEnd = Number(selectedDateId);
    }
    // set now to currentStart
    master.date.now = master.date.currentStart;
    d3.select('#now')
        .html(master.utils.id2string(master.date.now));

    master.map.update(0);
    master.scatterplot.update(0);
    master.curvechart.init();
}

/**
 * begin a new period of transition according to master.date.startDate and master.date.endDate
 */
master.control.beginTransition = function(){
    // block pointer event
    d3.selectAll('svg')
        .style('pointer-events', 'none');
    window.dataUpdatingInterval = window.setInterval(function(){
        master.control.update();
    }, this.EX_DURATION);
};

/**
 * update each chart
 */
master.control.update = function(){
    d3.select('#now')
            .html(master.utils.id2string(master.date.now));
    if(master.date.now < master.date.currentEnd){
        master.date.now = master.date.now + 1;
        master.map.update(this.IN_DURATION);
        master.scatterplot.update(this.IN_DURATION);
        master.curvechart.update(this.IN_DURATION);
    }
    else{
        document.getElementById('startTransition').disabled = false;
        window.clearInterval(window.dataUpdatingInterval);
        // restore pointer events
        d3.selectAll('svg')
            .style('pointer-events', 'auto');
        // auto means the element behaves as if it were not specified
    }
};