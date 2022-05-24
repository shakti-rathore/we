//const socket = new WebSocket("ws://192.168.5.104:7071/agent");
const socket = new WebSocket("wss://localhost:7071/agent");
//const socket = new WebSocket("wss://192.168.43.9:7071/agent");

var tracks
async function getVideo() {
    const video = document.getElementById("localvideo")
    const localStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        });
    video.srcObject = localStream;
    tracks = localStream
    console.log(localStream);
}

socket.addEventListener('open', function (event) {
    console.log("connected to websocket");
    socket.send(JSON.stringify({
      eventType : "connection",
      data : "open",
            
    }));
    console.log("message send to websocket" )
    //console.log(event);
  });

//const configuration = {'iceServers': [{'urls': 'stun:stun.l.google.com:19302'}]}

let configuration = {
  iceServers: [
      {
          "urls": ["stun:stun.l.google.com:19302", 
          "stun:stun1.l.google.com:19302", 
          "stun:stun2.l.google.com:19302"]
      }
  ]
}

// peer conntetion oer the internet 
//const peerConnection = new RTCPeerConnection(configuration);

//peer connection  in local LAN so dont need stun and trun server
peerConnection = new RTCPeerConnection()

socket.addEventListener('message', async message => {
    //console.log(message.data)
    data = JSON.parse(message.data)
    if(data.data == "Established"){
      console.log(data.user);
      document.getElementById("username").innerHTML = data.user;
    }
    if (data.offer) {

      await peerConnection.setRemoteDescription(data.offer);

       // console.log("recived offer from rtc", data.offer)

        let gumStream = await navigator.mediaDevices.getUserMedia({
          video: true
        });

       document.getElementById("localvideo").srcObject = gumStream;
        //console.log(gumStream)
        //trks = gumStream.getTracks()
        //console.log(" tracks in stream", trks)
        for (const track of gumStream.getTracks()) {
          //console.log("local tracks ", track)
        peerConnection.addTrack(track, gumStream);
        }
                       
        const answer = await peerConnection.createAnswer();
        await peerConnection.setLocalDescription(answer);
        socket.send(JSON.stringify({'answer': answer}));
    }
});

// Listen for local ICE candidates on the local RTCPeerConnection
peerConnection.addEventListener('icecandidate', event => {
    //console.log("icecandidate rcvd from stun server ")
    //console.log(event.candidate)
    
    if (event.candidate) {
     console.log(event.candidate)
     socket.send(JSON.stringify(
       {type: "newcandidate",
        candidate: event.candidate}
      ));

    }
});


// Listen for remote ICE candidates and add them to the local RTCPeerConnection
socket.addEventListener('message', async message => {
    data = JSON.parse(message.data)
    console.log(data)
    if (data.candidate) {
      //console.log("ice candidate rcvd from peer " , data.candidate.candidate)
        try {
            await peerConnection.addIceCandidate(data);
            console.log("ice candidate added as rcvd from peer", data)
        } catch (e) {
           console.error('Error adding received ice candidate', e);
        }
    }
});



peerConnection.ontrack = (ev) => {
  document.getElementById("remotevideo").srcObject = ev.streams[0];
  console.log("ontrack event fired",ev.streams)
  tracks = ev.streams[0].getTracks() 
  console.log("local tracks ", tracks)
   
};

//code by shakti for vedio load event

function addListenerMulti(el, s, fn) {
    s.split(' ').forEach(e => el.addEventListener(e, fn, false));
  }
  
  var video = document.getElementById('remotevideo');
  
  addListenerMulti(video, 'abort canplay canplaythrough durationchange emptied encrypted ended error interruptbegin interruptend loadeddata loadedmetadata loadstart mozaudioavailable pause play playing progress ratechange seeked seeking stalled suspend  volumechange waiting', function(e){
      console.log(e.type + " " + Date.now());
  });