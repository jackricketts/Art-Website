let page = 1;
let art;
let users;
let sorted;
document.addEventListener("DOMContentLoaded", function () {
    document.getElementById("submitSearch").addEventListener("click", sendSearch);
    xmlLoad = new XMLHttpRequest();
    xmlLoad.open("GET", "/details", true);
    xmlLoad.onreadystatechange = function () {
        if(this.readyState === 4 && this.status === 200){
            let res = JSON.parse(this.responseText);
            art = res.art;
            users = res.users;
            updateArt();
        }
    }
    xmlLoad.send();
})

function updateArt(){
    let result = '';
    //Use indexes to get the data per page
    let lowerIndex = (page - 1) * 10;
    let upperIndex = lowerIndex + 10;
    let filterArt = art.slice(lowerIndex, upperIndex);
    //Update all html with required styling, repeat it twice depending on what the get request receives
    if(!sorted){
        filterArt.forEach(artwork => {
            result += `
            <div style="clear: both;">
            <img src=${artwork.Poster} alt=${artwork.Artist} style="width: 30%; margin-right: 20px; float: left;">
                <p>Title: <a href="/artwork/${artwork._id}">${artwork.Title}</a></p>`;
                users.forEach(user => {
                if (user.username === artwork.Artist) {
                    result += `<p> Artist: <a href="/user/${user._id}">${user.username}</a></p>`;
                    return;
                }
                });
                result += `
                <p>Category: ${artwork.Category}</p>
            </div>`;
        });
        result += `
        <div style="text-align: center; float: left; clear: both">
        <button onclick="back()">Previous</button>
        <span> Page ${page} </span>
        <button onclick="forward()">Next</button>
        </div>`
        document.getElementById("artworks").innerHTML = result;
    }
    else{
        sorted.forEach(artwork => {
            result += `
            <div style="clear: both;">
            <img src=${artwork.Poster} alt=${artwork.Artist} style="width: 30%; margin-right: 20px; float: left;">
                <p>Title: <a href="/artwork/${artwork._id}">${artwork.Title}</a></p>`;
                users.forEach(user => {
                if (user.username === artwork.Artist) {
                    result += `<p> Artist: <a href="/user/${user._id}">${user.username}</a></p>`;
                    return;
                }
                });
                result += `
                <p>Category: ${artwork.Category}</p>
            </div>`;
        });
        result += `
        <div style="text-align: center; float: left; clear: both">
        <button onclick="back()">Previous</button>
        <span> Page ${page} </span>
        <button onclick="forward()">Next</button>
        </div>`
        document.getElementById("artworks").innerHTML = result;
    }
    
}

function back(){
    //Don't go back a page if the page is already page 1
    if(page > 1){
        page--;
        updateArt();
    }
}

function forward(){
    //Max page is the highest page the user should be able to reach
    let maxPage = Math.ceil(art.length / 10);
    if(page < maxPage){
        page++;
        updateArt();
    }
}

function sendSearch(){
    //Set up get request with query info
    let artist = encodeURIComponent(document.getElementById("artist").value);
    let art = encodeURIComponent(document.getElementById("art").value);
    let category = encodeURIComponent(document.getElementById("category").value);
    let combined = `artist=${artist}&title=${art}&category=${category}`;
    let xmlSearch = new XMLHttpRequest();
    xmlSearch.open("GET", `/search?${combined}`, true);
    xmlSearch.onreadystatechange = function () {
        if(this.readyState === 4 && this.status === 200){
            sorted = JSON.parse(this.responseText);
            updateArt();
        }
    }
    xmlSearch.send();

}