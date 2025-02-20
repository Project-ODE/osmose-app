import React, { MutableRefObject, useEffect, useMemo, useRef, useState } from 'react';
import { ExtendedDiv } from '@/components/ui/ExtendedDiv';
import { useAnnotator } from '@/service/annotator/hook.ts';
import { useAxis } from '@/service/annotator/spectrogram/scale';
import { AbstractScale } from '@/service/dataset/spectrogram-configuration/scale';
import { PointResult } from '@/service/campaign/result';
import { updateFocusResultBounds } from '@/service/annotator';
import { useAppDispatch, useAppSelector } from '@/service/app.ts';
import { AnnotationHeader } from '@/view/annotator/tools/spectrogram/annotation/Headers.tsx';
import styles from '../../annotator-tools.module.scss'

export const Point: React.FC<{
  annotation: PointResult
  audioPlayer: MutableRefObject<HTMLAudioElement | null>;
}> = ({ annotation, audioPlayer }) => {
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
  const _start_frequency = useRef<number | null>(annotation.start_frequency);
  useEffect(() => {
    _start_time.current = annotation.start_time;
    _start_frequency.current = annotation.start_frequency;
  }, [ annotation.start_time, annotation.start_frequency ]);


  // Coords bounds
  const _left = useRef<number>(0);
  const _top = useRef<number>(0);

  // State
  const [ left, setLeft ] = useState<number>(0);
  const [ top, setTop ] = useState<number>(0);

  // Updates
  useEffect(() => {
    updateLeft()
    updateTop()
  }, []);
  useEffect(() => updateLeft, [ _xAxis.current, _start_time.current ]);
  useEffect(() => updateTop, [ _yAxis.current, _start_frequency.current ]);
  useEffect(() => setTop(_top.current), [ _top.current ]);
  useEffect(() => setLeft(_left.current), [ _left.current ]);

  // Memo
  const colorClassName: string = useMemo(() => label_set ? `ion-color-${ label_set.labels.indexOf(annotation.label) }` : '', [ label_set, annotation.label ]);
  const isActive = useMemo(() => annotation.id === focusedResultID, [ annotation.id, focusedResultID ]);

  function updateLeft() {
    if (_start_time.current === null) return;
    _left.current = _xAxis.current.valueToPosition(_start_time.current);
  }

  function updateTop() {
    if (_start_frequency.current === null) return;
    _top.current = _yAxis.current.valueToPosition(_start_frequency.current);
  }

  function onTopMove(movement: number) {
    _top.current += movement;
  }

  function onLeftMove(movement: number) {
    _left.current += movement;
  }

  function onValidateMove() {
    dispatch(updateFocusResultBounds({
      type: 'Point',
      start_time: _xAxis.current.positionToValue(_left.current),
      end_time: null,
      start_frequency: _yAxis.current.positionToValue(_top.current),
      end_frequency: null,
    }))
  }

  return <ExtendedDiv draggable={ isActive && campaign?.usage === 'Create' }
                      top={ top }
                      left={ left }
                      onUp={ onValidateMove }
                      onTopMove={ onTopMove }
                      onLeftMove={ onLeftMove }
                      className={ [ styles.point, colorClassName, isActive ? '' : 'disabled' ].join(' ') }>

    <AnnotationHeader active={ isActive }
                      onTopMove={ onTopMove }
                      onLeftMove={ onLeftMove }
                      onValidateMove={ onValidateMove }
                      top={ top }
                      className={ colorClassName }
                      annotation={ annotation }
                      audioPlayer={ audioPlayer }/>

    <div className={ styles.vertical }/>
    <div className={ styles.horizontal }/>

  </ExtendedDiv>
}