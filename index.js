var
	express = require('express'),
	app = express(),
  cfenv = require('cfenv'),
  appEnv = cfenv.getAppEnv(),
	io = require('socket.io').listen(app.listen(appEnv.port)),
	hbs = require('hbs');


app.engine('html', hbs.__express);
app.set('view engine', 'hbs');
app.set('views', './');
app.use('/public', express.static(__dirname + '/public'));

app.get('/', function(req, res) {
	res.send('Hello ' + appEnv.url + " " + JSON.stringify(process.env, null, 3));
});

// io.on('connection', function(socket) {
//
//   socket.once('action', function() {
//   });
// });
