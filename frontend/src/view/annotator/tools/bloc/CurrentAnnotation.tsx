import React, { Fragment, useMemo } from "react";
import { formatTime } from '@/service/dataset/spectrogram-configuration/scale';
import styles from './bloc.module.scss';
import { IoAnalyticsOutline, IoChevronForwardOutline, IoPricetagOutline, IoTimeOutline } from "react-icons/io5";
import { FaHandshake } from "react-icons/fa6";
import { useAnnotator } from "@/service/annotator/hook.ts";
import { useCurrentAnnotation } from '@/service/annotator/spectrogram';


export const CurrentAnnotation: React.FC = () => {
  const { campaign } = useAnnotator();

  const { annotation } = useCurrentAnnotation();

  const startTime = useMemo(() => {
    if (!annotation || annotation.type === 'Weak') return "-"
    return formatTime(annotation.start_time, true);
  }, [ annotation?.start_time ])

  const endTime = useMemo(() => {
    if (!annotation || annotation.type !== 'Box') return "-"
    return formatTime(annotation.end_time, true);
  }, [ annotation?.end_time ])

  const startFrequency = useMemo(() => {
    if (!annotation || annotation.type === 'Weak') return "-"
    return (annotation.start_frequency).toFixed(2);
  }, [ annotation?.start_frequency ])

  const endFrequency = useMemo(() => {
    if (!annotation || annotation.type !== 'Box') return "-"
    return (annotation.end_frequency).toFixed(2);
  }, [ annotation?.end_frequency ])

  const label = useMemo(() => annotation?.label ?? '-', [ annotation?.label ])
  const confidence = useMemo(() => annotation?.confidence_indicator ?? '-', [ annotation?.confidence_indicator ])

  return (
    <div className={ [ styles.bloc, styles.current ].join(' ') }>
      <h6 className={ styles.header }>Selected annotation</h6>
      <div
        className={ [ styles.body, styles.small, styles.vertical, annotation ? styles.currentAnnotation : styles.empty ].join(' ') }>
        { !annotation && <p>-</p> }

        { annotation && <Fragment>

            <IoPricetagOutline/>
            <p>
                <span>{ label }</span>
            </p>

          { campaign?.confidence_indicator_set && <Fragment>
              <FaHandshake/>
              <p><span>{ confidence }</span></p>
          </Fragment> }

          { annotation.type !== 'Weak' && <Fragment>
              <IoTimeOutline/>
              <p>
                  <span>{ startTime }</span>
                { annotation.type === 'Box' && <Fragment>
                    <IoChevronForwardOutline/>
                    <span>{ endTime }</span>
                </Fragment> }
              </p>

              <IoAnalyticsOutline/>
              <p>
                  <span>{ startFrequency }</span>
                { annotation.type === 'Box' && <Fragment>
                    <IoChevronForwardOutline/>
                    <span>{ endFrequency }</span>
                </Fragment> }
                  <span>Hz</span>
              </p>
          </Fragment>
          }

        </Fragment> }
      </div>
    </div>
  )
}
