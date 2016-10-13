var
	express = require('express'),
	app = express(),
    cfenv = require('cfenv'),
    appEnv = cfenv.getAppEnv(),
	io = require('socket.io').listen(app.listen(appEnv.port)),
    amqp = require('amqplib/callback_api'),
	hbs = require('hbs');

app.engine('html', hbs.__express);
app.set('view engine', 'hbs');
app.set('views', './');
app.use('/public', express.static(__dirname + '/public'));

app.get('/', function(req, res) {
    res.render('index.html');
});

var pastGames = [];

io.on('connection', function(socket) {

    pastGames.forEach(function(g) {
        socket.emit('boardUpdate', g);
    });
});

var amqpUrl = process.env.amqpUrl;

if (amqpUrl) {

    //Connect to the rabbitmq instance
    amqp.connect(amqpUrl, function(err, conn) {
        conn.createChannel(function(err, channel) {

            //Assert the queues and bind the exchange to it
            channel.assertQueue('', {exclusive: true}, function(err, ok){

                channel.bindQueue(ok.queue, 'msg', '#');

                //Listen on new events
                channel.consume(ok.queue, function(msg) {

                    var gameObject = JSON.parse(msg.content);
                    io.sockets.emit('boardUpdate', gameObject);

                    //Update array of past games
                    pastGames.push(gameObject);

                    if (pastGames.length > 5) {
                        pastGames.splice(0, 1);
                    }

                }, {noAck: true});
            });
        });
    });
}