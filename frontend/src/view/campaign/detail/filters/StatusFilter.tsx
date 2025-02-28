import React, { Fragment, useState } from "react";
import { IonIcon } from "@ionic/react";
import { funnel, funnelOutline } from "ionicons/icons";
import { useAppDispatch, useAppSelector } from "@/service/app.ts";
import { setFileFilters } from "@/service/ui";
import { useParams } from "react-router-dom";
import { createPortal } from "react-dom";
import { Modal } from "@/components/ui";
import styles from "@/view/campaign/detail/Detail.module.scss";
import { Switch } from "@/components/form";

export const StatusFilter: React.FC<{
  onUpdate: () => void
}> = ({ onUpdate }) => {
  const { id: campaignID } = useParams<{ id: string }>();

  const { fileFilters: filters } = useAppSelector(state => state.ui);
  const [ filterModalOpen, setFilterModalOpen ] = useState<boolean>(false);
  const dispatch = useAppDispatch();

  function setState(option: string) {
    let newState = undefined;
    switch (option) {
      case 'Created':
        newState = false;
        break;
      case 'Finished':
        newState = true;
        break;
    }
    dispatch(setFileFilters({
      ...filters,
      campaignID,
      isSubmitted: newState
    }))
    onUpdate()
  }

  function valueToBooleanOption(value: boolean | undefined): 'Unset' | 'Created' | 'Finished' {
    switch (value) {
      case true:
        return 'Finished';
      case false:
        return 'Created';
      case undefined:
        return 'Unset';
    }
  }

  return <Fragment>
    { filters.isSubmitted !== undefined ?
      <IonIcon onClick={ () => setFilterModalOpen(true) } color='primary' icon={ funnel }/> :
      <IonIcon onClick={ () => setFilterModalOpen(true) } color='dark' icon={ funnelOutline }/> }

    { filterModalOpen && createPortal(<Modal className={ styles.filterModal }
                                             onClose={ () => setFilterModalOpen(false) }>

      <Switch label='Status' options={ ['Unset', 'Created', 'Finished'] }
              value={ valueToBooleanOption(filters.isSubmitted) } onValueSelected={ setState }/>

    </Modal>, document.body) }
  </Fragment>
}