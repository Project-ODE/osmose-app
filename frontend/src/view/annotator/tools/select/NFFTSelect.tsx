import React, { Fragment, useEffect, useMemo } from "react";
import { useAppDispatch, useAppSelector } from '@/service/app';
import { getScaleName, SpectrogramConfiguration } from '@/service/dataset/spectrogram-configuration';
import { selectSpectrogramConfiguration } from '@/service/annotator';
import { Select } from "@/components/form";
import { useAnnotator } from "@/service/annotator/hook.ts";

export const NFFTSelect: React.FC = () => {
  const {
    annotatorData,
  } = useAnnotator();
  const selectedID = useAppSelector(state => state.annotator.userPreferences.spectrogramConfigurationID);
  const spectrogram_configurations = useAppSelector(state => state.annotator.spectrogram_configurations);

  const dispatch = useAppDispatch()

  useEffect(() => {
    // TODO: bug here ???
    if (!selectedID) return;
    const configs: SpectrogramConfiguration[] = spectrogram_configurations ?? [];
    if (configs.find(c => c.id === selectedID)) return;
    const simpleSpectrogramID = configs?.find(s => !s.multi_linear_frequency_scale && !s.linear_frequency_scale)?.id;
    const newID = simpleSpectrogramID ?? Math.min(...configs.map(s => s.id));
    dispatch(selectSpectrogramConfiguration(newID))
  }, [selectedID]);

  const options = useMemo(() => {
    if (!annotatorData) return []
    return annotatorData.spectrogram_configurations.map(c => {
      let label = `nfft: ${ c.nfft }`;
      label += ` | winsize: ${ c.window_size }`
      label += ` | overlap: ${ c.overlap }`
      label += ` | scale: ${ getScaleName(c) }`
      return { value: c.id, label }
    })
  }, [ annotatorData?.spectrogram_configurations ]);

  function select(value: string | number | undefined) {
    if (value === undefined) return;
    dispatch(selectSpectrogramConfiguration(+value))
  }

  if (!annotatorData) return <Fragment/>
  return <Select placeholder='Select a configuration'
                 options={ options }
                 optionsContainer='popover'
                 value={ selectedID }
                 required={ true }
                 onValueSelected={ select }/>
}