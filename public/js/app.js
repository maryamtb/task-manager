const request = require('request')

const authForm = document.querySelector('form')
const submit = document.querySelector('input')

authForm.addEventListener('submit', (e) => {
    e.preventDefault()

    const user = submit.user_id

    fetch('http://localhost:3000/users?' + user).then((response) => {
        response.json().then((data) => {
            if (data.error) {
                console.log(error)
            } else {
                user.name
                user.email
                user.avatar
            }
        })
    })
})