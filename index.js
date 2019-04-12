const http = require("http")
config = require('./config')
try{
    db = require('./database')
    const app = require("./app")
    //takes any request listener
    const server = http.createServer(app)
    const PORT = process.env.PORT || 3000
    server.listen(PORT,()=>console.log(`Server listening at port ${PORT}`))
}catch(err){
    console.log(err)
}