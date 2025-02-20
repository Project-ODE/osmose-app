import React, { useEffect, useState } from 'react';
import { IonButton, IonChip, IonIcon, IonNote, IonSpinner } from "@ionic/react";
import { addOutline, closeCircle, refreshOutline, swapHorizontal } from "ionicons/icons";
import { CampaignCard } from "@/view/campaign/list/campaign-card/campaign-card.component.tsx";
import styles from './annotation-campaign-list.module.scss'
import { AnnotationCampaignUsage, useListCampaignsQuery } from '@/service/campaign';
import { useToast } from "@/service/ui";
import { ActionBar } from "@/components/ActionBar/ActionBar.tsx";
import { useGetCurrentUserQuery } from "@/service/user";


export const AnnotationCampaignList: React.FC = () => {

  // State
  const [ search, setSearch ] = useState<string | undefined>();
  const [ showArchivedFilter, setShowArchivedFilter ] = useState<boolean>(false);
  const [ modeFilter, setModeFilter ] = useState<AnnotationCampaignUsage | undefined>();
  const [ myWorkFilter, setMyWorkFilter ] = useState<boolean>(true);
  const [ onlyMineFilter, setonlyMineFilter ] = useState<boolean>(false);
  const { presentError, dismiss: dismissToast } = useToast()

  // Services
  const { data: currentUser } = useGetCurrentUserQuery();
  const { currentData: campaigns, isFetching, error } = useListCampaignsQuery({
    onlyArchived: showArchivedFilter,
    usage: modeFilter,
    search,
    owner: onlyMineFilter ? currentUser?.id : undefined,
    annotator: myWorkFilter ? currentUser?.id : undefined,
  }, {
    skip: !currentUser
  })

  useEffect(() => {
    return () => {
      dismissToast()
    }
  }, []);

  useEffect(() => {
    if (error) presentError(error);
  }, [ error ]);

  const openNewCampaign = () => {
    window.open("/app/annotation-campaign/create", "_self")
  }

  const openAuxNewCampaign = () => {
    window.open("/app/annotation-campaign/create", "_blank")
  }

  const toggleModeFilter = () => {
    switch (modeFilter) {
      case undefined:
        setModeFilter('Create');
        break;
      case 'Create':
        setModeFilter('Check');
        break;
      case 'Check':
        setModeFilter(undefined);
        break;
    }
  }

  function toggleArchiveFilter() {
    setShowArchivedFilter(prev => !prev)
  }

  function toggleOnlyMineFilter() {
    setonlyMineFilter(prev => !prev)
  }

  function toggleMyWorkFilter() {
    setMyWorkFilter(prev => !prev)
  }

  function resetFilters() {
    setMyWorkFilter(false);
    setonlyMineFilter(false);
    setShowArchivedFilter(false);
    setModeFilter(undefined);
  }

  return (
    <div className={ styles.page }>
      <h2>Annotation Campaigns</h2>

      <ActionBar search={ search }
                 searchPlaceholder="Search campaign name"
                 onSearchChange={ setSearch }
                 actionButton={ <IonButton color="primary" fill='outline'
                                           onClick={ openNewCampaign } onAuxClick={ openAuxNewCampaign }>
                   <IonIcon icon={ addOutline } slot="start"/>
                   New annotation campaign
                 </IonButton> }>

        <IonChip outline={ !myWorkFilter }
                 onClick={ toggleMyWorkFilter }
                 color={ myWorkFilter ? 'primary' : 'medium' }>
          My work
          { myWorkFilter && <IonIcon icon={ closeCircle } color='primary'/> }
        </IonChip>

        <IonChip outline={ !showArchivedFilter }
                 onClick={ toggleArchiveFilter }
                 color={ showArchivedFilter ? 'primary' : 'medium' }>
          Only archived
          { showArchivedFilter && <IonIcon icon={ closeCircle } color='primary'/> }
        </IonChip>

        <IonChip outline={ !modeFilter }
                 onClick={ toggleModeFilter }
                 color={ modeFilter ? 'primary' : 'medium' }>
          Campaign mode filter{ modeFilter && `: ${ modeFilter }` }
          { modeFilter === 'Create' && <IonIcon icon={ swapHorizontal }/> }
          { modeFilter === 'Check' && <IonIcon icon={ closeCircle }/> }
        </IonChip>

        <IonChip outline={ !onlyMineFilter }
                 onClick={ toggleOnlyMineFilter }
                 color={ onlyMineFilter ? 'primary' : 'medium' }>
          Owned campaigns
          { onlyMineFilter && <IonIcon icon={ closeCircle } color='primary'/> }
        </IonChip>

        { (onlyMineFilter || modeFilter || showArchivedFilter || myWorkFilter) &&
            <IonButton fill='clear' color='medium' onClick={ resetFilters }>
                <IonIcon icon={ refreshOutline } slot='start'/>
                Reset
            </IonButton> }
      </ActionBar>

      { isFetching && <IonSpinner/> }
      <div className={ styles.content }>
        { campaigns?.map(c => <CampaignCard
          campaign={ c } key={ c.id }/>) }
        { !isFetching && campaigns?.length === 0 && <IonNote color="medium">No campaigns</IonNote> }
      </div>
    </div>
  )
}
