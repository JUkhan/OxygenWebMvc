
var server = require("./lib/server.js");

var app = server.start({ port: 8888, defaults: { controller: 'Home', action: 'index' } });

