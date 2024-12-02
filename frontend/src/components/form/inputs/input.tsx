import React, { ChangeEvent, InputHTMLAttributes, useImperativeHandle, useRef, useState } from "react";
import { IonIcon, IonNote } from "@ionic/react";
import { InputRef } from "@/components/form/inputs/utils.ts";
import './inputs.css';

type OldInputProperties = {
  label?: string;
  startIcon?: string;
  note?: string;
} & Omit<InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'>

export type InputValue = InputHTMLAttributes<HTMLInputElement>['value']

export const OldInput = React.forwardRef<InputRef<InputValue>, OldInputProperties>(({
                                                                                      label,
                                                                                      startIcon,
                                                                                      required,
                                                                                      disabled,
                                                                                      note,
                                                                                      ...inputArgs
                                                                                    }, ref) => {
  const [ value, setValue ] = useState<InputValue>('');
  const _value = useRef<InputValue>('');
  const _setValue = (value: InputValue | undefined) => {
    setValue(value ?? '');
    _value.current = value ?? '';
  }

  const [ error, setError ] = useState<string | undefined>();
  const _error = useRef<string | undefined>();
  const _setError = (error: string | undefined) => {
    setError(error);
    _error.current = error;
  }

  const onChange = (e: ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    let newNumber = +e.target.value;
    const min = +(inputArgs.min ?? '');
    const max = +(inputArgs.max ?? '');
    const placeholder = +(inputArgs.placeholder ?? '');
    switch (inputArgs.type) {
      case 'number':
        if (!value && !isNaN(placeholder)) {
          if (newNumber == -1) newNumber = placeholder - 1;
          if (newNumber == 1) newNumber = placeholder + 1;
        }
        if (!isNaN(min) && newNumber < min) newNumber = min
        if (!isNaN(max) && newNumber > max) newNumber = max
        _setValue(newNumber);
        _setError(undefined);
        break;
      default:
        _setValue(newValue);
        _setError(undefined);
        break
    }
  }

  useImperativeHandle(ref, () => ({
    setValue: _setValue,
    setError: _setError,
    validate() {
      if (_error.current) throw _error.current;
      return _value.current;
    }
  }), []);

  const className = [];
  if (startIcon) className.push('has-start-icon');
  return <div id="aplose-input" aria-disabled={ disabled } aria-invalid={ !!error }>
    { label && <label id="label"
                      className={ required ? 'required' : '' }>
      { label }{ required ? '*' : '' }
    </label> }

    <div id="input">
      { startIcon && <IonIcon id="input-start-icon" icon={ startIcon }/> }
      <input { ...{ ...inputArgs, min: undefined, max: undefined } }
             value={ value }
             onChange={ onChange }
             required={ required }
             disabled={ disabled }
             className={ `${ className.join(' ') } ${ inputArgs.className }` }/>
    </div>

    { note && <IonNote>{ note }</IonNote> }
    { error && <IonNote color="danger">{ error }</IonNote> }
  </div>
})

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
  return <div id="aplose-input" aria-disabled={ disabled } aria-invalid={ !!error }>
    { label && <label id="label"
                      className={ required ? 'required' : '' }>
      { label }{ required ? '*' : '' }
    </label> }

    <div id="input">
      { startIcon && <IonIcon id="input-start-icon" icon={ startIcon }/> }
      <input { ...{ ...inputArgs, min: undefined, max: undefined } }
             value={ value }
             required={ required }
             disabled={ disabled }
             className={ `${ className.join(' ') } ${ inputArgs.className }` }/>
    </div>

    { note && <IonNote>{ note }</IonNote> }
    { error && <IonNote color="danger">{ error }</IonNote> }
  </div>
}
