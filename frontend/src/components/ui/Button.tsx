import React from "react";
import { IonButton } from "@ionic/react";
import { TooltipOverlay } from "@/components/ui/Tooltip.tsx";

type Props = {
  disabledExplanation?: string;
} & React.ComponentProps<typeof IonButton>

export const Button: React.FC<Props> = ({ disabledExplanation, disabled,  ...props }) => {

  if ( disabled && disabledExplanation) return <TooltipOverlay tooltipContent={ <p>{ disabledExplanation }</p> }>
    <IonButton disabled={ disabled } { ...props }/>
  </TooltipOverlay>

  return <IonButton disabled={ disabled } { ...props }/>
}