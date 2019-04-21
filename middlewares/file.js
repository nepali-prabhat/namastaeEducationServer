const path =require('path')
const fs = require('fs')

function addChapterFileMiddleware(req,res){
    const {filename} = req.body
    let content = req.body.content? req.body.content : " "
    const dir = path.join(__dirname,`../static/html/`)
    const location = dir+filename+'.html'
    fs.writeFile(location,content,function(err){
        if(err) {
            return res.status(400).json({success:'false',errors:[{location:'file system',msg:'cannot make file'}]})
        }
        console.log("saved file at",location)
        res.status(200).json({success:true,id:req.body.insertedId,filename})
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