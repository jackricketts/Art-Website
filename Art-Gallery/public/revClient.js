let artID;
function initReview(id){
    //Get artwork id
    artID = id;
    //Load event listener
    document.getElementById("submitReview").addEventListener("click", postReview);
}

function postReview(){
    //Get the review
    let review = document.getElementById("review").value;
    //Post it to the server
    let xmlReview = new XMLHttpRequest();
    xmlReview.open("POST", `/review/${artID}`, true);
    xmlReview.setRequestHeader("Content-Type", "application/json");
    xmlReview.onreadystatechange = function () {
        if(this.readyState === 4 && this.status === 200){
            alert("Review successfully added!");
            window.location.replace(`/reviews/${artID}`);
        }
    }
    xmlReview.send(JSON.stringify({
        review: review
    }));
}