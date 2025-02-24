import React, { Fragment } from "react";
import { IonButton, IonIcon } from "@ionic/react";
import { informationCircle } from "ionicons/icons";
import { useAnnotator } from "@/service/annotator/hook.ts";

export const CampaignInstructionsButton: React.FC = () => {
  const {
    campaign,
  } = useAnnotator();

  const open = () => {
    if (!campaign?.instructions_url) return;
    window.open(campaign?.instructions_url, "_blank", "noopener, noreferrer")
  }

  if (!campaign?.instructions_url) return <Fragment/>;
  return <IonButton color="dark"
                    fill={ "outline" }
                    onClick={ open }
                    onAuxClick={ open }>
    <IonIcon icon={ informationCircle } slot="start"/>
    Campaign instructions
  </IonButton>
}