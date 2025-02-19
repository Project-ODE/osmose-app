import { useAppSelector } from '@/service/app';
import { useEffect, useRef } from "react";
import { AnnotatorState, usePostAnnotatorMutation, WriteAnnotatorData } from '@/service/annotator';
import { useAnnotator } from "@/service/annotator/hook.ts";
import { transformCommentsForWriting } from "@/service/campaign/comment/function.ts";
import { AnnotationCampaign } from "@/service/campaign";

export const useAnnotatorSubmitService = () => {
  const {
    campaign,
  } = useAnnotator();

  // Interface data
  const [ post ] = usePostAnnotatorMutation()
  const annotator = useAppSelector(state => state.annotator);
  const _annotator = useRef<AnnotatorState>(annotator)
  const _campaign = useRef<AnnotationCampaign | undefined>(campaign)
  useEffect(() => {
    _annotator.current = annotator;
  }, [ annotator ]);
  useEffect(() => {
    _campaign.current = campaign;
  }, [ campaign ]);

  function submit() {
    if (!_campaign.current || !_annotator.current.file) return;
    return post({
      campaign: _campaign.current,
      fileID: _annotator.current.file.id,
      data: {
        results: (_annotator.current.results ?? []).map(r => ({
          ...r,
          id: r.id > -1 ? r.id : undefined,
          comments: transformCommentsForWriting(r.comments),
          validations: r.validations.map(v => ({
            is_valid: v.is_valid,
            id: v.id > -1 ? v.id : undefined,
          })),
          confidence_indicator: r.confidence_indicator ?? undefined,
          detector_configuration: r.detector_configuration ?? undefined,
          annotation_campaign: undefined,
          dataset_file: undefined,
          annotator: undefined,
        })),
        task_comments: transformCommentsForWriting(_annotator.current.task_comments ?? []),
        session:
          {
            start: new Date(_annotator.current.sessionStart),
            end:
              new Date()
          }
      }satisfies WriteAnnotatorData
    }).unwrap()
  }

  return { submit }
}