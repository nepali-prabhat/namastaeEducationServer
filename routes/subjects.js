const router = require('express').Router()
const assignRoleAndValidate = require('../middlewares/jwtAuthentication')
const { check, validationResult } = require('express-validator/check');
const { sanitizeBody } = require('express-validator/filter');
const ROLES = require('../config').ROLES
router.get('/all',(req,res)=>{
    const query = 'SELECT * FROM subject WHERE 1;'
    db.query(query,(err,row)=>{
        if(err){
            return res.status(400).json({success:false, errors:[{"location":"database", "msg":err.code}]})
        }
        return res.status(200).json(row)
    })
})
router.get('/:id',(req,res)=>{
    const id = req.params.id
    const query = 
    `
        SELECT sub_chapter.id as 'chapter_id', chap_title, chap_location,sub_section.id as 'section_id' , sec_name 
        FROM sub_chapter 
        JOIN sub_section 
        ON sub_chapter.sec_id = sub_section.id 
        WHERE sub_chapter.sub_id = ? 
        ORDER BY sub_section.sec_order_no;
    `
    db.query(query,id,(err,row)=>{
        if(err){
            return res.status(400).json({success:false, errors:[{"location":"database", "msg":err.code}]})
        }
        return res.status(200).json(row)
    })
})

router.get('/:id/allSections',(req,res)=>{
    const id = req.params.id
    const query = 
    `
        SELECT id, sec_name
        FROM sub_section
        WHERE sub_id = ?;
    `
    db.query(query,id,(err,row)=>{
        if(err){
            return res.status(400).json({success:false, errors:[{"location":"database", "msg":err.code}]})
        }
        return res.status(200).json(row)
    })
})
router.get('/:id/:section',(req,res)=>{
    const subject_id = req.params.id
    const section_id = req.params.section
    const query = 
    `
        SELECT sub_chapter.id as 'chapter id', chap_title, chap_location,sub_section.id as 'section id' , sec_name 
        FROM sub_chapter 
        JOIN sub_section 
        ON sub_chapter.sec_id = sub_section.id 
        WHERE sub_chapter.sub_id = ? AND sub_section.id = ?;
    `
    db.query(query,[subject_id,section_id],(err,row)=>{
        if(err){
            return res.status(400).json({success:false, errors:[{"location":"database", "msg":err.code}]})
        }
        return res.status(200).json(row)
    })
})

