import React, { ReactNode } from "react";
import styles from "./ui.module.scss";
import { IoWarningOutline } from "react-icons/io5";

export const FadedText: React.FC<{ children: ReactNode }> = ({ children }) => (
  <p className={ styles.fadedText }>{ children }</p>
)

export const WarningText: React.FC<{ children: ReactNode }> = ({ children }) => (
  <div className={ styles.warningText }>
    <IoWarningOutline className={ styles.icon }/>
    { children }
  </div>
)