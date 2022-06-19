// @flow
import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import request from 'superagent';
import * as utils from '../utils';

import AudioPlayer from './AudioPlayer';
import Workbench from './Workbench';

import type { ToastMsg } from '../Toast';
import Toast from '../Toast';

import '../css/font-awesome-4.7.0.min.css';
import '../css/annotator.css';

// API constants
const API_URL = '/api/annotation-task/';

// Playback rates
const AVAILABLE_RATES: Array<number> = [0.25, 0.5, 1.0, 1.5, 2.0, 3.0, 4.0];

// Annotation scopes
const SCOPE_RECTANGLE: number = 1;
const SCOPE_WHOLE: number = 2;

export type SpectroUrlsParams = {
  nfft: number,
  winsize: number,
  overlap: number,
  urls: Array<string>,
};

export type RawAnnotation = {
  id: string,
  annotation: string,
  startTime: ?number,
  endTime: ?number,
  startFrequency: ?number,
  endFrequency: ?number,
};

export const TYPE_TAG: string = 'tag';
export const TYPE_BOX: string = 'box';

export type Annotation = {
  type: string,
  id: string,
  annotation: string,
  startTime: number,
  endTime: number,
  startFrequency: number,
  endFrequency: number,
  active: boolean,
};

type AnnotationTask = {
  annotationTags: Array<string>,
  boundaries: {
    startTime: string,
    endTime: string,
    startFrequency: number,
    endFrequency: number,
  },
  audioUrl: string,
  spectroUrls: Array<SpectroUrlsParams>,
  prevAnnotations: Array<RawAnnotation>,
  campaignId: number,
  instructions_url: ?string,
  annotationScope: number,
};

type AudioAnnotatorProps = {
  match: {
    params: {
      annotation_task_id: number
    },
  },
  app_token: string,
};

type AudioAnnotatorState = {
  error: ?string,
  toastMsg: ?ToastMsg,
  tagColors: Map<string, string>,
  isLoading: boolean,
  isPlaying: boolean,
  stopTime: ?number,
  currentTime: number,
  duration: number,
  playbackRate: number,
  frequencyRange: number,
  task: ?AnnotationTask,
  taskStartTime: number,
  annotations: Array<Annotation>,
};

class AudioAnnotator extends Component<AudioAnnotatorProps, AudioAnnotatorState> {
  audioContext: AudioContext;
  audioPlayer: AudioPlayer;

  constructor(props: AudioAnnotatorProps) {
    super(props);

    const now: Date = new Date();

    this.state = {
      error: undefined,
      toastMsg: undefined,
      tagColors: new Map(),
      isLoading: true,
      isPlaying: false,
      stopTime: undefined,
      currentTime: 0,
      duration: 0,
      playbackRate: 1.0,
      frequencyRange: 0,
      task: undefined,
      taskStartTime: now.getTime(),
      annotations: [],
    };
  }

