import React, { Fragment, KeyboardEvent, useMemo, useState } from "react";
import { AnnotationCampaign } from "@/service/campaign";
import { FILES_PAGE_SIZE, useListFilesWithPaginationQuery } from "@/service/campaign/annotation-file-range";
import { IonButton, IonIcon, IonSearchbar, IonSpinner } from "@ionic/react";
import styles from './Detail.module.scss'
import { checkmarkCircle, chevronForwardOutline, ellipseOutline, playOutline } from "ionicons/icons";
import { Link, useHistory } from "react-router-dom";
import { WarningText } from "@/components/ui";
import { getErrorMessage } from "@/service/function.ts";
import { Table, TableContent, TableDivider, TableHead } from "@/components/table/table.tsx";
import { Pagination } from "@/components/Pagination/Pagination.tsx";

export const DetailPageAnnotationTasks: React.FC<{
  campaign: AnnotationCampaign;
  isOwner: boolean;
}> = ({ campaign, }) => {
  const history = useHistory();
  const [ page, setPage ] = useState<number>(1);
  const [ search, setSearch ] = useState<string | undefined>();

  const { data: files, isLoading, error } = useListFilesWithPaginationQuery({
    campaignID: campaign.id,
    page,
    search
  }, { refetchOnMountOrArgChange: true });
  const maxPage = useMemo(() => {
    if (!files) return 1;
    return Math.ceil(files.count / FILES_PAGE_SIZE)
  }, [ files?.count ])

  function doSearch(event: KeyboardEvent<HTMLIonSearchbarElement>) {
    if (event.key === 'Enter') {
      setSearch(event.currentTarget.value ?? undefined)
      setPage(1)
    }
  }

  function clearSearch() {
    setSearch(undefined)
    setPage(1)
  }

  function resume() {
    history.push(`/annotation-campaign/${ campaign.id }/file/${ files?.resume }`);
  }


  return <Fragment>
    <div className={ styles.tasksActionBar }>
      <IonSearchbar placeholder="Search file"
                    className={ styles.search }
                    onKeyDown={ doSearch }
                    onIonClear={ clearSearch }
                    value={ search }/>

      <IonButton color="primary" fill='outline' disabled={ !files?.resume }
                 onClick={ resume }>
        Resume annotation
        <IonIcon icon={ playOutline } slot="end"/>
      </IonButton>

      {/* TODO: Add filters */ }
    </div>

    { isLoading && <IonSpinner/> }
    { error && <WarningText>{ getErrorMessage(error) }</WarningText> }

    { files && <Fragment>
        <Table columns={ 6 } className={ styles.filesTable }>
            <TableHead isFirstColumn={ true }>Filename</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Duration</TableHead>
            <TableHead>Annotations</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Access</TableHead>
            <TableDivider/>

          { files.results.map(file => {
            const startDate = new Date(file.start);
            const diffTime = new Date(new Date(file.end).getTime() - startDate.getTime());
            return <Fragment key={ file.id }>
              <TableContent isFirstColumn={ true } disabled={ file.is_submitted }>{ file.filename }</TableContent>
              <TableContent disabled={ file.is_submitted }>{ startDate.toLocaleString() }</TableContent>
              <TableContent disabled={ file.is_submitted }>{ diffTime.toUTCString().split(' ')[4] }</TableContent>
              <TableContent disabled={ file.is_submitted }>{ file.results_count }</TableContent>
              <TableContent disabled={ file.is_submitted }>
                { file.is_submitted &&
                    <IonIcon icon={ checkmarkCircle } className={ styles.statusIcon } color='primary'/> }
                { !file.is_submitted &&
                    <IonIcon icon={ ellipseOutline } className={ styles.statusIcon } color='medium'/> }
              </TableContent>
              <TableContent disabled={ file.is_submitted }>
                <Link to={ `/annotation-campaign/${ campaign.id }/file/${ file.id }` }>
                  <IonIcon icon={ chevronForwardOutline } color='primary'/>
                </Link>
              </TableContent>
              <TableDivider/>
            </Fragment>
          }) }

        </Table>

        <Pagination currentPage={ page } totalPages={ maxPage } setCurrentPage={ setPage }/>
    </Fragment> }

  </Fragment>
}