import React, { Fragment, useState } from 'react';
import styles from './layout.module.scss';
import logo from '/images/ode_logo_192x192.png';
import { IonButton, IonIcon } from '@ionic/react';
import { logout } from '@/service/auth';
import { useAppDispatch } from '@/service/app.ts';
import { useGetCurrentUserQuery } from '@/service/user';
import { DocumentationButton } from "@/components/Buttons/Documentation-button.tsx";
import { Link } from "@/components/ui";
import { closeOutline, menuOutline } from "ionicons/icons";
import { useHistory } from "react-router-dom";

export const Navbar: React.FC<{ className?: string }> = ({ className }) => {
  const [ isOpen, setIsOpen ] = useState<boolean>(false);

  const { data: currentUser } = useGetCurrentUserQuery();
  const dispatch = useAppDispatch();

  const history = useHistory();

  function toggleOpening() {
    setIsOpen(previous => !previous);
  }

  function accessDatasets() {
    history.push('/datasets')
    setIsOpen(false);
  }

  function accessCampaigns() {
    history.push('/annotation-campaign')
    setIsOpen(false);
  }

  function accessAccount() {
    history.push('/account')
    setIsOpen(false);
  }

  return (
    <div className={ [ styles.navbar, isOpen ? styles.opened : styles.closed, className ].join(' ') }>

      <div className={ styles.title }>
        <Link href="/app/">
          <img src={ logo } alt="APLOSE"/>
          <h1>APLOSE</h1>
        </Link>

        <IonButton fill='outline' color='medium'
                   className={ styles.toggle } onClick={ toggleOpening }>
          <IonIcon icon={ isOpen ? closeOutline : menuOutline } slot='icon-only'/>
        </IonButton>
      </div>

      <div className={ styles.navContent }>

        <div className={ styles.links }>
          <IonButton fill='clear' color='dark' onClick={ accessCampaigns }>
            Annotation campaigns
          </IonButton>
          { (currentUser?.is_staff || currentUser?.is_superuser) && <Fragment>
              <IonButton fill='clear' color='dark' onClick={ accessDatasets }>
                  Datasets
              </IonButton>
              <Link href="/backend/admin" target="_blank">Admin</Link>
          </Fragment> }
        </div>

        <DocumentationButton/>

        <IonButton fill='clear' color='medium' onClick={ accessAccount }>
          Account
        </IonButton>

        <IonButton className={ styles.logoutButton }
                   color={ "medium" }
                   onClick={ () => dispatch(logout()) }>
          Logout
        </IonButton>
      </div>
    </div>)
}