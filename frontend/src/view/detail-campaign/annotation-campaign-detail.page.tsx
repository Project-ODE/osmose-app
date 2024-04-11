import React, { Fragment, useEffect, useMemo, useState } from 'react';
import { useHistory, useParams } from 'react-router-dom';
import { AnnotationCampaignRetrieveCampaign, useAnnotationCampaignAPI, useUsersAPI, } from "@/services/api";
import { AnnotationTaskStatus } from "@/types/annotations.ts";
import { IonButton, IonIcon, IonProgressBar, useIonAlert } from "@ionic/react";
import { archiveOutline, calendarClear, crop, documents, downloadOutline, people, pricetag } from "ionicons/icons";

import { User } from '@/types/user.ts';
import { SpectrogramConfiguration } from "@/types/process-metadata/spectrograms.ts";
import { AudioMetadatum } from "@/types/process-metadata/audio.ts";

import './annotation-campaign-detail.page.css';

type AnnotationStatus = {
  annotator: User;
  finished: number;
  total: number;
}

export const AnnotationCampaignDetail: React.FC = () => {
  const { id: campaignID } = useParams<{ id: string }>()
  const [annotationCampaign, setAnnotationCampaign] = useState<AnnotationCampaignRetrieveCampaign | undefined>(undefined);
  const [annotationStatus, setAnnotationStatus] = useState<Array<AnnotationStatus>>([]);
  const [isStaff, setIsStaff] = useState<boolean>(false);
  const [isCampaignOwner, setIsCampaignOwner] = useState<boolean>(false);
  const [spectroConfigurations, setSpectroConfigurations] = useState<Array<SpectrogramConfiguration>>([]);
  const [audioMetadata, setAudioMetadata] = useState<Array<AudioMetadatum>>([]);

  const isArchived = useMemo(() => !!annotationCampaign?.archive, [annotationCampaign?.archive]);
  const isEditionAllowed = useMemo(() => isStaff && isCampaignOwner && !isArchived, [isStaff, isCampaignOwner, isArchived]);

  const campaignService = useAnnotationCampaignAPI();
  const userService = useUsersAPI();
  const [error, setError] = useState<any | undefined>(undefined);
  const [presentAlert, dismissAlert] = useIonAlert();
  const history = useHistory()

  useEffect(() => {
    let isCancelled = false;

    Promise.all([
      userService.list(),
      campaignService.retrieve(campaignID),
      userService.isStaff().then(setIsStaff)
    ]).then(([users, data]) => {
      setAnnotationCampaign(data.campaign);

      const status = data.tasks
        .filter(task => task.annotator_id)
        .reduce((array: Array<AnnotationStatus>, value) => {
          const annotator = users.find(u => u.id === value.annotator_id);
          const finished = value.status === AnnotationTaskStatus.finished ? value.count : 0;
          const total = value.count;
          if (!annotator) return array;
          const currentStatus = array.find(s => s.annotator.id === value.annotator_id);
          if (currentStatus) {
            return [
              ...array.filter(s => s.annotator.id !== value.annotator_id),
              {
                annotator,
                finished: currentStatus.finished + finished,
                total: currentStatus.total + total
              }
            ]
          } else return [...array, { annotator, finished, total }]
        }, [])
      setAnnotationStatus(status);
      setIsCampaignOwner(data.is_campaign_owner);
      setSpectroConfigurations(data.spectro_configs);
      setAudioMetadata(data.audio_metadata);
    }).catch(e => {
      if (isCancelled) return;
      setError(e);
    })

    return () => {
      isCancelled = true;
      campaignService.abort();
      userService.abort();
      dismissAlert();
    }
  }, [campaignID])

  const openEditCampaign = () => {
    if (!annotationCampaign) return;
    history.push(`/annotation_campaign/${ annotationCampaign?.id }/edit`)
  }

  const archive = async () => {
    if (!annotationCampaign) return;
    if (annotationStatus.filter(s => s.finished < s.total).length > 0) {
      // If annotators haven't finished yet, ask for confirmation
      return await presentAlert({
        header: 'Archive',
        message: 'There is still unfinished annotations.\nAre you sure you want to archive this campaign?',
        cssClass: 'danger-confirm-alert',
        buttons: [
          'Cancel',
          {
            text: 'Archive',
            cssClass: 'ion-color-danger',
            handler: async () => {
              await campaignService.archive(annotationCampaign.id);
              window.location.reload();
            }
          }
        ]
      });
    } else {
      await campaignService.archive(annotationCampaign.id);
      window.location.reload();
    }
  }

  if (error) {
    return (
      <Fragment>
        <h1>Annotation Campaign</h1>
        <p className="error-message">{ error.message }</p>
      </Fragment>
    )
  }
  if (!annotationCampaign) {
    return <h6>Loading Annotation Campaign ...</h6>
  }
  return (
    <div id="detail-campaign">

      <div id="head">
        <h2>{ annotationCampaign.name }</h2>
        { isArchived && <p className="archive-description">Archived
            on { annotationCampaign?.archive?.date.toLocaleDateString() } by { annotationCampaign?.archive?.by_user.display_name }</p> }
      </div>

      <div id="global-info" className="bloc">
        <h5>Global information</h5>

        <div className="item">
          <IonIcon className="icon" icon={ pricetag }/>
          <p className="label">Label set:</p>
          <p>{ annotationCampaign.label_set.name }</p>
        </div>

        <div className="item">
          { annotationCampaign.confidence_indicator_set && <Fragment>
              <i className="icon fa fa-handshake"></i>
              <p className="label">Confidence indicator set:</p>
              <p>{ annotationCampaign.confidence_indicator_set.name }</p>
          </Fragment> }
        </div>

        <div className="item">
          <IonIcon className="icon" icon={ documents }/>
          <p className="label">Dataset:</p>
          <p>{ annotationCampaign.datasets_name.join(', ') }</p>
        </div>

        <div className="item">
          <IonIcon className="icon" icon={ people }/>
          <p className="label">Annotators:</p>
          <p>{ [...new Set(annotationStatus.map(s => s.annotator))].length }</p>
        </div>

        <div className="item">
          <IonIcon className="icon" icon={ crop }/>
          <p className="label">Mode:</p>
          <p>{ annotationCampaign.usage }</p>
        </div>

        <div className="item">
          { annotationCampaign.deadline && <Fragment>
              <IonIcon className="icon" icon={ calendarClear }/>
              <p className="label">Deadline:</p>
              <p>{ annotationCampaign.deadline.toLocaleDateString() }</p>
          </Fragment> }
        </div>

        { annotationCampaign.desc && <div className="description">
            <p className="label">Description:</p>
            <p>{ annotationCampaign.desc }</p>
        </div> }

        { isEditionAllowed && <div className="buttons">
            <IonButton color={ "medium" }
                       onClick={ archive }>
                <IonIcon icon={ archiveOutline }/>
                Archive
            </IonButton>
            <IonButton color={ "primary" }
                       onClick={ openEditCampaign }>
                Add annotators
            </IonButton>
        </div> }
      </div>

      <div id="status" className="bloc">
        <div className="head-bloc">
          <h5>Status</h5>

          <div className="buttons">
            <IonButton color="primary"
                       onClick={ () => campaignService.downloadResults(annotationCampaign) }>
              <IonIcon icon={ downloadOutline } slot="start"/>
              Results (csv)
            </IonButton>
            <IonButton color="primary"
                       onClick={ () => campaignService.downloadStatus(annotationCampaign) }>
              <IonIcon icon={ downloadOutline } slot="start"/>
              Task status (csv)
            </IonButton>
          </div>
        </div>

        <div className="table-bloc">
          <div className="table-bloc-head first">
            Annotator
          </div>
          <div className="table-bloc-head">
            Progress
          </div>
          { annotationStatus.map(status => {
            return (
              <Fragment key={ status.annotator?.id }>
                <div className="divider"/>
                <div className="table-bloc-content first">{ status.annotator?.display_name }</div>
                <div className="table-bloc-content">
                  <p>{ status.finished } / { status.total }</p>
                  <IonProgressBar color="medium" value={ status.finished / status.total }/>
                </div>
              </Fragment>
            );
          }) }
        </div>
      </div>

      <div id="spectro-conf" className="bloc">
        <div className="head-bloc">
          <h5>Spectrogram configuration</h5>

          <div className="buttons">
            <IonButton color="primary"
                       onClick={ () => campaignService.downloadSpectroConfig(annotationCampaign) }>
              <IonIcon icon={ downloadOutline } slot="start"/>
              Spectrogram configuration (csv)
            </IonButton>
          </div>
        </div>

        <div className="table-bloc"
             style={ { "--content-columns": spectroConfigurations.length } as React.CSSProperties }>
          <div className="table-bloc-head first">NFFT</div>
          { spectroConfigurations.map(c => <div key={ c.id } className="table-bloc-content">{ c.nfft }</div>) }
          <div className="divider"/>

          <div className="table-bloc-head first">Window</div>
          { spectroConfigurations.map(c => <div key={ c.id } className="table-bloc-content">
            { c.window_size } { c.window_type && `(${ c.window_type.name })` }
          </div>) }
          <div className="divider"/>

          <div className="table-bloc-head first">Overlap</div>
          { spectroConfigurations.map(c => <div key={ c.id } className="table-bloc-content">{ c.overlap }</div>) }
          <div className="divider"/>

          <div className="table-bloc-head first">Dataset sample rate</div>
          { spectroConfigurations.map(c => <div key={ c.id }
                                                className="table-bloc-content">{ c.dataset_sr / 1000 } kHz</div>) }
          <div className="divider"/>

          <div className="table-bloc-head first">Colormap</div>
          { spectroConfigurations.map(c => <div key={ c.id } className="table-bloc-content">{ c.colormap }</div>) }
          <div className="divider"/>

          <div className="table-bloc-head first">Zoom level</div>
          { spectroConfigurations.map(c => <div key={ c.id } className="table-bloc-content">{ c.zoom_level }</div>) }
          <div className="divider"/>

          <div className="table-bloc-head first">Dynamic (min/max)</div>
          { spectroConfigurations.map(c => <div key={ c.id } className="table-bloc-content">
            { c.dynamic_min } / { c.dynamic_max }
          </div>) }
          <div className="divider"/>

          <div className="table-bloc-head first">Data normalization</div>
          { spectroConfigurations.map(c => <div key={ c.id } className="table-bloc-content">
            { c.data_normalization }
          </div>) }
          <div className="divider"/>

          <div className="table-bloc-head first">High pass filter minimum frequency</div>
          { spectroConfigurations.map(c => <div key={ c.id } className="table-bloc-content">
            { c.hp_filter_min_freq } kHz
          </div>) }
          <div className="divider"/>

          <div className="table-bloc-head first">Spectrogram normalisation</div>
          { spectroConfigurations.map(c => <div key={ c.id } className="table-bloc-content">
            { c.spectro_normalization }
          </div>) }
          <div className="divider"/>

          <div className="table-bloc-head first">Zscore duration</div>
          { spectroConfigurations.map(c => <div key={ c.id } className="table-bloc-content">
            { c.zscore_duration }
          </div>) }
          <div className="divider"/>

          <div className="table-bloc-head first">Frequency resolution</div>
          { spectroConfigurations.map(c => <div key={ c.id } className="table-bloc-content">
            { c.frequency_resolution } Hz
          </div>) }
        </div>
      </div>

      <div id="audio-meta" className="bloc">
        <div className="head-bloc">
          <h5>Audio files metadata</h5>

          <div className="buttons">
            <IonButton color="primary"
                       onClick={ () => campaignService.downloadAudioMeta(annotationCampaign) }>
              <IonIcon icon={ downloadOutline } slot="start"/>
              Audio files metadata (csv)
            </IonButton>
          </div>
        </div>

        <div className="table-bloc"
             style={ { "--content-columns": audioMetadata.length } as React.CSSProperties }>
          <div className="table-bloc-head first">Sample bits</div>
          { audioMetadata.map(c => <div key={ c.id } className="table-bloc-content">{ c.sample_bits }</div>) }
          <div className="divider"/>

          <div className="table-bloc-head first">Channel count</div>
          { audioMetadata.map(c => <div key={ c.id } className="table-bloc-content">{ c.channel_count }</div>) }
          <div className="divider"/>

          <div className="table-bloc-head first">Start</div>
          { audioMetadata.map(c => <div key={ c.id }
                                        className="table-bloc-content">{ c.start.toLocaleString() }</div>) }
          <div className="divider"/>

          <div className="table-bloc-head first">End</div>
          { audioMetadata.map(c => <div key={ c.id } className="table-bloc-content">{ c.end.toLocaleString() }</div>) }
          <div className="divider"/>

          <div className="table-bloc-head first">Dataset sample rate</div>
          { audioMetadata.map(c => <div key={ c.id } className="table-bloc-content">{ c.dataset_sr }</div>) }
          <div className="divider"/>
        </div>
      </div>

    </div>
  )
}