  componentDidMount() {
    const taskId: number = this.props.match.params.annotation_task_id;

    // Retrieve current task
    request.get(API_URL + taskId.toString())
      .set('Authorization', 'Bearer ' + this.props.app_token)
      .then(result => {
        const task: AnnotationTask = result.body;

        if (task.annotationTags.length > 0 && task.spectroUrls.length > 0) {
          // Computing duration (in seconds)
          const startDate = new Date(task.boundaries.startTime);
          const endDate = new Date(task.boundaries.endTime)
          const duration: number = (endDate.getTime() - startDate.getTime()) / 1000;
          const frequencyRange: number = task.boundaries.endFrequency - task.boundaries.startFrequency;

          // Load previous annotations
          const annotations: Array<Annotation> = task.prevAnnotations.map((ann: RawAnnotation) => {
            const isBoxAnnotation = (typeof ann.startTime === 'number') &&
              (typeof ann.endTime === 'number') &&
              (typeof ann.startFrequency === 'number') &&
              (typeof ann.endFrequency === 'number');

            if (isBoxAnnotation) {
              return {
                type: TYPE_BOX,
                id: ann.id,
                annotation: ann.annotation,
                startTime: ann.startTime ? ann.startTime : 0,
                endTime: ann.endTime ? ann.endTime : 0,
                startFrequency: ann.startFrequency ? ann.startFrequency : 0,
                endFrequency: ann.endFrequency ? ann.endFrequency : 0,
                active: false,
              };
            } else {
              return {
                type: TYPE_TAG,
                id: ann.id,
                annotation: ann.annotation,
                startTime: -1,
                endTime: -1,
                startFrequency: -1,
                endFrequency: -1,
                active: false,
              };
            }
          });

          // Finally, setting state
          this.setState({
            tagColors: utils.buildTagColors(task.annotationTags),
            task,
            duration,
            frequencyRange,
            isLoading: false,
            error: undefined,
            annotations,
          });
        } else {
          this.setState({isLoading: false, error: 'Not enough data to retrieve spectrograms'});
        }
      })
      .catch(err => {
        if (err.status && err.status === 401) {
          // Server returned 401 which means token was revoked
          document.cookie = 'token=;max-age=0;path=/';
          window.location.reload();
        } else {
          this.setState({isLoading: false, error: this.buildErrorMessage(err)});
        }
      });
  }

  buildErrorMessage = (err: any) => {
    if (err !== null && typeof err === 'object' && err.status && err.message) {
      return 'Status: ' + err.status.toString() +
        ' - Reason: ' + err.message +
        (err.response.body.title ? ` - ${err.response.body.title}` : '') +
        (err.response.body.detail ? ` - ${err.response.body.detail}` : '');
    } else if (typeof err === 'string') {
      return err;
    } else {
      return err.toString();
    }
  }

  seekTo = (newTime: number) => {
    this.audioPlayer.audioElement.currentTime = newTime;
    this.updateProgress(newTime);
  }

  playPause = () => {
    if (this.audioPlayer.audioElement.paused) {
      this.play();
    } else {
      this.pause();
    }
  }

  play = (annotation: ?Annotation) => {
    if (annotation) {
      this.audioPlayer.audioElement.currentTime = annotation.startTime;
      this.activateAnnotation(annotation);
    }
    this.audioPlayer.audioElement.play();

    this.setState({
      isPlaying: true,
      stopTime: annotation ? annotation.endTime : undefined,
    });
  }

  pause = () => {
    this.audioPlayer.audioElement.pause();

    this.setState({
      isPlaying: false,
      stopTime: undefined,
    });
  }

  updateProgress = (seconds: number) => {
    if (this.state.stopTime && (seconds > this.state.stopTime)) {
      this.pause();
    } else {
      this.setState({currentTime: seconds});
    }
  }

  getCurrentTag = () => {
    const activeTag = this.state.annotations.find((ann: Annotation) => ann.active && ann.type === TYPE_TAG);
    if (activeTag) {
      return activeTag.annotation;
    }
    return "";
  };

  saveAnnotation = (annotation: Annotation) => {
    const isPresenceMode = !!this.state.task && this.state.task.annotationScope === SCOPE_WHOLE;

    const maxId: ?number = this.state.annotations
      .map(ann => parseInt(ann.id, 10))
      .sort((a, b) => b - a)
      .shift();
    const newId: string = maxId ? (maxId + 1).toString() : '1';

    if (isPresenceMode) {
      if (annotation.type === TYPE_BOX) {
        const newAnnotation: Annotation = Object.assign(
          {}, annotation, {id: newId, annotation: this.getCurrentTag()}
        );

        const annotations: Array<Annotation> = this.state.annotations.concat(newAnnotation);

        this.setState({annotations});
      } else {
        // Type: TYPE_TAG
        const newAnnotation: Annotation = Object.assign(
          {}, annotation, {id: newId}
        );

        this.activateAnnotation(newAnnotation);
      }
    } else {
      const newAnnotation: Annotation = Object.assign(
        {}, annotation, {id: newId}
      );

      if (this.state.annotations.length === 0) {
        this.setState({
          toastMsg: {msg: 'Select a tag to annotate the box.', lvl: 'primary'},
        });
      }

      this.activateAnnotation(newAnnotation);
    }
  }

