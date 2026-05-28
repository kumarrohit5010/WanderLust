const mongoose = require("mongoose");
// const { default: passportLocalMongoose } = require("passport-local-mongoose");
const Schema = mongoose.Schema;

const passportLocalMongoose=require("passport-local-mongoose").default;

const userSchema=new Schema({
    username:{
        type:String,
        required:true,
        unique:true,
    },
    email:{
        type:String,
        required:true,
    }
    ,
    firstName:{
        type:String,
        default:"",
    },
    lastName:{
        type:String,
        default:"",
    },
    age:{
        type:Number,
        default:null,
    },
    gender:{
        type:String,
        default:"",
    }
});

userSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model('User', userSchema);
