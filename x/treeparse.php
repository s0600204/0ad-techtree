<?php

global $g_TechData;
global $g_treeBranches;
global $g_treeHeads;
global $g_treeCols;
global $g_techPairs;
global $g_techPhases;
global $g_phases;
$GLOBALS['recurse'] = false;

recurseThru("simulation/data/technologies/");

//print_r($g_TechData);

// Phase 1
foreach ($g_TechData as $techCode => $techInfo) {
	
	if (substr($techCode, 0, 4) == "pair") {
		$g_techPairs[$techCode] = [
				"techs"		=> Array()
			,	"unlocks"	=> Array()
			];
		
	
	} else if (substr($techCode, 0, 5) == "phase") {
		$g_techPhases[$techCode] = [
			/*	"reqs"			=> Array()
			,	"unlocks"		=> Array()
			,*/	"name"			=> [
						"generic"	=> $techInfo["genericName"],
						"specific"	=> Array()
					]
			,	"description"	=> (array_key_exists("description", $techInfo)) ? $techInfo["description"] : ""
			,	"tooltip"		=> (array_key_exists("tooltip", $techInfo)) ? $techInfo["tooltip"] : ""
			];
		
		if (array_key_exists("specificName", $techInfo)) {
			$g_techPhases[$techCode]["icon"] = $techInfo["specificName"];
		}
		if (array_key_exists("icon", $techInfo)) {
			$g_techPhases[$techCode]["name"]["specific"] = $techInfo["icon"];
		}
		
		/* Not sure if reqs are needed on phases - I don't think JS uses them */
	/*	if (array_key_exists("requirements", $techInfo)) {
			foreach ($techInfo["requirements"] as $op => $val) {
				$ret = calcReqs($op, $val);
				switch ($op) {
					case "tech":
						$g_techPhases[$techCode]["reqs"] = [ $ret ];
						break;
						
					case "any":
						if (count($ret[1]) > 0) {
							$g_techPhases[$techCode]["reqs"] = $ret[1];
						}
						break;
				}
			}
		}	*/
	
	} else {
		
		/* Set basic branch information */
		$g_treeBranches[$techCode] = [
				"reqs"			=> Array()
			,	"unlocks"		=> Array()
		/*	,	"phase"			=> "" */
			,	"name"			=> [
						"generic"	=> $techInfo["genericName"],
						"specific"	=> Array()
					]
			,	"description"	=> $techInfo["description"]
			,	"tooltip"		=> $techInfo["tooltip"]
			,	"icon"			=> $techInfo["icon"]
			];
		
		if (array_key_exists("pair", $techInfo)) {
			$g_treeBranches[$techCode]["pair"] = $techInfo["pair"];
		}
		if (array_key_exists("specificName", $techInfo)) {
			$g_treeBranches[$techCode]["name"]["specific"] = $techInfo["specificName"];
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
			echo $techCode ." is trying to use non-existant ". $pair ." as a pair\n";
		}
	}
}

/* Not sure if this is needed */ /*
foreach ($g_techPhases as $phaseCode => $data) {
	$techInfo = $g_TechData[$phaseCode];
	
	/* Direct phase-to-phase superseding */ /*
	if (array_key_exists("supersedes", $techInfo)) {
		$g_techPhases[$phaseCode]["reqs"][] = $techInfo["supersedes"];
		$g_techPhases[$techInfo["supersedes"]]["unlocks"][] = $phaseCode;
	}
} */

/* Unravel phase order */
$g_phases = Array();
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
		$reqPhasePos = array_search($reqPhase, $g_phases);
		$myPhasePos = array_search($myPhase, $g_phases);
		
		if (count($g_phases) == 0)
		{
			$g_phases = [ $reqPhase, $myPhase ];
		}
		else if ($reqPhasePos === false && $myPhasePos > -1)
		{
			array_splice($g_phases, $myPhasePos, 0, $reqPhase);
		}
		else if ($myPhasePos === false && $reqPhasePos > -1)
		{
			array_splice($g_phases, $reqPhasePos+1, 0, $myPhase);
		}
	}
	
}

//echo print_r($g_TechData, true);
//echo print_r($g_treeBranches, true);
//echo print_r($g_techPairs, true);
echo print_r($g_techPhases, true);
//echo print_r($g_phases, true);

//echo json_encode($g_treeBranches);


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

function recurseThru ($path) {
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
				$name = substr($file, 0, strrpos($file, '.'));
				$GLOBALS['g_TechData'][$name] = json_decode(file_get_contents($path.$file), true);
			}
		}
	}
}

?>
