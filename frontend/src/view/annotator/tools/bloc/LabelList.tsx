import React, { useMemo } from "react";
import { COLORS } from "@/consts/colors.const.tsx";
import { useAppDispatch, useAppSelector } from '@/service/app';
import { focusLabel, getPresenceLabels } from '@/service/annotator';
import { IonChip, IonIcon } from '@ionic/react';
import { checkmarkOutline } from 'ionicons/icons';
import styles from './bloc.module.scss';
import { LabelTooltipOverlay } from "@/view/annotator/tools/bloc/LabelTooltipOverlay.tsx";
import { useAnnotator } from "@/service/annotator/hook.ts";


export const LabelList: React.FC = () => {
  const {
    label_set,
  } = useAnnotator();


  const {
    results,
    focusedLabel
  } = useAppSelector(state => state.annotator);
  const presenceLabels = useMemo(() => getPresenceLabels(results), [ results ])
  const dispatch = useAppDispatch()

  // 'label' class is for playwright tests
  return (
    <div className={ [ styles.bloc, styles.labels, 'label' ].join(' ') }>
      <h6 className={ styles.header }>Labels list</h6>
      <div className={ styles.body }>
        { label_set?.labels.map((label, id) => {
          const color = (label_set?.labels.indexOf(label) % 10).toString();
          const style = {
            inactive: {
              '--background': '#f6f6f6',
              '--color': COLORS[+color],
            },
            disabled: {
              '--background': 'transparent',
              '--color': '#aaa',
            },
            active: {
              '--background': COLORS[+color],
              '--color': 'white',
            },
          };
          return (
            <LabelTooltipOverlay key={ id } id={ id }>
              <IonChip onClick={ () => dispatch(focusLabel(label)) }
                       style={ focusedLabel === label ? style.active : presenceLabels.includes(label) ? style.inactive : style.disabled }
                       disabled={ !presenceLabels.includes(label) }>
                { label }
                { focusedLabel === label && <IonIcon src={ checkmarkOutline } color="light"/> }
              </IonChip>
            </LabelTooltipOverlay>
          )
        }) }
      </div>
    </div>
  )
}
