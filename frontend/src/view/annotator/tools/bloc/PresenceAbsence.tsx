import React, { useEffect, useMemo, useRef } from 'react';
import { useAppDispatch, useAppSelector } from '@/service/app.ts';
import { addPresenceResult, focusLabel, getPresenceLabels, removePresence } from '@/service/annotator';
import styles from './bloc.module.scss';
import { AlphanumericKeys } from "@/consts/shorcuts.const.tsx";
import { IonChip, IonIcon } from "@ionic/react";
import { closeCircle } from "ionicons/icons";
import { LabelTooltipOverlay } from "@/view/annotator/tools/bloc/LabelTooltipOverlay.tsx";
import { useAlert } from "@/service/ui";
import { KEY_DOWN_EVENT } from "@/service/events";
import { useAnnotator } from "@/service/annotator/hook.ts";

export const PresenceAbsence: React.FC = () => {
  const {
    label_set,
  } = useAnnotator();

  const {
    results,
    focusedLabel,
  } = useAppSelector(state => state.annotator);
  const dispatch = useAppDispatch()
  const alert = useAlert();

  const _focused = useRef<string | undefined>(focusedLabel);
  useEffect(() => {
    _focused.current = focusedLabel;
  }, [ focusedLabel ]);
  const presenceLabels = useMemo(() => getPresenceLabels(results), [ results ]);

  useEffect(() => {
    KEY_DOWN_EVENT.add(onKbdEvent);
    return () => {
      KEY_DOWN_EVENT.remove(onKbdEvent);
    }
  }, []);

  function onKbdEvent(event: KeyboardEvent) {
    if (!label_set) return;
    const active_alphanumeric_keys = AlphanumericKeys[0].slice(0, label_set.labels.length);

    if (event.key === "'") {
      event.preventDefault();
    }

    for (const i in active_alphanumeric_keys) {
      if (event.key !== AlphanumericKeys[0][i] && event.key !== AlphanumericKeys[1][i]) continue;

      const calledLabel = label_set.labels[i];
      if (_focused.current === calledLabel) continue;
      if (!presenceLabels.includes(calledLabel)) {
        dispatch(addPresenceResult({ label: calledLabel, focus: false }));
      }
      dispatch(focusLabel(calledLabel))
    }
  }

  const toggle = async (label: string) => {
    if (presenceLabels.includes(label)) {
      // Remove presence
      if (results?.find(a => a.label === label)) {
        // if annotations exists with this label: wait for confirmation
        await alert.present({
          message: `You are about to remove ${ results.filter(r => r.label === label).length } annotations using "${ label }" label. Are you sure?`,
          cssClass: 'danger-confirm-alert',
          buttons: [
            'Cancel',
            {
              text: `Remove "${ label }" annotations`,
              cssClass: 'ion-color-danger',
              handler: () => dispatch(removePresence(label))
            }
          ]
        })
      }
    } else {
      // Add presence
      dispatch(addPresenceResult({ label }));
    }
  }

  // 'presence' class is for playwright tests
  return (
    <div className={ [ styles.bloc, styles.presence, 'presence' ].join(' ') }>
      <h6 className={ styles.header }>Presence / Absence</h6>
      <div className={ styles.body }>
        { label_set?.labels.map((label, key) => {
          const color = (key % 10).toString();
          return (
            <LabelTooltipOverlay id={ key } key={ key }>
              <IonChip outline={ !presenceLabels.includes(label) }
                       onClick={ () => toggle(label) }
                       color={ color }>
                { label }
                { presenceLabels.includes(label) && <IonIcon icon={ closeCircle } color={ color }/> }
              </IonChip>
            </LabelTooltipOverlay>
          )
        }) }
      </div>
    </div>
  )
}
