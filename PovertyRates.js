
//Variable Declaration
var svg, grossScale;
var cities = [];

// Dimensions of screen and circle sizes
var width = 1000,         // width of visualization
    height = 2480,        // height of visualization
    padding = 3,          // separation between same-color circles
    clusterPadding = 5,   // separation between different-color circles
    maxRadius  = 17,      // maximum size of a circle
    medRadius = 13,       // medium radius of a circle
    minRadius = 8,        // minimum size of a circle
    margin = 50;

// Parsing of data set csv file
d3.csv("povertyRate.csv", function(data) {
    cities = data;
    cities.forEach(function(d) {
        d.Poverty = +d.Poverty;
        d.Population = +d.Population;
    });
    initialize("Poverty");
    addScale();
});


/* This function will create the visualization based on the category selected by the user */
function initialize(category){
    d3.selectAll("svg").remove();

    var categories = d3.map(cities, function(d) { return d.category; });
    var m = 50;
    var n = cities.length;

    var clusters = new Array(m);
    var nodes = cities.map(function(currentValue, index) {
        if(currentValue.Population < 90000) {r = minRadius}
        else if(currentValue.Population > 90000 && currentValue.Population <= 1000000) {r = medRadius}
        else{r = maxRadius}

        var i = currentValue[category],
            d = {cluster: i,
                radius: r,
                City: currentValue.City,
                Region: currentValue.Region,
                Poverty: currentValue.Poverty,
                Population: currentValue.Population};

        // if this is the largest node for a category, add it to 'clusters' array
        if (!clusters[i] || (r > clusters[i].radius)) clusters[i] = d;
        return d;
    });

    var force = d3.layout.force()
        .nodes(nodes)
        .size([width, height])
        .gravity(0)
        .charge(0) //attractive force between nodes. Negative values makes nodes repel
        .on("tick", tick)
        .start();

    // Create an SVG element of size width x height that contains the graph
    svg = d3.select("body").append("svg")
        .attr("width", width)
        .attr("height", height);

    var circle = svg.selectAll("g")
        .data(nodes)
        .enter()
        .append("g").append("circle")
        .attr("id", "circle-hover")
        // size depends on population
        .attr("r", function(d) { if(d.Population < 90000) {return radius = 8}
            if(d.Population > 100000 && d.Population <= 1000000) {return radius = 13}
            if(d.Population > 1000000) {return radius = 17}
            else {return d.radius};

        })

        .attr("fill", function(d) {
            if(d.Poverty > 7 && d.Poverty < 11){
                return d3.rgb("#1e3a7b");
            }

            if(d.Poverty >= 11 && d.Poverty < 14){
                return d3.rgb("#4670d2");
            }

            if(d.Poverty >= 14 && d.Poverty < 17){
                return d3.rgb("#adc0eb");
            }

            if(d.Poverty >= 17 && d.Poverty < 20){
                return d3.rgb("#ff6666");
            }

            if(d.Poverty >= 20 && d.Poverty < 23){
                return d3.rgb("#ff0000");
            }

            if(d.Poverty >= 23){
                return d3.rgb("#b30000");
            }
        })


    // a simple tooltip from http://bl.ocks.org/biovisualize/1016860 with formatting
    var tooltip = d3.select("body")
        .append("div")
        .style("position", "absolute")
        .style("z-index", "7")
        .style("visibility", "hidden")
        .style("width", "1000px")
        .style("height", "30px")
        .style("background", "aliceblue")
        .style("border", "0px")
        .style("border-radius", "8px")
        .style("font-family", "sans-serif");

    /* Adding mouseover functions to the tooltip */
    var div = d3.select("body").append("div")
        .attr("class", "tooltip")
        .style("opacity", 0);

    var parse = d3.format(",");

    svg.selectAll("circle")
        .on("mouseover", function(d) {
            div.transition()
                .duration(200)
                .style("opacity", 0.8)

            div.html("<b style=\"text-transform: uppercase\"><center>"+d.City+"</b></center>" + "<br />" + "Population: <span class=\"right\">" + parse(d.Population) + "</span><br />" + "Poverty: <span class=\"right\">" + parse(d.Poverty) +  "</span><br />" + "Region: <span class=\"right\">" + d.Region +"</span>")
                .style("left", (d3.event.pageX) + "px")
                .style("top", (d3.event.pageY) + "px");
        })


        .on("mousemove", function(){return tooltip.style("top", (d3.event.pageY-10)+"px")
            .style("left",(d3.event.pageX+10)+"px");})
        .on("mouseout", function(d) {
            div.transition()
                .duration(500)
                .style("opacity", 0);
        });

    // movement of circles and cluster spatial orientation
    function tick(e) {
        circle
            .each(clusterGross(10*e.alpha*e.alpha))
            .each(collide(.1))
            .attr("cx", function(d) { return d.x + 100; })
            .attr("cy", function(d) {return d.y;})
    }

    // Placement of circles hardcoded on the canvas
    function clusterGross(alpha) {
        return function(d) {

            var yTemp;

            if(category == "Poverty"){ yTemp = 150}

            if(category == "Region"){
                switch(d.Region){
                    case "Sacramento":
                        yTemp = 100;
                        break;

                    case "Los Angeles":
                        yTemp = 240;
                        break;

                    case "Bay Area":
                        yTemp = 390;
                        break;

                    case "Central Sierra":
                        yTemp = 550;
                        break;

                    case "Upstate California":
                        yTemp = 700;
                        break;

                    case "Central Coast":
                        yTemp = 850;
                        break;

                    case "Imperial":
                        yTemp = 990;
                        break;

                    case "Central Valley":
                        yTemp = 1140;
                        break;

                    case "Orange":
                        yTemp = 1290;
                        break;

                    case "Inland Empire":
                        yTemp = 1410;
                        break;
                }
            }


            var cluster = {x: grossScale(d.Poverty),
                y : yTemp,
                radius: -d.radius
            };

            var k = .1 * Math.sqrt(d.radius);
            var x = d.x - cluster.x,
                y = d.y - cluster.y,
                l = Math.sqrt(x * x + y * y),
                r = d.radius + cluster.radius;
            if (l != r) {
                l = (l - r) / l * alpha * k;
                d.x -= x *= l;
                d.y -= y *= l;
                cluster.x += x;
                cluster.y += y;
            }
        };
    }

    // Resolves collisions between d and all other circles.
    function collide(alpha) {
        var quadtree = d3.geom.quadtree(nodes);
        return function(d) {
            var r = d.radius + 17 + Math.min(padding, clusterPadding),
                nx1 = d.x - r,
                nx2 = d.x + r,
                ny1 = d.y - r,
                ny2 = d.y + r;
            quadtree.visit(function(quad, x1, y1, x2, y2) {
                if (quad.point && (quad.point !== d)) {
                    var x = d.x - quad.point.x,
                        y = d.y - quad.point.y,
                        l = Math.sqrt(x * x + y * y),
                        r = d.radius + quad.point.radius +
                            (d.cluster === quad.point.cluster ? padding : clusterPadding);
                    if (l < r) {
                        l = (l - r) / l * alpha;
                        d.x -= x *= l;
                        d.y -= y *= l;
                        quad.point.x += x;
                        quad.point.y += y;
                    }
                }
                return x1 > nx2 || x2 < nx1 || y1 > ny2 || y2 < ny1;
            });
        };
    }
};

