import React, { ReactElement, ReactNode } from "react";
import BootstrapOverlayTrigger from "react-bootstrap/OverlayTrigger";
import BootstrapTooltip from "react-bootstrap/Tooltip";
import { IonNote } from "@ionic/react";
import styles from './ui.module.scss'

export const TooltipOverlay: React.FC<{
  children: ReactElement;
  tooltipContent: ReactNode;
  title?: string;
}> = ({ children, tooltipContent, title }) => {
  return <BootstrapOverlayTrigger overlay={
    <BootstrapTooltip>
      <div className={ styles.tooltip }>
        { title && <IonNote className={ styles.title }>{ title }</IonNote> }
        <div className={ styles.content }>{ tooltipContent }</div>
      </div>
    </BootstrapTooltip>
  } placement='bottom'>
    { children }
  </BootstrapOverlayTrigger>
}
