const app = require('./app')
const port = 3000
const cookieParser = require('cookie-parser')
const express = require('express')


app.use(express.static('public'))
app.use(express.json())
app.use(express.urlencoded({ extended: false }))
app.use(cookieParser())

app.listen(port, () => {
    console.log(`Server is running on port ${port}`)
})