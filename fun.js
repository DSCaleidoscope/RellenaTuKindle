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
  readTextFile(k);
  setTimeout("parse(allText)", 1000);
}

function addElements(){
  let i = 0;
  let x = branches.Branch.length;

  for(;i < x;i++){
    add(branches.Branch[i].getDiv());
  }
}

function readTextFile(file){
  var rawFile = new XMLHttpRequest();
  allText = "";
  var n = 0;

  stp = 0;

  rawFile.open("GET", file, true);
  rawFile.onreadystatechange = function (){
    if(rawFile.readyState === 4){
      if(rawFile.status === 200 || rawFile.status == 0){
        allText = rawFile.responseText;
        stp = 1;
      }
    }
  }

  rawFile.send(null);

  return null;
}
