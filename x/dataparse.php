<?php

global $g_TechData;
global $g_treeBranches;
global $g_techPairs;
global $g_techPhases;
global $g_phaseList;

global $g_CivData;
global $g_civs;

/*
 * Load data from JSON
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 */
$GLOBALS['recurse'] = false;
recurseThru("../simulation/data/technologies/", "g_TechData");
recurseThru("../civs/", "g_CivData");


/*
 * Parse Data : Technologies
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 */
foreach ($g_TechData as $techCode => $techInfo) {
	
	if (substr($techCode, 0, 4) == "pair") {
		$g_techPairs[$techCode] = [
				"techs"		=> Array()
			,	"unlocks"	=> Array()
			];
		
	
	} else if (substr($techCode, 0, 5) == "phase") {
		$g_techPhases[$techCode] = [
				"name"			=> [
						"generic"	=> $techInfo["genericName"],
						"specific"	=> Array()
					]
			,	"description"	=> (array_key_exists("description", $techInfo)) ? $techInfo["description"] : ""
			,	"tooltip"		=> (array_key_exists("tooltip", $techInfo)) ? $techInfo["tooltip"] : ""
			,	"cost"			=> (array_key_exists("cost", $techInfo)) ? $techInfo["cost"] : Array()
			];
		
		if (array_key_exists("specificName", $techInfo)) {
			$g_techPhases[$techCode]["name"]["specific"] = $techInfo["specificName"];
		}
		if (array_key_exists("icon", $techInfo)) {
			$g_techPhases[$techCode]["icon"] = $techInfo["icon"];
		}
		
	} else {
		
		/* Set basic branch information */
		$g_treeBranches[$techCode] = [
				"reqs"			=> Array()
			,	"unlocks"		=> Array()
			,	"name"			=> [
						"generic"	=> $techInfo["genericName"],
						"specific"	=> Array()
					]
			,	"description"	=> $techInfo["description"]
			,	"tooltip"		=> $techInfo["tooltip"]
			,	"icon"			=> $techInfo["icon"]
			,	"cost"			=> $techInfo["cost"]
			];
		
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
						$g_treeBranches[$techCode]["reqs"]["generic"] = [ $ret ];
						break;
					
					case "civ":
						$g_treeBranches[$techCode]["reqs"][$ret] = [];
						break;
					
					case "any":
						if (count($ret[0]) > 0) {
							foreach ($ret[0] as $r => $v) {
								if (is_numeric($r)) {
									$g_treeBranches[$techCode]["reqs"][$v] = [];
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
	
	$g_techPairs[$pair]["techs"] = [$techInfo["top"], $techInfo["bottom"]];
	
	if (array_key_exists("supersedes", $techInfo)) {
		$g_techPairs[$techInfo["supersedes"]]["unlocks"] = $g_techPairs[$pair]["techs"];
	}
	
}

/* Reqs, part 2: supersedes */
foreach ($g_treeBranches as $techCode => $data) {
	$techInfo = $g_TechData[$techCode];
	
	/* Direct tech-to-tech superseding */
	if (array_key_exists("supersedes", $techInfo)) {
		if (substr($techInfo["supersedes"], 0, 4) == "pair") { // training_conscription, much?
			$g_techPairs[$techInfo["supersedes"]]["unlocks"][] = $techCode;
		} else {
			$g_treeBranches[$techCode]["reqs"]["generic"][] = $techInfo["supersedes"];
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
				$g_treeBranches[$tech]["reqs"]["generic"][] = $techCode;
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
			$g_phaseList = [ $reqPhase, $myPhase ];
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
	$g_civs[$civCode] = [
			"name"			=> $civInfo["Name"]
		,	"culture"		=> $civInfo["Culture"]
		,	"emblem"		=> $civInfo["Emblem"]
		,	"description"	=> $civInfo["History"]
		];
}

/*
 * Output data
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 */
echo json_encode([
		"branches" => $g_treeBranches
	,	"phases" => $g_techPhases
	,	"pairs" => $g_techPairs
	,	"phaseList" => $g_phaseList
	,	"civs" => $g_civs
	]);

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
		$t = [];
		$c = [];
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
		return [$c, $t];
	}
}

function recurseThru ($path, $store) {
	$files = scandir($path, 0);
	global $pattern;
	foreach ($files as $file) {
		if (substr($file,0,1) == ".") {
			continue;
		}
		if (is_dir($path.$file)) {
			if ($GLOBALS['recurse'] == true) {
				recurseThru($path.$file."/");
			} else {
				continue;
			}
		} else {
			if (preg_match("/.json/i", $file) == 1); {
				$fname = substr($file, 0, strrpos($file, '.'));
				$GLOBALS[$store][$fname] = json_decode(file_get_contents($path.$file), true);
			}
		}
	}
}

?>
