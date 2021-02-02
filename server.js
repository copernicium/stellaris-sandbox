var express = require("express");
var exphbs = require("express-handlebars");

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

var empires = [
    {
        name: "The Allied Suns",
        aggressiveness: "passive",
        primary_color: "FF0000",
        secondary_color: "00FF00",
        fallen_empire: false
    }
];

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
	res.status(200).render("systemsPage");
});

app.get('*', (req, res) => {
	res.status(404).send("The page you requested doesn't exist");1
});

app.listen(port, () => {
	console.log("Server listening on port " + port);
});
