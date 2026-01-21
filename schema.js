const joi=require("joi");
//for server validation we use this joi
module.exports.listingSchema=joi.object({
    listing:joi.object({

        title: joi.string().required(),
        description:joi.string().required(),
        price:joi.number().required().min(0),
        location: joi.string().required(),
        country: joi.string().required(),
        catogery:joi.string().required().valid("Trending", "Rooms","Mountain", "Iconic Cities", "Castles", "Swimming", "Farm", "Camping", "Arctic", "Dome", "Boat"),
        image: joi.object({
        url:joi.string().uri().allow("",null)}).optional()
    }).required()
});

//for server side validation of review 
module.exports.reviewSchema=joi.object({
    review:joi.object({
        rating:joi.number().required().min(1).max(5),
        comment:joi.string().required(),
    }).required()
})

