import React, { Fragment, MouseEvent, useEffect, useMemo, useRef, useState } from 'react';
import { useAppDispatch } from '@/service/app.ts';
import { focusPresence, updateCurrentResultAcousticFeatures, updateFocusResultBounds } from '@/service/annotator';
import { Table, TableContent, TableDivider, TableHead } from '@/components/table/table.tsx';
import { Input, Select } from '@/components/form';
import { IonButton, IonCheckbox, IonIcon, IonNote } from '@ionic/react';
import { IoRemoveCircleOutline } from 'react-icons/io5';
import styles from './bloc.module.scss';
import { useAnnotator } from "@/service/annotator/hook.ts";
import { createOutline } from 'ionicons/icons';
import { ExtendedDiv } from '@/components/ui/ExtendedDiv';
import { CLICK_EVENT } from '@/service/events';
import { usePointerService } from '@/service/annotator/spectrogram/pointer/';
import { useCurrentAnnotation, useFileDuration, useMaxFrequency } from '@/service/annotator/spectrogram';
import { SignalTrends } from '@/service/campaign/result';
import { Item } from '@/types/item.ts';
import { useXAxis } from '@/service/annotator/spectrogram/scale';

export const AcousticFeatures: React.FC = () => {
  const {
    annotatorData,
    campaign,
  } = useAnnotator();
  const xAxis = useXAxis();

  const initialLeft = useMemo(() => window.innerWidth - 500, [])

  const [ top, setTop ] = useState<number>(128);
  const _top = useRef<number>(128);
  const [ left, setLeft ] = useState<number>(initialLeft);
  const _left = useRef<number>(initialLeft);

  useEffect(() => {
    setTop(_top.current)
  }, [ _top.current ]);
  useEffect(() => {
    setLeft(_left.current)
  }, [ _left.current ]);

  const fileDuration = useFileDuration();
  const dispatch = useAppDispatch();

  const { annotation, duration } = useCurrentAnnotation()
  const maxFrequency = useMaxFrequency();

  useEffect(() => {
    if (!annotation?.end_time) return;
    const newLeft = xAxis.valueToPosition(annotation.end_time) + 80;
    _left.current = newLeft;
    setLeft(newLeft);
  }, [ annotation?.id ]);

  function setBad() {
    dispatch(updateCurrentResultAcousticFeatures(null));
  }

  function setGood() {
    if (annotation?.acoustic_features) return;
    dispatch(updateCurrentResultAcousticFeatures({}));
  }

  function updateMinFrequency(value: number) {
    if (annotation?.type !== 'Box') return;
    if (annotatorData) value = Math.min(value, annotatorData.file.dataset_sr)
    value = Math.max(value, 0)
    dispatch(updateFocusResultBounds({
      type: annotation.type,
      start_frequency: value,
      end_frequency: Math.max(annotation.end_frequency ?? 0, value),
      start_time: annotation.start_time,
      end_time: annotation.end_time,
    }))
  }

  function updateMaxFrequency(value: number) {
    if (annotation?.type !== 'Box') return;
    if (annotatorData) value = Math.min(value, annotatorData.file.dataset_sr)
    value = Math.max(value, 0)
    dispatch(updateFocusResultBounds({
      type: annotation.type,
      start_frequency: Math.min(annotation.start_frequency ?? 0, value),
      end_frequency: value,
      start_time: annotation.start_time,
      end_time: annotation.end_time,
    }))
  }

  function updateDuration(value: number) {
    if (annotation?.type !== 'Box') return;
    if (duration) value = Math.min(value, fileDuration)
    value = Math.max(value, 0)
    dispatch(updateFocusResultBounds({
      type: annotation.type,
      start_frequency: annotation.start_frequency,
      end_frequency: annotation.end_frequency,
      start_time: annotation.start_time,
      end_time: annotation.start_time + value,
    }))
  }

  function onTopMove(move: number) {
    setTop(prev => {
      _top.current = prev + move
      return prev + move
    })
  }

  function onLeftMove(move: number) {
    setLeft(prev => {
      _left.current = prev + move
      return prev + move
    })
  }

  if (!annotation) return;
  if (!campaign?.labels_with_acoustic_features.includes(annotation.label)) return;
  if (annotation.type !== 'Box') return;
  return <div style={ { top, left } }
              className={ [ styles.bloc, styles.features ].join(' ') }
              onMouseDown={ e => e.stopPropagation() }>
    <ExtendedDiv draggable={ true } onTopMove={ onTopMove } onLeftMove={ onLeftMove }
                 className={ styles.header }><h6>
      Acoustic features
      <IoRemoveCircleOutline onClick={ () => dispatch(focusPresence(annotation.label)) }/>
    </h6></ExtendedDiv>
    <div className={ styles.body }>

      <div className={ styles.line }>
        <b>Quality</b>
        <div className={ styles.switch }>
          <div className={ !annotation?.acoustic_features ? styles.active : undefined }
               onClick={ setBad }>
            Bad
          </div>
          <div className={ annotation?.acoustic_features ? styles.active : undefined }
               onClick={ setGood }>
            Good
          </div>
        </div>
      </div>

      { annotation.acoustic_features && <Table columns={ 3 } className={ styles.table } size='small'>
          <TableHead isFirstColumn={ true } className={ styles.span2ColsStart }>Feature</TableHead>
          <TableHead>Value</TableHead>

        {/* Frequencies */ }
          <TableDivider/>
          <TableContent isFirstColumn={ true } className={ styles.frequencyCell }>Frequency</TableContent>

          <TableContent>Min</TableContent>
          <TableContent className={ styles.cell }>
              <Input value={ annotation.start_frequency } type="number"
                     min={ 0 } max={ maxFrequency }
                     disabled={ campaign?.usage === 'Check' }
                     onChange={ e => updateMinFrequency(+e.currentTarget.value) }/>
              <IonNote>Hz</IonNote>
          </TableContent>

          <TableDivider className={ styles.span2ColsEnd }/>
          <TableContent>Max</TableContent>
          <TableContent className={ styles.cell }>
              <Input value={ annotation.end_frequency } type="number"
                     min={ 0 } max={ maxFrequency }
                     disabled={ campaign?.usage === 'Check' }
                     onChange={ e => updateMaxFrequency(+e.currentTarget.value) }/>
              <IonNote>Hz</IonNote>
          </TableContent>

          <TableDivider className={ styles.span2ColsEnd }/>
          <TableContent>Range</TableContent>
          <TableContent><IonNote>{ annotation.end_frequency - annotation.start_frequency } Hz</IonNote></TableContent>

          <SelectableFrequencyRow label='Start'
                                  value={ annotation.acoustic_features.start_frequency ?? undefined }
                                  max={ maxFrequency }
                                  onChange={ v => dispatch(updateCurrentResultAcousticFeatures({ start_frequency: v })) }/>

          <SelectableFrequencyRow label='End'
                                  value={ annotation.acoustic_features.end_frequency ?? undefined }
                                  max={ maxFrequency }
                                  onChange={ v => dispatch(updateCurrentResultAcousticFeatures({ end_frequency: v })) }/>

        {/* Time */ }
          <TableDivider/>
          <TableContent isFirstColumn={ true } className={ styles.span2ColsStart }>Duration</TableContent>
          <TableContent className={ styles.cell }>
              <Input value={ duration } type="number"
                     step={ 0.001 }
                     min={ 0.01 } max={ fileDuration }
                     disabled={ campaign?.usage === 'Check' }
                     onChange={ e => updateDuration(+e.currentTarget.value) }/>
              <IonNote>s</IonNote>
          </TableContent>

        {/* Trend */ }
          <TableDivider/>
          <TableContent isFirstColumn={ true } className={ styles.trendCell }>Trend</TableContent>

          <TableContent>General</TableContent>
          <TableContent>
              <Select options={ SignalTrends.map(value => ({ label: value, value } satisfies Item)) }
                      placeholder="Select a value"
                      optionsContainer="popover"
                      value={ annotation.acoustic_features?.trend ?? undefined }
                      onValueSelected={ item => dispatch(updateCurrentResultAcousticFeatures({ trend: (item as string) ?? null })) }/>
          </TableContent>

          <TableDivider className={ styles.span2ColsEnd }/>
          <TableContent>Relative min count</TableContent>
          <TableContent>
              <Input value={ annotation.acoustic_features?.relative_min_frequency_count ?? undefined }
                     type="number" min={ 0 } placeholder="0"
                     onChange={ e => dispatch(updateCurrentResultAcousticFeatures({ relative_min_frequency_count: +e.currentTarget.value })) }/>
          </TableContent>

          <TableDivider className={ styles.span2ColsEnd }/>
          <TableContent>Relative max count</TableContent>
          <TableContent>
              <Input value={ annotation.acoustic_features?.relative_max_frequency_count ?? undefined }
                     type="number" min={ 0 } placeholder="0"
                     onChange={ e => dispatch(updateCurrentResultAcousticFeatures({ relative_max_frequency_count: +e.currentTarget.value })) }/>
          </TableContent>

          <TableDivider className={ styles.span2ColsEnd }/>
          <TableContent>Inflection count</TableContent>
          <TableContent><IonNote>{ (annotation.acoustic_features?.relative_min_frequency_count ?? 0)
            + (annotation.acoustic_features?.relative_max_frequency_count ?? 0) }</IonNote></TableContent>

          <TableDivider className={ styles.span2ColsEnd }/>
          <TableContent>Steps count</TableContent>
          <TableContent>
              <Input value={ annotation.acoustic_features?.steps_count ?? undefined }
                     type="number" min={ 0 } placeholder="0"
                     onChange={ e => dispatch(updateCurrentResultAcousticFeatures({ steps_count: +e.currentTarget.value })) }/>
          </TableContent>


          <TableDivider className={ styles.span2ColsEnd }/>
          <TableContent>Has harmonics</TableContent>
          <TableContent>
              <IonCheckbox checked={ !!annotation.acoustic_features?.has_harmonics }
                           onClick={ e => dispatch(updateCurrentResultAcousticFeatures({ has_harmonics: e.currentTarget.checked })) }/>
          </TableContent>

      </Table> }
    </div>
  </div>
}

