import React, { ReactNode } from "react";

import './table.css'

interface TableProps {
  columns: number;
  children: ReactNode;
  isFirstColumnSticky?: boolean;
  className?: string;
  size?: 'small' | 'medium';
}

export const Table: React.FC<TableProps> = ({
                                              children,
                                              columns,
                                              className,
                                              isFirstColumnSticky,
                                              size = 'medium',
                                            }) => (
  <div
    className={ [ className, 'table-aplose', isFirstColumnSticky && 'first-column-sticky', `columns-${ columns }`, size ].join(' ') }
    style={ {
      "--content-columns": columns
    } as React.CSSProperties }>
    { children }
  </div>
)

interface CellProps {
  children?: ReactNode;
  isFirstColumn?: boolean;
  onClick?: () => void;
  className?: string;
  disabled?: boolean;
  topSticky?: boolean;
}

export const TableHead: React.FC<CellProps> = ({
                                                 children,
                                                 isFirstColumn,
                                                 onClick,
                                                 className,
                                                 disabled,
                                                 topSticky,
                                               }) => (
  <div className={ `table-head ${ isFirstColumn ? 'first' : '' } ${ disabled ? 'disabled' : '' } ${ className ?? '' }` }
       style={ {
         position: topSticky ? 'sticky' : undefined,
         top: topSticky ? '0' : undefined,
         backgroundColor: topSticky ? 'white' : undefined,
       } }
       onClick={ onClick }>
    { children }
  </div>
)

export const TableContent: React.FC<CellProps> = ({
                                                    children,
                                                    isFirstColumn,
                                                    onClick,
                                                    className,
                                                    disabled,
                                                  }) => (
  <div
    className={ `table-content ${ isFirstColumn ? 'first' : '' } ${ disabled ? 'disabled' : '' } ${ className ?? '' }` }
    onClick={ onClick }>
    { children }
  </div>
)


export const TableDivider: React.FC<{ className?: string }> = ({ className }) => <div
  className={ [ "divider", className ].join(' ') }/>
