const jwt = require('jsonwebtoken')
const bcrypt = require('bcrypt');
const ROLES = require('../config').ROLES
const signIn = (req,res,role)=>{
    let table =null;
    switch(role){
        case ROLES.TEACHER:
            table = "teachers"
            break;
        case ROLES.USER:
            table = "users"
            break;
        case ROLES.ADMIN:
            table = "admins"
            break;
            
    }
    const {username,password} = req.body
    const query = `SELECT * FROM ${table} WHERE login_name=?;`
    db.query(query,[username],(err,rows)=>{
        if(err){
            return res.status(400).json({successs:false, errors:[{"location":"database", "msg":err.code}]})
        }
        if(rows.length===0){
            return res.status(400).json({success:false, errors: [{"location":"username", "msg":"incorrect username."}]})
        }
        //toString because user_pass_hash is of type <Buffer>
        const db_pw = rows[0].pass_hash.toString()
        if( bcrypt.compareSync(password, db_pw) ){
            const token = jwt.sign({id:rows[0].id},ROLES.secrets[role], {expiresIn:"1d"})
            //todo: add {httpOnly:false,secure:true} for https, web server only
            res.cookie('jwt-token',token)
            return res.status(200).json({success:true})
        }else{
            return res.status(400).json({success:false, errors: [{"location":"password", "msg":"incorrect pssword."}]})
        }
    })
}

module.exports = signIn