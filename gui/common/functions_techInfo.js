/*
	DESCRIPTION	: Functions related to reading tech info
	NOTES		: 
*/

// ====================================================================


function loadTechData()
{	// Load all JSON files containing tech data
	var techData = {};
	var techFiles = buildDirEntList("simulation/data/technologies/", "*.json", false);
	
	for (var filename of techFiles)
	{	// Parse data if valid file
		var data = parseJSONData(filename);
		data.code = filename.slice(filename.lastIndexOf('/')+1, -5);
		techData[data.code] = data;
	}
	
	return techData;
}

function dePath(val)
{	// Removes path from entries
	return val.slice(val.lastIndexOf("/")+1);
}

// ====================================================================