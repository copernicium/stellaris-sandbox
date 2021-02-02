const MODAL_ID = "modal"
const MODAL_BACKDROP_ID = "modal-backdrop"
const MODAL_OPEN_BUTTON_ID = "modal-open-button";
const MODAL_CANCEL_BUTTON_ID = "modal-cancel-button";
const MODAL_ACCEPT_BUTTON_ID = "modal-accept-button";

function setupStarfield() {
	// Code adapted from: 
	// http://thenewcode.com/81/Make-A-Starfield-Background-with-HTML5-Canvas
	var canvas = document.getElementById("starfield");
	if(canvas == null) {
		return;
	}
	var context = canvas.getContext("2d");
	stars = 0.005 * canvas.offsetWidth * canvas.offsetHeight;

	for (var i = 0; i < stars; i++) {
		var x = Math.random() * canvas.offsetWidth;
		y = Math.random() * canvas.offsetHeight,
		radius = Math.random() * 1;
		context.beginPath();
		context.arc(x, y, radius, 0, 360);
		context.fillStyle = "rgba(255, 255, 255, 0.8)";
		context.fill();
	}
}

window.addEventListener("DOMContentLoaded", function() {
	setupStarfield();
});
