import React, { useMemo } from "react";
import { useAppDispatch, useAppSelector } from '@/service/app';
import { focusTask, removeFocusComment, updateFocusComment } from '@/service/annotator';
import { disableShortcuts, enableShortcuts } from "@/service/events";


export const CommentBloc: React.FC = () => {

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
  }, [results, focusedCommentID])


  return (
    <div className="col-sm-2">
      <div className="card">
        <h6 className="card-header text-center">Comments</h6>
        <div className="card-body">
          <div className="row m-2">
            <textarea key="textAreaComments" id="commentInput" className="col-sm-10 comments"
                      maxLength={ 255 }
                      rows={ 10 }
                      cols={ 10 }
                      placeholder="Enter your comment"
                      value={ currentComment ?? '' }
                      onChange={ e => dispatch(updateFocusComment(e.target.value)) }
                      onFocus={ () => dispatch(disableShortcuts()) }
                      onBlur={ () => dispatch(enableShortcuts()) }></textarea>
            <div className="input-group-append col-sm-2 p-0">
              <div className="btn-group-vertical">
                <button className="btn btn-danger ml-0"
                        onClick={ () => dispatch(removeFocusComment()) }>
                  <i className="fas fa-broom"></i>
                </button>
              </div>
            </div>
          </div>
        </div>
        <button className={ `btn w-100 ${ !focusedResultID ? "isActive" : "" }` }
                onClick={ () => dispatch(focusTask()) }>
          Task Comment { (task_comments ?? []).length > 0 ? <i className="fas fa-comment mx-2"></i> :
          <i className="far fa-comment mr-2"></i> }
        </button>
      </div>
    </div>
  )
}
