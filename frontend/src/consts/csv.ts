export const ACCEPT_CSV_MIME_TYPE = 'text/csv, application/vnd.ms-excel';
export const ACCEPT_CSV_SEPARATOR = ',';
export const IMPORT_ANNOTATIONS_COLUMNS = {
  required: [
    'dataset',
    'filename',
    'start_time',
    'end_time',
    'start_frequency',
    'end_frequency',
    'start_datetime',
    'end_datetime',
    'annotation',
    'annotator',
    'is_box',
  ],
  optional: [
    'confidence_indicator_label',
    'confidence_indicator_level'
  ]
}
