const mongoose = require("mongoose");
// const { default: passportLocalMongoose } = require("passport-local-mongoose");
const Schema = mongoose.Schema;

const passportLocalMongoose=require("passport-local-mongoose").default;

const userSchema=new Schema({
    email:{
        type:String,
        required:true,
    }
});

userSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model('User', userSchema);
