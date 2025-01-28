import { setBrightness, setContrast } from "@/service/annotator/slice";
import { useAppDispatch, useAppSelector } from "@/service/app";
import { IonButton, IonIcon } from "@ionic/react";
import { contrastOutline, sunnyOutline } from "ionicons/icons";
import React, { Fragment } from "react";

export const SpectrogramImage: React.FC = () => {
  const dispatch = useAppDispatch();

  const brightness = useAppSelector(state => state.annotator.userPreferences.brightness);
  const contrast = useAppSelector(state => state.annotator.userPreferences.contrast);

  return <Fragment>
    <div>
      <IonButton
        color="primary"
        fill="default"
        onClick={ () => dispatch(setBrightness(100)) }
      >
        <IonIcon icon={ sunnyOutline } slot="icon-only" />
      </IonButton>
      <input type="range" name="brightness-range" min="0" max="200" onChange={(evt) => dispatch(setBrightness(evt.target.valueAsNumber))} value={brightness} />
      <input type="number" name="brightness" min="0" max="200" onChange={(evt) => dispatch(setBrightness(evt.target.valueAsNumber))} value={brightness} />
    </div>

    <div>
      <IonButton
        color="primary"
        fill="default"
        onClick={ () => dispatch(setContrast(100)) }
      >
        <IonIcon icon={ contrastOutline } slot="icon-only" />
      </IonButton>
      <input type="range" name="contrast-range" min="0" max="200" onChange={(evt) => dispatch(setContrast(evt.target.valueAsNumber))} value={contrast} />
      <input type="number" name="contrast" min="0" max="200" onChange={(evt) => dispatch(setContrast(evt.target.valueAsNumber))} value={contrast} />
    </div>
  </Fragment>;
}
