import React from "react";
import { IonButton } from "@ionic/react";
import { useAnnotator } from "@/service/annotator/hook.ts";

export const BackButton: React.FC = () => {
  const {
    campaignID,
  } = useAnnotator();

  const open = () => {
    window.open(`/app/annotation-campaign/${ campaignID }`, "_self")
  }

  const openAux = () => {
    window.open(`/app/annotation-campaign/${ campaignID }`, "_blank")
  }

  return <IonButton color="danger"
                    onClick={ open }
                    onAuxClick={ openAux }
                    title="Go back to annotation campaign tasks">
    Back to campaign
  </IonButton>
}