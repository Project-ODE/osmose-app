export type Collaborator = {
  id: string;

  name: string;
  thumbnail: string;
  show_on_home_page: boolean;
  url?: string;
  level: number;
}