import React, { KeyboardEvent, ReactNode } from "react";
import styles from "./action.module.scss";
import { IonSearchbar } from "@ionic/react";

export const ActionBar: React.FC<{
  search?: string;
  searchPlaceholder?: string;
  onSearchChange(search?: string): void;
  actionButton: ReactNode;
  children: ReactNode;
}> = ({ search, searchPlaceholder = 'Search', onSearchChange, actionButton, children }) => {

  function doSearch(event: KeyboardEvent<HTMLIonSearchbarElement>) {
    if (event.key === 'Enter') {
      const search = event.currentTarget.value?.trim()
      if (search && search.length > 0)
        onSearchChange(search)
      else onSearchChange(undefined)
    }
  }

  function clearSearch() {
    onSearchChange(undefined)
  }

  return (
    <div className={ styles.actionBar }>
      <IonSearchbar placeholder={ searchPlaceholder }
                    className={ styles.search }
                    onKeyDown={ doSearch }
                    onIonClear={ clearSearch }
                    value={ search }/>

      { actionButton }

      <div className={ styles.filters }>{ children }</div>
    </div>)
}