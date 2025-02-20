import {
  addPresenceResult,
  addResult,
  AnnotatorSlice,
  focusConfidence,
  focusLabel,
  focusResult,
  focusTask,
  invalidateResult,
  removeFocusComment,
  removePresence,
  removeResult,
  updateFocusComment,
  validateResult,
} from "./slice";
import { AnnotationResult, AnnotationResultBounds } from '@/service/campaign/result';
import { AnnotatorState } from '@/service/annotator/type.ts';
import { AnnotationComment } from '@/service/campaign/comment';

const mockState: AnnotatorState = {
  hasChanged: false,
  results: [
    {
      "id": 1,
      "label": "Mysticetes",
      "confidence_indicator": "not confident",
      "annotator": 1,
      "dataset_file": 1,
      "detector_configuration": null,
      type: 'Weak',
      "start_time": null,
      "end_time": null,
      "start_frequency": null,
      "end_frequency": null,
      acoustic_features: null,
      "comments": [
        {
          "id": 1568,
          "annotation_result": 1,
          "annotation_campaign": 1,
          "author": 1,
          "dataset_file": 1,
          "comment": "a comment : Mysticetes"
        }
      ],
      "validations": [ {
        is_valid: false,
        result: 1,
        annotator: 1,
        id: 1
      } ],
      "annotation_campaign": 1
    },
    {
      "id": 2,
      "label": "Mysticetes",
      "confidence_indicator": "not confident",
      "annotator": 1,
      "dataset_file": 1,
      "detector_configuration": null,
      type: 'Box',
      "start_time": 288.0,
      "end_time": 331.0,
      "start_frequency": 8179.0,
      "end_frequency": 11593.0,
      acoustic_features: null,
      "comments": [
        {
          "id": 1569,
          "annotation_result": 2,
          "annotation_campaign": 1,
          "author": 1,
          "dataset_file": 1,
          "comment": "a second comment : Mysticetes"
        }
      ],
      "validations": [],
      "annotation_campaign": 1
    }
  ],
  focusedResultID: undefined,

  labelColors: {
    Mysticetes: "#00b1b9",
    Odoncetes: "#a23b72",
    Boat: "#f18f01",
    Rain: "#c73e1d",
    Other: "#bb7e5d",
  },
  focusedLabel: undefined,

  focusedConfidenceLabel: "confident",

  focusedCommentID: 1,
  task_comments: [
    {
      "id": 1,
      "annotation_result": null,
      "annotation_campaign": 1,
      "author": 1,
      "dataset_file": 1,
      "comment": "a comment"
    }
  ],

  userPreferences: {
    audioSpeed: 1,
    spectrogramConfigurationid: 1,
    zoomLevel: -1
  },
  ui: {},
  audio: {
    time: 0,
    isPaused: true
  },
  sessionStart: Date.now()
}
const newPresence: string = "Boat";
const newBoxResult: AnnotationResultBounds = {
  type: 'Box',
  "start_time": 10.0,
  "end_time": 20.0,
  "start_frequency": 50.0,
  "end_frequency": 12000.0,
}


