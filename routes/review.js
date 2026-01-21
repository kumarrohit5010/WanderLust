const express=require("express");
const router=express.Router({mergeParams:true});
const asyncWrap=require("../utils/asyncWrap.js");
const {validateReview, isLoggedIn, isReviewAuthor}=require("../middleware.js");
const reviewController=require("../controllers/review.js");

//Review POST Route
router.post("/",isLoggedIn,validateReview,asyncWrap(reviewController.createReview));

//REVIEW DELETE ROUTE
router.delete("/:reviewId",isReviewAuthor,asyncWrap(reviewController.deleteReview));

module.exports=router;

