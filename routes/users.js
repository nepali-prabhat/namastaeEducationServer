const router = require('express').Router()
const { check, validationResult } = require('express-validator/check');
const { sanitizeBody } = require('express-validator/filter');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken')
const saltRounds = 10;
router.post('/signIn',[sanitizeBody('username').trim()],(req,res)=>{
    const {username,password} = req.body
    const query = 'SELECT * FROM users WHERE user_login_name=?'
    db.query(query,[username],(err,rows)=>{
        if(err){
            return res.status(400).json({successs:false, errors:[{"location":"database", "msg":err.code}]})
        }
        if(rows.length===0){
            return res.status(400).json({success:false, errors: [{"location":"username", "msg":"incorrect username."}]})
        }
        //toString because user_pass_hash is of type <Buffer>
        const db_pw = rows[0].user_pass_hash.toString()        
            if( bcrypt.compareSync(password, db_pw) ){
                const secret = config.secret;
                const token = jwt.sign({id:rows[0].user_id,type:'user'},secret, {expiresIn:"1d"})
                return res.status(200).json({success:true, token:token})
            }else{
                return res.status(400).json({success:false, errors: [{"location":"password", "msg":"incorrect pssword."}]})
            }
    })
})

const sign_up_validator = [
    sanitizeBody(['uname','fname','lname','email']).trim(),
    check('uname').isLength({min:4,max:50}).withMessage("username must have minimum of 4 characters."),
    check('fname').isLength({min:4,max:50}).withMessage("first name must have minimum of 4 characters."),
    check('lname').isLength({min:4,max:50}).withMessage("last name must have minimum of 4 characters."),
    check('email').isEmail().withMessage("please enter valid email.")
                .isLength({min:7,max:100}).withMessage("email address must have minimum of 7 characters."),

    check('password').isLength({min:7,max:100}).withMessage("password must be atleast 7 characters long.")
                    .matches(/^(?=.*\d)(?!.* )(?=.*[^a-zA-Z0-9]).{8,}$/, "i").withMessage("Password must include a number and a special character."),
    check('confirmPassword').custom((value,{req})=>{
        if(value != req.body.password) throw new Error("Passwords donot match")
        return value
    })
]

router.post("/signUp",sign_up_validator,(req,res)=>{
        const errors = validationResult(req)
        if (!errors.isEmpty()) {
            return res.status(422).json({success:false, errors: errors.array() });
        }
        const {uname,fname,lname,email,password}= req.body 
        bcrypt.hash(password, saltRounds, function(err, hash) {
            query="INSERT INTO users (`user_login_name`, `user_first_name`, `user_last_name`, `user_email`, `user_pass_hash`) VALUES (?,?,?,?,?)"
            db.query(query,[uname,fname,lname,email,hash],(err,results)=>{
                if(err){
                    return res.status(400).json({successs:false, errors:[{"location":"database", "msg":err.code}]})
                }
                res.status(200).json({success:true})
            })
        });
    }
)

module.exports = router