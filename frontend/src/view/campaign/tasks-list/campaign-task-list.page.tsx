import React, { Fragment, useEffect, useState } from 'react';
import { Link, useHistory, useParams } from 'react-router-dom';
import {
  useAnnotationFileRangeAPI,
  useAnnotationCampaignAPI,
  AnnotationCampaign
} from "@/services/api";
import { ANNOTATOR_GUIDE_URL } from "@/consts/links.ts";
import { IonButton, IonIcon, IonSpinner } from "@ionic/react";
import {
  checkmarkOutline,
  helpBuoyOutline,
  informationCircle
} from "ionicons/icons";
import './campaign-task-list.page.css';
import { AnnotationFileRangeWithFiles } from "@/services/api/annotation/file-range.service.tsx";

export const AnnotationTaskList: React.FC = () => {
  const { id: campaignID } = useParams<{ id: string }>();

  // Services
  const history = useHistory();
  const fileRangeService = useAnnotationFileRangeAPI();
  const campaignService = useAnnotationCampaignAPI()

  // States
  const [ fileRanges, setFileRanges ] = useState<Array<AnnotationFileRangeWithFiles> | undefined>();
  const [ campaign, setCampaign ] = useState<AnnotationCampaign | undefined>(undefined);
  const [ error, setError ] = useState<any | undefined>(undefined);

  useEffect(() => {
    document.body.scrollTo({ top: 0, behavior: 'instant' })
    let isCanceled = false;

    setError(undefined);
    Promise.all([
      campaignService.retrieve(campaignID).then(setCampaign),
      fileRangeService.listForCampaignCurrentUser(campaignID).then(setFileRanges)
    ]).catch(e => {
      if (isCanceled) return;
      setError(e);
      throw e
    })

    return () => {
      isCanceled = true;
      fileRangeService.abort();
    }
  }, [ campaignID ]);

  const openGuide = () => {
    window.open(ANNOTATOR_GUIDE_URL, "_blank", "noopener, noreferrer")
  }

  const openInstructions = () => {
    if (!campaign?.instructions_url) return;
    window.open(campaign.instructions_url, "_blank", "noopener, noreferrer")
  }

  const manage = () => history.push(`/annotation-campaign/${ campaignID }`);

  if (error) {
    return (
      <Fragment>
        <h1>Annotation Tasks</h1>
        <p className="error-message">{ error.message }</p>
      </Fragment>
    )
  }

  return (
    <div id="campaign-task-list">

      <div className="head">
        <h2>{ campaign?.name }</h2>
        <p className="subtitle">Annotation files</p>
      </div>

      <div className="d-flex justify-content-center gap-1 flex-wrap">
        <IonButton fill="outline" shape="round" onClick={ manage }>
          { campaign?.archive === null ? "Manage" : "Info" }
        </IonButton>
        <IonButton color="warning" shape="round" fill="outline" onClick={ openGuide }>
          User guide
          <IonIcon icon={ helpBuoyOutline } slot="end"/>
        </IonButton>
        { campaign?.instructions_url && <IonButton color="secondary" shape="round" onClick={ openInstructions }>
            <IonIcon icon={ informationCircle } slot="start"/>
            Campaign instructions
        </IonButton> }
      </div>

      { !fileRanges && <IonSpinner/> }
      { fileRanges && fileRanges.length === 0 && "No files to annotate" }
      { fileRanges && fileRanges.length > 0 && <table className="table table-bordered">
          <thead>
          <tr>
              <th>Filename</th>
              <th>Dataset</th>
              <th>Date</th>
              <th>Duration</th>
              <th>Results</th>
              <th>Submitted</th>
              <th>Link</th>
          </tr>
          </thead>
          <tbody>
          { fileRanges.map((range, index) => <Fragment>
            { index > 0 && <tr key={ index } className="empty"></tr> }
            { range.files.map(file => {
              const startDate = new Date(file.start);
              const diffTime = new Date(new Date(file.end).getTime() - startDate.getTime());
              return <tr className={ file.is_submitted ? 'table-success' : '' }
                         key={ file.id }>
                <td>{ file.filename }</td>
                <td>{ file.dataset_name }</td>
                <td>{ startDate.toLocaleDateString() }</td>
                <td>{ diffTime.toUTCString().split(' ')[4] }</td>
                <td>{ file.results_count }</td>
                <td>
                  { file.is_submitted && <IonIcon icon={ checkmarkOutline }/> }
                </td>
                <td><Link to={ `/annotation-campaign/${ campaignID }/file/${ file.id }` }>Task link</Link></td>
              </tr>
            })
            }
          </Fragment>) }
          </tbody>
      </table> }
    </div>
  )
}
