const express = require("express")
const cors = require("cors")
const bodyParser = require("body-parser")
const cookieParser = require("cookie-parser")
const session = require("express-session")
const routes = require("./routes/routesHandler")
const app = express()

app.use(cors())
app.use(bodyParser.urlencoded({extended:false}))
app.use(bodyParser.json())
app.use(cookieParser())
app.use(session({
    secret: config.sessionSecret,
    resave:false,
    saveUninitialized:false
}))

app.use(routes)
app.use((err,req,res,next)=>{
    console.error(err.stack)
    res.status(500).send("something broke!")
})

module.exports = app