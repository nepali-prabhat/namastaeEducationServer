const router = require('express').Router()
const { check,validationResult } = require('express-validator/check')
const { sanitizeBody } = require('express-validator/filter')
const bcrypt = require('bcrypt');
const assignRoleAndValidate = require('../middlewares/jwtAuthentication')
const signIn = require('../middlewares/signIn')
const saltRounds = 10;
const ROLES = require('../config').ROLES

router.post('/signIn',[sanitizeBody('username').trim()],(req,res)=>{
    signIn(req,res,ROLES.TEACHER)
})

const sign_up_validator = [
    sanitizeBody(['uname','fname','lname','email','phone_no']).trim(),
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
    }),
    check('phoneNo').isLength(10).withMessage("invalid phone number.")
]

router.post('/signUp',sign_up_validator,(req,res)=>{
    const errors = validationResult(req)
    if(!errors.isEmpty()){
        return res.status(422).json({success:false, errors: errors.array() });
    }
    const {uname,fname,lname,email,phoneNo,password}= req.body
    bcrypt.hash(password,saltRounds, (err,hash)=>{
        const query='INSERT INTO `teachers`(`login_name`, `first_name`, `last_name`, `email`, `pass_hash`, `phone_no`) VALUES (?,?,?,?,?,?)'
        db.query(query,[uname,fname,lname,email,hash,phoneNo],(err,result)=>{
            if(err){
                return res.status(400).json({success:false, errors:[{"location":"database", "msg":err.code}]})
            }
            res.status(200).json({success:true})
        })
    })
})

router.get('/details',assignRoleAndValidate(ROLES.TEACHER),(req,res)=>{ 
        const id = req.decoded.id
        const query = 'SELECT `login_name`, `first_name`, `last_name`, `email`, `phone_no` FROM teachers WHERE id=?;'
        db.query(query,[id],(err,rows,fields)=>{
            if(err){
                return res.status(400).json({success:false, errors:[{"location":"database", "msg":err.code}]})
            }
            console.log()
            res.status(200).json(rows[0])
        })
})

module.exports = router
