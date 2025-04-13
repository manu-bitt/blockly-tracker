const express = require('express')
const app = express()
const port = 3000

const http = require('http')
const socketio = require('socket.io')
const path = require('path')   // you forgot to import path

const server = http.createServer(app)
const io = socketio(server)

app.set('view engine', 'ejs')
app.use(express.static(path.join(__dirname, 'Public')))

// phle socket on hoga joki client server ko connect karega then 
io.on('connection',function(socket){
    // phle current location server se jayegi
    socket.on('send-location',function(data){
        io.emit('receive-location',{id: socket.id,...data})
    })
    console.log('connected')
    socket.on('disconnect',function(){
        io.emit('user-disconnected',socket.id)
    })
})

app.get('/', (req, res) => {
    res.render('index')
})



server.listen(3000)

