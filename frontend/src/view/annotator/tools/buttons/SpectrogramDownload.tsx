import React, { Fragment, MutableRefObject, useState } from "react";
import { useAppSelector } from '@/service/app';
import { IonButton, IonIcon, IonSpinner } from "@ionic/react";
import { downloadOutline } from "ionicons/icons";
import { SpectrogramRender } from "@/view/audio-annotator/components/spectro-render.component.tsx";
import { useAnnotator } from "@/service/annotator/hook.ts";

export const SpectrogramDownloadButton: React.FC<{
  render: MutableRefObject<SpectrogramRender | null>
}> = ({ render }) => {
  const {
    annotatorData,
    user,
  } = useAnnotator();

  const [ isLoading, setIsLoading ] = useState<boolean>(false);

  const {
    userPreferences
  } = useAppSelector(state => state.annotator);

  const download = async () => {
    if (!annotatorData?.file.audio_url) return;
    const link = document.createElement('a');
    setIsLoading(true);
    const canvasData = await render.current?.getCanvasData().catch(e => {
      console.warn(e);
      setIsLoading(false)
    });
    if (!canvasData) return;
    link.href = canvasData;
    link.target = '_blank';
    let pathSplit = annotatorData.file.audio_url.split('/')
    pathSplit = pathSplit[pathSplit.length - 1].split('.');
    pathSplit.pop(); // Remove audio file extension
    const filename = pathSplit.join('.');
    link.download = `${ filename }-x${ userPreferences.zoomLevel }.png`;
    link.click();
    setIsLoading(false);
  }

  if (!annotatorData?.file || !user?.is_staff) return <Fragment/>
  return <IonButton color='medium' size='small' fill='outline'
                    onClick={ download }>
    <IonIcon icon={ downloadOutline } slot="start"/>
    Download spectrogram (zoom x{ userPreferences.zoomLevel })
    { isLoading && <IonSpinner/> }
  </IonButton>
}