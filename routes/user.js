const express = require("express");
const router = express.Router();
const asyncWrap = require("../utils/asyncWrap.js");
const passport = require("passport");
const { saveRedirectUrl } = require("../middleware.js");
const userController=require("../controllers/user.js")


router.route("/signup")
// GET SIGNUP
.get(userController.getSignUp)

// POST SIGNUP
.post(asyncWrap(userController.postSignUp));

router.route("/login")
//GET LOGIN
.get(userController.getLogIn)

//POST LOGIN
.post(saveRedirectUrl,passport.authenticate("local", {failureRedirect: "/login",failureFlash: true,}),userController.postLogIn);

//LOGOUT
router.get("/logout",userController.getLogOut)

module.exports = router;
