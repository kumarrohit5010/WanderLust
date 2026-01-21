const Listing=require("../models/listing");
const axios=require("axios");

//FOR INDEX ROUTE
module.exports.index=async (req,res)=>{
  const allListings= await Listing.find({});
  res.render("./listings/index.ejs",{allListings,searchQuery:"",activeCategory:null});
}

//FILTER ROUTE BY CATEGORY
module.exports.filterByCategory=async (req,res)=>{
    const {category}=req.query;
    if(!category){
        return res.redirect("/listings");
    }
    const allListings= await Listing.find({catogery:category});
  res.render("./listings/index.ejs",{allListings,searchQuery:"",activeCategory:category});
}

//SEARCH ROUTE BY PLACE/TITLE/COUNTRY
module.exports.searchByPlace=async(req,res)=>{
  const search = (req.query.q || "").trim();
  if(!search){
    return res.redirect("/listings");
  }
  const regex = new RegExp(search,"i");
  const allListings = await Listing.find({
    $or:[
      {location:regex},
      {country:regex},
      {title:regex},
    ]
  });
  res.render("./listings/index.ejs",{allListings,searchQuery:search,activeCategory:null});
}

//NEW ROUTE
module.exports.new=(req,res)=>{
    res.render("listings/new.ejs")
}


//CREATE ROUTE
module.exports.create= async(req,res)=>{
    try{
    const location=req.body.listing.location;
    const country=req.body.listing.country;
    const geoResponse=await axios.get(`http://api.openweathermap.org/geo/1.0/direct`,{
        params:{
            q:`${encodeURIComponent(location)},${country}`,
            limit:1,
            appId:process.env.WEATHER_API
        },
    })

    const loc=geoResponse?.data[0];
    if(!loc){
        req.flash("error","Location not found! Please enter a valid location.");
        return res.redirect("/listings/new");
    }
    const lat=loc.lat;
    const lon=loc.lon;



    let url=req.file.path;
    let filename=req.file.filename;
   let newListing= new Listing(req.body.listing);

   newListing.owner=req.user._id;
   newListing.image={url,filename};
   
   // Default coordinates (update with your API for auto-geocoding)
   newListing.geometry = {
      type: 'Point',
      coordinates: [lon,lat]// longitude, latitude
   };
   
   await newListing.save();
   req.flash("success","New Listing Created!");
    res.redirect("/listings");
    } catch(err){
        req.flash("error","Error creating listing: "+err.message);
        res.redirect("/listings/new");
    }
};


//SHOW ROUTE
module.exports.show=async (req,res)=>{
    let {id}=req.params;//for this app.use(express.urlencoded({extended:true}));
    const listing=await Listing.findById(id).populate({path:"reviews",populate:{path:"author"}}).populate("owner");
    if(!listing){
        req.flash("error","Listing Doesnot Exist!");
       return res.redirect("/listings");
    }
     res.render("./listings/show.ejs",{listing});
};

// EDIT ROUTE
module.exports.edit=async(req,res)=>{
    let {id}=req.params;
    const listing=await Listing.findById(id);
    if(!listing){
        req.flash("error","Listing Doesnot Exist!");
       return res.redirect("/listings");
    }
    let originalImageUrl=listing.image.url.replace("/upload","/upload/w_250");
    res.render("./listings/edit.ejs",{listing,originalImageUrl});
};

// // Helper function to get coordinates from location and country
module.exports.getCoordinates = async (location, country) => {
  const geoResponse = await axios.get(
    `https://api.openweathermap.org/geo/1.0/direct`,
    {
      params: {
        q: `${encodeURIComponent(location)},${country}`,
        limit: 1,
        appid:process.env.WEATHER_API,
      },
    }
  );

  const loc = geoResponse?.data[0];
  if (!loc) {
    throw new Error("Location not found please Enter valid country and Location");
  }
  return { lat: loc.lat, lon: loc.lon };
};




// UPDATE ROUTE
module.exports.update=async(req,res)=>{
    try{
     let {id}=req.params;
     let listing = await Listing.findById(id);
    
   // If location or country changed, update coordinates
  if (req.body.listing.location !== listing.location || 
      req.body.listing.country !== listing.country) {
    const { lat, lon } = await module.exports.getCoordinates(
      req.body.listing.location,
      req.body.listing.country
    );
    req.body.listing.geometry = {
      type: "Point",
      coordinates: [lon, lat],
    };
  }

     await Listing.findByIdAndUpdate(id,{...req.body.listing});
     if(typeof req.file!=="undefined"){
        let url=req.file.path;
    let filename=req.file.filename;
    listing.image={url,filename};
    await listing.save();

     }
     
    req.flash("success","Listing  Updated!");
     res.redirect(`/listings/${id}`);
    } catch(err){
        req.flash("error","Error updating listing: "+err.message);
        res.redirect(`/listings/${id}/edit`);
    }
};



// DELETE ROUTE
module.exports.delete=async(req,res)=>{
     let {id}=req.params;
     let deleteListing=await Listing.findByIdAndDelete(id);
     console.log(deleteListing);
    req.flash("success","Listing Deleted!");
     res.redirect("/listings");

};











