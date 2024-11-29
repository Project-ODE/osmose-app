import React, { useEffect, useState } from 'react';
import { IonButton, IonIcon, IonSpinner } from "@ionic/react";
import { AudioMetadatum, useAudioMetadataAPI } from "@/services/api";
import { downloadOutline } from "ionicons/icons";
import { Table, TableContent, TableDivider, TableHead } from "@/components/table/table.tsx";
import './blocs.css';
import { useAppSelector } from '@/slices/app.ts';
import { selectCurrentCampaign } from '@/service/campaign/function.ts';

interface Props {
  isOwner: boolean;
  setError: (e: any) => void
}

export const DetailCampaignAudioMetadata: React.FC<Props> = ({ setError, isOwner }) => {
  // State
  const [ metadata, setMetadata ] = useState<Array<AudioMetadatum> | undefined>();
  const campaign = useAppSelector(selectCurrentCampaign);

  // Service
  const audioMetadataService = useAudioMetadataAPI();

  useEffect(() => {
    let isCancelled = false;

    audioMetadataService.listForCampaign(campaign)
      .then(setMetadata)
      .catch(e => {
        if (isCancelled) return;
        setError(e);
      })

    return () => {
      isCancelled = true;
      audioMetadataService.abort();
    }
  }, [ campaign?.id ])

  return (
    <div id="audio-meta" className="bloc">
      <div className="head-bloc">
        <h5>Audio files metadata</h5>

        <div className="buttons">
          { !metadata && <IonSpinner/> }
          { isOwner && metadata && metadata.length > 0 && <IonButton color="primary"
                                                                     onClick={ () => audioMetadataService.downloadForCampaign(campaign) }>
              <IonIcon icon={ downloadOutline } slot="start"/>
              Audio files metadata (csv)
          </IonButton> }
          { metadata && metadata.length === 0 && "No metadata" }
        </div>
      </div>

      { metadata && metadata.length > 0 && <Table columns={ metadata.length + 1 } isFirstColumnSticky={ true }>
          <TableHead isFirstColumn={ true }>Sample bits</TableHead>
        { metadata.map(c => <TableContent key={ c.id }>{ c.sample_bits }</TableContent>) }
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
    </div>
  )
}
