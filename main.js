
var globalDevelopmentDataset;
var countriesRegions;
var countriesMap = new Map();
var width, height, innerHeight, innerWidth;
var countriesGlobalDataMap = new Map();
var SAData = [], ECAData = [], MENAData = [], SSAData = [], LACData = [], EAPData = [], NAData = [];
var SADataMap = new Map(), ECADataMap = new Map(), MENADataMap = new Map(), SSADataMap = new Map(), LACDataMap = new Map(), EAPDataMap = new Map(), NADataMap = new Map();
var displayData = []
var margin = { top: 10, right: 150, bottom: 40, left: 60 };
var unrefinedData = [];
var yScale, xScale;
var g;
var colorScale;
var firstCall;
var opacity;
var countryJson;
var countrySvgMap = new Map();
var startYear = "1980";
var endYear = "2013";

var lines, circles, texts, flags;
document.addEventListener('DOMContentLoaded', function () {
    firstCall = true;
    svgLineChart = d3.select("#line_chart_svg");
    opacity = parseInt(document.getElementById("vol").value) / 100.0;
    g = createTheDrawingArea();
    colorScale = d3.scaleOrdinal(d3.schemeCategory10);
    Promise.all([d3.csv('data/global_development.csv', d3.autoType), d3.csv('data/countries_regions.csv', d3.autoType), d3.json('data/country.json')])
        .then((values) => {
            countriesRegions = values[1];
            countriesRegions.forEach(element => {
                if (countriesMap.has(element["World bank region"])) {
                    let temp = countriesMap.get(element["World bank region"]);
                    temp.push(element["name"]);
                    countriesMap.set(element["World bank region"], temp);
                } else {
                    list = new Array();
                    list.push(element["name"]);
                    countriesMap.set(element["World bank region"], list);
                }
            });
            addRegions(countriesMap);
            countryJson = values[2];
            countryJson.forEach(ele => {
                countrySvgMap.set(ele.name, ele.flag_4x3)
            });

            globalDevelopmentDataset = values[0];
            createGlobalDataSet();
        });
});

function createGlobalDataSet() {
    var filteredGlobalDevelopmentDataset = globalDevelopmentDataset.filter(ele => {
        return ele["Year"] >= parseInt(this.startYear) && ele["Year"] <= parseInt(this.endYear);
    });
    countriesGlobalDataMap.clear();
    filteredGlobalDevelopmentDataset.forEach(element => {
        if (countriesGlobalDataMap.has(element["Country"])) {
            let temp = countriesGlobalDataMap.get(element["Country"]);
            temp.push(element);
            countriesGlobalDataMap.set(element["Country"], temp);
        } else {
            list = [];
            list.push(element);
            countriesGlobalDataMap.set(element["Country"], list);
        }
    });
    populateDataForGlobalDataset();
}

function playChart() {

    var totalLengthArray = [];
    var count = 0;
    lines._groups[0].forEach(ele => {
        totalLengthArray[count++] = ele.getTotalLength();
    })

    for (var i = 0; i < totalLengthArray.length; i++) {
        d3.select(lines._groups[0][i])
            .attr("stroke-dasharray", totalLengthArray[i] + " " + totalLengthArray[i])
            .attr("stroke-dashoffset", totalLengthArray[i])
            .transition()
            .duration(5000)
            .ease("linear")
            .attr("stroke-dashoffset", 0);
    }
}


function checkboxClick(event) {
    var radiobuttons = document.querySelectorAll('input[name=radiobutton]');
    radiobuttons.forEach (ele => {
        ele.checked = false;
    })

    drawChart(event);
}

function radiobuttonClick(event) {
    var regions = document.querySelectorAll('input[name=regions]:checked');
    if (event.currentTarget.value === "selectAll") {
        if(regions.length === 7) {
            return;
        }
        var checkboxes = document.querySelectorAll('input[name=regions]');
        checkboxes.forEach(ele => {
            ele.checked = true;
        });
    }
    else {
        if(regions.length === 0) {
            return;
        }
        var checkboxes = document.querySelectorAll('input[name=regions]');
        checkboxes.forEach(ele => {
            ele.checked = false;
        });
    }
    drawChart(event);
}