const addSubjectValidator = [
    sanitizeBody(['sub_code','sub_name']).trim(),
    check('sub_code').not().isEmpty().withMessage("subject code required."),
    check('sub_code').isLength(7).withMessage("Invalid subject code."),
    check('sub_name').not().isEmpty().withMessage("subject name required.")
]
router.post('/addSubject',assignRoleAndValidate(ROLES.TEACHER),addSubjectValidator,(req,res)=>{
    const errors = validationResult(req)
    if(!errors.isEmpty()){
        return res.status(400).json({success: false, errors:errors.array()})
    }
    const {sub_code , sub_name} = req.body
    const query = 'INSERT INTO subject (sub_CODE, sub_name) VALUES (?,?);'
    db.query(query,[sub_code, sub_name],(err,result)=>{
        if(err){
            return res.status(400).json({success:false, errors:[{"location":"database", "msg":err.code}]})
        }
        return res.status(200).json({success: true})
    })
})
const addSectionValidator = [
    sanitizeBody(['sec_name']).trim(),
    check('sec_name').not().isEmpty().withMessage("name of section required required."),
    check('sec_order').isNumeric().withMessage("section order must be numeric."),
    check('sec_order').not().isEmpty().withMessage("section order required required."),
    check('sub_id').isNumeric().withMessage("subject id must be numeric."),
    check('sub_id').not().isEmpty().withMessage("id of subject associated with the section is required."),
]
router.post('/addSection',assignRoleAndValidate(ROLES.TEACHER),addSectionValidator,(req,res)=>{
    const errors = validationResult(req)
    if(!errors.isEmpty()){
        return res.status(400).json({success: false, errors:errors.array()})
    }
    const {sec_order,sec_name ,sub_id} = req.body
    const query = 'INSERT INTO sub_section (sec_order_no,sec_name,sub_id) VALUES (?,?,?);'
    db.query(query,[sec_order,sec_name ,sub_id],(err,result)=>{
        if(err){
            return res.status(400).json({success:false, errors:[{"location":"database", "msg":err.code}]})
        }
        return res.status(200).json({success: true})
    })
})
const addChapterValidator = [
    sanitizeBody(['title','location']).trim(),
    check('sec_id').isNumeric().withMessage("section id must be numeric."),
    check('title').exists().withMessage("chapter title required."),
    check('sub_id').isNumeric().withMessage("subject id must be numeric."),
    check('sub_id').exists().withMessage("subject id associated with chapter is required.")
]
router.post('/addChapter',assignRoleAndValidate(ROLES.TEACHER),addChapterValidator,(req,res)=>{
    const errors = validationResult(req)
    if(!errors.isEmpty()){
        return res.status(400).json({success: false, errors:errors.array()})
    }
    const {sub_id,sec_id,title} = req.body
    const query = 'INSERT INTO sub_chapter (sub_id,sec_id,chap_title) VALUES (?,?,?);'
    db.query(query,[sub_id,sec_id,title],(err,result)=>{
        if(err){
            return res.status(400).json({success:false, errors:[{"location":"database", "msg":err.code}]})
        }
        return res.status(200).json({success: true})
    })
})
const createSubjectValidator = [
    sanitizeBody(['sub_code','sub_name']).trim(),
    check('sub_code').not().isEmpty().withMessage("subject code required."),
    check('sub_code').isLength(7).withMessage("Invalid subject code."),
    check('sub_name').not().isEmpty().withMessage("subject name required."),
    sanitizeBody(['sec_name']).trim(),
    check('sec_name').not().isEmpty().withMessage("name of section required required."),
    check('sec_order').isNumeric().withMessage("section order must be numeric."),
    check('sec_order').not().isEmpty().withMessage("section order required required."),
    sanitizeBody(['title','location']).trim(),
    check('title').exists().withMessage("chapter title required."),
]
router.post('/createNewSubject',assignRoleAndValidate(ROLES.TEACHER),createSubjectValidator,(req,res)=>{
    const errors = validationResult(req)
    if(!errors.isEmpty()){
        return res.status(400).json({success: false, errors:errors.array()})
    }else{
        const {sub_code , sub_name} = req.body
        const query = 'INSERT INTO subject (sub_CODE, sub_name) VALUES (?,?);'
        db.query(query,[sub_code, sub_name],(err,result)=>{
            if(err){
                return res.status(400).json({success:false, errors:[{"location":"database 1", "msg":err.code}]})
            }
            const sub_id = result.insertId
            console.log(sub_id)
            const {sec_order,sec_name} = req.body
            const query = 'INSERT INTO sub_section (sec_order_no,sec_name,sub_id) VALUES (?,?,?)'
            db.query(query,[sec_order,sec_name ,sub_id],(err,result)=>{
                if(err){
                    return res.status(400).json({success:false, errors:[{"location":"database 2", "msg":err.code}]})
                }
                const sec_id = result.insertId
                console.log(sec_id)
                const {title} = req.body
                const query = 'INSERT INTO sub_chapter (sub_id,sec_id,chap_title) VALUES (?,?,?)'
                db.query(query,[sub_id,sec_id,title],(err,result)=>{
                    if(err){
                        return res.status(400).json({success:false, errors:[{"location":"database 3", "msg":err.code}]})
                    }
                    return res.status(200).json({success: true})
                })
            })
            
        })
    }
})
//update subject name or code

