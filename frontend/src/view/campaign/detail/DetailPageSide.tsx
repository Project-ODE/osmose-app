import React, { useState } from "react";
import { AnnotationCampaign, useArchiveCampaignMutation } from "@/service/campaign";
import { IonButton, IonIcon, IonSpinner } from "@ionic/react";
import { archiveOutline, helpBuoyOutline } from "ionicons/icons";
import { FadedText } from "@/components/ui";
import styles from "./Detail.module.scss";
import { createPortal } from "react-dom";
import { AudioMetadataModal, ProgressModal, SpectrogramConfigurationsModal } from "./modals";
import { useRetrieveLabelSetQuery } from "@/service/campaign/label-set";
import { useRetrieveConfidenceSetQuery } from "@/service/campaign/confidence-set";
import { Progress } from "@/components/ui/Progress.tsx";
import { useAlert } from "@/service/ui";
import { LabelSetModal } from "@/view/campaign/detail/modals/LabelSetModal.tsx";

export const DetailPageSide: React.FC<{ campaign?: AnnotationCampaign, isOwner: boolean }> = ({
                                                                                                campaign,
                                                                                                isOwner
                                                                                              }) => {

  const {
    data: labelSet,
    isLoading: isLoadingLabelSet
  } = useRetrieveLabelSetQuery(campaign!.label_set, { skip: !campaign });
  const {
    data: confidenceSet,
    isLoading: isLoadingConfidenceSet
  } = useRetrieveConfidenceSetQuery(campaign?.confidence_indicator_set ?? -1, { skip: !campaign?.confidence_indicator_set });
  const [ archiveCampaign ] = useArchiveCampaignMutation()
  const alert = useAlert();

  const [ isSpectrogramModalOpen, setIsSpectrogramModalOpen ] = useState<boolean>(false);
  const [ isAudioModalOpen, setIsAudioModalOpen ] = useState<boolean>(false);
  const [ isProgressModalOpen, setIsProgressModalOpen ] = useState<boolean>(false);
  const [ isLabelSetModalOpen, setIsLabelSetModalOpen ] = useState<boolean>(false);


  function openInstructions() {
    if (!campaign?.instructions_url) return;
    window.open(campaign?.instructions_url, "_blank", "noopener, noreferrer")
  }

  function toggleSpectrogramModal() {
    setIsSpectrogramModalOpen(isOpen => !isOpen);
  }

  function toggleAudioModal() {
    setIsAudioModalOpen(isOpen => !isOpen);
  }

  function toggleProgressModal() {
    setIsProgressModalOpen(isOpen => !isOpen);
  }

  function toggleLabelSetModal() {
    setIsLabelSetModalOpen(isOpen => !isOpen);
  }

  async function archive() {
    if (!campaign) return;
    if (campaign.progress < campaign.total) {
      // If annotators haven't finished yet, ask for confirmation
      return await alert.present({
        header: 'Archive',
        message: 'There is still unfinished annotations.\nAre you sure you want to archive this campaign?',
        cssClass: 'danger-confirm-alert',
        buttons: [
          'Cancel',
          {
            text: 'Archive',
            cssClass: 'ion-color-danger',
            handler: () => archiveCampaign(campaign.id)
          }
        ]
      });
    } else archiveCampaign(campaign.id)
  }

  return <div className={ styles.side }>

    { (isOwner || campaign?.instructions_url) && (
      <div className={ [ styles.bloc, styles.last ].join(' ') }>
        { isOwner && <IonButton color='medium' fill='outline' onClick={ archive }>
            <IonIcon icon={ archiveOutline } slot='start'/>
            Archive
        </IonButton> }
        { campaign?.instructions_url && <IonButton color="warning" fill="outline" onClick={ openInstructions }>
            <IonIcon icon={ helpBuoyOutline } slot="start"/> Instructions
        </IonButton> }
      </div>
    ) }

    <div className={ styles.bloc }>
      { campaign?.deadline &&
          <div><FadedText>Deadline</FadedText><p>{ new Date(campaign.deadline).toLocaleDateString() }</p></div> }

      <div><FadedText>Annotation mode</FadedText><p>{ campaign?.usage } annotations</p></div>
    </div>

    <div className={ styles.bloc }>
      <div>
        <FadedText>Dataset{ campaign && campaign.datasets.length > 1 ? 's' : '' }</FadedText>
        <p>{ campaign?.datasets.join(', ') }</p>
      </div>

      <IonButton fill='outline' color='medium' className='ion-text-wrap' onClick={ toggleSpectrogramModal }>
        Spectrogram configuration{ campaign && campaign.spectro_configs.length > 1 ? 's' : '' }
      </IonButton>
      { campaign && isSpectrogramModalOpen && createPortal(
        <SpectrogramConfigurationsModal campaign={ campaign }
                                        isOwner={ isOwner }
                                        onClose={ toggleSpectrogramModal }/>,
        document.body) }

      <IonButton fill='outline' color='medium' className='ion-text-wrap' onClick={ toggleAudioModal }>
        Audio metadata
      </IonButton>
      { campaign && isAudioModalOpen && createPortal(
        <AudioMetadataModal campaign={ campaign }
                            isOwner={ isOwner }
                            onClose={ toggleAudioModal }/>,
        document.body) }
    </div>

    <div className={ styles.bloc }>
      <div>
        <FadedText>Label set</FadedText>
        { isLoadingLabelSet && <IonSpinner/> }
        { labelSet && <p>{ labelSet.name }</p> }
      </div>
      <IonButton fill='outline' color='medium' className='ion-text-wrap' onClick={ toggleLabelSetModal }>
        Detailed label set
      </IonButton>
      { campaign && isLabelSetModalOpen && createPortal(
        <LabelSetModal campaign={ campaign }
                       isOwner={ isOwner }
                       onClose={ toggleLabelSetModal }/>,
        document.body) }

      <div>
        <FadedText>Confidence indicator set</FadedText>
        { isLoadingConfidenceSet && <IonSpinner/> }
        { !confidenceSet && <p>No confidence</p> }
        { confidenceSet && <p>{ confidenceSet.name }</p> }
      </div>
    </div>

    <div className={ styles.bloc }>
      { campaign && campaign.my_total > 0 && <Progress label='My progress' color='primary'
                                                       value={ campaign.my_progress } total={ campaign.my_total }/> }

      { campaign && <Progress label='Global progress'
                              value={ campaign.progress } total={ campaign.total }/> }

      <IonButton fill='outline' color='medium' className='ion-text-wrap' onClick={ toggleProgressModal }>
        Detailed progression
      </IonButton>
      { campaign && isProgressModalOpen && createPortal(
        <ProgressModal campaign={ campaign }
                       isOwner={ isOwner }
                       onClose={ toggleProgressModal }/>,
        document.body) }
    </div>

  </div>
}