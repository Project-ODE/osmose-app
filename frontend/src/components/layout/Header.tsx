import React, { ReactNode, useState } from "react";
import styles from './layout.module.scss'
import logo from "/images/ode_logo_192x192.png";
import { DocumentationButton } from "@/components/Buttons/Documentation-button.tsx";
import { IonButton, IonIcon } from "@ionic/react";
import { closeOutline, menuOutline } from "ionicons/icons";
import { useGetCurrentUserQuery } from "@/service/user";
import { useHistory } from "react-router-dom";

export const Header: React.FC<{
  buttons?: ReactNode;
  children?: ReactNode;
  size?: 'small' | 'default';
  canNavigate?: () => Promise<boolean>;
}> = ({ children, buttons, size, canNavigate }) => {

  const [ isOpen, setIsOpen ] = useState<boolean>(false);
  const { data: user } = useGetCurrentUserQuery()
  const history = useHistory();

  function toggleOpening() {
    setIsOpen(previous => !previous);
  }

  async function onAPLOSEClick() {
    if (user) {
      if (!canNavigate || await canNavigate()) {
        history.push(`/annotation-campaign/`);
      }
    } else {
      history.push(`/`);
    }
  }

  return (
    <header
      className={ [ styles.header, isOpen ? styles.opened : styles.closed, size === 'small' ? styles.small : '', children ? styles.withInfo : '' ].join(' ') }>
      <div className={ styles.title } onClick={ onAPLOSEClick }>
        <img src={ logo } alt="OSmOSE"/>
        <h1>APLOSE</h1>
      </div>

      <IonButton fill='outline' color='medium'
                 className={ styles.toggle } onClick={ toggleOpening }>
        <IonIcon icon={ isOpen ? closeOutline : menuOutline } slot='icon-only'/>
      </IonButton>

      { children && <div className={ styles.info }>{ children }</div> }

      <div className={ styles.links }>
        <DocumentationButton size={ size }/>

        { buttons }

      </div>
    </header>
  )
}