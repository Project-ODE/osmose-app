import React, { FormEvent, useEffect, useState } from "react";
import { useHistory } from "react-router-dom";
import { IonButton, IonSpinner } from "@ionic/react";
import { useBlur } from "@/services/utils/clic.ts";
import { useToast } from "@/services/utils/toast.ts";
import { AnnotatorsRangeBloc } from "@/view/campaign/create-edit/blocs/annotators-range.bloc.tsx";
import { CampaignBloc } from "@/view/campaign/create-edit/blocs/campaign.bloc.tsx";
import {
  AnnotationCampaign,
  BaseAnnotationCampaign,
  clearCampaign,
  selectDraftCampaign,
  selectDraftFileRange,
  updateCampaignSubmissionErrors,
  useCreateCampaignMutation,
  WriteAnnotationCampaign,
  WriteCreateAnnotationCampaign
} from '@/service/campaign';
import './create-edit-campaign.css'
import { useAppDispatch, useAppSelector } from '@/service/app';
import { Errors } from '@/service/type.ts';
import { DataBloc } from '@/view/campaign/create-edit/blocs/data.bloc.tsx';
import { AnnotationBloc } from '@/view/campaign/create-edit/blocs/annotation.bloc.tsx';
import { getErrorMessage } from '@/service/function.ts';
import { usePostAnnotationFileRangeMutation } from '@/service/campaign/annotation-file-range';
import { useImportResultMutation } from '@/service/campaign/result';
import { FetchBaseQueryError } from '@reduxjs/toolkit/query';

