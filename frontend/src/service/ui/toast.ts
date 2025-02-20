import { useIonToast } from "@ionic/react";
import { closeCircle } from "ionicons/icons";
import { ToastButton } from "@ionic/core/dist/types/components/toast/toast-interface";
import { getErrorMessage } from "@/service/function.ts";

export const useToast = () => {
  const [ present, dismiss ] = useIonToast();

  function presentError(e: any, canForce: boolean = false): Promise<boolean> {
    return new Promise<boolean>((resolve) => {
      const buttons: Array<ToastButton> = [];
      if (canForce) {
        buttons.push({
          text: 'Create anyway',
          handler: () => resolve(true)
        })
      }
      buttons.push({
        icon: closeCircle, handler: () => {
          resolve(false)
          dismiss();
        }
      });
      present({
        message: getErrorMessage(e),
        color: 'danger',
        buttons,
      }).catch(console.warn);
    });
  }

  function presentSuccess(e: any): Promise<boolean> {
    return new Promise<boolean>((resolve) => {
      present({
        message: getErrorMessage(e),
        color: 'success',
        duration: 3_000,
        buttons: [
          {
            icon: closeCircle, handler: () => {
              resolve(false)
              dismiss();
            }
          }
        ]
      }).catch(console.warn);
    });
  }

  return {
    presentError,
    presentSuccess,
    dismiss: () => {
      dismiss().catch(console.warn)
    }
  }
}
