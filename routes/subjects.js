const router = require('express').Router()
const assignRoleAndValidate = require('../middlewares/jwtAuthentication')
const { check, validationResult } = require('express-validator/check');
const { sanitizeBody } = require('express-validator/filter');
const fs = require('fs')
const path = require('path')
const crypto =require('crypto')
const addChapterFileMiddleware = require('../middlewares/file').addChapterFileMiddleware
const deleteChapterFileMiddleware = require('../middlewares/file').deleteChapterFileMiddleware
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

router.get('/:subId/:section',(req,res)=>{
    const subject_id = req.params.subId
    const section_id = req.params.section
    const query = 
    `
        SELECT sub_chapter.id as chapter_id, chap_title, chap_filename, sub_section.id as section_id , sec_name 
        FROM sub_chapter 
        JOIN sub_section 
        ON sub_chapter.sec_id = sub_section.id 
        WHERE sub_chapter.sub_id = ? AND sub_section.id = ? ;
    `
    db.query(query,[subject_id,section_id],(err,row)=>{
        if(err){
            console.log(err)
            return res.status(400).json({success:false, errors:[{"location":"database", "msg":err.code}]})
        }
        return res.status(200).json(row)
    })
})

router.post('/readFile/:id',(req,res)=>{
    const id = req.params.id
    console.log(id)
    const query = `SELECT chap_filename as fn FROM sub_chapter WHERE id = ? ;`
    db.query(query, [id] ,(err,row)=>{
        if(err){
            console.log(err)
            return res.status(400).json({success:false, errors:[{"location":"database", "msg":err.code}]})
        }
        if(row.length >0 ){
            const filename = row[0].fn
            const dir = path.join(__dirname,'../static/html/')
            const location =dir+filename+'.html'
            console.log(location)
            fs.readFile(location,'UTF-8',(err,data)=>{
                if(err){
                    return res.status(400).json({success:false, errors:[{"location":"file", "msg":"no such file exists."}]})
                }
                res.status(200).json({success:true,data:data.trim()})
            })
        }else{
            res.status(200).json({success:'false',errors:[{location:"database", msg:"no such record exists."}]})
        }
    })
})

router.post('/saveFile/:id',(req,res)=>{
    const id = req.params.id
    const {content} = req.body
    console.log(id)
    const query = `SELECT chap_filename as fn FROM sub_chapter WHERE id = ? ;`
    db.query(query, [id] ,(err,row)=>{
        if(err){
            console.log(err)
            return res.status(400).json({success:false, errors:[{"location":"database", "msg":err.code}]})
        }
        if(row.length >0 ){
            const filename = row[0].fn
            const dir = path.join(__dirname,'../static/html/')
            const location =dir+filename+'.html'
            console.log(location)
            fs.writeFile(location,content,function(err){
                if(err) {
                    return res.status(400).json({success:'false',errors:[{location:'file system',msg:'cannot find file'}]})
                }
                console.log("saved file at",location)
                res.status(200).json({success:true, msg:"file saved.",filename, content })
            })
        }else{
            res.status(200).json({success:'false',errors:[{location:"database", msg:"no such record exists."}]})
        }
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
        return res.status(200).json({success: true, id:result.insertId})
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
        console.log(result)
        return res.status(200).json({success: true, id:result.insertId})
    })
})
const addChapterValidator = [
    sanitizeBody(['title','location']).trim(),
    check('sec_id').isNumeric().withMessage("section id must be numeric."),
    check('title').exists().withMessage("chapter title required."),
    check('sub_id').isNumeric().withMessage("subject id must be numeric."),
    check('sub_id').exists().withMessage("subject id associated with chapter is required."),
]
function getRandomString(len){
    return crypto.randomBytes(Math.floor(len/2)).toString('hex').slice(0,len)
}
router.post('/addChapter',assignRoleAndValidate(ROLES.TEACHER),
    addChapterValidator,
    (req,res,next)=>{
        const errors = validationResult(req)
        if(!errors.isEmpty()){
            return res.status(400).json({success: false, errors:errors.array()})
        }
        next()
    },(req,res,next)=>{
        const {sub_id,sec_id,title} = req.body
        const filename = getRandomString(5)+title.slice(0,5).trim()
        const query = 'INSERT INTO sub_chapter (sub_id,sec_id,chap_title,chap_filename) VALUES (?,?,?,?);'
        db.query(query,[sub_id,sec_id,title,filename],(err,result)=>{
            if(err){
                return res.status(400).json({success:false, errors:[{"location":"database", "msg":err.code}]})
            }
            req.body.insertedId = result.insertId
            req.body.filename = filename
            next()
        })
    },
    addChapterFileMiddleware,
)
const createSubjectValidator = [
    check('sub_code').not().isEmpty().withMessage("subject code required."),
    check('sub_name').not().isEmpty().withMessage("subject name required."),
    check('sec_name').not().isEmpty().withMessage("name of section required required."),
    check('sec_order').not().isEmpty().withMessage("section order required required."),
    check('title').exists().withMessage("chapter title required."),
    
    sanitizeBody(['sub_code','sub_name','sec_name','title']).trim(),
    check('sub_code').isLength(7).withMessage("Invalid subject code."),
    
    check('sec_order').isNumeric().withMessage("section order must be number."),
    sanitizeBody(['title','location']).trim(),
]

