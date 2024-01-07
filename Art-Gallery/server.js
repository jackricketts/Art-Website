//Require all required modules
const express = require("express");
const app = express();
const mongoose = require("mongoose");
const session = require("express-session");

//Users is used in some portions to verify something exists
let users = {};
//WorkID and reviewIndex allow for unique ids in certain variables
let workID = 0;
let reviewIndex = 0;

//Set up view engine
app.set('view engine', 'pug');

app.set('views', './public/views');

app.use(express.static('public'));

//Set up the session
app.use(session({
    secret: "samplesession1241321",
    resave: true,
    saveUninitialized: true,
}));

app.use(express.json());

//Connect to mongoDB database "gallery"
mongoose.connect('mongodb://127.0.0.1/gallery');
let db = mongoose.connection;

db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function() {
    console.log("Connected to database!");
});

//Used for navigation of all registered users and artworks
const Artwork = require("./ArtworkModel");
const User = require("./UserModel");

//Loads all required data for database manipulation
async function loadData(){
    const inittedUsers = await User.find();
    for(let userInfo of inittedUsers){
        userInfo.username = userInfo.username;
        users[userInfo.username] = userInfo.password;
        //Update all users such that they are not logged in on program start (important if server stops and restarts)
        await User.updateOne({username: userInfo.username}, {$set: {loggedIn: false}});
        //In case the database already has workshops, generate a unique id based on the number of workshops
        for(let workshop in userInfo.workshops){
            workID++;
        }
    }
    //Same thing being done for workID, but using the length of the reviews array given to each artwork
    const inittedArt = await Artwork.find();
    for(let artwork of inittedArt){
            // Increment for each review in the array
            if (artwork.Reviews && artwork.Reviews.length > 0) {
            reviewIndex += artwork.Reviews.length; 
        }
    }
}

//Call load function before routes
loadData();
//Render the home page with the current user information and logged in status
app.get("/", async(req, res) => {
    const artwork = await Artwork.findOne();
    let current = await User.findOne({username: req.session.username})
    res.render("pages/home", {artwork, logged: req.session.username, currUser: current});
});

//Load login page (only accessible to logged out users)
app.get("/login", (req, res) => {
    if(!req.session.username){
        res.render("pages/login", {logged: req.session.username});
    }
    else{
        res.status(400).send("Already logged in! Log out if you want to log into another account!");
    }
});

//Load register page (only accessible to logged out users)
app.get("/register", (req, res) => {
    if(!req.session.username){
        res.render("pages/register", {logged: req.session.username});
    }
    else{
        res.status(400).send("Already logged in! Log out if you want to make a new account!")
    }
});

//Loads the add workshop page, only accessible to logged in users
app.get("/workshop", async (req, res) => {
    if(!req.session.username){
        res.status(400).send("Not logged in! Please log in to add a workshop!")
    }
    else{
        let current = await User.findOne({username: req.session.username})
        res.render("pages/workshop", {currUser: current});
    }
});

//Loads the user page depending on what type of user is accessing it
app.get("/user/:userID", async (req, res) => {
    let profileID = req.params.userID;
    let current;
    //Ensure that there is an active session, there could be an error otherwise
    if(req.session.username){
        current = await User.findOne({username: req.session.username});
    }
    //userProfile is used to access info about the profile who is going to be shown
    try{
        let userProfile = await User.findOne({_id: profileID});
        //If there are artworks, populate the artworks array with their info
        if(userProfile.artworks.length > 0){
            await userProfile.populate('artworks')
        }
        //This goes for both profiles
        if(current && current.artworks.length > 0){
            await current.populate('artworks');
        }
        //If the logged in account is the same as the profile being shown, send in the logged in user
        //Both currUser and userPage are necessary because the page is formatted around userPage, but the header uses currUser
        if(current && current.username === userProfile.username){
            res.render("pages/user", {currUser: current, userPage: current});
        }
        //If they aren't equal, but current is defined, then send both the current logged in account and the profile to be shown
        else if(current){
            res.render("pages/user", {currUser: current, userPage: userProfile});
        }
        //Otherwise, only send in the profile being shown
        else{
            res.render("pages/user", {currUser: undefined, userPage: userProfile});
        }
    }
    catch(err){
        res.status(404).send("User not found")
    }
});

