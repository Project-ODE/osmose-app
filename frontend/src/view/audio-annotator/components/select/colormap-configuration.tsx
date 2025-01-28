import { Select } from "@/components/form";
import { invertColormap, setColormap } from "@/service/annotator/slice";
import { useAppDispatch, useAppSelector } from "@/service/app";
import { COLORMAPS } from "@/services/utils/color";
import { IonButton, IonIcon } from "@ionic/react";
import { invertModeSharp } from "ionicons/icons";
import React from "react";

export const ColormapConfiguration: React.FC = () => {
  const dispatch = useAppDispatch();

  const colormap = useAppSelector(state => state.annotator.userPreferences.colormap);
  const colormapInverted = useAppSelector(state => state.annotator.userPreferences.colormapInverted);

  return <div>
    {/* Colormap selection */}
    <Select
      required={ true }
      value={ colormap }
      placeholder="Select a colormap"
      onValueSelected={ (value) => dispatch(setColormap(value as string)) }
      optionsContainer="popover"
      options={ Object.keys(COLORMAPS).map((cmap) => ({
        value: cmap, label: cmap, img: `/app/images/colormaps/${cmap}.png`
      })) }
    />

    {/* Colormap inversion */}
    <IonButton
      color="primary"
      className={ colormapInverted ? "inverted" : "" }
      fill={ colormapInverted ? "outline" : "default" }
      onClick={ () => dispatch(invertColormap()) }>
      <IonIcon icon={ invertModeSharp } slot={ "icon-only" } />
    </IonButton>
  </div>;
}
