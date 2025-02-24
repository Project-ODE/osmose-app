import React, { Fragment } from "react";
import { IonButton, IonIcon } from "@ionic/react";
import { downloadOutline } from "ionicons/icons";
import { useAnnotator } from "@/service/annotator/hook.ts";

export const AudioDownloadButton: React.FC = () => {
  const {
    annotatorData,
    user,
  } = useAnnotator();

  const download = () => {
    if (!annotatorData?.file.audio_url) return;
    const link = document.createElement('a');
    link.href = annotatorData.file.audio_url;
    link.target = '_blank';
    const pathSplit = annotatorData.file.audio_url.split('/')
    link.download = pathSplit[pathSplit.length - 1];
    link.click();
  }

  if (!annotatorData || !user?.is_staff) return <Fragment/>
  return <IonButton color='medium' size='small' fill='outline'
                    onClick={ download }>
    <IonIcon icon={ downloadOutline } slot="start"/>
    Download audio
  </IonButton>
}