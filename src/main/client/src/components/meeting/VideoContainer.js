import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import connection from './RtcConnection';
import localVideoThumbnailsArr from './VideoThumbnailsClass';
import VideoThumbnailsList from './VideoThumbnailsList';
import Video from '../../Video';
import SpeechRecognition, {
  useSpeechRecognition,
} from 'react-speech-recognition';

import { firebaseDatabaseRef, firebaseStorage } from '../../firebase';
import RecordRTC from 'recordrtc';
import { useDispatch, useSelector } from 'react-redux';
import { setMainVideo } from '../../modules/meeting';

const VideoWrapper = styled.div`
  display: flex;
  justify-content: flex-start;
  align-items: center;
  flex-wrap: wrap;
  min-height: 0;
`;

const MainVideo = styled.div`
  margin: 2.5%;
  width: 45%;
  position: relative;
`;

const MainUserId = styled.span`
  position: absolute;
  bottom: 10px;
  left: 10px;
`;

const VideoContainer = ({ match }) => {
  const dispatch = useDispatch();
  const mainVideo = useSelector((state) => state.meeting.mainVideo);
  const [videoThumbnailsArr, setVideoThumbnailsArr] = useState([]);
  const [connectionInfo, setConnectionInfo] = useState('');
  const [recordFlag, setRecordFlag] = useState(0);
  const [hostState, setHostState] = useState(false);
  const [voiceFileId, setVoiceFileId] = useState(999999);
  const databaseRef = firebaseDatabaseRef;

  const notifyRemoteUserLeft = (name) => {
    // alert(name + ' left.');
    console.log(name + ' left.');
  };

  const closeSocket = () => {
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
    if (hostState) {
      console.log('host close!!!');
      connection.closeSocket();
    }

    SpeechRecognition.stopListening();
    window.location.href = '/main';
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
      // ????????? ??? ????????? ??????
      const minutesId = localStorage.getItem('minutesId');
      databaseRef.push({
        flag: 2,
        minutesId: minutesId,
        senderId: 'testId',
        senderName: '?????????',
        message: 'NULL',
        time: 'NULL',
      });
      setConnectionInfo(event.stream);

      // onstream ???????????? stt ??????
      SpeechRecognition.startListening({
        continuous: true,
        language: 'ko-KR',
      });

      console.log('ON STREAM TEST');
      // local == ??? ?????????, remote == ?????? ??????
      if (event.type === 'local') {
        console.log(
          localVideoThumbnailsArr.get(),
          'ON STREAM - ADD LOCAL STREAM',
        );
        dispatch(setMainVideo(event));
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
    };

    connection.onstreamended = (event) => {
      console.log('ON STREAM END TEST', event);
      if (event.type === 'local') {
        dispatch(setMainVideo(null));
        localVideoThumbnailsArr.set([]);
        setVideoThumbnailsArr([]);
        console.log('LOCAL STREAM CLOSING. CLOSING ALL VIDEOS - TEST');

        // --------------- recorder -----------------
        var recorder = connection.recorder;
        if (!recorder) return console.log('No recorder found.');
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

    // URL queryString ????????????
    const open = window.location.search.split('=')[1];
    // URL ???????????? ????????????
    const code = match.params.roomId;

    if (open === 'true') {
      // Meeting Open
      connection.open(code, function (isRoomOpened, roomid, error) {
        if (isRoomOpened === true) {
        } else {
          if (error === 'Room not available') {
            alert('?????? ???????????? ????????????. ????????? ?????? ???????????? ???????????????!');
            window.location.href = '/main';
            return;
          }
          alert(error + 'error log');
        }
      });

      // ???????????? user id??? ????????? ?????? host id??? ???????????? host ?????? ??????
      if (localStorage.getItem('userId') === localStorage.getItem('hostId'))
        setHostState(true);
    } else {
      // Meeting Join
      connection.join(code, function (isJoinedRoom, roomid, error) {
        if (error) {
          if (error === 'Room not available') {
            alert('???????????? ?????? ????????????. ????????? ?????? ???????????? ???????????????!');
            window.location.href = '/main';
            return;
          }
          alert(error + ' error log');
        }
      });
    }
  }, []);

  useEffect(() => {
    // ??? ?????? ??? record ??????
    if (interimTranscript !== '') {
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
    // --- ??? ??????????????? record ?????? firebase storage??? ?????? ---
    if (finalTranscript !== '') {
      var recorder = connection.recorder;
      if (!recorder) return console.log('^^');
      recorder.stopRecording(function () {
        var file = recorder.getBlob();

        if (!file) {
          throw 'Blob object is required.';
        }

        if (!file.type) {
          try {
            file.type = 'audio/wav;codecs=opus';
          } catch (e) {}
        }

        var now = new Date();
        var pivot = new Date(2050, 12, 31, 14, 23, 23);
        var please = pivot - now;
        var fileFullName = please + '.wav';

        setVoiceFileId(voiceFileId - 1);
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
            console.log('????????? ?????????'); // ????????? ????????? ??????
          },
          function (error) {
            // ????????? ????????? ?????? ????????? ??????
            console.log(error);
          },
          function () {
            // ????????? ?????????
            console.log('????????? ??????');
          },
        );

        connection.recorder = null;
      });
    }
  }, [finalTranscript]);

  useEffect(() => {
    // --- finalTranscript ??? ??????????????? firebase database??? ?????? ---
    if (finalTranscript !== '') {
      console.log('Got final result:', finalTranscript);
      resetTranscript();

      const userId = localStorage.getItem('userId');
      const userName = localStorage.getItem('userName');
      const minutesId = localStorage.getItem('minutesId');
      let createdDate = localStorage.getItem('createdDate');
      if (createdDate === null || createdDate === undefined) {
        createdDate = 'NULL';
      }
      databaseRef.push({
        flag: recordFlag,
        minutesId: minutesId,
        senderId: userId,
        senderName: userName,
        message: finalTranscript + '.',
        time: createdDate,
      });
    }
  }, [finalTranscript, resetTranscript]);

  if (!SpeechRecognition.browserSupportsSpeechRecognition()) {
    console.log(
      'Your browser does not support speech recognition software! Try Chrome desktop, maybe?',
    );
  }

  return (
    <div>
      {/* <div>
        <div>
          <span>listening: {listening ? 'on' : 'off'}</span>
        </div>
        <div>
          <span>{transcript}</span>
        </div>
      </div> */}
      <VideoWrapper>
        <MainVideo>
          {mainVideo && (
            <Video
              srcObject={mainVideo.stream}
              mainvideo="true"
              muted
              keyvalue={mainVideo.streamid}
              username={mainVideo.extra.username}
            />
          )}
          {/*<MainUserId>{mainVideo && mainVideo.extra.username}</MainUserId>*/}
        </MainVideo>
        <VideoThumbnailsList videos={videoThumbnailsArr} />
      </VideoWrapper>
    </div>
  );
};

export default VideoContainer;
