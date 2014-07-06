<?php

global $g_TechData;
global $g_treeBranches;
global $g_techPairs;
global $g_techPhases;
global $g_phaseList;

global $g_CivData;
global $g_civs;

global $g_ModData;
global $g_mods;
global $g_usedMods;


/*
 * Load arguments
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 */
if ($_POST['mod'] === "") {
	$g_usedMods = Array("0ad");
} else {
	$g_usedMods = Array();
	if (loadDependencies($_POST['mod'])) {
		$g_usedMods[] = $_POST['mod'];
	} else {
		$g_usedMods[] = "0ad";
	}
}


/*
 * Load data from JSON
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 */
$GLOBALS['recurse'] = false;
foreach ($g_usedMods as $mod) {
	$techpath = "../mods/".$mod."/simulation/data/technologies/";
	$civpath = "../mods/".$mod."/civs/";
	if (file_exists($techpath)) {
		recurseThru($techpath, "", "g_TechData", $mod);
	}
	if (file_exists($civpath)) {
		recurseThru($civpath, "", "g_CivData", $mod);
	}
}

$g_ModData = Array();
foreach (scandir("../mods", 0) as $fsp) {
	if (is_dir("../mods/".$fsp) && file_exists("../mods/".$fsp."/mod.json")) {
		$g_ModData[$fsp] = json_decode(file_get_contents("../mods/".$fsp."/mod.json"), true);
	}
}


/*
 * Parse Data : Technologies
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 */
foreach ($g_TechData as $techCode => $techInfo) {
	
	$realCode = depath($techCode);
	
	if (substr($realCode, 0, 4) == "pair") {
		$g_techPairs[$techCode] = Array(
				"techs"		=> Array()
			,	"unlocks"	=> Array()
			);
	
	} else if (substr($realCode, 0, 5) == "phase") {
		$g_techPhases[$techCode] = Array(
				"name"			=> Array(
						"generic"	=> $techInfo["genericName"],
						"specific"	=> Array()
					)
			,	"description"	=> (array_key_exists("description", $techInfo)) ? $techInfo["description"] : ""
			,	"tooltip"		=> (array_key_exists("tooltip", $techInfo)) ? $techInfo["tooltip"] : ""
			,	"cost"			=> (array_key_exists("cost", $techInfo)) ? $techInfo["cost"] : Array()
			,	"sourceMod"		=> $techInfo["mod"]
			);
		
		if (array_key_exists("specificName", $techInfo)) {
			$g_techPhases[$techCode]["name"]["specific"] = $techInfo["specificName"];
		}
		if (array_key_exists("icon", $techInfo)) {
			$g_techPhases[$techCode]["icon"] = $techInfo["icon"];
		}
		
	} else {
		
		/* Set basic branch information */
		$g_treeBranches[$techCode] = Array(
				"reqs"			=> Array()
			,	"unlocks"		=> Array()
			,	"name"			=> Array(
						"generic"	=> $techInfo["genericName"],
						"specific"	=> Array()
					)
			,	"description"	=> (array_key_exists("description", $techInfo)) ? $techInfo["description"] : ""
			,	"tooltip"		=> (array_key_exists("tooltip", $techInfo)) ? $techInfo["tooltip"] : ""
			,	"icon"			=> (array_key_exists("icon", $techInfo)) ? $techInfo["icon"] : ""
			,	"cost"			=> (array_key_exists("cost", $techInfo)) ? $techInfo["cost"] : ""
			,	"sourceMod"		=> $techInfo["mod"]
			);
		
		if (array_key_exists("pair", $techInfo)) {
			$g_treeBranches[$techCode]["pair"] = $techInfo["pair"];
		}
		if (array_key_exists("specificName", $techInfo)) {
			$g_treeBranches[$techCode]["name"]["specific"] = $techInfo["specificName"];
		}
		if (array_key_exists("autoResearch", $techInfo)) {
			$g_treeBranches[$techCode]["autoResearch"] = $techInfo["autoResearch"];
		}
		
		/* Reqs, part 1: the requirements field */
		if (array_key_exists("requirements", $techInfo)) {
			
			foreach ($techInfo["requirements"] as $op => $val) {
				
				$ret = calcReqs($op, $val);
				
				switch ($op) {
					case "tech":
						$g_treeBranches[$techCode]["reqs"]["generic"] = Array( $ret );
						break;
					
					case "civ":
						$g_treeBranches[$techCode]["reqs"][$ret] = Array();
						break;
					
					case "any":
						if (count($ret[0]) > 0) {
							foreach ($ret[0] as $r => $v) {
								if (is_numeric($r)) {
									$g_treeBranches[$techCode]["reqs"][$v] = Array();
								} else {
									$g_treeBranches[$techCode]["reqs"][$r] = $v;
								}
							}
						}
						if (count($ret[1]) > 0) {
							$g_treeBranches[$techCode]["reqs"]["generic"] = $ret[1];
						}
						break;
					
					case "all":
						foreach ($ret[0] as $r) {
							$g_treeBranches[$techCode]["reqs"][$r] = $ret[1];
						}
						break;
				}
			}
		}
	}
}

