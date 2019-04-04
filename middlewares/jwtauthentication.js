const jwt = require('jsonwebtoken')
const config = require('../config')

function jwtUserAuthenticate(req,res,next){
    const token = req.headers["authorization"]
    if(!token){
        return res.status(400).json({success:false, error:{location:"jwt_token",msg:"no jwt token provided."} })
    }
    jwt.verify(token,config.secret, (err,decoded)=>{
        if(err) console.error(err); return res.status(400).json({success:false, error:{location:"jwt_token_verify",msg:err} })
        req.decoded = decoded
        next()
    })
}
module.exports = jwtUserAuthenticate