describe("Filled state - not focused result", () => {
  const previousState: AnnotatorState = { ...mockState, focusedLabel: 'Boat', focusedConfidenceLabel: 'not confident' };

  test("Should focus result", () => {
    const response = AnnotatorSlice.reducer(previousState, focusResult(mockState.results![0].id));
    const focusedResult = response.results?.find(r => r.id === response.focusedResultID);
    expect(focusedResult).toEqual(mockState.results![0]);
    expect(response.focusedLabel).toEqual(mockState.results![0].label);
    expect(response.focusedConfidenceLabel).toEqual(mockState.results![0].confidence_indicator);
    expect(response.focusedCommentID).toEqual(mockState.results![0].comments[0].id);
  })

  test("Should add result", () => {
    const response = AnnotatorSlice.reducer(previousState, addResult(newBoxResult));
    const expectedNewResult: AnnotationResult = {
      ...newBoxResult,
      id: 1,
      label: previousState.focusedLabel!,
      confidence_indicator: previousState.focusedConfidenceLabel ?? null,
      comments: [],
      validations: [],
      annotator: -1,
      annotation_campaign: -1,
      dataset_file: -1,
      detector_configuration: null,
      acoustic_features: null,
    }
    const focusedResult = response.results?.find(r => r.id === response.focusedResultID);
    expect(focusedResult).toEqual(expectedNewResult);
    expect(response.results).toContainEqual(expectedNewResult);
    expect(response.focusedLabel).toEqual(previousState.focusedLabel);
    expect(response.focusedConfidenceLabel).toEqual(previousState.focusedConfidenceLabel);
    expect(response.focusedCommentID).toEqual(undefined);
  })

  test("Should remove box result", () => {
    const response = AnnotatorSlice.reducer(previousState, removeResult(mockState.results![1].id));
    const focusedResult = response.results?.find(r => r.id === response.focusedResultID);
    expect(focusedResult).toEqual(mockState.results![0]);
    expect(response.results).not.toContainEqual(mockState.results![1]);
    expect(response.focusedLabel).toEqual(mockState.results![0].label);
    expect(response.focusedConfidenceLabel).toEqual(mockState.results![0].confidence_indicator);
    expect(response.focusedCommentID).toEqual(mockState.results![0].comments[0].id);
  })

  test("Should remove presence result", () => {
    const response = AnnotatorSlice.reducer(previousState, removeResult(mockState.results![0].id));
    expect(response.focusedResultID).toEqual(undefined);
    expect(response.results).toEqual([]);
    expect(response.focusedLabel).toEqual(undefined);
    expect(response.focusedConfidenceLabel).toEqual('confident');
    expect(response.focusedCommentID).toEqual(mockState.task_comments![0].id);
  })

  test("Should focus task", () => {
    const response = AnnotatorSlice.reducer(previousState, focusTask());
    expect(response.focusedResultID).toEqual(undefined);
    expect(response.results).toEqual(mockState.results);
    expect(response.focusedLabel).toEqual(undefined);
    expect(response.focusedConfidenceLabel).toEqual("confident");
    expect(response.focusedCommentID).toEqual(mockState.task_comments![0].id);
  })

  test("Should update focus comment", () => {
    const response = AnnotatorSlice.reducer(previousState, updateFocusComment("hello"));
    const expectedComment: AnnotationComment = {
      ...mockState.task_comments![0],
      comment: 'hello'
    }
    const focusedComment = response.task_comments?.find(c => c.id === response.focusedCommentID);
    expect(response.focusedResultID).toEqual(undefined);
    expect(focusedComment).toEqual(expectedComment);
    expect(response.task_comments).toEqual([ expectedComment ]);
  })

  test("Should remove focus comment", () => {
    const response = AnnotatorSlice.reducer(previousState, removeFocusComment());
    expect(response.focusedResultID).toEqual(undefined);
    expect(response.focusedCommentID).toEqual(undefined);
    expect(response.task_comments).toEqual([]);
  })

  test("Should add presence", () => {
    const response = AnnotatorSlice.reducer(previousState, addPresenceResult({ label: newPresence }));
    const expectedNewResult: AnnotationResult = {
      id: 1,
      type: 'Weak',
      start_frequency: null,
      start_time: null,
      end_frequency: null,
      end_time: null,
      label: newPresence,
      confidence_indicator: previousState.focusedConfidenceLabel ?? null,
      comments: [],
      validations: [],
      annotator: -1,
      annotation_campaign: -1,
      dataset_file: -1,
      detector_configuration: null,
      acoustic_features: null,
    }
    const focusedResult = response.results?.find(r => r.id === response.focusedResultID);
    expect(focusedResult).toEqual(expectedNewResult);
    expect(response.results).toContainEqual(expectedNewResult);
    expect(response.focusedLabel).toEqual(newPresence);
    expect(response.focusedConfidenceLabel).toEqual(previousState.focusedConfidenceLabel);
    expect(response.focusedCommentID).toEqual(undefined);
  })

  test("Should focus known presence", () => {
    const response = AnnotatorSlice.reducer(previousState, focusLabel("Mysticete"));
    expect(response).toEqual({
      ...previousState,
      focusedLabel: "Mysticete"
    })
  })

  test("Should remove presence", () => {
    const response = AnnotatorSlice.reducer(previousState, removePresence("Mysticetes"));
    expect(response.focusedResultID).toEqual(undefined);
    expect(response.results).toEqual([]);
    expect(response.focusedLabel).toEqual(undefined);
    expect(response.focusedConfidenceLabel).toEqual('confident');
    expect(response.focusedCommentID).toEqual(mockState.task_comments![0].id);
  })

  test("Should validate presence", () => {
    const response = AnnotatorSlice.reducer(previousState, validateResult(mockState.results![0].id));
    const expectedResult: AnnotationResult = {
      ...mockState.results![0],
      validations: [ {
        ...mockState.results![0].validations[0],
        is_valid: true,
      } ]
    }
    const focusedResult = response.results?.find(r => r.id === response.focusedResultID);
    expect(response.focusedResultID).toEqual(mockState.results![0].id);
    expect(focusedResult?.validations[0].is_valid).toEqual(true);
    expect(response.results).toContainEqual(expectedResult);
    expect(response.focusedLabel).toEqual(mockState.results![0].label);
    expect(response.focusedConfidenceLabel).toEqual(previousState.focusedConfidenceLabel);
    expect(response.focusedCommentID).toEqual(mockState.results![0].comments[0].id);
  })

  test("Should invalidate presence", () => {
    const response = AnnotatorSlice.reducer(previousState, invalidateResult(mockState.results![0].id));
    const expectedResult: AnnotationResult = {
      ...mockState.results![0],
      validations: [ {
        ...mockState.results![0].validations[0],
        is_valid: false,
      } ]
    }
    const expectedBoxResult: AnnotationResult = {
      ...mockState.results![1],
      validations: [ {
        is_valid: false,
        result: mockState.results![1].id,
        id: 1,
        annotator: 1,
      } ]
    }
    const focusedResult = response.results?.find(r => r.id === response.focusedResultID);
    expect(focusedResult).toEqual(expectedResult);
    expect(response.focusedResultID).toEqual(mockState.results![0].id);
    expect(response.results).toContainEqual(expectedResult);
    expect(response.results).toContainEqual(expectedBoxResult);
    expect(response.focusedLabel).toEqual(mockState.results![0].label);
    expect(response.focusedConfidenceLabel).toEqual(previousState.focusedConfidenceLabel);
    expect(response.focusedCommentID).toEqual(mockState.results![0].comments[0].id);
  })

  test("Should validate box", () => {
    const response = AnnotatorSlice.reducer(previousState, validateResult(mockState.results![1].id));
    const expectedResult: AnnotationResult = {
      ...mockState.results![1],
      validations: [ {
        is_valid: true,
        result: mockState.results![1].id,
        id: 1,
        annotator: 1,
      } ]
    }
    const expectedPresenceResult: AnnotationResult = {
      ...mockState.results![0],
      validations: [ {
        ...mockState.results![0].validations[0],
        is_valid: true,
      } ]
    }
    const focusedResult = response.results?.find(r => r.id === response.focusedResultID);
    expect(focusedResult).toEqual(expectedResult);
    expect(response.results).toContainEqual(expectedResult);
    expect(response.results).toContainEqual(expectedPresenceResult);
    expect(response.focusedLabel).toEqual(mockState.results![1].label);
    expect(response.focusedConfidenceLabel).toEqual(previousState.focusedConfidenceLabel);
    expect(response.focusedCommentID).toEqual(mockState.results![1].comments[0].id);
  })

  test("Should invalidate box", () => {
    const response = AnnotatorSlice.reducer(previousState, invalidateResult(mockState.results![1].id));
    const expectedResult: AnnotationResult = {
      ...mockState.results![1],
      validations: [ {
        is_valid: false,
        result: mockState.results![1].id,
        id: 1,
        annotator: 1,
      } ]
    }
    const focusedResult = response.results?.find(r => r.id === response.focusedResultID);
    expect(focusedResult).toEqual(expectedResult);
    expect(response.results).toContainEqual(expectedResult);
    expect(response.focusedLabel).toEqual(mockState.results![1].label);
    expect(response.focusedConfidenceLabel).toEqual(previousState.focusedConfidenceLabel);
    expect(response.focusedCommentID).toEqual(mockState.results![1].comments[0].id);
  })

  test("Should update confidence", () => {
    const response = AnnotatorSlice.reducer(previousState, focusConfidence("confident"));
    expect(response.focusedResultID).toEqual(previousState.focusedResultID);
    expect(response.results).toEqual(previousState.results);
    expect(response.focusedLabel).toEqual(previousState.focusedLabel);
    expect(response.focusedConfidenceLabel).toEqual("confident");
    expect(response.focusedCommentID).toEqual(previousState.focusedCommentID);
  })
})

