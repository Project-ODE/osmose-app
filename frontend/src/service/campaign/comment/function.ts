import { AnnotationComment, WriteAnnotationComment } from '@/service/campaign/comment/type.ts';

export function transformCommentsForWriting(comments: AnnotationComment[]): WriteAnnotationComment[] {
  return comments.filter(c => c.comment.trim().length > 0).map(c => ({
    id: c.id > -1 ? c.id : undefined,
    comment: c.comment.trim()
  }))
}