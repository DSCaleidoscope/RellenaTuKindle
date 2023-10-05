function g(id){return document.getElementById(id);}
function clear(){g("bbody").innerHTML = '';}
function add(t){g("bbody").innerHTML += t;}
function parse(t){
  branches = JSON.parse(t);

  //add methods
  let i = 0;
  let x = branches.Branch.length;

  for(;i < x;i++){
    branches.Branch[i].getURL = function(){
      if(this.type === "email"){
        return "'mailto:" + this.value + "'";
      }

      return "'" + this.value + "'";
    };
    
    branches.Branch[i].getContent = function(){
       console.log(this.type);
       return this.title;
    };

    branches.Branch[i].getDiv = function(){
      return "<div id='" + this.title + "' class='branch'><div class='title' onclick=\"window.open("+ this.getURL() + ")\">" + this.getContent() + "</div></div>";
    };
  }

  console.log(branches);
  addElements();
}

function fill(k){
  clear();
  filePromise(k).then(
    function(value) {console.log("!!: " + value); parse(value);},
    function(error) {console.log(error);}
  );
  //readTextFile(k);
  //setTimeout("parse(allText)", 1000);
}

function addElements(){
  let i = 0;
  let x = branches.Branch.length;

  for(;i < x;i++){
    add(branches.Branch[i].getDiv());
  }
}

let filePromise = function(file) {
  return new Promise(function(resolve, reject) {
//  let filePromise = new Promise(function(resolve, reject) {
    let req = new XMLHttpRequest();
    req.open('GET', file);
    req.onload = function() {
      if (req.status == 200) {
        resolve(req.response);
      } else {
        reject("File not Found");
      }
    };
    
    req.send();
  })
 // ;
};
