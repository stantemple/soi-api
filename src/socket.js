var app = require('http').createServer()
var io = require('socket.io')(app, {
  cors: {
    origin: '*'
  }
})

app.listen(8080, '0.0.0.0')

io.on('connection', function (socket) {
  socket.emit('init', { hello: 'world' })
  socket.on('ping', function (data) {
    console.log('socket ping', data)
    socket.emit('pong', data)
  })
  socket.on('action', function (data) {
    console.log('socket action', data)
    io.emit('action', data)
  })
})