function addScale(){
    svg.selectAll(".legend").remove();

    grossScale = d3.scale.linear()
        .range([0+margin, width-(margin + 100)]);

    var xAxis = d3.svg.axis()
        .scale(grossScale)
        .orient("bottom")
        .ticks(12, " ");

    grossScale.domain([d3.min(cities, function(d) { return d.Poverty; }),
        d3.max(cities, function(d) { return d.Poverty; })]);

    svg.append("g")
        .attr("class", "x axis")
        .call(xAxis)
        .attr("transform", "translate(100,"+280+")")

    svg.append("text")
        .attr("class", "label")
        .attr("x", (width/2) + 150)
        .attr("y", 320)
        .style("text-anchor", "end")
        .text("Poverty In California");

    legend();
};

// for Region split up
function addScale2(){
    svg.selectAll(".legend").remove();
    grossScale = d3.scale.linear()
        .range([0+margin, width-(margin + 100)]);

    var xAxis = d3.svg.axis()
        .scale(grossScale)
        .orient("bottom")
        .ticks(14, "")

    grossScale.domain([d3.min(cities, function(d) { return d.Poverty; }),
        d3.max(cities, function(d) { return d.Poverty; })]);

    svg.append("g")
        .attr("class", "x axis")
        .call(xAxis)
        .attr("transform", "translate(100,"+150+")")

    svg.append("text")
        .attr("class", "label")
        .attr("x", (width/2))
        .attr("y", 190)
        .style("text-anchor", "center")
        .text("Sacramento");

    svg.append("g")
        .attr("class", "x axis")
        .call(xAxis)
        .attr("transform", "translate(100,"+300+")")

    svg.append("text")
        .attr("class", "label")
        .attr("x", (width/2))
        .attr("y", 340)
        .style("text-anchor", "center")
        .text("Los Angeles");

    svg.append("g")
        .attr("class", "x axis")
        .call(xAxis)
        .attr("transform", "translate(100,"+450+")")

    svg.append("text")
        .attr("class", "label")
        .attr("x", (width/2))
        .attr("y", 490)
        .style("text-anchor", "center")
        .text("Bay Area");

    svg.append("g")
        .attr("class", "x axis")
        .call(xAxis)
        .attr("transform", "translate(100,"+600+")")

    svg.append("text")
        .attr("class", "label")
        .attr("x", (width/2))
        .attr("y", 640)
        .style("text-anchor", "center")
        .text("Central Sierra");

    svg.append("g")
        .attr("class", "x axis")
        .call(xAxis)
        .attr("transform", "translate(100,"+750+")")

    svg.append("text")
        .attr("class", "label")
        .attr("x", (width/2))
        .attr("y", 790)
        .style("text-anchor", "center")
        .text("Upstate California");

    svg.append("g")
        .attr("class", "x axis")
        .call(xAxis)
        .attr("transform", "translate(100,"+900+")")

    svg.append("text")
        .attr("class", "label")
        .attr("x", (width/2))
        .attr("y", 940)
        .style("text-anchor", "center")
        .text("Central Coast")

    svg.append("g")
        .attr("class", "x axis")
        .call(xAxis)
        .attr("transform", "translate(100,"+1050+")")

    svg.append("text")
        .attr("class", "label")
        .attr("x", (width/2))
        .attr("y", 1090)
        .style("text-anchor", "center")
        .text("Imperial")

    svg.append("g")
        .attr("class", "x axis")
        .call(xAxis)
        .attr("transform", "translate(100,"+1200+")")

    svg.append("text")
        .attr("class", "label")
        .attr("x", (width/2))
        .attr("y", 1240)
        .style("text-anchor", "center")
        .text("Central Valley")

    svg.append("g")
        .attr("class", "x axis")
        .call(xAxis)
        .attr("transform", "translate(100,"+1330+")")

    svg.append("text")
        .attr("class", "label")
        .attr("x", (width/2))
        .attr("y", 1370)
        .style("text-anchor", "center")
        .text("Orange")

    svg.append("g")
        .attr("class", "x axis")
        .call(xAxis)
        .attr("transform", "translate(100,"+1450+")")

    svg.append("text")
        .attr("class", "label")
        .attr("x", (width/2))
        .attr("y", 1480)
        .style("text-anchor", "center")
        .text("Imperial")

    legend2();
};


