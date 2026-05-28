const User = require("../models/user.js");
const axios = require("axios");

const OTP_TTL_MS = 60 * 1000;
const OTP_RESEND_MS = 60 * 1000;

// Common email validation pattern
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function getWaitSeconds(windowMs, lastSentAt) {
  return Math.max(1, Math.ceil((windowMs - (Date.now() - (lastSentAt || 0))) / 1000));
}
const ALLOWED_GENDERS = new Set(["Male", "Female", "Other", "Prefer not to say"]);

function parseSenderEmail(rawValue) {
  const value = String(rawValue || "").trim();
  const match = value.match(/<([^>]+)>/);
  if (match && match[1]) {
    return match[1].trim();
  }

  return value;
}

function generateOtp() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function getResendCooldown(state) {
  return Math.max(0, Math.ceil((state.otpSentAt + OTP_RESEND_MS - Date.now()) / 1000));
}

function saveSession(session) {
  return new Promise((resolve, reject) => {
    session.save((err) => {
      if (err) {
        return reject(err);
      }
      resolve();
    });
  });
}

async function findUserByEmail(email) {
  return User.findOne({
    $or: [{ email }, { username: email }],
  });
}

async function sendOtpEmail(email, otp) {
  const apiKey = process.env.BREVO_API_KEY;
  const senderName = process.env.BREVO_SENDER_NAME || "WanderLust";
  const senderEmail = parseSenderEmail(process.env.BREVO_SENDER_EMAIL || process.env.FROM_EMAIL || process.env.EMAIL_USER);

  if (!apiKey || !senderEmail) {
    const missingConfig = [];
    if (!apiKey) missingConfig.push("BREVO_API_KEY");
    if (!senderEmail) missingConfig.push("BREVO_SENDER_EMAIL/FROM_EMAIL");
    throw new Error(`Brevo OTP config missing: ${missingConfig.join(", ")}.`);
  }

  await axios.post(
    "https://api.brevo.com/v3/smtp/email",
    {
      sender: {
        name: senderName,
        email: senderEmail,
      },
      to: [{ email }],
      subject: "WanderLust email verification code",
      htmlContent: `
        <div style="font-family:Arial,sans-serif;line-height:1.6;color:#111827">
          <h2 style="margin:0 0 12px">Verify your email</h2>
          <p style="margin:0 0 16px">Enter this OTP to complete your WanderLust signup:</p>
          <div style="display:inline-block;padding:14px 18px;border:1px solid #e5e7eb;border-radius:12px;background:#f9fafb;font-size:30px;font-weight:700;letter-spacing:6px">${otp}</div>
          <p style="margin:16px 0 0">This code expires in 1 minute.</p>
        </div>
      `,
      textContent: `Your WanderLust OTP is ${otp}. It expires in 1 minute.`,
    },
    {
      headers: {
        accept: "application/json",
        "api-key": apiKey,
        "content-type": "application/json",
      },
    }
  ).catch((error) => {
    const responseMessage = error?.response?.data?.message || error?.response?.data?.error || error.message;
    throw new Error(`Brevo request failed: ${responseMessage}`);
  });
}

//GET SIGNUP
  module.exports.getSignUp=(req, res) => {
  res.render("../views/users/signup.ejs");
};


