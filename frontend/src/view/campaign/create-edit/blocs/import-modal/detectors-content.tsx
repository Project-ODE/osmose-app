import React, { Fragment, ReactNode, useEffect, useMemo, useState } from "react";
import { CheckboxChangeEventDetail, IonButton, IonCheckbox, IonIcon, IonNote, IonSpinner } from "@ionic/react";
import { alertOutline } from "ionicons/icons";
import { useAppDispatch, useAppSelector } from '@/service/app';
import { FormBloc, Select } from "@/components/form";
import { Detector, useListDetectorQuery } from '@/service/campaign/detector';
import { useToast } from "@/service/ui";
import { DetectorSelection, setDetectors as saveDetectors } from '@/service/campaign';

interface Props {
  cancelButton: ReactNode;
}

export const DetectorsContent: React.FC<Props> = ({
                                                    cancelButton
                                                  }) => {
  const [ selectedDetectors, setSelectedDetectors ] = useState<string[]>([]);
  const [ detectorsMap, setDetectorsMap ] = useState<Map<string, Detector>>(new Map());
  const canValidate = useMemo(() => selectedDetectors.length > 0, [ selectedDetectors ]);

  const { data: allDetectors, error: detectorListError } = useListDetectorQuery();
  const toast = useToast();

  // Form data
  const {
    draftCampaign,
    resultImport,
  } = useAppSelector(state => state.campaign);
  const dispatch = useAppDispatch();

  useEffect(() => {
    if (detectorListError) toast.presentError(detectorListError);
  }, [ detectorListError ])

  const availableDetectors: string[] | undefined = useMemo(() => {
    const data = resultImport.fileData;
    if (!data) return;
    const filterDatasets = resultImport.filterDatasets ?? Object.keys(data.detectorsForDatasets);
    const availableEntries = filterDatasets.flatMap(d => data.detectorsForDatasets[d])
    return [ ...new Set(availableEntries) ]
  }, [])

  useEffect(() => {
    if (!availableDetectors || !allDetectors) return;
    const knownDetectors: [ string, Detector ][] = availableDetectors
      .map(d => [ d, allDetectors.find(k => k.name === d) ])
      .filter(([ _, d ]) => !!d) as [ string, Detector ][]
    setDetectorsMap(new Map(knownDetectors))
    setSelectedDetectors(knownDetectors.map(([ d ]) => d))
  }, [ allDetectors, availableDetectors ]);

  const _save = () => {
    const entries: DetectorSelection[] = selectedDetectors.map((detector) => ({
      initialName: detector,
      knownDetector: detectorsMap.get(detector),
      isNew: !detectorsMap.has(detector),
    }))
    dispatch(saveDetectors(entries))
  }

  function setIsDetectorSelected(state: boolean, detector: string) {
    if (state) {
      setSelectedDetectors(prevState => {
        if (prevState.includes(detector)) return prevState;
        return [ ...prevState, detector ]
      })
    } else {
      setSelectedDetectors(prev => prev.filter(d => d !== detector))
    }
  }

  function setDetectors(detector: string, knownDetector?: Detector) {
    setDetectorsMap(prevState => {
      if (knownDetector) prevState.set(detector, knownDetector);
      else prevState.delete(detector);
      return prevState;
    })
  }

  if (!allDetectors) return <IonSpinner/>
  return (
    <Fragment>
      <div id="content">
        <div className="basic-info">
          <p>File: <span className="bold">{ resultImport.fileData?.filename }</span></p>
          <p>Dataset: <span className="bold">{ draftCampaign.datasets![0] }</span></p>
        </div>

        <FormBloc label="Detectors from CSV">
          { availableDetectors?.map(d => (
            <DetectorEntry csvDetector={ d }
                           allDetectors={ allDetectors }
                           key={ d }
                           isSelected={ selectedDetectors.includes(d) }
                           setIsSelected={ state => setIsDetectorSelected(state, d) }
                           detector={ detectorsMap.get(d) }
                           setDetector={ detector => setDetectors(d, detector) }/>)) }
        </FormBloc>
      </div>

      <div id="buttons">
        { cancelButton }

        <IonButton disabled={ !canValidate }
                   aria-disabled={ !canValidate }
                   onClick={ _save }>
          Confirm
        </IonButton>
      </div>
    </Fragment>
  )
}

interface DetectorEntryProps {
  allDetectors: Array<Detector>,
  csvDetector: string;
  isSelected: boolean;
  setIsSelected: (value: boolean) => void;
  detector?: Detector;
  setDetector: (detector?: Detector) => void;
}

const DetectorEntry: React.FC<DetectorEntryProps> = ({
                                                       allDetectors,
                                                       csvDetector,
                                                       isSelected, setIsSelected,
                                                       detector, setDetector
                                                     }) => {
  const doesExists = useMemo(() => allDetectors.some(d => d.name === csvDetector), [ allDetectors, csvDetector ])
  const [ isUpdated, setIsUpdated ] = useState<boolean>(false);

  const onChange = (e: CustomEvent<CheckboxChangeEventDetail>) => {
    setIsSelected(e.detail.checked);
    setIsSelected(e.detail.checked)
  }

  const onDetectorChange = (id: string | number | undefined) => {
    if (typeof id === 'undefined' || (typeof id === 'string' && isNaN(+id)) || (typeof id === 'number' && id === -1)) {
      setDetector(undefined);
    } else {
      setDetector(allDetectors.find(d => d.id === +id)!);
    }
    setIsSelected(true)
    setIsUpdated(true)
  }

  return (
    <div className={ `detector-entry ${ !doesExists && 'unknown' }` }>
      <IonCheckbox labelPlacement="end" justify="start"
                   color={ !doesExists && !isUpdated ? 'danger' : undefined }
                   checked={ isSelected }
                   disabled={ !doesExists && !isUpdated }
                   onIonChange={ onChange }/>
      { !doesExists && !isUpdated && <IonIcon className="exclamation" icon={ alertOutline } color="danger"/> }

      { csvDetector }

      { doesExists && <IonNote color="medium">Already in database</IonNote> }

      { !doesExists && <div className="unknown">
          <IonNote color={ !doesExists && !isUpdated ? 'danger' : "medium" }>Unknown detector</IonNote>

          <Select value={ detector?.id }
                  onValueSelected={ onDetectorChange }
                  options={ allDetectors.map(d => ({ value: d.id, label: d.name })) }
                  optionsContainer="popover"
                  noneLabel={ `Create "${ csvDetector }"` }
                  placeholder="Assign to detector"/>
      </div> }

      <div className="line"/>
    </div>
  )
}
