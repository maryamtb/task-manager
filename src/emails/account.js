const sgMail = require('@sendgrid/mail')

sgMail.setApiKey(process.env.SENDGRID_API_KEY)

const sendWelcomeEmail = ( (email, name) => {
    sgMail.send({
        to: email,
        from: 'maryamtb.17@gmail.com',
        subject: 'Welcome to Task Manager!',
        text: `Hey, ${name}, thank you for signing up! Let me know how you get along with the app.`
    })
})

const sendByeEmail = ( (email, name) => {
    sgMail.send({
        to: email,
        from: 'maryamtb.17@gmail.com',
        subject: "Sorry to see you go!",
        text: `Hi, ${name}, your Task Manager account has been successfully canceled. We hope to have you back sometime soon.`
    })
})


module.exports = { sendWelcomeEmail, sendByeEmail }