function flagSwitch() {
    if (displayData.length != 0) {
        if (document.getElementById("flag-select").checked) {
            texts.attr("visibility", "hidden");
            flags.attr("visibility", "show");
        } else {
            texts.attr("visibility", "show");
            flags.attr("visibility", "hidden");
        }
    }
}

function changeAttribute() {
    drawChart();
}

function setOpacity(value) {
    opacity = value / 100.0;
}

function setDate() {
    try {
        var startYear = parseInt(document.getElementById("start-year").value);
        var endYear = parseInt(document.getElementById("end-year").value);
        if (isNaN(startYear) || isNaN(endYear)) {
            throw err;

        }
        if (startYear < 1980) {
            alert("Please make sure the start year is greater than 1980");
            return;
        }
        if (startYear >= 2013) {
            alert("Please make sure the start year is less than 2013");
            return;
        }
        if (endYear > 2013) {
            alert("Please make sure the end year is less than 2013");
            return;
        }

        if (endYear < 1980) {
            alert("Please make sure the end year is greater than 1980");
            return;
        }
        if (endYear <= startYear) {
            alert("End year should be greater than start year!");
            return;
        }

    } catch (err) {
        alert('Invalid Input');
        return
    }
    this.startYear = startYear;
    this.endYear = endYear;
    createGlobalDataSet();
    /*lines.exit()
        .transition()
        .duration(1000)
        .style('opacity', 0)
        .remove();*/

    drawChart(event);
}

