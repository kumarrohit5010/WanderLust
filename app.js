//for saving file in 3rd party folder such  as cloudinary
if(process.env.NODE_ENV !="production"){
    require('dotenv').config();
}

const express=require("express");
const mongoose=require("mongoose");
const path=require("path");
const methodOverride=require("method-override");
const ejsMate=require("ejs-mate");
//for client side error
const errorExpress=require("./utils/errorExpress.js");


const listingRouter=require("./routes/listing.js");
const reviewRouter=require("./routes/review.js");
const userRouter=require("./routes/user.js");


const app=express();

//FOR AUTHINTICATIONS 
const passport=require("passport");
const LocalStrategy=require("passport-local");
const User=require("./models/user.js")

// for session of the webpages
const session=require("express-session");
const MongoStore = require('connect-mongo').default;

//for top of messages such as listing created 
const flash=require("connect-flash");
const user = require("./models/user.js");

app.set("view engine","ejs");
app.set("views",path.join(__dirname,"views"));

//ejsmate ko lagi-bolerplate
app.engine("ejs",ejsMate); 


app.use(express.urlencoded({extended:true}));
app.use(methodOverride("_method"));
app.use(express.static(path.join(__dirname,"/public")))//for linking the public files-css/style.css


//mongo atlas for database onlne
const dburl=process.env.ATLASDB_URL;


main().then(()=>{
    console.log("COnnected to the DB");
}).catch((err)=>{
    console.log(err);
})


async function main() {
   await mongoose.connect(dburl);
}

//online database on mongo atlas
const store=MongoStore.create({
    mongoUrl:dburl,
    crypto:{
        secret:process.env.SECRET_CODE,
    },
    touchAfter:24*3600,//in second 

})

store.on("error",()=>{
    console.log("Error in Mongo Session Store",err);
    
})
//for single user to use different pages and storing info about it
const sessionOption={
    store,
    secret:process.env.SECRET_CODE,
    resave:false,
    saveUninitialized:true,
    cookie:{
        //for creating the expiry time of the webpage
        expires:Date.now()+7*24*60*60*1000,
        maxAge:7*24*60*60*1000,
        httpOnly:true,
    }
}

//for usng the section option....these should be used before any routes..such as /listing 
app.use(session(sessionOption));
app.use(flash());


//MiddlWARE FOR AUTHENTICALTION
app.use(passport.initialize())
app.use(passport.session())

// use static authenticate method of model in LocalStrategy
passport.use(new LocalStrategy(User.authenticate()));

// use static serialize and deserialize of model for passport session support
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

//middleware fore the flash
app.use((req,res,next)=>{
    res.locals.success=req.flash("success");
    res.locals.error=req.flash("error");
    res.locals.currentUser=req.user;
    next();
})

app.use("/listings",listingRouter);
app.use("/listings/:id/reviews",reviewRouter);
app.use("/",userRouter);


//GET ROUTE FOR DEMO REGISTER
app.use("/demoUser",async (req,res)=>{
    let fakeUser= new User({
        email:"kumar@321",
        username:"rohin2004"
    })
     let registeredUser=await  User.register(fakeUser,"123456789");
     res.send(registeredUser);
});


//eroor for other route that is not defined
app.use((req,res,next)=>{
    next(new errorExpress(404,"page not found"));
})

//ERROR HANDLING MIDDLEWARE
app.use((err,req,res,next)=>{
    let {status=500,message="Something Happened"}=err;
    res.status(status).render("error.ejs",{message});
})


app.listen(8080,()=>{
    console.log("Listening To The Port 8080:");
})