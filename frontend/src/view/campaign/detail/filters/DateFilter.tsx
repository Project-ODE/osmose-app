import React, { ChangeEvent, Fragment, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "@/service/app.ts";
import { setFileFilters } from "@/service/ui";
import { Modal } from "@/components/ui";
import { Input } from "@/components/form";
import { IonIcon } from "@ionic/react";
import { funnel, funnelOutline } from "ionicons/icons";
import { createPortal } from "react-dom";

export const DateFilter: React.FC<{
  onUpdate: () => void
}> = ({ onUpdate }) => {
  const { id: campaignID } = useParams<{ id: string }>();

  const { fileFilters: filters } = useAppSelector(state => state.ui);
  const dispatch = useAppDispatch();

  const hasDateFilter = useMemo(() => !!filters.minDate || !!filters.maxDate, [ filters ]);
  const [ filterModalOpen, setFilterModalOpen ] = useState<boolean>(false);

  const minDate: string = useMemo(() => {
    if (!filters.minDate) return '';
    const date = filters.minDate.split('');
    date.pop();
    return date.join('');
  }, [ filters ]);

  const maxDate: string = useMemo(() => {
    if (!filters.maxDate) return '';
    const date = filters.maxDate.split('');
    date.pop();
    return date.join('');
  }, [ filters ]);


  function getDateString(event: ChangeEvent<HTMLInputElement>): string | undefined {
    const value = event.currentTarget.value;
    if (!value) return undefined;
    const date = new Date(value);
    return new Date(Date.UTC(
      date.getFullYear(),
      date.getMonth(),
      date.getDate(),
      date.getHours(),
      date.getMinutes(),
      date.getSeconds(),
    )).toISOString()
  }

  function setMin(event: ChangeEvent<HTMLInputElement>) {
    dispatch(setFileFilters({
      ...filters,
      campaignID,
      minDate: getDateString(event),
    }))
    onUpdate()
  }

  function setMax(event: ChangeEvent<HTMLInputElement>) {
    dispatch(setFileFilters({
      ...filters,
      campaignID,
      maxDate: getDateString(event),
    }))
    onUpdate()
  }


  return <Fragment>
    { hasDateFilter ?
      <IonIcon onClick={ () => setFilterModalOpen(true) } color='primary' icon={ funnel }/> :
      <IonIcon onClick={ () => setFilterModalOpen(true) } color='dark' icon={ funnelOutline }/> }

    { filterModalOpen && createPortal(<Modal onClose={ () => setFilterModalOpen(false) }>
      <Input label="Minimum date" type="datetime-local" placeholder="Min date" step="1"
             value={ minDate } onChange={ setMin }/>

      <Input label="Maximum date" type="datetime-local" placeholder="Max date" step="1"
             value={ maxDate } onChange={ setMax }/>
    </Modal>, document.body) }
  </Fragment>
}