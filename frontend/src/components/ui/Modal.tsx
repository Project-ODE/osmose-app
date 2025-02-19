import React, { ReactNode } from "react";
import styles from './ui.module.scss';
import { IoCloseOutline } from "react-icons/io5";

export const Modal: React.FC<{
  onClose?(): void;
  className?: string;
  children: React.ReactNode;
}> = ({ onClose, children, className }) => (
  <div role="dialog"
       className={ styles.modalBackdrop }
       onClick={ onClose }>
    <div className={ [ styles.modal, className ].join(' ') } onClick={ e => e.stopPropagation() }>
      { children }
    </div>
  </div>
)

export const ModalHeader: React.FC<{
  onClose?(): void;
  title: string;
}> = ({ onClose, title }) => (
  <div className={ styles.header }>
    <h3>{ title }</h3>
    <IoCloseOutline onClick={ onClose } className={ [ styles.icon, 'close' ].join(' ') } role='button'/>
    {/* 'close' classname is for playwright tests */ }
  </div>
)

export const ModalFooter: React.FC<{
  children: ReactNode;
  className?: string;
}> = ({ children, className }) => (
  <div className={ [ styles.footer, className ].join(' ') }>{ children }</div>
)