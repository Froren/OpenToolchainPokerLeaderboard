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

var amqpUrl = process.env.amqpUrl;

if (amqpUrl) {
    amqp.connect(amqpUrl, function(err, conn) {
        conn.createChannel(function(err, channel) {
            channel.assertQueue('', {exclusive: true}, function(err, ok){

                channel.bindQueue(ok.queue, 'msg', '#');
                channel.consume(ok.queue, function(msg) {

                    var arr = JSON.parse(msg.content);
                    var outputArray = arr.map(function(o) {
                        return {name: o.name, chips: o.chips};
                    });

                    outputArray.sort(function(a, b) {
                        return b.chips - a.chips;
                    });

                    io.sockets.emit('boardUpdate', (new Date()).toISOString(), outputArray);
                }, {noAck: true});
            });
        });
    });
}