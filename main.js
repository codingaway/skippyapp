// Module
var express = require('express');
var app = express();
var http = require('http').Server(app)
var io = require('socket.io')(http);

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
        console.log("CMD: Forward")
    });
    socket.on('left', function(){
        console.log("CMD: Left")
    });
    socket.on('right', function(){
        console.log("CMD: Right")
    });
    socket.on('backward', function(){
        console.log("CMD: Backward")
    });
    socket.on('stop', function(){
        console.log("CMD: Stop")
    });
    
});

// Start server
http.listen(port, function(){
   console.log("Listening on port " + port); 
});
