import { ChangeEvent, FC, FormEvent, useCallback, useEffect, useState } from 'react';
import { useHistory, useLocation } from "react-router-dom";
import { IonButton } from "@ionic/react";
import { useAuthService } from "@/services/auth";
import { buildErrorMessage } from "@/services/utils/format.tsx";
import { Input } from "@/components/form/inputs/input.tsx";
import { OsmoseBarComponent } from "@/view/global-components/osmose-bar/osmose-bar.component.tsx";


export const Login: FC = () => {
  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [error, setError] = useState<string | undefined>();
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const auth = useAuthService();
  const history = useHistory();
  const location = useLocation<any>();
  const { from } = location.state || { from: { pathname: '/' } };

  useEffect(() => {
    if (auth.isConnected()) history.replace(from);

    // Abort calls on view leave
    return () => auth.abort()
  }, []);

  useCallback(() => {
    if (auth.isConnected()) history.replace(from);
  }, [auth.bearer])

  const handleUsernameChange = (event: ChangeEvent<HTMLInputElement>) => {
    setUsername(event.currentTarget.value.trim());
  }

  const handlePasswordChange = (event: ChangeEvent<HTMLInputElement>) => {
    setPassword(event.currentTarget.value.trim());
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!username || !password) return setError('You must enter your login and password');
    if (['shom', 'chorus'].includes(username.toLowerCase())) return setError('403 Forbidden')
    setError(undefined);

    try {
      setIsSubmitting(true)
      await auth.login(username, password);
      history.replace(from);
    } catch (e: any) {
      setError(buildErrorMessage(e))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="container">
      <div className="row text-left h-100 main">
        <div className="col-sm-12 border rounded">
          <h1 className="text-center">Login</h1>
          { error && <p className="error-message">{ error }</p> }
          <form onSubmit={ handleSubmit }>
            <div className="form-group">
              <Input id="loginInput" className="form-control"
                     label={ "Login" }
                     value={ username }
                     autoComplete={ "username" }
                     onChange={ handleUsernameChange }/>
            </div>
            <div className="form-group">
              <Input id="passwordInput" className="form-control"
                     label={ "Password" }
                     type={ "password" }
                     value={ password }
                     autoComplete={ "current-password" }
                     onChange={ handlePasswordChange }/>
            </div>

            <IonButton color={ "primary" }
                       disabled={ isSubmitting }
                       type={ "submit" }>
              Submit
            </IonButton>
          </form>
        </div>
      </div>

      <OsmoseBarComponent/>
    </div>
  )
}

