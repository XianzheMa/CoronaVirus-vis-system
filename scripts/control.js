
master.control.init = function(){
    this.IN_DURATION = 990;
    this.EX_DURATION = 1000;
    d3.select('#startTransition')
        .on('click', function(){
            this.disabled = true;
            d3.selectAll('.list')
                .property('disabled', true);
            master.map.changeClick(false);
            window.dataUpdatingInterval = window.setInterval(function(){
                master.control.update();
            }, master.control.EX_DURATION);
        });
    this.setList();
    
};

/**
 * set lists of start date and end date
 */
master.control.setList = function(){
    // add options to two dropdown lists
    let startList = d3.select("#startDate");
    let endList = d3.select('#endDate');
    let nowList = d3.select('#nowDate');
    startList.attr('onchange', 'master.control.changeList(1)');
    endList.attr('onchange', 'master.control.changeList(2)');
    nowList.attr('onchange', 'master.control.changeList(3)');
    for(let dateIndex = 0; dateIndex < master.date.length; dateIndex++){
        let dateString = master.utils.id2readableString(dateIndex);
        let startOption = startList.append('option')
            .attr('value', dateIndex)
            .attr('id', 'start' + dateIndex)
            .html(dateString);
        
        let endOption = endList.append('option')
            .attr('value', dateIndex)
            .attr('id', 'end' + dateIndex)
            .html(dateString);
        
        let nowOption = nowList.append('option')
            .attr('value', dateIndex)
            .attr('id', 'now' + dateIndex)
            .html(dateString);
        // set default value and disable end value
        if(dateIndex ===  0){
            startOption.node().selected = true;
            endOption.node().disabled = true;
        }
        if(dateIndex ===  master.date.length - 1){
            endOption.node().selected = true;
            startOption.node().disabled = true;
        }
        if(dateIndex === master.date.now){
            nowOption.property('selected', true);
        }
    }
};

master.control.changeList = function(symbol){
    // symbol: 1 means startDate, 2 means endDate and 3 means nowDate
    /**
     * the valid interval is [lower, upper]
     * @param {string} type one of 'start', 'end', 'now'
     */
    function rebound(type){
        let lower, upper;
        if(type === 'start'){
            lower = 0;
            upper = master.date.now;
        }
        else if(type === 'end'){
            lower = master.date.now;
            upper = master.date.length - 1;
        }
        else{
            // now
            lower = master.date.currentStart;
            upper = master.date.currentEnd;
        }
        for(dateId = 0; dateId < master.date.length; dateId++){
            let option = document.getElementById(type + dateId);
            if(dateId < lower || dateId > upper){
                option.disabled = true;
            }
            else{
                option.disabled = false;
            }
        }
    }

    if(symbol === 1){
        master.date.currentStart = Number(document.getElementById('startDate').value);
        if(master.date.now < master.date.currentStart){
            master.utils.changeNow(master.date.currentStart);
        }
        rebound('end');
        rebound('now');
    }
    else if (symbol === 2){
        master.date.currentEnd = Number(document.getElementById('endDate').value);
        if(master.date.now > master.date.currentEnd){
            master.utils.changeNow(master.date.currentEnd);
        }
        rebound('start');
        rebound('now');
    }
    else{
        master.date.now = Number(document.getElementById('nowDate').value);
        rebound('start');
        rebound('end');
    }
    master.map.update(0);
    master.scatterplot.update(0);
    master.curvechart.init();
}


/**
 * update each chart
 */
master.control.update = function(){
    
    master.utils.changeNow(master.date.now);
    if(master.date.now < master.date.currentEnd){
        master.date.now = master.date.now + 1;
        master.map.update(this.IN_DURATION);
        master.scatterplot.update(this.IN_DURATION);
        master.curvechart.update(this.IN_DURATION);
    }
    else{
        document.getElementById('startTransition').disabled = false;
        d3.selectAll('.list')
            .property('disabled', false);
        window.clearInterval(window.dataUpdatingInterval);
        master.map.changeClick(true);
    }
};