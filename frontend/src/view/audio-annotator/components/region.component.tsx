import React, { Fragment, MutableRefObject, useEffect, useMemo, useState } from 'react'
import { DEFAULT_COLOR } from "@/consts/colors.const.tsx";
import { useAppDispatch, useAppSelector } from '@/service/app';
import { useAudioService } from "@/services/annotator/audio.service.ts";
import { AnnotationResult } from '@/service/campaign/result';
import { focusResult, removeResult } from '@/service/annotator';
import { ScaleMapping } from '@/service/dataset/spectrogram-configuration/scale';
import { useAnnotator } from "@/service/annotator/hook.ts";

// Component dimensions constants
const HEADER_HEIGHT: number = 18;
const HEADER_MARGIN: number = 3;

type RegionProps = {
  annotation: AnnotationResult,
  yAxis: MutableRefObject<ScaleMapping | null>;
  xAxis: MutableRefObject<ScaleMapping | null>;
  audioPlayer: MutableRefObject<HTMLAudioElement | null>;
};


export const Region: React.FC<RegionProps> = ({
                                                annotation,
                                                yAxis, xAxis,
                                                audioPlayer
                                              }) => {
  const {
    campaign,
  } = useAnnotator();

  const {
    labelColors,
    focusedResultID,
    userPreferences
  } = useAppSelector(state => state.annotator);
  const dispatch = useAppDispatch()

  const audioService = useAudioService(audioPlayer);

  const [ left, setLeft ] = useState<number>(0);
  const [ top, setTop ] = useState<number>(0);
  const [ width, setWidth ] = useState<number>(0);
  const [ height, setHeight ] = useState<number>(0);
  const [ headerIsOnTop, setHeaderIsOnTop ] = useState<boolean>(true);

  // Recalc time position
  useEffect(() => {
    if (annotation.start_time === null || annotation.end_time === null) return;
    setLeft(xAxis.current?.valueToPosition(Math.min(annotation.start_time, annotation.end_time)) ?? 0);
    setWidth(xAxis.current?.valuesToPositionRange(annotation.start_time, annotation.end_time) ?? 0);
  }, [ xAxis.current, annotation.start_time, annotation.end_time ])

  // Recalc frequency position
  useEffect(() => {
    if (annotation.start_frequency === null || annotation.end_frequency === null) return;
    const top = yAxis.current?.valueToPosition(Math.max(annotation.start_frequency, annotation.end_frequency)) ?? 0
    setTop(top);
    setHeight(yAxis.current?.valuesToPositionRange(annotation.start_frequency, annotation.end_frequency) ?? 0);
    setHeaderIsOnTop(top > HEADER_HEIGHT + HEADER_MARGIN)
  }, [ yAxis.current, annotation.start_frequency, annotation.end_frequency, userPreferences.spectrogramConfigurationID, ])

  const color = useMemo(() => labelColors[annotation.label] ?? DEFAULT_COLOR, [ labelColors, annotation.label ])
  const isActive = useMemo(() => annotation.id === focusedResultID, [ annotation.id, focusedResultID ])


  const bodyRegion = useMemo(() => <div className="region-body"
                                        style={ {
                                          borderColor: color,
                                          height
                                        } }></div>, [ color, height ])

  if (annotation.type !== 'Box') return <Fragment/>
  return (
    <div className={ "region " + (isActive ? 'active' : '') }
         style={ {
           left,
           top: top - (headerIsOnTop ? (HEADER_HEIGHT + HEADER_MARGIN) : 0),
           width,
           height: height + HEADER_HEIGHT + HEADER_MARGIN,
         } }>

      { !headerIsOnTop && bodyRegion }

      <p className="d-flex region-header"
         style={ {
           borderColor: color,
           height: HEADER_HEIGHT,
           marginTop: (headerIsOnTop ? 0 : HEADER_MARGIN),
           marginBottom: (headerIsOnTop ? HEADER_MARGIN : 0),
           backgroundColor: color,
         } }>

        <button className="btn-simple fa fa-play-circle text-white"
                onClick={ () => audioService.play(annotation) }></button>

        <span className="flex-fill text-center"
              onClick={ () => dispatch(focusResult(annotation.id)) }
              style={ { height: HEADER_HEIGHT } }>
          { annotation.label }
        </span>

        { annotation.comments.length > 0 ?
          <i className="fas fa-comment mr-2"></i> :
          <i className="far fa-comment mr-2"></i> }

        { campaign?.usage === 'Create' && <button className="btn-simple fa fa-times-circle text-white"
                                                  onClick={ () => dispatch(removeResult(annotation.id)) }></button> }
      </p>

      { headerIsOnTop && bodyRegion }

    </div>
  );
}