  updateAnnotation = (annotation: Annotation) => {
    const annotations: Array<Annotation> = this.state.annotations
      .filter(ann => ann.id !== annotation.id)
      .concat(annotation);

    this.setState({annotations});
  }

  deleteAnnotation = (annotation: Annotation) => {
    const annotations: Array<Annotation> = this.state.annotations
      .filter(ann => ann.id !== annotation.id);

    this.setState({annotations});
  }

  activateAnnotation = (annotation: Annotation) => {
    const isBoxMode = !!this.state.task && this.state.task.annotationScope === SCOPE_RECTANGLE;

    if (isBoxMode || annotation.type === TYPE_TAG) {
      const activated: Annotation = Object.assign(
        {}, annotation, { active: true }
      );
      const annotations: Array<Annotation> = this.state.annotations
        .filter(ann => ann.id !== activated.id)
        .map(ann => Object.assign({}, ann, { active: false }))
        .concat(activated);

      this.setState({annotations});
    }
  }

  toggleAnnotationTag = (tag: string) => {
    const activeAnn: ?Annotation = this.state.annotations
      .find(ann => ann.type === TYPE_BOX && ann.active);

    if (activeAnn) {
      const newTag: string = (activeAnn.annotation === tag) ? '' : tag;
      const newAnnotation: Annotation = Object.assign(
        {}, activeAnn, { annotation: newTag, }
      );
      const annotations: Array<Annotation> = this.state.annotations
        .filter(ann => !ann.active)
        .concat(newAnnotation);

      this.setState({
        annotations,
        toastMsg: undefined,
      });
    }
  }

  toggleGlobalTag = (tag: string) => {
    const matchingAnnotation: ?Annotation = this.state.annotations
      .find(ann => ann.type === TYPE_TAG && ann.annotation === tag);

    if (matchingAnnotation) {
      const isTagCurrent: boolean = this.getCurrentTag() === tag;

      if (isTagCurrent) {
        // Tag is present and current: unable it (delete all related annotations)
        const annotations: Array<Annotation> = this.state.annotations
          .filter(ann => ann.annotation !== tag);

        this.setState({
          annotations,
          toastMsg: undefined,
        });
      } else {
        // Tag is present but not active: activate it
        this.activateAnnotation(matchingAnnotation);
      }
    } else {
      // Tag is not present: create it
      const newAnnotation: Annotation = {
        type: TYPE_TAG,
        id: '',
        annotation: tag,
        startTime: -1,
        endTime: -1,
        startFrequency: -1,
        endFrequency: -1,
        active: true,
      };
      this.saveAnnotation(newAnnotation);
    }
  }

  checkAndSubmitAnnotations = () => {
    const emptyAnnotations = this.state.annotations
      .filter((ann: Annotation) => ann.annotation.length === 0);

    if (emptyAnnotations.length > 0) {
      this.activateAnnotation(emptyAnnotations.shift());
      this.setState({
        toastMsg: {msg: 'Make sure all your annotations are tagged.', lvl: 'danger'},
      });
    } else {
      this.submitAnnotations();
    }
  }

