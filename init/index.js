const mongoose=require("mongoose");
const Listing=require("../models/listing.js");
const initData=require("./data.js");


const Mong_URL="mongodb://127.0.0.1:27017/wanderLust";

main().then(()=>{
    console.log("COnnected to the DB");
}).catch((err)=>{
    console.log(err);
});


async function main() {
  await mongoose.connect(Mong_URL);
};

const InitDB = async ()=>{
await Listing.deleteMany({});
initData.data=initData.data.map((obj)=>({...obj,owner:"694be8ce8534d2fa2f99e5f7"}));
await Listing.insertMany(initData.data);
console.log("data was initialized.....");

};

InitDB();

