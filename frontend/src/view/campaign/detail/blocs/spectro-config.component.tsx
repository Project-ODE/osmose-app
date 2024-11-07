import React, { Fragment, useEffect, useState } from 'react';
import { IonButton, IonIcon, IonSpinner } from "@ionic/react";
import { AnnotationCampaign, useSpectrogramConfigurationAPI } from "@/services/api";
import { downloadOutline } from "ionicons/icons";
import { SpectrogramConfiguration } from "@/types/process-metadata/spectrograms.ts";
import { Table, TableContent, TableDivider, TableHead } from "@/components/table/table.tsx";
import './blocs.css';

interface Props {
  isOwner: boolean;
  campaign: AnnotationCampaign;
  setError: (e: any) => void
}

export const DetailCampaignSpectrogramConfiguration: React.FC<Props> = ({ campaign, setError, isOwner }) => {
  // State
  const [ configurations, setConfigurations ] = useState<Array<SpectrogramConfiguration> | undefined>([]);

  // Service
  const spectrogramService = useSpectrogramConfigurationAPI();

  useEffect(() => {
    let isCancelled = false;

    spectrogramService.listForCampaign(campaign.id)
      .then(setConfigurations)
      .catch(e => {
        if (isCancelled) return;
        setError(e);
      })

    return () => {
      isCancelled = true;
      spectrogramService.abort();
    }
  }, [ campaign.id ])

  return (
    <div id="campaign-detail-spectro-config" className="bloc">
      <div className="head-bloc">
        <h5>Spectrogram configuration</h5>

        <div className="buttons">
          { isOwner && configurations && configurations.length > 0 && <IonButton color="primary"
                                                                                 onClick={ () => spectrogramService.downloadForCampaign(campaign) }>
              <IonIcon icon={ downloadOutline } slot="start"/>
              Spectrogram configuration (csv)
          </IonButton> }
          { configurations && configurations.length === 0 && "No spectrogram configuration" }
        </div>
      </div>

      { !configurations && <IonSpinner/> }
      { configurations && configurations.length > 0 &&
          <Table columns={ configurations.length + 1 } isFirstColumnSticky={ true }>
              <TableHead isFirstColumn={ true }>NFFT</TableHead>
            { configurations.map(c => <TableContent key={ c.id }>{ c.nfft }</TableContent>) }
              <TableDivider/>

              <TableHead isFirstColumn={ true }>Window</TableHead>
            { configurations.map(c => <TableContent key={ c.id }>
              { c.window_size } { c.window_type && `(${ c.window_type.name })` }
            </TableContent>) }
              <TableDivider/>

              <TableHead isFirstColumn={ true }>Overlap</TableHead>
            { configurations.map(c => <TableContent key={ c.id }>{ c.overlap }</TableContent>) }
              <TableDivider/>

              <TableHead isFirstColumn={ true }>Colormap</TableHead>
            { configurations.map(c => <TableContent key={ c.id }>{ c.colormap }</TableContent>) }
              <TableDivider/>

              <TableHead isFirstColumn={ true }>Zoom level</TableHead>
            { configurations.map(c => <TableContent key={ c.id }>{ c.zoom_level }</TableContent>) }
              <TableDivider/>

              <TableHead isFirstColumn={ true }>Dynamic (min/max)</TableHead>
            { configurations.map(c => <TableContent key={ c.id }>
              { c.dynamic_min } / { c.dynamic_max }
            </TableContent>) }
              <TableDivider/>

              <TableHead isFirstColumn={ true }>Spectrogram duration</TableHead>
            { configurations.map(c => <TableContent key={ c.id }>
              { c.spectro_duration }
            </TableContent>) }
              <TableDivider/>

              <TableHead isFirstColumn={ true }>Data normalization</TableHead>
            { configurations.map(c => <TableContent key={ c.id }>
              { c.data_normalization }
            </TableContent>) }
              <TableDivider/>

            { configurations.some(c => c.data_normalization === 'zscore') && <Fragment>
                <TableHead isFirstColumn={ true }>Zscore duration</TableHead>
              { configurations.map(c => <TableContent key={ c.id }>
                { c.zscore_duration }
              </TableContent>) }
                <TableDivider/>
            </Fragment> }

            { configurations.some(c => c.data_normalization === 'instrument') && <Fragment>
                <TableHead isFirstColumn={ true }>Sensitivity (dB)</TableHead>
              { configurations.map(c => <TableContent key={ c.id }>
                { c.sensitivity_dB }
              </TableContent>) }
                <TableDivider/>
            </Fragment> }

            { configurations.some(c => c.data_normalization === 'instrument') && <Fragment>
                <TableHead isFirstColumn={ true }>Gain (dB)</TableHead>
              { configurations.map(c => <TableContent key={ c.id }>
                { c.gain_dB }
              </TableContent>) }
                <TableDivider/>
            </Fragment> }

            { configurations.some(c => c.data_normalization === 'instrument') && <Fragment>
                <TableHead isFirstColumn={ true }>Peak voltage</TableHead>
              { configurations.map(c => <TableContent key={ c.id }>
                { c.peak_voltage }
              </TableContent>) }
                <TableDivider/>
            </Fragment> }

              <TableHead isFirstColumn={ true }>High pass filter minimum frequency</TableHead>
            { configurations.map(c => <TableContent key={ c.id }>
              { c.hp_filter_min_freq } kHz
            </TableContent>) }
              <TableDivider/>

              <TableHead isFirstColumn={ true }>Spectrogram normalisation</TableHead>
            { configurations.map(c => <TableContent key={ c.id }>
              { c.spectro_normalization }
            </TableContent>) }
              <TableDivider/>

              <TableHead isFirstColumn={ true }>Resolution</TableHead>
            { configurations.map(c => <TableContent key={ c.id }>
              { c.frequency_resolution } Hz
              { c.temporal_resolution !== null && <Fragment>
                  <br/>
                { c.temporal_resolution } s
              </Fragment> }
            </TableContent>) }
              <TableDivider/>

              <TableHead isFirstColumn={ true }>Audio file dataset overlap</TableHead>
            { configurations.map(c => <TableContent key={ c.id }>
              { c.audio_file_dataset_overlap }
            </TableContent>) }
              <TableDivider/>
          </Table>
      }
    </div>
  )
}
