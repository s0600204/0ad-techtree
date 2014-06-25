
var g_CivData = {};

// Page structure
var g_canvas;
var g_canvasParts = { };

// Fetched from Server
var g_treeBranches;	// { }
var g_techPhases;	// { }
var g_techPairs;	// { }
var g_phaseList;	// [ ]
var g_civs;			// { }

// User Input
var g_selectedCiv;	// " "

// Calculated
var g_treeHeads	= [ ];
var g_treeCols	= { };
var g_bonuses	= [ ];

/* Runs on Page Load */
function init(settings)
{
	g_canvas = SVG('svg_canvas');
	
	server.load();
	
	populateCivSelect();
	
	selectCiv(document.getElementById('civSelect').value);
}

// Fetch the data from the server
server = {
	out: null,
	
	load: function () {
		server._http_request();
		g_treeBranches	= server.out["branches"];
		g_techPhases	= server.out["phases"];
		g_techPairs		= server.out["pairs"];
		g_phaseList		= server.out["phaseList"];
		g_civs			= server.out["civs"];
	},
	
	_http_request: function () {
		
		server.out = "";	
		
		http_request = new XMLHttpRequest();
		http_request.onreadystatechange = function () {
			if (http_request.readyState === 4) {
				if (http_request.status === 200) {
					try {
						server.out = JSON.parse(http_request.responseText);
					} catch (e) {
						console.log(http_request.responseText);
					}
				} else {
					alert ('There was a problem with the request.');
					server.out = false;
				}
			}
		}
		http_request.open('POST', 'http://127.0.0.1:88/0ad/techtree/x/dataparse.php', false);
		http_request.send();
	}
}

// Called when user selects civ from dropdown
function selectCiv(code)
{
	g_selectedCiv = code;
	compileHeads ();
	draw3();
	
	console.log("(civ select) '"+code+"' selected.");
}

// Compile list of heads (branches with no reqs)
function compileHeads ()
{
	
	console.log("(civ select) Calculating starting points of tree");
	
	for (var phase in g_phaseList)
	{
		phase = g_phaseList[phase];
		g_treeCols[phase] = [ ];
		g_treeCols[phase][0] = [ ];
	}
	g_bonuses = [ ];
	g_treeHeads = [ ];
	
	for (var techCode in g_treeBranches)
	{
		if (techCode.slice(0, 4) !== "pair" && techCode.slice(0, 5) !== "phase")
		{
			var reqs = getReqs(techCode);
			if (reqs === false)
			{
				// this is a tech that is specific to a different civ
				continue;
			}
			var phase = getPhase(techCode);
			
			var col = 0;
			if (reqs.length == 0)
			{
				if (g_treeBranches[techCode].autoResearch !== undefined
					&& g_treeBranches[techCode].autoResearch == true)
				{
					g_bonuses.push(techCode);
					continue;
				}
				else
				{
					// If this tech is generic, check for a civ specific override
					if (techCode.indexOf("/") == -1 && hasCivSpecificOverride(techCode)) {
						continue;
					}
					
					g_treeHeads.push(techCode);
				}
			}
			else
			{
				// work out where in each phase it sits
				var tmpCode = techCode;
				var tmpReqs = reqs;
				while (tmpReqs.length > 0)
				{
					tmpCode = tmpReqs[0];
					if (getPhase(tmpCode) == phase)
					{
						col++;
					} else {
						break;
					}
					tmpReqs = getReqs(tmpCode);
				}
				if (g_treeCols[phase][col] == undefined)
				{
					g_treeCols[phase][col] = [ ];
				}
			}
			
			g_treeCols[phase][col].push(techCode);
			
			// Sort unlocks by name
			if (g_treeBranches[techCode].unlocks.length > 0)
			{
				g_treeBranches[techCode].unlocks.sort(sortTechByName);
			}
		}
	}
	
	// sort the heads
	for (var phase in g_treeHeads) {
		g_treeHeads.sort(sortTechByName);
	}
}

function getPhase (techCode)
{
	var reqs = getReqs(techCode, false);
	if (reqs.length > 0 && reqs[0].slice(0, 5) == "phase")
	{
		return reqs[0];
	}
	return g_phaseList[0];
}

