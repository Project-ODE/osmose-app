import React, { ReactNode } from 'react';
import { Footer, Navbar } from "@/components/layout";
import styles from './layout.module.scss';

export const AploseSkeleton: React.FC<{ children?: ReactNode }> = ({ children }) => (
  <div className={ styles.skeleton }>

    <Navbar className={ styles.navbar }/>

    <div className={ styles.content }>
      { children }
    </div>

    <Footer/>
  </div>
)
