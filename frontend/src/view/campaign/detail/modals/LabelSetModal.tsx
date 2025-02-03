import React, { useEffect, useState } from "react";
import { AnnotationCampaign, usePatchCampaignMutation, useRetrieveCampaignQuery } from "@/service/campaign";
import { useToast } from "@/service/ui";
import { getErrorMessage } from "@/service/function.ts";
import { Modal, ModalFooter, ModalHeader, WarningText } from "@/components/ui";
import { IonButton, IonSpinner } from "@ionic/react";
import styles from './modal.module.scss';
import { useRetrieveLabelSetQuery } from "@/service/campaign/label-set";
import { LabelSetDisplay } from "@/components/campaign/label/LabelSet.tsx";

export const LabelSetModal: React.FC<{
  campaign: AnnotationCampaign;
  isOwner: boolean;
  onClose?(): void;
}> = ({ campaign, onClose, isOwner }) => {
  const toast = useToast();
  const { data: labelSet, isFetching, error } = useRetrieveLabelSetQuery(campaign.label_set);
  const [ patchCampaign, {
    isLoading: isSubmitting,
    error: patchError,
    isSuccess: isPatchSuccessful
  } ] = usePatchCampaignMutation();
  const { refetch: refetchCampaign } = useRetrieveCampaignQuery(campaign.id);

  const [ labelsWithAcousticFeatures, setLabelsWithAcousticFeatures ] = useState<string[]>(campaign.labels_with_acoustic_features);
  const [ disabled, setDisabled ] = useState<boolean>(true);

  useEffect(() => {
    if (patchError) toast.presentError(getErrorMessage(patchError));
  }, [ patchError ]);
  useEffect(() => {
    if (isPatchSuccessful) toast.presentSuccess(`Labels successfully updated`);
  }, [ isPatchSuccessful ]);

  async function onSave() {
    try {
      await patchCampaign({
        id: campaign.id,
        labels_with_acoustic_features: labelsWithAcousticFeatures,
      }).unwrap();
      await refetchCampaign().unwrap();
    } finally {
      toggleDisabled()
    }
  }

  function toggleDisabled() {
    setDisabled(!disabled);
  }

  return (
    <Modal onClose={ onClose } className={ styles.modal }>
      <ModalHeader onClose={ onClose } title='Audio metadata'/>

      { isFetching && <IonSpinner/> }

      { error && <WarningText>{ getErrorMessage(error) }</WarningText> }

      { labelSet && <LabelSetDisplay set={ labelSet } disabled={ disabled }
                                     labelsWithAcousticFeatures={ labelsWithAcousticFeatures }
                                     setLabelsWithAcousticFeatures={ setLabelsWithAcousticFeatures }/> }
      <ModalFooter>
        { isOwner && (
          <IonButton fill='outline'
                     onClick={ toggleDisabled }
                     disabled={ isSubmitting }>
            Update
          </IonButton>
        ) }
        { isOwner && !disabled && (
          <IonButton fill='outline'
                     disabled={ isSubmitting }
                     onClick={ onSave }>
            Save
            { isSubmitting && <IonSpinner slot='end'/> }
          </IonButton>
        ) }
      </ModalFooter>
    </Modal>
  )
}