/* Unravel pair chains */
foreach ($g_techPairs as $pair => $data) {
	$techInfo = $g_TechData[$pair];
	
	$g_techPairs[$pair]["techs"] = Array( $techInfo["top"], $techInfo["bottom"] );
	
	if (array_key_exists("supersedes", $techInfo)) {
		$g_techPairs[$techInfo["supersedes"]]["unlocks"] = $g_techPairs[$pair]["techs"];
	}
}

/* Reqs, part 2: supersedes */
foreach ($g_treeBranches as $techCode => $data) {
	$techInfo = $g_TechData[$techCode];
	
	/* Direct tech-to-tech superseding */
	if (array_key_exists("supersedes", $techInfo)) {
		if (substr(depath($techInfo["supersedes"]), 0, 4) == "pair") { // training_conscription, much?
			$g_techPairs[$techInfo["supersedes"]]["unlocks"][] = $techCode;
		} else {
			if (array_key_exists("generic", $g_treeBranches[$techCode]["reqs"])) {
				$g_treeBranches[$techCode]["reqs"]["generic"][] = $techInfo["supersedes"];
			} else {
				foreach (array_keys($g_treeBranches[$techCode]["reqs"]) as $civkey) {
					$g_treeBranches[$techCode]["reqs"][$civkey][] = $techInfo["supersedes"];
				}
			}
			$g_treeBranches[$techInfo["supersedes"]]["unlocks"][] = $techCode;
		}
	}
	
	/* Via pair-tech superseding */
	if (array_key_exists("pair", $data)) {
		$pair = $data["pair"];
		if (array_key_exists($pair, $g_techPairs)) {
			$pair = $g_techPairs[$pair]["unlocks"];
			$g_treeBranches[$techCode]["unlocks"] = array_merge($g_treeBranches[$techCode]["unlocks"], $pair);
			foreach ($pair as $tech) {
				if (array_key_exists("generic", $g_treeBranches[$tech]["reqs"])) {
					$g_treeBranches[$tech]["reqs"]["generic"][] = $techCode;
				} else {
					foreach (array_keys($g_treeBranches[$tech]["reqs"]) as $civkey) {
						$g_treeBranches[$tech]["reqs"][$civkey][] = $techCode;
					}
				}
			}
		} else {
//			echo $techCode ." is trying to use non-existant ". $pair ." as a pair\n";
		}
	}
}

/* Unravel phase order */
$g_phaseList = Array();
foreach ($g_treeBranches as $techCode => $data) {
	$techInfo = $g_TechData[$techCode];
	
	if (array_key_exists("generic", $data["reqs"]) && count($data["reqs"]["generic"]) > 1)
	{
		$reqTech = $g_treeBranches[$techCode]["reqs"]["generic"][1];
		
		if (!array_key_exists("generic", $g_treeBranches[$reqTech]["reqs"])) {
			continue;
		}
		$reqPhase = $g_treeBranches[$reqTech]["reqs"]["generic"][0];
		$myPhase = $g_treeBranches[$techCode]["reqs"]["generic"][0];
		
		if ($reqPhase == $myPhase) {
			continue;
		}
		$reqPhasePos = array_search($reqPhase, $g_phaseList);
		$myPhasePos = array_search($myPhase, $g_phaseList);
		
		if (count($g_phaseList) == 0)
		{
			$g_phaseList = Array( $reqPhase, $myPhase );
		}
		else if ($reqPhasePos === false && $myPhasePos > -1)
		{
			array_splice($g_phaseList, $myPhasePos, 0, $reqPhase);
		}
		else if ($myPhasePos === false && $reqPhasePos > -1)
		{
			array_splice($g_phaseList, $reqPhasePos+1, 0, $myPhase);
		}
	}
	
}


