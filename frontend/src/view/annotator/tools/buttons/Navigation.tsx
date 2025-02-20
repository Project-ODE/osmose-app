import React, { useEffect, useRef } from "react";
import { useHistory } from "react-router-dom";
import { IonButton, IonIcon } from "@ionic/react";
import { caretBack, caretForward } from "ionicons/icons";
import { useAppSelector } from '@/service/app';
import { useAnnotatorSubmitService } from "@/services/annotator/submit.service.ts";
import { useAlert, useToast } from "@/service/ui";
import { Kbd, TooltipOverlay } from "@/components/ui";
import styles from '../annotator-tools.module.scss'
import { KEY_DOWN_EVENT } from "@/service/events";
import { useAnnotator } from "@/service/annotator/hook.ts";


export const NavigationButtons: React.FC = () => {
  const {
    campaignID,
    annotatorData,
  } = useAnnotator();

  // Services
  const history = useHistory();
  const submitService = useAnnotatorSubmitService();
  const toast = useToast();
  const alert = useAlert();

  // Data
  const {
    hasChanged: _hasChanged,
  } = useAppSelector(state => state.annotator);

  const previous_file_id = useRef<number | null>(annotatorData?.previous_file_id ?? null);
  useEffect(() => {
    previous_file_id.current = annotatorData?.previous_file_id ?? null;
  }, [ annotatorData?.previous_file_id ]);
  const next_file_id = useRef<number | null>(annotatorData?.next_file_id ?? null);
  useEffect(() => {
    next_file_id.current = annotatorData?.next_file_id ?? null;
  }, [ annotatorData?.next_file_id ]);

  const hasChanged = useRef<boolean>(_hasChanged);
  useEffect(() => {
    hasChanged.current = _hasChanged
  }, [ _hasChanged ]);

  const isSubmitting = useRef<boolean>(false);

  useEffect(() => {
    KEY_DOWN_EVENT.add(onKbdEvent);
    return () => {
      KEY_DOWN_EVENT.remove(onKbdEvent);
    }
  }, []);

  function onKbdEvent(event: KeyboardEvent) {
    switch (event.code) {
      case 'Enter':
      case 'NumpadEnter':
        event.preventDefault();
        submit();
        break;
      case 'ArrowLeft':
        navPrevious();
        break;
      case 'ArrowRight':
        navNext();
        break;
    }
  }

  const submit = async () => {
    isSubmitting.current = true;
    try {
      await submitService.submit()
      if (next_file_id.current) {
        history.push(`/annotation-campaign/${ campaignID }/file/${ next_file_id.current }/new`);
      } else {
        history.push(`/annotation-campaign/${ campaignID }`)
      }
    } catch (e: any) {
      toast.presentError(e)
    } finally {
      isSubmitting.current = false;
    }
  }

  const navPrevious = async () => {
    if (!previous_file_id.current) return;
    if (hasChanged.current) {
      await alert.present({
        message: `You have unsaved changes. Are you sure you want to forget all of them?`,
        cssClass: 'danger-confirm-alert',
        buttons: [
          'Cancel',
          {
            text: `Forget my changes`,
            cssClass: 'ion-color-danger',
            handler: () => history.push(`/annotation-campaign/${ campaignID }/file/${ previous_file_id.current }/new`)
          }
        ]
      })
    } else
      history.push(`/annotation-campaign/${ campaignID }/file/${ previous_file_id.current }/new`);
  }
  const navNext = async () => {
    if (!next_file_id.current) return;
    if (hasChanged.current) {
      await alert.present({
        message: `You have unsaved changes. Are you sure you want to forget all of them?`,
        cssClass: 'danger-confirm-alert',
        buttons: [
          'Cancel',
          {
            text: `Forget my changes`,
            cssClass: 'ion-color-danger',
            handler: () => history.push(`/annotation-campaign/${ campaignID }/file/${ next_file_id.current }/new`)
          }
        ]
      })
    } else
      history.push(`/annotation-campaign/${ campaignID }/file/${ next_file_id.current }/new`);
  }

  if (!annotatorData?.is_assigned) return <div/>
  return (
    <div className={ styles.navigation }>
      <TooltipOverlay title='Shortcut' tooltipContent={ <p><Kbd keys='left'/> : Load previous recording</p> }>
        <IonButton color='medium' fill='clear' size='small'
                   disabled={ isSubmitting.current || previous_file_id.current === null }
                   onClick={ navPrevious }>
          <IonIcon icon={ caretBack } slot='icon-only'/>
        </IonButton>
      </TooltipOverlay>
      <TooltipOverlay title='Shortcut' tooltipContent={ <p><Kbd keys='enter'/> : Submit & load next recording</p> }>
        <IonButton color='medium' fill='outline'
                   disabled={ isSubmitting.current }
                   onClick={ submit }>
          Submit &amp; load next recording
        </IonButton>
      </TooltipOverlay>
      <TooltipOverlay title='Shortcut' tooltipContent={ <p><Kbd keys='right'/> : Load next recording</p> }>
        <IonButton color='medium' fill='clear' size='small'
                   disabled={ isSubmitting.current || next_file_id.current === null }
                   onClick={ navNext }>
          <IonIcon icon={ caretForward } slot='icon-only'/>
        </IonButton>
      </TooltipOverlay>
    </div>
  )
}
