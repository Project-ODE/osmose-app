import React, { FormEvent, useEffect } from "react";
import { IonButton, IonSpinner } from "@ionic/react";
import { useHistory, useParams } from "react-router-dom";
import { useToast } from "@/services/utils/toast.ts";
import './create-edit-campaign.css';
import { AnnotatorsRangeBloc } from "@/view/campaign/create-edit/blocs/annotators-range.bloc.tsx";
import { clearDraftCampaign, selectDraftFileRange, useRetrieveCampaignQuery } from '@/service/campaign';
import { useAppDispatch, useAppSelector } from '@/service/app';
import { useBlur } from '@/services/utils/clic.ts';
import { usePostAnnotationFileRangeMutation } from '@/service/campaign/annotation-file-range';


export const EditCampaign: React.FC = () => {
  const { id: campaignID } = useParams<{ id: string }>()

  // Services
  const dispatch = useAppDispatch();
  const history = useHistory();
  const toast = useToast();
  const blurUtil = useBlur();
  const draftFileRanges = useAppSelector(selectDraftFileRange)
  const { data: campaign } = useRetrieveCampaignQuery(campaignID);
  const [ postFileRanges, { isLoading } ] = usePostAnnotationFileRangeMutation()

  useEffect(() => {
    document.addEventListener('click', blurUtil.onClick)
    dispatch(clearDraftCampaign())
    return () => {
      document.removeEventListener('click', blurUtil.onClick);
      blurUtil.cleanListener();
      toast.dismiss();
    }
  }, [])

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      await submitFileRanges();

      history.push(`/annotation-campaign/${ campaignID }`);
    } catch (e: any) {
      toast.presentError(e)
    }
  }

  const submitFileRanges = () => {
    if (!campaign) return;
    return postFileRanges({
      campaignID: campaign.id,
      data: draftFileRanges.map(r => {
        const first_file_index = r.first_file_index === undefined ? 0 : (+r.first_file_index - 1);
        const last_file_index = r.last_file_index === undefined ? (campaign.files_count - 1) : (+r.last_file_index - 1);
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
      <div className="title">
        <h1>Edit Annotation Campaign</h1>
        { campaign && <h5>{ campaign.name }</h5> }
      </div>

      <AnnotatorsRangeBloc/>

      <IonButton color="primary"
                 disabled={ isLoading }
                 type="submit">
        Update campaign
        { isLoading && <IonSpinner/> }
      </IonButton>
    </form>
  )
}