//Destroys a session if there is one
app.get("/logout", async (req, res) => {
    if(req.session.username){
        await User.updateOne({username: req.session.username}, {$set: {loggedIn: false}});
        req.session.destroy((err) => {
            if (err){
                console.log("Error: " + err);
            }
            else{
                res.redirect('/')
            }
        })
    }
    else{
        res.status(400).send("You must be logged in to log out!");
    }
});
//Switch an account from patron to artist, and vice versa
app.get("/change", async (req, res) => {
    let current = await User.findOne({username: req.session.username})
    //If current is an artist, change it to patron
    if(current && current.artist){
        current.artist = false;
        await User.updateOne({username: req.session.username}, {$set: {artist: false}});
        res.redirect(`/user/${current._id}`);
    }
    //If current isnt an artist, check how many artworks it has
    //If it has 0, make them add art, otherwise 
    else if(current && !current.artist){
        if(current.artworks.length > 0){
            current.artist = true;
            await User.updateOne({username: req.session.username}, {$set: {artist: true}});
            res.redirect(`/user/${current._id}`);
        }
        else{
            res.redirect("/artwork");
        }
    }
    else if (!current){
        res.status(400).send("You must be logged in to change account status!");
    }
});

//Users are the only ones allowed to see the /artwork page
app.get("/artwork", async (req, res) => {
    if(req.session.username){
        let current = await User.findOne({username: req.session.username})
        res.render("pages/artwork", {currUser: current});
    }
    else{
        res.status(400).send("You need to be logged in to add artwork!")
    }
});

//Gets the specific information for one piece of artwork
app.get("/artwork/:artID", async (req, res) => {
    let artID = req.params.artID;
    try{
        let currArt = await Artwork.findOne({_id: artID});
        let artUser = await User.findOne({username: currArt.Artist});
        let currID = artUser._id;
        let current = await User.findOne({username: req.session.username})
        if(currArt){
            res.render("pages/artInfo", {currArt: currArt, logged: req.session.username, userId: currID, currUser: current});
        }
        else{
            res.status(404).send("Artwork not found!");
        }
    }
    catch(err){
        res.status(404).send("Artwork not found");
    }
});

//Allows one user to follow another, provided they are logged in
app.get("/follow/:userID", async (req, res) => {
    if(!req.session.username){
        res.status(400).send("You must be logged in to follow users!")
    }
    else{
        try{
            let current = await User.findOne({username: req.session.username})
            let followID = req.params.userID;
            let followedUser = await User.findOne({_id: followID});
            if(followedUser.followers.includes(current._id)){
                await User.updateOne({_id: current._id}, {$pull: {following: followedUser._id}});
                await User.updateOne({_id: followedUser._id}, {$pull: {followers: current._id}});
                res.redirect(`/user/${followedUser._id}`);
            }
            else{
                await User.updateOne({_id: current._id}, {$push: {following: followedUser._id}});
                await User.updateOne({_id: followedUser._id}, {$push: {followers: current._id}});
                res.redirect(`/user/${followedUser._id}`);
            }
        }
        catch(err){
            res.status(404).send("User not found");
        }
    }

});

//Gets the followers page, which shows a user's followers
app.get("/followers/:followID", async (req, res) => {
    try{
        let followID = req.params.followID;
        let followUser = await User.findOne({_id: followID}).populate("followers");
        let current = await User.findOne({username: req.session.username});
        res.render("pages/follower", {logged: req.session.username, followUser: followUser, currUser: current});
    }
    catch(err){
        res.status(404).send("User not found");
    }
});

