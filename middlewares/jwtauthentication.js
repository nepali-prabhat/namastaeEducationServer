const jwt = require('jsonwebtoken')
const ROLES = require('../config').ROLES
function assignRoleAndValidate(role){
    return (req,res,next)=>{
        //const token = req.headers["authorization"]
        const token = req.cookies['jwt-token']
        if(!token){
            return res.status(400).json({success:false, error:{location:"jwt_token",msg:"sign in is required."} })
        }
        jwt.verify(token,ROLES.secrets[role], (err,decoded)=>{
            if(err) {
                return res.status(400).json({success:false, error:{location:"jwt_token_verify",msg:"sign in is required.",name:err.name}})
            }
            req.decoded = decoded
            next()
        })
    }
}
module.exports = assignRoleAndValidate