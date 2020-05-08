const socket = io()

const messageForm = document.querySelector('#message-form')
const messageFormInput = document.querySelector('#chat')
const locationButton = document.querySelector('#send-location')
const sendButton = document.querySelector('#send-text')
const messages = document.querySelector('#messages')
const sidebar = document.querySelector('#sidebar')


const messageTemplate = document.querySelector('#message-template').innerHTML
const locationTemplate = document.querySelector('#location-template').innerHTML
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML

const { username, room } = Qs.parse(location.search, { ignoreQueryPrefix: true })

const autoScroll = () => {
    const newMsg = messages.lastElementChild

    const newMsgStyle = getComputedStyle(newMsg)
    const newMsgMargin = parseInt(newMsgStyle.marginBottom)
    const newMsgHeight = newMsg.offsetHeight + newMsgMargin

    const visibleHeight = messages.offsetHeight

    const containerHeight = messages.scrollHeight

    const scrollOffset = messages.scrollTop + visibleHeight

    if(containerHeight - newMsgHeight <= scrollOffset){
        messages.scrollTop = messages.scrollHeight
    }
}

socket.on('welcomeMsg', (msg) => {
    const html = Mustache.render(messageTemplate, {
        username: msg.username,
        msg: msg.text,
        createdAt: moment(msg.createdAt).format(`h:mm A`)

    })
    console.log(msg)
    messages.insertAdjacentHTML('beforeend', html)
    autoScroll()
})

socket.on('locationMessage', (url) => {
    const anchor = Mustache.render(locationTemplate, {
        username: url.username,
        url: url.url,
        createdAt: moment(url.createdAt).format(`h:m A`)
    })
    messages.insertAdjacentHTML('beforeend', anchor)
    autoScroll()
})

socket.on('roomData', ({ room, users }) => {
    const html = Mustache.render(sidebarTemplate, {
        room,
        users
    })
    sidebar.innerHTML = html
})


const send = messageForm.addEventListener('submit', (e) => {
    e.preventDefault()

    sendButton.setAttribute('disabled', 'disabled')

    const text = messageFormInput.value

    socket.emit('welcome', text, (msg) => {
        sendButton.removeAttribute('disabled')
        messageFormInput.value = ''
        messageFormInput.focus()

        if(msg){
            return console.log(msg)
        }

    })
})


locationButton.addEventListener('click', () => {
    if(!navigator.geolocation){
        return alert('Your browser does not support geolocations.')
    }

    locationButton.setAttribute('disabled', 'disabled')


    navigator.geolocation.getCurrentPosition((pos) => {
        locationButton.removeAttribute('disabled')

        const location = 
             {
                lat: pos.coords.latitude,
                long: pos.coords.longitude
            }
        socket.emit('sendLocation', location, () => {
            console.log('Location shared!')
        })
    })
})

socket.emit('join', { username, room }, (error) => {
    if(error){
        alert(error)

        location.href = '/'
    }
})