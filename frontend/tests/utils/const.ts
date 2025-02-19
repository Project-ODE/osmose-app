export const ESSENTIAL = { tag: '@essential' };

export const URL = {
  OSmOSE: '/',
  doc: '/doc/',
  admin: '/backend/admin'
}

export const API_URL = {
  token: '/api/token/',
  user: {
    list: /api\/user\/?/g,
    self: /api\/user\/self\/?/g
  },
  campaign: {
    list: /\/api\/annotation-campaign\/?/g,
    create: '/api/annotation-campaign/',
    detail: /\/api\/annotation-campaign\/-?\d\/?/g,
    archive: /\/api\/annotation-campaign\/-?\d\/archive\/?/g,
    report: /\/api\/annotation-campaign\/-?\d\/report/g,
    reportStatus: /\/api\/annotation-campaign\/-?\d\/report-status/g
  },
  dataset: {
    list: /\/api\/dataset\/?/g,
    detail: /\/api\/dataset\/-?\d\/?/g,
    list_to_import: /\/api\/dataset\/list_to_import\/?/g,
    import: /\/api\/dataset\/datawork_import\/?/g,
  },
  fileRanges: {
    list: /\/api\/annotation-file-range\/?/g,
    file: /\/api\/annotation-file-range\/campaign\/-?\d\/files/g,
    post: /\/api\/annotation-file-range\/campaign\/-?\d\//g,
  },
  spectrogram: {
    list: /\/api\/spectrogram-configuration\/?/g,
    export: /\/api\/spectrogram-configuration\/export\/?/g,
  },
  audio: {
    list: /\/api\/audio-metadata\/?/g,
    export: /\/api\/audio-metadata\/export\/?/g,
  },
  label: {
    list: /\/api\/label-set\/?/g,
    detail: /\/api\/label-set\/-?\d\/?/g,
  },
  confidence: {
    list: /\/api\/confidence-indicator\/?/g,
    detail: /\/api\/confidence-indicator\/-?\d\/?/g,
  },
  annotator: /api\/annotator\/campaign\/-?\d\/file\/-?\d/g,
  result: {
    import: /api\/annotation-result\/campaign\/-?\d\/import\//g
  },
  detector: {
    list: /api\/detector/g
  }
}
