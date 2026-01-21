const mongoose = require("mongoose");
const Review=require("./review.js")
const Schema = mongoose.Schema;

let listingSchema = new Schema({
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
  },
  image: {
    url:String,
    filname:String,
  },
  price:{
    type:Number,
    min: 0,
  } ,
  location: String,
  country: String,
  catogery:{
    type:String,
    enum:["Trending","Rooms","Mountain","Iconic Cities","Castles","Swimming","Farm","Camping","Arctic","Dome","Boat"],
    default:"Trending",
  },
 
  reviews:[{
    type:Schema.Types.ObjectId,
    ref:"Review"

  },
],
owner:{
  type:Schema.Types.ObjectId,
    ref:"User"
},
 geometry: {
    type: {
      type: String, // Don't do `{ location: { type: String } }`
      enum: ['Point'], // 'location.type' must be 'Point'
      required: true
    },
    coordinates: {
      type: [Number],
      required: true
    }
  }
});

// listingSchema.index({geometry:"2dsphere"});

// middlewear for Deeting the review if the listing are deleted form all listing
listingSchema.post("findOneAndDelete",async(listing)=>{
  if(listing){
    await Review.deleteMany({_id :{ $in: listing.reviews }})
  }
})


const Listing = new mongoose.model("Listing", listingSchema);

module.exports = Listing;
