import React, { useEffect, useRef, useState, Fragment } from 'react';
import OverlayTrigger from "react-bootstrap/OverlayTrigger";
import Tooltip from "react-bootstrap/Tooltip";
import { useHistory, useParams } from 'react-router-dom';
import { IonButton, IonIcon, IonSpinner } from "@ionic/react";
import { downloadOutline, helpCircle, informationCircle, pause, play } from "ionicons/icons";

import { buildErrorMessage, formatTimestamp } from "@/services/utils/format.tsx";
import { useAnnotationTaskAPI, useUsersAPI } from "@/services/api";
import { Annotation, AnnotationComment } from "@/types/annotations.ts";
import { ANNOTATOR_GUIDE_URL } from "@/consts/links.ts";
import { useAppDispatch, useAppSelector } from "@/slices/app";
import { initAnnotator } from "@/slices/annotator/global-annotator.ts";
import { initAnnotations } from "@/slices/annotator/annotations.ts";
import { initSpectro } from "@/slices/annotator/spectro.ts";
import { OsmoseBarComponent } from "@/view/global-components/osmose-bar/osmose-bar.component.tsx";

import { Toast } from "../global-components";
import { AudioPlayer, AudioPlayerComponent } from './components/audio-player.component.tsx';
import { SpectrogramRender } from "./components/spectro-render.component.tsx";
import { Workbench } from './components/workbench.component.tsx';
import { CommentBloc } from "./components/bloc/comment-bloc.component.tsx";
import { AnnotationList } from "./components/bloc/annotation-list.component.tsx";
import { PresenceBloc } from "./components/bloc/presence-bloc.component.tsx";
import { ConfidenceIndicatorBloc } from "./components/bloc/confidence-indicator-bloc.component.tsx";
import { LabelListBloc } from "./components/bloc/label-list-bloc.component.tsx";
import { CurrentAnnotationBloc } from "./components/bloc/current-annotation-bloc.component.tsx";
import { NavigationButtons, NavigationShortcutOverlay } from "./components/navigation-buttons.component.tsx";

import '../../css/annotator.css';


// Playback rates
const AVAILABLE_RATES: Array<number> = [0.25, 0.5, 1.0, 1.5, 2.0, 3.0, 4.0];

export type SpectroUrlsParams = {
  nfft: number,
  winsize: number,
  overlap: number,
  urls: Array<string>,
};

export type AnnotationDto = {
  id?: number,
  annotation: string,
  startTime: number | null,
  endTime: number | null,
  startFrequency: number | null,
  endFrequency: number | null,
  confidenceIndicator?: string,
  result_comments: Array<AnnotationComment>,
};


export type ConfidenceIndicator = {
  id: number,
  label: string,
  level: number,
  isDefault: boolean,
};

export type ConfidenceIndicatorSet = {
  id: number,
  name: string,
  desc: string,
  confidence_indicators: Array<ConfidenceIndicator>,
};

export type AnnotationTask = {
  id: number,
  labels: Array<string>,
  confidenceIndicatorSet?: ConfidenceIndicatorSet,
  taskComment: Array<AnnotationComment>,
  boundaries: TaskBoundaries,
  audioRate: number,
  audioUrl: string,
  spectroUrls: Array<SpectroUrlsParams>,
  prevAnnotations: Array<AnnotationDto>,
  campaignId: number,
  instructions_url?: string,
  annotationScope: number,
  prevAndNextAnnotation: {
    prev: number | string,
    next: number | string,
  },
};

export interface TaskBoundaries {
  startTime: Date,
  endTime: Date,
  startFrequency: number,
  endFrequency: number,
}

export interface KeypressHandler {
  handleKeyPressed: (event: KeyboardEvent) => void;
}


