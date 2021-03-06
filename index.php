<!DOCTYPE html>
<html>

<head>
	<meta http-equiv="Content-Type" content="text/html;charset=utf-8" >
	
	<script src="x/techtree.js"></script>
	<script src="x/svg.min.js"></script>
	<script src="x/svg.textwrap.js"></script>
	
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
	
	<link href="./ui/techtree.css" rel="stylesheet"></link>
</head>

<body onload="init()">

<div id="selectDiv">
	<select id="civSelect" onChange="selectCiv(event.target.value);" onclick="toggleDivs('')"></select>
	<span class="ico" onclick="toggleDivs('mod')">&lowast;</span>
	<span class="ico" onclick="toggleDivs('attr')">?</span>
</div>

<div id="modDiv">
	<fieldset id="modSelect">
		<legend><b>Available Mods</b></legend>
	</fieldset>
	<input type="button" value="Show" onclick="selectMod()" />
	<input type="button" value="Clear" onclick="clearModSelect()" />
</div>

<div id="attrDiv">
	<fieldset>
		<legend><b>Description</b></legend>
		<p>These are generated-on-the-fly diagrams showing the current technology tree of civilisations in <a href="http://play0ad.com/" target="_new">0AD : Empires Ascendant</a>.</p>
		<p>The source code can be found at <a href="https://github.com/s0600204/0ad-techtree" target="_new">GitHub</a>.</p>
	</fieldset>
	<fieldset id="modURLs">
		<legend><b>Mods</b></legend>
		<p>Links to individual mods' webpages:<p>
	</fieldset>
	<a rel="license" id="license" href="http://creativecommons.org/licenses/by-sa/3.0/" target="_new">
		<img alt="Creative Commons License" src="./ui/cc-by-sa_80x15.png" />
	</a>
</div>

<svg xmlns="http://www.w3.org/2000/svg" version="1.1" id="svg_canvas"></svg>

<div id="renderBanner">Please wait...</div>

</body>
</html>
