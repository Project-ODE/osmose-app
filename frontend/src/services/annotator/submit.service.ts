import { useAppSelector } from '@/service/app';
import { useEffect, useRef } from "react";
import { AnnotatorState, usePostAnnotatorMutation, WriteAnnotatorData } from '@/service/annotator';
import { useAnnotator } from "@/service/annotator/hook.ts";
import { AnnotationResultValidations, WriteAnnotationResult } from '@/service/campaign/result';
import { transformCommentsForWriting } from "@/service/campaign/comment/function.ts";

export const useAnnotatorSubmitService = () => {
  const {
    annotatorData,
    campaign
  } = useAnnotator();

  // Interface data
  const [ post ] = usePostAnnotatorMutation()
  const annotator = useAppSelector(state => state.annotator);
  const _annotator = useRef<AnnotatorState>(annotator)
  useEffect(() => {
    _annotator.current = annotator;
  }, [ annotator ]);

  function submit() {
    if (!campaign || !annotatorData) return;
    return post({
      campaign,
      fileID: annotatorData.file.id,
      data: {
        results: (_annotator.current.results ?? []).map(r => ({
          ...r,
          id: r.id > -1 ? r.id : undefined,
          comments: transformCommentsForWriting(r.comments),
          validations: r.validations.map(v => ({
            is_valid: v.is_valid,
            id: v.id > -1 ? v.id : undefined,
          } satisfies Omit<AnnotationResultValidations, "id" | "annotator" | "result"> & { id: number | undefined })),
          confidence_indicator: r.confidence_indicator ?? undefined,
          detector_configuration: r.detector_configuration ?? undefined,
        } satisfies WriteAnnotationResult)),
        task_comments: transformCommentsForWriting(_annotator.current.task_comments ?? []),
        session: {
          start: new Date(_annotator.current.sessionStart),
          end: new Date()
        }
      } satisfies WriteAnnotatorData
    }).unwrap()
  }

  return { submit }
}