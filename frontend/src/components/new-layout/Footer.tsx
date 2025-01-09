import React from "react";
import logo from "/images/ode_logo_192x192.png";
import { CONTACT_MAIL, CONTACT_URI, GITHUB_URL, OSMOSE_URL } from "@/consts/links.ts";
import { Link } from "@/components/ui";
import { IonIcon } from "@ionic/react";
import { logoGithub, mailOutline } from "ionicons/icons";
import style from './layout.module.scss';

export const Footer: React.FC = () => {
  return (
    <footer className={ style.footer }>
      <Link href={ GITHUB_URL } target='_blank' color='medium'>
        <IonIcon icon={ logoGithub } slot='start'/>
        Github
      </Link>

      <div className={ style.proposition }>
        <p>Proposed by</p>
        <Link href={ OSMOSE_URL }>OSmOSE <img src={ logo } alt="OSmOSE"/></Link>
      </div>

      <Link href={ CONTACT_URI } color='medium'>
        <IonIcon icon={ mailOutline } slot='end'/>
        { CONTACT_MAIL }
      </Link>
    </footer>
  );
};
