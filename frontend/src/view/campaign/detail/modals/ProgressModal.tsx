import React, { Fragment, useCallback, useEffect, useState } from "react";
import {
  AnnotationCampaign,
  useDownloadCampaignReportLazyQuery,
  useDownloadCampaignStatusMutation
} from "@/service/campaign";
import { useToast } from "@/service/ui";
import { getErrorMessage } from "@/service/function.ts";
import { Modal, ModalFooter, ModalHeader, WarningText } from "@/components/ui";
import { IonButton, IonIcon, IonNote, IonSpinner } from "@ionic/react";
import { caretDown, caretUp, downloadOutline } from "ionicons/icons";
import { getDisplayName, useListUsersQuery, User } from "@/service/user";
import { AnnotationFileRange, useListAnnotationFileRangeQuery } from "@/service/campaign/annotation-file-range";
import { Table, TableContent, TableDivider, TableHead } from "@/components/table/table.tsx";
import styles from './modal.module.scss';
import { Progress } from "@/components/ui/Progress.tsx";
import { useHistory } from "react-router-dom";

type Progression = {
  user: User;
  displayUsername: string;
  ranges: Array<AnnotationFileRange>;
  progress: number; // [0-1]
}

type Sort = {
  entry: 'Annotator' | 'Progress';
  sort: 'ASC' | 'DESC';
}

