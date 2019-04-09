const express = require("express")
const subjects = require("./subjects")
const quiz = require("./quiz")
const users = require("./users")
const teachers = require('./teachers')
const ROLES = require('../config').ROLES
const app = express()

app.use("/subjects",subjects)
app.use("/quiz",quiz)
app.use("/users",users)
app.use("/teachers",teachers)

module.exports = app