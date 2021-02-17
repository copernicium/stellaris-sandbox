const MODAL_ID = "modal"
const MODAL_BACKDROP_ID = "modal-backdrop"
const MODAL_OPEN_BUTTON_ID = "modal-open-button";
const MODAL_CANCEL_BUTTON_ID = "modal-cancel-button";
const MODAL_ACCEPT_BUTTON_ID = "modal-accept-button";

function postToServer(url, context) {
	var request = new XMLHttpRequest();
	request.open("POST", url);

	var requestBody = JSON.stringify(context);

	request.addEventListener("load", function (event) {
		if (event.target.status === 200) {
			// TODO
		} else {
			alert("Error adding empire on server: " + event.target.response);
		}
	});

	request.setRequestHeader("Content-Type", "application/json");
	request.send(requestBody);
}

function getRandom(min, max) {
	return Math.floor(Math.random() * (max - min + 1)) + min;
}

function setupStarfield() {
	// Code adapted from: 
	// http://thenewcode.com/81/Make-A-Starfield-Background-with-HTML5-Canvas
	var canvas = document.getElementById("starfield");
	if(canvas == null) {
		return;
	}
	canvas.width = canvas.offsetWidth;
	canvas.height = canvas.offsetHeight;

	var num_stars = 0.002 * canvas.offsetWidth * canvas.offsetHeight;
	var context = canvas.getContext("2d");

	context.fillStyle = "rgba(0, 0, 0, 0.85)";
	context.fillRect(0, 0, canvas.offsetWidth, canvas.offsetHeight);

	var colorrange = [0, 60, 240];
	for (var i = 0; i < num_stars; i++) {
		var x = Math.random() * canvas.offsetWidth;
		var y = Math.random() * canvas.offsetHeight;
		var radius = Math.random() * 1.2;
		var hue = colorrange[getRandom(0, colorrange.length - 1)];
		var sat = getRandom(50, 100);
		context.beginPath();
		context.arc(x, y, radius, 0, 360);
		context.fillStyle = "hsl(" + hue + ", " + sat + "%, 88%)";
		context.fill();
	}
}

// Add body/system name tooltip on hover in canvas
function canvasHandleMouseMove(e, data, canvas, context, saved_canvas) {
	var mouseX = e.pageX - canvas.offsetLeft;
	var mouseY = e.pageY - canvas.offsetTop;

	context.putImageData(saved_canvas, 0, 0);
	document.body.style.cursor = "default";

	context.font = "12px Helvetica, sans-serif";
	for (var i = 0; i < data.length; i++) {
		var datum = data[i];
		var dx = mouseX - datum.x;
		var dy = mouseY - datum.y;
		if ((dx * dx + dy * dy) < (datum.radius * datum.radius)) {
			context.fillText(datum.name, datum.x + datum.radius, datum.y - datum.radius);
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

function setupSystemView(system, system_bodies) { // TODO
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
		return;
	}
	canvas.width = canvas.offsetWidth;
	canvas.height = canvas.offsetHeight;

	var context = canvas.getContext("2d");

	context.stokeStyle = "rgb(0, 0, 0)";
	context.lineWidth = 5;
	context.strokeRect(0, 0, canvas.offsetWidth, canvas.offsetHeight);

	context.fillStyle = "rgb(0, 0, 0)";
	context.fillRect(0, 0, canvas.width, canvas.height);

	var max_radius = 0.9 * 0.5 * Math.min(canvas.offsetWidth, canvas.offsetHeight);

	var center_x = canvas.offsetWidth / 2;
	var center_y = canvas.offsetHeight / 2;
	
	// TODO stars

	var body_data = [];

	for(var i = 0; i < system_bodies.length; i++) {
		var radius = max_radius * system_bodies[i].orbitalRadius;
		var theta = system_bodies[i].theta * 2 * Math.PI / 360;
		var x = center_x +  radius * Math.cos(theta);
		var y = center_y + radius * Math.sin(theta);
		
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
			x: x,
			y: y,
			radius: size,
			name: system_bodies[i].name,
			id: system_bodies[i].bodyID
		});

		// Draw orbit path
		context.arc(center_x, center_y, radius, 0, 360);
		context.setLineDash([5, 15]);
		context.lineWidth = 1;
		context.strokeStyle = "rgb(255, 255, 255)";
		context.stroke();

		context.beginPath();

		// Draw body
		context.arc(x, y, size, 0, 360);
		context.fillStyle = color;
		context.fill();
	}

	var saved_canvas = context.getImageData(0, 0, canvas.width, canvas.height);
	canvas.addEventListener('mousemove', e => canvasHandleMouseMove(e, body_data, canvas, context, saved_canvas));
	canvas.addEventListener('mousedown', e => canvasHandleMouseDown(e, body_data, canvas, "/bodies/view/"));
}

var galaxy_data = null;

