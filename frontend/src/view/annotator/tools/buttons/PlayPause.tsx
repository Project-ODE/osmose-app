import React, { MutableRefObject } from "react";
import { useAppSelector } from '@/service/app';
import { useAudioService } from "@/services/annotator/audio.service.ts";
import { IonButton, IonIcon } from "@ionic/react";
import { pause, play } from "ionicons/icons";
import { Kbd } from "@/components/ui/Kbd.tsx";
import { TooltipOverlay } from "@/components/ui";

export const PlayPauseButton: React.FC<{ player: MutableRefObject<HTMLAudioElement | null> }> = ({ player }) => {
  const {
    isPaused,
  } = useAppSelector(state => state.annotator.audio);
  const audioService = useAudioService(player)

  return <TooltipOverlay title='Shortcut' tooltipContent={ <p><Kbd keys='space' /> : Play/Pause audio</p> }>
    <IonButton color={ "primary" }
               shape={ "round" }
               onClick={ () => audioService.playPause() }>
      { isPaused && <IonIcon icon={ play } slot={ "icon-only" }/> }
      { !isPaused && <IonIcon icon={ pause } slot={ "icon-only" }/> }
    </IonButton>
  </TooltipOverlay>
}