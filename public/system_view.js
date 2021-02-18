const HIGHLIGHT_COLOR = "rgb(242, 231, 15)";

// Determine (x, y) position of a body from its polar coordinates
function polarToCartesian(max_radius, center_x, center_y, orbital_radius, theta){
	var radius = max_radius * orbital_radius;
	var rad_theta = theta * Math.PI / 180;
	var x = center_x +  radius * Math.cos(rad_theta);
	var y = center_y + radius * Math.sin(rad_theta);

	return {
		radius: radius,
		x: x,
		y: y
	};
}

function drawBodyName(context, datum) {
	context.fillStyle = HIGHLIGHT_COLOR;
	context.font = "12px Helvetica, sans-serif";
	context.fillText(datum.name, datum.x + datum.radius, datum.y - datum.radius);
}

// Add body/system name tooltip on hover in canvas
function canvasHandleMouseMove(e, data, canvas, context, saved_canvas) {
	var mouseX = e.pageX - canvas.offsetLeft;
	var mouseY = e.pageY - canvas.offsetTop;

	context.putImageData(saved_canvas, 0, 0);
	document.body.style.cursor = "default";

	for (var i = 0; i < data.length; i++) {
		var datum = data[i];
		var dx = mouseX - datum.x;
		var dy = mouseY - datum.y;
		if ((dx * dx + dy * dy) < (datum.radius * datum.radius)) {
			drawBodyName(context, datum);
			document.body.style.cursor = "pointer";
		}
	}
}

// Make clicking on bodies/systems navigate to the appropriate page
function canvasHandleMouseDown(e, data, canvas, url_base) {
	var mouseX = e.pageX - canvas.offsetLeft;
	var mouseY = e.pageY - canvas.offsetTop;

	for (var i = 0; i < data.length; i++) {
		var datum = data[i];
		var dx = mouseX - datum.x;
		var dy = mouseY - datum.y;
		if ((dx * dx + dy * dy) < (datum.radius * datum.radius)) {
			window.location.href = url_base + datum.id;
		}
	}
}

// Draw the system view
function drawSystemView(system, system_bodies) {
	if(system == null){
		console.error("system is null");
		return;
	}
	if(system_bodies == null){
		console.error("system_bodies is null");
		return;
	}
	var canvas = document.getElementById("system-view");
	if(canvas == null) {
		console.error("system-view canvas is null");
		return;
	}
	canvas.width = canvas.offsetWidth;
	canvas.height = canvas.offsetHeight;

	var context = canvas.getContext("2d");

	context.fillStyle = "rgb(0, 0, 0)";
	context.fillRect(0, 0, canvas.width, canvas.height);

	var max_radius = 0.9 * 0.5 * Math.min(canvas.offsetWidth, canvas.offsetHeight);

	var center_x = canvas.offsetWidth / 2;
	var center_y = canvas.offsetHeight / 2;

	// TODO stars

	var body_data = [];

	for(var i = 0; i < system_bodies.length; i++) {
		var pos = polarToCartesian(max_radius, center_x, center_y, system_bodies[i].orbitalRadius, system_bodies[i].theta);

		context.beginPath();
		var size = 0;
		var color = "rgb(255, 255, 255)";
		switch(system_bodies[i].type){
			case "asteroid":
				size = 5;
				color = "rgb(180, 180, 180)";
				break;
			case "planet":
				size = 10;
				break;
			default:
				console.error("Unknown planet type: " + system_bodies[i].type);
		}

		body_data.push({
			x: pos.x,
			y: pos.y,
			radius: size,
			name: system_bodies[i].name,
			id: system_bodies[i].bodyID
		});

		// Draw orbit path
		context.arc(center_x, center_y, pos.radius, 0, 360);
		context.setLineDash([20, 15]);
		context.lineWidth = 1;
		context.strokeStyle = "rgb(255, 255, 255)";
		context.stroke();

		context.beginPath();

		// Draw body
		context.arc(pos.x, pos.y, size, 0, 360);
		context.fillStyle = color;
		context.fill();
	}

	var saved_canvas = context.getImageData(0, 0, canvas.width, canvas.height);
	canvas.addEventListener('mousemove', e => canvasHandleMouseMove(e, body_data, canvas, context, saved_canvas));
	canvas.addEventListener('mousedown', e => canvasHandleMouseDown(e, body_data, canvas, "/bodies/view/"));
}

var galaxy_data = null;

