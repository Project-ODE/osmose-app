import React, { Fragment } from "react";
import { useAppDispatch, useAppSelector } from '@/service/app';
import { zoom } from '@/service/annotator';
import { MdZoomIn, MdZoomOut } from "react-icons/md";
import styles from '../annotator-tools.module.scss'
import { useCurrentConfiguration } from '@/service/annotator/spectrogram';

export const ZoomButton: React.FC = () => {

  const {
    zoomLevel,
  } = useAppSelector(state => state.annotator.userPreferences);
  const dispatch = useAppDispatch()

  const currentConfiguration = useCurrentConfiguration();

  function zoomIn() {
    dispatch(zoom({ direction: 'in' }))
  }

  function zoomOut() {
    dispatch(zoom({ direction: 'out' }))
  }

  return <Fragment>
    <MdZoomOut className={ [ styles.zoom, zoomLevel > 1 ? '' : styles.disabled ].join(' ') }
               onClick={ zoomOut }/>
    <MdZoomIn
      className={ [ styles.zoom, (zoomLevel + 1) < (currentConfiguration?.zoom_level ?? 1) ? '' : styles.disabled ].join(' ') }
      onClick={ zoomIn }/>
    <p>{ zoomLevel }x</p>
  </Fragment>
}