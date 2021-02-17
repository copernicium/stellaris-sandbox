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

function doSystemSearchUpdate() {
	var search_query = document.getElementById("system-search-input").value;
	var context = {
		search_query: search_query
	};
	postToServer("/systems/search", context);
}

function setupSearchList(dataList, searchContainerId, searchBarId, searchListId, idProp, textProp, nullable) {
	var searchContainer = document.getElementById(searchContainerId);
	var searchBar = document.getElementById(searchBarId);
	var searchList = document.getElementById(searchListId);

	function addSearchItem(datum) {
		var searchItemContext = {
			id: datum[idProp],
			text: datum[textProp]
		};
		var searchItemHTML = Handlebars.templates.searchItem(searchItemContext);
		searchList.insertAdjacentHTML("beforeend", searchItemHTML);
		var searchItem = searchList.lastElementChild;
		searchItem.addEventListener("click", (event) => {
			searchList.classList.add("hidden");
			searchBar.dataset.id = event.target.dataset.id;
			searchBar.value = event.target.dataset.text;
		});
	}

	if (nullable) {
		var nullDatum = {};
		nullDatum[idProp] = "null";
		nullDatum[textProp] = "None";
		addSearchItem(nullDatum);
	}

	for (var i = 0; i < dataList.length; i++) {
		addSearchItem(dataList[i]);
	}

	searchBar.addEventListener("focusin", () => {
		searchList.classList.remove("hidden");
		searchList.focus();
	});
	searchList.addEventListener("focusout", () => {
		searchList.classList.add("hidden");
	});
	searchBar.addEventListener("keyup", () => {
		// TODO
	});
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
