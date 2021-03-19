/*
 *	Youtube Scorm API
 *	Implements enough SCORM API calls for the vimeo wrapper to work
 *	(c) 2014  tim st.clair (tim.stclair@gmail.com)
 *	Licence: MIT
 */
var _termSCO = false, _timeSessionStart = new Date(), $api = null;

function scormInitialize() {
	var API = getAPI();
	if (API == null) return "false";
	return API.LMSInitialize("");
}

function scormTerminate() {
	var API = getAPI();
	if (API == null) return "false";
	return API.LMSFinish("");
}

function scormCommit() {
	var API = getAPI();
	if (API == null) return "false";
	return API.LMSCommit("");
}

function scormGetValue(name) {
	var API = getAPI();
	if (API == null) return "";
	var value = API.LMSGetValue(name);
	var errCode = API.LMSGetLastError();

	if (errCode != "0") {
		return "";
	} else {
		return value;
	}
}

function scormSetValue(name, value) {
	var API = getAPI();
	if (API == null) return "true";
	return API.LMSSetValue(name, value);
}

function termSCO() {
	if (_termSCO) return;
	var dateNow = new Date();
	var timeNow = dateNow.getTime();
	var timeElapsed = Math.round((timeNow - _timeSessionStart) / 1000);
	var sTime = formatTime(timeElapsed);
	scormSetValue("cmi.core.session_time", sTime);
	scormCommit();
	scormTerminate();
	_termSCO = true;
}

function findAPI(win, apiName) {
	while ((win[apiName] == null) && (win.parent != null) && (win.parent != win)) {
		win = win.parent;
	}
	$api = win[apiName];
}

function getAPI() {
	if ($api != null) return $api;
	findAPI(window, 'API');
	if (($api == null) && (window.opener != null)) {
		findAPI(window.opener, 'API');
	}
	// console.log("getAPI", $api);
	return $api;
}

function formatTime(timeRaw) {
	var hh = Math.floor(timeRaw / 3600);
	timeRaw -= hh * 3600;
	var mm = Math.floor(timeRaw / 60);
	timeRaw -= mm * 60;
	var ss = timeRaw;
	if (hh<10) hh = "0" + hh;
	if (mm<10) mm = "0" + mm;
	if (ss<10) ss = "0" + ss;
	return hh + ":" + mm +":" + ss;
}

getAPI();
scormInitialize();