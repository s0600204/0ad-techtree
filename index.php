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
	
	<style>
	body {
		margin: 0;
		padding: 0;
		background: rgb(204, 229, 229);
		font-family: sans-serif;
		font-size: 16px;
	}

	#svg_canvas {
		width: 1024px;
		height: 512px;
		display: none;
	}

	div {
		position: fixed;
	}

	#selectDiv {
		right: 4px;
		top: 4px;
		font-size: 0.8em;
		display: none;
	}

	#modDiv {
		top: 32px;
		right: 4px;
		padding: 2px;
		font-size: 0.8em;
		border: solid rgb(0,136,136) 1px;
		background: rgba(255, 255, 255, 0.5);
		display: none;
		text-align: center;
	}

	fieldset {
		border: solid rgb(0,136,136) 1px;
		padding: 2px 8px 2px 2px;
		text-align: left;
	}

	fieldset, input[type=button] {
		margin: 2px;
	}

	select, input[type=button] {
		border: solid rgb(0,136,136) 1px;
	}

	input[type=button]:hover {
		background: rgb(255, 255, 255);
	}

	.ico {
		font-size: 1.4em !important;
		font-weight: bold;
	}
	.ico:hover {
		color: rgb(0,136,136);
	}

	select, .ico, input[type=checkbox] {
		vertical-align: middle;
	}

	select, input[type=button], fieldset {
		background: rgba(255, 255, 255, 0.4);
	}

	select, .ico, input, label {
		cursor: pointer;
	}

	#renderBanner {
		padding: 16px;
		top: 128px;
		left: 0;
		right: 0;
		color: rgb(0,136,136);
		text-align: center;
		border: solid rgb(0,136,136);
		border-width: 1px 0;
		background: -webkit-linear-gradient( 0deg, rgba(0,136,136,0.2), rgba(204,238,238,0.2), rgba(0,136,136,0.2));
		background:    -moz-linear-gradient(90deg, rgba(0,136,136,0.2), rgba(204,238,238,0.2), rgba(0,136,136,0.2));
		background:     -ms-linear-gradient(90deg, rgba(0,136,136,0.2), rgba(204,238,238,0.2), rgba(0,136,136,0.2));
		background:      -o-linear-gradient( 0deg, rgba(0,136,136,0.2), rgba(204,238,238,0.2), rgba(0,136,136,0.2));
		background:         linear-gradient(90deg, rgba(0,136,136,0.2), rgba(204,238,238,0.2), rgba(0,136,136,0.2));
	}
	</style>
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
