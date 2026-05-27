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

//visuals
var Wcollapsed = false;
var Bcollapsed = [];

//Config
var forceRefresh = true; //During the event, move it to false to avoid forcing refresh!
var eventDate = "evento";
var isEventWaiting = true; //Move it to false to show links to platforms
var tracking = false; //Move it to false to avoid calling tracking function

//Register vars
var regType = "az";
let res;
let searched = false;

//helpers & redefines
function g(id){return document.getElementById(id);}
function clear(){g("bbody").innerHTML = '';}
function add(t) { g("bbody").innerHTML += t + '<br />'; }
function reload() { if (reloadPage) { location.replace(".");; } }
function setSource(source) { regType = source; updateSource(); }
function updateSource() { if (regType == 'az') { g('BASE').value = 'AMAZON'; } else if (regType == 'bb') { g('BASE').value = 'BUBOK'; } else if (regType == 'wp') { g('BASE').value = 'PAGINA WEB'; } else if (regType == 'kb') { g('BASE').value = 'KOBO'; } else if (regType == 'gb') { g('BASE').value = 'GOOGLE BOOKS'; } }

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


//Loading screen - INI
function startLoad() {
  g('mbody').style.backgroundColor = "#80808087";
  g('mainScreen').style.visibility = "hidden";
}

function endLoad() {
  autocloseLoad();
}

function closeLoad() {
  g('mbody').style.backgroundColor = "#f3f2ed";
  g('mainScreen').style.visibility = "initial";
  g('loader').style.visibility = "hidden";
}

function autocloseLoad() {
  setTimeout(() => {closeLoad()}, 3000);}
//Loading screen - END

//visuals - INI
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
  let defHeight = 26;
  let finalHeight = 0;

  //searching for title node
  let si = 0;

  for (; si < x; si++) {
    if (childs[si].className == "title") {
      defHeight = childs[si].clientHeight;
    }

    finalHeight += childs[si].clientHeight;
  }

  if (Bcollapsed[e.id] == true) {
    //it's collapsed, it will expand
    Bcollapsed[e.id] = false;

    //show all childs
    for (; i < x; i++) {
      childs[i].style.visibility = "initial";
      childs[i].style.height = "initial";

      //Don't show synopsis if we're short on space
      if (childs[i].className == "syn" && document.documentElement.clientWidth <= '430') { 
        //mobile!
        finalHeight -= childs[i].clientHeight;
        childs[i].style.visibility = "hidden";
        childs[i].style.height = "0px";
      }

      if (childs[i].nodeName == "IMG") {
        //loading real image!
        let src = childs[i].src.split("/");

        if (src[src.length - 1] == "placeholder.png") {
          childs[i].src = getImgSrcByBookId(e.id);
        }
      }
    }

    //adding 40px because of padding
    e.style.height = (finalHeight + 40) + "px";
  } else {
    //it's expanded, let's collapse it
    e.style.height = defHeight + "px";
    Bcollapsed[e.id] = true;

    //hide all childs
    for (; i < x; i++) {
      childs[i].style.visibility = "hidden";
      childs[i].style.height = "initial";
    }
  } 
}

function getImgSrcByBookId(id) {
  let gis = 0;

  for (; gis < bookList.length; gis++) {
    if (bookList[gis].Id == id) {
      return bookList[gis].getImgSrc(bookList[gis].getBases()[0]);
    }
  }

  return "";
}
//visuals - END

//listing
function getAll() {
  let i = 0;
  let x = bookList.length;
  let n = [];

  n.push("[{");

  for (; i < x; i++) {
    n.push("\"book\":");
    n.push(JSON.stringify(bookList[i]));
    n.push("},{");
  }

  n[n.length - 1] = "}]";

  dlfr = new FileReader();

  dlfr.onload = function (event) {
    dlfs = document.createElement('a');
    dlfs.href = event.target.result;
    dlfs.target = '_blank';
    dlfs.download = 'allData.txt';
    dlfc = new MouseEvent('click', { 'view': window, 'bubbles': true, 'cancelable': true });
    dlfs.dispatchEvent(dlfc);
    (window.URL || window.webkitURL).revokeObjectURL(dlfs.href)
  };

  dlfr.readAsDataURL(new Blob(n, { type: 'application/json'}));
}

