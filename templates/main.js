$(document).ready(function(){
  
  $.getJSON("/ajax/get_artists",{}, function(json){
    
    $("#playlists").attr("disabled", "true");
    $("input[type=submit]").attr("disabled", "true");
    
    var options = '';
    for (var i = 0; i < json.data.length; i++) {
      var selected = $('meta[aid]').attr("aid") == json.data[i].showid ? " selected" : ""; 
      var loc = json.data[i].showlocation.length > 1 ? (" - " + json.data[i].showlocation) : ""
      options += '<option value="' + json.data[i].showid + '"' + selected + '>' + json.data[i].showtitle + loc + '</option>';
    }
    $("#artists").html(options);
    $("#artists").removeAttr("disabled");
    
    $.getJSON("/ajax/get_playlists",{showid: $('#artists').val()}, function(json){
      var options = '';
      for (var i = 0; i < json.data.length; i++) {
        var selected = $('meta[playlistid]').attr("playlistid") == json.data[i].playlistid ? " selected" : ""; 
        options += '<option value="' + json.data[i].playlistid + '"' + selected + '>' + json.data[i].playlistname + '</option>';
      }
      $("#playlists").html(options);
      $("#playlists").removeAttr("disabled");
      $("input[type=submit]").removeAttr("disabled");
    })
    
  })
  
  $("#artists").change(function(){
    $("#playlists").attr("disabled", "true");
    $("input[type=submit]").attr("disabled", "true");
    $.getJSON("/ajax/get_playlists",{showid: $('#artists').val()}, function(json){
      var options = '';
      for (var i = 0; i < json.data.length; i++) {
        options += '<option value="' + json.data[i].playlistid + '">' + json.data[i].playlistname + '</option>';
      }
      $("#playlists").html(options);
      $("#playlists").removeAttr("disabled");
      $("input[type=submit]").removeAttr("disabled");
    })
  })

	var playItem = 0;

	var jpPlayTime = $("#jplayer_play_time");
	var jpTotalTime = $("#jplayer_total_time");
	var jpStatus = $("#demo_status"); // For displaying information about jPlayer's status in the demo page

	$("#jquery_jplayer").jPlayer({
		ready: function() {
			displayPlayList();
			playListInit(true); // Parameter is a boolean for autoplay.
			demoInstanceInfo(this.element, $("#demo_info")); // This displays information about jPlayer's configuration in the demo page
		},
		oggSupport: false
	})
	.jPlayer("onProgressChange", function(loadPercent, playedPercentRelative, playedPercentAbsolute, playedTime, totalTime) {
		jpPlayTime.text($.jPlayer.convertTime(playedTime));
		jpTotalTime.text($.jPlayer.convertTime(totalTime));

		demoStatusInfo(this.element, jpStatus); // This displays information about jPlayer's status in the demo page
	})
	.jPlayer("onSoundComplete", function() {
		playListNext();
	});

	$("#jplayer_previous").click( function() {
		playListPrev();
		$(this).blur();
		return false;
	});

	$("#jplayer_next").click( function() {
		playListNext();
		$(this).blur();
		return false;
	});

	function displayPlayList() {
		$("#tracks ul").empty();
		for (i=0; i < myPlayList.length; i++) {
			var listItem = (i == myPlayList.length-1) ? "<li class='jplayer_playlist_item_last'>" : "<li>";
			listItem += "<span class='track' id='jplayer_playlist_item_"+i+"' num='" + i + "'>"+ myPlayList[i].name +"</span>";
			listItem += "<a target='itunes' class='store-link' href='http://www.amazon.com/s/ref=nb_sb_noss?url=search-alias%3Ddigital-music&field-keywords=" + myPlayList[i].name + "'><img src='http://ax.itunes.apple.com/images/linkmaker/arrow_999999_r.gif' width='12' height='12' border='0'></a></li>";
			$("#tracks ul").append(listItem);
			$("#tracks"+i).data( "index", i ).click( function() {
				var index = $(this).data("index");
				if (playItem != index) {
					playListChange( index );
				} else {
					$("#jquery_jplayer").jPlayer("play");
				}
				$(this).blur();
				return false;
			});
		}
		
		$('.track').click(function(eventObject) {
  	  playListChange(parseInt($(eventObject.target).attr("num"), 10));
  	  return false;
  	})
	}
	
	function playListInit(autoplay) {
		if(autoplay) {
			playListChange( playItem );
		} else {
			playListConfig( playItem );
		}
	}

	function playListConfig( index ) {
		$("#jplayer_playlist_item_"+playItem).removeClass("jplayer_playlist_current").parent().removeClass("jplayer_playlist_current");
		$("#jplayer_playlist_item_"+index).addClass("jplayer_playlist_current").parent().addClass("jplayer_playlist_current");
		playItem = index;
		$("#jquery_jplayer").jPlayer("setFile", myPlayList[playItem].mp3);
	}

	function playListChange( index ) {
    // alert(index)
		playListConfig( index );
		$("#jquery_jplayer").jPlayer("play");
	}

	function playListNext() {
		var index = (playItem+1 < myPlayList.length) ? playItem+1 : 0;
		playListChange( index );
	}

	function playListPrev() {
		var index = (playItem-1 >= 0) ? playItem-1 : myPlayList.length-1;
		playListChange( index );
	}
	
  // $(".track").first().click();
	
});

function demoInstanceInfo(myPlayer, myInfo) {
	var jPlayerInfo = "<p>This jPlayer instance is running in your browser using ";

	if(myPlayer.jPlayer("getData", "usingFlash")) {
		jPlayerInfo += "<strong>Flash</strong> with ";
	} else {
		jPlayerInfo += "<strong>HTML5</strong> with ";
	}
	
	if(myPlayer.jPlayer("getData", "usingMP3")) {
		jPlayerInfo += "<strong>MP3</strong>";
	} else {
		jPlayerInfo += "<strong>OGG</strong>";
	}
	
	jPlayerInfo += " files.<br />This instance is using the constructor options:<br /><code>$(\"#" + myPlayer.jPlayer("getData", "id") + "\").jPlayer({<br />";
	
	jPlayerInfo += "&nbsp;&nbsp;&nbsp;nativeSupport: " + myPlayer.jPlayer("getData", "nativeSupport");
	jPlayerInfo += ", oggSupport: " + myPlayer.jPlayer("getData", "oggSupport");
	jPlayerInfo += ", customCssIds: " + myPlayer.jPlayer("getData", "customCssIds");
	
	jPlayerInfo += "<br />});</code></p>";
	myInfo.html(jPlayerInfo);
}

function demoStatusInfo(myPlayer, myInfo) {
	var jPlayerStatus = "<p>jPlayer is ";
	jPlayerStatus += (myPlayer.jPlayer("getData", "diag.isPlaying") ? "playing" : "stopped");
	jPlayerStatus += " at time: " + Math.floor(myPlayer.jPlayer("getData", "diag.playedTime")) + "ms.";
	jPlayerStatus += " (tt: " + Math.floor(myPlayer.jPlayer("getData", "diag.totalTime")) + "ms";
	jPlayerStatus += ", lp: " + Math.floor(myPlayer.jPlayer("getData", "diag.loadPercent")) + "%";
	jPlayerStatus += ", ppr: " + Math.floor(myPlayer.jPlayer("getData", "diag.playedPercentRelative")) + "%";
	jPlayerStatus += ", ppa: " + Math.floor(myPlayer.jPlayer("getData", "diag.playedPercentAbsolute")) + "%)</p>"
	myInfo.html(jPlayerStatus);
}