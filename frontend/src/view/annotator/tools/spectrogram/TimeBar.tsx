import React from "react";
import styles from "@/view/annotator/tools/annotator-tools.module.scss";
import { useAppSelector } from "@/service/app.ts";
import { useFileDuration, useSpectrogramDimensions } from '@/service/annotator/spectrogram/hook.ts';

export const TimeBar: React.FC = () => {
  // Data
  const { time } = useAppSelector(state => state.annotator.audio)

  // Memo
  const { width } = useSpectrogramDimensions()
  const duration = useFileDuration()

  return (
    <div className={ styles.timeBar } style={ { left: time * width / duration } }/>
  )
}