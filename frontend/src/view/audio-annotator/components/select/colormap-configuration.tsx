import { Select } from "@/components/form";
import { invertColormap, setColormap } from "@/service/annotator/slice";
import { useAppDispatch, useAppSelector } from "@/service/app";
import { COLORMAP_GREYS, COLORMAPS } from "@/services/utils/color";
import { IonButton, IonIcon } from "@ionic/react";
import { invertModeSharp } from "ionicons/icons";
import React, { useEffect, useState } from "react";

export const ColormapConfiguration: React.FC = () => {
  const dispatch = useAppDispatch();

  const [changeAllowed, setChangeAllowed] = useState<boolean>(false);

  const campaign = useAppSelector(state => state.campaign.currentCampaign);
  const selectedConfigID = useAppSelector(state => state.annotator.userPreferences.spectrogramConfigurationID);
  const configs = useAppSelector(state => state.annotator.spectrogram_configurations);
  const colormap = useAppSelector(state => state.annotator.userPreferences.colormap);
  const colormapInverted = useAppSelector(state => state.annotator.userPreferences.colormapInverted);

  useEffect(() => {
    const currentConfig = configs?.find((config) => config.id === selectedConfigID);
    console.log("currentConfig", currentConfig);
    setChangeAllowed(!!campaign?.allow_colormap_tuning && !!currentConfig && currentConfig.colormap === COLORMAP_GREYS);
  }, [campaign, selectedConfigID, configs])

  if (!changeAllowed) return;

  return <div>
    {/* Colormap selection */}
    <Select
      required={ true }
      value={ colormap }
      placeholder="Select a colormap"
      onValueSelected={ (value) => dispatch(setColormap(value as string)) }
      optionsContainer="popover"
      options={ Object.keys(COLORMAPS).map((cmap) => ({
        value: cmap, label: cmap, img: `/app/images/colormaps/${cmap.toLowerCase()}.png`
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
