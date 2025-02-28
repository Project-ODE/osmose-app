import React, { Fragment } from "react";
import OverlayTrigger from "react-bootstrap/OverlayTrigger";
import Tooltip from "react-bootstrap/Tooltip";
import { useAppDispatch, useAppSelector } from '@/service/app';
import { IonChip, IonIcon } from "@ionic/react";
import { checkmarkOutline } from "ionicons/icons";
import { focusConfidence } from '@/service/annotator';
import { useAnnotator } from "@/service/annotator/hook.ts";


export const ConfidenceIndicatorBloc: React.FC = () => {
  const {
    confidence_set,
  } = useAnnotator();

  const dispatch = useAppDispatch();
  const focusedConfidenceLabel = useAppSelector(state => state.annotator.focusedConfidenceLabel);

  if (!confidence_set) return <Fragment/>;

  const tooltip = (
    <div className="card">
      <h3 className={ `card-header p-2 tooltip-header` }>Description</h3>
      <div className="card-body p-1">
        <p>{ confidence_set.desc }</p>
      </div>
    </div>
  )

  return (
    <OverlayTrigger overlay={ <Tooltip>{ tooltip }</Tooltip> } placement="top">
      <div className="card">
        <h6 className="card-header text-center">Confidence indicator</h6>
        <div className="card-body d-flex justify-content-center p-0 pb-2 pt-2">
            { confidence_set.confidence_indicators.map((confidence, key) => (
              <IonChip key={ key }
                       color="primary"
                       onClick={ () => dispatch(focusConfidence(confidence.label)) }
                       className={ focusedConfidenceLabel === confidence.label ? 'active m-2' : 'm-2' }>
                  { confidence.label }
                { focusedConfidenceLabel === confidence.label && <IonIcon src={ checkmarkOutline } color="light"/> }
              </IonChip>
            )) }
        </div>
      </div>
    </OverlayTrigger>
  )
}
