import React, { useEffect } from "react";
import { useGetCurrentUserQuery } from "@/service/user";
import styles from './auth.module.scss'
import { FadedText, WarningText } from "@/components/ui";
import { IonSpinner } from "@ionic/react";
import { getErrorMessage } from "@/service/function.ts";
import { FormBloc } from "@/components/form";
import { useToast } from "@/service/ui";
import { UpdatePassword } from "@/view/auth/account-form/UpdatePassword.tsx";
import { UpdateEmail } from "@/view/auth/account-form/UpdateEmail.tsx";

export const Account: React.FC = () => {
  const { data: currentUser, isLoading, error } = useGetCurrentUserQuery();

  const toast = useToast();

  useEffect(() => {
    return () => {
      toast.dismiss()
    }
  }, []);

  return (
    <div className={ styles.loggedInPage }>
      <h2>Account</h2>

      { isLoading && <IonSpinner/> }
      { error && <WarningText>{ getErrorMessage(error) }</WarningText> }

      { currentUser && <div className={ styles.content }>
          <FormBloc>
              <div>
                  <FadedText>Username</FadedText>
                  <p>{ currentUser.username }</p>
              </div>
          </FormBloc>

          <UpdateEmail/>

          <UpdatePassword/>
      </div> }
    </div>
  )
}