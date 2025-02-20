import React, { Fragment, useEffect, useState } from "react";
import styles from './auth.module.scss';
import { Footer, Header } from "@/components/layout";
import { Input } from "@/components/form";
import { useAppSelector } from "@/service/app.ts";
import { selectIsConnected, useLoginMutation } from "@/service/auth";
import { IonButton } from "@ionic/react";
import { useHistory, useLocation } from "react-router-dom";
import { getErrorMessage } from "@/service/function.ts";
import { Button, Link } from "@/components/ui";
import { useToast } from "@/service/ui";
import { useGetCurrentUserQuery } from "@/service/user";

export const Login: React.FC = () => {

  // State
  const isConnected = useAppSelector(selectIsConnected);
  const [ username, setUsername ] = useState<string>('');
  const [ password, setPassword ] = useState<string>('');
  const [ errors, setErrors ] = useState<{ global?: string, username?: string, password?: string }>({});

  // Service
  const history = useHistory();
  const location = useLocation<any>();
  const { from } = location.state || { from: { pathname: '/annotation-campaign' } };
  const [ login, { isLoading, error: loginError } ] = useLoginMutation();
  const toast = useToast()
  const { refetch } = useGetCurrentUserQuery()

  useEffect(() => {
    return () => {
      toast.dismiss()
    }
  }, []);

  useEffect(() => {
    if (loginError) toast.presentError(loginError);
  }, [ loginError ]);

  useEffect(() => {
    if (isConnected) history.replace(from);
  }, [ isConnected ]);

  const submit = async () => {
    setErrors({})
    if (!username) setErrors({ username: "This field is required." })
    if (!password) setErrors(prev => ({ ...prev, password: "This field is required." }))
    if (!username || !password) return;

    await login({ username, password }).unwrap()
      .then(() => refetch().unwrap())
      .then(() => history.replace(from))
      .catch(error => setErrors({ global: getErrorMessage(error) }));
  }

  function goHome() {
    history.push('/');
  }

  return <div className={ styles.page }>
    <Header buttons={ <Fragment>
      <Button color='dark' size='large' fill='clear' onClick={ goHome }>Home</Button>
      <Link href='/' size='large'>OSmOSE</Link>
    </Fragment> }/>
    <div className={ styles.content }>
      <h2>Login</h2>

      <div className={ styles.inputs }>
        <Input id="loginInput"
               className="form-control"
               value={ username }
               onChange={ (e) => setUsername(e.target.value) }
               error={ errors.username }
               placeholder="username" label="Username" autoComplete="username"/>
        <Input id="passwordInput"
               className="form-control"
               value={ password }
               onChange={ e => setPassword(e.target.value) }
               error={ errors.password }
               placeholder="password"
               label="Password"
               type="password"
               autoComplete="current-password"/>
      </div>
      <div className={ styles.buttons }>

        <Button color='dark' fill='clear' onClick={ goHome }>Back to Home</Button>

        <IonButton color='primary' onClick={ submit }
                   disabled={ isLoading }>
          Login
        </IonButton>
      </div>
    </div>
    <Footer/>
  </div>
}