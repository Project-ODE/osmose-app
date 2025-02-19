import React, { ChangeEvent, useEffect } from "react";
import { useAppDispatch, useAppSelector } from '@/service/app';
import { getScaleName, SpectrogramConfiguration } from '@/service/dataset/spectrogram-configuration';
import { selectSpectrogramConfiguration } from '@/service/annotator';

export const SpectrogramConfigurationSelect: React.FC = () => {
  const spectrogramConfigurationID = useAppSelector(state => state.annotator.userPreferences.spectrogramConfigurationID);
  const spectrogramConfigurations = useAppSelector(state => state.annotator.spectrogram_configurations);

  const dispatch = useAppDispatch()

  const onSelect = (e: ChangeEvent<HTMLSelectElement>) => {
    dispatch(selectSpectrogramConfiguration(+e.target.value))
  }

  useEffect(() => {
    if (!spectrogramConfigurationID) return;
    const configs: SpectrogramConfiguration[] = spectrogramConfigurations ?? [];
    if (configs.find(c => c.id === spectrogramConfigurationID)) return;
    const simpleSpectrogramID = configs?.find(s => !s.multi_linear_frequency_scale && !s.linear_frequency_scale)?.id;
    const newID = simpleSpectrogramID ?? Math.min(...configs.map(s => s.id));
    dispatch(selectSpectrogramConfiguration(newID))
  }, [spectrogramConfigurationID]);

  return <select defaultValue={ spectrogramConfigurationID }
                 onChange={ onSelect }>
    { spectrogramConfigurations?.map(spectrogram => (
      <option key={ spectrogram.id } value={ spectrogram.id }>
        nfft: { spectrogram.nfft } | winsize: { spectrogram.window_size } | overlap: { spectrogram.overlap } |
        scale: { getScaleName(spectrogram) }
      </option>
    ))
    }
  </select>
}