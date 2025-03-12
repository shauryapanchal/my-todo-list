export interface IGoogleTasks {
  kind: string,
  etag: string,
  items: IGoogleTaskItem[];
}

export interface IGoogleTaskItem {
  kind: string,
  id: string,
  etag: string,
  title: string,
  updated: string,
  selfLink: string,
  position: string,
  parent: string,
  due: string,
  notes: string,
  status: GoogleTaskStatus,
  links: IGoogleTaskLink[]
}

export type GoogleTaskStatus = 'needsAction' | 'completed'

export interface IGoogleTaskLink {
  type: string,
  description: string,
  link: string
}

export interface IGoogleTaskListResponse {
  kind: string,
  etag: string,
  items: IGoogleTaskList[]
}

export interface IGoogleTaskList {
  kind: string,
  id: string,
  etag: string,
  title: string,
  updated: string,
  selfLink: string
}
