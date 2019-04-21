const path =require('path')
const crypto =require('crypto')
const fs = require('fs')
function getRandomString(len){
    return crypto.randomBytes(Math.floor(len/2)).toString('hex').slice(0,len)
}
function addChapterFileMiddleware(req,res,next){
    const {title} = req.body
    const filename = getRandomString(5)+title.slice(0,5)
    let content = ' ' || req.body.content
    const dir = path.join(__dirname,`../static/html/`)
    const location = dir+filename+'.html'
    fs.writeFile(location,content,function(err){
        if(err) {
            return res.status(400).json({success:'false',errors:[{location:'file system',msg:'cannot make file'}]})
        }
        console.log("saved file at",location)
        req.body.filename = filename
        next()
    })
}
function deleteChapterFileMiddleware(req,res){
    //filename is an array
    let {filenames} = req.body
    console.log("filenames in dele:",filenames)
    const dir = path.join(__dirname,`../static/html/`)
    filenames.map(filename=>{
        const location = dir+filename+'.html'
        console.log("location",location)
        fs.unlink(location,function(err){
            if(err) {
                return res.status(400).json({success:'false',errors:[{location:'file system',msg:'cannot find file'}]})
            }
            console.log("deleted file at",location)
        })
    })
    res.status(200).json({success:true})
}
module.exports = {addChapterFileMiddleware,deleteChapterFileMiddleware}