const express = require("express");
const router = express.Router();
const asyncWrap = require("../utils/asyncWrap.js");
const passport = require("passport");
const { saveRedirectUrl, isLoggedIn } = require("../middleware.js");
const userController=require("../controllers/user.js")


router.route("/signup")
// GET SIGNUP
.get(userController.getSignUp)

// POST SIGNUP
.post(asyncWrap(userController.postSignUp));

router.route("/signup/verify")
.get(userController.getVerifyOtp)
.post(asyncWrap(userController.postVerifyOtp));

router.route("/signup/password")
.get(userController.getPasswordPage)
.post(asyncWrap(userController.postPasswordPage));

router.post("/signup/resend-otp", asyncWrap(userController.resendOtp));

router.route("/forgot-password")
.get(userController.getForgotPasswordPage)
.post(asyncWrap(userController.postForgotPassword));

router.route("/forgot-password/verify")
.get(userController.getForgotPasswordVerifyPage)
.post(asyncWrap(userController.postForgotPasswordVerify));

router.route("/forgot-password/reset")
.get(userController.getForgotPasswordResetPage)
.post(asyncWrap(userController.postForgotPasswordReset));

router.post("/forgot-password/resend-otp", asyncWrap(userController.resendPasswordResetOtp));

router.route("/login")
//GET LOGIN
.get(userController.getLogIn)

//POST LOGIN
.post(saveRedirectUrl,passport.authenticate("local", {failureRedirect: "/login",failureFlash: true,}),userController.postLogIn);

//LOGOUT
router.get("/logout",userController.getLogOut)

router.get("/profile", isLoggedIn, userController.getProfilePage);

module.exports = router;