function getReqs (techCode, noPhase)
{
	if (noPhase === undefined) { noPhase = true; }
	
	var reqs = g_treeBranches[techCode].reqs;
	if (reqs[g_selectedCiv] !== undefined)
	{
		reqs = reqs[g_selectedCiv];
	}
	else if (reqs["generic"] !== undefined)
	{
		reqs = reqs["generic"];
	}
	else
	{
		return false;
	}
	
	if (noPhase && reqs.length > 0 && reqs[0].slice(0, 5) == "phase") {
		reqs = reqs.slice(1);
	}
	
	return reqs;
}

function hasCivSpecificOverride (techCode)
{
	var matches = Object.keys(g_treeBranches).filter(function (code) {
			return code.indexOf(techCode) > 0;
		});
	for (var match in matches)
	{
		var civs = Object.keys(g_treeBranches[matches[match]].reqs);
		if (civs.indexOf(g_selectedCiv) > -1)
		{
			return true;
		}
	}
	return false;
}

function sortTechByName (a,b)
{
	a = (hasSpecificName(a)) ? g_treeBranches[a].name.specific[g_selectedCiv] : g_treeBranches[a].name.generic;
	b = (hasSpecificName(b)) ? g_treeBranches[b].name.specific[g_selectedCiv] : g_treeBranches[b].name.generic;
	if (a < b)
		return -1;
	else if (a > b)
		return 1;
	else
		return 0;
}

function hasSpecificName (techCode)
{
	if (techCode.slice(0,5) == "phase") {
		return (typeof(g_techPhases[techCode].name.specific) == "object"
			&& typeof(g_techPhases[techCode].name.specific[g_selectedCiv]) == "string");
	} else {
		return (typeof(g_treeBranches[techCode].name.specific) == "object"
			&& typeof(g_treeBranches[techCode].name.specific[g_selectedCiv]) == "string");
	}
}

function getPhaseTech (phase) {
	if (typeof(g_techPhases[phase+"_"+g_selectedCiv]) == "object")
	{
		return phase+"_"+g_selectedCiv;
	}
	else if (typeof(g_techPhases[phase+"_generic"]) == "object")
	{
		return phase+"_generic";
	}
	else
	{
		return phase;
	}
}

function populateCivSelect () {
	var civList = [];
	var civSelect = document.getElementById('civSelect');
	for (var civ in g_civs) {
		civList.push({
			"name": g_civs[civ].name
		,	"code":	civ
		,	"culture": g_civs[civ].culture
		});
	}
	civList.sort(sortByCultureAndName);
	for (var civ in civList) {
		civ = civList[civ];
		var newOpt = document.createElement('option');
		newOpt.text = (civ.code == civ.culture) ? civ.name : " - "+civ.name;
		newOpt.value = civ.code;
		civSelect.appendChild(newOpt);
	}
}

