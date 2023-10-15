<?php
mysqli_report(MYSQLI_REPORT_ERROR | MYSQLI_REPORT_STRICT);
$id = $_GET['id'];
$A = $_GET['ASIN'];

if(!is_numeric($id)){die();}

$mysqli = new mysqli('secret', 'secret', 'secret', 'secret');
$mysqli->set_charset('utf8');

if(mysqli_connect_errno()) {
  echo 'Failed to connect to database: '.mysqli_connect_error();
  die();
}

mysqli_query($mysqli,"[query]");
mysqli_close($mysqli);
header("Location: https://www.amazon.com/gp/product/$A");
die();
?>