router.put('/subject/:id',assignRoleAndValidate(ROLES.TEACHER),(req,res)=>{
    const id = req.params.id
    const {sub_code, sub_name} = req.body
    const query = `
        UPDATE subject 
        SET ${sub_code? 'sub_CODE=?':''} 
            ${sub_code && sub_name ? ",":""} 
            ${sub_name? "sub_name = ?":''} 
        WHERE id=?;`
    console.log(query)
    const queryParams = []
    if(sub_code){
        queryParams.push(sub_code)
    }
    if(sub_name){
        queryParams.push(sub_name)
    }
    queryParams.push(id)
    console.log(queryParams)
    console.log(query)
    db.query(query,queryParams,(err,result)=>{
        if(err){
            return res.status(400).json({success:false, errors:[{"location":"database", "msg":err.code}]})
        }
        console.log(result)
        res.status(200).json({success:true})
    })
})
router.put('/section/:id',assignRoleAndValidate(ROLES.TEACHER),(req,res)=>{
    id = req.params.id
    const {order, sub_id,name} = req.body
    queryParams = []
    if(order){
        queryParams.push(order)
    }
    if(name){
        queryParams.push(name)
    }
    if(sub_id){
        queryParams.push(sub_id)
    }
    queryParams.push(id)
    const query = `
        UPDATE sub_section 
        SET ${order? "sec_order_no=?":""} ${order && (name || sub_id)? ",": ""}
            ${name? "sec_name=?":""} ${name && sub_id ? ",": ""} 
            ${sub_id ? "sub_id=?":""}
        WHERE id=?;
        `
    db.query(query,queryParams,(err,result)=>{
        if(err){
            console.log(err)
            return res.status(400).json({success:false, errors:[{"location":"database", "msg":err.code}]})
        }
        res.status(200).json({success:true})
    })
})
router.put('/chapter/:id',assignRoleAndValidate(ROLES.TEACHER),(req,res)=>{
    id = req.params.id
    const {sub_id,sec_id,title} = req.body
    queryParams = []
    if(sub_id){
        queryParams.push(sub_id)
    }
    if(sec_id){
        queryParams.push(sec_id)
    }
    if(title){
        queryParams.push(title)
    }
    // if(location){
    //     queryParams.push(location)
    // }
    //${location? "chap_location=?":""} ${order && (name || sub_id)? ",": ""}  
    queryParams.push(id)
    const query = `
        UPDATE sub_chapter
        SET ${sub_id? "sub_id=?":""} ${sub_id && (sec_id || title)? ",": ""} 
            ${sec_id? "sec_id=?":""} ${sec_id && title? ",": ""}
            ${title? "chap_title=?":""} 
        WHERE id=?;
        `
    db.query(query,queryParams,(err,result)=>{
        if(err){
            console.log(err.sqlMessage)
            return res.status(400).json({success:false, errors:[{"location":"database", "msg":err.code}]})
        }
        res.status(200).json({success:true})
    })
})
router.delete('/subject/:id',assignRoleAndValidate(ROLES.TEACHER),(req,res)=>{
    const id = req.params.id
    const query = `DELETE FROM subject WHERE id=?`
    db.query(query,[id],(err,result)=>{
        if(err){
            return res.status(400).json({success:false,errors:[{"location":"database","msg":err.code}]})
        }
        res.status(200).json({success:true})
    })
})
router.delete('/section/:id',assignRoleAndValidate(ROLES.TEACHER),(req,res)=>{
    const id = req.params.id
    const query = `DELETE FROM sub_section WHERE id=?`
    db.query(query,[id],(err,result)=>{
        if(err){
            return res.status(400).json({success:false,errors:[{"location":"database","msg":err.code}]})
        }
        res.status(200).json({success:true})
    })
})
router.delete('/chapter/:id',assignRoleAndValidate(ROLES.TEACHER),(req,res)=>{
    const id = req.params.id
    const query = `DELETE FROM sub_chapter WHERE id=?`
    db.query(query,[id],(err,result)=>{
        if(err){
            return res.status(400).json({success:false,errors:[{"location":"database","msg":err.code}]})
        }
        res.status(200).json({success:true})
    })
})
module.exports = router