//POST SIGNUP
module.exports.postSignUp=async (req, res) => {
    try {
      let { username, firstName, lastName, age, gender, email } = req.body;
      const trimmedUsername = String(username || "").trim();
      const trimmedFirstName = String(firstName || "").trim();
      const trimmedLastName = String(lastName || "").trim();
      const trimmedEmail = String(email || "").trim().toLowerCase();
      const parsedAge = Number.parseInt(String(age || ""), 10);
      const trimmedGender = String(gender || "").trim();
      const finalUsername = trimmedUsername || trimmedEmail;

      if (!trimmedFirstName || !trimmedLastName) {
        req.flash("error", "Please enter your first and last name.");
        return res.redirect("/signup");
      }

      if (!Number.isInteger(parsedAge) || parsedAge <= 0) {
        req.flash("error", "Please enter a valid age.");
        return res.redirect("/signup");
      }

      if (!ALLOWED_GENDERS.has(trimmedGender)) {
        req.flash("error", "Please select a valid gender.");
        return res.redirect("/signup");
      }

      if (!EMAIL_PATTERN.test(trimmedEmail)) {
        req.flash("error", "Please enter a valid email address.");
        return res.redirect("/signup");
      }

      const existingUsername = await User.findOne({ username: finalUsername });
      if (existingUsername) {
        req.flash("error", "That username is already taken.");
        return res.redirect("/signup");
      }

      const existingEmail = await User.findOne({ email: trimmedEmail });
      if (existingEmail) {
        req.flash("error", "An account already exists with that email address.");
        return res.redirect("/signup");
      }

      const senderEmail = parseSenderEmail(process.env.BREVO_SENDER_EMAIL || process.env.FROM_EMAIL || process.env.EMAIL_USER);
      if (!process.env.BREVO_API_KEY || !senderEmail) {
        req.flash("error", "Brevo OTP is not configured yet. Missing BREVO_API_KEY or BREVO_SENDER_EMAIL.");
        return res.redirect("/signup");
      }

      const otp = generateOtp();
      req.session.pendingSignup = {
        username: finalUsername,
        firstName: trimmedFirstName,
        lastName: trimmedLastName,
        age: parsedAge,
        gender: trimmedGender,
        email: trimmedEmail,
        otp,
        expiresAt: Date.now() + OTP_TTL_MS,
        otpSentAt: Date.now(),
      };

      await sendOtpEmail(trimmedEmail, otp);
      await saveSession(req.session);
      req.flash("success", "OTP sent to your email address. Verify it to finish signup.");
      res.redirect("/signup/verify");
    } catch (e) {
      delete req.session.pendingSignup;
      req.flash("error", e.message);
      res.redirect("/signup");
    }
  };

module.exports.getVerifyOtp=(req,res)=>{
  if(!req.session.pendingSignup){
    req.flash("error", "Please sign up again to receive a new OTP.");
    return res.redirect("/signup");
  }
  const resendCooldown = Math.max(0, Math.ceil((req.session.pendingSignup.otpSentAt + OTP_RESEND_MS - Date.now()) / 1000));
  res.render("../views/users/verify-otp.ejs", {
    email: req.session.pendingSignup.email,
    resendCooldown,
  });
};

module.exports.postVerifyOtp=async (req,res,next)=>{
  try{
    const pendingSignup = req.session.pendingSignup;
    const enteredOtp = String(req.body.otp || "").trim();

    if(!pendingSignup){
      req.flash("error", "Verification session expired. Please sign up again.");
      return res.redirect("/signup");
    }

    if(Date.now() > pendingSignup.expiresAt){
      req.flash("error", "OTP expired. Please resend a new code.");
      return res.redirect("/signup/verify");
    }

    if(enteredOtp !== pendingSignup.otp){
      req.flash("error", "Invalid OTP. Please try again.");
      return res.redirect("/signup/verify");
    }

    req.session.verifiedSignup = {
      username: pendingSignup.username,
      firstName: pendingSignup.firstName,
      lastName: pendingSignup.lastName,
      age: pendingSignup.age,
      gender: pendingSignup.gender,
      email: pendingSignup.email,
      verifiedAt: Date.now(),
    };
    delete req.session.pendingSignup;
    await saveSession(req.session);
    res.redirect("/signup/password");
  } catch(err){
    delete req.session.pendingSignup;
    req.flash("error", err.message);
    res.redirect("/signup");
  }
};

module.exports.getPasswordPage=(req,res)=>{
  if(!req.session.verifiedSignup){
    req.flash("error", "Please verify your email first.");
    return res.redirect("/signup");
  }
  res.render("../views/users/set-password.ejs", { user: req.session.verifiedSignup });
};

