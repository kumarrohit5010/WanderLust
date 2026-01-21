const Listing = require("./models/listing.js");
const errorExpress=require("./utils/errorExpress.js");
//for server side error
const {listingSchema,reviewSchema}=require("./schema.js");
const Review=require("./models/review.js");


module.exports.isLoggedIn = (req, res, next) => {
  if (!req.isAuthenticated()) {
    req.session.redirectUrl = req.originalUrl;
    req.flash("error", "You Must Be LoggedIn!");
    return res.redirect("/login");
  }
  next();
};

module.exports.saveRedirectUrl = (req, res, next) => {
  if (req.session.redirectUrl) {
    res.locals.redirectUrl = req.session.redirectUrl;
  }
  next();
};

module.exports.isOwner = async (req, res, next) => {
    let {id}=req.params;
  let listing = await Listing.findById(id);
  if (!listing.owner._id.equals(res.locals.currentUser._id)) {
    req.flash("error", "You Are not the OWNER for Bringing changes: ");
    return res.redirect(`/listings/${id}`);
  }
  next();
};

//MIDDLEWARE FOR SCHEMA
module.exports.validationSchema=((req,res,next)=>{
     const {error}=listingSchema.validate(req.body);
  if(error){
     throw new errorExpress(400,error.details[0].message);
   }
   else{
    next();
   }
});


module.exports.validateReview=((req,res,next)=>{
     const {error}=reviewSchema.validate(req.body);
  if(error){
     throw new errorExpress(400,error.details[0].message);
     
   }
   else{
    next();
   } 
});

module.exports.isReviewAuthor = async (req, res, next) => {
    let {id,reviewId}=req.params;
  let review = await Review.findById(reviewId);
  if (!review.author._id.equals(res.locals.currentUser._id)) {
    req.flash("error", "You Are not the author of this review: ");
    return res.redirect(`/listings/${id}`);
  }
  next();
};