describe("Filled state - presence focused result", () => {
  const previousState: AnnotatorState = {
    ...mockState,
    focusedResultID: mockState.results![0].id,
    focusedLabel: mockState.results![0].label,
    focusedConfidenceLabel: mockState.results![0].confidence_indicator!,
    focusedCommentID: mockState.results![0].comments[0].id
  };

  test("Should focus result", () => {
    const response = AnnotatorSlice.reducer(previousState, focusResult(mockState.results![1].id));
    expect(response.focusedResultID).toEqual(mockState.results![1].id);
    expect(response.focusedLabel).toEqual(mockState.results![1].label);
    expect(response.focusedConfidenceLabel).toEqual(mockState.results![1].confidence_indicator);
    expect(response.focusedCommentID).toEqual(mockState.results![1].comments[0].id);
  })

  test("Should update focus comment", () => {
    const response = AnnotatorSlice.reducer(previousState, updateFocusComment("hello"));
    const expectedComment: AnnotationComment = {
      ...mockState.results![0].comments[0],
      comment: 'hello'
    }
    const expectedResult: AnnotationResult = {
      ...mockState.results![0],
      comments: [ expectedComment ]
    }
    const focusedResult = response.results?.find(r => r.id === response.focusedResultID);
    const focusedComment = focusedResult?.comments.find(c => c.id === response.focusedCommentID);
    expect(focusedComment).toEqual(expectedComment);
    expect(focusedResult).toEqual(expectedResult);
    expect(response.results).toContainEqual(expectedResult);
    expect(response.task_comments).toEqual(previousState.task_comments);
  })

  test("Should remove focus comment", () => {
    const response = AnnotatorSlice.reducer(previousState, removeFocusComment());
    const expectedResult: AnnotationResult = {
      ...mockState.results![0],
      comments: []
    }
    const focusedResult = response.results?.find(r => r.id === response.focusedResultID);
    expect(response.focusedCommentID).toEqual(undefined);
    expect(focusedResult).toEqual(expectedResult);
    expect(response.results).toContainEqual(expectedResult);
    expect(response.task_comments).toEqual(previousState.task_comments);
  })

  test("Should focus label", () => {
    const response = AnnotatorSlice.reducer(previousState, focusLabel("Boat"));
    expect(response.focusedResultID).toEqual(undefined);
    expect(response.results).toEqual(mockState.results);
    expect(response.focusedLabel).toEqual(undefined);
    expect(response.focusedConfidenceLabel).toEqual("confident");
    expect(response.focusedCommentID).toEqual(mockState.task_comments![0].id);
  })

  test("Should update confidence", () => {
    const response = AnnotatorSlice.reducer(previousState, focusConfidence("confident"));
    const expectedResult: AnnotationResult = {
      ...previousState.results!.find(r => r.id === previousState.focusedResultID)!,
      confidence_indicator: "confident"
    }
    const focusedResult = response.results?.find(r => r.id === response.focusedResultID);
    expect(focusedResult).toEqual(expectedResult);
    expect(response.results).toContainEqual(expectedResult);
    expect(response.focusedLabel).toEqual(previousState.focusedLabel);
    expect(response.focusedConfidenceLabel).toEqual("confident");
    expect(response.focusedCommentID).toEqual(previousState.focusedCommentID);
  })

})

