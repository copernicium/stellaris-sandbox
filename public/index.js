function getFromServer(url, callback) {
	var request = new XMLHttpRequest();
	request.open("GET", url);

	request.addEventListener("load", function (event) {
		if (event.target.status === 200) {
			callback(event.target.response);
		} else {
			alert("Error: " + event.target.response);
		}
	});

	request.send(null);
}

function postToServer(url, context) {
	var request = new XMLHttpRequest();
	request.open("POST", url);

	var requestBody = JSON.stringify(context);

	request.addEventListener("load", function (event) {
		if (event.target.status === 200) {
			// TODO
		} else {
			alert("Error: " + event.target.response);
		}
	});

	request.setRequestHeader("Content-Type", "application/json");
	request.send(requestBody);
}

function getRandom(min, max) {
	return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getRandomStarColor() {
	var colorrange = [0, 60, 240];
	var hue = colorrange[getRandom(0, colorrange.length - 1)];
	var sat = getRandom(50, 100);
	return "hsl(" + hue + ", " + sat + "%, 88%)";
}

function setupStarfield(canvas) {
	// Code adapted from: 
	// http://thenewcode.com/81/Make-A-Starfield-Background-with-HTML5-Canvas
	canvas.width = canvas.offsetWidth;
	canvas.height = canvas.offsetHeight;

	var num_stars = 0.002 * canvas.offsetWidth * canvas.offsetHeight;
	var context = canvas.getContext("2d");

	context.fillStyle = "rgba(0, 0, 0, 0.85)";
	context.fillRect(0, 0, canvas.offsetWidth, canvas.offsetHeight);

	
	for (var i = 0; i < num_stars; i++) {
		var x = Math.random() * canvas.offsetWidth;
		var y = Math.random() * canvas.offsetHeight;
		var radius = Math.random() * 1.2;
		context.beginPath();
		context.arc(x, y, radius, 0, 360);
		context.fillStyle = getRandomStarColor();
		context.fill();
	}
}

function setupStarfields() {
	var canvases = document.getElementsByClassName("starfield");
	for(var i = 0; i < canvases.length; i++) {
		setupStarfield(canvases[i]);
	}
}

var currentSearchBar = null;
var initialValues = {
	id: null,
	text: null
};

function registerNewSearchBar(searchBarId, searchListId) {
	var searchBar = document.getElementById(searchBarId);
	var searchList = document.getElementById(searchListId);
	searchBar.addEventListener("focusin", (event) => {
		currentSearchBar = event.target;
		initialValues.id = currentSearchBar.dataset.id;
		initialValues.text = currentSearchBar.value;
		currentSearchBar.parentElement.appendChild(searchList);
		searchList.classList.remove("hidden");
	});
	searchBar.addEventListener("focusout", (event) => {
		searchList.dispatchEvent(new event.constructor(event.type, event));
	});
	searchBar.addEventListener("keyup", (event) => {
		filterSearchList(searchList, searchBar.value);
	});
}

function filterSearchList(searchList, query) {
	var searchItems = searchList.children;
	for (var i = 0; i < searchItems.length; i++) {
		if (searchItems[i].dataset.id != "null") {
			if (searchItems[i].dataset.text.toLowerCase().includes(query.toLowerCase())) {
				searchItems[i].classList.remove("hidden");
			} else {
				searchItems[i].classList.add("hidden");
			}
		}
	}
}

function setupSearchList(dataList, searchBarIds, searchListId, idProp, textProp, nullable, chosenCallback, selectionCancelledCallback) {
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
			currentSearchBar.selection_occurred = true;
			searchList.classList.add("hidden");
			currentSearchBar.dataset.id = event.target.dataset.id;
			currentSearchBar.value = event.target.dataset.text;
			if (chosenCallback != null) {
				chosenCallback(currentSearchBar);
			}
			if (currentSearchBar) {
				currentSearchBar.blur();
			}
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

	for (var i = 0; i < searchBarIds.length; i++) {
		var searchBar = document.getElementById(searchBarIds[i]);
		searchBar.addEventListener("focusin", (event) => {
			currentSearchBar = event.target;
			initialValues.id = currentSearchBar.dataset.id;
			initialValues.text = currentSearchBar.value;
			currentSearchBar.parentElement.appendChild(searchList);
			searchList.classList.remove("hidden");
		});
		searchBar.addEventListener("focusout", (event) => {
			searchList.dispatchEvent(new event.constructor(event.type, event));
		});
		searchBar.addEventListener("keyup", (event) => {
			filterSearchList(searchList, searchBar.value);
		});
	}
	searchList.addEventListener("focusout", () => {
		searchList.classList.add("hidden");
		var searchItems = searchList.children;
		for (var i = 0; i < searchItems.length; i++) {
			searchItems[i].classList.remove("hidden");
		}
		var selectionOccurred = currentSearchBar.selection_occurred;
		currentSearchBar.selection_occurred = false;
		if (!selectionOccurred) {
			currentSearchBar.dataset.id = initialValues.id;
			currentSearchBar.value = initialValues.text;
		}
		if (selectionCancelledCallback != null && !selectionOccurred) {
			selectionCancelledCallback(searchList, currentSearchBar);
		}
		currentSearchBar = null;
	});
	searchList.addEventListener("mousedown", (event) => {
		event.preventDefault();
	});
}

var confirmation_modal_confirm_function = undefined;

function createDeleteModal(delete_url, id) {
	createDeleteModalWithCallback(delete_url, {id: id}, () => { window.location.reload() });
}

function createDeleteModalWithCallback(delete_url, delete_context, callback) {
	createConfirmationModal(() => {
		postToServer(delete_url, delete_context);
		callback();
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
	setupStarfields();
}

function removeModalBackdrop() {
	document.getElementById("modal-backdrop").remove();
}

function addAtEndOfMain(html) {
	document.getElementsByTagName("main")[0].insertAdjacentHTML("beforeend", html);
}

function addImageProcess(src){
	return new Promise((resolve, reject) => {
		var image = new Image();
		image.src = src;
		image.onload = () => resolve(image);
		image.onerror = reject;
	});
}

function matchColumnLengths() { 
	var rightCol = document.getElementsByClassName("right-col");
	if(rightCol != null && rightCol.length > 0) {
		rightCol = rightCol[0];
		var leftCol = document.getElementsByClassName("left-col");
		if(leftCol != null && leftCol.length > 0) {
			leftCol = leftCol[0];
			rightCol.offsetHeight = leftCol.offsetHeight;
			rightCol.setAttribute("style","height:" + leftCol.offsetHeight + "px !important;");
		}
	}
}

window.addEventListener("DOMContentLoaded", function() {
	setupStarfields();

	matchColumnLengths();
});
