import { get, options, post, SuperAgentRequest } from "superagent";
import { AuthAPIService } from "../auth.ts";

type BaseType = string | number | boolean
type QueryParams = { [key in string]: BaseType | Array<BaseType> }

interface BaseOptionsItem {
  required: boolean;
  read_only: boolean;
  label: string;
  help_text?: string;
  max_length?: number;
}

interface OtherOptionsItem extends BaseOptionsItem {
  type: 'integer' | 'boolean' | 'datetime' | 'string' | string;
}

export interface ChoiceOptionsItem extends BaseOptionsItem {
  type: 'choice';
  choices: Array<{
    value: string;
    display_name: string;
  }>
}

interface ArrayOptionsItem extends BaseOptionsItem {
  type: 'field';
  child: Omit<BaseOptionsItem, 'label'>
}

interface NestedOptionsItem extends BaseOptionsItem {
  type: 'nested object';
  children: { [key in string]: OptionsItem }
}

export type OptionsItem = ChoiceOptionsItem | ArrayOptionsItem | NestedOptionsItem | OtherOptionsItem;

export type Options = { [key in string]: OptionsItem }

export class APIService<Read, Write> {

  private listRequest?: SuperAgentRequest;
  private retrieveRequest?: SuperAgentRequest;
  private createRequest?: SuperAgentRequest;
  private optionRequest?: SuperAgentRequest;
  private downloadRequests: Map<string, SuperAgentRequest> = new Map();
  private downloadURL: Map<string, string> = new Map();

  constructor(protected URI: string,
              protected auth: AuthAPIService) {
  }

  protected getURLWithQueryParams(baseURL: string, queryParams?: QueryParams): string {
    if (!queryParams) return baseURL;
    return encodeURI(`${ baseURL }?${ Object.entries(queryParams).map(([ key, value ]) => `${ key }=${ value }`).join('&') }`);
  }

  public list(url?: string, queryParams?: QueryParams): Promise<Array<Read>> {
    this.listRequest = get(this.getURLWithQueryParams(url ?? this.URI, queryParams)).set("Authorization", this.auth.bearer);
    return this.listRequest.then(r => r.body).catch(this.auth.catch401.bind(this.auth))
  }

  public retrieve(id: string | number, url?: string): Promise<Read> {
    this.retrieveRequest = get(url ?? `${ this.URI }/${ id }/`).set("Authorization", this.auth.bearer);
    return this.retrieveRequest.then(r => r.body).catch(this.auth.catch401.bind(this.auth))
  }

  public create(data: Write, url?: string, queryParams?: QueryParams): Promise<Read> {
    this.createRequest = post(this.getURLWithQueryParams(url ?? `${ this.URI }/`, queryParams)).set("Authorization", this.auth.bearer).send(data as any);
    return this.createRequest.then(r => r.body).catch(this.auth.catch401.bind(this.auth))
  }

  public options(): Promise<Options> {
    this.optionRequest = options(this.URI + '/').set("Authorization", this.auth.bearer).set("Content-Type", "application/json")
    return this.optionRequest.then(r => r.body.actions.POST).catch(this.auth.catch401.bind(this.auth))
  }

  public abort(): void {
    this.listRequest?.abort();
    this.retrieveRequest?.abort();
    this.createRequest?.abort();
    this.optionRequest?.abort();
    this.downloadURL.forEach(url => URL.revokeObjectURL(url));
    this.downloadURL = new Map<string, string>();
    this.downloadRequests.forEach(r => r.abort());
    this.downloadRequests = new Map<string, SuperAgentRequest>();
  }

  protected async download(requestURL: string, filename: string) {
    const formerURL = this.downloadURL.get(requestURL);
    if (formerURL) URL.revokeObjectURL(formerURL);

    const request = get(requestURL).set("Authorization", this.auth.bearer);
    this.downloadRequests.set(requestURL, request);

    const result = await request
    const url = URL.createObjectURL(new File([ result.text ], filename, { type: result.header['content-type'] }));
    // Using <a>-linking trick https://stackoverflow.com/a/19328891/2730032
    const a = document.createElement('a');
    a.style.display = "none";
    a.href = url;
    this.downloadURL.set(requestURL, url);
    a.type = result.header['content-type'];
    a.download = filename;
    if (!document.body) throw new Error("Unexpectedly missing <body>");
    document.body.appendChild(a);
    a.click();
  }
}
