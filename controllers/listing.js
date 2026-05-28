const Listing = require("../models/listing");
const axios = require("axios");

/* ----------------------------- HELPERS ----------------------------- */

const renderIndex = (res, listings, searchQuery = "", activeCategory = null) => {
  res.render("./listings/index.ejs", {
    allListings: listings,
    searchQuery,
    activeCategory,
  });
};

// Geocoding helper
const getCoordinates = async (location, country) => {
  const geoResponse = await axios.get(
    "https://api.openweathermap.org/geo/1.0/direct",
    {
      params: {
        q: `${encodeURIComponent(location)},${country}`,
        limit: 1,
        appid: process.env.WEATHER_API,
      },
    }
  );

  const loc = geoResponse?.data?.[0];
  if (!loc) throw new Error("Location not found");

  return { lat: loc.lat, lon: loc.lon };
};

/* ----------------------------- ROUTES ----------------------------- */

// INDEX
module.exports.index = async (req, res) => {
  const allListings = await Listing.find({});
  renderIndex(res, allListings);
};

// FILTER BY CATEGORY
module.exports.filterByCategory = async (req, res) => {
  const { category } = req.query;

  if (!category) return res.redirect("/listings");

  const allListings = await Listing.find({ category }); // FIXED typo
  renderIndex(res, allListings, "", category);
};

// SEARCH
module.exports.searchByPlace = async (req, res) => {
  const search = (req.query.q || "").trim();

  if (!search) return res.redirect("/listings");

  const regex = new RegExp(search, "i");

  const allListings = await Listing.find({
    $or: [
      { location: regex },
      { country: regex },
      { title: regex },
    ],
  });

  renderIndex(res, allListings, search);
};

// NEW FORM
module.exports.new = (req, res) => {
  res.render("listings/new.ejs");
};

// CREATE
module.exports.create = async (req, res) => {
  try {
    const { location, country } = req.body.listing;

    const { lat, lon } = await getCoordinates(location, country);

    const url = req.file.path;
    const filename = req.file.filename;

    const newListing = new Listing(req.body.listing);

    newListing.owner = req.user._id;
    newListing.image = { url, filename };
    newListing.geometry = {
      type: "Point",
      coordinates: [lon, lat],
    };

    await newListing.save();

    req.flash("success", "New Listing Created!");
    res.redirect("/listings");

  } catch (err) {
    req.flash("error", err.message);
    res.redirect("/listings/new");
  }
};

// SHOW
module.exports.show = async (req, res) => {
  const listing = await Listing.findById(req.params.id)
    .populate({ path: "reviews", populate: { path: "author" } })
    .populate("owner");

  if (!listing) {
    req.flash("error", "Listing Does not Exist!");
    return res.redirect("/listings");
  }

  res.render("./listings/show.ejs", { listing });
};

// EDIT
module.exports.edit = async (req, res) => {
  const listing = await Listing.findById(req.params.id);

  if (!listing) {
    req.flash("error", "Listing Does not Exist!");
    return res.redirect("/listings");
  }

  const originalImageUrl = listing.image.url.replace("/upload", "/upload/w_250");

  res.render("./listings/edit.ejs", {
    listing,
    originalImageUrl,
  });
};

// UPDATE
module.exports.update = async (req, res) => {
  try {
    const { id } = req.params;

    const listing = await Listing.findById(id);

    if (!listing) {
      req.flash("error", "Listing not found");
      return res.redirect("/listings");
    }

    // Update coordinates only if changed
    if (
      req.body.listing.location !== listing.location ||
      req.body.listing.country !== listing.country
    ) {
      const { lat, lon } = await getCoordinates(
        req.body.listing.location,
        req.body.listing.country
      );

      req.body.listing.geometry = {
        type: "Point",
        coordinates: [lon, lat],
      };
    }

    // Update listing fields safely
    Object.assign(listing, req.body.listing);

    // Update image if uploaded
    if (req.file) {
      listing.image = {
        url: req.file.path,
        filename: req.file.filename,
      };
    }

    await listing.save();

    req.flash("success", "Listing Updated!");
    res.redirect(`/listings/${id}`);

  } catch (err) {
    req.flash("error", err.message);
    res.redirect(`/listings/${req.params.id}/edit`);
  }
};

// DELETE
module.exports.delete = async (req, res) => {
  await Listing.findByIdAndDelete(req.params.id);

  req.flash("success", "Listing Deleted!");
  res.redirect("/listings");
};

// EXPORT helper (optional reuse elsewhere)
module.exports.getCoordinates = getCoordinates;