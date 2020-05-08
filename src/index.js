const express = require('express');
const path = require('path');
const http = require('http');
const socketio = require('socket.io');
const Filter = require('bad-words');
const { generateMessage, generateLocationMessage } = require('./utils/messages');
const { addUser, removeUser, getUser, getUsersInRoom } = require('./utils/users');

const app = express()
const server = http.createServer(app)
const io = socketio(server)

const port = process.env.PORT
const viewsPath = path.join(__dirname, '../public')

app.use(express.static(viewsPath))
app.set('views', viewsPath)

io.on('connection', (socket) => {
    console.log('New WebSocket connection')

    socket.on('join', ({ username, room }, cb) => {
        const { error, user } = addUser({ id: socket.id, username, room })

        if(error){
            return cb(error)
        }

        socket.join(user.room)

        socket.emit('welcomeMsg', generateMessage('Admin',`Welcome, ${user.username}!`))
        socket.broadcast.to(user.room).emit('welcomeMsg', generateMessage('Admin',`${user.username} has joined!`))
        io.to(user.room).emit('roomData', {
            room: user.room,
            users: getUsersInRoom(user.room)
        })
        cb()
    })


    socket.on('welcome', (msg, cb) => {
        const user = getUser(socket.id)
        const filter = new Filter()

        if(filter.isProfane(msg)){
            return cb('Profanity is not allowed')
        }

        io.to(user.room).emit('welcomeMsg', generateMessage(user.username,msg))
        cb('Delivered!')
    })

    socket.on('disconnect', () => {
        const user = removeUser(socket.id)

        if(user){
            io.to(user.room).emit('welcomeMsg', generateMessage(`${user.username} has left!`))
            io.to(user.room).emit('roomData', {
                room: user.room,
                users: getUsersInRoom(user.room)
            })
        }
    })

    socket.on('sendLocation', (obj, cb) => {
        const user = getUser(socket.id)
        io.to(user.room).emit('locationMessage', generateLocationMessage(user.username,`https://google.com/maps?q=${obj.lat},${obj.long}`))
        cb('Location shared!')
    })
})

server.listen(port, () => {
    console.log(`Server up & running on localhost:${port}`)
})