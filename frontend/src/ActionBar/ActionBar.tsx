import React, { KeyboardEvent, ReactNode } from "react";
import styles from "./action.module.scss";
import { IonSearchbar } from "@ionic/react";

export const ActionBar: React.FC<{
  search?: string;
  onSearchChange(search?: string): void;
  actionButton: ReactNode;
  children: ReactNode;
}> = ({ search, onSearchChange, actionButton, children }) => {

  function doSearch(event: KeyboardEvent<HTMLIonSearchbarElement>) {
    if (event.key === 'Enter') {
      onSearchChange(event.currentTarget.value ?? undefined)
    }
  }

  function clearSearch() {
    onSearchChange(undefined)
  }

  return (
    <div className={ styles.actionBar }>
      <IonSearchbar placeholder="Search file"
                    className={ styles.search }
                    onKeyDown={ doSearch }
                    onIonClear={ clearSearch }
                    value={ search }/>

      { actionButton }

      <div className={ styles.filters }>{ children }</div>
    </div>)
}