function resetDate() {
    document.getElementById("start-year").value = "";
    document.getElementById("end-year").value = "";
    this.startYear = "1980";
    this.endYear = "2013";
    createGlobalDataSet();
    /*lines.exit()
        .transition()
        .duration(1000)
        .style('opacity', 0)
        .remove();*/


    drawChart(event);

}
function drawChart(event) {

    var attribute = document.getElementById("attributes-select").value;
    var regions = document.querySelectorAll('input[type=checkbox]:checked');
    chosenRegions(regions);

    yScale = d3.scaleLinear()
        .domain([0, d3.max(unrefinedData, (d) => d[attribute])])
        .range([innerHeight, 0]);

    xScale = d3.scaleTime()
        .domain([new Date(`${startYear}`), new Date(`${endYear}`)])
        .range([0, innerWidth]);


    /**line chart */

    const singleLine = d3.line()
        .x(d => xScale(new Date(`${d["Year"]}`)))
        .y(d => yScale(d[attribute]))
        .curve(d3.curveMonotoneX);



    lines = g.selectAll('.lines')
        .data(displayData)
        .join(
            (enter) => {
                return enter.append("path")
                    .attr("class", "lines")
                    .attr("id", d => d.cname)
                    .style('fill', 'none')
                    .attr("d", function (d) { return singleLine(d.items); })
                    .style("stroke", d => colorScale(d.id))
                    .style('stroke-width', '5')
                    .style('opacity', 0)
                    .transition().duration(1000).ease(d3.easeLinear)
                    .style("opacity", opacity)

            },
            update => {
                return update.style('fill', 'none')
                    .attr("d", function (d) { return singleLine(d.items); })
                    .style("stroke", d => colorScale(d.id))
                    //   .attr("id", d => d.items[0]["Country"])
                    .style('stroke-width', '5')
                    .style('opacity', 0)
                    .transition().duration(1000).ease(d3.easeLinear)
                    .style('opacity', opacity)
            },
            exit => {
                return exit
                    .transition()
                    .duration(1000)
                    .style('opacity', 0)
                    .remove();
            }
        )

    flags = g.selectAll('.image')
        .data(displayData)
        .join(
            (enter) => {
                return enter.append("svg:image")
                    .datum(function (d) { return { id: d.id, country: d.cname, value: d.items[d.items.length - 1] }; })
                    .attr("transform", function (d) {
                        return "translate(" + xScale(new Date(d.value["Year"] + "")) + "," + yScale(d.value[attribute]) + ")";
                    })
                    .attr("class", "image")
                    .attr("id", d => d.country)
                    .attr("x", 10)
                    .attr("y", -5)
                    .attr("xlink:href", d =>
                        `${countrySvgMap.get(d.country)}`
                    )
                    .attr("width", "25")
                    .attr("height", "15")
                    .style('opacity', 0)
                    .transition().duration(1000).ease(d3.easeLinear)
                    .style("opacity", opacity);
            },
            update => {
                return update.datum(function (d) { return { id: d.id, country: d.cname, value: d.items[d.items.length - 1] }; })
                    .attr("transform", function (d) {
                        return "translate(" + xScale(new Date(d.value["Year"] + "")) + "," + yScale(d.value[attribute]) + ")";
                    })
                    .attr("x", 10)
                    .attr("y", -5)
                    // .attr("id", d => d.country)
                    .attr("xlink:href", d => `${countrySvgMap.get(d.country)}`)
                    .attr("width", "25")
                    .attr("height", "15")
                    .style('opacity', 0)
                    .transition().duration(1000).ease(d3.easeLinear)
                    .style('opacity', opacity);
            },
            exit => {
                return exit
                    .transition()
                    .duration(1000)
                    .style('opacity', 0)
                    .remove();
            }
        );



    texts = g.selectAll('.names')
        .data(displayData)
        .join(
            (enter) => {
                return enter.append("text")
                    .datum(function (d) { return { id: d.id, country: d.cname, value: d.items[d.items.length - 1] }; })
                    .attr("transform", function (d) {
                        return "translate(" + xScale(new Date(d.value["Year"] + "")) + "," + yScale(d.value[attribute]) + ")";
                    })
                    .attr("class", "names")
                    .attr("id", d => d.country)
                    .attr("x", 10)
                    .attr("dy", "0.50em")
                    .style("font", "15px sans-serif")
                    .text(function (d) { return d.country; })
                    .style("stroke", d => colorScale(d.id))
                    .style('opacity', 0)
                    .transition().duration(1000).ease(d3.easeLinear)
                    .style("opacity", opacity);
            },
            update => {
                return update.datum(function (d) { return { id: d.id, country: d.cname, value: d.items[d.items.length - 1] }; })
                    .attr("transform", function (d) {
                        return "translate(" + xScale(new Date(d.value["Year"] + "")) + "," + yScale(d.value[attribute]) + ")";
                    })
                    .attr("x", 10)
                    .attr("dy", "0.50em")
                    .style("font", "15px sans-serif")
                    .text(function (d) { return d.country; })
                    .style("stroke", d => colorScale(d.id))
                    .style('opacity', 0)
                    .transition().duration(1000).ease(d3.easeLinear)
                    .style('opacity', opacity);
            },
            exit => {
                return exit
                    .transition()
                    .duration(1000)
                    .style('opacity', 0)
                    .remove();
            }
        );

    circles = g.selectAll('.circles')
        .data(displayData)
        .join(
            (enter) => {
                return enter.append("circle")
                    .datum(function (d) { return { id: d.id, country: d.cname, value: d.items[d.items.length - 1] }; })
                    .attr("transform", function (d) {
                        return "translate(" + xScale(new Date(d.value["Year"] + "")) + "," + yScale(d.value[attribute]) + ")";
                    }).style('fill', d => colorScale(d.id))

                    .style('stroke', "black")
                    .attr("class", "circles")
                    .attr("id", d => d.country)
                    .style('opacity', '1')
                    .attr('r', 7)
                    .style('opacity', 0)
                    .transition().duration(1000).ease(d3.easeLinear)
                    .style("opacity", opacity);
            },
            update => {
                return update
                    .datum(function (d) { return { id: d.id, value: d.items[d.items.length - 1] }; })
                    .attr("transform", function (d) {
                        return "translate(" + xScale(new Date(d.value["Year"] + "")) + "," + yScale(d.value[attribute]) + ")";
                    }).style('fill', d => colorScale(d.id))
                    .style('stroke', "black")
                    .style('opacity', '1')
                    .attr('r', 7)
                    .style('opacity', 0)
                    .transition().duration(1000).ease(d3.easeLinear)
                    .style('opacity', opacity);
            },
            exit => {
                return exit
                    .transition()
                    .duration(1000)
                    .style('opacity', 0)
                    .remove();
            }
        );



    createAxis(innerHeight, g);
    addMouseEvents();
    flagSwitch()
}