// Overview button
function grossClick(elem){
    var buttons = document.getElementsByClassName("navbar-item");
    for(i = 0; i < buttons.length; ++i){
        buttons[i].style.backgroundColor="black";
    }
    elem.style.backgroundColor="mediumseagreen";
    initialize("Poverty");
    addScale();
};

// Region split up button
function genreClick(elem){
    var buttons = document.getElementsByClassName("navbar-item");
    for(i = 0; i < buttons.length; ++i){
        buttons[i].style.backgroundColor="black";
    }
    elem.style.backgroundColor="mediumseagreen";
    initialize("Region");
    addScale2();
};


///////////////////////////////////////////////////////////////////////////////
// legend specifications placed below for color and continent
function legend(){
    svg.append("circle")
        .attr("r", 5)
        .attr("cx", 10)
        .attr("cy", 380)
        .style("fill", "#8a00e6");

    svg.append("text")
        .attr("class", "label")
        .attr("x", 50)
        .attr("y",385)
        .style("text-anchor", "start")
        .text("Upstate California");

    svg.append("circle")
        .attr("r", 5)
        .attr("cx", 10)
        .attr("cy", 400)
        .style("fill", "#0099ff");

    svg.append("text")
        .attr("class", "label")
        .attr("x", 50)
        .attr("y", 405)
        .style("text-anchor", "start")
        .text("Sacramento");

    svg.append("circle")
        .attr("r", 5)
        .attr("cx", 10)
        .attr("cy", 420)
        .style("fill", "#339966");

    svg.append("text")
        .attr("class", "label")
        .attr("x", 50)
        .attr("y", 425)
        .style("text-anchor", "start")
        .text("Bay Area");

    svg.append("circle")
        .attr("r", 5)
        .attr("cx", 10)
        .attr("cy", 440)
        .style("fill", "#ff66cc");

    svg.append("text")
        .attr("class", "label")
        .attr("x", 50)
        .attr("y", 445)
        .style("text-anchor", "start")
        .text("Central Sierra");

    svg.append("circle")
        .attr("r", 5)
        .attr("cx", 10)
        .attr("cy", 460)
        .style("fill", "#ffcc66");

    svg.append("text")
        .attr("class", "label")
        .attr("x", 50)
        .attr("y", 465)
        .style("text-anchor", "start")
        .text("Central Valley");

    svg.append("circle")
        .attr("r", 5)
        .attr("cx", 10)
        .attr("cy", 480)
        .style("fill", "#00cc66");

    svg.append("text")
        .attr("class", "label")
        .attr("x", 50)
        .attr("y", 485)
        .style("text-anchor", "start")
        .text("Los Angeles");

    svg.append("circle")
        .attr("r", 5)
        .attr("cx", 10)
        .attr("cy", 500)
        .style("fill", "#cc0099");

    svg.append("text")
        .attr("class", "label")
        .attr("x", 50)
        .attr("y", 505)
        .style("text-anchor", "start")
        .text("Central Coast");

    svg.append("circle")
        .attr("r", 5)
        .attr("cx", 10)
        .attr("cy", 520)
        .style("fill", "#ff6600");

    svg.append("text")
        .attr("class", "label")
        .attr("x", 50)
        .attr("y", 525)
        .style("text-anchor", "start")
        .text("Orange");

    svg.append("circle")
        .attr("r", 5)
        .attr("cx", 10)
        .attr("cy", 540)
        .style("fill", "#006666");

    svg.append("text")
        .attr("class", "label")
        .attr("x", 50)
        .attr("y", 545)
        .style("text-anchor", "start")
        .text("Inland Empire");

    svg.append("circle")
        .attr("r", 5)
        .attr("cx", 10)
        .attr("cy", 560)
        .style("fill", "#660066");

    svg.append("text")
        .attr("class", "label")
        .attr("x", 50)
        .attr("y", 565)
        .style("text-anchor", "start")
        .text("Imperial");

    // legend specifications placed below for color and continent
    svg.append("rect")
        .attr("x", width-220)
        .attr("y", 360)
        .attr("width", 220)
        .attr("height", 180)
        .attr("fill", "lightgrey")
        .style("stroke-size", "1px");

    svg.append("circle")
        .attr("r", 8)
        .attr("cx", width-170)
        .attr("cy", 400)
        .style("fill", "white");

    svg.append("circle")
        .attr("r", 13)
        .attr("cx", width-170)
        .attr("cy", 430)
        .style("fill", "white");

    svg.append("circle")
        .attr("r", 17)
        .attr("cx", width-170)
        .attr("cy", 470)
        .style("fill", "white");

    svg.append("text")
        .attr("class", "label")
        .attr("x", width-30)
        .attr("y", 405)
        .style("text-anchor", "end")
        .text("1 to 10 Million");

    svg.append("text")
        .attr("class", "label")
        .attr("x", width-20)
        .attr("y", 435)
        .style("text-anchor", "end")
        .text("10 to 50 Million");

    svg.append("text")
        .attr("class", "label")
        .attr("x", width-20)
        .attr("y", 475)
        .style("text-anchor", "end")
        .text("Above 50 Million");

    svg.append("text")
        .attr("class", "label")
        .attr("x", width -100)
        .attr("y", 520)
        .style("text-anchor", "middle")
        .style("fill", "Green")
        .attr("font-size", "22px")
        .text("Population");
}

