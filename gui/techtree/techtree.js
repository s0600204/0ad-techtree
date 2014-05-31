
var g_CivData = {};
var g_TechData = {};
var TEXTCOLOR = "white";
var g_treeBranches = { };
var g_treeHeads = {};
var g_selectedCiv;
var g_phases = [ ];
var g_treeCols = { };
var g_canvas;
var g_canvasParts = { };

function init(settings)
{
	return;
	
	g_TechData = loadTechData();
	g_canvas = SVG('svg_canvas');
	
	initTechList();
	initCivNameList();
}

// Initialize the technology list
function initTechList()
{
	console.log("(build) Tech Tree Branch Generation:");
	/* Branch Generation */
	for (tech in g_TechData)
	{
		g_treeBranches[tech] = { reqs:[ ], unlocks:[ ], phase:"" };
		/*	g_treeBranches[tech] = { reqs:[ ], unlocks:[ ], pair:"", phase:"", civ:"" }	*/
	}
	
	console.log("(build) - First Pass");
	/* First Pass */
	for (techCode in g_treeBranches)
	{
		// Load info for this tech
		techInfo = g_TechData[techCode];
		
		// Determine tech requirements
		if (typeof(techInfo.requirements) == "object")
		{
			var techReq = false;
			g_treeBranches[techCode].civ = [ ];
			
			// Designate civ-specific techs, single civ
			if ("civ" in techInfo.requirements) {
				g_treeBranches[techCode].civ.push(techInfo.requirements.civ);
			}
			if ("tech" in techInfo.requirements)
			{
				techReq = techInfo.requirements["tech"];
			}
			if ("any" in techInfo.requirements)
			{
				for (var req of techInfo.requirements["any"])
				{
					if ("civ" in req)
					{
						g_treeBranches[techCode].civ.push(req["civ"]);
					}
					if ("tech" in req)
					{
						g_treeBranches[techCode].givenCivsOnly = "no";
						techReq = req["tech"];
					} 
				}
			}
			
			if (techReq)
			{
				g_treeBranches[techReq].unlocks.push(techCode);
				if (techReq.slice(0, 5) == "phase")
				{
					g_treeBranches[techCode].phase = techReq;
				}
				else
				{
					// This never gets called!
					// Why? Because if a tech comes immediately after another tech, it uses 'supersedes' instead of 'requirements'
					console.log(techCode, "tech");
					g_treeBranches[dePath(techReq)].reqs.push();
					g_treeBranches[techCode].reqs.push(dePath(techReq));
				}
			}
			
			if (g_treeBranches[techCode].civ.length < 1)
			{
				delete g_treeBranches[techCode].civ;
			}
		}
		
		if (techCode.slice(0, 4) == "pair")
		{
			techInfo.top = dePath(techInfo.top);
			techInfo.bottom = dePath(techInfo.bottom);
			
			g_treeBranches[techCode].techs = [ techInfo.top, techInfo.bottom ];
			if ("supersedes" in techInfo)
			{
				techInfo.supersedes = dePath(techInfo.supersedes);
				
				g_treeBranches[techInfo.supersedes].unlocks.push(techInfo.top);
				g_treeBranches[techInfo.supersedes].unlocks.push(techInfo.bottom);
				
			//	g_treeBranches[techInfo.top].reqs.push(techInfo.supersedes);
			//	g_treeBranches[techInfo.bottom].reqs.push(techInfo.supersedes);
			}
		}
		else if ("supersedes" in techInfo)
		{
			techInfo.supersedes = dePath(techInfo.supersedes);
			g_treeBranches[techCode].reqs.push(techInfo.supersedes);
			g_treeBranches[techInfo.supersedes].unlocks.push(techCode);
		}
		
		// Make note of the designated tech-pair
		if ("pair" in techInfo)
		{
			g_treeBranches[techCode].pair = dePath(techInfo.pair);
		}
	}
	
	console.log("(build) - Second Pass");
	/* Second Pass */
	for (techCode in g_treeBranches)
	{
		// Load unlocks from techs' pairs
		if ("pair" in g_treeBranches[techCode])
		{
			pairName = g_treeBranches[techCode].pair;
			if (g_treeBranches[pairName] == undefined) {
				console.warn("'" + techCode + "' is attempting to use '" + pairName + "' as a pair-tech, but such a tech does not exist!");
			} else {
				pairUnlocks = g_treeBranches[pairName].unlocks;
				g_treeBranches[techCode].unlocks = g_treeBranches[techCode].unlocks.concat(pairUnlocks);
				for (tech of pairUnlocks) {
					g_treeBranches[tech].reqs.push(techCode);
				}
			}
		}
		
		/* Determine Phases and their Order */
		if (g_treeBranches[techCode].reqs.length > 0)
		{
			reqTech = g_treeBranches[techCode].reqs[0];
			
			if ("techs" in g_treeBranches[reqTech])
			{
				// For Pairs
				reqTech = g_treeBranches[reqTech]["techs"][0];
			}
			
			reqPhase = g_treeBranches[reqTech].phase;
			myPhase = g_treeBranches[techCode].phase;
			
			if (reqPhase == "" || myPhase == "" || reqPhase == myPhase)
			{
				continue;
			}
			
			reqPhasePos = g_phases.indexOf(reqPhase);
			myPhasePos = g_phases.indexOf(myPhase);
			if (g_phases.length == 0)
			{
				g_phases = [ reqPhase, myPhase ];
			}
			else if (reqPhasePos < 0 && myPhasePos > -1)
			{
				g_phases.splice(myPhasePos, 0, reqPhase);
			}
			else if (myPhasePos < 0 && reqPhasePos > -1)
			{
				g_phases.splice(reqPhasePos+1, 0, myPhase);
			}
		}
	}
	
//	console.log("(build) Select Default Civ: (athen)");
//	selectCiv("athen");
	
	/* draw stuff */
//	console.log("(build) Draw tech tree:");
//	draw3();
	
	console.log("(build) Build Complete!");
}


