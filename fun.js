function g(id){return document.getElementById(id);}
function clear(){g("bbody").innerHTML = '';}
function add(t){g("bbody").innerHTML += t;}
function parse(t){let branches = JSON.parse(t);console.log(branches);}

function parseAuthors(t){
  let authors = JSON.parse(t);

  let i = 0;
  let x = authors.Author.length;

  for(;i < x;i++){
    console.log("author[" + i + "]: " + authors.Author[i]);
    filePromise("author_" + authors.Author[i].id_author + ".json").then(
      function(value) {parse(value);parseSingleAuthor(value)},
      function(error) {console.log(error);}
    );
  }

  console.log(authors);
}

function parseSingleAuthor(t){
  let singleAuthor = JSON.parse(t);
  console.log(singleAuthor);
}

function fill(){
  clear();
  filePromise("book_master.json").then(
    function(value) {parse(value);},
    function(error) {console.log(error);}
  );
  
  filePromise("author_master.json").then(
    function(value) {parse(value);parseAuthors(value)},
    function(error) {console.log(error);}
  );
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
        reject("File " + file + "not Found");
      }
    };
    
    req.send();
  })
 // ;
};
