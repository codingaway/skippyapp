// Module
var express = require('express');
var app = express();
var http = require('http').Server(app)
var io = require('socket.io')(http);
var skippy_cls = require('./skippy');
console.log("Initilizing Skippy.");
var skippy = new skippy_cls();

// Define port
var port = 3000;

// View engine
app.set('views', __dirname + '/views');
app.set('view engine', 'jade');

// Set public folder
app.use(express.static(__dirname + '/public'));

// Serve interface
app.get('/', function(req, res){
  res.render('interface');
});

// Listen socket events
io.on('connection', function(socket){
    console.log("A user is connected");
    socket.on('forward', function(){
        console.log("CMD: Forward");
        skippy.goForward();
    });
    socket.on('left', function(){
        console.log("CMD: Left");
        skippy.turnLeft();
    });
    socket.on('right', function(){
        console.log("CMD: Right");
        skippy.turnRight();

    });
    socket.on('backward', function(){
        console.log("CMD: Backward");
        skippy.goBackward();
    });
    socket.on('stop', function(){
        console.log("CMD: Stop");
        skippy.stop();
    });

});

// Start server
http.listen(port, function(){
   console.log("Listening on port " + port);
});