// Initialize the dropdown containing all the available civs
function initCivNameList()
{
	// Cache map data
	g_CivData = loadCivData();

//	var civList = [ { "name": civ.Name, "culture": civ.Culture, "code": civ.Code } for (civ of g_CivData) ];
	var civList = [ ];
	for (var civ in g_CivData)
	{
		civList.push({ "name": g_CivData[civ].Name, "culture": g_CivData[civ].Culture, "code": civ });
	}

	// Alphabetically sort the list, ignoring case
	civList.sort(sortByCultureAndName);

	// Indent sub-factions
	var civListNames = [ ((civ.code == civ.culture)?"":" - ")+civ.name for (civ of civList) ];
	var civListCodes = [ civ.code for (civ of civList) ];

	// Set civ control
	var civSelection = getGUIObjectByName("civSelection");	
	civSelection.list = civListNames;
	civSelection.list_data = civListCodes;
	civSelection.selected = 0;
}

// Compile list of heads (branches with no reqs)
function compileHeads () {
	
	console.log("(civ select) Calculating starting points of tree");
	
	g_treeHeads = { "bonuses":[ ], "all": [ ] };
	for (phase of g_phases)
	{
		g_treeHeads[phase] = [ ];
		g_treeCols[phase] = [ ];
		g_treeCols[phase][0] = [ ];
	}
	
	for (techCode in g_treeBranches)
	{
		if (techCode.slice(0, 4) !== "pair" && techCode.slice(0, 5) !== "phase")
		{
			if (typeof(g_treeBranches[techCode].origPhase) == "string")
			{
				g_treeBranches[techCode].phase = g_treeBranches[techCode].origPhase;
				delete(g_treeBranches[techCode].origPhase);
			}
			
			if ("civ" in g_treeBranches[techCode] && g_treeBranches[techCode].civ.indexOf(g_selectedCiv) == -1)
			{
				if (!("givenCivsOnly" in g_treeBranches[techCode]) || ("givenCivsOnly" in g_treeBranches[techCode] && g_treeBranches[techCode].givenCivsOnly != "no")) {
					continue;
				}
			} else {
				if ("givenCivsOnly" in g_treeBranches[techCode] && g_treeBranches[techCode].givenCivsOnly == "no") {
					g_treeBranches[techCode].origPhase = g_treeBranches[techCode].phase;
					g_treeBranches[techCode].phase = g_phases[0];
				}
			}
			
			if (g_treeBranches[techCode].phase == "")
			{
				// if no phase given, and no reqs, must be a civbonus/civpenalty
				if (g_treeBranches[techCode].reqs.length == 0)
				{
					g_treeHeads["bonuses"].push(techCode);
				}
			}
			else
			{
				var col = 0;
				if (g_treeBranches[techCode].reqs.length == 0)
				{
					// no requirements mean that it gets addes to the heads pile
					g_treeHeads[g_treeBranches[techCode].phase].push(techCode);
					g_treeHeads["all"].push(techCode);
				}
				else
				{
					// work out where in each phase it sits
					var tmpCode = techCode;
					while (g_treeBranches[tmpCode].reqs.length > 0)
					{
						tmpCode = g_treeBranches[tmpCode].reqs[0];
						if (g_treeBranches[tmpCode].phase == g_treeBranches[techCode].phase)
						{
							col++;
						}
					}
					if (g_treeCols[g_treeBranches[techCode].phase][col] == undefined)
					{
						g_treeCols[g_treeBranches[techCode].phase][col] = [ ];
					}
				}
				
				g_treeCols[g_treeBranches[techCode].phase][col].push(techCode);
				
				// Sort unlocks by name
				if (g_treeBranches[techCode].unlocks.length > 0)
				{
					g_treeBranches[techCode].unlocks.sort(sortTechByName);
				}
				
			}
		}
	}
	
	// sort the heads
	for (var phase in g_treeHeads) {
		g_treeHeads[phase].sort(sortTechByName);
	}
		
	
}

