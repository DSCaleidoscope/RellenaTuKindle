//global variables
var authorList = [];
var bookList = [];

//helpers & redefines
function g(id){return document.getElementById(id);}
function clear(){g("bbody").innerHTML = '';}
function add(t){g("bbody").innerHTML += t;}
function parse(t){console.log(JSON.parse(t));}

//AUTHORS
async function parseAuthors(t){
  let pList = [];
  let authors = JSON.parse(t);
  console.log(authors);

  let i = 0;
  let x = authors.Author.length;

  for(;i < x;i++){
    let p = filePromise("author_" + authors.Author[i].id_author + ".json").then(
      function(value) {parseSingleAuthor(value);},
      function(error) {console.log(error);}
    );

    pList.push(p);
  }

  //await full completion
  const results = await Promise.allSettled(pList);
  console.log("aList: " + results);
}

function parseSingleAuthor(t){
  let singleAuthor = JSON.parse(t);
  console.log(singleAuthor);
  authorList.push(singleAuthor);
}

//BOOKS
async function parseBooks(t){
  let pList = [];
  let books = JSON.parse(t);
  console.log(books);

  let i = 0;
  let x = books.Book.length;

  for(;i < x;i++){
    let p = filePromise("book_" + books.Book[i].id_book + ".json").then(
      function(value) {parseSingleBook(value);},
      function(error) {console.log(error);}
    );

    pList.push(p);
  }

  //await full completion
  const results = await Promise.allSettled(pList);
  console.log("bList: " + results);
}

function parseSingleBook(t){
  let singleBook = JSON.parse(t);
  console.log(singleBook);
  bookList.push(singleBook);
}

//LAUNCHER
async function fill(){
  let fList = [];
  clear();

  let bp = filePromise("book_master.json").then(
    function(value) {parseBooks(value);},
    function(error) {console.log(error);}
  );

  let ap = filePromise("author_master.json").then(
    function(value) {parseAuthors(value);},
    function(error) {console.log(error);}
  );

  //put promises into array
  fList.push(bp);
  fList.push(ap);

  //await full completion
  const results = await Promise.allSettled(fList);
  console.log("fList: " + results);
  console.log("authors: " + authorList);
  console.log("books: " + bookList);
}

let filePromise = async function(file) {
  let p = new Promise(function(resolve, reject) {
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
  });

  return p;
};
