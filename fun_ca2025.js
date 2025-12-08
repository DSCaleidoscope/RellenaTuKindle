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

//locale
var tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
var tz2;
tz = tz.split("/");
tz2 = tz[1];
tz = tz[0];

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
var multi = false;

//visuals
var Wcollapsed = false;
var Bcollapsed = [];

//Config
var forceRefresh = true; //During the event, move it to false to avoid forcing refresh!
var eventDate = "evento";
var isEventWaiting = true; //Move it to false to show links to Amazon
var tracking = false; //Move it to false to avoid calling tracking function

//helpers & redefines
function g(id) { return document.getElementById(id); }
function clear() {
  if (multi) {
    g("bbody11").innerHTML = ''; g("bbody21").innerHTML = '';
    g("bbody12").innerHTML = ''; g("bbody22").innerHTML = '';
    g("bbody13").innerHTML = ''; g("bbody23").innerHTML = '';
  } else {
    g("bbody11").innerHTML = ''; g("bbody21").innerHTML = '';
  }
}

function reload() { if (reloadPage) { location.replace(".");; } }
function setMulti() { multi = true; }

//Register
function sendReg() { return;/*g('fsub').submit();*/ /*form is closed*/ }

//Params
function getParams() {
  //get URL query
  const queryString = window.location.search;
  const urlParams = new URLSearchParams(queryString);
  const mr = urlParams.get('mr');
  const cs = urlParams.get('cs');
  const rl = urlParams.get('rl');

  maxRead = 64;

  if (mr > 0) {
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

//BOOKS - INI
async function parseBooks(t) {
  let books = JSON.parse(t);

  let i = 0;

  for (; i < maxRead; i++) {
    if (pbi < bookMax) {
      if (books.Book[pbi].participate == "Y") {
        //only add if participate
        let p = filePromise("/data/book_" + books.Book[pbi].id_book + ".json").then(
          function (value) { parseSingleBook(value); },
          function (error) { console.log(error); }
        );

        bList.push(p);
      }

      pbi++;
    } else {
      //force quit
      i = maxRead + 1;
    }
  }
}

function parseSingleBook(t) {
  let singleBook = JSON.parse(t);

  //create methods & push it to the array
  addBookMethods(singleBook.Book);
  bookList.push(singleBook.Book);
}

function addBookMethods(book) {
  book.authList = [];
  book.size = "._SY425_."; //Don't blame me! I didn't made this codes. Blame Amazon.
  book.getID = function () { return this.Id; };
  book.getTitle = function () { return this.Title; };
  book.getAuthorsID = function () { return this.Authors; };
  book.getGenres = function () { return this.Genres; };
  book.getSynopsis = function () { return this.Synopsis; };
  book.getCover = function () { return this.Cover; };
  book.getSize = function () { return this.size; };
  book.getNetworks = function () { return this.Networks; };
  book.getASIN = function () { return this.ASIN; };
  book.createNode = function () { return document.createElement("div"); }
  book.stylizeNode = function (node, offset) {
    node.classList.add("book");
    node.setAttribute('id', (parseInt(this.getID()) + offset));
    node.addEventListener("click", function (e) { collapseBook(this); });
  };

  book.appendNode = function (node, parent) {
    parent.appendChild(node);
  };

  book.addInfo = function (al, i) {
    let node1 = this.createNode();
    let node2 = this.createNode();
    this.addCoverInfo(node1);
    this.addCoverInfo(node2);
    this.appendNode(node1, g('bbody1' + (i + 1)));
    this.appendNode(node2, g('bbody2' + (i + 1)));
  };

  book.addTitleInfo = function (node) {
    node.innerHTML += "<div class='title'>" + this.getTitle() + "</div>";
  };

  book.addCoverInfo = function (node) {
    if (this.getCover() == "") { }
    else {
      //node.innerHTML += "<img src='./data/" + this.getCover() + "' width='150px' />";
      node.innerHTML += "<a href='" + getAmazonLink(tz, this.getASIN()) + "' target='_blank'><img src='" + this.getImgSrc() + "' width='150px' /></a>";
      //node.innerHTML += "<img src='./img/placeholder.png' width='150px' />";

    }
  };

  book.getImgSrc = function () {
    return "https://m.media-amazon.com/images/I/" + this.getCover() + this.getSize() + "jpg";
  }
}

function getAmazonLink(tz, ASIN) {
  if (tz == "Europe") {
    return "https://amazon.es/dp/" + ASIN;
  }

  if (tz2 == "Canary") {
    return "https://amazon.es/dp/" + ASIN;
  }

  return "https://amazon.com/dp/" + ASIN;
}
//BOOKS - END

//LAUNCHER
async function fill() {
  let fList = [];
  clear();

  let currDate = new Date(Date.now());
  let cd = currDate.getDate();
  let cm = currDate.getMonth();
  let bp = null;



  if (cd == 25) {
    //on 25th, we're using regular page
    window.location.href = "index.html";
  }

  if (cm == 11) {
    //only loading on december!
    bp = filePromise("/data/book_ca" + cd + ".json").then(
      function (value) { bookMaster = value },
      function (error) { console.log(error); }
    );
  } else {
    //no spoilers!
    window.location.href = "index.html";
  }

  //put promises into array
  fList.push(bp);

  //await full completion
  await Promise.allSettled(fList);

  //start getting real data until all is done
  //we're getting only small chunks each time to avoid network issues

  //Counting items before entering loop
  let books = JSON.parse(bookMaster);

  bookMax = books.Book.length;

  if (bookMax > 1 && window.location.href.split("/")[3].split("?")[0] == "adviento2025.html") {
    window.location.href = "adviento2025_.html";
  }

  if (bookMax == 1 && window.location.href.split("/")[3].split("?")[0] == "adviento2025_.html") {
    window.location.href = "adviento2025.html";
  }

  while (pbi < bookMax) {
    parseBooks(bookMaster);

    //then wait for authors and books
    await Promise.allSettled(bList);

    //uploadLoad(pbi, bookMax);
  }

  //relate & print
  relate();
  await Promise.allSettled(rList);
}

//This function relates and prints books & authors
async function relate() {
  let i = 0;
  let x = bookList.length;

  for (; i < x; i++) {
    let p = printPromise(bookList[i], authorList, i).then(
      function (value) {/*nothing to do, it's all OK*/ },
      function (error) { console.log(error); }
    );

    rList.push(p);
  }

  //await full completion
  const results = await Promise.allSettled(rList);
}

//File Reader
let filePromise = async function (file) {
  let p = new Promise(function (resolve, reject) {
    let req = new XMLHttpRequest();

    req.open('GET', file);
    req.onload = function () {
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
let printPromise = async function (book, authroList, i) {
  let p = new Promise(function (resolve, reject) {
    book.addInfo(authorList, i);
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
