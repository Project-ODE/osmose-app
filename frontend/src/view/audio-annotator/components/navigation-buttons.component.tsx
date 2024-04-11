import React, { Fragment, ReactNode, useEffect, useImperativeHandle, useState } from "react";
import OverlayTrigger from "react-bootstrap/OverlayTrigger";
import { useHistory } from "react-router-dom";
import { KeypressHandler } from "../audio-annotator.page.tsx";
import { AnnotationTaskDto, useAnnotationTaskAPI } from "@/services/api";
import { AnnotationType } from "@/types/annotations.ts";
import { confirm } from "../../global-components";
import Tooltip from "react-bootstrap/Tooltip";
import { IonButton, IonIcon } from "@ionic/react";
import { caretBack, caretForward } from "ionicons/icons";
import { useAppSelector } from "@/slices/app";

interface Props {
  shortcut: ReactNode;
  description: string;
}

export const NavigationShortcutOverlay = React.forwardRef<HTMLDivElement, Props>(({
                                                                                    shortcut,
                                                                                    description,
                                                                                  }, ref) => (
  <div className="card" ref={ ref }>
    <h3 className={ `card-header tooltip-header` }>Shortcut</h3>
    <div className="card-body p-1">
      <p>
        <span className="font-italic">
          { shortcut }
        </span>
        { ` : ${ description }` }<br/>
      </p>
    </div>
  </div>
))

export const NavigationButtons = React.forwardRef<KeypressHandler, { start: Date }>(({ start }, ref) => {
  const history = useHistory();
  const [siblings, setSiblings] = useState<{ prev?: number, next?: number } | undefined>()
  const taskAPI = useAnnotationTaskAPI();
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const {
    prevAndNextAnnotation,
    areShortcutsEnabled,
    taskId,
    mode,
    campaignId,
  } = useAppSelector(state => state.annotator.global);
  const {
    results,
    taskComment,
    hasChanged
  } = useAppSelector(state => state.annotator.annotations);

  useEffect(() => {
    setSiblings(prevAndNextAnnotation);
  }, [prevAndNextAnnotation])

  const handleKeyPressed = (event: KeyboardEvent) => {
    if (!areShortcutsEnabled) return;
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

  useImperativeHandle(ref, () => ({ handleKeyPressed }))

  const submit = async () => {
    const now = new Date().getTime();
    setIsSubmitting(true);
    const response = await taskAPI.update(taskId!, {
      annotations: results.map(r => {
        const isBox = r.type === AnnotationType.box;
        const startTime = isBox ? r.startTime : null;
        const endTime = isBox ? r.endTime : null;
        const startFrequency = isBox ? r.startFrequency : null;
        const endFrequency = isBox ? r.endFrequency : null;
        const result_comments = r.result_comments.filter(c => c.comment.length > 0);
        const result: AnnotationTaskDto = {
          id: r.id,
          startTime,
          endTime,
          label: r.label,
          startFrequency,
          endFrequency,
          confidenceIndicator: r.confidenceIndicator ?? null,
          result_comments: result_comments,
        }
        if (mode === 'Check') result.validation = !!r.validation;
        return result;
      }),
      task_start_time: Math.floor((start.getTime() ?? now) / 1000),
      task_end_time: Math.floor(new Date().getTime() / 1000),
      task_comments: taskComment.comment ? [taskComment] : []
    }).finally(() => setIsSubmitting(false))

    if (!response) return;
    if (siblings?.next) {
      history.push(`/audio-annotator/${ siblings.next }`);
    } else {
      history.push(`/annotation_tasks/${ campaignId }`)
    }
  }

  const navPrevious = async () => {
    if (!siblings?.prev) return;
    if (hasChanged) {
      const response = await confirm(`You have unsaved changes. Are you sure you want to forget all of them ?`, `Forget my changes`);
      if (!response) return;
    }
    history.push(`/audio-annotator/${ siblings.prev }`)
  }
  const navNext = async () => {
    if (!siblings?.next) return;
    if (hasChanged) {
      const response = await confirm(`You have unsaved changes. Are you sure you want to forget all of them ?`, `Forget my changes`);
      if (!response) return;
    }
    history.push(`/audio-annotator/${ siblings.next }`)
  }

  if (!siblings) return <Fragment/>;
  return (
    <div className="col-sm-5 d-flex justify-content-center">
      <OverlayTrigger overlay={ <Tooltip><NavigationShortcutOverlay shortcut={ <IonIcon icon={ caretBack }/> }
                                                                    description="load previous recording"/></Tooltip> }>
        <IonButton color={ "primary" }
                   disabled={ isSubmitting }
                   className="rounded-right-0"
                   onClick={ navPrevious }>
          <IonIcon icon={ caretBack } slot={ "icon-only" }/>
        </IonButton>
      </OverlayTrigger>
      <OverlayTrigger overlay={ <Tooltip><NavigationShortcutOverlay shortcut="Enter"
                                                                    description="Submit & load next recording"/></Tooltip> }>
        <IonButton color={ "primary" }
                   disabled={ isSubmitting }
                   className="rounded-0"
                   onClick={ submit }>
          Submit &amp; load next recording
        </IonButton>
      </OverlayTrigger>
      <OverlayTrigger overlay={ <Tooltip><NavigationShortcutOverlay shortcut={ <IonIcon icon={ caretForward }/> }
                                                                    description="load next recording"/></Tooltip> }>
        <IonButton color={ "primary" }
                   disabled={ isSubmitting }
                   className="rounded-left-0"
                   onClick={ navNext }>
          <IonIcon icon={ caretForward } slot={ "icon-only" }/>
        </IonButton>
      </OverlayTrigger>
    </div>
  )
})
