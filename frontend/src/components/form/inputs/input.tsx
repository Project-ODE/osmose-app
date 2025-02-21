import React, { Fragment, HTMLInputTypeAttribute, InputHTMLAttributes, useState } from "react";
import { IonIcon, IonNote } from "@ionic/react";
import './inputs.css';
import { eyeOffOutline, eyeOutline } from "ionicons/icons";
import { useAppDispatch } from "@/service/app.ts";
import { disableShortcuts, enableShortcuts } from "@/service/events";

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
  if (startIcon) className.push('has-start-icon');
  if (inputArgs.type === 'password') className.push('has-end-icon');

  const [ type, setType ] = useState<HTMLInputTypeAttribute | undefined>(inputArgs.type);

  const dispatch = useAppDispatch();

  function toggleType() {
    if (inputArgs.type !== 'password') return;
    if (type === 'password') setType('text');
    else setType('password');
  }

  return <div
    id="aplose-input"
    aria-disabled={ disabled }
    aria-invalid={ !!error }
    className={ type === 'checkbox' ? "inline" : '' }
  >
    { label && <label id="label"
                      className={ required ? 'required' : '' }>
      { label }{ required ? '*' : '' }
    </label> }

    <div id="input">
      { startIcon && <IonIcon id="input-start-icon" icon={ startIcon }/> }
      <input { ...inputArgs }
             type={ type }
             value={ value }
             required={ required }
             disabled={ disabled }
             onFocus={ () => dispatch(disableShortcuts()) }
             onBlur={ () => dispatch(enableShortcuts()) }
             className={ `${ className.join(' ') } ${ inputArgs.className }` }/>

      { inputArgs.type === 'password' && <Fragment>
        { type === 'password' && <IonIcon id='input-end-icon' icon={ eyeOutline } onClick={ toggleType }/> }
        { type === 'text' && <IonIcon id='input-end-icon' icon={ eyeOffOutline } onClick={ toggleType }/> }
      </Fragment> }
    </div>

    { note && <IonNote>{ note }</IonNote> }
    { error && <IonNote color="danger">{ error }</IonNote> }
  </div>
}
