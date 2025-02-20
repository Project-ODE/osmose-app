import React, { Fragment, useEffect, useMemo, useState } from "react";
import {
  ImportDataset,
  useImportDatasetMutation,
  useListDatasetForImportQuery,
  useListDatasetQuery
} from "@/service/dataset";
import { useToast } from "@/service/ui";
import { IonButton, IonIcon } from "@ionic/react";
import { downloadOutline } from "ionicons/icons";
import { createPortal } from "react-dom";
import { ImportDatasetModal } from "@/view/dataset/ImportModal.tsx";
import styles from '../dataset.module.scss'

export const ImportDatasetsButton: React.FC = () => {
  // State
  const [ isImportModalOpen, setIsImportModalOpen ] = useState(false);

  // API
  const { refetch: refetchDatasets } = useListDatasetQuery()
  const {
    data: datasetsToImport,
    refetch: refetchDatasetsToImport,
    error: datasetsToImportError
  } = useListDatasetForImportQuery()
  const [ doImportDatasets, { isLoading: isImportInProgress } ] = useImportDatasetMutation()

  // Memo
  const canImportDatasets = useMemo(() => datasetsToImport && datasetsToImport.length > 0, [ datasetsToImport ]);

  // Service
  const toast = useToast();

  // Updates
  useEffect(() => {
    if (datasetsToImportError) toast.presentError(datasetsToImportError);
  }, [ datasetsToImportError ]);

  // Methods

  async function importDatasets(importList: Array<ImportDataset>) {
    doImportDatasets(importList).unwrap()
      .then(() => {
        refetchDatasetsToImport();
        refetchDatasets();
        setIsImportModalOpen(false);
      })
      .catch(error => toast.presentError(error));
  }

  function openImportModal() {
    if (!datasetsToImport) return;
    setIsImportModalOpen(!isImportModalOpen)
  }

  return <Fragment>
    <IonButton color='primary' fill='outline'
               disabled={ !canImportDatasets }
               className={ styles.importButton }
               data-tooltip={ canImportDatasets ? undefined : "The datasets.csv doesn't contains new datasets" }
               onClick={ openImportModal }>
      <IonIcon icon={ downloadOutline } slot='start'/>
      Import dataset
    </IonButton>

    { isImportModalOpen && createPortal(
      <ImportDatasetModal startImport={ (datasets) => importDatasets(datasets) }
                          onClose={ () => setIsImportModalOpen(false) }
                          isLoading={ isImportInProgress }
                          newData={ datasetsToImport ?? [] }/>,
      document.body) }
  </Fragment>
}