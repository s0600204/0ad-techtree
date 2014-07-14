<!DOCTYPE html>
<html>

<head>
	<meta http-equiv="Content-Type" content="text/html;charset=utf-8" >
	
	<script src="x/techtree.js"></script>
	<script src="x/svg.min.js"></script>
	
	<script>
<?php
	$args = Array(
		'mod' => ''
	);
	foreach ($_GET as $arg => $val) {
		$arg = strtolower($arg);
		switch ($arg)
		{
			case "mod":
				$args["mod"] = (is_array($val)) ? $val : Array($val);
				break;
		}
	}
	foreach ($args as $arg => $val) {
		echo "\tvar g_args = " . JSON_encode($args) . ";\n";
	}
?>
	</script>
	
	<link href="./x/techtree.css" rel="stylesheet"></link>
</head>

<body onload="init()">

<div id="selectDiv">
	<select id="civSelect" onChange="selectCiv(event.target.value);"></select>
	<span class="ico" onclick="toggleModSelect()">&lowast;</span>
</div>

<div id="modDiv">
	<fieldset id="modSelect">
		<legend><b>Available Mods</b></legend>
	</fieldset>
	<input type="button" value="Show" onclick="selectMod()" />
	<input type="button" value="Clear" onclick="clearModSelect()" />
</div>

<svg xmlns="http://www.w3.org/2000/svg" version="1.1" id="svg_canvas"></svg>

<div id="renderBanner">Please wait...</div>

</body>
</html>
