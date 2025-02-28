import React, { Fragment, useMemo, useState } from "react";
import { IonIcon } from "@ionic/react";
import { funnel, funnelOutline } from "ionicons/icons";
import { useAppDispatch, useAppSelector } from "@/service/app.ts";
import { setFileFilters } from "@/service/ui";
import { useParams } from "react-router-dom";
import { createPortal } from "react-dom";
import { Modal } from "@/components/ui";
import { Select, Switch } from "@/components/form";
import { AnnotationCampaign } from "@/service/campaign";
import { useRetrieveLabelSetQuery } from "@/service/campaign/label-set";
import { useRetrieveConfidenceSetQuery } from "@/service/campaign/confidence-set";
import { useListDetectorQuery } from "@/service/campaign/detector";
import styles from '../Detail.module.scss'

const BOOLEAN_OPTIONS = [ 'Unset', 'With', 'Without' ]
type BooleanOption = typeof BOOLEAN_OPTIONS[number];

export const AnnotationsFilter: React.FC<{
  campaign: AnnotationCampaign | undefined;
  onUpdate: () => void
}> = ({ onUpdate, campaign }) => {
  const { id: campaignID } = useParams<{ id: string }>();

  const { fileFilters: filters } = useAppSelector(state => state.ui);
  const { data: labelSet } = useRetrieveLabelSetQuery(campaign?.label_set ?? -1, { skip: !campaign });
  const { data: confidenceSet } = useRetrieveConfidenceSetQuery(campaign?.confidence_indicator_set ?? -1, { skip: !campaign?.confidence_indicator_set });
  const { data: detectors } = useListDetectorQuery({ campaign: campaign!.id }, { skip: campaign?.usage !== 'Check' });
  const dispatch = useAppDispatch();

  const hasAnnotationsFilter = useMemo(() => filters.withUserAnnotations !== undefined, [ filters ]);
  const isHasAnnotationsFilterDisabled = useMemo(() => !!filters.label || !!filters.confidence || !!filters.detector || filters.hasAcousticFeatures !== undefined, [ filters ]);
  const [ filterModalOpen, setFilterModalOpen ] = useState<boolean>(false);

  function booleanOptionToValue(option: BooleanOption): boolean | undefined {
    switch (option) {
      case 'With':
        return true;
      case 'Without':
        return false;
      case 'Unset':
        return undefined;
    }
  }

  function valueToBooleanOption(value: boolean | undefined): BooleanOption {
    switch (value) {
      case true:
        return 'With';
      case false:
        return 'Without';
      case undefined:
        return 'Unset';
    }
  }

  function setHasAnnotations(option: BooleanOption) {
    dispatch(setFileFilters({
      ...filters,
      campaignID,
      withUserAnnotations: booleanOptionToValue(option),
      label: undefined,
      confidence: undefined,
      detector: undefined,
      hasAcousticFeatures: undefined,
    }))
    onUpdate()
  }

  function setAcousticFeatures(option: BooleanOption) {
    const hasAcousticFeatures = booleanOptionToValue(option);
    dispatch(setFileFilters({
      ...filters,
      campaignID,
      withUserAnnotations: true,
      hasAcousticFeatures,
    }))
    onUpdate()
  }

  function setLabel(label: number | string | undefined) {
    dispatch(setFileFilters({
      ...filters,
      campaignID,
      withUserAnnotations: true,
      label: typeof label === 'number' ? label.toString() : label,
    }))
    onUpdate()
  }

  function setConfidence(label: number | string | undefined) {
    dispatch(setFileFilters({
      ...filters,
      campaignID,
      withUserAnnotations: true,
      confidence: typeof label === 'number' ? label.toString() : label,
    }))
    onUpdate()
  }

  function setDetector(label: number | string | undefined) {
    dispatch(setFileFilters({
      ...filters,
      campaignID,
      withUserAnnotations: true,
      detector: typeof label === 'number' ? label.toString() : label,
    }))
    onUpdate()
  }

  return <Fragment>
    { hasAnnotationsFilter ?
      <IonIcon onClick={ () => setFilterModalOpen(true) } color='primary' icon={ funnel }/> :
      <IonIcon onClick={ () => setFilterModalOpen(true) } color='dark' icon={ funnelOutline }/> }

    { filterModalOpen && createPortal(<Modal className={ styles.filterModal }
                                             onClose={ () => setFilterModalOpen(false) }>

      <Switch label='Annotations' disabled={ isHasAnnotationsFilterDisabled } options={ BOOLEAN_OPTIONS }
              value={ valueToBooleanOption(filters.withUserAnnotations) } onValueSelected={ setHasAnnotations }/>

      { labelSet && <Select label='Label' placeholder='Filter by label' optionsContainer='popover'
                            options={ labelSet.labels.map(l => ({ label: l, value: l })) }
                            value={ filters.label }
                            onValueSelected={ setLabel }/> }

      { confidenceSet?.confidence_indicators &&
          <Select label='Confidence' placeholder='Filter by confidence' optionsContainer='popover'
                  options={ confidenceSet.confidence_indicators.map(c => ({ label: c.label, value: c.label })) }
                  value={ filters.confidence }
                  onValueSelected={ setConfidence }/> }

      { detectors &&
          <Select label='Detectors' placeholder='Filter by detector' optionsContainer='popover'
                  options={ detectors.map(d => ({ label: d.name, value: d.name })) }
                  value={ filters.detector }
                  onValueSelected={ setDetector }/> }

      <Switch label='Acoustic features' options={ BOOLEAN_OPTIONS }
              value={ valueToBooleanOption(filters.hasAcousticFeatures) } onValueSelected={ setAcousticFeatures }/>

    </Modal>, document.body) }
  </Fragment>
}