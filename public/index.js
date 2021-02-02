const MODAL_ID = "modal"
const MODAL_BACKDROP_ID = "modal-backdrop"
const MODAL_OPEN_BUTTON_ID = "modal-open-button";
const MODAL_CANCEL_BUTTON_ID = "modal-cancel-button";
const MODAL_ACCEPT_BUTTON_ID = "modal-accept-button";

function showModal() {
	document.getElementById(MODAL_BACKDROP_ID).classList.remove("hidden");
	document.getElementById(MODAL_ID).classList.remove("hidden");
}

function hideModal() {
	document.getElementById(MODAL_BACKDROP_ID).classList.add("hidden");
	document.getElementById(MODAL_ID).classList.add("hidden");
}

window.addEventListener("DOMContentLoaded", function() {
	var modal = document.getElementById(MODAL_ID);
	if (modal) {
		document.getElementById(MODAL_OPEN_BUTTON_ID).addEventListener("click", showModal);
		document.getElementById(MODAL_CANCEL_BUTTON_ID).addEventListener("click", hideModal);
		document.getElementById(MODAL_ACCEPT_BUTTON_ID).addEventListener("click", hideModal);
	}
});
