var express = require("express");
var exphbs = require("express-handlebars");
var mysql = require('./dbcon.js');

var app = express();
var port = 3845;

app.engine("handlebars", exphbs({ defaultLayout: "main" }));
app.set("view engine", "handlebars");
app.use(express.static("public"));

function createDefaultContext(name) {
	var active = {};
	active[name] = true;
	return {
		active: active
	};
}

var empires = [];
for(var i = 0; i < 10; i++){
	empires.push({
        name: "The Allied Suns",
        aggressiveness: "passive",
        primary_color: "FF0000",
        secondary_color: "00FF00",
        fallen_empire: false
    });
}

var systems = [];
for(var i = 0; i < 10; i++){
	systems.push({
        name: "Alpha Centauri",
        star_count: 1,
        orbital_radius: .5,
        theta: 90
    });
}

var resources = [];
for(var i = 0; i < 10; i++){
	resources.push({
        name: "Minerals",
        base_market_value: 15,
        color: "0000FF"
    });
}

var bodies = [];
for(var i = 0; i < 10; i++){
	bodies.push({
        name: "Earth",
        type: "Planet",
        orbital_radius: .5,
        theta: 90
    });
}

app.get("/", (req, res, next) => {
	res.status(200).render("homePage");
});

app.get("/empires", (req, res, next) => {
	var pageName = "empiresPage";
	var context = createDefaultContext(pageName);
	context.empires = empires;
	res.status(200).render(pageName, context);
});

app.get("/systems", (req, res, next) => {
	var pageName = "systemsPage";
	var context = createDefaultContext(pageName);
	context.systems = systems;
	res.status(200).render(pageName, context);
});

app.get("/resources", (req, res, next) => {
	var pageName = "resourcesPage";
	var context = createDefaultContext(pageName);
	context.resources = resources;
	res.status(200).render(pageName, context);
});

app.get("/bodies", (req, res, next) => {
	var pageName = "bodiesPage";
	var context = createDefaultContext(pageName);
	context.bodies = bodies;
	res.status(200).render(pageName, context);
});

app.get('*', (req, res) => {
	res.status(404).send("The page you requested doesn't exist");
});

app.listen(port, () => {
	console.log("Server listening on port " + port);
});
