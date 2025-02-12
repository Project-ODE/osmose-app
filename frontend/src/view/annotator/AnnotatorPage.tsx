import React, { Fragment, useEffect } from "react";
import styles from './annotator.module.scss';
import { Footer, Header } from "@/components/layout";
import { IonButton, IonIcon } from "@ionic/react";
import { useHistory } from "react-router-dom";
import { Annotator } from "@/view/annotator/Annotator.tsx";
import { Link, Progress } from "@/components/ui";
import { helpBuoyOutline } from "ionicons/icons";
import { IoCheckmarkCircleOutline, IoChevronForwardOutline } from "react-icons/io5";
import { useToast } from "@/service/ui";
import { useAnnotator } from "@/service/annotator/hook.ts";
import { useAppSelector } from "@/service/app.ts";

export const AnnotatorPage: React.FC = () => {
  const {
    campaignID,
    fileID,
    annotatorData,
    campaign,
  } = useAnnotator();

  const toast = useToast();
  const history = useHistory();
  const pointerPosition = useAppSelector(state => state.annotator.ui.pointerPosition);

  useEffect(() => {
    return () => {
      toast.dismiss();
    }
  }, [])

  function backToCampaign() {
    window.open(`/app/annotation-campaign/${ campaignID }`, "_self")
  }

  function auxBackToCampaign() {
    window.open(`/app/annotation-campaign/${ campaignID }`, "_blank")
  }

  function backToOldInterface() {
    history.push(`/annotation-campaign/${ campaignID }/file/${ fileID }`);
  }

  // 'page' class is for playwright tests
  return <div className={ [ styles.page, pointerPosition ? styles.disableScroll : '', 'page' ].join(' ') }>
    <Header size='small'
            buttons={ <Fragment>
              <IonButton fill='outline' size='small' color='medium' onClick={ backToOldInterface }>
                Back to old annotator
              </IonButton>

              { campaign?.instructions_url &&
                  <Link color='medium' target='_blank' href={ campaign?.instructions_url }>
                      <IonIcon icon={ helpBuoyOutline } slot='start'/>
                      Campaign instructions
                  </Link>
              }

              <IonButton color='medium' fill='outline' size='small'
                         onClick={ backToCampaign } onAuxClick={ auxBackToCampaign }>
                Back to campaign
              </IonButton>
            </Fragment> }>
      { annotatorData && campaign && <div className={ styles.info }>
          <p>
            { campaign.name } <IoChevronForwardOutline/> { annotatorData.file.filename } { annotatorData.is_submitted &&
              <IoCheckmarkCircleOutline/> }
          </p>
          <Progress label='Progression'
                    className={ styles.progress }
                    value={ annotatorData.current_task_index + 1 }
                    total={ annotatorData.total_tasks }/>
      </div> }
    </Header>

    <Annotator/>

    <Footer/>
  </div>
}