import { useParams } from "react-router-dom";
import { useRetrieveAnnotatorQuery } from "@/service/annotator/api.ts";
import { useAppDispatch, useAppSelector } from "@/service/app.ts";
import { useRetrieveCampaignQuery } from "@/service/campaign";
import { useEffect } from "react";
import { resetFileFilters } from "@/service/ui";
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
  }, [campaignID, fileFilters.campaignID]);

  // API
  const { data } = useRetrieveAnnotatorQuery({ ...fileFilters, campaignID, fileID });
  const { data: campaign } = useRetrieveCampaignQuery(campaignID)
  const { data: user } = useGetCurrentUserQuery()
  const { data: label_set } = useRetrieveLabelSetQuery(campaign?.label_set ?? -1, { skip: !campaign?.label_set });
  const { data: confidence_set } = useRetrieveConfidenceSetQuery(campaign?.confidence_indicator_set ?? -1, {skip: !campaign?.confidence_indicator_set })

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