import React, { useEffect, useState } from "react";
import { FormBloc, Input } from "@/components/form";
import { IonButton, IonSpinner } from "@ionic/react";
import styles from "@/view/auth/auth.module.scss";
import { useGetCurrentUserQuery, usePatchUserMutation } from "@/service/user";
import { useToast } from "@/service/ui";
import { getErrorMessage } from "@/service/function.ts";

export const UpdateEmail: React.FC = () => {
  const { data: currentUser, refetch: refetchUser } = useGetCurrentUserQuery();
  const [ patchUser, {
    isLoading: isSubmitting,
    error: patchError,
    isSuccess: isPatchSuccessful
  } ] = usePatchUserMutation();

  const toast = useToast();

  const [ email, setEmail ] = useState<string>(currentUser?.email ?? '');
  const [ errors, setErrors ] = useState<{email?: string[]}>({});

  useEffect(() => {
    setEmail(currentUser?.email ?? '')
  }, [currentUser]);

  useEffect(() => {
    if (patchError) {
      const e = getErrorMessage(patchError);
      if (!e) return;
      try {
        toast.presentError(e)
        setErrors(JSON.parse(e))
      }
      catch { /* empty */ }
    }
  }, [ patchError ]);

  useEffect(() => {
    if (isPatchSuccessful) {
      toast.presentSuccess('You email have been changed')
      refetchUser()
    }
  }, [ isPatchSuccessful ]);

  function submit() {
    setErrors({})
    patchUser({ email })
  }

  return <FormBloc label='Update email'>
    <Input value={ email }
           onChange={ e => setEmail(e.target.value) }
           error={ errors?.email?.join(' ') }
           placeholder="email"
           label="Email"
           type="email"
           autoComplete="email"/>

    <IonButton className={ styles.submit }
               disabled={ !email || isSubmitting }
               onClick={ submit }>
      Update
      { isSubmitting && <IonSpinner slot='end'/> }
    </IonButton>
  </FormBloc>
}