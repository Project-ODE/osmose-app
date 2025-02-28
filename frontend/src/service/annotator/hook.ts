import { useParams } from "react-router-dom";
import { useRetrieveAnnotatorQuery } from "@/service/annotator/api.ts";
import { useAppDispatch, useAppSelector } from "@/service/app.ts";
import { useRetrieveCampaignQuery } from "@/service/campaign";
import { useEffect, useRef } from "react";
import { resetFileFilters, useAlert } from "@/service/ui";
import { useGetCurrentUserQuery } from "@/service/user";
import { useRetrieveLabelSetQuery } from "@/service/campaign/label-set";
import { useRetrieveConfidenceSetQuery } from "@/service/campaign/confidence-set";

export const useAnnotator = () => {
  const { campaignID, fileID } = useParams<{ campaignID: string, fileID: string }>();

  // State
  const fileFilters = useAppSelector(state => state.ui.fileFilters)
  const dispatch = useAppDispatch();
  useEffect(() => {
    if (campaignID != fileFilters.campaignID) {
      dispatch(resetFileFilters())
    }
  }, [ campaignID, fileFilters.campaignID ]);

  // API
  const { data } = useRetrieveAnnotatorQuery({ filters: fileFilters, campaignID, fileID });
  const { data: campaign } = useRetrieveCampaignQuery(campaignID)
  const { data: user } = useGetCurrentUserQuery()
  const { data: label_set } = useRetrieveLabelSetQuery(campaign?.label_set ?? -1, { skip: !campaign?.label_set });
  const { data: confidence_set } = useRetrieveConfidenceSetQuery(campaign?.confidence_indicator_set ?? -1, { skip: !campaign?.confidence_indicator_set })

  return {
    campaignID,
    fileID,
    annotatorData: data,
    campaign,
    user,
    label_set,
    confidence_set,
  }
}

export const useCanNavigate = () => {
  const {
    hasChanged: _hasChanged,
  } = useAppSelector(state => state.annotator);
  const hasChanged = useRef<boolean>(_hasChanged);
  useEffect(() => {
    hasChanged.current = _hasChanged
  }, [ _hasChanged ]);
  const alert = useAlert();

  async function canNavigate(): Promise<boolean> {
    if (!hasChanged.current) return true;
    return new Promise<boolean>((resolve) => {
      alert.present({
        message: `You have unsaved changes. Are you sure you want to forget all of them?`,
        cssClass: 'danger-confirm-alert',
        buttons: [
          'Cancel',
          {
            text: `Forget my changes`,
            role: 'validate',
            cssClass: 'ion-color-danger',
          }
        ],
        onDidDismiss: event => resolve(event.detail.role === 'validate')
      })
    })
  }

  return canNavigate;
}
