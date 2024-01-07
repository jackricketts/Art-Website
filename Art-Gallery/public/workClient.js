let user;
function initWorkshop(currUser){
    //Get current user
    user = currUser;
    //Load event listener
    document.getElementById("submitWork").addEventListener("click", postWork);
}
function postWork(){
    //Grab workshop name
    let workName = document.getElementById("name").value;
    let xmlWork = new XMLHttpRequest();
    //Post it to server
    xmlWork.open("POST", "/workshop", true);
    xmlWork.setRequestHeader("Content-Type", "application/json");
    xmlWork.onreadystatechange = function() {
        if(this.readyState === 4 && this.status === 200){
            alert("Workshop successfully added!");
            window.location.replace(`/user/${user}`);
        }
    }
    xmlWork.send(JSON.stringify({
        name: workName
    }));
}