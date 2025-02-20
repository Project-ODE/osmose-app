import React, { useEffect, useMemo } from "react";
import { useToast } from "@/service/ui";
import { Select } from "@/components/form";
import { useListLabelSetQuery } from '@/service/campaign/label-set';
import { useAppDispatch, useAppSelector } from '@/service/app';
import {
  selectCampaignSubmissionErrors,
  selectCurrentCampaign,
  selectDraftCampaign,
  updateCampaignSubmissionErrors,
  updateDraftCampaign,
  WriteCreateAnnotationCampaign
} from '@/service/campaign';
import { CampaignErrors } from '@/service/campaign/type.ts';
import { LabelSetDisplay } from "@/components/campaign/label/LabelSet.tsx";

export const LabelSetSelect: React.FC = () => {

  // Services
  const dispatch = useAppDispatch();
  const { presentError, dismiss: dismissToast } = useToast();
  const { data: allLabelSets, error: labelSetListError } = useListLabelSetQuery()

  // State
  const draftCampaign = useAppSelector(selectDraftCampaign) as Partial<WriteCreateAnnotationCampaign>
  const createdCampaign = useAppSelector(selectCurrentCampaign)
  const errors: CampaignErrors = useAppSelector(selectCampaignSubmissionErrors);

  const selectedLabelSet = useMemo(() => {
    if (!draftCampaign.label_set) return undefined;
    return allLabelSets?.find(l => l.id === draftCampaign.label_set)
  }, [ draftCampaign.label_set ])

  useEffect(() => {
    if (!!allLabelSets && allLabelSets.length === 0) dispatch(updateCampaignSubmissionErrors({
      label_set: 'You should create a label set'
    }));
  }, [ allLabelSets ]);

  useEffect(() => {
    if (labelSetListError) presentError(labelSetListError);
  }, [ labelSetListError ]);

  useEffect(() => {
    return () => {
      dismissToast()
    }
  }, [])

  const onLabelsWithFeaturesUpdated = (value: string[]) => {
    dispatch(updateDraftCampaign({ labels_with_acoustic_features: value }))
  }

  return <Select label="Label set" placeholder="Select a label set"
                 required={ true }
                 error={ errors.label_set }
                 options={ allLabelSets?.map(s => ({ value: s.id, label: s.name })) ?? [] }
                 optionsContainer="alert"
                 value={ draftCampaign.label_set }
                 isLoading={ !allLabelSets }
                 disabled={ !!createdCampaign || !allLabelSets?.length }
                 onValueSelected={ value => dispatch(updateDraftCampaign({ label_set: value as number | undefined })) }>
    { !!selectedLabelSet && (<LabelSetDisplay set={ selectedLabelSet }
                                              allDisabled={ !!createdCampaign }
                                              labelsWithAcousticFeatures={ draftCampaign.labels_with_acoustic_features ?? [] }
                                              setLabelsWithAcousticFeatures={ onLabelsWithFeaturesUpdated }/>) }

  </Select>
}