function createAxis(innerHeight, g) {


    if (displayData.length == 0) {
        g.selectAll("#y-axis").transition()
            .duration(1000)
            .style('opacity', 0)
            .remove();
        g.selectAll("#x-axis").transition()
            .duration(1000)
            .style('opacity', 0)
            .remove();

        svgLineChart.selectAll(".x-label").transition()
            .duration(1000)
            .style('opacity', 0)
            .remove();
        svgLineChart.selectAll(".y-label").transition()
            .duration(1000)
            .style('opacity', 0)
            .remove();

        firstCall = true;
        return;
    }


    if (firstCall) {
        svgLineChart.append("text")
            .attr("class", "y-label")
            .attr("text-anchor", "middle")
            .attr("y", 6)
            .attr("x", -1 * innerHeight / 2)
            .attr("dy", ".75em")
            .attr("transform", "rotate(270)")
            .text("Selected Attribute");
        svgLineChart.append("text")
            .attr("class", "x-label")
            .attr("text-anchor", "middle")
            .attr("x", innerWidth / 2)
            .attr("y", height - 6)
            .text("Year");

        g.append('g')
            .attr("id", "y-axis")
            .attr("transform", `translate(0,0)`)
            .transition().duration(600)
            .call(d3.axisLeft(yScale));

        g.append("g")
            .attr("id", "x-axis")
            .attr("transform", `translate(0,${innerHeight})`)
            .transition().duration(600)
            .call(d3.axisBottom(xScale));
    } else {
        g.select("#y-axis")
            .transition().duration(600)
            .call(d3.axisLeft(yScale));
        g.select("#x-axis")
            .transition().duration(600)
            .call(d3.axisBottom(xScale));
    }

    firstCall = false;

}


function createTheDrawingArea() {
    width = parseInt(svgLineChart.style('width').replace("px", ""));
    height = parseInt(svgLineChart.style('height').replace("px", ""));
    innerWidth = width - margin.left - margin.right;
    innerHeight = height - margin.top - margin.bottom;
    var g = svgLineChart.append("g").attr("transform", `translate(${margin.left},${margin.top})`);
    return g;
}

