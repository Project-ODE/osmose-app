import React, { useState } from "react";
import { AnnotationCampaign, useArchiveCampaignMutation } from "@/service/campaign";
import { IonButton, IonIcon, IonSpinner, useIonAlert } from "@ionic/react";
import { archiveOutline, helpBuoyOutline } from "ionicons/icons";
import { FadedText } from "@/components/ui";
import styles from "./Detail.module.scss";
import { createPortal } from "react-dom";
import { AudioMetadataModal, ProgressModal, SpectrogramConfigurationsModal } from "./modals";
import { useRetrieveLabelSetQuery } from "@/service/campaign/label-set";
import { useRetrieveConfidenceSetQuery } from "@/service/campaign/confidence-set";
import { Progress } from "@/components/ui/Progress.tsx";

export const DetailPageSide: React.FC<{ campaign: AnnotationCampaign, isOwner: boolean }> = ({ campaign, isOwner }) => {

  const { data: labelSet, isLoading: isLoadingLabelSet } = useRetrieveLabelSetQuery(campaign.label_set);
  const {
    data: confidenceSet,
    isLoading: isLoadingConfidenceSet
  } = useRetrieveConfidenceSetQuery(campaign.confidence_indicator_set ?? -1, { skip: !campaign.confidence_indicator_set });
  const [ archiveCampaign ] = useArchiveCampaignMutation()
  const [ presentAlert ] = useIonAlert();

  const [ isSpectrogramModalOpen, setIsSpectrogramModalOpen ] = useState<boolean>(false);
  const [ isAudioModalOpen, setIsAudioModalOpen ] = useState<boolean>(false);
  const [ isProgressModalOpen, setIsProgressModalOpen ] = useState<boolean>(false);


  function openInstructions() {
    if (!campaign.instructions_url) return;
    window.open(campaign.instructions_url, "_blank", "noopener, noreferrer")
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

  async function archive() {
    if (campaign.progress < campaign.total) {
      // If annotators haven't finished yet, ask for confirmation
      return await presentAlert({
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

    { (isOwner || campaign.instructions_url) && (
      <div className={ [ styles.bloc, styles.last ].join(' ') }>
        { isOwner && <IonButton color='medium' fill='outline' onClick={ archive }>
            <IonIcon icon={ archiveOutline } slot='start'/>
            Archive
        </IonButton> }
        { campaign.instructions_url && <IonButton color="warning" fill="outline" onClick={ openInstructions }>
            <IonIcon icon={ helpBuoyOutline } slot="start"/> Instructions
        </IonButton> }
      </div>
    ) }

    <div className={ styles.bloc }>
      { campaign.deadline && <div><FadedText>Deadline</FadedText><p>{ campaign.deadline }</p></div> }

      <div><FadedText>Annotation mode</FadedText><p>{ campaign.usage } annotations</p></div>
    </div>

    <div className={ styles.bloc }>
      <div>
        <FadedText>Dataset{ campaign.datasets.length > 1 ? 's' : '' }</FadedText>
        <p>{ campaign.datasets.join(', ') }</p>
      </div>

      <IonButton fill='outline' color='medium' className='ion-text-wrap' onClick={ toggleSpectrogramModal }>
        Spectrogram configuration{ campaign.spectro_configs.length > 1 ? 's' : '' }
      </IonButton>
      { isSpectrogramModalOpen && createPortal(
        <SpectrogramConfigurationsModal campaign={ campaign }
                                        isOwner={ isOwner }
                                        onClose={ toggleSpectrogramModal }/>,
        document.body) }

      <IonButton fill='outline' color='medium' className='ion-text-wrap' onClick={ toggleAudioModal }>
        Audio metadata
      </IonButton>
      { isAudioModalOpen && createPortal(
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
      { campaign.labels_with_acoustic_features.length > 0 && (
        <div><FadedText>Detailed labels</FadedText><p>{ campaign.labels_with_acoustic_features.join(', ') }</p></div>
      ) }

      <div>
        <FadedText>Confidence indicator set</FadedText>
        { isLoadingConfidenceSet && <IonSpinner/> }
        { !confidenceSet && <p>No confidence</p> }
        { confidenceSet && <p>{ confidenceSet.name }</p> }
      </div>
    </div>

    <div className={ styles.bloc }>
      { campaign.my_total > 0 && <Progress label='My progress' color='primary'
                                           value={ campaign.my_progress } total={ campaign.my_total }/> }

      <Progress label='Global progress'
                value={ campaign.progress } total={ campaign.total }/>

      <IonButton fill='outline' color='medium' className='ion-text-wrap' onClick={ toggleProgressModal }>
        Detailed progression
      </IonButton>
      { isProgressModalOpen && createPortal(
        <ProgressModal campaign={ campaign }
                       isOwner={ isOwner }
                       onClose={ toggleProgressModal }/>,
        document.body) }
    </div>

  </div>
}