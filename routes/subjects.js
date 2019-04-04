const router = require('express').Router()
//this is public route
router.get('/all',(req,res)=>{
    res.type('json')
    res.send({"phys":"physics"})
});
//this is protected route
router.post('/',(req,res)=>{
    res.send(req.body)
})
module.exports = router