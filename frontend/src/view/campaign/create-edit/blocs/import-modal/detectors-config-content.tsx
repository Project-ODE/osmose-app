import React, { ChangeEvent, Fragment, ReactNode, useEffect, useMemo, useState } from "react";
import { IonButton, IonIcon } from "@ionic/react";
import { checkmarkOutline } from "ionicons/icons";
import { useAppDispatch, useAppSelector } from '@/service/app';
import { FormBloc, Select, Textarea } from "@/components/form";
import { DetectorConfiguration } from '@/service/campaign/detector';
import { DetectorSelection, setDetectors as saveDetectors } from '@/service/campaign';

interface Props {
  save: () => void;
  cancelButton: ReactNode;
}

export const DetectorsConfigContent: React.FC<Props> = ({
                                                          save,
                                                          cancelButton
                                                        }) => {
  const [ detectors, setDetectors ] = useState<Array<DetectorSelection>>([]);
  const canValidate = useMemo<boolean>(() => detectors.every(v => {
    if (v.isNewConfiguration === undefined) return false;
    if (v.isNewConfiguration) return !!v.newConfiguration && v.newConfiguration.trim().length > 0;
    return !!v.knownConfiguration;
  }), [ detectors ]);

  // Form data
  const {
    draftCampaign,
    resultImport,
  } = useAppSelector(state => state.campaign);
  const dispatch = useAppDispatch();

  useEffect(() => {
    if (resultImport.detectors) setDetectors(resultImport.detectors);
  }, [ resultImport.detectors ]);

  const _save = () => {
    dispatch(saveDetectors(detectors))
    save();
  }

  const onConfigurationUpdate = (detectorInitialName: string, configuration: DetectorConfiguration | string | null) => {
    setDetectors(previous => previous.map(selection => {
      if (selection.initialName !== detectorInitialName) return selection;
      const isNewConfiguration = configuration === null || typeof configuration === "string"
      return {
        ...selection,
        isNewConfiguration,
        knownConfiguration: isNewConfiguration ? undefined : configuration as any,
        newConfiguration: isNewConfiguration ? (configuration as any) ?? undefined : undefined
      }
    }))
  }

  return (
    <Fragment>
      <div id="content">
        <div className="basic-info">
          <p>File: <span className="bold">{ resultImport.fileData?.filename }</span></p>
          <p>Dataset: <span className="bold">{ draftCampaign.datasets![0] }</span></p>
          <p>Detectors: <span
            className="bold">{ resultImport.detectors!.map(d => d.knownDetector?.name ?? d.initialName).join(', ') }</span>
          </p>
        </div>


        <FormBloc label="Detectors configurations">
          { resultImport.detectors!.map(selection => (
            <DetectorConfigEntry key={ selection.initialName }
                                 detector={ selection }
                                 onConfigurationUpdate={ config => onConfigurationUpdate(selection.initialName, config) }/>)) }
        </FormBloc>
      </div>

      <div id="buttons">
        { cancelButton }

        <IonButton disabled={ !canValidate }
                   aria-disabled={ !canValidate }
                   onClick={ _save }>
          Import
          <IonIcon icon={ checkmarkOutline } slot="end"/>
        </IonButton>
      </div>
    </Fragment>
  )
}

interface DetectorEntryProps {
  detector: DetectorSelection;
  onConfigurationUpdate: (detector: DetectorConfiguration | string | null) => void;
}

const DetectorConfigEntry: React.FC<DetectorEntryProps> = ({
                                                             detector,
                                                             onConfigurationUpdate
                                                           }) => {
  const [ isUpdated, setIsUpdated ] = useState<boolean>(false);
  const [ selectedConfiguration, setSelectedConfiguration ] = useState<DetectorConfiguration | null | undefined>();
  const [ configurationText, setConfigurationText ] = useState<string | undefined>();

  const onConfigurationSelected = (id: string | number | undefined) => {
    if (typeof id === 'undefined' || (typeof id === 'string' && isNaN(+id)) || (typeof id === 'number' && id === -1)) {
      onConfigurationUpdate(null);
      setSelectedConfiguration(null);
    } else {
      const configuration = detector.knownDetector!.configurations.find(c => c.id === +id)!;
      onConfigurationUpdate(configuration);
      setSelectedConfiguration(configuration);
    }
    setIsUpdated(true)
  }

  const onConfigurationTextUpdated = (e: ChangeEvent<HTMLTextAreaElement>) => {
    setConfigurationText(e.target.value);
    onConfigurationUpdate(e.target.value);
  }

  return (
    <div className={ `detector-config-entry ${ !detector.knownDetector && 'unknown' }` }>

      <p><strong>{ detector.initialName }</strong> configuration</p>

      <Select className="config-select"
              value={ selectedConfiguration?.id }
              onValueSelected={ onConfigurationSelected }
              options={ detector.knownDetector?.configurations.map((c: DetectorConfiguration) => ({
                value: c.id,
                label: c.configuration
              })) ?? [] }
              optionsContainer="popover"
              noneLabel="Create new" noneFirst
              placeholder="Select configuration"/>

      <Textarea placeholder="Enter new configuration"
                hidden={ !isUpdated }
                disabled={ !detector.isNew && (!isUpdated || !!selectedConfiguration) }
                value={ selectedConfiguration?.configuration ?? configurationText }
                onChange={ onConfigurationTextUpdated }/>

      <div className="line"/>
    </div>
  )
}
