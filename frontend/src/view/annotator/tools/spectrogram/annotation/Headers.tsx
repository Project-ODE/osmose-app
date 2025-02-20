import React, { MutableRefObject } from 'react';
import { ExtendedDiv } from '@/components/ui/ExtendedDiv';
import styles from '@/view/annotator/tools/annotator-tools.module.scss';
import { focusResult, removeResult } from '@/service/annotator';
import { IoChatbubbleEllipses, IoChatbubbleOutline, IoPlayCircle, IoTrashBin } from 'react-icons/io5';
import { useAnnotator } from '@/service/annotator/hook.ts';
import { useAppDispatch } from '@/service/app.ts';
import { AnnotationResult } from '@/service/campaign/result';
import { useAudioService } from '@/services/annotator/audio.service.ts';

export const AnnotationHeader: React.FC<{
  active: boolean;
  top: number;
  onTopMove?(value: number): void;
  onLeftMove?(value: number): void;
  onValidateMove?(): void;
  className?: string;
  annotation: AnnotationResult,
  audioPlayer: MutableRefObject<HTMLAudioElement | null>;
}> = ({ active, top, onTopMove, onLeftMove, onValidateMove, className, annotation, audioPlayer }) => {
  const { campaign } = useAnnotator();
  const dispatch = useAppDispatch();
  const audioService = useAudioService(audioPlayer);
  return <ExtendedDiv draggable={ active && campaign?.usage === 'Create' }
                      onTopMove={ onTopMove } onLeftMove={ onLeftMove }
                      onUp={ onValidateMove }
                      top={ top < 24 ? 24 : -8 }
                      className={ [ styles.boxTitle, className, campaign?.usage === 'Create' ? styles.canBeRemoved : '' ].join(' ') }
                      innerClassName={ styles.inner }
                      onClick={ () => dispatch(focusResult(annotation.id)) }>

    <IoPlayCircle className={ styles.button } onClick={ () => audioService.play(annotation) }/>

    <p>{ annotation.label }</p>

    { annotation.comments.length > 0 ?
      <IoChatbubbleEllipses/> :
      <IoChatbubbleOutline className={ styles.outlineIcon }/> }

    {/* 'remove-box' class is for playwright tests*/ }
    { campaign?.usage === 'Create' && (
      <IoTrashBin className={ [ styles.button, styles.delete, 'remove-box' ].join(' ') }
                  onClick={ () => dispatch(removeResult(annotation.id)) }/>
    ) }

  </ExtendedDiv>
}