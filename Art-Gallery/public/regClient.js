function initRegister(){
    //Load the event listener
    document.getElementById("submitReg").addEventListener("click", postReg);
}

function postReg(){
    //Grab name and password and age
    let username = document.getElementById("username").value;
    let password = document.getElementById("password").value;
    let age = document.getElementById("age").value
    //Validate age
    if(isNaN(Number(age))){
        alert("Age must be a number!");
        document.getElementById("username").value = "";
        document.getElementById("password").value = "";
        document.getElementById("age").value = "";
    }
    else{
        //Open post request
        let xmlRegister = new XMLHttpRequest();
        let alreadyAlerted = false;
        xmlRegister.open("POST", "/register", true);
        xmlRegister.setRequestHeader('Content-Type', 'application/json');
        xmlRegister.onreadystatechange = function() {
            if(this.readyState === 4 && this.status === 200 && !alreadyAlerted){
                alert("Registration successful!");
                window.location.replace("/");
            }
            else if(this.status === 400 && !alreadyAlerted){
                alert("User already exists!");
                alreadyAlerted = true;
                document.getElementById("username").value = "";
                document.getElementById("password").value = "";
            }
        }
        xmlRegister.send(JSON.stringify({
            "username": username,
            "password": password
        }));
    }
}