import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useHistory } from 'react-router-dom';

import { useAppSelector } from '@/service/app';

import { AudioPlayerComponent } from './components/audio-player.component.tsx';
import { SpectrogramRender, SpectroRenderComponent } from "./components/spectro-render.component.tsx";
import { CommentBloc } from "./components/bloc/comment-bloc.component.tsx";
import { PresenceBloc } from "./components/bloc/presence-bloc.component.tsx";
import { ConfidenceIndicatorBloc } from "./components/bloc/confidence-indicator-bloc.component.tsx";
import { LabelListBloc } from "./components/bloc/label-list-bloc.component.tsx";
import { CurrentAnnotationBloc } from "./components/bloc/current-annotation-bloc.component.tsx";
import { NavigationButtons } from "./components/navigation-buttons.component.tsx";

import '../../css/annotator.css';
import { PlayPauseButton } from "@/view/audio-annotator/components/buttons/play-pause.tsx";
import { PlaybackRateSelect } from "@/view/audio-annotator/components/select/playback-rate.tsx";
import { AudioDownloadButton } from "@/view/audio-annotator/components/buttons/audio-download.tsx";
import { BackButton } from "@/view/audio-annotator/components/buttons/back.tsx";
import { CampaignInstructionsButton } from "@/view/audio-annotator/components/buttons/campaign-instructions.tsx";
import { SpectrogramDownloadButton } from "@/view/audio-annotator/components/buttons/spectrogram-download.tsx";
import { ResultList } from "@/view/audio-annotator/components/bloc/result-list.component.tsx";
import { SpectrogramConfigurationSelect } from "@/view/audio-annotator/components/select/spectrogram-configuration.tsx";
import { ColormapConfiguration } from '@/view/audio-annotator/components/select/colormap-configuration.tsx';
import { SpectrogramImage } from '@/view/audio-annotator/components/select/spectrogram-image.tsx';
import { ZoomButton } from "@/view/audio-annotator/components/buttons/zoom.tsx";
import { PointerPosition } from "@/view/audio-annotator/components/bloc/pointer-position.component.tsx";
import { WorkbenchInfoBloc } from "@/view/audio-annotator/components/bloc/workbench-info.tsx";
import { getDuration } from '@/service/dataset';
import { useRetrieveAnnotatorQuery } from '@/service/annotator';
import { useToast } from "@/service/ui";
import { getErrorMessage } from '@/service/function.ts';
import { formatTime } from '@/service/dataset/spectrogram-configuration/scale';
import { Footer } from "@/components/layout";
import { DocumentationButton } from "@/components/Buttons/Documentation-button.tsx";
import { IonButton, IonIcon } from "@ionic/react";
import { sparklesSharp } from "ionicons/icons";
import { useAnnotator } from "@/service/annotator/hook.ts";

// Component dimensions constants
export const SPECTRO_CANVAS_HEIGHT: number = 512;
const SPECTRO_CANVAS_WIDTH: number = 1813;
const CONTROLS_AREA_SIZE: number = 80;
const TIME_AXIS_SIZE: number = 30;
const FREQ_AXIS_SIZE: number = 35;
const SCROLLBAR_RESERVED: number = 20;