export const CreateCampaign: React.FC = () => {
  const blurUtil = useBlur();
  const toast = useToast();

  // Services
  const dispatch = useAppDispatch();
  const history = useHistory();
  const [ createCampaign, { data: createdCampaign, isLoading: isSubmittingCampaign } ] = useCreateCampaignMutation()
  const [ postFileRanges, { isLoading: isSubmittingFileRanges } ] = usePostAnnotationFileRangeMutation()
  const [ importResults, { isLoading: isImportingResults } ] = useImportResultMutation()

  // State
  const draftCampaign = useAppSelector(selectDraftCampaign)
  const draftFileRanges = useAppSelector(selectDraftFileRange)
  const detectors = useAppSelector(state => state.campaign.resultImport.detectors)
  const filterDetectors = useAppSelector(state => state.campaign.resultImport.filterDetectors)
  const [ resultFile, setResultFile ] = useState<File | undefined>();

  useEffect(() => {
    document.addEventListener('click', blurUtil.onClick)
    dispatch(clearCampaign())
    return () => {
      document.removeEventListener('click', blurUtil.onClick);
      blurUtil.cleanListener();
      toast.dismiss();
    }
  }, [])

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      const campaign = createdCampaign ?? await submitCampaign();
      await submitResults(campaign)
      if (!await submitFileRanges(campaign)) return;

      history.push('/annotation-campaign');
    } catch (e: any) {
      toast.presentError(getErrorMessage(e));
    }
  }

  const submitCampaign = () => {
    const missingFields = [];
    if (!draftCampaign.name?.trim()) missingFields.push('name');
    if (!draftCampaign.usage) missingFields.push('usage');
    if (!draftCampaign.datasets || draftCampaign.datasets.length === 0) missingFields.push('datasets');
    if (!draftCampaign.spectro_configs || draftCampaign.spectro_configs.length === 0) missingFields.push('spectro_configs');
    if (missingFields.length > 0) {
      const errors: Errors<WriteAnnotationCampaign> = {}
      for (const field in missingFields) errors[field as keyof WriteAnnotationCampaign] = `The ${ field } field is required.`;
      dispatch(updateCampaignSubmissionErrors(errors))
      throw new Error("Missing required fields");
    }
    const data: BaseAnnotationCampaign = {
      name: draftCampaign.name?.trim() ?? '',
      desc: draftCampaign.desc?.trim() ?? null,
      instructions_url: draftCampaign.instructions_url?.trim() ?? null,
      deadline: draftCampaign.deadline?.trim() ?? null,
      datasets: draftCampaign.datasets ?? [],
      spectro_configs: draftCampaign.spectro_configs ?? [],
    }

    if (draftCampaign.usage === 'Check') {
      return createCampaign({
        ...data,
        usage: 'Check',
      }).unwrap().catch(e => {
        if (Object.prototype.hasOwnProperty.call(e, 'data')) dispatch(updateCampaignSubmissionErrors(e.data))
        throw e
      });
    }

    if (!(draftCampaign as WriteCreateAnnotationCampaign).label_set) {
      dispatch(updateCampaignSubmissionErrors({
        label_set: 'The label set is required.'
      }))
      throw new Error("Missing required fields");
    }

    const draft = draftCampaign as Partial<WriteCreateAnnotationCampaign>;
    return createCampaign({
      ...data,
      usage: 'Create',
      label_set: draft.label_set!,
      labels_with_acoustic_features: draft.labels_with_acoustic_features ?? [],
      confidence_indicator_set: draft.confidence_indicator_set ?? null
    }).unwrap().catch(e => {
      if (Object.prototype.hasOwnProperty.call(e, 'data')) dispatch(updateCampaignSubmissionErrors(e.data))
      throw e
    });
  }

  const submitResults = async (campaign: AnnotationCampaign, force: boolean = false) => {
    if (!resultFile) return;
    if (!detectors || detectors.length === 0) throw new Error('You should import results');
    if (!filterDetectors || filterDetectors.length === 0) throw new Error('You should select detectors results');
    try {
      // TODO: add dataset filter
      return await importResults({
        campaignID: campaign.id,
        datasetName: campaign.datasets![0],
        detectors: detectors.filter(d => filterDetectors.includes(d.initialName)),
        file: resultFile,
        force
      }).unwrap()
    } catch (e) {
      if (force) throw e;

      if ((e as any).status === 400) {
        const response_errors = (e as FetchBaseQueryError).data as Array<{ [key in string]: string[] }>
        const outOfFilesError = "This start and end datetime does not belong to any file of the dataset";
        if (!JSON.stringify(response_errors).includes(outOfFilesError)) throw e;
        const count = [ ...JSON.stringify(response_errors).matchAll(new RegExp(outOfFilesError, 'g')) ].length;
        const retry = await toast.presentError(`[${ count } results]: ${ outOfFilesError }`, true);
        if (retry) return submitResults(campaign, true)
      }
      throw e
    }
  }

  const submitFileRanges = (campaign: AnnotationCampaign) => {
    return postFileRanges({
      campaignID: campaign.id,
      data: draftFileRanges.map(r => {
        const first_file_index = (r.first_file_index === undefined || r.first_file_index === null) ? 0 : (+r.first_file_index - 1);
        const last_file_index = (r.last_file_index === undefined || r.last_file_index === null) ? (campaign.files_count - 1) : (+r.last_file_index - 1);
        return {
          id: r.id >= 0 ? r.id : undefined,
          first_file_index: first_file_index < 0 ? 0 : first_file_index,
          last_file_index: last_file_index < 0 ? campaign.files_count! - 1 : last_file_index,
          annotator: r.annotator
        }
      })
    })
  }


  return (
    <form id="create-campaign-form"
          onSubmit={ handleSubmit }>
      <h1>Create Annotation Campaign</h1>

      <CampaignBloc/>

      <DataBloc/>

      <AnnotationBloc onFileImported={ setResultFile } onFileRemoved={ () => setResultFile(undefined) }/>

      <AnnotatorsRangeBloc/>

      <IonButton color="primary" type="submit"
                 disabled={ isSubmittingCampaign || isSubmittingFileRanges || isImportingResults }>
        Create campaign
        { (isSubmittingCampaign || isSubmittingFileRanges || isImportingResults) && <IonSpinner/> }
      </IonButton>
    </form>
  )
}
