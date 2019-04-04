const router = require('express').Router()

router.get("/:id",(req,res)=>{
    res.type('json')
    res.send({"id":req.params.id,"quiz":"quiz here of the id"})
})

module.exports = router