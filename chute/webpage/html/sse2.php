<?php
session_start();
if (isset($_GET['live']))
	header('Content-Type: text/event-stream');
header('Cache-Control: no-cache');
set_time_limit(600);

// Sends a message from the specified source to the server.
// Data from different sources can be handled differently on the HTML page.
function sendMsg($sensor, $msg) {
  echo "event: $sensor" . PHP_EOL;
  echo "data: $msg" . PHP_EOL;
  echo PHP_EOL;
  ob_flush();
  flush();
}

// Use an infinite loop to keep the connection to the client open
$datafile = @fopen("fft_debug_aug13_gfloor_fhss_3941_3016","r");
if (!$datafile) return;

if (isset($_SESSION['offset']))
	fseek($datafile, $_SESSION['offset']);
else
	$_SESSION['offset'] = 0;
 
$n = 2000;
$out = "";
while($n > 0) {
	$values = "";
	$dataline = fgets($datafile);
	$_SESSION['offset'] += strlen($dataline);
	$values = explode(",", $dataline, 17);
	$ts = trim($values[5], "UL");
	$points = trim($values[16], ", \n");
	$points_full = "";
	for($i = 0; $i < 215; $i++){
		if($i == 43){$points_full .= rand(50, 110).",";}
		else if($i == 86){$points_full .= rand(50, 110).",";}
		else if($i == 129){$points_full .= rand(50, 110).",";}
		else if($i == 172){$points_full .= rand(50, 110).",";}
		else{$points_full .= rand(90, 110).",";}
	}
	$points_full .= rand(90, 110);
	
	if (isset($_GET['live'])) {
		list($usec, $sec) = explode(" ", microtime());
		$tsf = date("i:s", $sec).".".substr("00000".$usec, -6);
//		$tsf = date("i:s.u");
		sendMsg("channel", "{ \"chan\": 40, \"ch\": [$points], \"timestamp\": \"$tsf\", \"freq\": 2412 }");
		sendMsg("channel_full", "{ \"chan\": 40, \"ch\": [$points], \"timestamp\": \"$tsf\"}");
		//sendMsg("channel_full", "{ \"chan\": 40, \"ch\": [$points_full], \"timestamp\": \"$tsf\"}");
		usleep(33000); // Approx. 30fps?
		
		$n++;
		if (($n % 15 == 0) AND ($n < 3100)) {
			$randomPower = rand(-90, -20);
			sendMsg("devices", "{ \"dev\": [\"ser\",\"Microwave\",\"1000000000000000\",\"1000000000000000\",\"10\",\"".$randomPower."\",\"10\",\"15\",1] }");
		}
		else if (($n % 15 == 0) AND ($n > 3100)) {
			$randomPower = rand(-90, -20);
			sendMsg("devices", "{ \"dev\": [\"ser\",\"Microwave\",\"1000000000000000\",\"1000000000000000\",\"10\",\"".$randomPower."\",\"10\",\"15\",0] }");
		}

		if ($n % 100 == 0) {
			$randomChannel = rand(1, 11);
			$randomWifi = rand(0, 50);
			$randomNonWifi = rand(0, 50);
			sendMsg("channel_util_info", "{ \"channel\": ".$randomChannel.", \"wifi\": ".$randomWifi.", \"nonwifi\": ".$randomNonWifi."}");
		}
	} else {
		$min = substr("0".floor((2000-$n)/1800), -2);
		$sec = substr("0".floor(((2000-$n)%1800)/30), -2);
		$fra = substr("00000".floor((2000-$n)%30 * 1000000/30), -6);
		$tsf = "$min:$sec.$fra";
		$out = $out."{ \"ch\": [$points], \"timestamp\": \"$tsf\" }".($n == 1 ? "" : ",").PHP_EOL;
		$n--;
	}
}
fclose($datafile);
if (!isset($_GET['live']))
	echo "{ \"data\": [ $out ] }";
?>
