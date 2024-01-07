const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    username: String,
    password: String,
    age: Number,
    following: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    followers: [{type: mongoose.Schema.Types.ObjectId, ref: "User"}],
    artist: {type: Boolean, default: false},
    likedArtworks: [{ type: mongoose.Schema.Types.ObjectId, ref: "Artwork" }],
    artworks: [{ type: mongoose.Schema.Types.ObjectId, ref: "Artwork" }],
    id: Number,
    loggedIn: {type: Boolean, default: false},
    workshops: [{
        id: Number,
        name: String,
        enrolled: [String],
    }],
    notifications: [String]
});


module.exports = mongoose.model("User", userSchema);