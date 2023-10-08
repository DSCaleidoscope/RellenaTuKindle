/**
 * Rellena tu Kindle / Ereader (RTK)
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

//visuals
var Wcollapsed = false;
var Bcollapsed = [];

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
  g('mbody').style.backgroundColor = "#f3f2ed";
  g('mainScreen').style.visibility = "initial";
  g('loader').style.visibility = "hidden";
}

function uploadLoad(curr, tot) {
  let width = (curr * 100) / tot;

  g('loading').style.width = "" + width + "%";
  g('msg').innerHTML = "" + width + "%";
}

//visuals
function collapseWhat(id) {
  if (Wcollapsed) {
    //it's collapsed, it will expand
    g(id).style.visibility = "initial";
    g(id).style.height = "initial";
    g("whatSection").style.borderBottom = "none";
    g("whatSection").style.borderRadius = "25px 25px 0px 0px";
    Wcollapsed = false;
  } else {
    //it's expanded, let's collapse it
    g(id).style.visibility = "hidden";
    g(id).style.height = "0";
    g("whatSection").style.borderBottom = "3px solid #A7A392";
    g("whatSection").style.borderRadius = "25px 25px 25px 25px";
    Wcollapsed = true;
  }
}

function collapseBook(e) {
  let childs = e.children;
  let i = 1;
  let x = e.childElementCount;

  if (Bcollapsed[e.id] == true) {
    //it's collapsed, it will expand
    e.style.height = "initial";
    Bcollapsed[e.id] = false;

    //show all childs
    for (; i < x; i++) {
      childs[i].style.visibility = "initial";
    }
  } else {
    //it's expanded, let's collapse it
    e.style.height = "26px";
    Bcollapsed[e.id] = true;

    //hide all childs
    for (; i < x; i++) {
      childs[i].style.visibility = "hidden";
    }
  }
  
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
    node.innerHTML += "<div class='author' id=a_" + this.getID() + ">" + this.getAuthorName() + "</div>";
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
  book.stylizeNode = function (node, offset) {
    node.classList.add("book");
    node.setAttribute('id', (parseInt(this.getID()) + offset));
    node.addEventListener("click", function (e) { collapseBook(this); });
  }
  book.appendNode = function (node) {
    //add it to any genre that the book has.
    let genres = this.getGenres();
    let i = 0;
    let x = genres.length;

    for (; i < x; i++) {
      let mnode = g(genres[i]);

      //clonning node so we can attach it several times
      let lnode = node.cloneNode(true);
      this.stylizeNode(lnode, (i * bookMax));

      if (mnode == null) {
        //it's a new genre. Create it!
        let gnode = this.createNode();
        gnode.classList.add("genre");
        gnode.setAttribute('id', genres[i]);
        gnode.innerHTML = genres[i];
        g('bbody').appendChild(gnode);

        //now, fetch it again
        mnode = g(genres[i]);
      }

      mnode.appendChild(lnode);
    }

    //g('bbody').appendChild(node);
  }
  book.addInfo = function (al) {
    let node = this.createNode(this.getID());
    //this.stylizeNode(node, 0);
    this.addTitleInfo(node);
    this.addAuthorInfo(node, al);
    this.addGenresInfo(node);
    this.addSynopsisInfo(node);
    this.addCoverInfo(node);
    this.addNetworksInfo(node);
    this.addASINInfo(node);
    this.appendNode(node);
  };

  book.addTitleInfo = function (node) {
    node.innerHTML += "<div class='title'>" + this.getTitle() + "</div>";
  }

  book.addAuthorInfo = function (node, al) {
    let i = 0;
    let auth = this.getAuthorsID();
    let x = auth.length;

    // local node for authors
    let lnode = this.createNode();
    lnode.classList.add("authors");
    lnode.innerHTML = "	&#10002;&#65039;";

    for (; i < x; i++) {
      this.addSingleAuthor(lnode, auth[i], al);
    }

    //put local node inside book node
    node.appendChild(lnode);
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
    //node.innerHTML += " Generos: " + this.getGenres();
    return;
  };

  book.addSynopsisInfo = function (node) {
    //local node
    let lnode = this.createNode();
    lnode.classList.add("syn");
    lnode.innerHTML = "	&#128209;";
    lnode.innerHTML += "<div class='synopsis'>" + this.getSynopsis() + "</div>";

    //put local node inside book node
    node.appendChild(lnode);
  };

  book.addCoverInfo = function (node) {
    //node.innerHTML += "<div class='cover'>" + this.getCover() + "</div>";
  };

  book.addNetworksInfo = function (node) {
    //node.innerHTML += "<div class='networks'>" + this.getNetworks() + "</div>";
  };

  book.addASINInfo = function (node) {
    node.innerHTML += "<div class='ASIN'><a href='https://www.amazon.com/gp/product/" + this.getASIN() + "' target='_blank'>Descargar en Amazon</a></div>";
  };
}

//LAUNCHER
async function fill(){
  let fList = [];
  clear();

  //check session to pump performance
  let isDone = localStorage.getItem('rtk_done');

  if (isDone == 1) {
    //user already loaded the page
    let brList = [];
    let arList = [];
    let ai = 0;
    let bi = 0;
    let ax = 0;
    let bx = 0;

    bookList = JSON.parse(localStorage.getItem('rtk_books'));
    authorList = JSON.parse(localStorage.getItem('rtk_authors'));
    bookMax = localStorage.getItem('rtk_count');

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
    localStorage.setItem('rtk_books', JSON.stringify(bookList));
    localStorage.setItem('rtk_authors', JSON.stringify(authorList));
    localStorage.setItem('rtk_count', bookMax);
    localStorage.setItem('rtk_done', 1);
  }

  //relate & print
  relate();
  await Promise.allSettled(rList);

  //collapse all books
  let genres = document.getElementsByClassName("genre");
  let i = 0;
  let x = genres.length;

  for (; i < x; i++) {
    //for each genre, collapse each book
    let children = genres[i].children;
    let chCount = genres[i].childElementCount;
    let j = 0;

    for (; j < chCount; j++) {
      collapseBook(children[j]);
    }
  }

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