describe("Filled state - box focused result", () => {
  const previousState: AnnotatorState = {
    ...mockState,
    focusedResultID: mockState.results![1].id,
    focusedLabel: mockState.results![1].label,
    focusedConfidenceLabel: mockState.results![1].confidence_indicator!,
    focusedCommentID: mockState.results![1].comments[0].id
  };

  test("Should focus result", () => {
    const response = AnnotatorSlice.reducer(previousState, focusResult(mockState.results![0].id));
    expect(response.focusedResultID).toEqual(mockState.results![0].id);
    expect(response.focusedLabel).toEqual(mockState.results![0].label);
    expect(response.focusedConfidenceLabel).toEqual(mockState.results![0].confidence_indicator);
    expect(response.focusedCommentID).toEqual(mockState.results![0].comments[0].id);
  })

  test("Should update focus comment", () => {
    const response = AnnotatorSlice.reducer(previousState, updateFocusComment("hello"));
    const expectedComment: AnnotationComment = {
      ...mockState.results![1].comments[0],
      comment: 'hello'
    }
    const expectedResult: AnnotationResult = {
      ...mockState.results![1],
      comments: [ expectedComment ]
    }
    const focusedResult = response.results?.find(r => r.id === response.focusedResultID);
    const focusedComment = focusedResult?.comments.find(c => c.id === response.focusedCommentID);
    expect(focusedComment).toEqual(expectedComment);
    expect(focusedResult).toEqual(expectedResult);
    expect(response.results).toContainEqual(expectedResult);
    expect(response.task_comments).toEqual(previousState.task_comments);
  })

  test("Should remove focus comment", () => {
    const response = AnnotatorSlice.reducer(previousState, removeFocusComment());
    const expectedResult: AnnotationResult = {
      ...mockState.results![1],
      comments: []
    }
    const focusedResult = response.results?.find(r => r.id === response.focusedResultID);
    expect(response.focusedCommentID).toEqual(undefined);
    expect(focusedResult).toEqual(expectedResult);
    expect(response.results).toContainEqual(expectedResult);
    expect(response.task_comments).toEqual(previousState.task_comments);
  })

  test("Should focus label", () => {
    const response = AnnotatorSlice.reducer(previousState, focusLabel("Boat"));
    const expectedResult: AnnotationResult = {
      ...previousState.results!.find(r => r.id === previousState.focusedResultID)!,
      label: 'Boat'
    }
    const focusedResult = response.results?.find(r => r.id === response.focusedResultID);
    expect(focusedResult).toEqual(expectedResult);
    expect(response.results).toContainEqual(expectedResult);
    expect(response.focusedLabel).toEqual("Boat");
    expect(response.focusedConfidenceLabel).toEqual("not confident");
    expect(response.focusedCommentID).toEqual(expectedResult.comments[0].id);
  })

  test("Should update confidence", () => {
    const response = AnnotatorSlice.reducer(previousState, focusConfidence("confident"));
    const expectedResult: AnnotationResult = {
      ...previousState.results!.find(r => r.id === previousState.focusedResultID)!,
      confidence_indicator: "confident"
    }
    const focusedResult = response.results?.find(r => r.id === response.focusedResultID);
    expect(focusedResult).toEqual(expectedResult);
    expect(response.results).toContainEqual(expectedResult);
    expect(response.focusedLabel).toEqual(previousState.focusedLabel);
    expect(response.focusedConfidenceLabel).toEqual("confident");
    expect(response.focusedCommentID).toEqual(previousState.focusedCommentID);
  })

})
