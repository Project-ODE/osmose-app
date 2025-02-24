import { MutableRefObject, useEffect, useRef } from "react";
import { useAppDispatch, useAppSelector } from '@/service/app';
import { AnnotationResult } from '@/service/campaign/result';
import { setAudioSpeed, setStopTime, setTime } from '@/service/annotator';
import { useToast } from "@/service/ui";
import { KEY_DOWN_EVENT } from "@/service/events";

export const useAudioService = (player: MutableRefObject<HTMLAudioElement | null>) => {
  // Data
  const isPaused = useAppSelector(state => state.annotator.audio.isPaused);
  const {
    focusedResultID,
    results
  } = useAppSelector(state => state.annotator)
  const dispatch = useAppDispatch();
  const toast = useToast();

  // Ref
  const _isPaused = useRef<boolean>(isPaused)
  useEffect(() => {
    _isPaused.current = isPaused
  }, [ isPaused ]);

  // Services
  useEffect(() => {
    KEY_DOWN_EVENT.add(onKbdEvent)
    return () => {
      KEY_DOWN_EVENT.remove(onKbdEvent)
    }
  }, []);

  // Methods

  function onKbdEvent(event: KeyboardEvent) {
    if (event.code === 'Space') {
      event.preventDefault();
      playPause(results?.find(r => r.id === focusedResultID));
    }
  }

  function seek(time: number | null) {
    if (!player.current || time === null) return;
    player.current.currentTime = time;
    dispatch(setTime(time))
  }

  function play(annotation?: AnnotationResult) {
    if (annotation && player.current) {
      seek(annotation.start_time)
      dispatch(setStopTime(annotation.end_time ?? undefined))
    }
    player.current?.play().catch(e => {
      toast.presentError(`Audio failed playing: ${ e }`)
    });
  }

  function pause() {
    player.current?.pause();
  }

  function _setPlaybackRate(playbackRate?: number) {
    const rate = playbackRate ?? 1.0;
    if (player.current) player.current.playbackRate = rate;
    dispatch(setAudioSpeed(rate))
  }

  function playPause(annotation?: AnnotationResult) {
    try {
      if (_isPaused.current) play(annotation);
      else pause();
    } catch (e) {
      console.warn(e);
    }
  }

  return { seek, play, pause, setAudioSpeed: _setPlaybackRate, playPause }
}