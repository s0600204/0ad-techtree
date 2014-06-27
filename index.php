<!DOCTYPE html>
<html>

<head>
	<meta http-equiv="Content-Type" content="text/html;charset=utf-8" >
	
	<script src="x/techtree.js"></script>
	<script src="x/svg.min.js"></script>
	<script src="x/svg.textwrap.js"></script>
	
	<style>
	body {
		margin: 0;
		padding: 0;
		background: rgb(204, 229, 229);
	}
	
	#svg_canvas {
		width: 1024px;
		height: 512px;
		border: solid green;
		border-width: 0 1px 1px 0;
		display: none;
	}
	
	#civSelect {
		position: fixed;
		right: 4px;
		top: 4px;
	}
	
	</style>
</head>

<body onload="init()">

<select id="civSelect" onChange="selectCiv(event.target.value);"></select>

<svg xmlns="http://www.w3.org/2000/svg" version="1.1" id="svg_canvas"></svg>

</body>
</html>
