import React, { useMemo } from "react";
import OverlayTrigger from "react-bootstrap/OverlayTrigger";
import { TooltipComponent } from "../tooltip.component.tsx";
import { DEFAULT_COLOR } from "@/consts/colors.const.tsx";
import Tooltip from "react-bootstrap/Tooltip";
import { useAppDispatch, useAppSelector } from '@/service/app';
import { focusLabel, getPresenceLabels } from '@/service/annotator';
import { IonChip, IonIcon } from '@ionic/react';
import { checkmarkOutline } from 'ionicons/icons';
import { useAnnotator } from "@/service/annotator/hook.ts";


export const LabelListBloc: React.FC = () => {
  const {
    label_set,
  } = useAnnotator();

  const {
    results,
    focusedLabel
  } = useAppSelector(state => state.annotator);
  const presenceLabels = useMemo(() => getPresenceLabels(results), [ results ])

  return (
    <div className="card">
      <h6 className="card-header text-center">Labels list</h6>
      <div className="card-body d-flex justify-content-between">
        <ul className="card-text annotation-labels">
          { label_set?.labels.map((label, key) => (
            <LabelItem label={ label }
                       key={ key }
                       id={ key }
                       isEnabled={ presenceLabels.includes(label) }
                       isActive={ focusedLabel === label }></LabelItem>
          )) }
        </ul>
      </div>
    </div>
  )
}

interface ItemProps {
  label: string,
  id: number,
  isEnabled: boolean,
  isActive: boolean,
}

const LabelItem: React.FC<ItemProps> = ({
                                          label,
                                          id,
                                          isEnabled,
                                          isActive,
                                        }) => {

  const labelColors = useAppSelector(state => state.annotator.labelColors);
  const dispatch = useAppDispatch()

  const color = labelColors[label] ?? DEFAULT_COLOR;
  const style = {
    inactive: {
      '--background': '#f6f6f6',
      '--color': color,
    },
    disabled: {
      '--background': 'transparent',
      '--color': '#aaa',
    },
    active: {
      '--background': color,
      '--color': 'white',
    },
  };

  return (
    <OverlayTrigger overlay={ <Tooltip hidden={ !isEnabled }><TooltipComponent id={ id }/></Tooltip> } placement="top">
      <IonChip style={ isActive ? style.active : isEnabled ? style.inactive : style.disabled }
               onClick={ () => dispatch(focusLabel(label)) }
               disabled={ !isEnabled }>
        { label }
        { isActive && <IonIcon src={ checkmarkOutline } color="light"/> }
      </IonChip>
    </OverlayTrigger>
  )
}
