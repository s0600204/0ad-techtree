
function getGUIObjectByName(id) {
	return document.getElementById(id);
}

Object.defineProperty(HTMLDivElement.prototype, "caption", {
		enumerable: true,
		configurable: true,
		get: function () { return this.innerHTML; },
		set: function (nV) { this.innerHTML = nV; }
	});

Object.defineProperty(HTMLSelectElement.prototype, "list", {
		enumerable: true,
		configurable: true,
		get: function () { return this.children; },
		set: function (nV) {
				while (this.children.length > 0) {
					this.remove(this.children[0]);
				}
				for (var newval of nV) {
					var newopt = document.createElement("option");
					newopt.text = newval;
//					newopt.addEventListener("click", function (event) { testSel(event); })
					this.appendChild(newopt);
				}
			}
	});

Object.defineProperty(HTMLSelectElement.prototype, "list_data", {
		enumerable: true,
		configurable: true,
		get: function () { return this.children; },
		set: function (nV) {
				for (var v = 0; v < nV.length; v++) {
					this.children[v].value = nV[v];
				}
			}
	});

Object.defineProperty(HTMLSelectElement.prototype, "selected", {
		enumerable: true,
		configurable: true,
		get: function () { return this.selectedIndex; },
		set: function (nV) { this.selectedIndex = nV; this.onchange({"explicitOriginalTarget": {"value": this.value}}); }
	
	});


function buildDirEntList (path, filter, recurse) {
	ret = vfs.ls(path, filter, recurse);
//	console.log("buildDirEntList");
//	console.log(vfs.out);
	return vfs.out;
}

function parseJSONData(filename) {
	ret = vfs.cat(filename);
//	console.log("parseJSONData");
//	console.log(vfs.out);
	return vfs.out;
}


vfs = {
	
	out: null,
	
	ls: function (path, filter = false, recurse = false) {
		args = {
			"path": path,
			"filter": filter,
			"recurse": recurse
		}
		this._http_request("ls", args);
		return true;
	},
	
	cat: function (filename) {
		args = {
			"filename": filename
		}
		this._http_request("cat", args);
		return true;
	},
	
	_http_request: function (action, args) {
		
		argStr = "?act="+action;
		for (arg in args) {
			argStr += "&"+ arg +"="+ args[arg];
		}
		vfs.out = "";	
		
		http_request = new XMLHttpRequest();
		http_request.onreadystatechange = function () {
			if (http_request.readyState === 4) {
				if (http_request.status === 200) {
//					alert( http_request.responseText );
					vfs.out = JSON.parse(http_request.responseText);
				} else {
					alert ('There was a problem with the request.');
					vfs.out = false;
				}
			}
		}
		http_request.open('POST', 'http://127.0.0.1:88/0ad/vfs.php'+argStr, false);
		http_request.send();
	}
	
};

