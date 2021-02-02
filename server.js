var express = require("express");
var exphbs = require("express-handlebars");

var app = express();
var port = process.env.PORT || 3000;

app.engine("handlebars", exphbs({ defaultLayout: "main" }));
app.set("view engine", "handlebars");
app.use(express.static("public"));

app.get("/", (req, res, next) => {
	res.status(200).render("homePage");
});

app.get("/empires", (req, res, next) => {
	res.status(200).render("empiresPage");
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