module.exports.postPasswordPage=async (req,res,next)=>{
  try{
    const verifiedSignup = req.session.verifiedSignup;
    const password = String(req.body.password || "").trim();

    if(!verifiedSignup){
      req.flash("error", "Please verify your email first.");
      return res.redirect("/signup");
    }

    const strongPasswordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;
    if(!strongPasswordPattern.test(password)){
      req.flash("error", "Password must be at least 8 characters and include uppercase, lowercase, number, and special character.");
      return res.redirect("/signup/password");
    }

    const username = String(req.body.username || verifiedSignup.username || verifiedSignup.email).trim();
    if (!username) {
      req.flash("error", "Username is missing. Please start signup again.");
      return res.redirect("/signup");
    }
    const newUser = new User({
      username,
      email: verifiedSignup.email,
      firstName: verifiedSignup.firstName,
      lastName: verifiedSignup.lastName,
      age: verifiedSignup.age,
      gender: verifiedSignup.gender,
    });

    const registeredUser = await User.register(newUser, password);
    delete req.session.verifiedSignup;

    req.logIn(registeredUser, (err) => {
      if(err){
        return next(err);
      }
      req.flash("success", "User registered successfully.");
      res.redirect("/listings");
    });
  } catch(err){
    delete req.session.verifiedSignup;
    req.flash("error", err.message);
    res.redirect("/signup");
  }
};

module.exports.resendOtp=async (req,res)=>{
  try{
    const pendingSignup = req.session.pendingSignup;
    if(!pendingSignup){
      req.flash("error", "Please sign up again to receive a new OTP.");
      return res.redirect("/signup");
    }

    if (Date.now() - pendingSignup.otpSentAt < OTP_RESEND_MS) {
      const waitSeconds = getWaitSeconds(OTP_RESEND_MS, pendingSignup.otpSentAt);
      req.flash("error", `Please wait ${waitSeconds}s before resending the OTP.`);
      return res.redirect("/signup/verify");
    }

    const otp = generateOtp();
    pendingSignup.otp = otp;
    pendingSignup.expiresAt = Date.now() + OTP_TTL_MS;
    pendingSignup.otpSentAt = Date.now();
    await sendOtpEmail(pendingSignup.email, otp);
    req.flash("success", "A new OTP has been sent to your email address.");
    res.redirect("/signup/verify");
  } catch(err){
    req.flash("error", err.message);
    res.redirect("/signup/verify");
  }
};

module.exports.getForgotPasswordPage = (req, res) => {
  res.render("../views/users/forgot-password.ejs");
};

module.exports.postForgotPassword = async (req, res) => {
  try {
    const email = String(req.body.email || "").trim().toLowerCase();
    if (!EMAIL_PATTERN.test(email)) {
      req.flash("error", "Please enter a valid email address.");
      return res.redirect("/forgot-password");
    }

    const user = await findUserByEmail(email);
    if (!user) {
      req.flash("error", "No account found for that email address.");
      return res.redirect("/forgot-password");
    }

    const otp = generateOtp();
    req.session.pendingPasswordReset = {
      userId: String(user._id),
      email,
      otp,
      expiresAt: Date.now() + OTP_TTL_MS,
      otpSentAt: Date.now(),
    };

    await sendOtpEmail(email, otp);
    req.flash("success", "We sent a reset OTP to your email address.");
    res.redirect("/forgot-password/verify");
  } catch (err) {
    delete req.session.pendingPasswordReset;
    req.flash("error", err.message);
    res.redirect("/forgot-password");
  }
};

module.exports.getForgotPasswordVerifyPage = (req, res) => {
  const resetState = req.session.pendingPasswordReset;
  if (!resetState) {
    req.flash("error", "Please start password reset again.");
    return res.redirect("/forgot-password");
  }

  res.render("../views/users/forgot-password-verify.ejs", {
    email: resetState.email,
    resendCooldown: getResendCooldown(resetState),
  });
};

