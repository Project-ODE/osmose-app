import React, { useMemo } from "react";
import { useAppDispatch, useAppSelector } from '@/service/app';
import { focusTask, removeFocusComment, updateFocusComment } from '@/service/annotator';
import styles from './bloc.module.scss';
import { Textarea } from "@/components/form";
import { IonButton, IonIcon } from "@ionic/react";
import { chatbubbleEllipses, chatbubbleOutline, trashBinOutline } from "ionicons/icons";


export const Comment: React.FC = () => {

  const dispatch = useAppDispatch();
  const {
    focusedCommentID,
    results,
    task_comments,
    focusedResultID,
  } = useAppSelector(state => state.annotator)

  const currentComment = useMemo(() => {
    if (!focusedResultID) return task_comments?.find(c => c.id === focusedCommentID)?.comment;
    return results?.find(r => r.id === focusedResultID)?.comments.find(c => c.id === focusedCommentID)?.comment;
  }, [ results, focusedCommentID ])

  const taskCommentExists = useMemo(() => {
    if (!task_comments) return false;
    return task_comments.filter(c => c.comment.trim().length > 0).length > 0;
  }, [ task_comments ]);

  return (
    <div className={ [ styles.bloc, styles.comments ].join(' ') }>
      <h6 className={ styles.header }>Comments</h6>
      <div className={ [ styles.body, styles.comment ].join(' ') }>

        <Textarea maxLength={ 255 }
                  rows={ 5 }
                  placeholder="Enter your comment"
                  style={ { resize: 'none' } }
                  value={ currentComment ?? '' }
                  onChange={ e => dispatch(updateFocusComment(e.target.value)) }/>

        <IonButton color='danger' size='small'
                   className={ styles.removeButton }
                   onClick={ () => dispatch(removeFocusComment()) }>
          Remove
          <IonIcon slot='end' icon={ trashBinOutline }/>
        </IonButton>
      </div>


      <div className={ styles.footer }>
        <IonButton fill='clear' color='medium'
                   onClick={ () => dispatch(focusTask()) }>
          Task Comment
          <IonIcon slot='end'
                   icon={ taskCommentExists ? chatbubbleEllipses : chatbubbleOutline }/>
        </IonButton>
      </div>
    </div>
  )
}
