import React, { Fragment, useEffect } from 'react';
import { IonNote, IonSpinner } from "@ionic/react";
import { useImportDatasetMutation, useListDatasetQuery } from '@/service/dataset';
import { getErrorMessage } from '@/service/function.ts';
import styles from './dataset.module.scss'
import { Table, TableContent, TableDivider, TableHead } from '@/components/table/table.tsx';
import { useToast } from "@/service/ui";
import { ImportDatasetsButton } from "@/view/dataset/buttons/ImportDatasets.tsx";
import { WarningMessage } from "@/components/warning/warning-message.component.tsx";


export const DatasetList: React.FC = () => {

  // Services
  const { data: datasets, error: datasetsError, isLoading } = useListDatasetQuery()

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [ _, { isLoading: isImportInProgress } ] = useImportDatasetMutation()
  const toast = useToast();


  useEffect(() => {
    return () => {
      toast.dismiss()
    }
  }, []);

  return (
    <div className={ styles.listPage }>
      <h2>Datasets</h2>

      <div className={ styles.buttons }>
        <ImportDatasetsButton/>
      </div>

      { (isLoading || isImportInProgress) && <IonSpinner/> }
      { datasetsError && <WarningMessage>{ getErrorMessage(datasetsError) }</WarningMessage> }

      { datasets && datasets.length === 0 && <IonNote color='medium'>No datasets</IonNote> }
      { datasets && datasets.length > 0 && <Table columns={ 7 } className={ styles.table }>
          <TableHead topSticky isFirstColumn={ true }>Name</TableHead>
          <TableHead topSticky>Created at</TableHead>
          <TableHead topSticky>Type</TableHead>
          <TableHead topSticky>File type</TableHead>
          <TableHead topSticky>Number of files</TableHead>
          <TableHead topSticky>Start date</TableHead>
          <TableHead topSticky>End date</TableHead>
          <TableDivider/>

        { datasets.map(d => <Fragment key={ d.id }>
          <TableContent isFirstColumn={ true }>{ d.name }</TableContent>
          <TableContent>{ new Date(d.created_at).toLocaleDateString() }</TableContent>
          <TableContent>{ d.type }</TableContent>
          <TableContent>{ d.files_type }</TableContent>
          <TableContent>{ d.files_count }</TableContent>
          <TableContent>{ new Date(d.start_date).toLocaleDateString() }</TableContent>
          <TableContent>{ new Date(d.end_date).toLocaleDateString() }</TableContent>
          <TableDivider/>
        </Fragment>) }
      </Table> }
    </div>
  )
};