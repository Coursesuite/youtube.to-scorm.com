/*
 *	YouTube Scorm Wrapper
 *	Causes a scorm completion after video playback passes a given percentage
 *	(c) 2014 tim st.clair (tim.stclair@gmail.com)
 *	Licence: MIT
 */
var player,
	_poll,
	_polling = false,
	_relaunch = false,
	_seconds = 0,
	_complete = false,
	sReturn = scormGetValue("cmi.core.entry"),
	sPlayed = scormGetValue("cmi.core.lesson_location");

_relaunch = (sReturn != "ab-initio"); // true if previously suspended

var tag = document.createElement('script');
tag.src = "//www.youtube.com/player_api";
var firstScriptTag = document.getElementsByTagName('script')[0];
firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

window.onYouTubeIframeAPIReady = function () {
	player = new YT.Player('ytplayer', {
		height: _vh,
		width: _vw,
		videoId: _videoId,
		events: {
			'onReady':  function (event) {
				scormSetValue("cmi.core.exit", "suspend");
				scormSetValue("cmi.core.lesson_status", "incomplete");
				scormCommit();
		    	_timeSessionStart = new Date();
		
			    if (_relaunch) {
				    var iSeconds = +sPlayed || 0;
				    player.seekTo(iSeconds);
				    _relaunch = false;
			    }
			    
			    player.playVideo();
			    
			},
			'onStateChange': function (event) {
				switch (event.data) {
					case YT.PlayerState.PAUSED:
						scormSetValue("cmi.core.lesson_location", _seconds+"");
						_polling = false;
						break;

					case YT.PlayerState.ENDED:
						scormSetValue("cmi.core.lesson_location", _seconds+"");
						scormCommit();
						_polling = false;
						break;
						
					case YT.PlayerState.PLAYING:
						_polling = true;
						_poll = setTimeout(poll,100);
						break;
						
					case YT.PlayerState.BUFFERING:
						_polling = false;
						break;
					
				}
			}
		}
		
	});
};

function poll() {
	if (_polling) {
	    _seconds = player.getCurrentTime();
		scormSetValue("cmi.core.lesson_location", _seconds+"");
		if (Math.round((_seconds / player.getDuration()) * 100) >= _required) {
			if (!_complete) {
				scormSetValue("cmi.core.exit", "");
				scormSetValue("cmi.core.score.min", "0");
				scormSetValue("cmi.core.score.max", "100");
				scormSetValue("cmi.core.score.raw", _required);
				scormSetValue("cmi.core.lesson_status", "completed");
				scormCommit();
				_complete = true;
			}
		}
		if (_poll) clearTimeout(poll);
		_poll = setTimeout(poll, 100);
	}
}