function draw3 ()
{
	
	console.log("(draw) Drawing tech tree.");
	
	// Clear canvas, then establish framework
	g_canvas.clear();
	g_canvasParts["banner"] = g_canvas.group();
	g_canvasParts["banner"].attr('id', "tree__banner");
	g_canvasParts["bonus"] = g_canvas.group();
	g_canvasParts["bonus"].attr('id', "tree__bonus");
	g_canvasParts["techs"] = g_canvas.group();
	g_canvasParts["techs"].attr('id', "tree__techs");
	g_canvasParts["deplines"] = g_canvas.group();
	g_canvasParts["deplines"].attr('id', "tree__deplines");
	
	// Title
	var civEmblem = g_canvasParts["banner"].image("./art/textures/ui/"+g_civs[g_selectedCiv].emblem);
	civEmblem.attr({
		'x': 4
	,	'y': 4
	,	'height': 80 - 8
	,	'width': 80 - 8
	});
	var civName = g_canvasParts["banner"].text(g_civs[g_selectedCiv].name);
	civName.attr({
		'x': 84
	,	'y': 24
	,	'font-size': 24
	,	'leading': 1
	});
	
	var margin = 4;		// margin between techboxes (mainly vertical)
	var bonusY = 80;
	
	// Bonuses
	if (g_bonuses.length > 0)
	{
		var bonusX = window.innerWidth / 2;
		var wid = (bonusX - 24) / g_bonuses.length;
		g_canvasParts["bonus"].move(bonusX, 4);
		for (var bonus in g_bonuses)
		{
			var bb = bonusbox((wid+margin)*bonus, margin, wid, g_bonuses[bonus]);
			if (bb.bbox().height > bonusY)
			{
				bonusY = bb.bbox().height + margin * 2;
			}
		}
	}
	
	g_canvasParts["techs"].move(4, bonusY);
	g_canvasParts["deplines"].move(4, bonusY);
	
	var wid = 256;		// column width
	var gap = 64;		// gap between columns
	var colHei = [ ];	// heights of the columns
	
	// Set initial column heights and draw phase techs
	for (var phase in g_treeCols)
	{
		if (typeof(g_techPhases[getPhaseTech(phase)].tooltip) == "string")
		{
			var pb = techbox(
					(gap+wid) * colHei.length + margin,
					margin,
					(wid+gap)*(g_treeCols[phase].length)-gap,
					getPhaseTech(phase)
				);
		}
		
		for (var stage in g_treeCols[phase])
		{
			colHei.push((pb !== undefined)?pb.bbox().height+margin*2:(gap+wid));
		}
	}
	
	// Travels recursively down a branch, drawing its techs
	followBranch = function (techCode, parentCol)
	{
		// If it already exists, then we don't need to draw it again, obviously
		if (document.getElementById(techCode+'__box'))
			return;
		
		// Work out which column we're in
		var myCol = matchTech2Column(techCode);
		
		if (myCol > parentCol && colHei[myCol] < colHei[parentCol])
		{
			colHei[myCol] = colHei[parentCol];
		}
		
		// Draw the tech in a box
		var tb = techbox(((wid+gap)*myCol)+margin, colHei[myCol]+margin, wid, techCode);
		
		// 
		var myHeight = tb.bbox().height + margin;
		
		// If the tech has a pair, draw them together
		if (typeof(g_treeBranches[techCode].pair) == "string")
		{
			var techPair = g_treeBranches[techCode].pair;
			if (g_techPairs[techPair] !== undefined)
			{
				tb.dy(margin);
				
				techPair = g_techPairs[techPair].techs;
				techPair = (techCode != techPair[0]) ? techPair[0] : techPair[1];
				tb = techbox(((wid+gap)*myCol)+margin, colHei[myCol]+myHeight+margin*2, wid, techPair);
				myHeight += tb.bbox().height + margin;
				
				var pairBox = g_canvasParts["techs"].rect();
				pairBox.attr({
					'x': ((wid+gap)*myCol)
				,	'y': colHei[myCol] + margin
				,	'width': wid + margin * 2
				,	'height': myHeight + margin
				,	'fill-opacity': 0
				,	'stroke': '#888'
				}).back();
				myHeight += margin * 2;
			}
		}
		
		// Recursively draw any techs that depend on the present tech (and its pair if it has one)
		for (var nextCode in g_treeBranches[techCode].unlocks)
		{
			nextCode = g_treeBranches[techCode].unlocks[nextCode];
			followBranch(nextCode, myCol);
		}
		
		// add our height to the column's height
		colHei[myCol] += myHeight;
	}
	
	// Call above function for each and every tech branch head
	for (var techCode in g_treeHeads)
	{
		techCode = g_treeHeads[techCode];
		followBranch(techCode, -1);
	}
	
	// Draw the dependancy lines
	for (var techCode in g_treeBranches)
	{
		for (var unlocked in g_treeBranches[techCode].unlocks)
		{
			unlocked = g_treeBranches[techCode].unlocks[unlocked];
			if (document.getElementById(techCode+'__box') == undefined || document.getElementById(unlocked+'__box') == undefined)
			{
				continue;
			}
			drawDepLine(techCode, unlocked);
		}
	}
	for (var p=1; p<g_phaseList.length; p++)
	{
		drawDepLine(getPhaseTech(g_phaseList[p-1]), getPhaseTech(g_phaseList[p]))
		
	}
	
	resizeDrawing();
}

