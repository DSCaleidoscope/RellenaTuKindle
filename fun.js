function sendReg() {
  //grab form values
  let asin = g('RegASIN').value;
  let social = g('RegSocial').value;
  let data = new FormData();
  data.append("ASIN", asin);
  data.append("social", social);

  navigator.sendBeacon("https://rellenatukindle.000webhostapp.com/reg.php", data);
  g('RegResult').innerHTML = "Registro efectuado";
}
