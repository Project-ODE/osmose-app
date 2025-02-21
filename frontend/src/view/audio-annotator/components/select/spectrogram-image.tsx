import { Input } from "@/components/form";
import { setBrightness, setContrast } from "@/service/annotator/slice";
import { useAppDispatch, useAppSelector } from "@/service/app";
import { IonButton, IonIcon } from "@ionic/react";
import { contrastOutline, sunnyOutline } from "ionicons/icons";
import React, { Fragment } from "react";

export const SpectrogramImage: React.FC = () => {
  const dispatch = useAppDispatch();

  const changeAllowed = useAppSelector(state => state.campaign.currentCampaign?.allow_image_tuning);
  const brightness = useAppSelector(state => state.annotator.userPreferences.brightness);
  const contrast = useAppSelector(state => state.annotator.userPreferences.contrast);

  if (!changeAllowed) return;

  return <Fragment>
    <div>
      <IonButton
        color="primary"
        fill="default"
        onClick={ () => dispatch(setBrightness(50)) }
      >
        <IonIcon icon={ sunnyOutline } slot="icon-only" />
      </IonButton>
      <Input
        type="range"
        name="brightness-range"
        min="0"
        max="100"
        onChange={(evt) => dispatch(setBrightness(evt.target.valueAsNumber))}
        onDoubleClick={() => dispatch(setBrightness(50))}
        value={brightness}
      />
      <Input
        type="number"
        name="brightness"
        min="0"
        max="100"
        onChange={(evt) => dispatch(setBrightness(evt.target.valueAsNumber))}
        value={brightness}
      />
    </div>

    <div>
      <IonButton
        color="primary"
        fill="default"
        onClick={ () => dispatch(setContrast(50)) }
      >
        <IonIcon icon={ contrastOutline } slot="icon-only" />
      </IonButton>
      <Input
        type="range"
        name="contrast-range"
        min="0"
        max="100"
        onChange={(evt) => dispatch(setContrast(evt.target.valueAsNumber))}
        onDoubleClick={() => dispatch(setContrast(50))}
        value={contrast}
      />
      <Input
        type="number"
        name="contrast"
        min="0"
        max="100"
        onChange={(evt) => dispatch(setContrast(evt.target.valueAsNumber))}
        value={contrast}
      />
    </div>
  </Fragment>;
}
