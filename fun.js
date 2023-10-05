//global variables
var authorList = [];
var bookList = [];
var authorsDone = false;
var booksDone = false;

//helpers & redefines
function g(id){return document.getElementById(id);}
function clear(){g("bbody").innerHTML = '';}
function add(t){g("bbody").innerHTML += t;}
function parse(t){console.log(JSON.parse(t));}

//AUTHORS
function parseAuthors(t){
  let authors = JSON.parse(t);
  console.log(authors);

  let i = 0;
  let x = authors.Author.length;

  for(;i < x;i++){
    filePromise("author_" + authors.Author[i].id_author + ".json").then(
      function(value) {parseSingleAuthor(value);},
      function(error) {console.log(error);}
    );
  }

  authorsDone = true;
}

function parseSingleAuthor(t){
  let singleAuthor = JSON.parse(t);
  console.log(singleAuthor);
  authorList.push(singleAuthor);
}

//BOOKS
function parseBooks(t){
  let books = JSON.parse(t);
  console.log(books);

  let i = 0;
  let x = books.Book.length;

  for(;i < x;i++){
    filePromise("book_" + books.Book[i].id_book + ".json").then(
      function(value) {parseSingleBook(value);},
      function(error) {console.log(error);}
    );
  }

  booksDone = true;
}

function parseSingleBook(t){
  let singleBook = JSON.parse(t);
  console.log(singleBook);
  bookList.push(singleBook);
}

//LAUNCHER
function fill(){
  clear();

  filePromise("book_master.json").then(
    function(value) {parseBooks(value);},
    function(error) {console.log(error);}
  );
  
  filePromise("author_master.json").then(
    function(value) {parseAuthors(value);},
    function(error) {console.log(error);}
  );

  //wait until done
  while(authorsDone == false && booksDone == false){
    if(authorsDone){console.log("All authors");}
    if(booksDone){console.log("All books");}
  }
  
  console.log("All done!);
}

let filePromise = function(file) {
  return new Promise(function(resolve, reject) {
    let req = new XMLHttpRequest();
    req.open('GET', file);
    req.onload = function() {
      if (req.status == 200) {
        resolve(req.response);
      } else {
        reject("File " + file + " not Found");
      }
    };
    
    req.send();
  })
};