/*
 * Parse Data : Civs
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 */
foreach ($g_CivData as $civCode => $civInfo) {
	$g_civs[$civCode] = Array(
			"name"			=> $civInfo["Name"]
		,	"culture"		=> $civInfo["Culture"]
		,	"emblem"		=> $civInfo["Emblem"]
		,	"sourceMod"		=> $civInfo["mod"]
		);
}


/*
 * Parse Data : Available Mods
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 */
foreach ($g_ModData as $modCode => $modInfo) {
	$g_mods[$modCode] = Array(
			"name"			=> $modInfo["name"]
		,	"label"			=> $modInfo["label"]
		,	"code"			=> $modCode
		,	"type"			=> $modInfo["type"]
		);
}


/*
 * Output data
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 */
echo json_encode(Array(
		"branches" => $g_treeBranches
	,	"phases" => $g_techPhases
	,	"pairs" => $g_techPairs
	,	"phaseList" => $g_phaseList
	,	"civs" => $g_civs
	,	"availMods" => $g_mods
	));


/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */


function calcReqs ($op, $val)
{
	switch ($op)
	{
	case "civ":
	case "tech":
		return $val;
	
	case "all":
	case "any":
		$t = Array();
		$c = Array();
		foreach ($val as $nv)
		{
			foreach ($nv as $o => $v)
			{
				$r = calcReqs($o, $v);
				switch ($o)
				{
				case "civ":
					$c[] = $r;
					break;
					
				case "tech":
					$t[] = $r;
					break;
					
				case "any":
					$c = array_merge($c, $r[0]);
					$t = array_merge($t, $r[1]);
					break;
					
				case "all":
					foreach ($r[0] as $ci) {
						$c[$ci] = $r[1];
					}
					$t = $t;
				}
				
			}
		}
		return Array( $c, $t );
	}
}

function recurseThru ($path, $subpath, $store, $mod) {
	$files = scandir($path.$subpath, 0);
	global $pattern;
	foreach ($files as $file) {
		if (substr($file,0,1) == ".") {
			continue;
		}
		if (is_dir($path.$subpath.$file)) {
			if ($GLOBALS['recurse'] == true) {
				recurseThru($path, $subpath.$file."/", $store, $mod);
			} else {
				continue;
			}
		} else {
			if (preg_match("/.json/i", $file) == 1) {
				$fname = $subpath . substr($file, 0, strrpos($file, '.'));
				$fcontents = json_decode(file_get_contents($path.$subpath.$file), true);
				if ($fcontents !== NULL) {
					$GLOBALS[$store][$fname] = $fcontents;
					$GLOBALS[$store][$fname]["mod"] = $mod;
				} else {
				//	echo $path.$subpath.$file . " is not a valid JSON file!\n";
				}
			}
		}
	}
}

function depath ($str) {
	return (strpos($str, "/")) ? substr($str, strrpos($str, '/')+1) : $str;
}

function loadDependencies ($modName) {
	global $g_usedMods;
	$modpath = "../mods/" . $modName . "/mod.json";
	if (file_exists($modpath)) {
		$modData = JSON_decode(file_get_contents($modpath), true);
		foreach ($modData["dependencies"] as $mod) {
			$mod = explode("=", $mod)[0];
			if (!in_array($mod, $g_usedMods) && loadDependencies($mod)) {
				$g_usedMods[] = $mod;
			}
		}
		return true;
	} else if ($modName == "0ad") {
		return true;
	} else {
		return false;
	}
}

?>
