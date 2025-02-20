import React, { Fragment, MouseEvent, useMemo } from "react";
import { IonButton, IonIcon, IonNote } from "@ionic/react";
import { useAppDispatch, useAppSelector } from '@/service/app';
import { checkmarkOutline, closeOutline } from "ionicons/icons";
import {
  IoAnalyticsOutline,
  IoChatbubbleEllipses,
  IoChatbubbleOutline,
  IoChevronForwardOutline,
  IoPricetag,
  IoTimeOutline
} from 'react-icons/io5';
import { FaHandshake } from 'react-icons/fa6';
import { RiRobot2Fill } from 'react-icons/ri';
import { AnnotationResult } from '@/service/campaign/result';
import { focusResult, invalidateResult, validateResult } from '@/service/annotator';
import { formatTime } from '@/service/dataset/spectrogram-configuration/scale';
import styles from './bloc.module.scss';
import { Table, TableContent, TableDivider } from "@/components/table/table.tsx";
import { useParams } from "react-router-dom";
import { useRetrieveCampaignQuery } from "@/service/campaign";


export const Results: React.FC = () => {

  const {
    results
  } = useAppSelector(state => state.annotator);

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

  // 'results' class is for playwright tests
  return <div className={ [ styles.bloc, styles.results, 'results' ].join(' ') }>
    <h6 className={ styles.header }>Annotations</h6>
    <div className={ [ styles.body, styles.vertical ].join(' ') }>

      { sorted_results.length > 0 && <Table columns={ 10 }>
        { sorted_results.map((r, index) => <Fragment key={ index }>
          { index > 0 && <TableDivider/> }
          <Result result={ r }/>
        </Fragment>) }
      </Table> }

      { sorted_results.length === 0 && <IonNote color="medium">No results</IonNote> }
    </div>
  </div>
}

const Result: React.FC<{
  result: AnnotationResult
}> = ({ result }) => {
  const { focusedResultID } = useAppSelector(state => state.annotator);
  const dispatch = useAppDispatch()
  const isActive = useMemo(() => result.id === focusedResultID ? styles.active : undefined, [ result.id, focusedResultID ])
  const onClick = () => dispatch(focusResult(result.id))

  const params: ResultItemProps = { result, className: [ styles.item, isActive ].join(' '), onClick }
  return <Fragment>
    <ResultLabelInfo { ...params }/>
    <ResultTimeInfo { ...params }/>
    <ResultFrequencyInfo { ...params }/>
    <ResultConfidenceInfo { ...params }/>
    <ResultDetectorInfo { ...params }/>
    <ResultCommentInfo { ...params }/>
    <ResultValidationButton { ...params }/>
  </Fragment>
}

type ResultItemProps = {
  result: AnnotationResult;
  className?: string;
  onClick: () => void;
}

const ResultTimeInfo: React.FC<ResultItemProps> = ({ result, className, onClick }) => {
  if (result.type === 'Weak') return <Fragment/>
  return <TableContent className={ className } onClick={ onClick }>
    <IoTimeOutline/>

    <p>
      { formatTime(result.start_time, true) }
      { result.type === 'Box' && <Fragment>
          <IoChevronForwardOutline/> { formatTime(result.end_time, true) }
      </Fragment> }
    </p>
  </TableContent>
}

const ResultFrequencyInfo: React.FC<ResultItemProps> = ({ result, className, onClick }) => {
  if (result.type === 'Weak') return <Fragment/>

  return <TableContent className={ className } onClick={ onClick }>
    <IoAnalyticsOutline/>

    <p>
      { result.start_frequency?.toFixed(2) }Hz
      { result.type === 'Box' && <Fragment>
          &nbsp;<IoChevronForwardOutline/> { result.end_frequency?.toFixed(2) }Hz
      </Fragment> }
    </p>
  </TableContent>
}

const ResultLabelInfo: React.FC<ResultItemProps> = ({ result, className, onClick }) => (
  <TableContent
    className={ [ className, result.type === 'Weak' ? styles.presenceLabel : styles.strongLabel ].join(' ') }
    isFirstColumn={ true }
    onClick={ onClick }>
    <IoPricetag/>

    <p>{ (result.label !== '') ? result.label : '-' }</p>
  </TableContent>
)

const ResultConfidenceInfo: React.FC<ResultItemProps> = ({ result, className, onClick }) => {
  const params = useParams<{ campaignID: string, fileID: string }>();
  const { data: campaign } = useRetrieveCampaignQuery(params.campaignID)
  if (!campaign?.confidence_indicator_set) return <Fragment/>
  return (
    <TableContent className={ className } onClick={ onClick }>
      <FaHandshake/>
      <p>{ (result.confidence_indicator !== '') ? result.confidence_indicator : '-' }</p>
    </TableContent>
  )
}

const ResultDetectorInfo: React.FC<ResultItemProps> = ({ result, className, onClick }) => {
  if (!result.detector_configuration) return <Fragment/>
  return <TableContent className={ className } onClick={ onClick }>
    <RiRobot2Fill/>

    <p>{ result.detector_configuration?.detector }</p>
  </TableContent>
}

const ResultCommentInfo: React.FC<ResultItemProps> = ({ result, className, onClick }) => (
  <TableContent className={ className } onClick={ onClick }>
    {
      result.comments.filter(c => c.comment).length > 0 ?
        <IoChatbubbleEllipses/> : <IoChatbubbleOutline/>
    }
  </TableContent>
)

const ResultValidationButton: React.FC<ResultItemProps> = ({ result, className, onClick }) => {
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
  return <TableContent className={ [ className ].join(' ') } onClick={ onClick }>
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
  </TableContent>
}
