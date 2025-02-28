import React, { Fragment, HTMLInputTypeAttribute, InputHTMLAttributes, useState } from "react";
import { IonIcon, IonNote } from "@ionic/react";
import { eyeOffOutline, eyeOutline } from "ionicons/icons";
import { useAppDispatch } from "@/service/app.ts";
import { disableShortcuts, enableShortcuts } from "@/service/events";
import styles from './inputs.module.scss'
import { Label } from "@/components/form/inputs/Label.tsx";

type InputProperties = {
  label?: string;
  startIcon?: string;
  note?: string;
  error?: string;
} & InputHTMLAttributes<HTMLInputElement>
export const Input: React.FC<InputProperties> = ({
                                                   label,
                                                   startIcon,
                                                   required,
                                                   disabled,
                                                   note,
                                                   error,
                                                   value,
                                                   ...inputArgs
                                                 }) => {
  const className = [];
  if (startIcon) className.push(styles.hasStartIcon);
  if (inputArgs.type === 'password') className.push(styles.hasEndIcon);

  const [ type, setType ] = useState<HTMLInputTypeAttribute | undefined>(inputArgs.type);

  const dispatch = useAppDispatch();

  function toggleType() {
    if (inputArgs.type !== 'password') return;
    if (type === 'password') setType('text');
    else setType('password');
  }

  return <div id="aplose-input" className={ styles.default } aria-disabled={ disabled } aria-invalid={ !!error }>
    <Label required={ required } label={ label }/>

    <div className={ styles.input }>
      { startIcon && <IonIcon className={ styles.startIcon } icon={ startIcon }/> }
      <input { ...inputArgs }
             type={ type }
             value={ value }
             required={ required }
             disabled={ disabled }
             onFocus={ () => dispatch(disableShortcuts()) }
             onBlur={ () => dispatch(enableShortcuts()) }
             className={ `${ className.join(' ') } ${ inputArgs.className }` }/>

      { inputArgs.type === 'password' && <Fragment>
        { type === 'password' && <IonIcon className={ styles.endIcon } icon={ eyeOutline } onClick={ toggleType }/> }
        { type === 'text' && <IonIcon className={ styles.endIcon } icon={ eyeOffOutline } onClick={ toggleType }/> }
      </Fragment> }
    </div>

    { note && <IonNote>{ note }</IonNote> }
    { error && <IonNote color="danger">{ error }</IonNote> }
  </div>
}
