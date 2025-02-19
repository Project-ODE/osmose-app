import React, { Fragment, useMemo } from "react";
import { formatTime } from '@/service/dataset/spectrogram-configuration/scale';
import styles from './bloc.module.scss';
import { IoAnalyticsOutline, IoChevronForwardOutline, IoPricetagOutline, IoTimeOutline } from "react-icons/io5";
import { FaHandshake } from "react-icons/fa6";
import { useAnnotator } from "@/service/annotator/hook.ts";
import { useCurrentAnnotation, useFileDuration, useMaxFrequency } from '@/service/annotator/spectrogram';


export const CurrentAnnotation: React.FC = () => {
  const { campaign } = useAnnotator();

  const duration = useFileDuration();
  const { annotation } = useCurrentAnnotation();
  const maxFrequency = useMaxFrequency();

  const startTime = useMemo(() => {
    if (!annotation) return "-"
    return formatTime(annotation.start_time ?? 0, true);
  }, [ annotation?.start_time ])

  const endTime = useMemo(() => {
    if (!annotation) return "-"
    return formatTime(annotation.end_time ?? duration, true);
  }, [ annotation?.end_time ])

  const startFrequency = useMemo(() => {
    if (!annotation) return "-"
    return (annotation.start_frequency ?? 0).toFixed(2);
  }, [ annotation?.start_frequency ])

  const endFrequency = useMemo(() => {
    if (!annotation) return "-"
    return (annotation.end_frequency ?? maxFrequency).toFixed(2);
  }, [ annotation?.end_frequency ])

  const label = useMemo(() => annotation?.label ?? '-', [ annotation?.label ])
  const confidence = useMemo(() => annotation?.confidence_indicator ?? '-', [ annotation?.confidence_indicator ])

  return (
    <div className={ styles.bloc }>
      <h6 className={ styles.header }>Selected annotation</h6>
      <div
        className={ [ styles.body, styles.small, styles.vertical, annotation ? styles.currentAnnotation : styles.empty ].join(' ') }>
        { !annotation && <p>-</p> }

        { annotation && <Fragment>

            <IoTimeOutline/>
            <p>
                <span>{ startTime }</span>
                <IoChevronForwardOutline/>
                <span>{ endTime }</span>
            </p>

            <IoAnalyticsOutline/>
            <p>
                <span>{ startFrequency }</span>
                <IoChevronForwardOutline/>
                <span>{ endFrequency } Hz</span>
            </p>

            <IoPricetagOutline/>
            <p>
                <span>{ label }</span>
            </p>

          { campaign?.confidence_indicator_set && <Fragment>
              <FaHandshake/>
              <p><span>{ confidence }</span></p>
          </Fragment> }

        </Fragment> }
      </div>
    </div>
  )
}
