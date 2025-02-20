import React, { useEffect } from "react";
import { AnnotationCampaign } from "@/service/campaign";
import { useToast } from "@/service/ui";
import { getErrorMessage } from "@/service/function.ts";
import { Modal, ModalFooter, ModalHeader, WarningText } from "@/components/ui";
import { IonButton, IonIcon, IonNote, IonSpinner } from "@ionic/react";
import { downloadOutline } from "ionicons/icons";
import { useDownloadAudioMetadataMutation, useListAudioMetadataQuery } from "@/service/dataset/audio-metatada";
import { Table, TableContent, TableDivider, TableHead } from "@/components/table/table.tsx";
import styles from './modal.module.scss';

export const AudioMetadataModal: React.FC<{
  campaign: AnnotationCampaign;
  isOwner: boolean;
  onClose?(): void;
}> = ({ campaign, onClose, isOwner }) => {
  const toast = useToast();
  const { data: metadata, isLoading, error: loadingError } = useListAudioMetadataQuery({ campaignID: campaign!.id });
  const [ download, { error: downloadError } ] = useDownloadAudioMetadataMutation()

  useEffect(() => {
    if (downloadError) toast.presentError(downloadError);
  }, [ downloadError ]);

  function onDownload() {
    download(campaign)
  }

  return (
    <Modal onClose={ onClose } className={ styles.modal }>
      <ModalHeader onClose={ onClose } title='Audio metadata'/>

      { isLoading && <IonSpinner/> }

      { loadingError && <WarningText>{ getErrorMessage(loadingError) }</WarningText> }

      { metadata && metadata.length === 0 && <IonNote>No metadata</IonNote> }

      { metadata && metadata.length > 0 && <Table columns={ metadata.length + 1 } isFirstColumnSticky={ true }>
          <TableHead isFirstColumn={ true }>Files subtypes</TableHead>
        { metadata.map(c => <TableContent key={ c.id }>{ c.files_subtypes.join(', ') }</TableContent>) }
          <TableDivider/>

          <TableHead isFirstColumn={ true }>Channel count</TableHead>
        { metadata.map(c => <TableContent key={ c.id }>{ c.channel_count }</TableContent>) }
          <TableDivider/>

          <TableHead isFirstColumn={ true }>Start</TableHead>
        { metadata.map(c => <TableContent key={ c.id }>{ new Date(c.start).toLocaleString() }</TableContent>) }
          <TableDivider/>

          <TableHead isFirstColumn={ true }>End</TableHead>
        { metadata.map(c => <TableContent key={ c.id }>{ new Date(c.end).toLocaleString() }</TableContent>) }
          <TableDivider/>

          <TableHead isFirstColumn={ true }>Dataset sample rate</TableHead>
        { metadata.map(c => <TableContent key={ c.id }>{ c.dataset_sr / 1000 } kHz</TableContent>) }
          <TableDivider/>
      </Table>
      }

      <ModalFooter>
        { isOwner && metadata && metadata.length > 0 && (
          <IonButton fill='outline' onClick={ onDownload }>
            <IonIcon icon={ downloadOutline } slot='start'/>
            Download metadata (csv)
          </IonButton>
        ) }
      </ModalFooter>
    </Modal>
  )
}
