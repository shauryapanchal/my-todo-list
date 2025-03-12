// noinspection SpellCheckingInspection

import React, {useEffect, useImperativeHandle, useState} from "react";
import {Autocomplete, Box, Button, Checkbox, CircularProgress, TextField, Typography} from "@mui/material";
import {Project, Task, TodoistApi} from "@doist/todoist-api-typescript";
import ListIcon from '@mui/icons-material/List';
import TreeView from "@mui/lab/TreeView";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import TaskAltIcon from "@mui/icons-material/TaskAlt";
import RadioButtonUncheckedIcon from "@mui/icons-material/RadioButtonUnchecked";
import TreeItem from "@mui/lab/TreeItem";
import {ISectionParams} from "../../interfaces/ISectionParams";
import {IGenericTask, IGenericTaskGroup} from "../../interfaces/IGenericTaskModels";

const Todoister = ({ addNotification, setIsReady, setSelectedGroup, parentRef }: ISectionParams) => {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [api, setApi] = useState<TodoistApi | null>(null);

  const [taskListOpen, setTaskListOpen] = useState(false);
  const [taskLists, setTaskLists] = useState<Project[]>([])
  const loadingTaskLists = taskListOpen && taskLists.length === 0;

  const [selectedList, setSelectedList] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[] | null>(null);
  const [loadingTasks, setLoadingTasks] = useState(false);
  const [taskTreeExpanded, setTaskTreeExpanded] = useState<string[]>([]);

  useImperativeHandle(parentRef, () => ({
    async sync(newData: IGenericTaskGroup, current: IGenericTaskGroup) {
      const createTask = async (task: IGenericTask, parentId: string | undefined = undefined) => {
        try {
          return await api?.addTask({
            projectId: selectedList?.id,
            content: task.content,
            description: task.note,
            parentId: parentId
          });
        } catch {
          return null;
        }
      }

      let processed = 0;
      let failed = 0;

      for (const task of newData.tasks) {
        const existingIndex = current.tasks.findIndex(t => t.content === task.content);
        console.log(existingIndex);
        if (existingIndex !== -1) {
          // TODO Implement update
          continue;
        }

        processed += 1 + task.subTasks.length;

        const response = await createTask(task);
        if (!response) {
          addNotification(`Failed to sync task '${task.content}'`, "error");
          failed += 1;
          continue;
        }

        for (const subTask of task.subTasks) {
          const subResponse = await createTask(subTask, response.id);

          if (!subResponse) {
            addNotification(`Failed to sync sub task '${subTask.content}' to '${task.content}'`, "error");
            failed += 1;
          }
        }
      }

      if (selectedList)
        await getTasks(selectedList.id);

      return {
        processed: processed,
        failed: failed
      }
    }
  }))

  const getTaskLists = async () => {
    if (!api)
      return;

    const projects: Project[] = await api.getProjects();
    setTaskLists(projects);
  }

  const getTasks = async (projectId: string) => {
    if (!api)
      return;

    setLoadingTasks(true);
    const response: Task[] = await api.getTasks({ projectId: projectId })
    setLoadingTasks(false);
    setTasks(response);
  }

  const toGenericTask = (task: Task, subTasks: IGenericTask[] = []): IGenericTask => {
    return {
      content: task.content,
      complete: task.isCompleted,
      subTasks: subTasks,
      due: task.due?.date ?? "",
      note: task.description
    }
  }

  const syncGenericTasks = () => {
    if (!selectedList)
      return;

    if (!tasks)
      return;

    const bottomTasks = tasks
      .filter(task => task.parentId);
    const topTasks = tasks
      .filter(task => !task.parentId)
      .map(task => {
        const subTasks = bottomTasks
          .filter(subTask => subTask.parentId === task.id)
          .map(subTask => toGenericTask(subTask))
        return toGenericTask(task, subTasks);
      })

    const group: IGenericTaskGroup = {
      tasks: topTasks,
      name: selectedList.name
    }

    setSelectedGroup(group)
  }

  useEffect(() => {
    if (!accessToken)
      return;

    setApi(new TodoistApi(accessToken));
  }, [accessToken])

  useEffect(() => {
    let active = true;

    if (!loadingTaskLists) {
      return undefined;
    }

    (async () => {
      if (active)
        await getTaskLists();
    })();

    return () => {
      active = false;
    }
  }, [loadingTaskLists])

  useEffect(() => {
    if (!taskListOpen) {
      setTaskLists([]);
    }
  }, [taskListOpen])

  useEffect(() => {
    if (!selectedList) {
      setTasks(null);
      return;
    }

    (async () => {
      await getTasks(selectedList.id);
      setIsReady(true);
    })();
  }, [selectedList])

  useEffect(() => {
    syncGenericTasks();
  }, [tasks]);

  const handleTaskTreeExpand = () => {
    if (!tasks)
      return;

    setTaskTreeExpanded((oldExpanded) =>
      oldExpanded.length === 0
        ? Array.from(new Set(tasks.filter(task => task.parentId).map(task => task.parentId as string)))
        : []
    );
  }

  const taskTreeNodeToggle = (event: React.SyntheticEvent, nodeIds: string[]) => {
    setTaskTreeExpanded(nodeIds);
  };

  const handleAuth = () => {
    let authCode: string | null = null;
    const clientId = process.env.NEXT_PUBLIC_TODOIST_ID;
    const state = crypto.randomUUID();
    const callbackUrl = process.env.NEXT_PUBLIC_TODOIST_REDIRECT;
    const externalUrl = `https://todoist.com/oauth/authorize?client_id=${clientId}&scope=data:read_write&state=${state}&redirect_uri=${callbackUrl}`;
    const authWindowParams = "popup=yes,toolbar=no,menubar=no,width=500,height=550"
    const authWindow = window.open(externalUrl, '_blank', authWindowParams);
    if (!authWindow)
      return;

    authWindow.opener = null;

    const windowMessageListener = (event: MessageEvent) => {
      if (event.data.type === 'TODOIST_CALLBACK' && !authCode) {
        authWindow.close();

        const params = new URL(event.data.url).searchParams;
        if (params.get('state') !== state) {
          addNotification("Unauthorized to Todoist", "error");
        } else {
          authCode = params.get('code');
        }
      }
    }

    window.addEventListener("message", windowMessageListener, false)

    const getAccessToken = () => {
      if (accessToken)
        return;

      const xhr = new XMLHttpRequest();
      xhr.onreadystatechange = function() {
        if (this.readyState == 4) {
          if (this.status == 200) {
            const response: { access_token: string, token_type: string } = JSON.parse(this.responseText);
            setAccessToken(response.access_token);
            addNotification("Logged in", "success");
          } else {
            addNotification("Authorization into Todoist failed", "error");
          }
        }
      };
      xhr.open('GET', `api/todoistAccessToken?code=${authCode}`);
      xhr.send();
    }

    const checkAuth = setInterval(() => {
      if (authWindow?.closed) {
        clearInterval(checkAuth);
        window.removeEventListener("message", windowMessageListener, false);
        getAccessToken();
      } else {
        authWindow.postMessage("TODOIST_CALLBACK");
      }
    }, 200);
  };

  return (
    <div>
      {!accessToken &&
        <Button onClick={handleAuth} startIcon={<ListIcon/>}>LOG IN</Button>
      }
      {accessToken &&
          <Autocomplete
              open={taskListOpen}
              onOpen={() => {
                setTaskListOpen(true);
              }}
              onClose={() => {
                setTaskListOpen(false);
              }}
              isOptionEqualToValue={(option, value) => option.id === value.id}
              getOptionLabel={(option) => option.name}
              options={taskLists}
              loading={loadingTaskLists}
              value={selectedList}
              onChange={(event: any, newValue: Project | null) => setSelectedList(newValue)}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Project"
                  InputProps={{
                    ...params.InputProps,
                    endAdornment: (
                      <React.Fragment>
                        {loadingTaskLists ? <CircularProgress color="inherit" size={20} /> : null}
                        {params.InputProps.endAdornment}
                      </React.Fragment>
                    ),
                  }}
                />
              )}
          />
      }
      {loadingTasks && <CircularProgress color="inherit" style={{ marginTop: '10px' }} />}
      {selectedList && tasks
        ? tasks.length > 0
          ? <>
            <Box sx={{ mb: 1, mt: 1 }}>
              <Button onClick={handleTaskTreeExpand}>
                {taskTreeExpanded.length === 0 ? 'Expand all' : 'Collapse all'}
              </Button>
            </Box>
            <TreeView
              disableSelection={true}
              expanded={taskTreeExpanded}
              onNodeToggle={taskTreeNodeToggle}
              defaultCollapseIcon={<ExpandMoreIcon />}
              defaultExpandIcon={<ChevronRightIcon />}>
              {
                tasks
                  .filter(task => !task.parentId)
                  .map(task => {
                    const children = tasks
                      .filter(subTask => subTask.parentId === task.id)

                    if (children.length === 0 )
                      return (
                        <TreeItem
                          key={task.id}
                          nodeId={task.id}
                          label={
                            <Box sx={{ display: 'flex', alignItems: 'center', p: 0.5, pr: 0 }}>
                              <Checkbox aria-label={`Todoist task ${task.id}`}
                                        disabled
                                        checked={task.isCompleted}
                                        icon={<RadioButtonUncheckedIcon/>}
                                        checkedIcon={<TaskAltIcon/>}/>
                              <Typography variant="body2" sx={{ fontWeight: 'inherit', flexGrow: 1 }}>
                                {task.content}
                              </Typography>
                            </Box>
                          }>
                        </TreeItem>
                      )
                    else {
                      return (
                        <TreeItem
                          key={task.id}
                          nodeId={task.id}
                          label={
                            <Box sx={{ display: 'flex', alignItems: 'center', p: 0.5, pr: 0 }}>
                              <Checkbox aria-label={`Todoist task ${task.id}`}
                                        disabled
                                        checked={task.isCompleted}
                                        icon={<RadioButtonUncheckedIcon/>}
                                        checkedIcon={<TaskAltIcon/>}/>
                              <Typography variant="body2" sx={{ fontWeight: 'inherit', flexGrow: 1 }}>
                                {task.content}
                              </Typography>
                            </Box>
                          }>
                          {
                            children.map(subTask => {
                              return (
                                <TreeItem key={task.id + subTask.id} nodeId={task.id + subTask.id} label={
                                  <Box sx={{ display: 'flex', alignItems: 'center', p: 0.5, pr: 0 }}>
                                    <Checkbox aria-label={`Todoist task ${subTask.id}`}
                                              disabled
                                              checked={subTask.isCompleted}
                                              icon={<RadioButtonUncheckedIcon/>}
                                              checkedIcon={<TaskAltIcon/>}/>
                                    <Typography variant="body2" sx={{ fontWeight: 'inherit', flexGrow: 1 }}>
                                      {subTask.content}
                                    </Typography>
                                  </Box>
                                }/>
                              )
                            })
                          }
                        </TreeItem>
                      )
                    }
                  })
              }
            </TreeView>
          </>
          : <span>No tasks</span>
        : <span></span>
      }
    </div>
  );
};

export default Todoister;