// legend for regions split of data
function legend2(){
    svg.append("circle")
        .attr("r", 5)
        .attr("cx", 10)
        .attr("cy", 1500)
        .style("fill", "#8a00e6");

    svg.append("text")
        .attr("class", "label")
        .attr("x", 50)
        .attr("y",1505)
        .style("text-anchor", "start")
        .text("Upstate California");

    svg.append("circle")
        .attr("r", 5)
        .attr("cx", 10)
        .attr("cy", 1520)
        .style("fill", "#0099ff");

    svg.append("text")
        .attr("class", "label")
        .attr("x", 50)
        .attr("y", 1525)
        .style("text-anchor", "start")
        .text("Sacramento");

    svg.append("circle")
        .attr("r", 5)
        .attr("cx", 10)
        .attr("cy", 1540)
        .style("fill", "#339966");

    svg.append("text")
        .attr("class", "label")
        .attr("x", 50)
        .attr("y", 1545)
        .style("text-anchor", "start")
        .text("Bay Area");

    svg.append("circle")
        .attr("r", 5)
        .attr("cx", 10)
        .attr("cy", 1560)
        .style("fill", "#ff66cc");

    svg.append("text")
        .attr("class", "label")
        .attr("x", 50)
        .attr("y", 1565)
        .style("text-anchor", "start")
        .text("Central Sierra");

    svg.append("circle")
        .attr("r", 5)
        .attr("cx", 10)
        .attr("cy", 1580)
        .style("fill", "#ffcc66");

    svg.append("text")
        .attr("class", "label")
        .attr("x", 50)
        .attr("y", 1585)
        .style("text-anchor", "start")
        .text("Central Valley");

    svg.append("circle")
        .attr("r", 5)
        .attr("cx", 10)
        .attr("cy", 1600)
        .style("fill", "#00cc66");

    svg.append("text")
        .attr("class", "label")
        .attr("x", 50)
        .attr("y", 1605)
        .style("text-anchor", "start")
        .text("Los Angeles");

    svg.append("circle")
        .attr("r", 5)
        .attr("cx", 10)
        .attr("cy", 1620)
        .style("fill", "#cc0099");

    svg.append("text")
        .attr("class", "label")
        .attr("x", 50)
        .attr("y", 1625)
        .style("text-anchor", "start")
        .text("Central Coast");

    svg.append("circle")
        .attr("r", 5)
        .attr("cx", 10)
        .attr("cy", 1640)
        .style("fill", "#ff6600");

    svg.append("text")
        .attr("class", "label")
        .attr("x", 50)
        .attr("y", 1645)
        .style("text-anchor", "start")
        .text("Orange");

    svg.append("circle")
        .attr("r", 5)
        .attr("cx", 10)
        .attr("cy", 1660)
        .style("fill", "#006666");

    svg.append("text")
        .attr("class", "label")
        .attr("x", 50)
        .attr("y", 1665)
        .style("text-anchor", "start")
        .text("Inland Empire");

    svg.append("circle")
        .attr("r", 5)
        .attr("cx", 10)
        .attr("cy", 1680)
        .style("fill", "#660066");

    svg.append("text")
        .attr("class", "label")
        .attr("x", 50)
        .attr("y", 1685)
        .style("text-anchor", "start")
        .text("Imperial");

    // legend specifications placed below for color and continent
    svg.append("rect")
        .attr("x", width-220)
        .attr("y", 1490)
        .attr("width", 220)
        .attr("height", 180)
        .attr("fill", "lightgrey")
        .style("stroke-size", "1px");

    svg.append("circle")
        .attr("r", 8)
        .attr("cx", width-170)
        .attr("cy", 1540)
        .style("fill", "white");

    svg.append("circle")
        .attr("r", 13)
        .attr("cx", width-170)
        .attr("cy", 1570)
        .style("fill", "white");

    svg.append("circle")
        .attr("r", 17)
        .attr("cx", width-170)
        .attr("cy", 1610)
        .style("fill", "white");

    svg.append("text")
        .attr("class", "label")
        .attr("x", width-30)
        .attr("y", 1545)
        .style("text-anchor", "end")
        .text("1 to 90,000");

    svg.append("text")
        .attr("class", "label")
        .attr("x", width-20)
        .attr("y", 1575)
        .style("text-anchor", "end")
        .text("10 to 1 Million");

    svg.append("text")
        .attr("class", "label")
        .attr("x", width-20)
        .attr("y", 1615)
        .style("text-anchor", "end")
        .text("Above 10 Million");

    svg.append("text")
        .attr("class", "label")
        .attr("x", width -100)
        .attr("y", 1655)
        .style("text-anchor", "middle")
        .style("fill", "Green")
        .attr("font-size", "22px")
        .text("Population");
}