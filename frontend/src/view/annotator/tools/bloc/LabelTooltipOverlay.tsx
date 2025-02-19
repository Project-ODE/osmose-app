import React, { Fragment, ReactElement } from "react";
import { Kbd, TooltipOverlay } from "@/components/ui";
import { AlphanumericKeys } from "@/consts/shorcuts.const.tsx";

export const LabelTooltipOverlay: React.FC<{ id: number, children: ReactElement }> = ({ id, children }) => {
  const number = AlphanumericKeys[1][id];
  const key = AlphanumericKeys[0][id];
  if (id >= 9) return children;
  return (
    <TooltipOverlay title='Shortcut'
                    children={ children }
                    tooltipContent={ <Fragment>
                      <p>
                        <Kbd keys={ number }
                             className={ `ion-color-${ id }` }/> or <Kbd keys={ key }
                                                                         className={ `ion-color-${ id }` }/> : Choose this
                        label
                      </p>
                      {/*<br/>*/ }
                      {/*<p>*/ }
                      {/*  <Kbd keys={ number }/>+<Kbd keys={ number }/> or <Kbd keys={ key }/>+<Kbd keys={ key }/> :*/ }
                      {/*  Delete all annotations of this label*/ }
                      {/*</p>*/ }
                    </Fragment> }/>
  )
}
