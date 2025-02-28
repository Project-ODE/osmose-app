import React, { Fragment, ReactNode } from 'react';
import style from './extended.module.scss';
import {
  BottomHandle,
  BottomLeftHandle,
  BottomRightHandle,
  LeftHandle,
  RightHandle,
  TopHandle,
  TopLeftHandle,
  TopRightHandle
} from './Handles.tsx';

export const Resizable: React.FC<{
  resizable?: boolean,
  horizontalResize?: boolean,
  verticalResize?: boolean,
  onLeftMove?(movement: number): void;
  onWidthMove?(movement: number): void;
  onTopMove?(movement: number): void;
  onHeightMove?(movement: number): void;
  onUp?(): void;
  className?: string;
  children?: ReactNode;
  top?: number;
  height?: number;
  left?: number;
  width?: number;
  onClick?: () => void;
}> = ({
        resizable = false,
        horizontalResize = false,
        verticalResize = false,
        onLeftMove: _onLeftMove, onWidthMove,
        onTopMove: _onTopMove, onHeightMove,
        onUp,
        className,
        children,
        top, height, left, width,
        onClick
      }) => {

  function onLeftMove(movement: number) {
    if (_onLeftMove) _onLeftMove(movement);
    if (onWidthMove) onWidthMove(-movement);
  }

  function onTopMove(movement: number) {
    if (_onTopMove) _onTopMove(movement);
    if (onHeightMove) onHeightMove(-movement);
  }

  return (
    <div className={ [ style.resizable, className ].join(' ') }
         onClick={ onClick }
         style={ { top, left, height, width } }>
      <div className={ style.inner }>

        { children }

        { (resizable || verticalResize) && <Fragment>
            <TopHandle onTopMove={ onTopMove } onUp={ onUp }/>
            <BottomHandle onBottomMove={ onHeightMove } onUp={ onUp }/>
        </Fragment> }

        { (resizable || horizontalResize) && <Fragment>
            <LeftHandle onLeftMove={ onLeftMove } onUp={ onUp }/>
            <RightHandle onRightMove={ onWidthMove } onUp={ onUp }/>
        </Fragment> }

        { (resizable || (horizontalResize && verticalResize)) && <Fragment>
            <TopLeftHandle onTopMove={ onTopMove } onLeftMove={ onLeftMove } onUp={ onUp }/>
            <TopRightHandle onTopMove={ onTopMove } onRightMove={ onWidthMove } onUp={ onUp }/>
            <BottomLeftHandle onBottomMove={ onHeightMove } onLeftMove={ onLeftMove } onUp={ onUp }/>
            <BottomRightHandle onBottomMove={ onHeightMove } onRightMove={ onWidthMove } onUp={ onUp }/>
        </Fragment> }
      </div>
    </div>
  )
}