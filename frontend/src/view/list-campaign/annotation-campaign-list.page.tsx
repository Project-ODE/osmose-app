import React, { useEffect, useMemo, useState } from 'react';
import { IonButton, IonChip, IonIcon, IonNote, IonSearchbar, IonSpinner } from "@ionic/react";
import { addOutline, closeCircle, helpBuoyOutline } from "ionicons/icons";
import { AnnotationCampaignList as List, useAnnotationCampaignAPI } from "@/services/api";
import { useToast } from "@/services/utils/toast.ts";
import { ANNOTATOR_GUIDE_URL } from "@/consts/links.ts";
import { searchFilter } from "@/services/utils/search.ts";
import { CampaignCard } from "@/view/list-campaign/campaign-card/campaign-card.component.tsx";
import './annotation-campaign-list.page.css'
import { useHistory } from "react-router-dom";


export const AnnotationCampaignList: React.FC = () => {
  const [annotationCampaigns, setAnnotationCampaigns] = useState<List>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string | undefined>();
  const [showArchived, setShowArchived] = useState<boolean>(false);

  // Memo
  const showCampaigns = useMemo(() => {
    const baseCampaigns = annotationCampaigns.filter(c => c.is_archived === showArchived);
    if (!search) return baseCampaigns;
    const results = searchFilter(
      baseCampaigns.map(c => ({
        value: c.id,
        label: c.name
      })),
      search
    );
    return baseCampaigns.filter(c => results.find(r => r.value === c.id));
  }, [annotationCampaigns, search, showArchived]);
  const canAccessArchive = useMemo(() => annotationCampaigns.filter(c => c.is_archived).length > 0, [annotationCampaigns]);


  // Services
  const campaignService = useAnnotationCampaignAPI();
  const toast = useToast();
  const history = useHistory()

  useEffect(() => {
    let isCancelled = false;
    setIsLoading(true);

    campaignService.list()
      .then(setAnnotationCampaigns)
      .catch(e => {
        if (isCancelled) return;
        toast.presentError(e);
      })
      .finally(() => !isCancelled && setIsLoading(false))

    return () => {
      isCancelled = true;
      campaignService.abort();
      setIsLoading(false);
      toast.dismiss();
    }
  }, []);

  const openGuide = () => {
    window.open(ANNOTATOR_GUIDE_URL, "_blank", "noopener, noreferrer")
  }

  const openNewCampaign = () => {
    history.push("/create-annotation-campaign")
  }

  const toggleArchived = () => {
    setShowArchived(!showArchived);
  }

  return (
    <div id="campaign-list">
      <h2>Annotation Campaigns</h2>

      <div id="head">
        <div id="search-zone">
          <IonSearchbar placeholder="Search campaign"
                        onIonInput={ e => setSearch(e.detail.value ?? undefined) }
                        value={ search }/>

          { canAccessArchive &&
              <IonChip color={ showArchived ? 'dark' : 'medium' } outline={ showArchived } onClick={ toggleArchived }>
                  Show archived
                { showArchived && <IonIcon icon={ closeCircle }/> }
              </IonChip> }
        </div>

        <div id="actions">
          <IonButton color="warning" shape="round" fill="outline" onClick={ openGuide }>
            User guide
            <IonIcon icon={ helpBuoyOutline } slot="end"/>
          </IonButton>

          <IonButton color="primary" onClick={ openNewCampaign }>
            <IonIcon icon={ addOutline } slot="start"/>
            New annotation campaign
          </IonButton>
        </div>
      </div>

      <div id="content">
        { showCampaigns.map(c => <CampaignCard campaign={ c } key={ c.id }/>) }
        { !isLoading && showCampaigns.length === 0 && <IonNote color="medium">No campaigns</IonNote> }
      </div>

      { isLoading && <div className="d-flex justify-content-center"><IonSpinner/></div> }
    </div>
  )
}