const SelectableFrequencyRow: React.FC<{
  label: string;
  value: number | undefined;
  max: number | undefined;
  onChange: (value: number | undefined) => void;
}> = ({ label, value, max, onChange }) => {
  const [ isSelecting, setIsSelecting ] = useState<boolean>(false);

  const pointer = usePointerService()

  function toggleSelection() {
    if (isSelecting) {
      CLICK_EVENT.remove(onClick)
      setIsSelecting(false)
    } else {
      setTimeout(() => CLICK_EVENT.add(onClick), 500);
      setIsSelecting(true)
    }
  }

  function onClick(event: MouseEvent) {
    event.stopPropagation()
    const position = pointer.getFreqTime(event)
    if (position) onChange(position.frequency)
    CLICK_EVENT.remove(onClick)
    setIsSelecting(false)
  }

  return <Fragment>
    <TableDivider className={ styles.span2ColsEnd }/>
    <TableContent>{ label }</TableContent>
    <TableContent className={ styles.cellButton }>
      <Input value={ value ?? '' } type="number" min={ 0 } max={ max }
             onChange={ e => onChange(+e.currentTarget.value) }/>
      <IonNote>Hz</IonNote>
      <IonButton size='small' fill='clear'
                 className={ isSelecting ? styles.selectedButton : undefined }
                 onClick={ toggleSelection }>
        <IonIcon icon={ createOutline } slot='icon-only'/>
      </IonButton>
    </TableContent>
  </Fragment>
}
