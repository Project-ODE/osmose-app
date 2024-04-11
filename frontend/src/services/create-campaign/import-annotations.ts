import { useAppDispatch, useAppSelector } from "@/slices/app.ts";
import { CSVDetectorItem } from "@/types/csv-import-annotations.ts";
import { importAnnotationsActions, ImportAnnotationsErrors } from "@/slices/create-campaign/import-annotations.ts";
import { ACCEPT_CSV_MIME_TYPE, ACCEPT_CSV_SEPARATOR, IMPORT_ANNOTATIONS_COLUMNS } from "@/consts/csv.ts";
import { formatCSV } from "@/services/utils/format.tsx";
import { createCampaignActions } from "@/slices/create-campaign";
import { useEffect } from "react";

export const useImportAnnotations = () => {
  const state = useAppSelector(state => state.createCampaignForm.importAnnotations)
  const datasetName = useAppSelector(state => state.createCampaignForm.global.dataset?.name)
  const dispatch = useAppDispatch()

  useEffect(() => {
    checkErrors();
  }, [state.rows])

  function checkErrors() {
    if (state.status === 'empty') return;

    if (state.rows.length < 1) {
      dispatch(importAnnotationsActions.setErrors(['unrecognised file']));
      dispatch(importAnnotationsActions.setStatus('errors'));
      return;
    }

    const errors: Array<ImportAnnotationsErrors> = [];
    if (state.rows.find(r => r.dataset !== datasetName))
      errors.push('contains unrecognized dataset');

    if ([...new Set(state.rows.map(r => r.confidence_indicator_max_level))].filter(n => n !== undefined).length > 1)
      errors.push('inconsistent max confidence')

    dispatch(importAnnotationsActions.setErrors(errors));
    if (errors.length < 1)
      dispatch(importAnnotationsActions.setStatus('edit-detectors'))
    else
      dispatch(importAnnotationsActions.setStatus('errors'));
  }

  function getDistinctDetectors() {
    const detectors: Array<CSVDetectorItem & { display_name: string }> = [];
    for (const row of state.rows) {
      if (detectors.find(d => d.initialName === row.detector_item.initialName)) continue;
      detectors.push({
        ...row.detector_item,
        display_name: getDisplayNameForDetector(row.detector_item)
      });
    }
    return detectors;
  }

  return {
    get distinctDatasets() {
      return [...new Set(state.rows.map(d => d.dataset).filter(d => !!d))];
    },
    get distinctMaxConfidence() {
      // Get distinct max confidence indicators in given CSV and their occurrences
      const itemsMax = state.rows.map(d => d.confidence_indicator_max_level);
      const allMax = [...new Set(itemsMax)].filter(n => n !== undefined) as Array<number>;
      return new Map(
        allMax.map(max => [
          max,
          itemsMax.reduce((a: number, b) => a + (b === max ? 1 : 0), 0)
        ])
      )
    },
    get distinctDetectors() {
      return getDistinctDetectors()
    },
    get distinctLabels() {
      return [...new Set(state.rows.map(d => d.annotation).filter(d => !!d))]
    },
    get distinctConfidenceIndicators(): Array<[string, number]> {
      const distinctLevels = [...new Set(state.rows.map(d => d.confidence_indicator_level).filter(d => d != undefined))];
      return distinctLevels.map(l => [
        state.rows.find(r => r.confidence_indicator_level === l)!.confidence_indicator_label as string,
        l as number,
      ])
    },
    get results() {
      return state.rows.map(i => ({
        is_box: i.is_box,
        confidence: i.confidence_indicator_label,
        label: i.annotation,
        min_time: i.start_time,
        max_time: i.end_time,
        min_frequency: i.start_frequency,
        max_frequency: i.end_frequency,
        dataset_file: i.filename,
        dataset: i.dataset,
        detector: getDisplayNameForDetector(i.detector_item),
        detector_config: i.detector_item.existingConfiguration?.configuration ?? i.detector_item.editConfiguration!
      })).filter(i => !!i.label)
    },
    loadFile: async (file: File) => {
      dispatch(importAnnotationsActions.setStatus('loading'));
      dispatch(importAnnotationsActions.setFilename(file.name));

      if (!ACCEPT_CSV_MIME_TYPE.includes(file.type)) {
        console.warn('Load CSV', 'Unsupported MIME type:', file.type);
        dispatch(importAnnotationsActions.setErrors(['unrecognised file']))
        dispatch(importAnnotationsActions.setStatus('errors'));
        return;
      }

      const reader = new FileReader();
      reader.readAsText(file, 'UTF-8');

      reader.onerror = () => {
        console.warn('Load CSV', 'Reading error');
        dispatch(importAnnotationsActions.setErrors(['unrecognised file']))
        dispatch(importAnnotationsActions.setStatus('errors'));
      }

      reader.onload = (event) => {
        const result = event.target?.result;
        if (!result || typeof result !== 'string') {
          console.warn('Load CSV', 'Unsupported read data', result);
          dispatch(importAnnotationsActions.setErrors(['unrecognised file']))
          dispatch(importAnnotationsActions.setStatus('errors'));
          return;
        }

        try {
          const data = formatCSV(
            result,
            ACCEPT_CSV_SEPARATOR,
            IMPORT_ANNOTATIONS_COLUMNS
          );
          if (!data) {
            console.warn('Load CSV', 'Empty formatted data');
            dispatch(importAnnotationsActions.setErrors(['unrecognised file']))
            dispatch(importAnnotationsActions.setStatus('errors'));
            return;
          }

          dispatch(importAnnotationsActions.setRows(
            data.map(d => {
              const confidenceLevel = d.confidence_indicator_level ? d.confidence_indicator_level.split('/') : d.confidence_indicator_level;
              return {
                ...d,
                start_time: +d.start_time,
                end_time: +d.end_time,
                start_frequency: +d.start_frequency,
                end_frequency: +d.end_frequency,
                detector: d.annotator,
                detector_item: {
                  initialName: d.annotator,
                  selected: false,
                },
                is_box: !!+d.is_box,
                confidence_indicator_level: confidenceLevel?.length > 0 ? +confidenceLevel[0] : undefined,
                confidence_indicator_max_level: confidenceLevel?.length > 1 ? +confidenceLevel[1] : undefined,
              }
            })
          ));
        } catch (e) {
          console.warn('Load CSV', 'Other error', e);
          dispatch(importAnnotationsActions.setErrors(['unrecognised file']))
          dispatch(importAnnotationsActions.setStatus('errors'));
        }
      }
    },
    keepDatasets: (datasets: Array<string>) => {
      dispatch(importAnnotationsActions.setRows(
        state.rows
          // Keep only given datasets in the rows
          .filter(r => datasets.includes(r.dataset))
          // Replace all dataset names mentioned in the rows with the dataset name
          .map(r => ({ ...r, dataset: state.datasetName ?? '' }))
      ));
    },
    keepMaxConfidence: (max: number) => {
      dispatch(importAnnotationsActions.setRows(
        // Replace all max confidence levels mentioned in the rows with the given max level
        state.rows.map(r => ({
          ...r,
          confidence_indicator_max_level: r.confidence_indicator_max_level != undefined ? max : undefined
        }))
      ));
    },
    keepDetectors: (detectors: Array<CSVDetectorItem>) => {
      dispatch(importAnnotationsActions.setRows(
        state.rows
          // Keep only given detectors in the rows
          .filter(r => detectors.find(d => d.initialName === r.detector))
          //Complete detectors item information in rows
          .map(r => ({
            ...r,
            detector_item: detectors.find(d => d.initialName === r.detector) ?? r.detector_item
          }))
      ));
    },
    validate: () => {
      dispatch(createCampaignActions.setDetectors(getDistinctDetectors()))
      dispatch(importAnnotationsActions.setStatus('done'))
    }
  }
}

/**
 * @private
 * Get the name to display for the detector item
 * @param detector {CSVDetectorItem}
 * @return {string} Name to display
 */
function getDisplayNameForDetector(detector: CSVDetectorItem): string {
  return detector.existingDetector?.name ?? detector.editName ?? detector.initialName;
}