function drawDepLine (techA, techB) {
	b1 = document.getElementById(techA+'__box').instance;
	b2 = document.getElementById(techB+'__box').instance;
	
	var line = {
		'x1': b1.bbox().x2
	,	'y1': b1.bbox().y2 - b1.bbox().height/2
	,	'x2': b2.bbox().x
	,	'y2': b2.bbox().y2 - b2.bbox().height/2
	}
	
//	var svgline = g_canvasParts["deplines"].line(line.x1, line.y1, line.x2, line.y2).stroke({'width': 1, 'color': '#088'});	// direct line
	var svgline = g_canvasParts["deplines"].path(
			"M" + line.x1 +","+ line.y1
		+	"Q" + (line.x1+(line.x2-line.x1)/6) +","+ line.y1 +" "+ (line.x2+line.x1)/2 +","+ (line.y2+line.y1)/2
		+	"T" + line.x2 +","+ line.y2
		).attr({'stroke-width': 1, 'stroke': '#088', 'fill-opacity': 0});
}

function matchTech2Column (techCode)
{
	var col = 0;
	for (var phase in g_treeCols)
	{
		for (var stage in g_treeCols[phase])
		{
			if (g_treeCols[phase][stage].indexOf(techCode) > -1) {
				return col;
			}
			col++;
		}
	}
}

bonusbox = function (x, y, w, tc)
{
	if (typeof(tc) !== "string") {
		return;
	} else if (tc.slice(0, 5) == "phase") {
		var techInfo = g_techPhases[tc];
	} else {
		var techInfo = g_treeBranches[tc];
	}
	x = (typeof(x) !== "number") ? 0 : x;
	y = (typeof(y) !== "number") ? 0 : y;
	w = (typeof(w) !== "number") ? 256 : w;
	
	this.box = g_canvasParts["bonus"].group();
	this.box.move(x, y);
	this.box.attr('id', tc+"__box");
	
	this.padding = 2;
	this.font = 14;
	
	this.box_gradient = this.box.gradient('linear', function (stop) {
		stop.at(0, "#CEE");
		stop.at(1, "#088");
	}).from(0,0.25).to(1,0.75);
	
	this.box_frame = this.box.rect();
	this.box_frame.attr({
		'fill': this.box_gradient
	,	'fill-opacity': 0.2
	,	'stroke': '#088'
	,	'stroke-width': 1
	,	'width': w
	,	'height': 64
	});
	
	this.tech_name = this.box.text(techInfo.name.generic);
	this.tech_name.attr({
		'fill': '#000'
	,	'font-size': this.font
	,	'x': this.padding
	,	'y': this.padding
	,	'leading': 1
	});
	
	this.tech_desc = this.box.text(techInfo.description);
	this.tech_desc.attr({
		'fill': '#000'
	,	'font-size': Math.round(this.font * 0.8)
	,	'x': this.padding
	,	'y': this.font + this.padding * 2
	,	'width': w - this.padding * 2
	,	'leading': 1
	});
	this.tech_desc.textWrapped(true);
	
	this.box.elems = {
		'frame': this.box_frame
	,	'name': this.tech_name
	,	'desc': this.tech_desc
	};
	
//	console.log(tc +" "+ this.box.bbox().height);
	this.box_frame.attr('height', Math.round(this.tech_name.bbox().merge(this.tech_desc.bbox()).height)+this.padding);
	
	return this.box;
}

