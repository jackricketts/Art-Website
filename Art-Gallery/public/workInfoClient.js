let uid;
let wid;
function initEnroll(userID, workID, enrolled){
    //Check if the user is enrolled
    if(!enrolled){
        uid = userID;
        wid = workID;
        //Load event listener
        document.getElementById("submitEnroll").addEventListener("click", sendEnroll);
    }
}

function sendEnroll(){
    //Set up get request
    let xmlEnroll = new XMLHttpRequest();
    xmlEnroll.open("GET", `/enroll/${uid}/${wid}`, true);
    xmlEnroll.onreadystatechange = function () {
        if(this.readyState === 4 && this.status === 200){
            alert("Successfully enrolled!");
            window.location.reload();
        }
    }
    xmlEnroll.send();
}