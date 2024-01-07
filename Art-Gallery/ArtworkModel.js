const mongoose = require("mongoose");

const artSchema = new mongoose.Schema({
  Title: String,
  Artist: String,
  Year: String,
  Category: String,
  Medium: String,
  Description: String,
  Poster: String,
  LikedBy: [{type: mongoose.Schema.Types.ObjectId, ref: "User"}],
  Reviews: [{ name: String, review: String, userID: {type: mongoose.Schema.Types.ObjectId, ref: "User"}, reviewID: String}]
});

module.exports = mongoose.model("Artwork", artSchema);