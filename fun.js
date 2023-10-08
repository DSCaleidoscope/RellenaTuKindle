/**
 * Dale Amor a tu Kindle / Ereader (DATK)
 * 
 * Functions file, created by D. S. Caleidoscope on October, 2023.
 **/
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

//params
var maxRead;
var reloadPage = false;

//move it to false only during event days
var forceRefresh = false;

//helpers & redefines
function g(id){return document.getElementById(id);}
function clear(){g("bbody").innerHTML = '';}
function add(t) { g("bbody").innerHTML += t + '<br />'; }
function reload() { if (reloadPage) { location.replace(".");;}}

//Params
function getParams(){
  //get URL query
  const queryString = window.location.search;
  const urlParams = new URLSearchParams(queryString);
  const mr = urlParams.get('mr');
  const cs = urlParams.get('cs');
  const rl = urlParams.get('rl');
  
  maxRead = 64;
  
  if(mr > 0) {
    maxRead = mr;
  }

  if (cs == 1 || forceRefresh) {
    localStorage.clear();
  }

  //when clicking link it will lead to cs=1, so we will reload page with base URL for next reload
  if (rl == 1) {
    reloadPage = true;
  }
}

//Loading screen
function startLoad() {
  g('mbody').style.backgroundColor = "#80808087";
  g('mainScreen').style.visibility = "hidden";
}

function endLoad() {
  g('mbody').style.backgroundColor = "white";
  g('mainScreen').style.visibility = "initial";
  g('loader').style.visibility = "hidden";
}

function uploadLoad(curr, tot) {
  let width = (curr * 100) / tot;

  g('loading').style.width = "" + width + "%";
  g('msg').innerHTML = "" + width + "%";
}

//AUTHORS
async function parseAuthors(t){
  let authors = JSON.parse(t);
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

  //create methods & push it to the array
  addAuthorMethods(singleAuthor.Auth);
  authorList.push(singleAuthor.Auth);
}

function addAuthorMethods(auth) {
  auth.getID = function () { return this.Id; };
  auth.getAuthorName = function () { return this.AuthorName; };
  auth.getName = function () { return this.Name; };
  auth.getGenres = function () { return this.Genres; };
  auth.getPresentation = function () { return this.Presentation; };
  auth.getProfilePic = function () { return this.ProfilePic; };
  auth.addResumedInfo = function (node) {
    node.innerHTML += " Autor: " + this.getAuthorName();
  }
}

//BOOKS
async function parseBooks(t){
  let books = JSON.parse(t);
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
  
  //create methods & push it to the array
  addBookMethods(singleBook.Book);
  bookList.push(singleBook.Book);
}

function addBookMethods(book) {
  book.authList = [];
  book.getID = function () { return this.Id; };
  book.getTitle = function () { return this.Title; };
  book.getAuthorsID = function () { return this.Authors; };
  book.getGenres = function () { return this.Genres; };
  book.getSynopsis = function () { return this.Synopsis; };
  book.getCover = function () { return this.Cover; };
  book.getNetworks = function () { return this.Networks; };
  book.getASIN = function () { return this.ASIN; };
  book.createNode = function (id) { return document.createElement("div"); }
  book.appendNode = function (node) { g('bbody').appendChild(node); }
  book.addInfo = function (al) {
    let node = this.createNode(this.getID());
    this.addTitleInfo(node);
    this.addAuthorInfo(node, al);
    this.addGenresInfo(node);
    this.addSynopsisInfo(node);
    this.addCoverInfo(node);
    this.addNetworksInfo(node);
    this.addASINInfo(node);
    this.appendNode(node);

    //add("Relations: [" + pri + " / " + bookMax + "]");
  };

  book.addTitleInfo = function (node) {
    node.innerHTML += "Titulo: " + this.getTitle();
  }

  book.addAuthorInfo = function (node, al) {
    let i = 0;
    let auth = this.getAuthorsID();
    let x = auth.length;

    for (; i < x; i++) {
      this.addSingleAuthor(node, auth[i], al);
    }
  };

  book.addSingleAuthor = function (node, auth, al) {
    let i = 0;
    let x = al.length;

    for (; i < x; i++) {
      if (auth == al[i].getID()) {
        this.authList.push(al[i]);
        al[i].addResumedInfo(node);
      }
    }
  };

  book.addGenresInfo = function (node) {
    node.innerHTML += " Generos: " + this.getGenres();
  };
  book.addSynopsisInfo = function (node) {
    node.innerHTML += " Synopsis: " + this.getSynopsis();
  };
  book.addCoverInfo = function (node) {
    node.innerHTML += " Cubierta: " + this.getCover();
  };
  book.addNetworksInfo = function (node) {
    node.innerHTML += " Redes: " + this.getNetworks();
  };
  book.addASINInfo = function (node) {
    node.innerHTML += " ASIN: " + this.getASIN();
  };
}

//LAUNCHER
async function fill(){
  let fList = [];
  clear();

  //check session to pump performance
  let isDone = localStorage.getItem('datk_done');

  if (isDone == 1) {
    //user already loaded the page
    let brList = [];
    let arList = [];
    let ai = 0;
    let bi = 0;
    let ax = 0;
    let bx = 0;

    bookList = JSON.parse(localStorage.getItem('datk_books'));
    authorList = JSON.parse(localStorage.getItem('datk_authors'));

    //restore methods as JSON make them loose
    ax = authorList.length;
    bx = bookList.length;

    for (; ai < ax; ai++) {
      let p = restoreAuthPromise(authorList[ai]);
      arList.push(p);
    }

    for (; bi < bx; bi++) {
      let p = restoreBookPromise(bookList[bi]);
      brList.push(p);
    }

    //await full completion
    await Promise.allSettled(arList);
    await Promise.allSettled(brList);
  } else {
    //new user
    let bp = filePromise("book_master.json").then(
      function (value) { bookMaster = value },
      function (error) { console.log(error); }
    );

    let ap = filePromise("author_master.json").then(
      function (value) { authorMaster = value },
      function (error) { console.log(error); }
    );

    //put promises into array
    fList.push(bp);
    fList.push(ap);

    //await full completion
    await Promise.allSettled(fList);

    //performance (uncomment when needed)
    //add("MaxRead: " + maxRead);

    //start getting real data until all is done
    //we're getting only small chunks each time to avoid network issues
    while (pai < authorMax && pbi < bookMax) {
      //performance (uncomment when needed)
      //let ini = Date.now();

      parseBooks(bookMaster);
      parseAuthors(authorMaster);

      //then wait for authors and books
      await Promise.allSettled(aList);
      await Promise.allSettled(bList);

      //performance (uncomment when needed)
      //add("Time: " + (Date.now() - ini));

      //update loading bar
      uploadLoad((pai + pbi), (authorMax + bookMax));
    }

    //save data into local storage
    localStorage.setItem('datk_books', JSON.stringify(bookList));
    localStorage.setItem('datk_authors', JSON.stringify(authorList));
    localStorage.setItem('datk_done', 1);
  }

  //relate & print
  relate();
  await Promise.allSettled(rList);
  endLoad();
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

//Restorer
let restoreBookPromise = async function (book) {
  let p = new Promise(function (resolve, reject) {
    addBookMethods(book);
    resolve(true);
  });
}

let restoreAuthPromise = async function (auth) {
  let p = new Promise(function (resolve, reject) {
    addAuthorMethods(auth);
    resolve(true);
  });
}