//AUTHORS - INI
async function parseAuthors(t){
  let authors = JSON.parse(t);
  
  let i = 0;

  for (; i < maxRead; i++){
    if (pai < authorMax) {
      let p = filePromise("data/author_" + authors.Author[pai].id_author + ".json").then(
        function (value) { parseSingleAuthor(value); },
        function (error) { console.log(error); }
      );

      aList.push(p);

      pai++
    } else {
      //force quit
      i = maxRead + 1;
    }
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
    node.innerHTML += "<div class='author' id=a_" + this.getID() + ">" + this.getAuthorName() + this.getNetworks() + "</div>";
  }

  auth.getNetworks = function () { 
    let gni = 0;
    let gnr = "";

    //try/catch to be removed once every auth has networks node
    try {
      for (gni = 0; gni < this.Networks.length; gni++) {
        if (this.Networks[gni].type == "INSTAGRAM") {
          gnr += "<a href='https://www.instagram.com/" + this.Networks[gni].user + "' target='_blank'><img src='./img/ig_logo.png' style='position: relative;top: 7px;width: 25px;margin-left: 12px;'/></a>";
        } else if (this.Networks[gni].type == "TIKTOK") {
          gnr += "<a href='https://www.tiktok.com/@" + this.Networks[gni].user + "' target='_blank'><img src='./img/tt_logo.png' style='position: relative;top: 6px;width: 20px;margin-left: 12px;'/></a>";
        } else if (this.Networks[gni].type == "OTHER") {
          gnr += "<a href='" + this.Networks[gni].user + "' target='_blank'><img src='./img/web_logo.png' style='position: relative;top: 6px;width: 23px;margin-left: 12px;'/></a>";
        }
      }
    } catch (e) { }

    return gnr;
  }
}
//AUTHORS - END

//BOOKS - INI
async function parseBooks(t){
  let books = JSON.parse(t);
  
  let i = 0;
  
  for (; i < maxRead; i++){
    if (pbi < bookMax) {
      if (books.Book[pbi].participate == "Y") {
        //only add if participate
        let p = filePromise("data/book_" + books.Book[pbi].id_book + ".json").then(
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

function parseSingleBook(t){
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
  book.getBases = function () { return this.Bases; };
  book.getBase = function (base) { return base.Base; };
  book.getASIN = function (base) { return base.ASIN; };
  book.createNode = function (id) { return document.createElement("div"); }
  book.stylizeNode = function (node, offset) {
    node.classList.add("book");
    node.setAttribute('id', (parseInt(this.getID()) + offset));
    node.addEventListener("click", function (e) { collapseBook(this); });
  };

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
        gnode.innerHTML = '<a id="' + genres[i] + '">' + genres[i].charAt(0).toUpperCase() + genres[i].slice(1).toLowerCase() + '</a> | <a href="#gList">&#128285;</a>';
        g('bbody').appendChild(gnode);

        //now, fetch it again
        mnode = g(genres[i]);

        //after create it, add it to the list
        g('genresContent').innerHTML += '<a href="#' + genres[i] +'">' + genres[i].charAt(0).toUpperCase() + genres[i].slice(1).toLowerCase() + '</a> | ';
      }

      mnode.appendChild(lnode);
    }
  };

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
  };

  book.addTitleInfo = function (node) {
    node.innerHTML += "<div class='title'>" + this.getTitle() + "</div>";
  };

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

  book.addGenresInfo = function (node) {return;};

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
    if (this.getCover() == "") { }
    else {
      node.innerHTML += "<img src='./img/placeholder.png' width='150px' />";
      
    }
  };

  book.getImgSrc = function (base) {
    if (this.getBase(base) == "AMAZON") {
      return "https://i.gr-assets.com/images/S/compressed.photo.goodreads.com" + this.getCover() + this.getSize() + "jpg";
    } else if (this.getBase(base) == "BUBOK") {
      return "https://www.bubok.es/libro/portadaLibro/" + this.getASIN(base) + "/4/" + this.getCover() + ".webp";
    } else if (this.getBase(base) == "KOBO") {
      return this.getCover(base);
    } else if (this.getBase(base) == "GOOGLE BOOKS") {
      return "https://play.google.com/books/publisher/content/images/frontcover/" + this.getCover() + "?fife=w240-h345";
    }
  }

  book.addNetworksInfo = function (node) {};

  book.addASINInfo = function (node) {
    if (this.getBases() == null) { }
    else {
      if (isEventWaiting) {
        node.innerHTML += "<div class='ASIN'>Gratis el pr&oacute;ximo " + eventDate + "</div>";
      } else {
        let ih = "";
        let allBases = this.getBases();
        let bi = 0;
        ih += "<div class='chooseOne'>";

        for (; bi < allBases.length; bi++) {
          if (tracking) {
            ih += "<span onclick=\"navigate('" + this.getASIN(allBases[bi]) + "', " + this.getID() + ", '" + this.getBase(allBases[bi]) + "')\">";
          } else {
            ih += "<a href='" + getLink(tz, this.getASIN(allBases[bi]), this.getBase(allBases[bi])) + "' target='_blank'>";
          }

          ih += getLogo(this.getBase(allBases[bi]));

          if (tracking) {
            ih += "</span>";
          } else {
            ih += "</a>";
          }
        }

        ih += "</div>";

        node.innerHTML += ih;
      }
    }
  };
}