function sortTechByName (a,b) {
	a = (hasSpecificName(a)) ? g_TechData[a].specificName[g_selectedCiv] : g_TechData[a].genericName;
	b = (hasSpecificName(b)) ? g_TechData[b].specificName[g_selectedCiv] : g_TechData[b].genericName;
	if (a < b)
		return -1;
	else if (a > b)
		return 1;
	else
		return 0;
}
	

function hasSpecificName (techCode) {
	return (typeof(g_TechData[techCode].specificName) == "object" && typeof(g_TechData[techCode].specificName[g_selectedCiv]) == "string");
}

// Called when user selects civ from dropdown
function selectCiv(code)
{
//	getGUIObjectByName("techList_tabulated").caption = "Working...";
//	console.log("(civ select) Working...");
	
	g_selectedCiv = code;
	compileHeads();
	
	console.log("(civ select) '"+code+"' selected.");
}

function getPhaseTech (phase) {
	if (typeof(g_treeBranches[phase+"_"+g_selectedCiv]) == "object")
	{
		return phase+"_"+g_selectedCiv;
	}
	else if (typeof(g_treeBranches[phase+"_generic"]) == "object")
	{
		return phase+"_generic";
	}
	else
	{
		return phase;
	}
}

function draw3 () {
	
	console.log("(draw) Drawing tech tree.");
	
	g_canvas.clear();
	
	// Title
	var civName = g_canvas.text(g_CivData[g_selectedCiv].Name);
	civName.attr({
		'x': 8
	,	'y': 8
	,	'font-size': 24
	,	'leading': 1
	});
	var civDesc = g_canvas.text(g_CivData[g_selectedCiv].History);
	civDesc.attr({
		'x': 8
	,	'y': civName.bbox().y2
	,	'fill': "#088"
	,	'font-size': 12
	,	'leading': 1
	,	'width': window.innerWidth - 24
	});
	civDesc.textWrapped(true);
	
	// Basic framework
	g_canvasParts["tree"] = g_canvas.group();
	g_canvasParts["tree"].move(0, 80);
	g_canvasParts["tree"].attr('id', "tree__tree");
	
	var margin = 4;		// margin between techboxes (mainly vertical)
	var wid = 256;		// column width
	var gap = 64;		// gap between columns
	var colHei = [ ];	// heights of the columns
	
	var techGroup = g_canvas.group();
	
	// Set initial column heights and draw phase techs
	for (var phase in g_treeCols)
	{
		if (typeof(g_TechData[getPhaseTech(phase)].tooltip) == "string") {
			var pb = techbox((gap+wid) * colHei.length + margin+gap/2, margin, (wid+gap)*(g_treeCols[phase].length)-gap, getPhaseTech(phase));
		}
		
		for (var stage in g_treeCols[phase])
		{
			colHei.push((pb)?pb.bbox().height+margin*2:(gap+wid));
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
		var tb = techbox(((wid+gap)*myCol)+margin+gap/2, colHei[myCol]+margin, wid, techCode);
		
		// 
		var myHeight = tb.bbox().height + margin;
		
		// If the tech has a pair, draw them together
		if (typeof(g_treeBranches[techCode].pair) == "string")
		{
			var techPair = g_treeBranches[techCode].pair;
			if (g_treeBranches[techPair] !== undefined)
			{
				tb.dy(margin);
				
				techPair = g_treeBranches[techPair].techs;
				techPair = (techCode != techPair[0]) ? techPair[0] : techPair[1];
				tb = techbox(((wid+gap)*myCol)+margin+gap/2, colHei[myCol]+myHeight+margin*2, wid, techPair);
				myHeight += tb.bbox().height + margin;
				
				var pairBox = g_canvasParts["tree"].rect();
				pairBox.attr({
					'x': ((wid+gap)*myCol)+gap/2
				,	'y': colHei[myCol] + margin
				,	'width': wid + margin * 2
				,	'height': myHeight + margin
				,	'fill-opacity': 0
				,	'stroke': '#888'
				});
				myHeight += margin * 2;
			}
		}
		
		// Recursively draw any techs that depend on the present tech (and its pair if it has one)
		for (var nextCode of g_treeBranches[techCode].unlocks)
		{
			followBranch(nextCode, myCol);
		}
		
		// add our height to the column's height
		colHei[myCol] += myHeight;
	}
	
	// Call above function for each and every tech branch head
	for (var techCode of g_treeHeads.all)
	{
		followBranch(techCode, -1);
	}
	
	// Draw the dependancy lines
	for (var techCode in g_treeBranches)
	{
		for (var unlocked of g_treeBranches[techCode].unlocks)
		{
			if (document.getElementById(techCode+'__box') == undefined || document.getElementById(unlocked+'__box') == undefined)
			{
				continue;
			}
			b1 = document.getElementById(techCode+'__box').instance;
			b2 = document.getElementById(unlocked+'__box').instance;
			
			var line = {
				'x1': b1.bbox().x2
			,	'y1': b1.bbox().y2 - b1.bbox().height/2
			,	'x2': b2.bbox().x
			,	'y2': b2.bbox().y2 - b2.bbox().height/2
			}
			
//			var svgline = g_canvasParts["tree"].line(line.x1, line.y1, line.x2, line.y2).stroke({'width': 1, 'color': '#088'});	// direct line
			var svgline = g_canvasParts["tree"].path(
					"M" + line.x1 +","+ line.y1
				+	"Q" + (line.x1+(line.x2-line.x1)/6) +","+ line.y1 +" "+ (line.x2+line.x1)/2 +","+ (line.y2+line.y1)/2
				+	"T" + line.x2 +","+ line.y2
				).attr({'stroke-width': 1, 'stroke': '#088', 'fill-opacity': 0});
		}
	}
	
/*	var pos = 0;
	var h = g_canvasParts["tree"].bbox().height + margin;
	for (var phase in g_treeCols)
	{
		pos += g_treeCols[phase].length;
		var phaseframe = g_canvasParts["tree"].rect();
		phaseframe.attr({
			'fill': '#088'
		,	'fill-opacity': 0.0
		,	'stroke': '#888'
		,	'stroke-opacity': 1
		,	'stroke-width': 1
		,	'width': (wid) * g_treeCols[phase].length + margin*6 + (gap * (g_treeCols[phase].length-1))
		,	'height': h
		,	'x': (wid+gap) * (pos - g_treeCols[phase].length) + gap/2 - margin*2
		,	'y': 0
		}).back();
	}	*/
	
	resizeDrawing();
}

function matchTech2Column (techCode) {
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

techbox = function (x, y, w, tc) {
	
	if (typeof(tc) !== "string") { return; }
	x = (typeof(x) !== "number") ? 0 : x;
	y = (typeof(y) !== "number") ? 0 : y;
	w = (typeof(w) !== "number") ? 256 : w;
	
//	this.box = g_canvas.group();
	this.box = g_canvasParts["tree"].group();
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
	
	this.tech_image = this.box.image("./art/textures/ui/session/portraits/technologies/"+g_TechData[tc].icon);
	this.tech_image.attr({
		'x': this.padding
	,	'y': this.padding
	,	'height': 32
	,	'width': 32
	});
	
	this.tech_name = this.box.text(g_TechData[tc].genericName);
	this.tech_name.attr({
		'fill': '#000'
	,	'font-size': this.font
	,	'x': this.tech_image.width() + this.padding*2
	,	'y': this.padding
	,	'leading': 1
	});
	if (hasSpecificName(tc)) {
		this.tech_name.text(g_TechData[tc].specificName[g_selectedCiv])
		this.tech_name.build(true);
		this.tech_name.tspan(" (" + g_TechData[tc].genericName + ")").attr('font-size', Math.round(this.font*0.7));
	}
//	this.tech_name.text(temp_count++ +" ");		// for debug purposes
	
	this.tech_cost = this.box.group();
	this.tech_cost.move(this.tech_image.width() + this.padding*2, this.padding*2+this.font);
	var rcnt = 0;
	for (res in g_TechData[tc].cost) {
		if (g_TechData[tc].cost[res] > 0) {
			this.tech_cost.image("./art/textures/ui/session/icons/resources/"+res+"_small.png").attr({'x': rcnt*48});
			this.tech_cost.text(" "+g_TechData[tc].cost[res]).attr({'leading':1,'font-size':Math.round(this.font*0.8), 'x': rcnt*48+18, 'y': this.padding});
			rcnt++;
		}
	}
	
	this.tech_tooltip = this.box.text(g_TechData[tc].tooltip);
	this.tech_tooltip.attr({
		'fill': '#088'
	,	'font-size': Math.round(this.font * 0.8)
	,	'x': this.padding
	,	'y': this.tech_image.height() + this.padding
	,	'width': w - this.padding
	,	'leading': 1
	});
	this.tech_tooltip.textWrapped(true);
	
	this.tech_desc = this.box.text(g_TechData[tc].description);
	this.tech_desc.attr({
		'fill': '#000'
	,	'font-size': Math.round(this.font * 0.8)
	,	'x': this.padding
	,	'y': this.tech_image.height() + this.tech_tooltip.bbox().height + this.padding
	,	'width': w - this.padding
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

function resizeDrawing () {
//	console.log('(draw) Resizing screen real estate');
	
	var bbox = g_canvas.bbox();
	var canvas_ele = document.getElementById('svg_canvas');
	
	canvas_ele.style.width = ((bbox.x2 > window.innerWidth-16) ? Math.round(bbox.x2) + 2 : window.innerWidth-16) + "px";
	canvas_ele.style.height = ((bbox.y2 > window.innerHeight) ? Math.round(bbox.y2) + 2 : window.innerHeight) + "px";
	
//	console.debug("(draw) "+ canvas_ele.style.width +" x "+ canvas_ele.style.height);
}



// Function to make first char of string big
function bigFirstLetter(str, size)
{
	return '[font="serif-bold-'+(size+6)+'"]' + str[0] + '[/font]' + '[font="serif-bold-'+size+'"]' + str.substring(1) + '[/font]';
}

// Heading font - bold and mixed caps
function heading(string, size)
{
	var textArray = string.split(" ");
	
	for(var i = 0; i < textArray.length; ++i)
	{
		var word = textArray[i];
		var wordCaps = word.toUpperCase();
		
		// Check if word is capitalized, if so assume it needs a big first letter
		if (wordCaps[0] == word[0])
			textArray[i] = bigFirstLetter(wordCaps, size);
		else
			textArray[i] = '[font="serif-bold-'+size+'"]' + wordCaps + '[/font]';	// TODO: Would not be necessary if we could do nested tags
	}
	
	return textArray.join(" ");
}

// Sort by culture, then by code equals culture and then by name ignoring case
// Copy of function by same name in civinfo.js
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
