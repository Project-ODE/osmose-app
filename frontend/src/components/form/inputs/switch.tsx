import React, { HTMLProps, } from "react";
import styles from './inputs.module.scss'
import { Label } from "@/components/form/inputs/Label.tsx";


type SelectProperties = {
  options: Array<string>;
  value: string;
  label?: string;
  required?: boolean;
  onValueSelected: (value: string) => void;
} & Omit<HTMLProps<HTMLDivElement>, 'id' | 'ref'>

export const Switch: React.FC<SelectProperties> = ({
                                                     label,
                                                     required = false,
                                                     options,
                                                     value,
                                                     onValueSelected,
                                                     disabled,
                                                     className,
                                                     ...props
                                                   }) => {

  return <div id="aplose-input"
              aria-disabled={ disabled }
              className={ [ styles.default, styles.switch, className, label ? styles.hasLabel : '' ].join(' ') } { ...props }>
    <Label required={ required } label={ label }/>

    <div className={ styles.switchContainer } style={ {
      gridTemplateColumns: `repeat(${ options.length }, 1fr)`
    } }>
      { options.map(o => <div key={ o }
                              onClick={ () => {
                                if (disabled) return;
                                onValueSelected(o);
                              } }
                              className={ [ styles.switchItem, value === o ? styles.selected : '' ].join(' ') }>
        { o }</div>) }
      <div className={ styles.switchSelect } style={ {
        width: `${ 100 / options.length }%`,
        left: `${ options.indexOf(value) * 100 / options.length }%`
      } }/>
    </div>
  </div>
}

