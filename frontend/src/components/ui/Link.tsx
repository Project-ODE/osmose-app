import React, { AnchorHTMLAttributes, ReactNode } from "react";
import { IonButton, IonIcon } from "@ionic/react";
import { Color } from "@ionic/core";
import { openOutline } from "ionicons/icons";

type Props = {
  children: ReactNode,
  color?: Color;
  size?: 'small' | 'default' | 'large';
} & AnchorHTMLAttributes<HTMLAnchorElement>;
export const Link: React.FC<Props> = ({ children, color = 'dark', size, ...props }) => (
  <a style={ { textDecoration: 'none' } } { ...props }>
    <IonButton color={ color } fill='clear' size={ size }>
      { children }
      { props.target === '_blank' && <IonIcon icon={ openOutline } slot='end'/> }
    </IonButton>
  </a>
)