  submitAnnotations = () => {
    const taskId: number = this.props.match.params.annotation_task_id;

    const cleanAnnotations: Array<RawAnnotation> = this.state.annotations
      .sort((a, b) => a.startTime - b.startTime)
      .map(ann => {
        const startTime = ann.type === TYPE_BOX ? ann.startTime : null;
        const endTime = ann.type === TYPE_BOX ? ann.endTime : null;
        const startFrequency = ann.type === TYPE_BOX ? ann.startFrequency : null;
        const endFrequency = ann.type === TYPE_BOX ? ann.endFrequency : null;
        return {
          id: ann.id,
          startTime,
          endTime,
          annotation: ann.annotation,
          startFrequency,
          endFrequency,
        };
      });
    const now: Date = new Date();
    const taskStartTime: number = Math.floor(this.state.taskStartTime / 1000);
    const taskEndTime: number = Math.floor(now.getTime() / 1000);

    request.put(API_URL + taskId.toString() + '/')
      .set('Authorization', 'Bearer ' + this.props.app_token)
      .send({
        annotations: cleanAnnotations,
        task_start_time: taskStartTime,
        task_end_time: taskEndTime,
      })
      .then(result => {
        const nextTask: number = result.body.next_task;
        const campaignId: number = result.body.campaign_id;

        if (nextTask) {
          this.props.history.push('/audio-annotator/' + nextTask.toString());
          window.location.reload();
        } else {
          this.props.history.push('/annotation_tasks/' + campaignId.toString());
          window.location.reload();
        }
      })
      .catch(err => {
        if (err.status && err.status === 401) {
          // Server returned 401 which means token was revoked
          document.cookie = 'token=;max-age=0;path=/';
          window.location.reload();
        } else {
          this.setState({isLoading: false, error: this.buildErrorMessage(err)});
        }
      });
  }

  changePlaybackRate = (event: SyntheticInputEvent<HTMLSelectElement>) => {
    this.setState({
      playbackRate: parseFloat(event.target.value),
    });
  }

  render() {
    if (this.state.isLoading) {
      return <p>Loading...</p>;
    } else if (this.state.error) {
      return <p>Error while loading task: <code>{this.state.error}</code></p>
    } else if (!this.state.task) {
      return <p>Unknown error while loading task.</p>
    } else {
      const task: AnnotationTask = this.state.task;
      const playStatusClass = this.state.isPlaying ? "fa-pause-circle" : "fa-play-circle";

      const playbackRateOptions = AVAILABLE_RATES.map(rate => (
        <option key={`rate-${rate}`} value={rate.toString()}>{rate.toString()}x</option>
      ));
      let playbackRateSelect = undefined;
      // $FlowFixMe
      if (this.audioPlayer && this.audioPlayer.audioElement.mozPreservesPitch !== undefined) {
        playbackRateSelect = (
          <select
            className="form-control select-rate"
            defaultValue={this.state.playbackRate}
            onChange={this.changePlaybackRate}
          >{playbackRateOptions}</select>
        );
      }

      // Displayable annotations (for presence mode)
      const boxAnnotations = this.state.annotations.filter((ann: Annotation) => ann.type === TYPE_BOX);

      // Is drawing enabled? (always in box mode, when a tag is selected in presence mode)
      const isDrawingEnabled = !!task && (task.annotationScope === SCOPE_RECTANGLE || (
        task.annotationScope === SCOPE_WHOLE && this.getCurrentTag() !== ''
      ));

      // Rendering
      return (
        <div className="annotator container-fluid">

          {/* Header */}
          <div className="row">
            <h1 className="col-sm-6">APLOSE</h1>
            <p className="col-sm-4 annotator-nav">
              {this.renderUserGuideLink()}
              {this.renderInstructionsLink()}
            </p>
            <ul className="col-sm-2 annotator-nav">
              <li><Link
                className="btn btn-danger"
                to={`/annotation_tasks/${task.campaignId}`}
                title="Go back to annotation campaign tasks"
              >
                Back to campaign
              </Link></li>
            </ul>
          </div>

          {/* Audio player (hidden) */}
          <AudioPlayer
            // controls
            listenInterval={10}
            onListen={(seconds) => this.updateProgress(seconds)}
            onLoadedMetadata={() => this.updateProgress(0)}
            preload="auto"
            ref={(element) => { if (element) this.audioPlayer = element; } }
            playbackRate={this.state.playbackRate}
            src={task.audioUrl}
          ></AudioPlayer>

          {/* Workbench (spectrogram viz, box drawing) */}
          <Workbench
            tagColors={this.state.tagColors}
            currentTime={this.state.currentTime}
            duration={this.state.duration}
            startFrequency={task.boundaries.startFrequency}
            frequencyRange={this.state.frequencyRange}
            spectroUrlsParams={task.spectroUrls}
            annotations={boxAnnotations}
            onAnnotationCreated={this.saveAnnotation}
            onAnnotationUpdated={this.updateAnnotation}
            onAnnotationDeleted={this.deleteAnnotation}
            onAnnotationSelected={this.activateAnnotation}
            onAnnotationPlayed={this.play}
            onSeek={this.seekTo}
            drawingEnabled={isDrawingEnabled}
          >
          </Workbench>

          {/* Toolbar (play button, play speed, submit button, timer) */}
          <div className="row annotator-controls">
            <p className="col-sm-1 text-right">
              <button
                className={`btn-simple btn-play fa ${playStatusClass}`}
                onClick={this.playPause}
              ></button>
            </p>
            <p className="col-sm-1">
              {playbackRateSelect}
            </p>

            <p className="col-sm-3 text-center">
              <button
                className="btn btn-submit"
                onClick={this.checkAndSubmitAnnotations}
                type="button"
              >Submit &amp; load next recording</button>
            </p>
            <div className="col-sm-4">
              <Toast toastMsg={this.state.toastMsg}></Toast>
            </div>
            <p className="col-sm-3 text-right">
              {utils.formatTimestamp(this.state.currentTime)}
              &nbsp;/&nbsp;
              {utils.formatTimestamp(this.state.duration)}
            </p>
          </div>

          {/* Tag and annotations management */}
          {this.renderAnnotationArea()}

        </div>
      );
    }
  }

