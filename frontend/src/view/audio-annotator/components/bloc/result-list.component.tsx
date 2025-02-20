import React, { Fragment, MouseEvent, useMemo } from "react";
import { IonButton, IonIcon, IonNote } from "@ionic/react";
import { useAppDispatch, useAppSelector } from '@/service/app';
import { checkmarkOutline, closeOutline } from "ionicons/icons";
import styles from './bloc.module.scss'
import { IoArrowUpOutline, IoChatbubble, IoChatbubbleOutline, IoPricetag, IoTimeOutline } from 'react-icons/io5';
import { FaHandshake } from 'react-icons/fa6';
import { RiRobot2Fill } from 'react-icons/ri';
import { AnnotationResult } from '@/service/campaign/result';
import { focusResult, invalidateResult, validateResult } from '@/service/annotator';
import { formatTime } from '@/service/dataset/spectrogram-configuration/scale';
import { useParams } from "react-router-dom";
import { useRetrieveCampaignQuery } from "@/service/campaign";
import { useAnnotator } from "@/service/annotator/hook.ts";


export const ResultList: React.FC = () => {
  const {
    campaign,
  } = useAnnotator();

  const results = useAppSelector(state => state.annotator.results);

  const sorted_results: Array<AnnotationResult> = useMemo(
    () => {
      // Need the spread to sort this readonly array
      return [ ...(results ?? []) ].sort((a, b) => {
        if (a.label !== b.label) {
          return a.label.localeCompare(b.label);
        }
        return (a.start_time ?? 0) - (b.start_time ?? 0);
      })
    },
    [ results ])

  return <div className={ [
    styles.results,
    'results',
    campaign?.usage === 'Check' ? styles.check : '',
    'mt-2', 'shadow-double', 'border__black--125'
  ].join(' ') }>
    <div className={ [ styles.header, 'bg__black--003', 'border__black--125' ].join(' ') }>Annotations</div>
    { sorted_results.map(r => <ResultItem result={ r } key={ r.id }/>) }

    { sorted_results.length === 0 && <IonNote color="medium">No results</IonNote> }
  </div>
}

interface ResultProps {
  result: AnnotationResult
}

const ResultItem: React.FC<ResultProps> = ({ result }) => {
  const { focusedResultID } = useAppSelector(state => state.annotator);
  const dispatch = useAppDispatch()
  const isActive = useMemo(() => result.id === focusedResultID ? "isActive" : undefined, [ result.id, focusedResultID ])
  const onClick = () => dispatch(focusResult(result.id))

  const params: ResultItemProps = { result, isActive, onClick }
  return <Fragment>
    <ResultTimeInfo { ...params }/>
    <ResultFrequencyInfo { ...params }/>
    <ResultLabelInfo { ...params }/>
    <ResultConfidenceInfo { ...params }/>
    <ResultDetectorInfo { ...params }/>
    <ResultCommentInfo { ...params }/>
    <ResultValidationButton { ...params }/>
  </Fragment>
}

type ResultItemProps = {
  result: AnnotationResult;
  isActive?: string;
  onClick: () => void;
}

const ResultTimeInfo: React.FC<ResultItemProps> = ({ result, isActive, onClick }) => {
  if (result.type === 'Weak') return <Fragment/>
  return <div className={ isActive } onClick={ onClick }>
    <IoTimeOutline/>&nbsp;
    { formatTime(result.start_time) }&nbsp;
    { result.type === 'Box' && <Fragment>&gt;&nbsp;{ formatTime(result.end_time) }&nbsp;</Fragment> }
  </div>
}

const ResultFrequencyInfo: React.FC<ResultItemProps> = ({ result, isActive, onClick }) => {
  if (result.type === 'Weak') return <Fragment/>
  return <div className={ isActive } onClick={ onClick }>
    <IoArrowUpOutline/>&nbsp;
    { result.start_frequency.toFixed(2) }&nbsp;
    { result.type === 'Box' && <Fragment>&gt;&nbsp;{ result.end_frequency.toFixed(2) }&nbsp;</Fragment> }
    Hz
  </div>
}

const ResultLabelInfo: React.FC<ResultItemProps> = ({ result, isActive, onClick }) => (
  <div className={ [ isActive, styles.label, result.type === 'Weak' ? styles.presence : '' ].join(' ') }
       onClick={ onClick }>
    <IoPricetag/>&nbsp;
    { (result.label !== '') ? result.label : '-' }
  </div>
)

const ResultConfidenceInfo: React.FC<ResultItemProps> = ({ result, isActive, onClick }) => (
  <div className={ [ isActive, styles.confidence ].join(' ') }
       onClick={ onClick }>
    <FaHandshake/>&nbsp;
    { (result.confidence_indicator !== '') ? result.confidence_indicator : '-' }
  </div>
)

const ResultDetectorInfo: React.FC<ResultItemProps> = ({ result, isActive, onClick }) => {
  if (!result.detector_configuration) return <Fragment/>
  return <div className={ isActive } onClick={ onClick }>
    <RiRobot2Fill/>&nbsp;
    { result.detector_configuration?.detector }
  </div>
}

const ResultCommentInfo: React.FC<ResultItemProps> = ({ result, isActive, onClick }) => (
  <div className={ isActive } onClick={ onClick }>
    {
      result.comments.filter(c => c.comment).length > 0 ?
        <IoChatbubble/> : <IoChatbubbleOutline/>
    }
  </div>
)

const ResultValidationButton: React.FC<ResultItemProps> = ({ result, isActive, onClick }) => {
  const { campaignID } = useParams<{ campaignID: string, fileID: string }>();
  const { data: campaign } = useRetrieveCampaignQuery(campaignID)

  const dispatch = useAppDispatch();
  const validation = useMemo(() => {
    if (result.validations.length === 0) return true;
    else return result.validations[0].is_valid;
  }, [ result.validations ]);

  const onValidate = (event: MouseEvent) => {
    event.stopPropagation()
    dispatch(validateResult(result.id))
  }

  const onInvalidate = (event: MouseEvent) => {
    event.stopPropagation()
    dispatch(invalidateResult(result.id))
  }

  if (campaign?.usage !== 'Check') return <Fragment/>
  return <div className={ [ styles.validation, isActive ].join(' ') } onClick={ onClick }>
    <IonButton className="validate"
               color={ validation ? 'success' : 'medium' }
               fill={ validation ? 'solid' : 'outline' }
               onClick={ onValidate }>
      <IonIcon slot="icon-only" icon={ checkmarkOutline }/>
    </IonButton>
    <IonButton className="invalidate"
               color={ validation ? 'medium' : 'danger' }
               fill={ validation ? 'outline' : 'solid' }
               onClick={ onInvalidate }>
      <IonIcon slot="icon-only" icon={ closeOutline }/>
    </IonButton>
  </div>
}
