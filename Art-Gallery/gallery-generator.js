const mongoose = require("mongoose");
const fs = require("fs");

mongoose.connect("mongodb://127.0.0.1/gallery");

const Artwork = require("./ArtworkModel.js")
const User = require("./UserModel.js")

async function initDB(){
    const jsonArtwork = JSON.parse(fs.readFileSync("gallery.json"));
    let initArt = await Artwork.insertMany(jsonArtwork);
    const uniqueNames = await Artwork.distinct("Artist");
    let created = [];
    let numUsers = 0;
    for(let i = 0; i < uniqueNames.length; i++){
        const user = await User.create({
            username: uniqueNames[i],
            password: "password",
            age: 25,
            artist: true,
            id: i
        })
        numUsers++;
        created.push(user);
    }
    console.log(`${numUsers} users created successfully!`);
    let numArt = 0;
    for(artwork of initArt){
        numArt++;
        let index = uniqueNames.indexOf(artwork.Artist)
        artist = created[index];
        artist.artworks.push(artwork);
        await artist.save();
    }
    console.log(`Successfully added ${numArt} pieces of artwork to the users!`);
}
mongoose.connection.dropDatabase();
async function start(){
    await mongoose.connection.dropDatabase();
    await initDB();
    mongoose.connection.close();
}

start();