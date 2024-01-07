function initArtwork(){
    //Load event listener
    document.getElementById("submitArt").addEventListener("click", postArt);
}

function postArt(){
    //Get all necessary art info
    let title = document.getElementById("title").value;
    let year = document.getElementById("year").value;
    let category = document.getElementById("category").value;
    let medium = document.getElementById("medium").value;
    let description = document.getElementById("description").value;
    let poster = document.getElementById("poster").value;
    //Validate year
    if(isNaN(Number(year))){
        alert("Invalid year!");
        document.getElementById("title").value = '';
        document.getElementById("year").value = '';
        document.getElementById("category").value = '';
        document.getElementById("medium").value = '';
        document.getElementById("description").value = '';
        document.getElementById("poster").value = '';
    }
    else{
        //Set up post request
        let xmlArt = new XMLHttpRequest();
        xmlArt.open("POST", "/artwork", true);
        xmlArt.setRequestHeader("Content-Type", "application/json");
        xmlArt.onreadystatechange = function () {
            if(this.readyState === 4 && this.status === 200){
                alert("Art added successfully!");
                window.location.replace("/");
            }
            else if(this.status === 400){
                alert("Art already exists, please enter new art with a different name")
                document.getElementById("title").value = '';
                document.getElementById("year").value = '';
                document.getElementById("category").value = '';
                document.getElementById("medium").value = '';
                document.getElementById("description").value = '';
                document.getElementById("poster").value = '';
            }
        }
        //Send object
        xmlArt.send(JSON.stringify({
            title: title,
            year: year,
            category: category,
            medium: medium,
            description: description,
            poster: poster
        }))
    }
}