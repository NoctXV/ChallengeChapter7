const router = require("express").Router()
const auth = require("../controller/auth")

router.post('/auth/register', auth.login)
router.post('/auth/login', auth.register)
router.post('/auth/forgotpassword', auth.forgotPassword);
router.post('/auth/resetpassword/:token', auth.resetPassword);

module.exports = router