//Gets the following page, which shows everyone the user in question currently follows
app.get("/following/:followID", async (req, res) => {
    try{
        let followID = req.params.followID;
        let followUser = await User.findOne({_id: followID}).populate("following");
        let current = await User.findOne({username: req.session.username});
        res.render("pages/following", {logged: req.session.username, followUser: followUser, currUser: current});
    }
    catch(err){
        res.status(404).send("User not found");
    }
});
    
//Likes an artwork, given that the user is logged in
app.get("/like/:artID/:type", async (req, res) => {
    try{
        if(req.session.username){
            let artID = req.params.artID;
            let pageType = req.params.type;
            let post = await Artwork.findOne({_id: artID});
            let poster = await User.findOne({username: post.Artist});
            let current = await User.findOne({username: req.session.username})
            if(current != poster){
                if(post.LikedBy.includes(current._id)){
                    await User.updateOne({_id: current._id}, {$pull: {likedArtworks: post._id}});
                    await Artwork.updateOne({_id: artID}, {$pull: {LikedBy: current._id}});
                }
                else{
                    await User.updateOne({_id: current._id}, {$push: {likedArtworks: post}});
                    await Artwork.updateOne({_id: artID}, {$push: {LikedBy: current}});
                }
                //These two lines of code specify where the page should be refreshed (if the user types it manually, then it wont matter)
                if(pageType === "info"){
                    res.redirect(`/artwork/${artID}`);
                }
                else if(pageType === "user"){
                    res.redirect(`/user/${poster._id}`);
                }
            }
            else{
                res.status(400).send("You cannot like your own artwork!");
            }
        }
        else{
            res.status(400).send("You must be logged in to like artwork!");
        }
    }
    catch(err){
        res.status(404).send("Type or artwork not found");
    }

});

//If the user did not make the art, and they are logged in, it will load the review page for the given art
app.get(`/review/:artID`, async (req, res) => {
    try{
        if(req.session.username){
            let artID = req.params.artID;
            let sentArt = await Artwork.findOne({_id: artID});
            let poster = await User.findOne({username: sentArt.Artist});
            let current = await User.findOne({username: req.session.username})
            if(current == poster){
                res.status(400).send("You cannot make a review for an artwork you made!");
            }
            else if(!current){
                res.status(400).send("You must be logged in to write reviews!");
            }
            else{
                res.render("pages/review", {artwork: sentArt, currUser: current, logged: req.session.username});
            }
        }
    }
    catch(err){
        res.status(404).send("Artwork not found");
    }
});

//Loads the reviews page for a given artwork, making sure that the user is logged in
app.get("/reviews/:artID", async (req, res) => {
    try{
        if(req.session.username){
            let artID = req.params.artID;
            let sentArt = await Artwork.findOne({_id: artID});
            let current = await User.findOne({username: req.session.username});

            res.render("pages/reviews", {artwork: sentArt, currUser: current, logged: req.session.username});
        }
        else{
            res.status(400).send("You must be logged in to view reviews! ");
        }
    }
    catch(err){
        res.status(404).send("Artwork not found");
    }
});

//Removes a review for a given artwork
app.get("/review/:artID/:revID", async (req, res) => {
    try{
        let revID = req.params.revID;
        let artID = req.params.artID;
        let art = await Artwork.findOne({_id: artID});
        if(art){
            await Artwork.updateOne({_id: artID}, {$pull: {Reviews: {reviewID: revID}}});
            res.redirect(`/reviews/${artID}`);
        }
        else{
            res.status(400).send("Artwork not found!");
        }
    }
    catch(err){
        res.status(404).send("Artwork or review not found");
    }
});

//Used by some client functions to get a list of all artwork and users (mainly search client)
app.get("/details", async (req, res) => {
    let allArt = await Artwork.find();
    let allUsers = await User.find();
    res.json({
        art: allArt,
        users: allUsers
    });
});

//Loads the search page
app.get("/find", async (req, res) => {
    let current;
    if(req.session.username){
        current = await User.findOne({username: req.session.username});
    }
    res.render("pages/search", {currUser: current, logged: req.session.username});
});

