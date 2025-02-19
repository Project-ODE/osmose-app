import React, { Fragment, useEffect, useMemo, useState } from "react";
import { FormBloc, Input, Searchbar } from "@/components/form";
import { Table, TableContent, TableDivider, TableHead } from "@/components/table/table.tsx";
import { IonButton, IonIcon, IonSpinner } from "@ionic/react";
import { lockClosedOutline, trashBinOutline } from "ionicons/icons";
import styles from './bloc.module.scss';
import { useAppDispatch, useAppSelector } from '@/service/app';
import { getDisplayName, useListUsersQuery, User } from '@/service/user';
import {
  addDraftFileRange,
  removeDraftFileRange,
  selectCurrentCampaign,
  selectDraftCampaign,
  selectDraftFileRange,
  updateDraftFileRange
} from '@/service/campaign';
import { WriteAnnotationFileRange } from '@/service/campaign/annotation-file-range';
import { useListDatasetQuery } from '@/service/dataset';
import { useAlert } from "@/service/ui";

export const AnnotatorsRangeBloc: React.FC<{
  setIsForced?: (value: true) => void
}> = ({ setIsForced }) => {

  // State
  const dispatch = useAppDispatch();
  const draftCampaign = useAppSelector(selectDraftCampaign);
  const currentCampaign = useAppSelector(selectCurrentCampaign);
  const draftFileRanges = useAppSelector(selectDraftFileRange);

  // Services
  const { data: users } = useListUsersQuery()
  const { data: allDatasets } = useListDatasetQuery(undefined, { skip: !!currentCampaign });

  useEffect(() => {
    console.log('updated', draftFileRanges?.length)
  }, [ draftFileRanges ]);

  // Memo
  const filesCount = useMemo(() => {
    if (currentCampaign?.files_count) return currentCampaign.files_count - 1;
    if (!draftCampaign.datasets || draftCampaign.datasets.length === 0) return undefined;
    const dataset = allDatasets?.find(d => draftCampaign.datasets![0] === d.name);
    if (!dataset) return undefined;
    return dataset.files_count - 1;
  }, [ currentCampaign?.files_count, draftCampaign.datasets, allDatasets ]);
  const availableUsers = useMemo(() => {
    if (!filesCount) return users ?? [];
    return users?.filter(u => {
        const count = draftFileRanges
          .filter(r => r.annotator === u.id)
          .reduce((count, range) => {
            const last_index = range.last_file_index ?? filesCount ?? 0;
            const first_index = range.first_file_index ?? 0;
            return count + (last_index - first_index)
          }, 0) + 1
        return count < filesCount
      }
    ) ?? [];
  }, [ users, filesCount, draftFileRanges ]);

  if (!users) return <FormBloc label="Annotators"><IonSpinner/></FormBloc>
  return (
    <FormBloc label="Annotators">

      { draftFileRanges.length > 0 &&
          <Table columns={ 3 }>
              <TableHead isFirstColumn={ true }>Annotator</TableHead>
              <TableHead>
                  File range
                  <small>(between 1 and { filesCount ?? 1 })</small>
                  <small className="disabled"><i>Start and end limits are included</i></small>
              </TableHead>
              <TableHead/>
              <TableDivider/>
            { draftFileRanges.map(range => <AnnotatorRangeLine key={ range.id }
                                                               range={ range }
                                                               setIsForced={ setIsForced }
                                                               annotator={ users.find(u => u.id === range.annotator)! }
                                                               filesCount={ filesCount ?? 0 }
                                                               onFirstIndexChange={ first_file_index => dispatch(updateDraftFileRange({
                                                                 id: range.id,
                                                                 first_file_index
                                                               })) }
                                                               onLastIndexChange={ last_file_index => dispatch(updateDraftFileRange({
                                                                 id: range.id,
                                                                 last_file_index
                                                               })) }
                                                               onDelete={ () => dispatch(removeDraftFileRange(range.id)) }
            />) }
          </Table>
      }

      <Searchbar placeholder="Search annotator..."
                 values={ availableUsers.map(a => ({ value: a.id, label: getDisplayName(a, true) })) }
                 onValueSelected={ item => dispatch(addDraftFileRange({ annotator: item.value as number })) }/>

    </FormBloc>
  )
}

const AnnotatorRangeLine: React.FC<{
  range: Partial<WriteAnnotationFileRange> & { id: number, annotator: number, finished_tasks_count?: number },
  annotator: User,
  filesCount: number,
  onFirstIndexChange: (index: number) => void,
  onLastIndexChange: (index: number) => void,
  onDelete: () => void,
  setIsForced?: (value: true) => void
}> = ({ range, annotator, filesCount, onFirstIndexChange, onLastIndexChange, onDelete, setIsForced }) => {
  const [ isLocked, setIsLocked ] = useState<boolean>(!!range.finished_tasks_count);
  const alert = useAlert();

  function unlock() {
    alert.present({
      message: `This annotator has already started to annotated. By updating its file range you could remove some annotations he/she made. Are you sure?`,
      cssClass: 'danger-confirm-alert',
      buttons: [
        {
          text: `Update file range`,
          cssClass: 'ion-color-danger',
          handler: () => {
            setIsLocked(false)
            if (setIsForced) setIsForced(true)
          }
        },
        'Cancel',
      ]
    })
  }

  return (
    <Fragment key={ range.id }>
      <TableContent isFirstColumn={ true }>
        { getDisplayName(annotator) }
      </TableContent>
      <TableContent>
        <div className={ styles.fileRangeCell }>
          <Input type="number"
                 value={ range.first_file_index ?? '' }
                 onChange={ e => onFirstIndexChange(+e.target.value) }
                 placeholder="1"
                 min={ 1 } max={ filesCount }
                 disabled={ filesCount === undefined || isLocked }/>
          -
          <Input type="number"
                 value={ range.last_file_index ?? '' }
                 onChange={ e => onLastIndexChange(+e.target.value) }
                 placeholder={ filesCount?.toString() }
                 min={ 1 } max={ filesCount }
                 disabled={ filesCount === undefined || isLocked }/>
        </div>
      </TableContent>
      <TableContent>
        { isLocked ? <IonButton color='medium' fill='outline'
                                data-tooltip={ 'This user as already started to annotate' }
                                className={ [ styles.annotatorButton, 'tooltip-right' ].join(' ') }
                                onClick={ unlock }>
          <IonIcon icon={ lockClosedOutline }/>
        </IonButton> : <IonButton color="danger"
                                  className={ styles.annotatorButton }
                                  onClick={ onDelete }>
          <IonIcon icon={ trashBinOutline }/>
        </IonButton> }
      </TableContent>
      <TableDivider/>
    </Fragment>
  )
}
