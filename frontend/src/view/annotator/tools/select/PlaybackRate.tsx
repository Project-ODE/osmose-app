import React, { Fragment, MutableRefObject } from "react";
import { useAppSelector } from '@/service/app';
import { useAudioService } from "@/services/annotator/audio.service.ts";
import { Select } from "@/components/form";

const AVAILABLE_RATES: Array<number> = [ 0.25, 0.5, 1.0, 1.5, 2.0, 3.0, 4.0 ];


export const PlaybackRateSelect: React.FC<{ player: MutableRefObject<HTMLAudioElement | null> }> = ({ player }) => {

  const audioSpeed = useAppSelector(state => state.annotator.userPreferences.audioSpeed);

  const audioService = useAudioService(player)

  const onSelect = (value: string | number | undefined) => {
    if (!value) return;
    audioService.setAudioSpeed(+value)
  }

  if (!player || player.current?.preservesPitch === undefined) return <Fragment/>
  return <Select placeholder='Select playback rate'
                 options={ AVAILABLE_RATES.map(r => ({
                   value: r,
                   label: `${ r.toString() }x`
                 })) }
                 value={ audioSpeed }
                 required={ true }
                 optionsContainer='popover'
                 onValueSelected={ onSelect }/>
}