module.exports.postForgotPasswordVerify = async (req, res) => {
  try {
    const resetState = req.session.pendingPasswordReset;
    const enteredOtp = String(req.body.otp || "").trim();

    if (!resetState) {
      req.flash("error", "Password reset session expired. Please start again.");
      return res.redirect("/forgot-password");
    }

    if (Date.now() > resetState.expiresAt) {
      req.flash("error", "OTP expired. Please resend a new code.");
      return res.redirect("/forgot-password/verify");
    }

    if (enteredOtp !== resetState.otp) {
      req.flash("error", "Invalid OTP. Please try again.");
      return res.redirect("/forgot-password/verify");
    }

    req.session.verifiedPasswordReset = {
      userId: resetState.userId,
      email: resetState.email,
      verifiedAt: Date.now(),
    };
    delete req.session.pendingPasswordReset;
    await saveSession(req.session);
    res.redirect("/forgot-password/reset");
  } catch (err) {
    delete req.session.pendingPasswordReset;
    req.flash("error", err.message);
    res.redirect("/forgot-password");
  }
};

module.exports.getForgotPasswordResetPage = (req, res) => {
  const verifiedReset = req.session.verifiedPasswordReset;
  if (!verifiedReset) {
    req.flash("error", "Please verify the OTP first.");
    return res.redirect("/forgot-password");
  }

  res.render("../views/users/forgot-password-reset.ejs", { email: verifiedReset.email });
};

module.exports.postForgotPasswordReset = async (req, res, next) => {
  try {
    const verifiedReset = req.session.verifiedPasswordReset;
    const password = String(req.body.password || "").trim();

    if (!verifiedReset) {
      req.flash("error", "Please verify the OTP first.");
      return res.redirect("/forgot-password");
    }

    const strongPasswordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;
    if (!strongPasswordPattern.test(password)) {
      req.flash("error", "Password must be at least 8 characters and include uppercase, lowercase, number, and special character.");
      return res.redirect("/forgot-password/reset");
    }

    const user = await User.findById(verifiedReset.userId);
    if (!user) {
      delete req.session.verifiedPasswordReset;
      req.flash("error", "Account not found. Please start password reset again.");
      return res.redirect("/forgot-password");
    }

    await user.setPassword(password);
    await user.save();
    delete req.session.verifiedPasswordReset;
    req.flash("success", "Password reset successfully. Please log in with your new password.");
    res.redirect("/login");
  } catch (err) {
    delete req.session.verifiedPasswordReset;
    req.flash("error", err.message);
    res.redirect("/forgot-password");
  }
};

module.exports.resendPasswordResetOtp = async (req, res) => {
  try {
    const resetState = req.session.pendingPasswordReset;
    if (!resetState) {
      req.flash("error", "Please start password reset again.");
      return res.redirect("/forgot-password");
    }

    if (Date.now() - resetState.otpSentAt < OTP_RESEND_MS) {
      const waitSeconds = getWaitSeconds(OTP_RESEND_MS, resetState.otpSentAt);
      req.flash("error", `Please wait ${waitSeconds}s before resending the OTP.`);
      return res.redirect("/forgot-password/verify");
    }

    const otp = generateOtp();
    resetState.otp = otp;
    resetState.expiresAt = Date.now() + OTP_TTL_MS;
    resetState.otpSentAt = Date.now();

    await sendOtpEmail(resetState.email, otp);
    await saveSession(req.session);
    req.flash("success", "A new reset OTP has been sent to your email address.");
    res.redirect("/forgot-password/verify");
  } catch (err) {
    req.flash("error", err.message);
    res.redirect("/forgot-password/verify");
  }
};


  //GET LOGIN
  module.exports.getLogIn=(req, res) => {
  res.render("../views/users/login.ejs");
};

  module.exports.getProfilePage = (req, res) => {
    if (!req.isAuthenticated()) {
      req.flash("error", "Please log in to view your profile.");
      return res.redirect("/login");
    }

    res.render("../views/users/profile.ejs", { user: req.user });
  };

// POST LOGIN
module.exports.postLogIn=async(req, res) => {
    req.flash("success","Welcome to  WanderLust World:");
    let redirectUrl=res.locals.redirectUrl || "/listings";
    res.redirect(redirectUrl)
  };


// GET LOGIN
module.exports.getLogOut=(req,res,next)=>{
  req.logOut((err)=>{
    if(err){
      return next(err);
    }
    req.flash("success","You Got LogOut!");
    res.redirect("/listings");

  })
};

