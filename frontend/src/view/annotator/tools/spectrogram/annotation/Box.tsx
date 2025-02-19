import React, { Fragment, MutableRefObject, useEffect, useMemo, useRef, useState } from 'react'
import { useAppDispatch, useAppSelector } from '@/service/app';
import { useAudioService } from "@/services/annotator/audio.service.ts";
import { AnnotationResult } from '@/service/campaign/result';
import { focusResult, removeResult, updateFocusResultBounds } from '@/service/annotator';
import { IoChatbubbleEllipses, IoChatbubbleOutline, IoPlayCircle, IoTrashBin } from "react-icons/io5";
import { useAnnotator } from "@/service/annotator/hook.ts";
import styles from '../../annotator-tools.module.scss'
import { ExtendedDiv } from '@/components/ui/ExtendedDiv';
import { useAxis } from '@/service/annotator/spectrogram/scale';
import { AbstractScale } from "@/service/dataset/spectrogram-configuration/scale";

type RegionProps = {
  annotation: AnnotationResult,
  audioPlayer: MutableRefObject<HTMLAudioElement | null>;
};


export const Box: React.FC<RegionProps> = ({
                                             annotation,
                                             audioPlayer
                                           }) => {
  // Data
  const { label_set, campaign } = useAnnotator();
  const { focusedResultID } = useAppSelector(state => state.annotator);
  const dispatch = useAppDispatch();

  // Scales
  const { xAxis, yAxis } = useAxis()
  const _xAxis = useRef<AbstractScale>(xAxis);
  const _yAxis = useRef<AbstractScale>(yAxis);
  useEffect(() => {
    _xAxis.current = xAxis;
  }, [ xAxis ]);
  useEffect(() => {
    _yAxis.current = yAxis;
  }, [ yAxis ]);

  // Annotation time/freq bounds
  const _start_time = useRef<number | null>(annotation.start_time);
  const _end_time = useRef<number | null>(annotation.end_time);
  const _start_frequency = useRef<number | null>(annotation.start_frequency);
  const _end_frequency = useRef<number | null>(annotation.end_frequency);
  useEffect(() => {
    _start_time.current = annotation.start_time;
    _end_time.current = annotation.end_time;
    _start_frequency.current = annotation.start_frequency;
    _end_frequency.current = annotation.end_frequency;
  }, [ annotation.start_time, annotation.end_time, annotation.start_frequency, annotation.end_frequency ]);

  // Coords bounds
  const _left = useRef<number>(0);
  const _width = useRef<number>(0);
  const _top = useRef<number>(0);
  const _height = useRef<number>(0);

  // State
  const [ left, setLeft ] = useState<number>(0);
  const [ width, setWidth ] = useState<number>(0);
  const [ top, setTop ] = useState<number>(0);
  const [ height, setHeight ] = useState<number>(0);

  // Updates
  useEffect(() => {
    updateLeft()
    updateWidth()
    updateTop()
    updateHeight()
  }, []);
  useEffect(() => updateLeft, [ _xAxis.current, _start_time.current ]);
  useEffect(() => updateWidth, [ _xAxis.current, _start_time.current, _end_time.current ]);
  useEffect(() => updateTop, [ _yAxis.current, _end_frequency.current ]);
  useEffect(() => updateHeight, [ _yAxis.current, _start_frequency.current, _end_frequency.current ]);
  useEffect(() => setTop(_top.current), [ _top.current ]);
  useEffect(() => setHeight(_height.current), [ _height.current ]);
  useEffect(() => setLeft(_left.current), [ _left.current ]);
  useEffect(() => setWidth(_width.current), [ _width.current ]);

  // Memo
  const colorClassName: string = useMemo(() => label_set ? `ion-color-${ label_set.labels.indexOf(annotation.label) }` : '', [ label_set, annotation.label ]);
  const isActive = useMemo(() => annotation.id === focusedResultID, [ annotation.id, focusedResultID ]);

  // Service
  const audioService = useAudioService(audioPlayer);

  function updateLeft() {
    if (_start_time.current === null) return;
    _left.current = _xAxis.current.valueToPosition(_start_time.current);
  }

  function updateTop() {
    if (_end_frequency.current === null) return;
    _top.current = _yAxis.current.valueToPosition(_end_frequency.current);
  }

  function updateWidth() {
    if (_start_time.current === null || _end_time.current === null) return;
    _width.current = _xAxis.current.valuesToPositionRange(_start_time.current, _end_time.current);
  }

  function updateHeight() {
    if (_start_frequency.current === null || _end_frequency.current === null) return;
    _height.current = _yAxis.current.valuesToPositionRange(_start_frequency.current, _end_frequency.current);
  }

  function onTopMove(movement: number) {
    _top.current += movement;
  }

  function onHeightMove(movement: number) {
    _height.current += movement;
  }

  function onLeftMove(movement: number) {
    _left.current += movement;
  }

  function onWidthMove(movement: number) {
    _width.current += movement;
  }

  function onValidateMove() {
    dispatch(updateFocusResultBounds({
      end_frequency: _yAxis.current.positionToValue(_top.current),
      start_frequency: _yAxis.current.positionToValue(_top.current + _height.current),
      start_time: _xAxis.current.positionToValue(_left.current),
      end_time: _xAxis.current.positionToValue(_left.current + _width.current),
    }))
  }

  if (top === null || left === null || height === null || width === null) return <Fragment/>
  return <ExtendedDiv resizable={ isActive && campaign?.usage === 'Create' }
                      top={ top } height={ height }
                      left={ left } width={ width }
                      onUp={ onValidateMove }
                      onTopMove={ onTopMove } onHeightMove={ onHeightMove }
                      onLeftMove={ onLeftMove } onWidthMove={ onWidthMove }
                      className={ [ colorClassName, isActive ? '' : 'disabled' ].join(' ') }>

    <ExtendedDiv draggable={ isActive && campaign?.usage === 'Create' }
                 onTopMove={ onTopMove } onLeftMove={ onLeftMove }
                 onUp={ onValidateMove }
                 top={ top < 24 ? 24 : -8 }
                 className={ [ styles.boxTitle, colorClassName, campaign?.usage === 'Create' ? styles.canBeRemoved : '' ].join(' ') }
                 innerClassName={ styles.inner }
                 onClick={ () => dispatch(focusResult(annotation.id)) }>

      <IoPlayCircle className={ styles.button } onClick={ () => audioService.play(annotation) }/>

      <p>{ annotation.label }</p>

      { annotation.comments.length > 0 ?
        <IoChatbubbleEllipses/> :
        <IoChatbubbleOutline className={ styles.outlineIcon }/> }

      {/* 'remove-box' class is for playwright tests*/ }
      { campaign?.usage === 'Create' && (
        <IoTrashBin className={ [ styles.button, styles.delete, 'remove-box' ].join(' ') }
                    onClick={ () => dispatch(removeResult(annotation.id)) }/>
      ) }

    </ExtendedDiv>

  </ExtendedDiv>
}
