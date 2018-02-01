var path = "data/data.csv";

$(document).ready(function(){
  d3.csv(path, types, callback);
});

// DATA FUNCTIONS
function types(d){

  d["be18-19"] = isNaN(+d["2018-19 (BE)"]) ? 0 : +d["2018-19 (BE)"];
  d["re17-18"] = isNaN(+d["2017-18 (RE)"]) ? 0 : +d["2017-18 (RE)"];

  d.a = d["re17-18"] == 0 ? "N/A" : "Rs " + strings.numberLakhs(d["re17-18"].toString()) + " crore";
  d.b = d["be18-19"] == 0 ? "N/A" : "Rs " + strings.numberLakhs(d["be18-19"].toString()) + " crore";
  return d;
}

function callback(error, data){
  if (error) throw error;

  // create an array with all the ministries
  var ministries = createMinistriesArray(data);

  createCategorySearch(data);

  ministries.forEach(function(d, i){
    $("#ministries-wrapper").append("<div class='ministry ministry-" + i + " " + d.slug + "'></div>");
    $(".ministry.ministry-" + i).append("<div class='ministry-icon'><i class='fa " + d.icon + "' aria-hidden='true'></i></div>")
    $(".ministry.ministry-" + i).append("<div class='ministry-name'>" + d.name + "</div>");
    $(".ministry.ministry-" + i).append("<div class='schemes-wrapper'></div>");

    d.schemes.forEach(function(s, j){
      var t = getSchemeStatus(s);

      if (t.status != undefined){
        $(".ministry.ministry-" + i + " .schemes-wrapper").append("<div class='scheme scheme-" + j + " " + strings.toSlugCase(s.scheme) + "'></div>");
        $(".ministry.ministry-" + i + " .schemes-wrapper .scheme-" + j).append("<div class='scheme-name'>" + s.scheme + "</div>");
        $(".ministry.ministry-" + i + " .schemes-wrapper .scheme-" + j).append("<div class='scheme-status " + strings.toSlugCase(t.status) + "'>" + t.status.toUpperCase() + "</div>")
        $(".ministry.ministry-" + i + " .schemes-wrapper .scheme-" + j).append("<table class='scheme-table'><thead><td>Revised Estimate, 2017-18</td><td>Budget Estimate, 2018-19</td><td>Change</td></thead><tr><td>" + s.a + "</td><td>" + s.b + "</td><td class='" + strings.toSlugCase(t.status) + "'>" + t.change + "</td></tr></div>")
        if (s.description != undefined){
          $(".ministry.ministry-" + i + " .schemes-wrapper .scheme-" + j).append("<div class='scheme-description'>" + s.description + "</div>")
        }
      }
    });
  });

  $("#search").keyup(function(e){

    if (e.which == 13) filterSchemes($(this).val());
  });
  $(document).on("click", ".ui-menu .ui-menu-item", function(){
    filterSchemes($("#search").val());
  });

  $("#search-status .option-status").click(function(){

    if ( $(this).hasClass("active") ) {
      $(".scheme").show();
      $(".ministry").show();
      $("#no-matches").hide();
      $(this).removeClass("active");
    } else {
      $("#search-status .option-status").removeClass("active");
      $(this).addClass("active");
      filterStatus($(this).attr("data-status"));
    }

  });

  // affixing the search
  $("#search-wrapper").affix({
    offset: {
      top: $("#search-wrapper").offset().top - 50
    }
  });
  affix();
  $(window).scroll(function(){
    affix();
  });
  function affix(){
    if ( $("#search-wrapper").hasClass("affix") ) {
      $("body").css("padding-top", $("#search-wrapper").height() + 40)
    } else {
      $("body").css("padding-top", "0px")
    }
  }

}

// RANDOM FUNCTIONS

// create a search box to filter the schemes
// uses jquery ui and a little plug in called catcomplete
function createCategorySearch(data){
  var items = [];
  data.forEach(function(d){
    items.push({label: d.scheme, category: d.category})
  });
  $("#search").catcomplete({
    source: items
  });
}

// create an array with all the ministries
// returns an object with the ministry name and a slug
function createMinistriesArray(data){
  var icons = {
    "Centrally Sponsored Schemes": "fa-home",
    "Major Central Sector Schemes": "fa-home",
  }
  var arr = [];
  var names = _.chain(data).pluck("category").uniq().value().sort(); // get unique values of all ministries
  names.forEach(function(d){
    arr.push({
      name: d,
      icon: "fa-home",
      slug: strings.toSlugCase(d),
      schemes: _.where(data, {category: d})
    });
  });
  return arr;
}

// returns the status of the scheme based on its percentage increase or decrease
function getSchemeStatus(scheme){

  var change = (scheme["be18-19"] - scheme["re17-18"]) / scheme["re17-18"] * 100;
  change = change == Infinity ? change : +strings.numberDecimals(change, 2);
  var status;
  // if (change < -50) {
  //   status = "slashed";
  // }
  if (change < 0) {
    status = "decreased";
  } else if (change == 0) {
    status = "unchanged";
  } else if (change > 0 && change != Infinity) {
    status = "increased";
  // } else if (change > 100 && change != Infinity) {
  //   status = "more than doubled";
  } else if (change == Infinity){
    status = "new scheme";
    change = "N/A";
  }

  return {change: change == "N/A" ? change : change + "%", status: status};
}

// filters the schemes displaying based on the user search
function filterSchemes(scheme){

  $("#search-status .option-status").removeClass("active");
  $("#no-matches").hide();

  if (scheme != ""){
    var slug = strings.toSlugCase(scheme);
    $(".scheme").hide();
    $(".ministry").hide();

    if ($("." + slug).length != 0){
      $("." + slug).show();
      $("." + slug).closest(".ministry").show();
    } else {
      $("#no-matches").show();
    }

  } else {
    $(".scheme").show();
    $(".ministry").show();
  }

}

// filter schemes by status
function filterStatus(status){

  $("#search").val("")
  $(".scheme").hide();
  $(".ministry").hide();
  $("#no-matches").hide();

  $(".scheme-status." + status).closest(".scheme").show();
  $(".scheme-status." + status).closest(".ministry").show();

  if ($("#ministries-wrapper").height() == 0) {
    $("#no-matches").show();
  }

}