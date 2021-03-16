const HIGHLIGHT_COLOR = "rgb(242, 231, 15)";

var galaxy_data = null;
var system_data = null;

const PLANET_TYPES = ["arid", "desert", "savannah", "alpine", "arctic", "tundra", "continental", "ocean", "tropical"];
var planet_type_images = null;

const STAR_TYPES = ["class b", "class a", "class f", "class g", "class k", "class m", "class m red giant", "class t brown dwarf"];
var star_type_images = null;

// Determine (x, y) position of a body from its polar coordinates
function polarToCartesian(max_radius, center_x, center_y, orbital_radius, theta){
	var radius = max_radius * orbital_radius;
	var rad_theta = theta * Math.PI / 180;
	var x = center_x +  radius * Math.cos(rad_theta);
	var y = center_y - radius * Math.sin(rad_theta);

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
function canvasHandleMouseMove(e, data, context, saved_canvas) {
	var rect = e.target.getBoundingClientRect();
	var mouseX = e.clientX - rect.left;
	var mouseY = e.clientY - rect.top;

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
function canvasHandleMouseDown(e, data,  url_base) {
	var rect = e.target.getBoundingClientRect();
	var mouseX = e.clientX - rect.left;
	var mouseY = e.clientY - rect.top;

	for (var i = 0; i < data.length; i++) {
		var datum = data[i];
		var dx = mouseX - datum.x;
		var dy = mouseY - datum.y;
		if ((dx * dx + dy * dy) < (datum.radius * datum.radius)) {
			window.location.href = url_base + datum.id;
		}
	}
}

async function drawSystemCenter(max_radius, center_x, center_y, system, context) {
	const STAR_IMAGE_WIDTH = 50;
	switch(system.type) {
		case "unary":
			{
				context.drawImage(star_type_images.get(system.star1Type), center_x - STAR_IMAGE_WIDTH / 2, center_y - STAR_IMAGE_WIDTH / 2, STAR_IMAGE_WIDTH, STAR_IMAGE_WIDTH);
				break;
			}
		case "binary":
			{
				const distance = 0.1;
				var pos1 = polarToCartesian(max_radius, center_x, center_y, distance, 135);
				context.drawImage(star_type_images.get(system.star1Type), pos1.x - STAR_IMAGE_WIDTH / 2, pos1.y - STAR_IMAGE_WIDTH / 2, STAR_IMAGE_WIDTH, STAR_IMAGE_WIDTH);
				var pos2 = polarToCartesian(max_radius, center_x, center_y, distance, 315);
				context.drawImage(star_type_images.get(system.star2Type), pos2.x - STAR_IMAGE_WIDTH / 2, pos2.y - STAR_IMAGE_WIDTH / 2, STAR_IMAGE_WIDTH, STAR_IMAGE_WIDTH);	
				break;
			}
		case "trinary":
			{
				const distance = 0.1;
				var pos1 = polarToCartesian(max_radius, center_x, center_y, distance, 0);
				context.drawImage(star_type_images.get(system.star1Type), pos1.x - STAR_IMAGE_WIDTH / 2, pos1.y - STAR_IMAGE_WIDTH / 2, STAR_IMAGE_WIDTH, STAR_IMAGE_WIDTH);
				var pos2 = polarToCartesian(max_radius, center_x, center_y, distance, 120);
				context.drawImage(star_type_images.get(system.star2Type), pos2.x - STAR_IMAGE_WIDTH / 2, pos2.y - STAR_IMAGE_WIDTH / 2, STAR_IMAGE_WIDTH, STAR_IMAGE_WIDTH);	
				var pos3 = polarToCartesian(max_radius, center_x, center_y, distance, 240);
				context.drawImage(star_type_images.get(system.star3Type), pos3.x - STAR_IMAGE_WIDTH / 2, pos3.y - STAR_IMAGE_WIDTH / 2, STAR_IMAGE_WIDTH, STAR_IMAGE_WIDTH);
				break;
			}
		default:
			{
			console.error("Unrecognized system type: " + system_type);
			}
	}
}

function getRandomBodyColor() {
	var colors = [
		"rgba(147, 123, 52)", // Desert
		"rgb(72, 114, 39)", // Tropical
		"rgb(186, 222, 227)", // Arctic
		"rgb(54, 46, 38)", // Tundra
		"rgb(15, 74, 97)", // Ocean
	];
	return colors[getRandom(0, colors.length - 1)];
}

var orbitColors = {
	"arid": "#907C8D",
	"desert": "#A86940",
	"savannah": "#59525E",
	"alpine": "#716C4E",
	"arctic": "#CFAC9E",
	"tundra": "#504934",
	"continental": "#50546E",
	"ocean": "#38606F",
	"tropical": "#69737C"
};

var asteroidColor = "#D18F77";

// Draw the system view
async function drawSystemView(system, system_bodies) {
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

	if (planet_type_images == null) {
		planet_type_images = new Map();
		for (var i = 0; i < PLANET_TYPES.length; i++) {
			var image = await addImageProcess("/bodies/" + PLANET_TYPES[i] + ".png");
			planet_type_images.set(PLANET_TYPES[i], image);
		}
		var image = await addImageProcess("/bodies/asteroid.png");
		planet_type_images.set("asteroid", image);
	}

	if (star_type_images == null) {
		star_type_images = new Map();
		for (var i = 0; i < STAR_TYPES.length; i++) {
			var image = await addImageProcess("/stars/" + STAR_TYPES[i] + ".png");
			star_type_images.set(STAR_TYPES[i], image);
		}
	}
	canvas.width = canvas.offsetWidth;
	canvas.height = canvas.offsetHeight;

	var context = canvas.getContext("2d");

	// Draw black background behind everything
	context.fillStyle = "rgb(0, 0, 0)";
	context.fillRect(0, 0, canvas.width, canvas.height);
	setupStarfieldContext(context, canvas.offsetWidth, canvas.offsetHeight, false);

	var max_radius = 0.9 * 0.5 * Math.min(canvas.offsetWidth, canvas.offsetHeight);

	var center_x = canvas.offsetWidth / 2;
	var center_y = canvas.offsetHeight / 2;

	// Draw stars
	drawSystemCenter(max_radius, center_x, center_y, system, context);

	// Draw orbit paths
	for(var i = 0; i < system_bodies.length; i++) {
		var pos = polarToCartesian(max_radius, center_x, center_y, system_bodies[i].orbitalRadius, system_bodies[i].theta);
		
		context.beginPath();
		context.arc(center_x, center_y, pos.radius, 0, 360);
		// context.setLineDash([20, 15]);
		context.lineWidth = 1;
		context.strokeStyle = system_bodies.type == "asteroid" ? asteroidColor : orbitColors[system_bodies[i].planetType];
		context.stroke();
	}

	// Draw bodies
	var body_data = [];

	for(var i = 0; i < system_bodies.length; i++) {
		var pos = polarToCartesian(max_radius, center_x, center_y, system_bodies[i].orbitalRadius, system_bodies[i].theta);

		var size = 0;
		// var color = "";
		switch(system_bodies[i].type){
			case "asteroid":
				size = 5;
				// color = "rgb(180, 180, 180)";
				break;
			case "planet":
				size = 10;
				// color = getRandomBodyColor();
				break;
			default:
				console.error("Unknown planet type: " + system_bodies[i].type);
		}

		const IMAGE_WIDTH = size * 2// px

		var y = ((canvas.offsetHeight - pos.y) - center_y) / center_y;
		var x = (pos.x - center_x) / center_x;

		var body_angle = -Math.atan2(y, x);

		context.translate(pos.x, pos.y);
		context.rotate(body_angle);
		context.drawImage(planet_type_images.get((system_bodies[i].planetType != null) ? system_bodies[i].planetType : "asteroid"), - IMAGE_WIDTH / 2, - IMAGE_WIDTH / 2, IMAGE_WIDTH, IMAGE_WIDTH);
		context.rotate(-body_angle);
		context.translate(-pos.x, -pos.y);

		body_data.push({
			x: pos.x,
			y: pos.y,
			radius: size,
			name: system_bodies[i].name,
			id: system_bodies[i].bodyID
		});
	}

	var saved_canvas = context.getImageData(0, 0, canvas.width, canvas.height);
	system_data = {
		body_data: body_data,
		saved_canvas: saved_canvas,
		context: context,
		highlighted: null
	};

	canvas.addEventListener('mousemove', e => canvasHandleMouseMove(e, body_data, context, saved_canvas));
	canvas.addEventListener('mousedown', e => canvasHandleMouseDown(e, body_data, "/bodies/view/"));
}

function makeRegionHighlightContext(systems, highlight_color) {
	return {
		systems: systems,
		highlight_color: highlight_color
	};
}

function getRegionHighlightColor(systemID, region_highlights) {
	for (var i = 0; i < region_highlights.length; i++) {
		if (region_highlights[i].systems.find(e => e.systemID == systemID) != null) {
			return region_highlights[i].highlight_color;
		}
	}
	return null;
}

var starTypeColors = {
	"class b": [174, 159, 186],
	"class a": [150, 175, 198],
	"class f": [162, 172, 180],
	"class g": [206, 191, 146],
	"class k": [163, 127, 95],
	"class m": [149, 68, 65],
	"class m red giant": [220, 143, 139],
	"class t brown dwarf": [133, 108, 124]
}

function getStarColor(system) {
	var starTypes = [system.star1Type, system.star2Type, system.star3Type];
	var nStars = 0;
	var r = 0, g = 0, b = 0;
	for (var i = 0; i < starTypes.length; i++) {
		if (starTypes[i] == null) break;
		var colors = starTypeColors[starTypes[i]];
		r += colors[0];
		g += colors[1];
		b += colors[2];
		nStars++;
	}
	r /= nStars;
	g /= nStars;
	b /= nStars;
	return `rgb(${r}, ${g}, ${b})`;
}

async function drawGalaxyView(hyperlanes, systems, region_highlights = []) {
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

	// Draw background
	context.fillStyle = "rgb(0, 0, 0)";
	context.fillRect(0, 0, canvas.width, canvas.height);
	setupStarfieldContext(context, canvas.offsetWidth, canvas.offsetHeight, false);

	var min_radius = 0.55 * 0.5 * Math.min(canvas.offsetWidth, canvas.offsetHeight);
	var max_radius = 0.9 * 0.5 * Math.min(canvas.offsetWidth, canvas.offsetHeight);

	var center_x = canvas.offsetWidth / 2;
	var center_y = canvas.offsetHeight / 2;

	// Draw galactic center
	var galactic_center_width = min_radius * 2;
	var image = await addImageProcess("/galactic_center.png");
	context.drawImage(image, center_x - galactic_center_width / 2, center_y - galactic_center_width / 2, galactic_center_width, galactic_center_width);

	var systems_data = [];

	var system_size = 2;

	// Draw systems
	for(var i = 0; i < systems.length; i++) {
		var pos = polarToCartesian(max_radius, center_x, center_y, systems[i].orbitalRadius,  systems[i].theta);

		var highlight_color = getRegionHighlightColor(systems[i].systemID, region_highlights);

		if (highlight_color != null) {
			context.beginPath();
			context.arc(pos.x, pos.y, system_size * 1.2, 0, 360);
			context.fillStyle = "#FFF";
			context.fill();
		}

		context.beginPath();
		context.arc(pos.x, pos.y, system_size, 0, 360);
		context.fillStyle = highlight_color != null ? highlight_color : getStarColor(systems[i]);
		context.fill();

		systems_data.push({
			x: pos.x,
			y: pos.y,
			radius: system_size,
			name: systems[i].name,
			id: systems[i].systemID,
		});
	}

	var hyperlane_data = [];

	const LINE_WIDTH = 1;

	// Draw hyperlanes
	for(var i = 0; i < hyperlanes.length; i++) {
		var pos1 = polarToCartesian(max_radius, center_x, center_y, hyperlanes[i].system1OrbitalRadius,  hyperlanes[i].system1Theta);
		var start_x = pos1.x
		var start_y = pos1.y;

		var pos2 = polarToCartesian(max_radius, center_x, center_y, hyperlanes[i].system2OrbitalRadius,  hyperlanes[i].system2Theta);
		var end_x = pos2.x
		var end_y = pos2.y;

		var highlight_color = getRegionHighlightColor(hyperlanes[i].system1ID, region_highlights);
		var check_highlight_color = getRegionHighlightColor(hyperlanes[i].system2ID, region_highlights);

		if (highlight_color != check_highlight_color) {
			highlight_color = null;
		}

		if (highlight_color != null) {
			context.beginPath();
			context.lineWidth = LINE_WIDTH * 2;
			context.strokeStyle = "rgba(255, 255, 255, 0.5)";
			context.moveTo(start_x, start_y);
			context.lineTo(end_x, end_y);
			context.stroke();
		}

		context.beginPath();
		context.lineWidth = LINE_WIDTH;
		context.strokeStyle = highlight_color != null ? highlight_color : "rgba(255, 255, 255, 0.5)";
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
		systems_data: systems_data,
		hyperlane_data: hyperlane_data,
		saved_canvas: saved_canvas,
		context: context,
		highlighted: null
	};
	canvas.addEventListener('mousemove', e => canvasHandleMouseMove(e, systems_data, context, saved_canvas));
	canvas.addEventListener('mousedown', e => canvasHandleMouseDown(e, systems_data, "/systems/view/"));
}

async function drawBodyView(type, planetType, orbitalRadius, theta) {
	var canvas = document.getElementById("body-view");
	if(canvas == null) {
		console.error("body-view canvas is null");
		return;
	}

	if (planet_type_images == null) {
		planet_type_images = new Map();
		for (var i = 0; i < PLANET_TYPES.length; i++) {
			var image = await addImageProcess("/bodies/" + PLANET_TYPES[i] + ".png");
			planet_type_images.set(PLANET_TYPES[i], image);
		}
		var image = await addImageProcess("/bodies/asteroid.png");
		planet_type_images.set("asteroid", image);
	}

	canvas.width = canvas.offsetWidth;
	canvas.height = canvas.offsetHeight;

	var context = canvas.getContext("2d");

	// Draw black background behind everything
	context.fillStyle = "rgb(0, 0, 0)";
	context.fillRect(0, 0, canvas.width, canvas.height);
	setupStarfieldContext(context, canvas.offsetWidth, canvas.offsetHeight, false);

	var center_x = canvas.offsetWidth / 2;
	var center_y = canvas.offsetHeight / 2;
	var max_radius = 0.9 * 0.5 * Math.min(canvas.offsetWidth, canvas.offsetHeight);
	var pos = polarToCartesian(max_radius, center_x, center_y, orbitalRadius, theta);

	var y = ((canvas.offsetHeight - pos.y) - center_y) / center_y;
	var x = (pos.x - center_x) / center_x;
	var body_angle = -Math.atan2(y, x);

	var width = canvas.offsetWidth * .66;
	var image_key = "";
	switch(type){
		case "asteroid":
			width *= .5;
			image_key = "asteroid";
			break;
		case "planet":
			width *= 1;
			image_key = planetType;
			break;
		default:
			console.error("Unknown planet type: " + type);
	}

	context.translate(center_x, center_y);
	context.rotate(body_angle);
	context.drawImage(planet_type_images.get((type != "asteroid") ? planetType : "asteroid"), - width / 2, - width / 2, width, width);
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

			var system = galaxy_data.systems_data.find(e => e.id == systemID);
			if(system != null) {
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

function highlightBody(bodyID){
	if (system_data != null){
		saved_canvas = system_data.saved_canvas;
		context = system_data.context;
		context.putImageData(saved_canvas, 0, 0);

		var new_highlighted = bodyID;
		if(system_data.highlighted != new_highlighted) {

			var body = system_data.body_data.find(e => e.id == bodyID);
			if(body != null) {
				context.beginPath();
				context.arc(body.x, body.y, body.radius, 0, 360);
				context.fillStyle = HIGHLIGHT_COLOR;
				context.fill();
				drawBodyName(context, body);
			}
			system_data.highlighted = new_highlighted;
		} else {
			system_data.highlighted = null;
		}
	}
}
