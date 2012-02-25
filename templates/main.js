soundManager.url = '/library/';
soundManager.onready(function() {
  
});

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
    
    var autoPlay = false;
    
    if (!$('meta[aid]').attr("aid")) {
      var options = $("#artists > option");
      var random = Math.floor(options.length * (Math.random() % 1));
      $("#artists > option").attr('selected', false).eq(random).attr('selected', true);
      
      autoPlay = true;
    }    
    
    $.getJSON("/ajax/get_playlists",{showid: $('#artists').val()}, function(json){
      var options = '';
      for (var i = 0; i < json.data.length; i++) {
        var selected = $('meta[playlistid]').attr("playlistid") == json.data[i].playlistid ? " selected" : ""; 
        options += '<option value="' + json.data[i].playlistid + '"' + selected + '>' + json.data[i].playlistname + '</option>';
      }
      $("#playlists").html(options);
      $("#playlists").removeAttr("disabled");
      $("input[type=submit]").removeAttr("disabled");
      
      if (autoPlay) $("#main_form").submit();

    })
  })
  
  $("#artists").change(function() {
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
  
  $("#playlists").change(function() {
    $("#main_form").submit();
  })
  

  $("#player_play").click(function() {
    play();
    $(this).blur();
    return false;
  });
    
  $("#player_pause").click(function() {
    stop();
    $(this).blur();
    return false;
  });
  
  $("#player_previous").click(function() {
    alert("si")
    playListPrev();
    $(this).blur();
    return false;
  });

  $("#player_next").click(function() {
    playListNext();
    $(this).blur();
    return false;
  });
  
  displayPlayList();
  play();
  
});

var nowPlaying;
var playlistId = 0;
function playAudio(_playlistId) {
  
  playlistId = _playlistId ? _playlistId : 0;
  
  if (nowPlaying){
      nowPlaying.destruct();
      if (playlistId == myPlayList.length){
          playlistId = 0;
      }
  }

  soundManager.onready(function() {
      nowPlaying = soundManager.createSound({
          id: 'sk4Audio',
          url: myPlayList[playlistId]['mp3'],
          autoLoad: true,
          autoPlay: true,
          volume: 50,
          onfinish: function(){
              playlistId ++;
              playAudio(playlistId);
          }
      })
  });
  
  $('#tracks ul li').removeClass("playing");
  $('#snd' + playlistId).addClass("playing");
}

function displayPlayList() {
   $("#tracks ul").empty();
   for (i=0; i < myPlayList.length; i++) {
     
     for (i = 0; i < myPlayList.length; i++ ) {
       $('#tracks ul').append('<li id="snd' + i + '"><span class="track" num="' + i + '">' + myPlayList[i]['name']  + '</span></li>');
     }
   }
   
   $('.track').click(function(eventObject) {
     var id = $(eventObject.target).attr("num");
     playAudio(parseInt(id, 10));
     return false;
   })
}

function stop(){
  if (nowPlaying){
    nowPlaying.destruct();
    nowPlaying = null;
  } else {
    play();
  }
}

function play(){
   playAudio(playlistId);
}

function playListNext(){
   var index = (playlistId+1 < myPlayList.length) ? playlistId+1 : 0;
   playAudio(index);
}

function playListPrev(){
   var index = (playlistId-1 >= 0) ? playlistId-1 : myPlayList.length-1;
   playAudio(index);
}