  annotationSorter = (a: Annotation, b: Annotation): number => {
    if (this.state.task && this.state.task.annotationScope === SCOPE_WHOLE) {
      if (a.annotation !== b.annotation) {
        return a.annotation.localeCompare(b.annotation);
      }
    }
    return a.startTime - b.startTime;
  }

  renderAnnotationArea = () => {
    const isPresenceMode = !!this.state.task && this.state.task.annotationScope === SCOPE_WHOLE;
    const sortedAnnotations: Array<Annotation> = this.state.annotations.sort(this.annotationSorter);

    return (
      <div className="row">
        <div className="col-sm-6">
          {isPresenceMode ? this.renderTagList() : this.renderActiveAnnotation()}
        </div>
        <div className="col-sm-6">
          <table className="table table-hover">
            <thead>
              <tr className="text-center table-light">
                <th colSpan="3">Annotations</th>
              </tr>
            </thead>
            <tbody>
              {sortedAnnotations.map(annotation => this.renderAnnotationListItem(annotation))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  renderTags = (tagNames: Array<string>, activeTags: Array<string>) => {
    if (this.state.task) {
      const isPresenceMode = this.state.task.annotationScope === SCOPE_WHOLE;

      const tags = tagNames.map((tag, idx) => {
        const color: string = utils.getTagColor(this.state.tagColors, tag);

        const style = {
          inactive: {
            backgroundColor: color,
            border: 'none',
            color: '#ffffff',
          },
          active: {
            backgroundColor: 'transparent',
            border: `1px solid ${color}`,
            color: color,
          },
        };
        return (
          <li key={`tag-${idx.toString()}`}>
            <button
              className="btn"
              style={(activeTags.includes(tag)) ? style.active : style.inactive}
              onClick={() => isPresenceMode ? this.toggleGlobalTag(tag) : this.toggleAnnotationTag(tag)}
              type="button"
            >{tag}</button>
          </li>
        );
      });

      return (
        <React.Fragment>{tags}</React.Fragment>
      );
    } else {
      return (
        <React.Fragment></React.Fragment>
      );
    }

  }

  renderActiveAnnotation = () => {
    const activeAnn: ?Annotation = this.state.annotations.find(ann => ann.active);

    if (activeAnn && this.state.task) {
      const ann: Annotation = activeAnn;

      const tags = this.renderTags(this.state.task.annotationTags, [ann.annotation]);

      return (
        <div className="card">
          <h6 className="card-header text-center">Selected annotation</h6>
          <div className="card-body d-flex justify-content-between">
            <p className="card-text">
              <i className="fa fa-clock-o"></i>&nbsp;
              {utils.formatTimestamp(ann.startTime)}&nbsp;&gt;&nbsp;
              {utils.formatTimestamp(ann.endTime)}<br />
              <i className="fa fa-arrow-up"></i>&nbsp;
              {ann.startFrequency.toFixed(2)}&nbsp;&gt;&nbsp;
              {ann.endFrequency.toFixed(2)} Hz
            </p>
            <ul className="card-text annotation-tags">
              {tags}
            </ul>
          </div>
        </div>
      );
    } else {
      return (
        <div className="card">
          <h6 className="card-header text-center">Selected annotation</h6>
          <div className="card-body">
            <p className="card-text text-center">-</p>
          </div>
        </div>
      );
    }
  }

  renderTagList = () => {
    if (this.state.task) {
      const allTags: Array<string> = this.state.task.annotationTags;
      const activeTags: Array<string> = this.state.annotations
        .filter((ann: Annotation) => ann.type === TYPE_TAG)
        .map((ann: Annotation) => ann.annotation);
      const tags = this.renderTags(allTags, activeTags);

      return (
        <div className="card">
          <h6 className="card-header text-center">Presence / Absence</h6>
          <div className="card-body">
            <ul className="card-text annotation-tags">
              {tags}
            </ul>
          </div>
        </div>
      );
    } else {
      return (
        <div className="card">
          <h6 className="card-header text-center">Presence / Absence</h6>
          <div className="card-body">
            <p className="card-text text-center">-</p>
          </div>
        </div>
      );
    }
  }

  renderAnnotationListItem = (annotation: Annotation) => {
    if (annotation.type === TYPE_BOX) {
      return (
        <tr
          key={`listann-${annotation.id}`}
          onClick={() => this.activateAnnotation(annotation)}
        >
          <td>
            <i className="fa fa-clock-o"></i>&nbsp;
            {utils.formatTimestamp(annotation.startTime)}&nbsp;&gt;&nbsp;
            {utils.formatTimestamp(annotation.endTime)}
          </td>
          <td>
            <i className="fa fa-arrow-up"></i>&nbsp;
            {annotation.startFrequency.toFixed(2)}&nbsp;&gt;&nbsp;
            {annotation.endFrequency.toFixed(2)} Hz
          </td>
          <td>
            <i className="fa fa-tag"></i>&nbsp;
            {(annotation.annotation !== '') ? annotation.annotation : '-'}
          </td>
        </tr>
      );
    } else if (annotation.type === TYPE_TAG) {
      return (
        <tr
          key={`listen-${annotation.id}`}
          onClick={() => this.activateAnnotation(annotation)}
        >
          <td colSpan="3">
            <strong>
              <i className="fa fa-tag"></i>&nbsp;
              {annotation.annotation}
            </strong>
          </td>
        </tr>
      );
    }
  }

  renderUserGuideLink = () => {
    return (
      <span>
        <a
          href="https://github.com/Project-ODE/FrontApp/blob/master/docs/user_guide_annotator.md"
          rel="noopener noreferrer"
          target="_blank"
        ><span className="fa fa-question-circle"></span>&nbsp;Annotator User Guide</a>
      </span>
    );
  }

  renderInstructionsLink = () => {
    if (this.state.task && this.state.task.instructions_url) {
      return (
        <span>
          <a
            href={this.state.task.instructions_url}
            rel="noopener noreferrer"
            target="_blank"
          ><span className="fa fa-info-circle"></span>&nbsp;Campaign instructions</a>
        </span>
      );
    }
  }
}

export default AudioAnnotator;
