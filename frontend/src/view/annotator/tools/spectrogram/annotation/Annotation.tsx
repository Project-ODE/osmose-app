import React, { Fragment, MutableRefObject, useMemo } from "react";
import { AnnotationResult } from "@/service/campaign/result";
import { getResultType } from "@/service/annotator";
import { Box } from "@/view/annotator/tools/spectrogram/annotation/Box.tsx";

export const Annotation: React.FC<{
  annotation: AnnotationResult,
  audioPlayer: MutableRefObject<HTMLAudioElement | null>;
}> = (props) => {
  const type = useMemo(() => getResultType(props.annotation), [ props.annotation ]);

  switch (type) {
    case "box":
      return <Box { ...props }/>
    default:
      return <Fragment/>
  }
}