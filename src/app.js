//require('dotenv').config({ path: 'dev.env' });

const path = require('path')
const express = require('express')
const hbs = require('hbs')
require('./db/mongoose.js')

//require('./config/dev.env')
const userRouter = require('./routers/user')
const taskRouter = require('./routers/task')

const app = express()

//Define paths for Express config
const publicDirectoryPath = path.join(__dirname, '../public')
const viewsPath = path.join(__dirname, '../templates/views')
const partialsPath = path.join(__dirname, '../templates/partials')

//Setup handlebars engine and views location
app.set('view engine', 'hbs')
app.set('views', viewsPath)
hbs.registerPartials(partialsPath)

//Setup static directory to serve
app.use(express.static(publicDirectoryPath))


app.get('/', (req, res) => {
    res.render('index', {
        title: 'Task Manager App',
        name: 'Task Manager'
    })
})

app.get('/users', (req, res) => {
    res.render('users', {
        title: 'List of Users',
        name: 'Users'
    })
})

app.get('/users/login', (req, res) => {
    if (!req.query.user) {
        return res.send({
            error: 'This account doesnt exist. You must create a new user.'
        })

    } res.send({
            name: this.name,
            email: this.email,
            avatar: this.avatar
        })
})


app.use(express.json())
app.use(userRouter)
app.use(taskRouter)

module.exports = app