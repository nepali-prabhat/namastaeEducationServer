const database = {
    host     : 'localhost',
    user     : 'root',
    password : 'rootuser',
    database : 'namastae education'
}
const userSecret = '8B6DC613F73FEECAD18C3036A03556BC9C57573EE43820F27C630CF9273644C3'
const teacherSecret = "!,r5BdbrrcB#H/B>:]pXPQ:r!xr7]Z2N]K?HrVQF%%^C^ZU.X)uMRu\6_-EP"
const adminSecret = "]K?HrVQF556BC9C57573EE43820F2556BC9C57573E%%^C^ZU.X)uMRu\6_-EP"
const ROLES = {
    USER :1,
    TEACHER : 2,
    ADMIN : 3,
    secrets : {
        1: userSecret,
        2: teacherSecret,
        3: adminSecret
    }
}
module.exports = {
        database,
        ROLES
}