export const ProgressModal: React.FC<{
  campaign: AnnotationCampaign;
  isOwner: boolean;
  onClose?(): void;
}> = ({ campaign, onClose, isOwner }) => {
  const toast = useToast();
  const history = useHistory();
  const { data: users, isFetching: isLoadingUsers, error: userError } = useListUsersQuery();
  const {
    data: fileRanges,
    isFetching: isLoadingFileRanges,
    error: fileRangeError
  } = useListAnnotationFileRangeQuery({ campaignID: campaign.id }, { refetchOnMountOrArgChange: true });
  const [ downloadStatus, { error: statusError } ] = useDownloadCampaignStatusMutation()
  const [ downloadReport, { error: reportError } ] = useDownloadCampaignReportLazyQuery()

  const [ progress, setProgress ] = useState<Array<Progression>>([]);
  const [ sort, setSort ] = useState<Sort>({ entry: 'Progress', sort: 'DESC' });

  useEffect(() => {
    if (!fileRanges || !users) return;
    const progression = new Array<Progression>();
    for (const range of fileRanges) {
      let progress: Progression | undefined = progression.find(p => p.user.id === range.annotator);
      if (progress) {
        progress.ranges.push(range);
      } else {
        const user = users.find(u => u.id === range.annotator)!
        progress = {
          user,
          displayUsername: getDisplayName(user),
          ranges: [ range ],
          progress: 0
        }
        progression.push(progress)
      }
    }
    setProgress(progression.map(p => {
      const totalFinished = p.ranges.reduce((v, r) => v + r.finished_tasks_count, 0);
      const total = p.ranges.reduce((v, r) => v + r.files_count, 0);
      return { ...p, progress: total > 0 ? Math.trunc(100 * totalFinished / total) : 0 }
    }));
  }, [ fileRanges, users ]);

  useEffect(() => {
    if (statusError) toast.presentError(statusError);
    if (reportError) toast.presentError(reportError);
  }, [ statusError, reportError ]);

  function toggleAnnotatorSort() {
    if (!sort || sort.entry !== 'Annotator' || sort.sort === 'DESC') {
      setSort({ entry: 'Annotator', sort: 'ASC' })
    } else {
      setSort({ entry: 'Annotator', sort: 'DESC' })
    }
  }

  function toggleProgressSort() {
    if (!sort || sort.entry !== 'Progress' || sort.sort === 'ASC') {
      setSort({ entry: 'Progress', sort: 'DESC' })
    } else {
      setSort({ entry: 'Progress', sort: 'ASC' })
    }
  }

  function onDownloadStatus() {
    downloadStatus(campaign)
  }

  function onDownloadReport() {
    downloadReport(campaign)
  }

  function manageAnnotator() {
    history.push(`/annotation-campaign/${ campaign.id }/edit`);
  }

  const sortProgress = useCallback((a: Progression, b: Progression) => {
    let comparison = 0;
    switch (sort.entry) {
      case "Annotator":
        comparison = a.displayUsername.toLowerCase().localeCompare(b.displayUsername.toLowerCase());
        break;
      case "Progress":
        comparison = a.progress - b.progress;
    }
    if (sort.sort === 'ASC') return comparison;
    return -comparison;
  }, [ sort ])

  return (
    <Modal onClose={ onClose } className={ [ styles.modal, styles.progressModal ].join(' ') }>
      <ModalHeader onClose={ onClose } title='Annotators progression'/>

      { (isLoadingUsers || isLoadingFileRanges) && <IonSpinner/> }

      { userError && <WarningText>{ getErrorMessage(userError) }</WarningText> }
      { fileRangeError && <WarningText>{ getErrorMessage(fileRangeError) }</WarningText> }

      { (!isLoadingUsers && !isLoadingFileRanges) && progress.length === 0 && <IonNote>No annotators</IonNote> }

      { progress.length > 0 &&
          <Table columns={ 2 } className={ [ styles.table, styles.status ].join(' ') }>
              <TableHead isFirstColumn={ true } className={ [ styles.sortedHead, styles.stickyHead ].join(' ') }
                         onClick={ toggleAnnotatorSort }>
                  <p>Annotator</p>
                  <IonIcon
                      className={ [ styles.up, sort?.entry === 'Annotator' && sort.sort === 'ASC' ? styles.active : '' ].join(' ') }
                      icon={ caretUp }/>
                  <IonIcon
                      className={ [ styles.down, sort?.entry === 'Annotator' && sort.sort === 'DESC' ? styles.active : '' ].join(' ') }
                      icon={ caretDown }/>
              </TableHead>
              <TableHead className={ [ styles.sortedHead, styles.stickyHead ].join(' ') }
                         onClick={ toggleProgressSort }>
                  <p>Progress</p>
                  <IonIcon
                      className={ [ styles.up, sort?.entry === 'Progress' && sort.sort === 'ASC' ? styles.active : '' ].join(' ') }
                      icon={ caretUp }/>
                  <IonIcon
                      className={ [ styles.down, sort?.entry === 'Progress' && sort.sort === 'DESC' ? styles.active : '' ].join(' ') }
                      icon={ caretDown }/>
              </TableHead>

            { progress.sort(sortProgress).map(p => {
              return (
                <Fragment key={ p.displayUsername }>
                  <TableDivider/>
                  <TableContent
                    isFirstColumn={ true }>{ p.displayUsername }</TableContent>
                  <TableContent className={ styles.progressContent }>
                    <div>
                      { p.ranges.map(r => (
                        <Fragment key={ r.id }>
                          <p>{ r.first_file_index + 1 }</p>
                          <Progress value={ r.finished_tasks_count } total={ r.files_count }
                                    color={ r.finished_tasks_count === r.files_count ? 'success' : 'medium' }/>
                          <p>{ r.last_file_index + 1 }</p>
                        </Fragment>
                      )) }
                      <p className={ styles.total }>{ p.progress }%</p>
                    </div>
                  </TableContent>
                </Fragment>
              );
            }) }
          </Table> }

      { isOwner && users && fileRanges && (
        <ModalFooter className={ styles.footer }>
          <div className={ styles.buttons }>
            { progress.length > 0 && <Fragment>
                <IonButton fill='outline' onClick={ onDownloadReport }>
                    <IonIcon icon={ downloadOutline } slot='start'/>
                    Results (csv)
                </IonButton>

                <IonButton fill='outline' onClick={ onDownloadStatus }>
                    <IonIcon icon={ downloadOutline } slot='start'/>
                    Status (csv)
                </IonButton>
            </Fragment> }
          </div>

          <IonButton onClick={ manageAnnotator }>Manage annotators</IonButton>
        </ModalFooter>
      )
      }
    </Modal>
  )
}
