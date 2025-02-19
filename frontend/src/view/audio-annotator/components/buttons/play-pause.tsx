import React, { MutableRefObject } from "react";
import OverlayTrigger from "react-bootstrap/OverlayTrigger";
import Tooltip from "react-bootstrap/Tooltip";
import { NavigationShortcutOverlay } from "@/view/audio-annotator/components/navigation-buttons.component.tsx";
import { IonButton, IonIcon } from "@ionic/react";
import { pause, play } from "ionicons/icons";
import { useAppSelector } from '@/service/app';
import { useAudioService } from "@/services/annotator/audio.service.ts";

export const PlayPauseButton: React.FC<{ player: MutableRefObject<HTMLAudioElement | null> }> = ({ player }) => {
  const {
    isPaused,
  } = useAppSelector(state => state.annotator.audio);
  const audioService = useAudioService(player)

  return <OverlayTrigger
    placement='bottom'
    overlay={ <Tooltip><NavigationShortcutOverlay shortcut="Space" description="Play/Pause audio"/></Tooltip> }>
    <IonButton color={ "primary" }
               shape={ "round" }
               onClick={ () => audioService.playPause() }>
      { isPaused && <IonIcon icon={ play } slot={ "icon-only" }/> }
      { !isPaused && <IonIcon icon={ pause } slot={ "icon-only" }/> }
    </IonButton>
  </OverlayTrigger>
}