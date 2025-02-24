import React, { Fragment, useMemo, useState } from "react";
import { useAppDispatch, useAppSelector } from '@/service/app';
import { IonButton, IonIcon, IonNote } from "@ionic/react";
import { cloudUploadOutline, trashOutline } from "ionicons/icons";
import { ImportModal } from "@/view/campaign/create-edit/blocs/import-modal/import-modal.component.tsx";
import { ChipsInput } from "@/components/form";
import {
  clearImport,
  selectCurrentCampaign,
  selectDraftCampaign,
  setFilteredDetectors,
  updateDraftCampaign
} from '@/service/campaign';
import { LabelSetDisplay } from "@/components/campaign/label/LabelSet.tsx";

export const CheckAnnotationsInputs: React.FC<{
  onFileImported: (file: File) => void,
  onFileRemoved: () => void,
}> = ({ onFileImported, onFileRemoved }) => {

  // State
  const dispatch = useAppDispatch();
  const draftCampaign = useAppSelector(selectDraftCampaign);
  const createdCampaign = useAppSelector(selectCurrentCampaign)
  const {
    isSubmitted: areResultsSubmitted,
    detectors,
    filterDetectors,
    fileData
  } = useAppSelector(state => state.campaign.resultImport)
  const [ isModalOpen, setIsModalOpen ] = useState<boolean>(false);

  // Memo
  const selectedDataset = useMemo(() => createdCampaign?.datasets.find(d => !!d) ?? draftCampaign.datasets?.find(d => !!d), [ createdCampaign?.datasets, draftCampaign.datasets ]);
  const allDetectors = useMemo(() => {
    const shownDetectors: { [key in string]: Array<string> } = {};
    for (const d of detectors ?? []) {
      const displayName = d.knownDetector?.name ?? d.initialName;
      if (shownDetectors[displayName]) shownDetectors[displayName].push(d.initialName);
      else shownDetectors[displayName] = [ d.initialName ];
    }
    return shownDetectors;
  }, [ detectors ])
  const selectedDetectors = useMemo(() => {
    if (!filterDetectors) return [];
    return Object.entries(allDetectors).filter(e => e[1].some(d => filterDetectors.includes(d)))
  }, [ detectors, filterDetectors ])

  const onDetectorsChange = (array: Array<string | number>) => {
    dispatch(setFilteredDetectors([ ...new Set(Object.entries(allDetectors).filter(e => array.includes(e[0])).flatMap(e => e[1])) ]))
  }

  const openImportModal = () => {
    setIsModalOpen(true)
  }

  const deleteDetectors = () => {
    dispatch(clearImport());
    onFileRemoved()
  }

  const onLabelsWithFeaturesUpdated = (value: string[]) => {
    dispatch(updateDraftCampaign({ labels_with_acoustic_features: value }))
  }

  return (
    <Fragment>
      { !detectors?.length && <Fragment>
          <div id="import-button" className="d-flex justify-content-center">
              <IonButton color="dark" className="center"
                         onClick={ openImportModal }
                         disabled={ !selectedDataset || areResultsSubmitted }
                         aria-disabled={ !selectedDataset || areResultsSubmitted }>
                  Import annotations
                  <IonIcon icon={ cloudUploadOutline } slot="end"/>
              </IonButton>
              <input required={ true } className="hide-real-input"
                     value={ detectors?.length ? "ok" : undefined }
                     onChange={ () => {
                     } }/>
          </div>
        { !selectedDataset &&
            <IonNote color="danger" className="center">
                You must select a dataset to import annotations
            </IonNote> }
      </Fragment> }

      { !!selectedDataset && <ImportModal isOpen={ isModalOpen }
                                          setIsOpen={ setIsModalOpen }
                                          onFileImported={ onFileImported }/> }


      { !!detectors?.length && <Fragment>
          <div id="detector-import-results">
              <ChipsInput label="Detectors"
                          disabled={ areResultsSubmitted }
                          required={ true }
                          items={ Object.entries(allDetectors).map(([ displayName ]) => ({
                            value: displayName,
                            label: displayName
                          })) }
                          activeItemsValues={ selectedDetectors.map(e => e[0]) }
                          setActiveItemsValues={ onDetectorsChange }/>

              <IonButton color="danger"
                         disabled={ areResultsSubmitted }
                         onClick={ deleteDetectors }>
                  <IonIcon icon={ trashOutline } slot="icon-only"/>
              </IonButton>
          </div>
          <LabelSetDisplay set={ {
            labels: fileData?.labels ?? [],
            name: `${ draftCampaign.name } label set`,
            id: -1,
            desc: undefined
          } }
                           labelsWithAcousticFeatures={ draftCampaign.labels_with_acoustic_features ?? [] }
                           setLabelsWithAcousticFeatures={ onLabelsWithFeaturesUpdated }/>
      </Fragment> }

      {/*{ error && <IonNote color="danger">error</IonNote> }*/ }
    </Fragment>
  )
}