export const AudioAnnotator: React.FC = () => {
  const {
    campaignID,
    fileID,
    campaign,
    user,
    label_set,
  } = useAnnotator();
  const fileFilters = useAppSelector(state => state.ui.fileFilters)
  const { data: annotatorData, isLoading, error: retrieveError } = useRetrieveAnnotatorQuery({
    ...fileFilters,
    campaignID,
    fileID
  })

  // Service
  const toast = useToast();

  const spectrogramRender = useRef<SpectrogramRender | null>(null);

  const [ error, setError ] = useState<string | undefined>();

  // Ref
  const localIsPaused = useRef<boolean>(true);
  const playerRef = useRef<HTMLAudioElement>(null);

  // Services
  const history = useHistory();

  // Slice
  const audio = useAppSelector(state => state.annotator.audio)
  const duration = useMemo(() => getDuration(annotatorData?.file), [ annotatorData?.file ]);

  useEffect(() => {
    return () => {
      toast.dismiss();
    }
  }, [])
  useEffect(() => {
    toast.dismiss();
  }, [ fileID ])

  useEffect(() => {
    if (retrieveError) setError(getErrorMessage(retrieveError));
  }, [ retrieveError ]);

  useEffect(() => {
    localIsPaused.current = audio.isPaused;
  }, [ audio.isPaused ])

  function tryNewInterface() {
    history.push(`/annotation-campaign/${ campaignID }/file/${ fileID }/new`);
  }

  if (isLoading) return <p>Loading...</p>;
  else if (error) return <p>Error while loading task: <code>{ error }</code></p>
  else if (!label_set || label_set.labels.length === 0) return <p>Error: <code>Label set is empty</code></p>
  else if (!annotatorData?.spectrogram_configurations || annotatorData.spectrogram_configurations.length === 0) return <p>Error: <code>Cannot
    retrieve spectrograms</code></p>
  else if (!annotatorData || annotatorData.file.id !== +fileID) return <p>Unknown error while loading task.</p>

  // Rendering
  return (
    <div id="aplose-annotator" className="annotator container-fluid ps-0">

      {/* Header */ }
      <div id="header">
        <h1>APLOSE</h1>

        <div className="buttons">
          { (user?.is_staff || user?.is_superuser) && <IonButton fill='outline' onClick={ tryNewInterface }>
              Try new annotator
              <IonIcon icon={ sparklesSharp } slot='end'/>
          </IonButton> }
          <DocumentationButton/>
          <CampaignInstructionsButton/>
        </div>

        <BackButton/>
      </div>

      {/* Audio player (hidden) */ }
      <AudioPlayerComponent ref={ playerRef }/>

      {/* Workbench (spectrogram viz, box drawing) */ }
      <div className="workbench rounded"
           style={ {
             height: `${ CONTROLS_AREA_SIZE + SPECTRO_CANVAS_HEIGHT + TIME_AXIS_SIZE + SCROLLBAR_RESERVED }px`,
             width: `${ FREQ_AXIS_SIZE + SPECTRO_CANVAS_WIDTH }px`,
           } }>
        <div className="workbench-controls">
          <SpectrogramConfigurationSelect/>
          <ColormapConfiguration />
          <SpectrogramImage />
          <ZoomButton/>
        </div>

        <PointerPosition/>

        <WorkbenchInfoBloc/>

        <SpectroRenderComponent audioPlayer={ playerRef } ref={ spectrogramRender }/>
      </div>

      {/* Toolbar (play button, play speed, submit button, timer) */ }
      <div className="row align-items-start annotator-controls">
        <div className="col-sm-1 d-flex justify-content-end">
          <PlayPauseButton player={ playerRef }/>
        </div>
        <p className="col-sm-1">
          <PlaybackRateSelect player={ playerRef }/>
        </p>

        <NavigationButtons/>

        <div className="col-sm-3"></div>
        <p className="col-sm-2 text-right">
          { formatTime(audio.time) }
          &nbsp;/&nbsp;
          { formatTime(duration) }
        </p>
      </div>

      { annotatorData?.is_assigned && <div>
        {/* Label and annotations management */ }
        { campaign?.usage === 'Create' && <div className="row justify-content-around m-2">
            <CurrentAnnotationBloc/>

            <div className="col-5 flex-shrink-2">
                <LabelListBloc/>

                <ConfidenceIndicatorBloc/>
            </div>

            <PresenceBloc/>
        </div> }

          <div className="row justify-content-center">
              <ResultList/>
              <CommentBloc/>
          </div>

          <div className="justify-content-center buttons">
              <AudioDownloadButton/>
              <SpectrogramDownloadButton render={ spectrogramRender }/>
          </div>
      </div> }
      { !annotatorData?.is_assigned && <div/> }

      <Footer/>
    </div>
  );
}
