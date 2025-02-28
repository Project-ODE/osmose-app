import React, { Fragment } from "react";
import styles from "./inputs.module.scss";

export const Label: React.FC<{ label?: string, required?: boolean }> = ({ label, required }) => {
  if (!label) return <Fragment/>
  return <label className={ [ styles.label, required ? styles.required : '' ].join(' ') }>
    { label }{ required ? '*' : '' }
  </label>
}