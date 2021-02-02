const MODAL_ID = "modal"
const MODAL_BACKDROP_ID = "modal-backdrop"
const MODAL_OPEN_BUTTON_ID = "modal-open-button";
const MODAL_CANCEL_BUTTON_ID = "modal-cancel-button";
const MODAL_ACCEPT_BUTTON_ID = "modal-accept-button";

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
	var context = canvas.getContext("2d");
	stars = 0.002 * canvas.offsetWidth * canvas.offsetHeight;

	colorrange = [0,60,240];
	for (var i = 0; i < stars; i++) {
		var x = Math.random() * canvas.offsetWidth;
		y = Math.random() * canvas.offsetHeight,
		radius = Math.random() * 1,
		hue = colorrange[getRandom(0,colorrange.length - 1)],
		sat = getRandom(50,100);
		context.beginPath();
		context.arc(x, y, radius, 0, 360);
		context.fillStyle = "hsl(" + hue + ", " + sat + "%, 88%)";
		context.fill();
	}
}

window.addEventListener("DOMContentLoaded", function() {
	setupStarfield();
});
