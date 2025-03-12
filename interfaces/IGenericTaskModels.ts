export interface IGenericTaskGroup {
  name: string,
  tasks: IGenericTask[]
}

export interface IGenericTask {
  content: string,
  complete: boolean,
  due: string,
  note: string,
  subTasks: IGenericTask[]
}