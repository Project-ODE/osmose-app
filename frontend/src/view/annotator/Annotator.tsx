import React, { Fragment, useEffect, useRef } from "react";
import styles from './annotator.module.scss';
import { useRetrieveAnnotatorQuery } from "@/service/annotator";
import { IonSpinner } from "@ionic/react";
import { FadedText, WarningText } from "@/components/ui";
import { getErrorMessage } from "@/service/function.ts";
import { AudioPlayer } from "@/view/annotator/tools/AudioPlayer.tsx";
import { AudioDownloadButton } from "@/view/annotator/tools/buttons/AudioDownload.tsx";
import { useAppSelector } from "@/service/app.ts";
import { formatTime } from "@/service/dataset/spectrogram-configuration/scale";
import { NFFTSelect } from "@/view/annotator/tools/select/NFFTSelect.tsx";
import { ZoomButton } from "@/view/annotator/tools/buttons/Zoom.tsx";
import { SpectrogramRender } from "@/view/annotator/tools/spectrogram/SpectrogramRender.tsx";
import { SpectrogramDownloadButton } from "@/view/annotator/tools/buttons/SpectrogramDownload.tsx";
import { PlayPauseButton } from "@/view/annotator/tools/buttons/PlayPause.tsx";
import { NavigationButtons } from "@/view/annotator/tools/buttons/Navigation.tsx";
import { PresenceAbsence } from "@/view/annotator/tools/bloc/PresenceAbsence.tsx";
import { LabelList } from "@/view/annotator/tools/bloc/LabelList.tsx";
import { CurrentAnnotation } from "@/view/annotator/tools/bloc/CurrentAnnotation.tsx";
import { Comment } from "@/view/annotator/tools/bloc/Comment.tsx";
import { ConfidenceIndicator } from "@/view/annotator/tools/bloc/ConfidenceIndicator.tsx";
import { Results } from "@/view/annotator/tools/bloc/Results.tsx";
import { PlaybackRateSelect } from "@/view/annotator/tools/select/PlaybackRate.tsx";
import { useToast } from "@/service/ui";
import { useAnnotator } from "@/service/annotator/hook.ts";
import { useFileDuration } from '@/service/annotator/spectrogram';

export const Annotator: React.FC = () => {
  const {
    campaignID,
    fileID,
    campaign,
  } = useAnnotator();
  const fileFilters = useAppSelector(state => state.ui.fileFilters)
  const { isFetching, error, data: annotatorData } = useRetrieveAnnotatorQuery({
    ...fileFilters,
    campaignID,
    fileID
  })

  // State
  const pointerPosition = useAppSelector(state => state.annotator.ui.pointerPosition);
  const audio = useAppSelector(state => state.annotator.audio)
  const duration = useFileDuration();

  // Refs
  const localIsPaused = useRef<boolean>(true);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);
  const spectrogramRenderRef = useRef<SpectrogramRender | null>(null);

  // Services
  const toast = useToast();

  useEffect(() => {

    return () => {
      toast.dismiss();
    }
  }, [])

  useEffect(() => {
    localIsPaused.current = audio.isPaused;
  }, [ audio.isPaused ])

  return <div className={ styles.annotator }>

    { isFetching && <IonSpinner/> }
    { error && <WarningText>{ getErrorMessage(error) }</WarningText> }

    <AudioPlayer ref={ audioPlayerRef }/>

    { !isFetching && annotatorData && <Fragment>
        <div className={ styles.spectrogramContainer }>
            <div className={ styles.spectrogramData }>
                <div className={ styles.spectrogramInfo }>
                    <NFFTSelect/>
                    <ZoomButton/>
                </div>

                <div className={ styles.pointerInfo }>
                  { pointerPosition && <Fragment>
                      <FadedText>Pointer</FadedText>
                      <p>{ pointerPosition.frequency.toFixed(2) }Hz
                          / { formatTime(pointerPosition.time, duration < 60) }</p>

                  </Fragment> }
                </div>

                <div className={ styles.campaignInfo }>
                    <div>
                        <FadedText>Sampling:</FadedText>
                        <p>{ annotatorData.file.dataset_sr }Hz</p>
                    </div>
                    <div>
                        <FadedText>Date:</FadedText>
                        <p>{ new Date(annotatorData.file.start).toLocaleString() }</p>
                    </div>
                </div>
            </div>

            <SpectrogramRender ref={ spectrogramRenderRef } audioPlayer={ audioPlayerRef }/>

            <div className={ styles.spectrogramNavigation }>
                <div className={ styles.audioNavigation }>
                    <PlayPauseButton player={ audioPlayerRef }/>
                    <PlaybackRateSelect player={ audioPlayerRef }/>
                </div>

                <NavigationButtons/>

                <p>{ formatTime(audio.time, duration < 60) }&nbsp;/&nbsp;{ formatTime(duration) }</p>
            </div>
        </div>

        <div
            className={ [ styles.blocContainer, campaign?.usage === 'Check' ? styles.check : styles.create ].join(' ') }>
          { annotatorData?.is_assigned && campaign?.usage === 'Create' && <Fragment>
              <CurrentAnnotation/>
              <PresenceAbsence/>
              <LabelList/>
              <Comment/>
              <Results/>
              <ConfidenceIndicator/>
          </Fragment> }
          { annotatorData?.is_assigned && campaign?.usage === 'Check' && <Fragment>
              <CurrentAnnotation/>
              <Comment/>
              <Results/>
          </Fragment> }
        </div>

        <div className={ styles.downloadButtons }>
            <AudioDownloadButton/>
            <SpectrogramDownloadButton render={ spectrogramRenderRef }/>
        </div>
    </Fragment> }

  </div>
}