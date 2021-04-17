import {channel} from './socket';

const contactContainer = document.querySelector("#contact");
const myIdContainer = document.querySelector("#my-id");

const mediaConstraints = {
    audio: true,
    video: true,
};

let myPeerConnection = null;
let targetId = "";
let myId = "";

channel.on("video_offer", payload => {
    let localStream = null;
    targetId = payload.caller;
    createPeerConnection();

    let description = new RTCSessionDescription(payload.sdp);

    myPeerConnection.setRemoteDescription(description)
        .then(() => navigator.mediaDevices.getUserMedia(mediaConstraints))
        .then((stream) => {
            localStream = stream;
            document.getElementById("local-video").srcObject = localStream;

            localStream.getTracks().forEach(track => myPeerConnection.addTrack(track, localStream));
        })
        .then(() => myPeerConnection.createAnswer())
        .then((answer) => myPeerConnection.setLocalDescription(answer))
        .then(() => {
            channel.push("video_answer", {
                caller: payload.caller,
                callee: payload.callee,
                sdp: myPeerConnection.localDescription
            })
        })
        .catch(handleGetUserMediaError);
})

channel.on("video_answer", payload => {
    const description = new RTCSessionDescription(payload.sdp);
    myPeerConnection.setRemoteDescription(description)
        .catch(error => {
            console.log("video_answer")
            reportError(error)
        })
})

channel.on("new_ice_candidate", payload => {
    const candidate = new RTCIceCandidate(payload.candidate);

    // Causes error
    myPeerConnection.addIceCandidate(candidate)
        .catch((error) => {
            console.error("new_ice_candidate")
            reportError(error)
        });
})

channel.on("hang_up", payload => {
    closeVideoCall();
})

function startCall(clickEvent) {
    if (myPeerConnection) {
        alert("You can't start a call because you already have one open!");
    } else {
        targetId = contactContainer.textContent;
        myId = myIdContainer.textContent;

        createPeerConnection();

        navigator.mediaDevices.getUserMedia(mediaConstraints)
        .then(function(localStream) {
            document.getElementById("local-video").srcObject = localStream;
            localStream.getTracks().forEach(track => myPeerConnection.addTrack(track, localStream));
        })
        .catch(handleGetUserMediaError);
    }
}

function handleGetUserMediaError(e) {
    switch(e.name) {
        case "NotFoundError":
        alert("Unable to open your call because no camera and/or microphone" +
                "were found.");
        break;
        case "SecurityError":
        case "PermissionDeniedError":
        // Do nothing; this is the same as the user canceling the call.
        break;
        default:
        alert("Error opening your camera and/or microphone: " + e.message);
        break;
    }

    closeVideoCall();
}

function createPeerConnection() {
    myPeerConnection = new RTCPeerConnection({
        iceServers: [     // Information about ICE servers - Use your own!
          {
            urls: "stun:stun.stunprotocol.org"
          }
        ]
    });
    // myPeerConnection = new RTCPeerConnection();
  
    myPeerConnection.onicecandidate = handleICECandidateEvent;
    myPeerConnection.ontrack = handleTrackEvent;
    myPeerConnection.onnegotiationneeded = handleNegotiationNeededEvent;
    myPeerConnection.onremovetrack = handleRemoveTrackEvent;
    myPeerConnection.oniceconnectionstatechange = handleICEConnectionStateChangeEvent;
    myPeerConnection.onicegatheringstatechange = handleICEGatheringStateChangeEvent;
    myPeerConnection.onsignalingstatechange = handleSignalingStateChangeEvent;
}

function handleNegotiationNeededEvent() {
    myPeerConnection.createOffer().then(function(offer) {
      return myPeerConnection.setLocalDescription(offer);
    })
    .then(function() {
      channel.push("video_offer", {
        caller: myId,
        callee: targetId,
        sdp: myPeerConnection.localDescription
      });
    })
    .catch((error) => {
        console.error("handleNegotiationNeededEvent")
        reportError(error)
    });
}

function handleICECandidateEvent(event) {
    if (event.candidate) {
      channel.push("new_ice_candidate", {
        target: targetId,
        candidate: event.candidate
      });
    }
}

function handleTrackEvent(event) {
    document.getElementById("received-video").srcObject = event.streams[0];
    document.getElementById("hangup-button").disabled = false;
}

function handleRemoveTrackEvent(event) {
    var stream = document.getElementById("received-video").srcObject;
    var trackList = stream.getTracks();
  
    if (trackList.length == 0) {
      closeVideoCall();
    }
}

function handleICEConnectionStateChangeEvent(event) {
    switch(myPeerConnection.iceConnectionState) {
      case "closed":
      case "failed":
        closeVideoCall();
        break;
    }
}

function handleSignalingStateChangeEvent(event) {
    switch(myPeerConnection.signalingState) {
      case "closed":
        closeVideoCall();
        break;
    }
}

function handleICEGatheringStateChangeEvent(event) {
    // Our sample just logs information to console here,
    // but you can do whatever you need.
    console.log("handleICEGatheringStateChangeEvent", event)
}

function reportError(error) {
    console.error(error)
}

function hangUpCall() {
    closeVideoCall();
    channel.push("hang_up", {
      name: myId,
      target: targetId,
    });
}

function closeVideoCall() {
    console.log("closeVideoCall")
    const remoteVideo = document.getElementById("received-video");
    const localVideo = document.getElementById("local-video");
  
    if (myPeerConnection) {
      myPeerConnection.ontrack = null;
      myPeerConnection.onremovetrack = null;
      myPeerConnection.onremovestream = null;
      myPeerConnection.onicecandidate = null;
      myPeerConnection.oniceconnectionstatechange = null;
      myPeerConnection.onsignalingstatechange = null;
      myPeerConnection.onicegatheringstatechange = null;
      myPeerConnection.onnegotiationneeded = null;
  
      if (remoteVideo.srcObject) {
        remoteVideo.srcObject.getTracks().forEach(track => track.stop());
      }
  
      if (localVideo.srcObject) {
        localVideo.srcObject.getTracks().forEach(track => track.stop());
      }
  
      myPeerConnection.close();
      myPeerConnection = null;
    }
  
    remoteVideo.removeAttribute("src");
    remoteVideo.removeAttribute("srcObject");
    localVideo.removeAttribute("src");
    remoteVideo.removeAttribute("srcObject");
  
    document.getElementById("hangup-button").disabled = true;
}
  
window.startCall = startCall;
window.hangUpCall = hangUpCall;