//Used for the serach algorithm, the search client sends in uriencodedcomponents, and those get translated
app.get("/search", async (req, res) => {
    let artistInput = req.query.artist;
    let artInput = req.query.title;
    let catInput = req.query.category;
    if(!artistInput){
        artistInput = "";
    }
    if(!artInput){
        artInput = "";
    }
    if(!catInput){
        catInput = "";
    }

    //Just make sure that each field contains whatever the user typed and sent
    let query = {
        Artist: {$regex: ".*" + artistInput + ".*", $options: "i"},
        Title: {$regex: ".*" + artInput + ".*", $options: "i"},
        Category: {$regex: ".*" + catInput + ".*", $options: "i"}
    }

    //Send the list of art back to the client
    let sorted = await Artwork.find(query);
    res.json(sorted);
});

//Renders a workshop's info page given the ID and the user who made it
app.get("/workshop/:workID/:userID", async (req, res) => {
    try{
        if(req.session.username){
            let sentWork = req.params.workID;
            let userID = req.params.userID;
            let workUser = await User.findById(userID);
            let current = await User.findOne({username: req.session.username});
            //If the user exists
            if(workUser){
                let workshop = workUser.workshops[sentWork];
                //If the workshop exists
                if(workshop){
                    if(current){
                        res.render("pages/workInfo", {workshop: workshop, currUser: current, owner: workUser, logged: req.session.username});
                    }
                    else{
                        res.status(400).send("You must be logged in to view enrolment pages!")
                    }
                }
                else{
                    res.status(400).send("Page does not exist!");
                }
            }
            else{
                res.status(400).send("Page does not exist!");
            }
        }
    }
    catch(err){
        res.status(404).send("User or workshop not found");
    }
});

//Enrolls a logged in user into a workshop
app.get("/enroll/:userID/:workID", async (req, res) => {
    try{
        if(req.session.username){
            let sentWork = req.params.workID;
            let userID = req.params.userID;
            let workUser = await User.findById(userID);
            let current = await User.findOne({username: req.session.username})
            //If the user who made the workshop exists, and the current user is not the creator
            if(workUser && workUser.username !== current.username){
                let workshop = workUser.workshops[sentWork];
                if(workshop){
                    if(current){
                        workUser.workshops[sentWork].enrolled.push(current.username);
                        await workUser.save();
                        res.status(200).send();
                    }
                    else{
                        res.status(400).send("You must be logged in to enroll!")
                    }
                }
                else{
                    res.status(400).send("Failed to enroll!");
                }
            }
            else{
                res.status(400).send("Failed to enroll!");
            }
        }
    }
    catch(err){
        res.status(404).send("User or workshop not found");
    }
});

//Load the notifications page, only available to logged in users
app.get("/notifications", async (req, res) => {
    if(req.session.username){
        let current = await User.findOne({username: req.session.username})
        if(current){
            res.render("pages/notifications", {currUser: current});
        }
        else{
            res.status(400).send("You must be logged in to view notifications!")
        }
    }
});

//Adds functionality to the clear button
app.get("/clear", async (req, res) => {
    if(req.session.username){
        let current = await User.findOne({username: req.session.username});
        if(current){
            await User.updateOne({username: req.session.username}, {$set: {notifications: []}});
            res.redirect("/notifications")
        }
    }
});

//Renders the liked artworks page, after checking that the user is logged in
app.get("/liked", async (req, res) => {
    try{
        if(req.session.username){
            let current = await User.findOne({username: req.session.username});
            if(current){
                await current.populate("likedArtworks");
                res.render("pages/liked", {currUser: current});
            }
        }
        else{
            res.status(400).send("You must be logged in to access liked artworks!");
        }
    }
    catch (err){
        res.status(404).send("Liked artworks not found");
    }
})

