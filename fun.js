//global variables
var authorList = [];
var bookList = [];

//promises
var aList = [];
var bList = [];

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

    aList.push(p);
  }

  //await full completion
  const results = await Promise.allSettled(aList);
  console.log("aList: " + results);
}

function parseSingleAuthor(t){
  let singleAuthor = JSON.parse(t);

  //create methods
  singleAuthor.Auth.getID = function(){return this.Id};
  singleAuthor.Auth.getAuthorName = function(){return this.AuthorName};
  singleAuthor.Auth.getName = function(){return this.Name};
  singleAuthor.Auth.getGenres = function(){return this.Genres};
  singleAuthor.Auth.getPresentation = function(){return this.Presentation};
  singleAuthor.Auth.getProfilePic = function(){return this.ProfilePic};
  
  console.log(singleAuthor.Auth);
  authorList.push(singleAuthor.Auth);
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

    bList.push(p);
  }

  //await full completion
  const results = await Promise.allSettled(bList);
  console.log("bList: " + results);
}

function parseSingleBook(t){
  let singleBook = JSON.parse(t);
  
  //create methods
  singleBook.Book.getAuthorsID = function(){return this.Authors};
  singleBook.Book.getGenres = function(){return this.Genres};
  singleBook.Book.getSinopsis = function(){return this.Sinopsis};
  singleBook.Book.getCubierta = function(){return this.Cubierta};
  singleBook.Book.getRedes = function(){return this.Redes};
  singleBook.Book.getASIN = function(){return this.ASIN};

  console.log(singleBook.Book);
  bookList.push(singleBook.Book);
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
  await Promise.allSettled(fList);

  //then wait for authors and books
  await Promise.allSettled(aList);
  await Promise.allSettled(bList);

  console.log("Add loaded!");
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
