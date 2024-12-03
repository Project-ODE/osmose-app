import React, { useEffect, useImperativeHandle, useRef } from 'react';
import { useAppSelector, useAppDispatch } from '@/service/app';
import { useAudioService } from "@/services/annotator/audio.service.ts";
import { onPause, onPlay, setTime } from '@/service/annotator';

// Heavily inspired from ReactAudioPlayer
// https://github.com/justinmc/react-audio-player

export const AudioPlayerComponent = React.forwardRef<HTMLAudioElement | null, any>((_, ref) => {

  const {
    file,
    audio,
    userPreferences
  } = useAppSelector(state => state.annotator);
  const dispatch = useAppDispatch();

  const elementRef = useRef<HTMLAudioElement | null>(null);
  const audioService = useAudioService(elementRef);

  useEffect(() => {
    const interval = setInterval(() => {
      if (!elementRef.current || elementRef.current?.paused) return;

      const time = elementRef.current?.currentTime;
      if (audio.stopTime && time && time > audio.stopTime) audioService.pause();
      else dispatch(setTime(time))
    }, 1 / 30) // 1/30 is the more common video FPS os it should be enough to update currentTime in view

    return () => clearInterval(interval)
  }, [ file?.id ]);

  useEffect(() => {
    dispatch(onPause())
    if (elementRef.current) {
      elementRef.current.volume = 1.0;
      elementRef.current.preservesPitch = false;
      elementRef.current.playbackRate = userPreferences.audioSpeed;
    }
  }, [ elementRef.current ])

  useImperativeHandle<HTMLAudioElement | null, HTMLAudioElement | null>(ref,
    () => elementRef.current,
    [ elementRef.current ]
  );

  // title property used to set lockscreen / process audio title on devices
  return (
    <audio autoPlay={ false }
           className="audio-player"
           controls={ false }
           loop={ false }
           muted={ false }
           ref={ elementRef }
           onLoadedMetadata={ () => dispatch(setTime(0)) }
           onAbort={ () => dispatch(onPause()) }
           onEnded={ () => dispatch(onPause()) }
           onPause={ () => dispatch(onPause()) }
           onPlay={ () => dispatch(onPlay()) }
           preload="auto"
           src={ file?.audio_url }
           title={ file?.audio_url }>
      <p>Your browser does not support the <code>audio</code> element.</p>
    </audio>
  );
});
