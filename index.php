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
				$args["mod"] = $val;
				break;
		}
	}
	foreach ($args as $arg => $val) {
		echo "\tvar g_args = " . JSON_encode($args) . "\n";
	}
?>
	</script>
	
	<style>
	body {
		margin: 0;
		padding: 0;
		background: rgb(204, 229, 229);
		font-family: sans-serif;
	}
	
	#svg_canvas {
		width: 1024px;
		height: 512px;
		display: none;
	}
	
	#civSelect {
		position: fixed;
		right: 4px;
		top: 4px;
		display: none;
	}
	
	#renderBanner {
		position: fixed;
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

<select id="civSelect" onChange="selectCiv(event.target.value);"></select>

<svg xmlns="http://www.w3.org/2000/svg" version="1.1" id="svg_canvas"></svg>

<div id="renderBanner">Please wait...</div>

</body>
</html>
