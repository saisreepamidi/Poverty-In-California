
//Variable Declaration
//City,Region,Population,Poverty 
var svg, grossScale;
var cities = [];

// Dimensions of screen and circle sizes
var width = 1020,         // width of visualization 
    height = 1080,        // height of visualization
    padding = 3,          // separation between same-color circles
    clusterPadding = 6,   // separation between different-color circles
    maxRadius  = 17,      // maximum size of a circle
    medRadius = 13,       // medium radius of a circle
    minRadius = 8,        // minimum size of a circle
    margin = 50;

// Parsing of data set csv file
d3.csv("povertyRate.csv", function(data) {
    //cities = data;
    for (var key in data) {
        cities.push(data[key]);       
    }
    cities.forEach(function(d) {
        d.Poverty = +d.Poverty; 
        d.Region = d.Region; 
        d.Population = +d.Population;
        
    });
    initialize("Poverty");
    addScale();
});

/* This function will create the visualization based on the category selected by the user */
function initialize(category){
    
    // removes pre-existing data visualization
    d3.selectAll("svg").remove(); 
    
        var categories = d3.map(cities, function(d) { return d.category; });
        var m = 50;
        var n = cities.length; 
    
        var minGross = d3.min(cities, function(d){ return d.Poverty; });
        var maxGross = d3.max(cities, function(d){ return d.Poverty; });

        var clusters = new Array(m);
        
        var nodes = cities.map(function(currentValue, index) {
                
              if(currentValue.Population < 90000) {r = minRadius} 
              else if(currentValue.Population > 100000 && currentValue.Population <= 1000000) {r = medRadius}
              else{r = maxRadius}               
             
              var i = currentValue[category], 
              d = {cluster: i, 
                   radius: r, 
                   City: currentValue.City,
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
                                         if(d.Region == "Upstate California") return d3.rgb("#8a00e6"); 
                                         if(d.Region == "Sacramento") return d3.rgb("#0099ff");
                                         if(d.Region == "Bay Area") return d3.rgb("#339966");
                                         if(d.Region == "Central Sierra") return d3.rgb("#ff66cc");
                                         if(d.Region == "Central Valley") return d3.rgb("#ffcc66");
                                         if(d.Region == "Los Angeles") return d3.rgb("#00cc66");
                                         if(d.Region == "Central Coast") return d3.rgb("#cc0099");
                                         if(d.Region == "Orange") return d3.rgb("#ff6600");
                                         if(d.Region == "Inland Empire") return d3.rgb("#006666");
                                         if(d.Region == "Imperial") return d3.rgb("#660066");
                                        
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
    
        /* Adding mouseover functions to the tooltip so that it appears
         * only when the user's mouse is over a node, and text changes accordingly
         * to match the movie the user is hovering over
         */
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
            // math for clustering
            var yTemp;
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

/* code adapted from https://bl.ocks.org/mbostock/3885304 */
function addScale(){
    svg.selectAll(".legend").remove();
    //grossScale = d3.scale.log().range([0, width-140]);
    grossScale = d3.scale.linear()
        .range([0+margin, width-margin]);
    
    var xAxis = d3.svg.axis()
        .scale(grossScale)
        .orient("bottom")
        .ticks(12, " ");
    
        
    grossScale.domain([d3.min(cities, function(d) { return d.Poverty; }), 
              d3.max(cities, function(d) { return d.Poverty; })]);
    
    svg.append("g")
        .attr("class", "x axis")
        .call(xAxis)
        .attr("transform", "translate(100,"+210+")")
    
    svg.append("text")
        .attr("class", "label")
        .attr("x", (width/2) + 150)
        .attr("y", 230)
        .style("text-anchor", "end")
        .text("Poverty in California");
     
    legend();
};
 
/* code adapted from https://bl.ocks.org/mbostock/3885304 */

// for Region split up
function addScale2(){
     svg.selectAll(".legend").remove();
     //grossScale = d3.scale.log().domain([300, 1e9]).range([0, width]);
    grossScale = d3.scale.linear()
        .range([0+margin, width-margin]);
    
    var xAxis = d3.svg.axis()
        .scale(grossScale)
        .orient("bottom")
        .ticks(14, " ")

    grossScale.domain([d3.min(cities, function(d) { return d.Poverty; }), 
              d3.max(cities, function(d) { return d.Poverty; })]);
    
    svg.append("g")
        .attr("class", "x axis")
        .call(xAxis)
        .attr("transform", "translate(100,"+150+")")
    
    svg.append("text")
        .attr("class", "label")
        .attr("x", (width/2))
        .attr("y", 170)
        .style("text-anchor", "center")
        .text("Sacramento");
    
    svg.append("g")
        .attr("class", "x axis")
        .call(xAxis)
        .attr("transform", "translate(100,"+300+")")
    
    svg.append("text")
        .attr("class", "label")
        .attr("x", (width/2))
        .attr("y", 320)
        .style("text-anchor", "center")
        .text("Los Angeles");
    
    svg.append("g")
        .attr("class", "x axis")
        .call(xAxis)
        .attr("transform", "translate(100,"+450+")")
    
    svg.append("text")
        .attr("class", "label")
        .attr("x", (width/2))
        .attr("y", 470)
        .style("text-anchor", "center")
        .text("Bay Area Region ");
    
    svg.append("g")
        .attr("class", "x axis")
        .call(xAxis)
        .attr("transform", "translate(100,"+600+")")
    
    svg.append("text")
        .attr("class", "label")
        .attr("x", (width/2))
        .attr("y", 620)
        .style("text-anchor", "center")
        .text("Central Sierra");
    
    svg.append("g")
        .attr("class", "x axis")
        .call(xAxis)
        .attr("transform", "translate(100,"+750+")")
    
    svg.append("text")
        .attr("class", "label")
        .attr("x", (width/2))
        .attr("y", 770)
        .style("text-anchor", "center")
        .text("Upstate California");
    
    svg.append("g")
        .attr("class", "x axis")
        .call(xAxis)
        .attr("transform", "translate(100,"+900+")")
    
    svg.append("text")
        .attr("class", "label")
        .attr("x", (width/2))
        .attr("y", 920)
        .style("text-anchor", "center")
        .text("Central Sierra")
    
    svg.append("g")
        .attr("class", "x axis")
        .call(xAxis)
        .attr("transform", "translate(100,"+1050+")")
    
    svg.append("text")
        .attr("class", "label")
        .attr("x", (width/2))
        .attr("y", 1070)
        .style("text-anchor", "center")
        .text("Imperial")
    
    svg.append("g")
        .attr("class", "x axis")
        .call(xAxis)
        .attr("transform", "translate(100,"+1150+")")
    
    svg.append("text")
        .attr("class", "label")
        .attr("x", (width/2))
        .attr("y", 1170)
        .style("text-anchor", "center")
        .text("Central Valley")
    
    legend();
};

function genreClick(elem){
   var buttons = document.getElementsByClassName("navbar-item");
    for(i = 0; i < buttons.length; ++i){
        buttons[i].style.backgroundColor="black";
    }
    elem.style.backgroundColor="orange";
    initialize("Region");
    addScale2();
};

// navigation button functions
function grossClick(elem){
    var buttons = document.getElementsByClassName("navbar-item");
    for(i = 0; i < buttons.length; ++i){
        buttons[i].style.backgroundColor="black";
    }
    elem.style.backgroundColor="orange";
    initialize("Poverty");
    addScale();
};



///////////////////////////////////////////////////////////////////////////////
// legend specifications placed below for color and continent
function legend(){
    svg.append("circle")
        .attr("r", 5)
        .attr("cx", 10)
        .attr("cy", 960)
        .style("fill", "#339966");
    
     svg.append("text")
        .attr("class", "label")
        .attr("x", 50)
        .attr("y",965)
        .style("text-anchor", "start")
        .text("Africa");
    
    svg.append("circle")
        .attr("r", 5)
        .attr("cx", 10)
        .attr("cy", 980)
        .style("fill", "#8a00e6");
    
     svg.append("text")
        .attr("class", "label")
        .attr("x", 50)
        .attr("y", 985)
        .style("text-anchor", "start")
        .text("Asia");
    
    svg.append("circle")
        .attr("r", 5)
        .attr("cx", 10)
        .attr("cy", 1000)
        .style("fill", "#ff66cc");
    
     svg.append("text")
        .attr("class", "label")
        .attr("x", 50)
        .attr("y", 1005)
        .style("text-anchor", "start")
        .text("North America");
    
    svg.append("circle")
        .attr("r", 5)
        .attr("cx", 10)
        .attr("cy", 1020)
        .style("fill", "#ffcc66");
    

     svg.append("text")
        .attr("class", "label")
        .attr("x", 50)
        .attr("y", 1025)
        .style("text-anchor", "start")
        .text("South America");
    
    svg.append("circle")
        .attr("r", 5)
        .attr("cx", 10)
        .attr("cy", 1040)
        .style("fill", "#0099ff");
    
     svg.append("text")
        .attr("class", "label")
        .attr("x", 50)
        .attr("y", 1045)
        .style("text-anchor", "start")
        .text("Europe");
    
    svg.append("circle")
        .attr("r", 5)
        .attr("cx", 10)
        .attr("cy", 1060)
        .style("fill", "#cc0099");
    
     svg.append("text")
        .attr("class", "label")
        .attr("x", 50)
        .attr("y", 1065)
        .style("text-anchor", "start")
        .text("");
    
    // legend specifications placed below for color and continent
    svg.append("rect")
        .attr("x", width-220)
        .attr("y", 950)
        .attr("width", 220)
        .attr("height", 260)
        .attr("fill", "lightgrey")
        .style("stroke-size", "1px");

    svg.append("circle")
        .attr("r", 8)
        .attr("cx", width-170)
        .attr("cy", 970)
        .style("fill", "white");

    svg.append("circle")
        .attr("r", 13)
        .attr("cx", width-170)
        .attr("cy", 1000)
        .style("fill", "white");

    svg.append("circle")
        .attr("r", 17)
        .attr("cx", width-170)
        .attr("cy", 1040)
        .style("fill", "white");

    svg.append("text")
        .attr("class", "label")
        .attr("x", width-20)
        .attr("y", 975)
        .style("text-anchor", "end")
        .text("1 to 10 Million");

    svg.append("text")
        .attr("class", "label")
        .attr("x", width-20)
        .attr("y", 1005)
        .style("text-anchor", "end")
        .text("10 to 50 Million");

    svg.append("text")
        .attr("class", "label")
        .attr("x", width-20) 
        .attr("y", 1045)
        .style("text-anchor", "end")
        .text("Above 50 Million");

    svg.append("text")
        .attr("class", "label")
        .attr("x", width -100)
        .attr("y", 1070)
        .style("text-anchor", "middle")
        .style("fill", "Green") 
        .attr("font-size", "18px")
        .text("Population"); 
}