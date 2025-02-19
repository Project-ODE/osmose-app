import React from 'react';
import style from './extended.module.scss';
import { Draggable } from './Draggable.tsx';

type HandlesProps = {
  onLeftMove?(movement: number): void;
  onRightMove?(movement: number): void;
  onTopMove?(movement: number): void;
  onBottomMove?(movement: number): void;
  onUp?(): void;
}


export const LeftHandle: React.FC<Pick<HandlesProps, 'onLeftMove' | 'onUp'>> = ({ onLeftMove, onUp }) => (
  <Draggable draggable className={ style.left } onXMove={ onLeftMove } onUp={ onUp }/>
)
export const RightHandle: React.FC<Pick<HandlesProps, 'onRightMove' | 'onUp'>> = ({ onRightMove, onUp }) => (
  <Draggable draggable className={ style.right } onXMove={ onRightMove } onUp={ onUp }/>
)
export const TopHandle: React.FC<Pick<HandlesProps, 'onTopMove' | 'onUp'>> = ({ onTopMove, onUp }) => (
  <Draggable draggable className={ style.top } onYMove={ onTopMove } onUp={ onUp }/>
)
export const BottomHandle: React.FC<Pick<HandlesProps, 'onBottomMove' | 'onUp'>> = ({ onBottomMove, onUp }) => (
  <Draggable draggable className={ style.bottom } onYMove={ onBottomMove } onUp={ onUp }/>
)


export const TopLeftHandle: React.FC<Pick<HandlesProps, 'onTopMove' | 'onLeftMove' | 'onUp'>> = ({
                                                                                                   onTopMove,
                                                                                                   onLeftMove,
                                                                                                   onUp
                                                                                                 }) => (
  <Draggable draggable className={ style.topLeft } onXMove={ onLeftMove } onYMove={ onTopMove } onUp={ onUp }/>
)
export const TopRightHandle: React.FC<Pick<HandlesProps, 'onTopMove' | 'onRightMove' | 'onUp'>> = ({
                                                                                                     onTopMove,
                                                                                                     onRightMove, onUp
                                                                                                   }) => (
  <Draggable draggable className={ style.topRight } onXMove={ onRightMove } onYMove={ onTopMove } onUp={ onUp }/>
)
export const BottomLeftHandle: React.FC<Pick<HandlesProps, 'onBottomMove' | 'onLeftMove' | 'onUp'>> = ({
                                                                                                         onBottomMove,
                                                                                                         onLeftMove,
                                                                                                         onUp
                                                                                                       }) => (
  <Draggable draggable className={ style.bottomLeft } onYMove={ onBottomMove } onXMove={ onLeftMove } onUp={ onUp }/>
)
export const BottomRightHandle: React.FC<Pick<HandlesProps, 'onBottomMove' | 'onRightMove' | 'onUp'>> = ({
                                                                                                           onBottomMove,
                                                                                                           onRightMove,
                                                                                                           onUp
                                                                                                         }) => (
  <Draggable draggable className={ style.bottomRight } onYMove={ onBottomMove } onXMove={ onRightMove } onUp={ onUp }/>
)