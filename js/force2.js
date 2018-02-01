var width = window.innerWidth,
    height = window.innerHeight;

var svg = d3.select("body").append("svg").attr("width", width).attr("height", height),
  node = svg.append("g").attr("stroke", "#fff").attr("stroke-width", 1.5).selectAll(".node");

var scaleX = d3.scaleLinear();
var scaleY = d3.scaleLinear().range([height - (height / 3), height / 3]);

var simulation = d3.forceSimulation()
    .force("forceX", d3.forceX().strength(.5).x(width / 2))
    .force("center", d3.forceCenter().x(width/2).y(height/2))
    .force("charge", d3.forceManyBody().strength(-100));

// set up the tip
$("body").append("<div class='tip'></div>");
$(".tip").hide();

d3.csv("data/demo.csv", types, function(error, nodes){

  if (error) throw error;

  scaleX.range([4, width /nodes.length * 3]).domain(d3.extent(nodes, function(d){ return d.size; }));

  var pctExtent = d3.extent(nodes, function(d){ return d.pct; });
  var minExtent = d3.min([pctExtent[0]*-1, pctExtent[1]]);
  var newArray = [minExtent*-1, minExtent];
  scaleY.domain(newArray);

  restart(nodes);

  function restart(nodes) {

    // transition
    var t = d3.transition()
        .duration(750);

    // voronoi tesselation
    var voronoi = d3.voronoi()
				.extent([[0, 0], [width, height]])
        .x(function(d) { return d.x; })
        .y(function(d) { return d.y; });

		var voronoiGroup = svg.append("g")
				.attr("class", "voronoi");

    // JOIN
    node = node.data(nodes, function(d) { return strings.toSlugCase(d.scheme); });

    // EXIT
    node.exit()
        .style("fill", "#b26745")
      .transition(t)
        .attr("r", 1e-6)
        .remove();

    // UPDATE
    node
        .transition(t)
          .style("fill", "#3a403d")
          .attr("r", function(d){ return scaleX(d.size); });

    // ENTER
    node = node.enter().append("circle")
        .attr("class", function(d){ return "circle " + strings.toSlugCase(d.scheme); })
        .style("fill", function(d){ return colorize(d.pct)})
        .attr("r", function(d){ return scaleX(d.size); })
        .merge(node);

    simulation
        .nodes(nodes)
        .force("forceY", d3.forceY().strength(2).y(function(d){ return scaleY(d.pct); }))
        .force("collide", d3.forceCollide().strength(.1).radius(function(d){ return scaleX(d.size) }).iterations(10))
        .on("tick", function(d){

          node
              .attr("cx", function(d){ return d.x; })
              .attr("cy", function(d){ return d.y; })
              .on("mousemove", tipShow)
              .on("mouseout", tipHide);

          voronoi
              .x(function(d) { return d.x; })
              .y(function(d) { return d.y; });

          voronoiGroup.selectAll("path")
              .data(voronoi(nodes).polygons())
            .enter().append("path")
              .attr("class", function(d){ if (d) return "voronoi " + strings.toSlugCase(d.data.scheme); });

          voronoiGroup.selectAll("path")
              .attr("d", function(d) { return d ? "M" + d.join("L") + "Z" : null; })
              .on("mousemove", function(d){
                tipShow(d.data)
              })
              .on("mouseout", tipHide);

        });
  }

});

function colorize(n){
  if (n < -25){
    return "#d7191c";
  } else if (n >= -25 && n < -5){
    return "#fdae61";
  } else if (n >= -5 && n <= 5){
    return "#888";
  } else if (n > 5 && n <= 25){
    return "#a6d96a";
  } else {
    return "#1a9641"
  }
}

function tipShow(d){

  $(".tip").empty();

  // show
  d3.select("." + strings.toSlugCase(d.scheme)).moveToFront();
  d3.selectAll(".text").moveToFront();
  $(".tip").show();
  $(".circle").removeClass("highlight");
  $("." + strings.toSlugCase(d.scheme)).addClass("highlight");

  // populate
  $(".tip").append("<div class='name'>" + d.scheme + "</div>");
  $(".tip").append("<div class='ministry'>" + d.ministry + "</div>");
  $(".tip").append("<table></table>");
  $(".tip table").append("<thead><td>2016-17 (Rs)</td><td>2017-18 (Rs)</td><td>Change</td></thead>");
  $(".tip table").append("<tr class='data'><td>" + d["re16-17"] + " cr</td><td>" + d["be17-18"] + " cr</td><td style='color:" + colorize(d.pct) + "'>" + strings.numberDecimals(d.real_pct, 2) + "%</td></tr>");

  // position
  // calculate top
  function calcTop(d){

    var y = d.y;
    var h = $(".tip").height();
    var ot = $("svg").offset().top;
    var st = $(window).scrollTop();
    var r = scaleX(d.size);
    var t = y - r - h - 20 + ot - st;

    if (t < 40){
      t = y + r + 10;
      $(".tip").addClass("bottom").removeClass("top");
    } else {
      $(".tip").addClass("top").removeClass("bottom");
    }

    return t;
  }

  var x = d.x;
  var r = scaleX(d.size);
  var w = $(".tip").width();
  var l = x - w / 2;

  $(".tip").css({
    top: calcTop(d),
    left: l
  });
  $(window).resize(function(){
    $(".tip").css({
      top: calcTop(d),
      left: l
    });
  });

}
function tipHide(d){
  if ($('.tip:hover').length == 0) {
    $(".circle").removeClass("highlight");
    $(".tip").hide();
  }
}

function types(d){
  d.size = +d["be17-18"];
  var check = (d["be17-18"] - d["re16-17"]);
  var x = check > 0 ? check / d["re16-17"] * 100 : (d["re16-17"] - d["be17-18"]) / d["be17-18"] * -100;
  d.pct = x;
  d.real_pct = check / d["re16-17"] * 100;
  return d;
}
