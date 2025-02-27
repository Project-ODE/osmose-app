import React, { useEffect } from "react";
import { FormBloc, Select } from "@/components/form";
import { LabelSetSelect } from "@/view/campaign/create-edit/blocs/input/label-set.select.tsx";
import { ConfidenceSetSelect } from "@/view/campaign/create-edit/blocs/input/confidence-set.select.tsx";
import { CheckAnnotationsInputs } from "@/view/campaign/create-edit/blocs/input/check-annotations.tsx";
import { useAppDispatch, useAppSelector } from '@/service/app';
import {
  selectCampaignSubmissionErrors,
  selectCurrentCampaign,
  selectDraftCampaign,
  updateCampaignSubmissionErrors,
  updateDraftCampaign,
} from '@/service/campaign';
import { useListDatasetQuery } from '@/service/dataset';

export const AnnotationBloc: React.FC<{
  onFileImported: (file: File) => void,
  onFileRemoved: () => void,
}> = ({ onFileImported, onFileRemoved }) => {
  // Services
  const dispatch = useAppDispatch();
  const { data: allDatasets } = useListDatasetQuery();

  // State
  const draftCampaign = useAppSelector(selectDraftCampaign)
  const createdCampaign = useAppSelector(selectCurrentCampaign)
  const errors = useAppSelector(selectCampaignSubmissionErrors)

  // Loading
  useEffect(() => {
    if (allDatasets && allDatasets.length === 0)
      dispatch(updateCampaignSubmissionErrors({ datasets: "You should first import a dataset." }));
  }, [ allDatasets ]);

  return <FormBloc label="Annotation">
    <Select required={ true }
            error={ errors.usage }
            label="Annotation mode" placeholder="Select an annotation mode"
            options={ [
              { value: 'Create', label: 'Create annotations' },
              { value: 'Check', label: 'Check annotations' },
            ] }
            optionsContainer="popover"
            value={ draftCampaign.usage }
            disabled={ !!createdCampaign }
            onValueSelected={ value => dispatch(updateDraftCampaign({ usage: value as 'Create' | 'Check' | undefined })) }/>

    { draftCampaign.usage === 'Create' &&
        <LabelSetSelect/> }

    { draftCampaign.usage === 'Create' &&
        <ConfidenceSetSelect/> }

    { draftCampaign.usage === 'Check' &&
        <CheckAnnotationsInputs onFileImported={ onFileImported }
                                onFileRemoved={ onFileRemoved }/> }
  </FormBloc>
}