function setupGalaxyView(hyperlanes, systems) {
	var canvas = document.getElementById("galaxy-view");
	if(canvas == null) {
		return;
	}
	canvas.width = canvas.offsetWidth;
	canvas.height = canvas.offsetHeight;

	var context = canvas.getContext("2d");

	context.stokeStyle = "rgb(0, 0, 0)";
	context.lineWidth = 5;
	context.strokeRect(0, 0, canvas.offsetWidth, canvas.offsetHeight);

	context.fillStyle = "rgb(0, 0, 0)";
	context.fillRect(0, 0, canvas.width, canvas.height);

	var max_radius = 0.9 * 0.5 * Math.min(canvas.offsetWidth, canvas.offsetHeight);

	var center_x = canvas.offsetWidth / 2;
	var center_y = canvas.offsetHeight / 2;

	var system_data = [];

	var size = 2;

	// Draw systems
	for(var i = 0; i < systems.length; i++) {
		var radius = max_radius * systems[i].orbitalRadius;
		var theta = systems[i].theta * 2 * Math.PI / 360;
		var x = center_x +  radius * Math.cos(theta);
		var y = center_y + radius * Math.sin(theta);

		context.beginPath();
		context.arc(x, y, size, 0, 360);
		context.fillStyle = "rgb(255, 255, 255)";
		context.fill();

		system_data.push({
			x: x,
			y: y,
			radius: size,
			name: systems[i].name,
			id: systems[i].systemID,
		});
	}

	var hyperlane_data = [];

	// Draw hyperlanes
	for(var i = 0; i < hyperlanes.length; i++) {
		var radius1 = max_radius * hyperlanes[i].system1OrbitalRadius;
		var theta1 = hyperlanes[i].system1Theta * 2 * Math.PI / 360;
		var start_x = center_x +  radius1 * Math.cos(theta1);
		var start_y = center_y + radius1 * Math.sin(theta1);

		var radius2 = max_radius * hyperlanes[i].system2OrbitalRadius;
		var theta2 = hyperlanes[i].system2Theta * 2 * Math.PI / 360;
		var end_x = center_x +  radius2 * Math.cos(theta2);
		var end_y = center_y + radius2 * Math.sin(theta2);

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
		hyperlane_data: hyperlane_data,
		saved_canvas: saved_canvas,
		context: context,
		highlighted: false
	};
	canvas.addEventListener('mousemove', e => canvasHandleMouseMove(e, system_data, canvas, context, saved_canvas));
	canvas.addEventListener('mousedown', e => canvasHandleMouseDown(e, system_data, canvas, "/systems/view/"));
}

function highlightHyperlane(system1ID, system2ID){
	if(galaxy_data != null){
		saved_canvas = galaxy_data.saved_canvas;
		context = galaxy_data.context;
		context.putImageData(saved_canvas, 0, 0);

		if(!galaxy_data.highlighted) {

			var hyperlane = galaxy_data.hyperlane_data.find(e => e.data.system1ID == system1ID && e.data.system2ID == system2ID);
			if(hyperlane != null) {
				context.beginPath();
				context.lineWidth = 3;
				context.strokeStyle = "rgb(242, 231, 15)";
				context.moveTo(hyperlane.start_x, hyperlane.start_y);
				context.lineTo(hyperlane.end_x, hyperlane.end_y);
				context.stroke();
			}
		}
		galaxy_data.highlighted = !galaxy_data.highlighted;
	}
}

function doSystemSearchUpdate() {
	var search_query = document.getElementById("system-search-input").value;
	var context = {
		search_query: search_query
	};
	postToServer("/systems/search", context);
}

var confirmation_modal_confirm_function = undefined;

function createDeleteModal(delete_url, id) {
	createConfirmationModal(() => {
		var delete_context = {
			id: id
		};
		postToServer(delete_url, delete_context);
		location.reload();
	});
}

function confirmConfirmationModal() {
	confirmation_modal_confirm_function();
	removeConfirmationModal();
}

function removeConfirmationModal() {
	document.getElementById("confirmation-modal").remove();
	removeModalBackdrop();
}

function createConfirmationModal(confirm_function) {
	confirmation_modal_confirm_function = confirm_function;

	createModalBackdrop();
	addAtEndOfMain(Handlebars.templates.confirmationModal());
}

function createModalBackdrop() {
	addAtEndOfMain(Handlebars.templates.modalBackdrop());
	setupStarfield();
}

function removeModalBackdrop() {
	document.getElementById("modal-backdrop").remove();
}

function addAtEndOfMain(html) {
	document.getElementsByTagName("main")[0].insertAdjacentHTML("beforeend", html);
}

window.addEventListener("DOMContentLoaded", function() {
	setupStarfield();

	var searchInput = document.getElementById("system-search-input");
	if (searchInput) {
		searchInput.addEventListener("input", doSystemSearchUpdate);
	}
});
