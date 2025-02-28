import React, { Fragment, useEffect, useMemo, useState } from "react";
import { AnnotationCampaign } from "@/service/campaign";
import { FILES_PAGE_SIZE, useListFilesWithPaginationQuery } from "@/service/campaign/annotation-file-range";
import { IonButton, IonIcon, IonSpinner } from "@ionic/react";
import styles from './Detail.module.scss'
import { checkmarkCircle, chevronForwardOutline, ellipseOutline, playOutline, refreshOutline } from "ionicons/icons";
import { useHistory } from "react-router-dom";
import { Button, WarningText } from "@/components/ui";
import { getErrorMessage } from "@/service/function.ts";
import { Table, TableContent, TableDivider, TableHead } from "@/components/table/table.tsx";
import { Pagination } from "@/components/Pagination/Pagination.tsx";
import { ActionBar } from "@/components/ActionBar/ActionBar.tsx";
import { useAppDispatch, useAppSelector } from "@/service/app.ts";
import { resetFileFilters, setFileFilters } from "@/service/ui";
import { AnnotationFile } from "@/service/campaign/annotation-file-range/type.ts";
import { ID } from "@/service/type.ts";
import { DateFilter } from "@/view/campaign/detail/filters/DateFilter.tsx";
import { StatusFilter } from "@/view/campaign/detail/filters/StatusFilter.tsx";
import { AnnotationsFilter } from "@/view/campaign/detail/filters/AnnotationsFilter.tsx";

export const DetailPageAnnotationTasks: React.FC<{
  campaign?: AnnotationCampaign;
  isOwner: boolean;
}> = ({ campaign, }) => {
  const history = useHistory();
  const [ page, setPage ] = useState<number>(1);

  const fileFilters = useAppSelector(state => state.ui.fileFilters);
  const dispatch = useAppDispatch();

  useEffect(() => {
    if (!campaign) return;
    if (fileFilters.campaignID !== campaign.id)
      dispatch(resetFileFilters())
  }, [ campaign?.id ]);

  useListFilesWithPaginationQuery({
    page: 1,
    filters: {
      campaignID: campaign!.id,
    }
  }, { refetchOnMountOrArgChange: true, skip: !campaign });
  const { currentData: files, isFetching, error } = useListFilesWithPaginationQuery({
    page,
    filters: {
      ...fileFilters,
      campaignID: campaign!.id,
    }
  }, { skip: !campaign });
  const maxPage = useMemo(() => {
    if (!files) return 1;
    return Math.ceil(files.count / FILES_PAGE_SIZE)
  }, [ files?.count ])

  const isResumeEnabled = useMemo(() => {
    return fileFilters.withUserAnnotations === undefined && fileFilters.search === undefined && fileFilters.isSubmitted === undefined
  }, [ fileFilters ]);

  const hasFilters = useMemo(() => Object.values(fileFilters).filter(v => v !== undefined && v != campaign?.id).length > 0, [ fileFilters ]);

  function resume() {
    if (!campaign || !files) return;
    history.push(`/annotation-campaign/${ campaign.id }/file/${ files.resume }`);
  }

  function updateSearch(search: string) {
    if (!campaign) return;
    dispatch(setFileFilters({
      ...fileFilters,
      campaignID: campaign.id,
      search,
    }))
    setPage(1)
  }

  function resetFilters() {
    if (!campaign) return;
    dispatch(setFileFilters({
      campaignID: campaign.id,
      isSubmitted: undefined,
      label: undefined,
      confidence: undefined,
      withUserAnnotations: undefined,
    }))
    setPage(1)
  }

  function onFilterUpdated() {
    setPage(1)
  }

  return <Fragment>

    <ActionBar search={ fileFilters.search }
               searchPlaceholder="Search filename"
               onSearchChange={ updateSearch }
               actionButton={ <div className={ styles.filterButtons }>

                 { hasFilters && <IonButton fill='clear' color='medium' onClick={ resetFilters }>
                     <IonIcon icon={ refreshOutline } slot='start'/>
                     Reset
                 </IonButton> }

                 <Button color="primary" fill='outline'
                         disabled={ !(files && files.count > 0) || !files?.resume || !isResumeEnabled }
                         disabledExplanation={ files && files.count > 0 ? 'Cannot resume if filters are activated.' : 'No files to annotate' }
                         style={ { pointerEvents: 'unset' } }
                         onClick={ resume }>
                   Resume annotation
                   <IonIcon icon={ playOutline } slot="end"/>
                 </Button>
               </div> }/>

    { campaign && <Fragment>
        <Table columns={ 6 } className={ styles.filesTable }>
            <TableHead topSticky isFirstColumn={ true }>
                Filename
            </TableHead>
            <TableHead topSticky className={ styles.filteredTableHead }>
                Date
                <DateFilter onUpdate={ onFilterUpdated }/>
            </TableHead>
            <TableHead topSticky>
                Duration
            </TableHead>
            <TableHead topSticky className={ styles.filteredTableHead }>
                Annotations
                <AnnotationsFilter campaign={ campaign } onUpdate={ onFilterUpdated }/>
            </TableHead>
            <TableHead topSticky className={ styles.filteredTableHead }>
                Status
                <StatusFilter onUpdate={ onFilterUpdated }/>
            </TableHead>
            <TableHead topSticky>
                Access
            </TableHead>
            <TableDivider/>

          { files?.results.map(file => <TaskItem key={ file.id } file={ file } campaignID={ campaign.id }/>) }
        </Table>

      { files && files.results.length > 0 &&
          <Pagination currentPage={ page } totalPages={ maxPage } setCurrentPage={ setPage }/> }
    </Fragment> }

    { isFetching && <IonSpinner/> }
    { error && <WarningText>{ getErrorMessage(error) }</WarningText> }

    { files && files.count === 0 && <p>You have no files to annotate.</p> }

  </Fragment>
}

const TaskItem: React.FC<{
  campaignID: ID;
  file: AnnotationFile;
}> = ({ campaignID, file }) => {
  const history = useHistory()
  const startDate = useMemo(() => new Date(file.start), [ file.start ]);
  const duration = useMemo(() => new Date(new Date(file.end).getTime() - startDate.getTime()), [ file.end, file.start ]);

  function access() {
    history.push(`/annotation-campaign/${ campaignID }/file/${ file.id }`);
  }

  return <Fragment key={ file.id }>
    <TableContent isFirstColumn={ true } disabled={ file.is_submitted }>{ file.filename }</TableContent>
    <TableContent disabled={ file.is_submitted }>{ startDate.toLocaleString() }</TableContent>
    <TableContent disabled={ file.is_submitted }>{ duration.toUTCString().split(' ')[4] }</TableContent>
    <TableContent disabled={ file.is_submitted }>{ file.results_count }</TableContent>
    <TableContent disabled={ file.is_submitted }>
      { file.is_submitted &&
          <IonIcon icon={ checkmarkCircle } className={ styles.statusIcon } color='primary'/> }
      { !file.is_submitted &&
          <IonIcon icon={ ellipseOutline } className={ styles.statusIcon } color='medium'/> }
    </TableContent>
    <TableContent disabled={ file.is_submitted }>
      <IonButton color='dark' fill='clear' size='small' className={ styles.submit } onClick={ access }>
        <IonIcon icon={ chevronForwardOutline } color='primary' slot='icon-only'/>
      </IonButton>
    </TableContent>
    <TableDivider/>
  </Fragment>
}