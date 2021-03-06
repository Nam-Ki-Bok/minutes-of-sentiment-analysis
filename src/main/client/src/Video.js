import React, { useRef, useEffect } from 'react';

const Video = ({ srcObject, ...props }) => {
  const refVideo = useRef(null);

  useEffect(() => {
    console.log(srcObject, 'test all here');

    if (!refVideo.current) return;
    refVideo.current.srcObject = srcObject;

    var playPromise = refVideo.current.play();

    if (playPromise !== undefined) {
      playPromise
        .then((_) => {
          // Automatic playback started!
          // Show playing UI.
        })
        .catch((error) => {
          // Auto-play was prevented
          // Show paused UI.
        });
    }
  }, [srcObject]);

  console.log('props log 보기 !! : ', props);
  return <video ref={refVideo} {...props} key={props.keyvalue} />;
};

export default React.memo(Video);