async function drawGalaxyView(hyperlanes, systems) {
	if(hyperlanes == null){
		console.error("hyperlanes is null");
		return;
	}
	if(systems == null){
		console.error("systems is null");
		return;
	}
	var canvas = document.getElementById("galaxy-view");
	if(canvas == null) {
		console.error("galaxy-view canvas is null");
		return;
	}
	canvas.width = canvas.offsetWidth;
	canvas.height = canvas.offsetHeight;

	var context = canvas.getContext("2d");

	context.fillStyle = "rgb(0, 0, 0)";
	context.fillRect(0, 0, canvas.width, canvas.height);

	var min_radius = 0.55 * 0.5 * Math.min(canvas.offsetWidth, canvas.offsetHeight);
	var max_radius = 0.9 * 0.5 * Math.min(canvas.offsetWidth, canvas.offsetHeight);

	var center_x = canvas.offsetWidth / 2;
	var center_y = canvas.offsetHeight / 2;

	var system_data = [];

	var system_size = 2;

	// Draw galactic center
	var galactic_center_width = min_radius * 2;
	var base_image = await addImageProcess("galactic_center.png");
	context.drawImage(base_image, center_x - galactic_center_width / 2, center_y - galactic_center_width / 2, galactic_center_width, galactic_center_width);

	// Draw systems
	for(var i = 0; i < systems.length; i++) {
		var pos = polarToCartesian(max_radius, center_x, center_y, systems[i].orbitalRadius,  systems[i].theta);

		context.beginPath();
		context.arc(pos.x, pos.y, system_size, 0, 360);
		context.fillStyle = "rgb(255, 255, 255)";
		context.fill();

		system_data.push({
			x: pos.x,
			y: pos.y,
			radius: system_size,
			name: systems[i].name,
			id: systems[i].systemID,
		});
	}

	var hyperlane_data = [];

	// Draw hyperlanes
	for(var i = 0; i < hyperlanes.length; i++) {
		var pos1 = polarToCartesian(max_radius, center_x, center_y, hyperlanes[i].system1OrbitalRadius,  hyperlanes[i].system1Theta);
		var start_x = pos1.x
		var start_y = pos1.y;

		var pos2 = polarToCartesian(max_radius, center_x, center_y, hyperlanes[i].system2OrbitalRadius,  hyperlanes[i].system2Theta);
		var end_x = pos2.x
		var end_y = pos2.y;

		context.beginPath();
		context.lineWidth = 1;
		context.strokeStyle = "rgba(255, 255, 255, 0.5)";
		context.moveTo(start_x, start_y);
		context.lineTo(end_x, end_y);
		context.stroke();

		hyperlane_data.push({
			start_x: start_x,
			start_y: start_y,
			end_x: end_x,
			end_y: end_y,
			data: hyperlanes[i]
		});
	}
	var saved_canvas = context.getImageData(0, 0, canvas.width, canvas.height);
	galaxy_data = {
		system_data: system_data,
		hyperlane_data: hyperlane_data,
		saved_canvas: saved_canvas,
		context: context,
		highlighted: null
	};
	canvas.addEventListener('mousemove', e => canvasHandleMouseMove(e, system_data, canvas, context, saved_canvas));
	canvas.addEventListener('mousedown', e => canvasHandleMouseDown(e, system_data, canvas, "/systems/view/"));
}

function highlightHyperlane(system1ID, system2ID){
	if(galaxy_data != null){
		saved_canvas = galaxy_data.saved_canvas;
		context = galaxy_data.context;
		context.putImageData(saved_canvas, 0, 0);

		var new_highlighted = system1ID + " " + system2ID;
		if(galaxy_data.highlighted != new_highlighted) {

			var hyperlane = galaxy_data.hyperlane_data.find(e => e.data.system1ID == system1ID && e.data.system2ID == system2ID);
			if(hyperlane != null) {
				context.beginPath();
				context.lineWidth = 3;
				context.strokeStyle = HIGHLIGHT_COLOR;
				context.moveTo(hyperlane.start_x, hyperlane.start_y);
				context.lineTo(hyperlane.end_x, hyperlane.end_y);
				context.stroke();
			}
			galaxy_data.highlighted = new_highlighted;
		} else {
			galaxy_data.highlighted = null;
		}
	}
}
function highlightSystem(systemID){
	if(galaxy_data != null){
		saved_canvas = galaxy_data.saved_canvas;
		context = galaxy_data.context;
		context.putImageData(saved_canvas, 0, 0);

		var new_highlighted = systemID;
		if(galaxy_data.highlighted != new_highlighted) {

			var system = galaxy_data.system_data.find(e => e.id == systemID);
			if(system != null) {
				console.log("HERE");
				context.beginPath();
				context.arc(system.x, system.y, system.radius * 1.5, 0, 360);
				context.fillStyle = HIGHLIGHT_COLOR;
				context.fill();
				drawBodyName(context, system);
			}
			galaxy_data.highlighted = new_highlighted;
		} else {
			galaxy_data.highlighted = null;
		}
	}
}