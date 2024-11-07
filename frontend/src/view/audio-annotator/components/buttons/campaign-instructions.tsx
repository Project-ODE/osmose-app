import React, { Fragment } from "react";
import { IonButton, IonIcon } from "@ionic/react";
import { informationCircle } from "ionicons/icons";
import { useAppSelector } from "@/slices/app.ts";

export const CampaignInstructionsButton: React.FC = () => {

  const {
    campaign,
  } = useAppSelector(state => state.annotator.global);

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