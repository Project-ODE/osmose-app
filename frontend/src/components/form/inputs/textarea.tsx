import React, { TextareaHTMLAttributes } from "react";
import { IonNote } from "@ionic/react";
import { disableShortcuts, enableShortcuts } from "@/service/events";
import { useAppDispatch } from "@/service/app.ts";
import styles from './inputs.module.scss'
import { Label } from "@/components/form/inputs/Label.tsx";

export type OldTextareaProperties = {
  label?: string;
  error?: string;
} & TextareaHTMLAttributes<HTMLTextAreaElement>


export const Textarea: React.FC<OldTextareaProperties> = ({
                                                            label,
                                                            disabled,
                                                            value,
                                                            error,
                                                            required,
                                                            ...textareaArgs
                                                          }) => {

  const dispatch = useAppDispatch();

  return <div id="aplose-input" className={ [styles.default, "textarea"].join(' ') } aria-disabled={ disabled } aria-invalid={ !!error }>
    <Label required={ required } label={ label }/>

    <div className={ styles.input }>
      <textarea { ...textareaArgs }
                value={ value }
                disabled={ disabled }
                onFocus={ () => dispatch(disableShortcuts()) }
                onBlur={ () => dispatch(enableShortcuts()) }
                required={ required }/>
    </div>
    { error && <IonNote color="danger">{ error }</IonNote> }
  </div>
}
