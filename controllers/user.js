const User = require("../models/user.js");

//GET SIGNUP
  module.exports.getSignUp=(req, res) => {
  res.render("../views/users/signup.ejs");
};


//POST SIGNUP
module.exports.postSignUp=async (req, res) => {
    try {
      let { username, email, password } = req.body;
      const newUser = new User({ email, username });
      const registeredUser = await User.register(newUser, password);
      console.log(registeredUser);
      req.logIn(registeredUser,(err)=>{
        if(err){
          return next(err);
        }
      req.flash("success", "User Registered SuscessFully");
      res.redirect("/listings");
      })
     
    } catch (e) {
      req.flash("error", e.message);
      res.redirect("/signup");
    }
  };


  //GET LOGIN
  module.exports.getLogIn=(req, res) => {
  res.render("../views/users/login.ejs");
};

// POST LOGIN
module.exports.postLogIn=async(req, res) => {
    req.flash("success","Welcome to  WnderLust World:");
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

