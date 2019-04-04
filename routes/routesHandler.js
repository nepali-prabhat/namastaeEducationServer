const express = require("express")
const subjects = require("./subjects")
const quiz = require("./quiz")
const users = require("./users")
const app = express()

app.get("/",(req,res)=>{
    res.type('json')
    res.send({"name":"prabhat"})
})
app.use("/subjects",subjects)
app.use("/quiz",quiz)
app.use("/users",users)

module.exports = app