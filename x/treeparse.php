<?php

global $g_TechData;
global $g_treeBranches;
global $g_treeHeads;
global $g_treeCols;
$GLOBALS['recurse'] = false;

recurseThru("simulation/data/technologies/");

//print_r($g_TechData);

// Phase 1
foreach ($g_TechData as $tech => $data) {
	$g_treeBranches[$tech] = ["reqs"=>Array(), "unlocks"=>Array()/*, "phase"=>""*/];
	
	if (array_key_exists("requirements", $data)) {
		
		foreach ($data["requirements"] as $op => $val) {
			
			$ret = calcReqs($op, $val);
			
			switch ($op) {
				case "tech":
					$g_treeBranches[$tech]["reqs"]["generic"] = $ret;
					break;
				
				case "civ":
					$g_treeBranches[$tech]["reqs"][$ret] = [];
					break;
				
				case "any":
					if (count($ret[0]) > 0) {
						foreach ($ret[0] as $r => $v) {
							if (is_numeric($r)) {
								$g_treeBranches[$tech]["reqs"][$v] = [];
							} else {
								$g_treeBranches[$tech]["reqs"][$r] = $v;
							}
						}
					}
					if (count($ret[1]) > 0) {
						$g_treeBranches[$tech]["reqs"]["generic"] = $ret[1];
					}
					break;
				
				case "all":
					foreach ($ret[0] as $r) {
						$g_treeBranches[$tech]["reqs"][$r] = $ret[1];
					}
					break;
			}
			
		}
		
	}
	
}


echo "<pre>\n" . print_r($g_treeBranches, true) . "\n</pre>\n";

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
