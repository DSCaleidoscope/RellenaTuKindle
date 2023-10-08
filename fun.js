//global variables
var authorMaster;
var bookMaster;
var authorMax = 1;
var bookMax = 1;
var authorList = [];
var bookList = [];

//promises
var aList = [];
var bList = [];
var rList = [];

//reader help
var pai = 0;
var pbi = 0;
var pri = 0;

//Params
var maxRead;

//helpers & redefines
function g(id){return document.getElementById(id);}
function clear(){g("bbody").innerHTML = '';}
function add(t){g("bbody").innerHTML += t + '<br />';}

//Params
function getParams(){
  //get URL query
  const queryString = window.location.search;
  const urlParams = new URLSearchParams(queryString);
  const mr = urlParams.get('mr');
  
  maxRead = 64;
  
  if(mr > 0) {
    maxRead = mr;
  }
  
  //console.log("MaxRead: " + maxRead);
}

//AUTHORS
async function parseAuthors(t){
  let authors = JSON.parse(t);
  //console.log(authors);
  authorMax = authors.Author.length;
  
  let i = 0;

  for(;i < maxRead;i++){
    let p = filePromise("author_" + authors.Author[pai].id_author + ".json").then(
      function(value) {parseSingleAuthor(value);},
      function(error) {console.log(error);}
    );
    
    pai++

    aList.push(p);
  }
}

function parseSingleAuthor(t){
  let singleAuthor = JSON.parse(t);

  //create methods
  singleAuthor.Auth.getID = function(){return this.Id;};
  singleAuthor.Auth.getAuthorName = function(){return this.AuthorName;};
  singleAuthor.Auth.getName = function(){return this.Name;};
  singleAuthor.Auth.getGenres = function(){return this.Genres;};
  singleAuthor.Auth.getPresentation = function(){return this.Presentation;};
  singleAuthor.Auth.getProfilePic = function(){return this.ProfilePic;};
  singleAuthor.Auth.addResumedInfo = function(node){
    node.innerHTML += " Autor: " + this.getAuthorName();
  }
  
  //console.log(singleAuthor.Auth);
  authorList.push(singleAuthor.Auth);
}

//BOOKS
async function parseBooks(t){
  let books = JSON.parse(t);
  //console.log(books);
  bookMax = books.Book.length;
  
  let i = 0;
  
  for(;i < maxRead;i++){
    let p = filePromise("book_" + books.Book[pbi].id_book + ".json").then(
      function(value) {parseSingleBook(value);},
      function(error) {console.log(error);}
    );
    
    pbi++;

    bList.push(p);
  }
}

function parseSingleBook(t){
  let singleBook = JSON.parse(t);
  
  //create methods
  singleBook.Book.authList = [];
  singleBook.Book.getID = function(){return this.Id;};
  singleBook.Book.getTitle = function(){return this.Title;};
  singleBook.Book.getAuthorsID = function(){return this.Authors;};
  singleBook.Book.getGenres = function(){return this.Genres;};
  singleBook.Book.getSynopsis = function(){return this.Synopsis;};
  singleBook.Book.getCover = function(){return this.Cover;};
  singleBook.Book.getNetworks = function(){return this.Networks;};
  singleBook.Book.getASIN = function(){return this.ASIN;};
  singleBook.Book.createNode = function(id){return document.createElement("div");}
  singleBook.Book.appendNode = function(node){g('bbody').appendChild(node);}
  singleBook.Book.addInfo = function(al){
    let node = this.createNode(this.getID());
    this.addTitleInfo(node);
    this.addAuthorInfo(node, al);
    this.addGenresInfo(node);
    this.addSynopsisInfo(node);
    this.addCoverInfo(node);
    this.addNetworksInfo(node);
    this.addASINInfo(node);
    this.appendNode(node);

    //console.log(this.authList);
    //add("Relations: [" + pri + " / " + bookMax + "]");
  };

  singleBook.Book.addTitleInfo = function(node){
    node.innerHTML += "Titulo: " + this.getTitle();
  }
  
  singleBook.Book.addAuthorInfo = function(node, al){
    let i = 0;
    let auth = this.getAuthorsID(); 
    let x = auth.length;

    for(;i < x;i++){
      this.addSingleAuthor(node, auth[i], al);
    }
  };

  singleBook.Book.addSingleAuthor = function (node, auth, al){
    let i = 0;
    let x = al.length;

    for(;i < x;i++){
      if(auth == al[i].getID()){
        this.authList.push(al[i]);
        al[i].addResumedInfo(node);
      }
    }
  };

  singleBook.Book.addGenresInfo = function(node){
    node.innerHTML += " Generos: " + this.getGenres();
  };
  singleBook.Book.addSynopsisInfo = function(node){
    node.innerHTML += " Synopsis: " + this.getSynopsis();
  };
  singleBook.Book.addCoverInfo = function(node){
    node.innerHTML += " Cubierta: " + this.getCover();
  };
  singleBook.Book.addNetworksInfo = function(node){
    node.innerHTML += " Redes: " + this.getNetworks();
  };
  singleBook.Book.addASINInfo = function(node){
    node.innerHTML += " ASIN: " + this.getASIN();
  };

  //console.log(singleBook.Book);
  bookList.push(singleBook.Book);
}

//LAUNCHER
async function fill(){
  let fList = [];
  clear();

  let bp = filePromise("book_master.json").then(
    function(value) {bookMaster = value},
    function(error) {console.log(error);}
  );

  let ap = filePromise("author_master.json").then(
    function(value) {authorMaster = value},
    function(error) {console.log(error);}
  );

  //put promises into array
  fList.push(bp);
  fList.push(ap);

  //await full completion
  await Promise.allSettled(fList);
  
  /*
  console.log("Master data read!");
  console.log("Records to be read: ");
  console.log("  Authros: " + authorMax);
  console.log("  Books: " + bookMax);
  console.log("  Relations: " + bookMax);
  */
  
  add("MaxRead: " + maxRead);
  
  //start getting real data until all is done
  //we're getting only small chunks each time to avoid network issues
  while(pai < authorMax && pbi < bookMax) {
    //performance
    let ini = Date.now();
    
    parseBooks(bookMaster);
    parseAuthors(authorMaster);

    //then wait for authors and books
    await Promise.allSettled(aList);
    await Promise.allSettled(bList);
    
    //add("Books: [" + pbi + " / " + bookMax + "]"); 
    //add("Authors: [" + pai + " / " + authorMax + "]");
    add("Time: " + (Date.now() - ini));
  }

  /*
  console.log("Add loaded!");
  console.log("authors: " + authorList);
  console.log("books: " + bookList);
  */

  //relate & print
  relate();
  await Promise.allSettled(rList);
}

//This function relates and prints books & authors
async function relate(){
  let i = 0;
  let x = bookList.length;

  for(;i < x;i++){
    let p = printPromise(bookList[i], authorList).then(
      function(value) {/*nothing to do, it's all OK*/},
      function(error) {console.log(error);}
    );

    rList.push(p);
  }

  //await full completion
  const results = await Promise.allSettled(rList);
  //console.log("bList: " + results);
}

//File Reader
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

//Printer
let printPromise = async function(book, authroList) {
  let p = new Promise(function(resolve, reject) {
    book.addInfo(authorList);
    resolve(true);
  });

  return p;
};
