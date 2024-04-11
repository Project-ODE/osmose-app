import { put, SuperAgentRequest } from "superagent";
import { useAuthService } from "../auth";
import { APIService } from "./api-service.util.tsx";
import { AnnotationMode, AnnotationTaskStatus, AnnotationComment } from "@/types/annotations.ts";
import { CampaignUsage } from "@/types/campaign.ts";

export type List = Array<ListItem>
export type ListItem = {
  id: number;
  status: AnnotationTaskStatus;
  filename: string;
  dataset_name: string;
  start: Date;
  end: Date;
}

export interface Retrieve {
  id: number;
  campaignId: number;
  labels: string[];
  boundaries: Boundaries,
  audioUrl: string;
  instructions_url?: string;
  audioRate: number;
  spectroUrls: Array<{
    nfft: number;
    winsize: number;
    overlap: number;
    urls: string[];
  }>;
  prevAnnotations: Array<RetrieveAnnotation>;
  annotationScope: AnnotationMode;
  prevAndNextAnnotation: {
    prev: number;
    next: number;
  };
  taskComment: Array<RetrieveComment>;
  confidenceIndicatorSet: {
    id: number;
    name: string;
    desc: string;
    confidence_indicators: Array<RetrieveConfidenceIndicator>;
  },
  mode: CampaignUsage
}

export interface Boundaries {
  startTime: string,
  endTime: string,
  startFrequency: number,
  endFrequency: number,
  duration: number,
}

export interface RetrieveAnnotation {
  id: number;
  label: string;
  startTime: number;
  endTime: number;
  startFrequency: number;
  endFrequency: number;
  confidenceIndicator: string;
  result_comments: Array<RetrieveComment>;
  validation: boolean;
}

export interface RetrieveConfidenceIndicator {
  id: number;
  label: string;
  level: number;
  isDefault: boolean;
}

export interface RetrieveComment {
  id: number;
  comment: string;
  annotation_task: number;
  annotation_result: number | null;
}

export type AnnotationTaskDto = {
  id?: number,
  label: string,
  startTime: number | null,
  endTime: number | null,
  startFrequency: number | null,
  endFrequency: number | null,
  confidenceIndicator: string | null,
  result_comments: Array<AnnotationComment>,
  validation?: boolean;
};

interface AddAnnotation {
  annotation: AnnotationTaskDto,
  task_start_time: number,
  task_end_time: number,
}

interface Update {
  annotations: AnnotationTaskDto[],
  task_start_time: number,
  task_end_time: number,
  task_comments: Array<AnnotationComment>,
}

export interface UpdateResult {
  next_task: number;
  campaign_id: number;
}

export class AnnotationTaskAPIService extends APIService<List, Retrieve, never> {
  private addAnnotationRequest?: SuperAgentRequest;
  private updateRequest?: SuperAgentRequest;

  list(campaignID: string): Promise<List> {
    return super.list(`${ this.URI }/campaign/${ campaignID }`).then(r => r.map((d: any) => ({
      ...d,
      start: new Date(d.start),
      end: new Date(d.end),
    })));
  }

  retrieve(id: string): Promise<Retrieve> {
    return super.retrieve(id).then(r => {
      const startTime = new Date(r.boundaries.startTime);
      const endTime = new Date(r.boundaries.endTime);
      return {
        ...r,
        boundaries: {
          ...r.boundaries,
          duration: (endTime.getTime() - startTime.getTime()) / 1000
        }
      }
    })
  }

  public addAnnotation(taskID: string | number,
                       data: AddAnnotation): Promise<number> {
    this.addAnnotationRequest = put(`${ this.URI }/one-result/${ taskID }/`)
      .set("Authorization", this.auth.bearer)
      .send(data);
    return this.addAnnotationRequest.then(r => r.body.id).catch(this.auth.catch401.bind(this.auth))
  }

  public update(taskID: number,
                data: Update): Promise<UpdateResult> {
    this.addAnnotationRequest = put(`${ this.URI }/${ taskID }/`)
      .set("Authorization", this.auth.bearer)
      .send(data);
    return this.addAnnotationRequest.then(r => r.body).catch(this.auth.catch401.bind(this.auth))
  }

  abort() {
    super.abort();
    this.addAnnotationRequest?.abort();
    this.updateRequest?.abort();
  }

  create(): Promise<never> {
    throw 'Unimplemented';
  }
}

export const useAnnotationTaskAPI = () => {
  const auth = useAuthService();
  return new AnnotationTaskAPIService('/api/annotation-task', auth);
}
