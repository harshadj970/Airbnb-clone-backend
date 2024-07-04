const mongoose = require("mongoose");

const placeSchema = new mongoose.Schema({
  owner: { type: mongoose.Types.ObjectId, ref: "User" },
  title: String,
  address: String,
  photos: [String],
  description: String,
  perks: [String],
  extraInfo: String,
  checkIn: String,
  checkOut: String,
  maxGuests: Number,
  price: Number,
  bedrooms: {
    type: Number,
    default: 1,
  },
  bathrooms: {
    type: Number,
    default: 1,
  },
  neighbourhood:String,
  aboutOwner:String
});

const Place = mongoose.model("place", placeSchema);
module.exports = Place;