//Logs a user in, given that the information sent is correct
app.post("/login", async (req, res) => {
    let sentUser = req.body.username;
    let sentPass = req.body.password;
    let tempUser;
    if(users[sentUser] && users[sentUser] === sentPass){
        tempUser = await User.findOne({username: sentUser});
        if(tempUser.loggedIn){
            res.status(401).send();
        }
        else{
            await User.updateOne({username: sentUser}, {$set: {loggedIn: true}});
            req.session.username = sentUser;
            res.status(200).send();
        }
    }
    else{
        res.status(400).send();
    }
});

//Registers a new user to the program, and adds them to MongoDB
app.post("/register", async (req, res) => {
    let sentUser = req.body.username;
    let sentPass = req.body.password;
    let sentAge = req.body.age;
    delete users.test;
    if(users[sentUser]){
        res.status(400).send();
    }
    else{
        users[sentUser] = sentPass;
        await User.create({username: sentUser, password: sentPass, age: sentAge})
        req.session.username = sentUser;
        res.status(200).send()
    }
});

//Posts a new workshop to mongoDB
app.post("/workshop", async (req, res) => {
    //Ensure they are logged in
    if(req.session.username){
        let sentName = req.body.name;
        let current = await User.findOne({username: req.session.username})
        //The user can only post a workshop if they are the user trying to, so you don't need to check anything about them
        current.workshops[workID] = {name: sentName, id: workID};
        //Send a notification to all followers
        for(let user of current.followers){
            await User.updateOne({_id: user}, {$push: {notifications: `${current.username} has uploaded a new workshop!`}})
        }
        //Add the workshop to the list, increment the counter
        await User.updateOne({username: current.username}, {$push: {workshops: {id: workID, name: sentName, enrolled: []}}});
        workID++;
        res.status(200).send();
    }
    else{
        res.status(400).send("You must be logged in to add workshops!");
    }

});

//Post a new artwork
app.post("/artwork", async(req, res) => {
    //Ensure user is logged in
    if(req.session.username){
        let sentTitle = req.body.title;
        let sentYear = req.body.year;
        let sentCategory = req.body.category;
        let sentMedium = req.body.medium;
        let sentDescription = req.body.description;
        let sentPoster = req.body.poster;
        let tempArt = await Artwork.findOne({Title: sentTitle});
        let current = await User.findOne({username: req.session.username})
        //If the artwork already exists, don't post it
        if(tempArt){
            res.status(400).send();
        }
        else{
            //Create the new art within MongoDB
            let newArt = await Artwork.create({
                Title: sentTitle,
                Artist: current.username,
                Year: sentYear,
                Category: sentCategory,
                Medium: sentMedium,
                Description: sentDescription,
                Poster: sentPoster,
                LikedBy: [],
                Reviews: []
            });
            //Let all followers know that a new art was uploaded
            for(let user of current.followers){
                await User.updateOne({_id: user}, {$push: {notifications: `${current.username} has uploaded new art!`}})
            }
            //Add new art, set their artist value to true
            await User.updateOne({username: current.username}, {$push: {artworks: newArt}})
            await User.updateOne({username: current.username}, {$set: {artist: true}});
            res.redirect(`/artwork/${newArt._id}`);
        }
    }
    else{
        res.status(400).send("You must be logged in to post artwork!");
    }
});

//Posts a review to a MongoDB artwork
app.post("/review/:artID", async (req, res) => {
    if(req.session.username){
        let sentReview = req.body.review;
        let artID = req.params.artID;
        //Get the current user and the art the review will be posted to
        let current = await User.findOne({username: req.session.username})
        let art = await Artwork.findOne({_id: artID});
        //If it exists, add a review and save it to the database
        if(art){
            art.Reviews[reviewIndex] = ({
                name: current.username,
                review: sentReview,
                userID: current._id,
                reviewID: reviewIndex
            });
            await art.save();
            res.status(200).send();
            //Increment for the next review
            reviewIndex++;
        }
        else{
            res.status(400).send("Artwork not found!");
        }
    }
    else{
        res.status(400).send("Cannot post reviews unless you are logged in!");
    }
});

app.listen(3000);
console.log("Server running at http://127.0.0.1:3000/");