<?php

global $recurse;
global $pattern;

/* TODO: checks of the passed values	*/


if (isset($_REQUEST['act'])) {
	
	switch ($_REQUEST['act']) {
		
		case "ls":
			$path    = $_REQUEST['path'];
			$GLOBALS['pattern'] = str_replace("*", "", $_REQUEST['filter']);
			$GLOBALS['recurse'] = ($_REQUEST['recurse'] == "true");
			
			$all = array();
			recurseThru($path);
			echo "[ ";
			for ($c = 0; $c<count($all); $c++) {
				echo '"'. $all[$c] .'"';
				if ($c<count($all)-1) {
					echo ', ';
				}
			}
			echo " ]";
			break;
		
		case "cat":
			$filename = $_REQUEST['filename'];
			echo file_get_contents($filename);
			break;
		
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
			if (preg_match("/".$pattern."/i", $file) == 1); {
			//	$contents = file_get_contents($path.$file);
			//	$json = json_decode($contents, true);
			//	$name = substr($file, 0, strrpos($file, '.'));
				$GLOBALS['all'][] = $path.$file;
			}
		}
	}
}


?>
