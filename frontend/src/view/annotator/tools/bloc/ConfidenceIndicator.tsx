import React from "react";
import { useAppDispatch, useAppSelector } from '@/service/app';
import { IonChip, IonIcon } from "@ionic/react";
import { checkmarkOutline } from "ionicons/icons";
import { focusConfidence } from '@/service/annotator';
import styles from './bloc.module.scss';
import { TooltipOverlay } from "@/components/ui";
import { useAnnotator } from "@/service/annotator/hook.ts";


export const ConfidenceIndicator: React.FC = () => {
  const {
    confidence_set,
  } = useAnnotator();

  const dispatch = useAppDispatch();
  const {
    focusedConfidenceLabel,
  } = useAppSelector(state => state.annotator)

  if (!confidence_set) return <div/>;

  return (
    <TooltipOverlay title='Description' tooltipContent={ <p>{ confidence_set.desc }</p> }>
      <div className={ [ styles.bloc, styles.confidence ].join(' ') }>
        <h6 className={ styles.header }>Confidence indicator</h6>
        <div className={ [ styles.body, styles.center ].join(' ') }>
          { confidence_set.confidence_indicators.map((confidence, key) => (
            <IonChip key={ key } color="primary"
                     onClick={ () => dispatch(focusConfidence(confidence.label)) }
                     className={ focusedConfidenceLabel === confidence.label ? styles.active : '' }>
              { confidence.label }
              { focusedConfidenceLabel === confidence.label && <IonIcon src={ checkmarkOutline } color="light"/> }
            </IonChip>
          )) }
        </div>
      </div>
    </TooltipOverlay>
  )
}