function addMouseEvents() {

    //lines
    lines._groups[0].forEach(ele => {
        d3.select(ele).on('mouseover', function (d, i) {

            lines._groups[0].forEach(ele => {
                if (ele.id == this.id) {
                    d3.select(ele).style("opacity", 1);
                } else {
                    d3.select(ele).style("opacity", 0.20);
                }
            });
            circles._groups[0].forEach(ele => {
                if (ele.id == this.id) {
                    d3.select(ele).style("opacity", 1);
                } else {
                    d3.select(ele).style("opacity", 0.20);
                }
            });
            texts._groups[0].forEach(ele => {
                if (ele.id == this.id) {
                    d3.select(ele).style("opacity", 1);
                } else {
                    d3.select(ele).style("opacity", 0.20);
                }
            });
            flags._groups[0].forEach(ele => {
                if (ele.id == this.id) {
                    d3.select(ele).style("opacity", 1);
                } else {
                    d3.select(ele).style("opacity", 0.20);
                }
            });
        }).on('mouseout', function (d, i) {
            d3.selectAll(circles._groups[0]).style("opacity", opacity);
            d3.selectAll(lines._groups[0]).style("opacity", opacity);
            d3.selectAll(texts._groups[0]).style("opacity", opacity);
            d3.selectAll(flags._groups[0]).style("opacity", opacity);
        });
    })

    //circles
    circles._groups[0].forEach(ele => {
        d3.select(ele).on('mouseover', function (d, i) {
            console.log("mouseover");
            d3.select(this).style("opacity", 1);
            circles._groups[0].forEach(ele => {
                if (ele.id != this.id) {
                    d3.select(ele).style("opacity", 0.20);
                }
            });
            lines._groups[0].forEach(ele => {
                if (ele.id == this.id) {
                    d3.select(ele).style("opacity", 1);
                } else {
                    d3.select(ele).style("opacity", 0.20);
                }
            });
            texts._groups[0].forEach(ele => {
                if (ele.id == this.id) {
                    d3.select(ele).style("opacity", 1);
                } else {
                    d3.select(ele).style("opacity", 0.20);
                }
            });
            flags._groups[0].forEach(ele => {
                if (ele.id == this.id) {
                    d3.select(ele).style("opacity", 1);
                } else {
                    d3.select(ele).style("opacity", 0.20);
                }
            });

        }).on('mouseout', function (d, i) {
            d3.selectAll(circles._groups[0]).style("opacity", opacity);
            d3.selectAll(lines._groups[0]).style("opacity", opacity);
            d3.selectAll(texts._groups[0]).style("opacity", opacity);
            d3.selectAll(flags._groups[0]).style("opacity", opacity);
        });
    })

    //texts
    texts._groups[0].forEach(ele => {
        d3.select(ele).on('mouseover', function (d, i) {
            console.log("mouseover");
            d3.select(this).style("opacity", 1);
            texts._groups[0].forEach(ele => {
                if (ele.id != this.id) {
                    d3.select(ele).style("opacity", 0.20);
                }
            });
            circles._groups[0].forEach(ele => {
                if (ele.id == this.id) {
                    d3.select(ele).style("opacity", 1);
                } else {
                    d3.select(ele).style("opacity", 0.20);
                }
            });
            lines._groups[0].forEach(ele => {
                if (ele.id == this.id) {
                    d3.select(ele).style("opacity", 1);
                } else {
                    d3.select(ele).style("opacity", 0.20);
                }
            });
            flags._groups[0].forEach(ele => {
                if (ele.id == this.id) {
                    d3.select(ele).style("opacity", 1);
                } else {
                    d3.select(ele).style("opacity", 0.20);
                }
            });
        }).on('mouseout', function (d, i) {
            d3.selectAll(circles._groups[0]).style("opacity", opacity);
            d3.selectAll(lines._groups[0]).style("opacity", opacity);
            d3.selectAll(texts._groups[0]).style("opacity", opacity);
            d3.selectAll(flags._groups[0]).style("opacity", opacity);
        });
    })

    //images
    flags._groups[0].forEach(ele => {
        d3.select(ele).on('mouseover', function (d, i) {
            console.log("mouseover");
            d3.select(this).style("opacity", 1);
            flags._groups[0].forEach(ele => {
                if (ele.id != this.id) {
                    d3.select(ele).style("opacity", 0.20);
                }
            });
            circles._groups[0].forEach(ele => {
                if (ele.id == this.id) {
                    d3.select(ele).style("opacity", 1);
                } else {
                    d3.select(ele).style("opacity", 0.20);
                }
            });
            lines._groups[0].forEach(ele => {
                if (ele.id == this.id) {
                    d3.select(ele).style("opacity", 1);
                } else {
                    d3.select(ele).style("opacity", 0.20);
                }
            });
            texts._groups[0].forEach(ele => {
                if (ele.id == this.id) {
                    d3.select(ele).style("opacity", 1);
                } else {
                    d3.select(ele).style("opacity", 0.20);
                }
            });
        }).on('mouseout', function (d, i) {
            d3.selectAll(circles._groups[0]).style("opacity", opacity);
            d3.selectAll(lines._groups[0]).style("opacity", opacity);
            d3.selectAll(texts._groups[0]).style("opacity", opacity);
            d3.selectAll(flags._groups[0]).style("opacity", opacity);
        });
    })

}

/** utilities functions */
function addRegions(countriesMap) {
    var element = document.getElementById("country_region_list");
    for (const key of countriesMap.keys()) {
        element.innerHTML += `<input type="checkbox" id="${key}" name="regions" value="${key}" onclick="checkboxClick(event)"> ${key}</input><br>`
    }
    // element.innerHTML += `<input type="checkbox" id="selectAll" name="regions" value="selectAll" onclick="checkboxClick(event)"> Select All</input><br>`;
    // element.innerHTML += `<input type="checkbox" id="deselectAll" name="regions" onclick="checkboxClick(event)" value="deselectAll"> Deselect All</input><br>`;
    element.innerHTML += '<fieldset id="group2"> <input type="radio" id="selectAll" name="radiobutton" value="selectAll" onclick="radiobuttonClick(event)"> Select All</input>'
    element.innerHTML += '<input type="radio" id="deselectAll" name="radiobutton" onclick="radiobuttonClick(event)" value="deselectAll"> Deselect All</input></fieldset>'
}