router.post('/createNewSubject',assignRoleAndValidate(ROLES.TEACHER),createSubjectValidator,(req,res,next)=>{
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
            const {sec_order,sec_name} = req.body
            const query = 'INSERT INTO sub_section (sec_order_no,sec_name,sub_id) VALUES (?,?,?)'
            db.query(query,[sec_order,sec_name ,sub_id],(err,result)=>{
                if(err){
                    return res.status(400).json({success:false, errors:[{"location":"database 2", "msg":err.code}]})
                }
                const sec_id = result.insertId
                const {title} = req.body
                const filename = getRandomString(5)+title.slice(0,5).trim()
                const query = 'INSERT INTO sub_chapter (sub_id,sec_id,chap_title,chap_filename) VALUES (?,?,?,?)'
                db.query(query,[sub_id,sec_id,title,filename],(err,result)=>{
                    if(err){
                        return res.status(400).json({success:false, errors:[{"location":"database 3", "msg":err.code}]})
                    }
                    const chap_id = result.insertId
                    req.body.insertedId = {sub_id,sec_id,chap_id}
                    req.body.filename = filename
                    next()
                })
            })
        })
    }
},addChapterFileMiddleware,)

const updateSubjectValidator = [
    sanitizeBody(['sub_code','sub_name']).trim(),
    check('sub_code').isLength(7).withMessage("Invalid subject code."),
]

router.put('/subject/:id',assignRoleAndValidate(ROLES.TEACHER),updateSubjectValidator,(req,res)=>{
    const errors = validationResult(req)
    if(!errors.isEmpty()){
        return res.status(400).json({success: false, errors:errors.array()})
    }
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

const updateSectionValidator = [
    sanitizeBody(['name']).trim(),
    check('order').isNumeric().withMessage("section order must be numeric."),
    check('sub_id').isNumeric().withMessage("subject id must be numeric."),
]
router.put('/section/:id',assignRoleAndValidate(ROLES.TEACHER),updateSectionValidator,(req,res)=>{
    const errors = validationResult(req)
    if(!errors.isEmpty()){
        return res.status(400).json({success: false, errors:errors.array()})
    }
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
const updateChapterValidator = [
    sanitizeBody(['title']).trim(),
    check('sec_id').isNumeric().withMessage("section id must be numeric."),
    check('sub_id').isNumeric().withMessage("subject id must be numeric."),
]
router.put('/chapter/:id',assignRoleAndValidate(ROLES.TEACHER),updateChapterValidator,(req,res)=>{
    const errors = validationResult(req)
    if(!errors.isEmpty()){
        return res.status(400).json({success: false, errors:errors.array()})
    }
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

router.delete('/subject/:id',assignRoleAndValidate(ROLES.TEACHER),(req,res,next)=>{
    const id = req.params.id
    let filenames = []
    const query1 = `SELECT chap_filename as fn FROM sub_chapter WHERE sub_id=?;`
    db.query(query1,[id],(err,results)=>{
        if(err){
            return res.status(400).json({success:false,errors:[{"location":"database","msg":err.code}]})
        }
        console.log(results)
        results.map((result)=>{
                console.log(result)
                filenames = [...filenames,result.fn]
        })
        req.body.filenames = filenames
        const query2 = `DELETE FROM subject WHERE id = ?`
        db.query(query2,[id],(err,results)=>{
            if(err){
                return res.status(400).json({success:false,errors:[{"location":"database","msg":err.code}]})
            }
            next()
        })
    })
},deleteChapterFileMiddleware)

router.delete('/section/:id',assignRoleAndValidate(ROLES.TEACHER),(req,res,next)=>{
    const id = req.params.id
    let filenames = []
    const query1 = `SELECT chap_filename as fn FROM sub_chapter WHERE sec_id=?`
    db.query(query1,[id],(err,results)=>{
        if(err){
            return res.status(400).json({success:false,errors:[{"location":"database","msg":err.code}]})
        }
        results.map((result)=>{
            filenames = [...filenames,result.fn]
        })
        req.body.filenames = filenames
        const query = `DELETE FROM sub_section WHERE id=?`
        db.query(query,[id],(err,results)=>{
            if(err){
                return res.status(400).json({success:false,errors:[{"location":"database","msg":err.code}]})
            }
            next()
        })
    })
},deleteChapterFileMiddleware)

router.delete('/chapter/:id',assignRoleAndValidate(ROLES.TEACHER),
    (req,res,next)=>{
        const id = req.params.id
        let filenames = []
        const query1 = `SELECT chap_filename as fn FROM sub_chapter WHERE id=?`
        db.query(query1,[id],(err,results)=>{
            if(err){
                return res.status(400).json({success:false,errors:[{"location":"database","msg":err.code}]})
            }
            console.log('result',result)
            filenames = [...filenames,result[0].fn]
            req.body.filenames = filenames
            const query = `DELETE FROM sub_chapter WHERE id=?`
            db.query(query,[id],(err,results)=>{
                if(err){
                    return res.status(400).json({success:false,errors:[{"location":"database","msg":err.code}]})
                }
                next()
            })
        })
    }
,deleteChapterFileMiddleware)

module.exports = router