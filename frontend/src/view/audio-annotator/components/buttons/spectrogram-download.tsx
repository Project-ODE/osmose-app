import React, { Fragment, MutableRefObject, useState } from "react";
import { useAppSelector } from "@/slices/app.ts";
import { IonButton, IonIcon, IonSpinner } from "@ionic/react";
import { downloadOutline } from "ionicons/icons";
import { SpectrogramRender } from "@/view/audio-annotator/components/spectro-render.component.tsx";

export const SpectrogramDownloadButton: React.FC<{
  render: MutableRefObject<SpectrogramRender | null>
}> = ({ render }) => {
  const [ isLoading, setIsLoading ] = useState<boolean>(false);

  const {
    user,
    file
  } = useAppSelector(state => state.annotator.global);
  const {
    currentZoom
  } = useAppSelector(state => state.annotator.spectro);

  const download = async () => {
    if (!file?.audio_url) return;
    const link = document.createElement('a');
    setIsLoading(true);
    const data = await render.current?.getCanvasData().catch(e => {
      console.warn(e);
      setIsLoading(false)
    });
    if (!data) return;
    link.href = data;
    link.target = '_blank';
    let pathSplit = file?.audio_url.split('/')
    pathSplit = pathSplit[pathSplit.length - 1].split('.');
    pathSplit.pop(); // Remove audio file extension
    const filename = pathSplit.join('.');
    link.download = `${ filename }-x${ currentZoom }.png`;
    link.click();
    setIsLoading(false);
  }

  if (!file || !user?.is_staff) return <Fragment/>
  return <IonButton color="dark"
                    fill={ "outline" }
                    onClick={ download }>
    <IonIcon icon={ downloadOutline } slot="start"/>
    Download spectrogram (zoom x{ currentZoom })
    { isLoading && <IonSpinner/> }
  </IonButton>
}