function populateDataForGlobalDataset() {
    SADataMap.clear();
    SAData = [];
    countriesMap.get("South Asia").forEach(ele => {
        if (countriesGlobalDataMap.has(ele)) {
            SADataMap.set(ele, countriesGlobalDataMap.get(ele));
            SAData = SAData.concat(countriesGlobalDataMap.get(ele));
        }
    });
    countriesMap.get("Europe & Central Asia").forEach(ele => {
        if (countriesGlobalDataMap.has(ele)) {
            ECADataMap.set(ele, countriesGlobalDataMap.get(ele));
            ECAData = ECAData.concat(countriesGlobalDataMap.get(ele));
        }
    });
    countriesMap.get("Middle East & North Africa").forEach(ele => {
        if (countriesGlobalDataMap.has(ele)) {
            MENADataMap.set(ele, countriesGlobalDataMap.get(ele));
            MENAData = MENAData.concat(countriesGlobalDataMap.get(ele));
        }
    });
    countriesMap.get("Sub-Saharan Africa").forEach(ele => {
        if (countriesGlobalDataMap.has(ele)) {
            SSADataMap.set(ele, countriesGlobalDataMap.get(ele));
            SSAData = SSAData.concat(countriesGlobalDataMap.get(ele));
        }
    });
    countriesMap.get("Latin America & Caribbean").forEach(ele => {
        if (countriesGlobalDataMap.has(ele)) {
            LACDataMap.set(ele, countriesGlobalDataMap.get(ele));
            LACData = LACData.concat(countriesGlobalDataMap.get(ele));
        }
    });
    countriesMap.get("East Asia & Pacific").forEach(ele => {
        if (countriesGlobalDataMap.has(ele)) {
            EAPDataMap.set(ele, countriesGlobalDataMap.get(ele));
            EAPData = EAPData.concat(countriesGlobalDataMap.get(ele));
        }
    });
    countriesMap.get("North America").forEach(ele => {
        if (countriesGlobalDataMap.has(ele)) {
            NADataMap.set(ele, countriesGlobalDataMap.get(ele));
            NAData = NAData.concat(countriesGlobalDataMap.get(ele));
        }
    });
}

function chosenRegions(regions) {

    displayData = [];
    unrefinedData = [];
    regions.forEach(region => {
        if (region.value === "South Asia") {
            unrefinedData = unrefinedData.concat(unrefinedData, SAData);
            SADataMap.forEach((value, key) => {
                displayData.push({ id: region.value, cname: value[0]["Country"], items: value })
            });

        }
        if (region.value === "Europe & Central Asia") {
            unrefinedData = unrefinedData.concat(unrefinedData, ECAData);
            ECADataMap.forEach((value, key) => {
                displayData.push({ id: region.value, cname: value[0]["Country"], items: value })
            });

        }
        if (region.value === "Middle East & North Africa") {
            unrefinedData = unrefinedData.concat(unrefinedData, MENAData);
            MENADataMap.forEach((value, key) => {
                displayData.push({ id: region.value, cname: value[0]["Country"], items: value })
            });

        }
        if (region.value === "Sub-Saharan Africa") {
            unrefinedData = unrefinedData.concat(unrefinedData, SSAData);
            SSADataMap.forEach((value, key) => {
                displayData.push({ id: region.value, cname: value[0]["Country"], items: value })
            });

        }
        if (region.value === "Latin America & Caribbean") {
            unrefinedData = unrefinedData.concat(unrefinedData, LACData);
            LACDataMap.forEach((value, key) => {
                displayData.push({ id: region.value, cname: value[0]["Country"], items: value })
            });

        }
        if (region.value === "East Asia & Pacific") {
            unrefinedData = unrefinedData.concat(unrefinedData, EAPData);
            EAPDataMap.forEach((value, key) => {
                displayData.push({ id: region.value, cname: value[0]["Country"], items: value })
            });

        }
        if (region.value === "North America") {
            unrefinedData = unrefinedData.concat(unrefinedData, NAData);
            NADataMap.forEach((value, key) => {
                displayData.push({ id: region.value, cname: value[0]["Country"], items: value })
            });
        }
    });
}
