/**
 * get the count of the type in the region corresponding to the name.
 * date is determined by master.level.now
 * @param {string} name the name of the region
 * @param {string} type one of "confirmed", "cured", "suspected", "dead" and the rate of each one
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

master.utils.parseTime = d3.timeParse('%m-%d-%Y');
master.utils.time2string = d3.timeFormat("%m-%d-%Y");
master.utils.id2string = function(id){
    return master.utils.time2string(master.date.dateArray[id]);
};
master.utils.id2readableString = function(id){
    return d3.timeFormat('%b-%d-%Y')(master.date.dateArray[id]);
}

/**
 * append a 'g' element containing a tooltip
 * @param {number} xPosition
 * @param {number} yPosition
 */
master.utils.tooltip = function(context, bbox, textArray){
    const contextBbox = context.node().getBoundingClientRect();
    const lineWidth = 15;
    const numberofLines = textArray.length;
    const height = (numberofLines)*lineWidth, tickSize = 10;
    const charLen = 5;
    // find the maximal length of a text piece in textArray
    let length = 0;
    textArray.forEach(function(text){
        if(length < text.length){
            length = text.length;
        }
    });
    const width = length * charLen;
    const textPadding = 3;
    const boxOpacity = 0.7;
    let xPosition = bbox.x - contextBbox.x + bbox.width/2;
    let yPosition = bbox.y - contextBbox.y;
    let sign = -1; // -1 means the box would float on the top. 1 means on the bottom
    if(- numberofLines * lineWidth - tickSize/2 + textPadding + bbox.y - contextBbox.y < 0){
        sign = 1;
        yPosition = yPosition + bbox.height;
    }
    let pathCommand =
        " M " + (- width / 2) + " " + sign*(numberofLines * lineWidth + tickSize/2 - textPadding) +
        " h " + width + 
        " v " + height*(-sign) + 
        " h " + (tickSize - width) / 2 +
        " l " + (-tickSize / 2) + " " + tickSize / 2 * (-sign) +
        " l " + (-tickSize / 2) +  " " + (-tickSize / 2) * (-sign) +
        " h " + (tickSize - width) / 2 +
        " z ";
    let tooltip = context.append("g")
        .attr("transform", "translate(" + xPosition + " " + (yPosition) + ")")
        .attr("class", "tooltip");
    
    tooltip.append("path")
        .attr("d", pathCommand)
        .attr("opacity" , boxOpacity)
        .attr('fill', 'black');
    
    for(let i = 0; i < textArray.length; i++){
        let texts = tooltip.append("text")
            .attr("class", "tooltipText")
            .text(textArray[i]);
        if(sign < 0){
            texts.attr("y", -(textArray.length - 1 - i) * lineWidth - tickSize/2)
        }
        else{
            texts.attr("y", (i+0.5) * lineWidth + tickSize/2);
        }
    }
};

master.utils.mouseOut = function(){
    d3.selectAll(".tooltip").remove();
    d3.select("#mapRegionGroup")
        .selectAll("path")
        .filter(function(d){
            let name = d.properties.name;
            let names = master.utils.selectedNames;
            // filter out unselected, regions
            for(const selectedName of names){
                if(selectedName === name){
                    return true;
                }
            }
            return false;
        })
        .transition()
        .attr("opacity", 1);
    
    d3.select('#scatterPointGroup')
        .selectAll('circle')    // those on screen are only selected ones
        .transition()
        .attr('opacity', 1);

    d3.select('#strokeGroup')
        .selectAll('.curve')
        .transition()
        .attr('opacity', 1)
    
    d3.select('#strokeGroup')
        .select('circle')
        .remove();
};


/**
 * get range of the type, during [start, end] among master.utils.selectedNames
 * @param {string} type
 * @param {integer} start default to master.date.currentStart
 * @param {integer} end default to master.date.currentEnd
 */
master.utils.getRange = function(type, start = master.date.currentStart, end = master.date.currentEnd){
    let range = [0, 0];
    for(const name of master.utils.selectedNames){
        let localRange = d3.extent(master.level.data[name].cases.slice(start, end + 1), function(eachDay){
            return eachDay[type];
        });
        range[0] = Math.min(range[0], localRange[0]);
        range[1] = Math.max(range[1], localRange[1]);
    }
    return range;
}

master.utils.readableType = function(type){
    if(type.endsWith('Rate')){
        return 'growth rate of ' + type.slice(0, -4);
    }
    else{
        return 'count of ' + type;
    }
}

/**
 * a pipeline for changing master.date.now and the nowList's selected value
 */
master.utils.changeNow = function(dateId){
    master.date.now = dateId;
    d3.select('#nowDate')
        .select('#now' + dateId)
        .property('selected', true);
}

/**
 * convert a number to its string representation in percentage form
 * @param {number} number the number to be converted
 */
master.utils.decimalToPercent = function(number){
    return (number * 100).toFixed(1) + '%';
}

/**
 * add days to a javascript date object
 */
master.utils.addDays = function(date, days){
    const copy = new Date(Number(date));
    copy.setDate(date.getDate() + days);
    return copy;
}