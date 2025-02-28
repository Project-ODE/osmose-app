import React, { useEffect, useMemo } from 'react';
import styles from './Detail.module.scss'
import { useParams } from 'react-router-dom';
import { AnnotationCampaign, useRetrieveCampaignQuery } from '@/service/campaign';
import { getDisplayName, useGetCurrentUserQuery } from '@/service/user';
import { IonSpinner } from "@ionic/react";
import { FadedText, WarningText } from "@/components/ui";
import { getErrorMessage } from "@/service/function.ts";
import { DetailPageSide } from "./DetailPageSide.tsx";
import { useToast } from "@/service/ui";
import { DetailPageAnnotationTasks } from "./DetailPageAnnotationTasks.tsx";

export const CampaignDetail: React.FC = () => {
  const { id: campaignID } = useParams<{ id: string }>();
  const {
    data: campaign,
    isLoading: isLoadingCampaign,
    error: errorLoadingCampaign
  } = useRetrieveCampaignQuery(campaignID);
  const { data: currentUser } = useGetCurrentUserQuery();
  const isOwner = useMemo(() => {
    if (!currentUser) return false;
    return currentUser?.is_staff || currentUser?.is_superuser || campaign?.owner === currentUser?.username
  }, [ currentUser, campaign?.owner ]);

  const toast = useToast();

  useEffect(() => {
    return () => {
      toast.dismiss();
    }
  }, [ campaign?.id ])

  if (isLoadingCampaign) return <IonSpinner/>
  if (errorLoadingCampaign) return <WarningText>{ getErrorMessage(errorLoadingCampaign) }</WarningText>
  if (!campaign) return <WarningText>Fail recovering campaign</WarningText>

  return (
    <div className={ styles.page }>
      <div className={ styles.main }>

        <div className={ styles.header }>
          <h2>{ campaign.name }</h2>
          <StateDescription campaign={ campaign }/>
        </div>

        { campaign.desc && <div><FadedText>Description</FadedText><p>{ campaign.desc }</p></div> }

        <DetailPageAnnotationTasks campaign={ campaign } isOwner={ isOwner }/>

      </div>

      <DetailPageSide campaign={ campaign } isOwner={ isOwner }/>
    </div>
  )
}

const StateDescription: React.FC<{ campaign: AnnotationCampaign }> = ({ campaign }) => {
  const archivedDate = useMemo(() => {
    if (!campaign.archive) return undefined;
    new Date(campaign.archive.date).toLocaleDateString()
  }, [ campaign.archive ]);

  if (archivedDate) return <FadedText>
    Archived on { archivedDate } by { getDisplayName(campaign.archive?.by_user) }
  </FadedText>
  else return <FadedText>
    Created on { new Date(campaign.created_at).toLocaleDateString() } by { campaign.owner }
  </FadedText>
}
