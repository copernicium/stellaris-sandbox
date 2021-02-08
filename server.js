var express = require("express");
var exphbs = require("express-handlebars");
var bodyParser = require("body-parser");
var mysql = require('./dbcon.js');
var fs = require("fs"); // TODO replace with database

var app = express();
var port = 3845;

app.engine("handlebars", exphbs({ defaultLayout: "main" }));
app.set("view engine", "handlebars");
app.use(bodyParser.json());
app.use(express.static("public"));

function createDefaultContext(name) {
	var active = {};
	active[name] = true;
	return {
		active: active
	};
}

var empires = [];
var systems = [];
var resources = [];
var bodies = [];

var hyperlanes = [];

function loadJSON() { // TODO replace with database
	if(!fs.existsSync("./data.json")) {
		return;
	}

	var data = require("./data.json");
	empires = data.empires;
	systems = data.systems;
	resources = data.resources;
	bodies = data.bodies;
}
loadJSON();

function saveJSON() { // TODO replace with database
	var data = {
		empires: empires,
		systems: systems,
		resources: resources,
		bodies: bodies
	}
	fs.writeFile("./data.json", JSON.stringify(data, null, 4), (err) => {
		if (err) {
			console.error(err);
		}
	});
}

for(var i = 0; i < systems.length; i++){
	var j = systems.length - 1 - i;
	if(j > i) {
		hyperlanes.push({
			system1: systems[i].name,
			system2: sytesm[j].name
		});
	} else {
		break;
	}
}

/*
for(var i = 0; i < 10; i++){
	empires.push({
        name: "The Allied Suns",
        aggressiveness: "passive",
        primary_color: "#FF0000",
        secondary_color: "#00FF00",
        fallen_empire: false
    });
}

for(var i = 0; i < 10; i++){
	systems.push({
        name: "Alpha Centauri",
        star_count: 1,
        orbital_radius: .5,
        theta: 90
    });
}

for(var i = 0; i < 10; i++){
	resources.push({
        name: "Minerals",
        base_market_value: 15,
        color: "#0000FF"
    });
}

for(var i = 0; i < 10; i++){
	bodies.push({
        name: "Earth",
        type: "Planet",
        orbital_radius: .5,
        theta: 90
    });
}
*/

app.get("/", (req, res, next) => {
	res.status(200).render("homePage");
});

app.get("/empires", (req, res, next) => {
	var pageName = "empiresPage";
	var context = createDefaultContext(pageName);
	context.empires = empires;
	res.status(200).render(pageName, context);
});

app.post('/empires/add', (req, res, next) => {
	if (req.hasOwnProperty("body") &&
		req.body.hasOwnProperty("name") &&
		req.body.hasOwnProperty("aggressiveness") &&
		req.body.hasOwnProperty("primary_color") &&
		req.body.hasOwnProperty("secondary_color") &&
		req.body.hasOwnProperty("fallen_empire")
	) {
		empires.push(req.body);
		saveJSON();
		res.status(200).send("Empire successfully added");
	} else {
		res.status(400).send({
			error: "Request body needs a name, aggresiveness, primary_color, secondary_color, and fallen_empire."
		});
	}
});

app.get("/systems", (req, res, next) => {
	var pageName = "systemsPage";
	var context = createDefaultContext(pageName);
	context.systems = systems;
	res.status(200).render(pageName, context);
});

app.post('/systems/add', (req, res, next) => {
	if (req.hasOwnProperty("body") &&
		req.body.hasOwnProperty("name") &&
		req.body.hasOwnProperty("star_count") &&
		req.body.hasOwnProperty("orbital_radius") &&
		req.body.hasOwnProperty("theta")
	) {
		systems.push(req.body);
		saveJSON();
		res.status(200).send("System successfully added");
	} else {
		res.status(400).send({
			error: "Request body needs a name, star_count, orbital_radius, and theta."
		});
	}
});

app.post('/systems/search', (req, res, next) => {
	if (req.hasOwnProperty("body") &&
		req.body.hasOwnProperty("search_query")
	) {
		console.log("Searched " + req.body.search_query); // TODO
		res.status(200).send("Searched query");
	} else {
		res.status(400).send({
			error: "Request body needs a search_query."
		});
	}
});

app.get("/hyperlanes", (req, res, next) => {
	var pageName = "hyperlanesPage";
	var context = createDefaultContext(pageName);
	context.hyperlanes = hyperlanes;
	res.status(200).render(pageName, context);
});

app.post('/hyperlanes/add', (req, res, next) => {
	if (req.hasOwnProperty("body") &&
		req.body.hasOwnProperty("system1") &&
		req.body.hasOwnProperty("system2")
	) {
		hyperlanes.push(req.body);
		saveJSON();
		res.status(200).send("Hyperlane successfully added");
	} else {
		res.status(400).send({
			error: "Request body needs a system1 and system2."
		});
	}
});


app.get("/resources", (req, res, next) => {
	var pageName = "resourcesPage";
	var context = createDefaultContext(pageName);
	context.resources = resources;
	res.status(200).render(pageName, context);
});

app.post('/resources/add', (req, res, next) => {
	if (req.hasOwnProperty("body") &&
		req.body.hasOwnProperty("name") &&
		req.body.hasOwnProperty("base_market_value") &&
		req.body.hasOwnProperty("color")
	) {
		resources.push(req.body);
		saveJSON();
		res.status(200).send("Resource successfully added");
	} else {
		res.status(400).send({
			error: "Request body needs a name, base_market_value, and color."
		});
	}
});

app.get("/bodies", (req, res, next) => {
	var pageName = "bodiesPage";
	var context = createDefaultContext(pageName);
	context.bodies = bodies;
	res.status(200).render(pageName, context);
});

app.post('/bodies/add', (req, res, next) => {
	if (req.hasOwnProperty("body") &&
		req.body.hasOwnProperty("name") &&
		req.body.hasOwnProperty("type") &&
		req.body.hasOwnProperty("orbital_radius") &&
		req.body.hasOwnProperty("theta")
	) {
		bodies.push(req.body);
		saveJSON();
		res.status(200).send("Body successfully added");
	} else {
		res.status(400).send({
			error: "Request body needs a name, type, orbital_radius, orbital_radius, and theta."
		});
	}
});

app.get('*', (req, res) => {
	res.status(404).send("The page you requested doesn't exist");
});

app.listen(port, () => {
	console.log("Server listening on port " + port);
});
