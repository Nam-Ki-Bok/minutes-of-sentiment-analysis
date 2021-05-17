import React, { useEffect, useState } from 'react';
import connection from './RtcConnection';
import localVideoThumbnailsArr from './VideoThumbnailsClass';
import VideoThumbnailsList from './VideoThumbnailsList';
import Video from '../../Video';
import SpeechRecognition, {
  useSpeechRecognition,
} from 'react-speech-recognition';

import { firebaseDatabaseRef, firebaseStorage } from '../../firebase';
import RecordRTC from 'recordrtc';
// import { Link } from "react-router-dom";

const VideoContainer = () => {
  const [mainVideo, setMainVideo] = useState(null);
  const [videoThumbnailsArr, setVideoThumbnailsArr] = useState([]);
  const [connectionInfo, setConnectionInfo] = useState('');
  const [recordFlag, setRecordFlag] = useState(0);
  // const databaseRef = firebase.database().ref();
  const databaseRef = firebaseDatabaseRef;
  const storageRef = firebaseStorage.ref();
  const userId = Math.floor(Math.random() * 1000000000);

  connection.iceServers = [
    {
      urls: [
        'stun:stun.l.google.com:19302',
        'stun:stun1.l.google.com:19302',
        'stun:stun2.l.google.com:19302',
        'stun:stun.l.google.com:19302?transport=udp',
      ],
    },
  ];

  connection.onstream = function (event) {
    // var connectionInfo = event.stream;
    setConnectionInfo(event.stream);

    console.log('ON STREAM TEST');
    if (event.type === 'local') {
      console.log(
        localVideoThumbnailsArr.get(),
        'ON STREAM - ADD LOCAL STREAM',
      );

      setMainVideo(event);
    } else if (event.type === 'remote') {
      localVideoThumbnailsArr.addVideo(
        <Video
          srcObject={event.stream}
          keyvalue={event.streamid}
          id={event.streamid}
          username={event.extra.username}
        />,
      );
      console.log(
        localVideoThumbnailsArr.get(),
        'ON STREAM - ADD REMOTE STREAM',
      );

      setVideoThumbnailsArr([...localVideoThumbnailsArr.get()]);
    }

    function readMessage(data) {
      console.log(data.val().sender);
      console.log(data.val().message);
    }

    databaseRef.on('child_added', readMessage);
  };

  connection.onstreamended = (event) => {
    console.log('ON STREAM END TEST', event);
    if (event.type === 'local') {
      setMainVideo(null);
      localVideoThumbnailsArr.set([]);
      setVideoThumbnailsArr([]);
      console.log('LOCAL STREAM CLOSING. CLOSING ALL VIDEOS - TEST');

      // --------------- recorder -----------------
      var recorder = connection.recorder;
      if (!recorder) return alert('No recorder found.');
      recorder.stopRecording(function () {
        var blob = recorder.getBlob();
        RecordRTC.invokeSaveAsDialog(blob);
        replaceAudio(URL.createObjectURL(blob));
        console.log(blob);

        connection.recorder = null;
      });

      // ------------ audio -------------
      var audio = document.querySelector('audio');
      function replaceAudio(src) {
        var newAudio = document.createElement('audio');
        newAudio.controls = true;
        newAudio.autoplay = true;

        if (src) {
          newAudio.src = src;
        }

        var parentNode = audio.parentNode;
        parentNode.innerHTML = '';
        parentNode.appendChild(newAudio);

        audio = newAudio;
      }
    }

    if (event.type === 'remote') {
      localVideoThumbnailsArr.findAndRemove(event.streamid);
      setVideoThumbnailsArr([...localVideoThumbnailsArr.get()]);
      console.log(
        `REMOTE STREAM CLOSING. CLOSING REMOTE STREAM VIDEO - TEST`,
        event,
      );

      notifyRemoteUserLeft(event.extra.username);
    }
  };

  const notifyRemoteUserLeft = (name) => {
    alert(name + ' left.');
  };

  const closeSocket = function () {
    console.log('START CLOSE SOCKET TEST');

    connection.getAllParticipants().forEach(function (pid) {
      console.log('TEST DISCONECT WITH PEERS', pid);
      connection.disconnectWith(pid);
    });

    // stop all local cameras
    connection.attachStreams.forEach(function (localStream) {
      console.log(localStream, 'CLOSE LOCAL STREAM - TEST');
      localStream.stop();
    });

    // last user will have to close the socket
    // connection.closeSocket();

    SpeechRecognition.stopListening();
    window.location.href = '/';
  };

  // room ID.
  const staticId = 'qweasd';

  const openOrJoin = () => {
    connection.openOrJoin(staticId);
  };

  const justOpen = () => {
    connection.open(staticId, function (isRoomOpened, roomid, error) {
      if (isRoomOpened === true) {
      } else {
        if (error === 'Room not available') {
          alert('이미 존재하는 방입니다. 새로운 방을 만들거나 참가하세요!');
          closeSocket();
          return;
        }
        alert(error + 'error log');
      }
    });
  };

  const justJoin = () => {
    connection.join(staticId, function (isJoinedRoom, roomid, error) {
      if (error) {
        if (error === 'Room not available') {
          alert('존재하지 않는 방입니다. 새로운 방을 만들거나 참가하세요!');
          closeSocket();
          return;
        }
        alert(error + 'error log');
      }
    });
  };

  // ---------------------------------------------------speech recognition --------------------------------------------------------
  const {
    transcript,
    interimTranscript,
    finalTranscript,
    resetTranscript,
    listening,
  } = useSpeechRecognition();

  useEffect(() => {
    if (interimTranscript !== '') {
      console.log('Got interim result:', interimTranscript);

      var recorder = connection.recorder;
      if (!recorder) {
        recorder = RecordRTC([connectionInfo], {
          type: 'audio',
        });
        recorder.startRecording();
        connection.recorder = recorder;
      } else {
        recorder.getInternalRecorder().addStreams([connectionInfo]);
      }

      if (!connection.recorder.streams) {
        connection.recorder.streams = [];
      }

      // connection.recorder.streams.push(event.stream);
    }
  }, [interimTranscript]);

  useEffect(() => {
    if (finalTranscript !== '') {
      var recorder = connection.recorder;
      if (!recorder) return alert('No recorder found.');
      recorder.stopRecording(function () {
        var file = recorder.getBlob();
        // RecordRTC.invokeSaveAsDialog(blob);
        // storageRef.put(blob).then(function (snapshot) {
        //   console.log("Uploaded a blob or file!");
        // });
        if (!file) {
          throw 'Blob object is required.';
        }

        if (!file.type) {
          try {
            file.type = 'audio/wav;codecs=opus';
          } catch (e) {}
        }

        var fileFullName =
          userId + '_' + Math.floor(Math.random() * 1000000000) + '.' + 'wav';
        if (typeof navigator.msSaveOrOpenBlob !== 'undefined') {
          return navigator.msSaveOrOpenBlob(file, fileFullName);
        } else if (typeof navigator.msSaveBlob !== 'undefined') {
          return navigator.msSaveBlob(file, fileFullName);
        }

        var storage = firebaseStorage;
        var storageUpRef = storage.ref(fileFullName);
        var task = storageUpRef.put(file);
        task.on(
          'state_changed',
          function (snapshot) {
            console.log('업로드 진행중'); // 업로드 진행시 호출
          },
          function (error) {
            // 업로드 중간에 에러 발생시 호출
            console.log(error);
          },
          function () {
            // 업로드 완료시
            console.log('업로드 완료');
            // var storageRef = storage.ref();
            //
            // storageRef.child(storageUrl).getDownloadURL().then(function (url) {   // 저장된 파일의 http url 주소 받아오기
            //     console.log('url은 이겁니다 : ', url);
            // }).catch(function (error) {
            //
            // });
          },
        );

        connection.recorder = null;
      });
    }
  }, [finalTranscript]);

  useEffect(() => {
    if (finalTranscript !== '') {
      console.log('Got final result:', finalTranscript);
      resetTranscript();

      var now = new Date();

      // let msg =
      databaseRef.push({
        sender: userId,
        message: finalTranscript + '.',
        time: now.getHours() + ':' + now.getMinutes() + ':' + now.getSeconds(),
        flag: recordFlag,
      });
      // msg.remove();
    }
  }, [finalTranscript, resetTranscript, userId]);

  if (!SpeechRecognition.browserSupportsSpeechRecognition()) {
    console.log(
      'Your browser does not support speech recognition software! Try Chrome desktop, maybe?',
    );
  }

  const StartSpeechRecognition = () => {
    SpeechRecognition.startListening({
      continuous: true,
      language: 'ko-KR',
    });
    setRecordFlag(1);
  };

  const StopSpeechRecognition = () => {
    SpeechRecognition.stopListening();
    setRecordFlag(-1);
    const now = new Date();
    let msg = databaseRef.push({
      sender: userId,
      message: finalTranscript + '.',
      time: now.getHours() + ':' + now.getMinutes() + ':' + now.getSeconds(),
      flag: recordFlag,
    });
    msg.remove();
  };

  return (
    <div>
      <div>
        <div>
          <span>listening: {listening ? 'on' : 'off'}</span>
          <div>
            <button type="button" onClick={resetTranscript}>
              Reset
            </button>
            <button type="button" onClick={StartSpeechRecognition}>
              Listen
            </button>
            <button type="button" onClick={SpeechRecognition.stopListening}>
              Stop
            </button>
          </div>
        </div>
        <div>
          <span>{transcript}</span>
        </div>
      </div>
      <div>
        audio Test
        <audio controls autoPlay playsInline></audio>
      </div>
      <div id="video-container">
        <div id="main-video">
          {mainVideo && (
            <Video
              srcObject={mainVideo.stream}
              mainvideo="true"
              keyvalue={mainVideo.streamid}
              username={mainVideo.extra.username}
            />
          )}
          {mainVideo && mainVideo.extra.username}
        </div>
        <VideoThumbnailsList videos={videoThumbnailsArr} />
      </div>
      <div className="action-buttons">
        {!mainVideo && (
          <button className="btn" onClick={() => openOrJoin()}>
            OpenOrJoin
          </button>
        )}
        {!mainVideo && (
          <button className="btn" onClick={() => justOpen()}>
            JustOpen
          </button>
        )}
        {!mainVideo && (
          <button className="btn" onClick={() => justJoin()}>
            JustJoin
          </button>
        )}
        {mainVideo && (
          <button className="btn" onClick={() => closeSocket()}>
            Close
          </button>
        )}
        {mainVideo && (
          <button className="btn" onClick={StartSpeechRecognition}>
            기록 시작
          </button>
        )}
        {mainVideo && (
          <button className="btn" onClick={StopSpeechRecognition}>
            기록 종료
          </button>
        )}
      </div>
    </div>
  );
};

export default VideoContainer;