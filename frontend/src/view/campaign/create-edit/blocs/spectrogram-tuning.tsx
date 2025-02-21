import { FormBloc, Input } from "@/components/form";
import { useAppDispatch, useAppSelector } from "@/service/app";
import { selectDraftCampaign, updateDraftCampaign } from "@/service/campaign";
import { Dataset, useListDatasetQuery } from "@/service/dataset";
import { SpectrogramConfiguration } from "@/service/dataset/spectrogram-configuration";
import { COLORMAP_GREYS } from "@/services/utils/color";
import React, { useMemo } from "react";

export const SpectrogramTuningBloc: React.FC = () => {
  // Services
  const dispatch = useAppDispatch();
  const { data: allDatasets } = useListDatasetQuery();

  // State
  const draftCampaign = useAppSelector(selectDraftCampaign);

  const isColormapEditable = useMemo(() => {
    const allSpectroConfigs: SpectrogramConfiguration[] = allDatasets
      ?.filter((dataset: Dataset) => draftCampaign.datasets
      ?.includes(dataset.name)).flatMap((dataset: Dataset) => dataset.spectros) ?? [];
    const selectedColormaps: string[] = allSpectroConfigs
      .filter((config) => draftCampaign.spectro_configs?.includes(config.id))
      .map((config) => config.colormap);
    return selectedColormaps.includes(COLORMAP_GREYS);
  }, [ draftCampaign ]);

  return <FormBloc label="Spectrogram Tuning">
    {/* Brightness / contrast */}
    <Input
      type="checkbox"
      label="Allow brigthness / contrast modification"
      checked={ draftCampaign.allow_image_tuning ?? false }
      onChange={(evt) => dispatch(updateDraftCampaign({ allow_image_tuning: evt.target.checked }))}
    />

    {/* Colormap */}
    <Input
      type="checkbox"
      label="Allow colormap modification"
      checked={ draftCampaign.allow_colormap_tuning ?? false }
      onChange={(evt) => dispatch(updateDraftCampaign({ allow_colormap_tuning: evt.target.checked }))}
      note={isColormapEditable ? undefined : "Available only when at least one spectrogram configuration was generated in grey scale"}
      disabled={!isColormapEditable}
    />
  </FormBloc>;
}
