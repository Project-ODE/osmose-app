export type ID = string | number;


type BaseType = string | number | boolean
export type QueryParams = { [key in string]: BaseType | Array<BaseType> }

export type Errors<T> = {
  [P in keyof T]?: string;
}

export type Paginated<T> = {
  count: number;
  next: string;
  previous: string;
  results: Array<T>;
}