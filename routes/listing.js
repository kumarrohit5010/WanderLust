const express=require("express");
const router=express.Router();
const asyncWrap=require("../utils/asyncWrap.js");
const {isLoggedIn, isOwner,validationSchema}=require("../middleware.js");
const listingController=require("../controllers/listing.js");
const multer  = require('multer');
const {storage}=require("../cloudinary.js");
const upload = multer({ storage })


router.route("/")
//INDEX ROUTE

.get(asyncWrap(listingController.index))
//CREATE ROUTE
.post(upload.single("listing[image]"),validationSchema, asyncWrap(listingController.create));


//FILTER ROUTE
router.get("/filter/category",asyncWrap(listingController.filterByCategory));

//SEARCH ROUTE
router.get("/search",asyncWrap(listingController.searchByPlace));

//NEW route
router.get("/new",isLoggedIn,listingController.new);

router.route("/:id")
//SSHOW ROUTE
.get(asyncWrap(listingController.show))

//UPDATE ROUTE
.put(isOwner,upload.single("listing[image]"),validationSchema, asyncWrap(listingController.update))

//DELETE ROUTE
.delete(isLoggedIn,isOwner,asyncWrap(listingController.delete));


//EDIT ROUTE
router.get("/:id/edit",isLoggedIn,isOwner, asyncWrap(listingController.edit));

module.exports=router;
