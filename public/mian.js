var tracks
async function getVideo() {
    const video = document.getElementById("localvideo")
    const localStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
    });
    video.srcObject = localStream;
    tracks = localStream
    //console.log(localStream);
}


function stopBothVideoAndAudio(stream) {
    stream.getTracks().forEach(function (track) {
        if (track.readyState == 'live') {
            track.stop();
            //stopButton.disabled = true
            //startButton.disabled = false
        }
    })
}



//const socket = new WebSocket("wss://192.168.43.9:7071/agent");
const socket = new WebSocket("wss://localhost:7071/agent");


socket.addEventListener('open', function (event) {
    //console.log("connected to websocket");
    socket.send(JSON.stringify({
        eventType: "connection",
        data: "open",

    }));
    //console.log("message send to websocket")
    //console.log(event);
});


//peerConnection.createDataChannel('ourcodeworld-rocks');
async function makeCall() {

    //const configuration = [{
    //    urls: ['stun:stun.l.google.com:19302?transport=udp']
    //}]
    
    let configuration = {
        iceServers: [
            {
                "urls": ["stun:stun.l.google.com:19302", 
                "stun:stun1.l.google.com:19302", 
                "stun:stun2.l.google.com:19302"]
            }
        ]
    }


    // peer connection over inernet
    //const peerConnection = new RTCPeerConnection(configuration);

    //peer connection for laocal LAN 
    peerConnection = new RTCPeerConnection()
    const gumStream = await navigator.mediaDevices.getUserMedia({
        video: true
    });

    document.getElementById("localvideo").srcObject = gumStream;
    //console.log(gumStream)
    trks = gumStream.getTracks()
    //console.log(" tracks in stream", trks)
    for (const track of gumStream.getTracks()) {
      //  console.log("local tracks ", track)
        peerConnection.addTrack(track,gumStream);
    }


    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);
    socket.send(JSON.stringify({
        'offer': offer
    }));

    // Listen for local ICE candidates on the local RTCPeerConnection
    peerConnection.addEventListener('icecandidate', event => {
        //console.log("icecandidate rcvd from stun server ")
        //console.log(event.candidate)

        if (event.candidate) {
            //console.log(event.candidate)
            socket.send(JSON.stringify({
                type: "newcandidate",
                candidate: event.candidate
            }));
        }
    });


    socket.addEventListener('message', async message => {
        //console.log(message.data)
        data = JSON.parse(message.data)
        if (data.answer) {
            console.log("answer rcvd from rtctwo", data.answer)
            const remoteDesc = new RTCSessionDescription(data.answer);
            try {
                await peerConnection.setRemoteDescription(data.answer);
                console.log("remote description set")
            } catch (e) {
                console.error(" remote dsc not set ", e)
            }            
        }
    });

    // Listen for remote ICE candidates and add them to the local RTCPeerConnection
    socket.addEventListener('message', async message => {
        if (data.candidate) {
            try {
                await peerConnection.addIceCandidate(data);
                console.log("ice candidate added as rcvd from peer", data)
            } catch (e) {
                console.error('Error adding received ice candidate', e);
            }
        }
    });


    // Listen for connectionstatechange on the local RTCPeerConnection
    peerConnection.addEventListener('connectionstatechange', event => {
        //console.log(event)
        if (peerConnection.connectionState === 'connected') {
            console.log("peer Connected :)")
        }
    });

    peerConnection.ontrack = (ev) => {
        document.getElementById("remotevideo").srcObject = ev.streams[0];
        console.log("ontrack event fired",ev.streams)
        tracks = ev.streams[0].getTracks() 
        console.log("local tracks ", tracks)
         
      };

}

//new xhange 





