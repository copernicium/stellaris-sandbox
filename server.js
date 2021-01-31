var express = require("express");

var app = express();
var port = process.env.PORT || 3000;

app.use(express.static("public"));

app.get("/", (req, res, next) => {
	res.status(200).sendFile(__dirname + '/public/index.html');
});

app.get('*', (req, res) => {
	res.status(404).send("The page you requested doesn't exist");
});

app.listen(port, () => {
	console.log("Server listening on port " + port);
});