function getLogo(base) {
  let ret = "<img src='./img/";

  if (base == "AMAZON") { ret += "az"; }
  else if (base == "BUBOK") { ret += "bb"; }
  else if (base == "KOBO") { ret += "kb_logo"; }
  else if (base == "GOOGLE BOOKS") { ret += "gp"; }

  ret += ".png'"

  if (base == "KOBO") {
    ret += " style='height: 60px;'"
  }

  ret += ">";

  return ret;
}

function getLink(tz, ASIN, base) {
  if (base == "AMAZON") { return getAmazonLink(tz, ASIN); }
  else if (base == "BUBOK") { return getBubokLink(tz, ASIN); }
  else if (base == "KOBO") { return getKoboLink(tz, ASIN); }
  else if (base == "GOOGLE BOOKS") { return getGoogleLink(tz, ASIN); }
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

function getBubokLink(tz, ASIN) {
  return "https://bubok.es/comprar-libro/" + ASIN;
}

function getKoboLink(tz, ASIN) {
  return "https://www.kobo.com/es/es/search?query=" + ASIN;
}

function getGoogleLink(tz, ASIN) {
  return "https://play.google.com/store/books/details?id=" + ASIN;
}
//BOOKS - END

//LAUNCHER
async function fill() {
  //Christmas advent check
  let currDate = new Date(Date.now());
  let cd = currDate.getDate();
  let cm = currDate.getMonth();

  if (cm == 11) {
    if (cd <= 24) {
      //only from 1 to 24
      window.location.href = "adviento2025.html";
    }
  }

  let fList = [];
  clear();

  //check session to pump performance. It will renew each day to reflect latest changes.
  let isDone = localStorage.getItem('rtk_done');
  let dv = new Date();
  let doneValue = "" + dv.getFullYear() + String(dv.getMonth() + 1).padStart(2, "0") + String(dv.getDate()).padStart(2, "0");

  if (isDone == doneValue) {
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

    //Counting items before entering loop
    let books = JSON.parse(bookMaster);
    let authors = JSON.parse(authorMaster);
    
    bookMax = books.Book.length;
    authorMax = authors.Author.length;

    while (pai < authorMax || pbi < bookMax) {
      //performance (uncomment when needed)
      //let ini = Date.now();

      parseBooks(bookMaster);
      parseAuthors(authorMaster);

      //then wait for authors and books
      await Promise.allSettled(aList);
      await Promise.allSettled(bList);

      //performance (uncomment when needed)
      //add("Time: " + (Date.now() - ini));
    }

    //save data into local storage
    localStorage.setItem('rtk_books', JSON.stringify(bookList));
    localStorage.setItem('rtk_authors', JSON.stringify(authorList));
    localStorage.setItem('rtk_count', bookMax);
    localStorage.setItem('rtk_done', doneValue);
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

//Brevo special
function submitBrevo() {
  let a = g("ASIN").value;
  let e = g("EMAIL").value;
  let x = e.split("@");
  let y = x[0].split("+");

  g("EMAIL").value = y[0] + "+" + a + "@" + x[1];
  console.log(g("EMAIL").value);

  if (g('SINOPSIS').value.length > 500) {
    g('SINOPSIS').style = "border: 1px solid red;";
    g('SINOPSIS').value = g('SINOPSIS').value.substring(0, 500);
  }

  g("sib-form").submit();
}

//Analytics
function navigate(asin, bookId, base) {

  try {
    var xhttp = new XMLHttpRequest();
    xhttp.open("GET", "https://dohitb.ddns.net/rtklog.rtk?bookid=" + bookId, true);
    xhttp.send();
  } catch (e) {}

  window.open(getLink(tz, asin, base), '_blank');

  collapseBook(g(bookId));
}

//Magic stuff for register
function truncateData() {
  if (g('SINOPSIS').value.length > 500) {
    g('SINOPSIS').style = "border: 1px solid red;";
    g('SINOPSIS').value = g('SINOPSIS').value.substring(0, 500);
  }
}

function checkASIN(e) {
  let threshold = 9; //9 is default for az/gr
  let asin = g('ASIN').value;

  if (regType == 'bb') { threshold = 3; }
  else if (regType == 'gb') { threshold = 12; }
  else if (regType == 'wp' || regType == 'kb') { /* register types without magic */ threshold = 999999; }

  //Amazon ASIN was directly put. No call to goodreads
  if (asin.charAt(0) == 'B' && regType == 'az') { threshold = 999999; }

  //check if the lenght has decreased (mabe because we're deletting data)
  if (asin.length < threshold)
    searched = false;

  if (searched) {
    //If we press Ctrl+C for example it will trigger this piece and will skip
    return;
  }

  if (asin.length >= threshold) {
    //only search when we have full ASIN
    g('loginWrapper').innerHTML = "";
    g('loginWrapper').style.border = 'none';
    g('loginWrapper').style.background = 'none';
    g('loaderMsg').innerHTML = 'Rellen&iacute;n (nuestra mascota) est&aacute buscando tu libro.<br /><br />&iexcl;Gracias por participar en este evento!<br />Recuerda seguirnos en redes (RellenaTuKindle) y no dudes en escribirnos o etiquetarnos.';
    g('loader').style.visibility = "initial";
    g('mbody').style.backgroundColor = "#80808087";
    g('mainScreen').style.visibility = "hidden";
    g('whatContent').style.visibility = "hidden";
    startLoad();
    startMagic(asin);
    searched = true;
  }
}

function magic(asin) {
  try {
    var xhttp = new XMLHttpRequest();

    xhttp.onreadystatechange = function () {
      if (this.readyState == 4) {
        if (this.status == 200) {
          res = this.responseText;
          parseMagicResponse(true);
          closeLoad();
          collapseWhat('whatContent');
          collapseWhat('whatContent');
        } else {
          parseMagicResponse(false);
          closeLoad();
          collapseWhat('whatContent');
          collapseWhat('whatContent');
        }
      }
    };

    xhttp.open("GET", "https://dohitb.ddns.net/magic.reg?q=" + asin + "&t=" + regType, true);
    xhttp.send();
  } catch (e) {
  }
}

let magicWait = async function (asin) {
  let p = new Promise(function (resolve, reject) {
    magic(asin);
    resolve(true);
  });

  return p;
};


/*
 * {"ASIN" : "B0CVNT3824" , "title" : "The Herbalist&#39;s Apprentice: The encounter" , "cover" : "/books/1707948044i/208506703" , "author":"D. S. Caleidoscope" , "synopsis" : "Here is where the journey starts. Immerse yourself on a world of elves and fae; a world of nature and wonder; a wolrd of lies and love. This fascicle covers chapters one to six of the full book The Herbalist's Apprentice."}
 */
function parseMagicResponse(found) {
  if (found) {
    let data;

    if (regType == 'az') { data = parseGoodreads(res); }
    else if (regType == 'bb' || regType == 'gb') { data = JSON.parse(res); }

    g('ASIN').value = data.ASIN;
    g('TITULO').value = data.title;
    g('COVER').value = data.cover;
    g('AUTOR').value = data.author;
    g('SINOPSIS').value = data.synopsis;
  } else {
    g('TITULO').removeAttribute("disabled");
    g('AUTOR').removeAttribute("disabled");
    g('SINOPSIS').removeAttribute("disabled");
  }

  if (g('SINOPSIS').value.length > 500) {
    g('SINOPSIS').style = "border: 1px solid red;";
    g('SINOPSIS').value = g('SINOPSIS').value.substring(0, 500);
  }
}

async function startMagic(asin) {
  await magicWait(asin);
}

function parseGoodreads(res) {
  let i = 0;
  let ex = true;
  let isPaperback = false;
  let data = JSON.parse(res);
  let apollo = data.props.pageProps.apolloState;
  let grBookId = {};
  let ret = {};

  //get all the properties.
  while (ex) {
    //find a book node
    grBookId = checkObjectExist(apollo, "Book:kca", i);

    //check if it has title
    let title = checkObjectExist(grBookId, "title", 0);

    if (title != null) {
      //title was found
      ex = false;
    }

    i++;
  }

  //construct ret object

  //first, check format
  if (grBookId.details.format == "Paperback" || grBookId.details.format == "Hardcover") {
    isPaperback = true;
  }

  //get ASIN
  if (isPaperback) {
    //get correct ASIN
    let affiliatedLinks = grBookId.links.primaryAffiliateLink;
    let alURL = affiliatedLinks.url.split("gp/product/")[1];

    ret.ASIN = alURL.split("/")[0];
  } else {
    ret.ASIN = grBookId.details.asin;
  }

  //title
  ret.title = grBookId.title;

  //cover
  ret.cover = "/books/" + grBookId.imageUrl.split("/books/")[1].split(".jpg")[0];

  //author
  ret.author = apollo[grBookId.primaryContributorEdge.node.__ref].name;

  //synopsis
  ret.synopsis = checkObjectExist(grBookId, "stripped", 0);

  return ret;
}

function checkObjectExist(object, string, start) {
  let props = Object.getOwnPropertyNames(object);

  for (; start < props.length; start++) {
    if (props[start].includes(string)) {
      return object[props[start]];
    }
  }

  return null;
}