export const AudioAnnotator: React.FC = () => {
  const { id: taskID } = useParams<{ id: string }>();

  const navKeyPress = useRef<KeypressHandler | null>(null);
  const labelsKeyPress = useRef<KeypressHandler | null>(null);
  const spectrogramRender = useRef<SpectrogramRender | null>(null);

  const _areShortcutsEnabled = useRef<boolean>(false);

  const [isLoading, setIsLoading] = useState<boolean>();
  const [error, setError] = useState<string | undefined>();
  const [start, setStart] = useState<Date>(new Date());
  const [isUserStaff, setIsUserStaff] = useState<boolean>(false);
  const [isLoadingSpectroDL, setIsLoadingSpectroDL] = useState<boolean>();

  const [canChangePlaybackRate, setCanChangePlaybackRate] = useState<boolean>(false);

  const taskAPI = useAnnotationTaskAPI();
  const userAPI = useUsersAPI();
  const history = useHistory()

  const {
    areShortcutsEnabled,
    instructionsURL,
    campaignId,
    taskId,
    mode,
    toast,
    audioURL,
  } = useAppSelector(state => state.annotator.global);
  const {
    focusedResult,
    wholeFileBoundaries,
  } = useAppSelector(state => state.annotator.annotations);
  const {
    time,
    playbackRate,
    isPaused,
  } = useAppSelector(state => state.annotator.audio);
  const zoom = useAppSelector(state => state.annotator.spectro.currentZoom);
  const dispatch = useAppDispatch();

  const audioPlayerRef = useRef<AudioPlayer>(null);

  useEffect(() => {
    document.addEventListener("keydown", e => handleKeyPressed(e));

    return () => {
      document.removeEventListener("keydown", handleKeyPressed);
    }
  }, [])

  useEffect(() => {
    let isCancelled = false;
    setIsLoading(true);
    setStart(new Date());
    setError(undefined);

    Promise.all([
      taskAPI.retrieve(taskID),
      userAPI.isStaff()
    ])
      .then(([task, isStaff]) => {
        if (isCancelled) return;
        if (task.labels.length < 1) return setError('Label set is empty');
        if (task.spectroUrls.length < 1) return setError('Cannot retrieve spectrograms');

        dispatch(initSpectro(task))
        dispatch(initAnnotations(task))
        dispatch(initAnnotator(task))

        setError(undefined);
        setIsUserStaff(isStaff);
      })
      .catch((e: any) => !isCancelled && setError(buildErrorMessage(e)))
      .finally(() => !isCancelled && setIsLoading(false))

    return () => {
      isCancelled = true;
      taskAPI.abort();
    }
  }, [taskID])

  useEffect(() => {
    _areShortcutsEnabled.current = areShortcutsEnabled
  }, [areShortcutsEnabled])

  const handleKeyPressed = (event: KeyboardEvent) => {
    if (!_areShortcutsEnabled.current) return;

    switch (event.code) {
      case 'Space':
        event.preventDefault();
        playPause(focusedResult);
    }
    navKeyPress.current?.handleKeyPressed(event);
    labelsKeyPress.current?.handleKeyPressed(event);
  }

  const playPause = (annotation?: Annotation) => {
    try {
      if (isPaused) audioPlayerRef.current?.play(annotation);
      else audioPlayerRef.current?.pause();
    } catch (e) {
      console.warn(e);
    }
  }

  const openGuide = () => {
    window.open(ANNOTATOR_GUIDE_URL, "_blank", "noopener, noreferrer")
  }

  const openInstructions = () => {
    if (!instructionsURL) return;
    window.open(instructionsURL, "_blank", "noopener, noreferrer")
  }

  const goBack = () => {
    history.push(`/annotation_tasks/${ campaignId }`)
  }

  const downloadAudio = () => {
    if (!audioURL) return;
    const link = document.createElement('a');
    link.href = audioURL;
    link.target = '_blank';
    const pathSplit = audioURL.split('/')
    link.download = pathSplit[pathSplit.length - 1];
    link.click();
  }

  const downloadSpectro = async () => {
    if (!audioURL) return;
    const link = document.createElement('a');
    setIsLoadingSpectroDL(true);
    console.debug('downloadSpectro', spectrogramRender.current)
    const data = await spectrogramRender.current?.getCanvasData().catch(e => {
      console.warn(e);
      setIsLoadingSpectroDL(false)
    });
    if (!data) return;
    link.href = data;
    link.target = '_blank';
    let pathSplit = audioURL.split('/')
    pathSplit = pathSplit[pathSplit.length - 1].split('.');
    pathSplit.pop(); // Remove audio file extension
    const filename = pathSplit.join('.');
    link.download = `${ filename }-x${ zoom }.png`;
    link.click();
    setIsLoadingSpectroDL(false);
  }

  if (isLoading) return <p>Loading...</p>;
  else if (error) return <p>Error while loading task: <code>{ error }</code></p>
  else if (!taskId) return <p>Unknown error while loading task.</p>

  // Rendering
  return (
    <div id="aplose-annotator" className="annotator container-fluid ps-0">

      {/* Header */ }
      <div id="header">
        <h1>APLOSE</h1>

        <div className="buttons">
          { isUserStaff && <Fragment>
              <IonButton color="dark"
                         fill={ "outline" }
                         onClick={ downloadAudio }>
                  <IonIcon icon={ downloadOutline } slot="start"/>
                  Download audio
              </IonButton>

              <IonButton color="dark"
                         fill={ "outline" }
                         onClick={ downloadSpectro }>
                  <IonIcon icon={ downloadOutline } slot="start"/>
                  Download spectrogram (zoom x{ zoom })
                { isLoadingSpectroDL && <IonSpinner/> }
              </IonButton>
          </Fragment>}

          <IonButton color="dark"
                     fill={ "outline" }
                     onClick={ openGuide }>
            <IonIcon icon={ helpCircle } slot="start"/>
            Annotator user guide
          </IonButton>

          { instructionsURL && <IonButton color="dark"
                                          fill={ "outline" }
                                          onClick={ openInstructions }>
              <IonIcon icon={ informationCircle } slot="start"/>
              Campaign instructions
          </IonButton> }
        </div>

        <IonButton color="danger"
                   onClick={ goBack }
                   title="Go back to annotation campaign tasks">
          Back to campaign
        </IonButton>
      </div>

      {/* Audio player (hidden) */ }
      <AudioPlayerComponent ref={ ref => {
        // @ts-ignore
        audioPlayerRef.current = ref;
        console.debug()
        setCanChangePlaybackRate(!!ref?.canPreservePitch)
      } }/>

      {/* Workbench (spectrogram viz, box drawing) */ }
      <Workbench audioPlayer={ audioPlayerRef.current } ref={ spectrogramRender }/>

      {/* Toolbar (play button, play speed, submit button, timer) */ }
      <div className="row annotator-controls">
        <div className="col-sm-1 d-flex justify-content-end">
          <OverlayTrigger
            overlay={ <Tooltip><NavigationShortcutOverlay shortcut="Space" description="Play/Pause audio"/></Tooltip> }>
            <IonButton color={ "primary" }
                       shape={ "round" }
                       onClick={ () => playPause() }>
              { isPaused && <IonIcon icon={ play } slot={ "icon-only" }/> }
              { !isPaused && <IonIcon icon={ pause } slot={ "icon-only" }/> }
            </IonButton>
          </OverlayTrigger>
        </div>
        <p className="col-sm-1">
          { canChangePlaybackRate &&
              <select className="form-control select-rate"
                      defaultValue={ playbackRate }
                      onChange={ e => audioPlayerRef.current?.setPlaybackRate(+e.target.value) }>
                { AVAILABLE_RATES.map(rate => (
                  <option key={ `rate-${ rate }` } value={ rate.toString() }>{ rate.toString() }x</option>
                )) }
              </select>
          }
        </p>

        <NavigationButtons ref={ navKeyPress } start={ start }/>

        <div className="col-sm-3">
          {/* FIXME: avoid line expansion due to toasts -> absolute IonToast*/ }
          <Toast toastMessage={ toast }/>
        </div>
        <p className="col-sm-2 text-right">
          { formatTimestamp(time) }
          &nbsp;/&nbsp;
          { formatTimestamp(wholeFileBoundaries.duration) }
        </p>
      </div>

      {/* Label and annotations management */ }
      { mode === 'Create' && <div className="row justify-content-around m-2">
          <CurrentAnnotationBloc/>

          <div className="col-5 flex-shrink-2">
              <LabelListBloc/>

              <ConfidenceIndicatorBloc/>
          </div>

          <PresenceBloc ref={ labelsKeyPress }/>
      </div> }


      <div className="row justify-content-center">
        <AnnotationList/>

        <CommentBloc/>
      </div>

      <div className="row justify-content-center">
        <OsmoseBarComponent/>
      </div>
    </div>
  );
}
