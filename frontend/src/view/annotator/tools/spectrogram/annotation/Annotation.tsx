import React, { Fragment, MutableRefObject } from "react";
import { AnnotationResult } from "@/service/campaign/result";
import { Box } from "@/view/annotator/tools/spectrogram/annotation/Box.tsx";
import { Point } from '@/view/annotator/tools/spectrogram/annotation/Point.tsx';

export const Annotation: React.FC<{
  annotation: AnnotationResult,
  audioPlayer: MutableRefObject<HTMLAudioElement | null>;
}> = ({ annotation, audioPlayer }) => <Fragment>
  { annotation.type === 'Box' && <Box annotation={ annotation } audioPlayer={ audioPlayer }/> }
  { annotation.type === 'Point' && <Point annotation={ annotation } audioPlayer={ audioPlayer }/> }
</Fragment>