techbox = function (x, y, w, tc)
{
	if (typeof(tc) !== "string") {
		return;
	} else if (tc.slice(0, 5) == "phase") {
		var techInfo = g_techPhases[tc];
	} else {
		var techInfo = g_treeBranches[tc];
	}
	x = (typeof(x) !== "number") ? 0 : x;
	y = (typeof(y) !== "number") ? 0 : y;
	w = (typeof(w) !== "number") ? 256 : w;
	
	this.box = g_canvasParts["techs"].group();
	this.box.move(x, y);
	this.box.attr('id', tc+"__box");
	
	this.padding = 2;
	this.font = 14;
	
	this.box_gradient = this.box.gradient('linear', function (stop) {
		stop.at(0, "#CEE");
		stop.at(1, "#088");
	}).from(0,0.25).to(1,0.75);
	
	this.box_frame = this.box.rect();
	this.box_frame.attr({
//		'fill': '#088'
		'fill': this.box_gradient
	,	'fill-opacity': 0.2
	,	'stroke': '#088'
	,	'stroke-width': 1
	,	'width': w
	,	'height': 64
	});
	
	this.tech_image = this.box.image("./art/textures/ui/session/portraits/technologies/" + techInfo.icon);
	this.tech_image.attr({
		'x': this.padding
	,	'y': this.padding
	,	'height': 32
	,	'width': 32
	});
	
	this.tech_name = this.box.text(techInfo.name.generic);
	this.tech_name.attr({
		'fill': '#000'
	,	'font-size': this.font
	,	'x': this.tech_image.width() + this.padding*2
	,	'y': this.padding
	,	'leading': 1
	});
	if (hasSpecificName(tc))
	{
		this.tech_name.text(techInfo.name.specific[g_selectedCiv])
		this.tech_name.build(true);
		this.tech_name.tspan(" (" + techInfo.name.generic + ")").attr('font-size', Math.round(this.font*0.7));
	}
	
	this.tech_cost = this.box.group();
	this.tech_cost.move(this.tech_image.width() + this.padding*2, this.padding*2+this.font);
	var rcnt = 0;
	for (res in techInfo.cost)
	{
		if (techInfo.cost[res] > 0)
		{
			this.tech_cost.image("./art/textures/ui/session/icons/resources/"+res+"_small.png").attr({'x': rcnt*48});
			this.tech_cost.text(" "+techInfo.cost[res]).attr({'leading':1,'font-size':Math.round(this.font*0.8), 'x': rcnt*48+18, 'y': this.padding});
			rcnt++;
		}
	}
	
	this.tech_tooltip = this.box.text(techInfo.tooltip);
	this.tech_tooltip.attr({
		'fill': '#088'
	,	'font-size': Math.round(this.font * 0.8)
	,	'x': this.padding
	,	'y': this.tech_image.height() + this.padding
	,	'width': w - this.padding * 2
	,	'leading': 1
	});
	this.tech_tooltip.textWrapped(true);
	
	this.tech_desc = this.box.text(techInfo.description);
	this.tech_desc.attr({
		'fill': '#000'
	,	'font-size': Math.round(this.font * 0.8)
	,	'x': this.padding
	,	'y': this.tech_image.height() + this.tech_tooltip.bbox().height
	,	'width': w - this.padding * 2
	,	'leading': 1
	});
	this.tech_desc.textWrapped(true);
	
	this.box.elems = {
		'frame': this.box_frame
	,	'name': this.tech_name
	,	'image': this.tech_image
	,	'desc': this.tech_desc
	,	'tooltip': this.tech_tooltip
	,	'cost': this.tech_cost
	};
	
//	console.log(tc +" "+ this.box.bbox().height);
	this.box_frame.attr('height', Math.round(this.tech_image.bbox().merge(this.tech_desc.bbox()).height)+this.padding);
	
	return this.box;
}

function resizeDrawing ()
{
//	console.log('(draw) Resizing screen real estate');
	
	var bbox = g_canvas.bbox();
	var canvas_ele = document.getElementById('svg_canvas');
	
	canvas_ele.style.width = ((bbox.x2 > window.innerWidth-16) ? Math.round(bbox.x2) + 2 : window.innerWidth-16) + "px";
	canvas_ele.style.height = ((bbox.y2 > window.innerHeight) ? Math.round(bbox.y2) + 2 : window.innerHeight) + "px";
	
//	console.debug("(draw) "+ canvas_ele.style.width +" x "+ canvas_ele.style.height);
}


// Sort by culture, then by code equals culture and then by name ignoring case
function sortByCultureAndName(a, b)
{
	if (a.culture < b.culture)
		return -1;
	if (a.culture > b.culture)
		return 1;

	// Same culture
	// First code == culture
	if (a.code == a.culture)
		return -1;
	if (b.code == b.culture)
		return 1;

	// Then alphabetically by name (ignoring case)
	return sortNameIgnoreCase(a, b);
}

// A sorting function for arrays of objects with 'name' properties, ignoring case
function sortNameIgnoreCase(x, y)
{
	var lowerX = x.name.toLowerCase();
	var lowerY = y.name.toLowerCase();
	
	if (lowerX < lowerY)
		return -1;
	else if (lowerX > lowerY)
		return 1;
	else
		return 0;
}
