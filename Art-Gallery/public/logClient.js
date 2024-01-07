function initLogin(){
    document.getElementById("submitLog").addEventListener("click", postLog);
}

function postLog(){
    let username = document.getElementById("username").value;
    let password = document.getElementById("password").value;
    let xmlLogin = new XMLHttpRequest();
    let alreadyAlerted = false;
    xmlLogin.open("POST", "/login", true);
    xmlLogin.setRequestHeader('Content-Type', 'application/json');
    xmlLogin.onreadystatechange = function() {
        if(this.readyState === 4 && this.status === 200 && !alreadyAlerted){
            alert("Login successful!");
            window.location.replace("/");
        }
        else if(this.status === 400 && !alreadyAlerted){
            alert("Invalid username or password!");
            alreadyAlerted = true;
            document.getElementById("username").value = "";
            document.getElementById("password").value = "";
        }
        else if(this.status === 401 && !alreadyAlerted){
            alert("Cannot log in on two different tabs!");
            alreadyAlerted = true;
            document.getElementById("username").value = "";
            document.getElementById("password").value = "";
        }
    }
    xmlLogin.send(JSON.stringify({
        "username": username,
        "password": password
    }));
}