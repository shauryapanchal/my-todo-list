import React, {useEffect, useImperativeHandle, useState} from "react";
import { useLoadGsiScript } from "../../hooks/GoogleAPILoader";
import {
  Button,
  Checkbox,
  Autocomplete, TextField, CircularProgress, Typography, Box
} from "@mui/material";
import GoogleIcon from '@mui/icons-material/Google';
import {IInitTokenClientCallback, IInitTokenClientResult} from "../../interfaces/IGoogleAPI";
import {IGoogleTaskItem, IGoogleTasks, IGoogleTaskList, IGoogleTaskListResponse} from "../../interfaces/IGoogleTaskModels";
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';
import TaskAltIcon from '@mui/icons-material/TaskAlt';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import TreeView from '@mui/lab/TreeView';
import TreeItem from '@mui/lab/TreeItem';
import {IGenericTask, IGenericTaskGroup} from "../../interfaces/IGenericTaskModels";
import {ISectionParams} from "../../interfaces/ISectionParams";

// noinspection SpellCheckingInspection
const CLIENT_ID = "18533555788-5fr6kdhaqh7j8dfogv2u1qqut4m1p94f.apps.googleusercontent.com";
const SCOPES = 'https://www.googleapis.com/auth/tasks \
                https://www.googleapis.com/auth/tasks.readonly';

const GoogleTasks = ({ addNotification, setIsReady, setSelectedGroup, parentRef }: ISectionParams) => {
  const { isOAuthClientLoaded, gsi } = useLoadGsiScript();
  const [client, setClient] = useState<IInitTokenClientResult | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);

  const [taskListOpen, setTaskListOpen] = useState(false);
  const [taskLists, setTaskLists] = useState<IGoogleTaskList[]>([]);
  const loadingTaskLists = taskListOpen && taskLists.length === 0;

  const [selectedList, setSelectedList] = useState<IGoogleTaskList | null>(null);
  const [tasks, setTasks] = useState<IGoogleTaskItem[] | null>(null);
  const [loadingTasks, setLoadingTasks] = useState(false);
  const [taskTreeExpanded, setTaskTreeExpanded] = useState<string[]>([]);

  useImperativeHandle(parentRef, () => ({
    async sync(newData: IGenericTaskGroup, current: IGenericTaskGroup) {
      const createTask = async (task: IGenericTask) => {
        return await fetch(`/api/googleAddTask?accessToken=${accessToken}&taskListId=${selectedList?.id}&title=${task.content}&status=${task.complete ? "completed" : "needsAction"}&due=${task.due}&notes=${task.note}`);
      }
      const createSubTask = async (parentId: string, task: IGenericTask) => {
        const subtask = await createTask(task);
        if (subtask.status !== 200) {
          return subtask;
        }

        const val = await subtask.json();

        return await fetch(`api/googleAssignParent?accessToken=${accessToken}&taskListId=${selectedList?.id}&parent=${parentId}&child=${val.id}`)
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
        if (response.status !== 200) {
          addNotification(`Failed to sync task '${task.content}'`, "error");
          failed += 1;
          continue;
        }

        const newTask = await response.json();
        for (const subTask of task.subTasks) {
          const subResponse = await createSubTask(newTask.id, subTask);

          if (subResponse.status !== 200) {
            addNotification(`Failed to sync sub task '${subTask.content}' to '${task.content}'`, "error");
            failed += 1;
          }
        }
      }

      if (selectedList)
        getTasks(selectedList.id);

      return {
        processed: processed,
        failed: failed
      };
    }
  }));

  const toGenericTask = (task: IGoogleTaskItem, subTasks: IGenericTask[] = []): IGenericTask => {
    return {
      content: task.title,
      complete: task.status === "completed",
      subTasks: subTasks,
      due: task.due ?? "",
      note: task.notes ?? ""
    }
  }

  const syncGenericTasks = () => {
    if (!selectedList)
      return;

    if (!tasks)
      return;

    const bottomTasks = tasks
      .filter(task => task.parent);
    const topTasks = tasks
      .filter(task => !task.parent)
      .map(task => {
        const subTasks = bottomTasks
          .filter(subTask => subTask.parent === task.id)
          .map(subTask => toGenericTask(subTask))
        return toGenericTask(task, subTasks);
      })

    const group: IGenericTaskGroup = {
      tasks: topTasks,
      name: selectedList.title
    }

    setSelectedGroup(group)
  };

  const getTaskLists = () => {
    const xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function() {
      if (this.readyState == 4 && this.status == 200) {
        const response: IGoogleTaskListResponse = JSON.parse(this.responseText);
        setTaskLists(response.items);
      }
    };
    xhr.open('GET', 'https://www.googleapis.com/tasks/v1/users/@me/lists');
    xhr.setRequestHeader('Authorization', 'Bearer ' + accessToken);
    xhr.send();
  }

  const getTasks = (id: string) => {
    if (!accessToken)
      return;

    setLoadingTasks(true);
    const xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function() {
      if (this.readyState == 4) {
        if (this.status == 200) {
          const response: IGoogleTasks = JSON.parse(this.responseText);
          setTasks(response.items);
        } else {
          addNotification("Loading tasks failed", "error");
        }
        setLoadingTasks(false);
      }
    };
    xhr.open('GET', `api/googleListTasks?accessToken=${accessToken}&taskListId=${id}`);
    xhr.send();
  }

  const handleTaskTreeExpand = () => {
    if (!tasks)
      return;

    setTaskTreeExpanded((oldExpanded) =>
      oldExpanded.length === 0
        ? Array.from(new Set(tasks.filter(task => task.parent).map(task => task.parent)))
        : []
    );
  }

  const taskTreeNodeToggle = (event: React.SyntheticEvent, nodeIds: string[]) => {
    setTaskTreeExpanded(nodeIds);
  };

  useEffect(() => {
    if (gsi === undefined) {
      return;
    }

    if (gsi === null)
    {
      addNotification("Unable to load Google's API", "error");
      return;
    }

    if (client !== null)
      return;

    const result = gsi.accounts.oauth2.initTokenClient({
      client_id: CLIENT_ID,
      scope: SCOPES,
      callback: (tokenResponse: IInitTokenClientCallback) => {
        setAccessToken(tokenResponse.access_token);
        addNotification("Logged in", "success");
      }
    });

    setClient(result);
  }, [isOAuthClientLoaded, gsi, client])

  useEffect(() => {
    let active = true;

    if (!loadingTaskLists) {
      return undefined;
    }

    (async () => {
      if (active)
        getTaskLists();
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

    getTasks(selectedList.id);
    setIsReady(true);
  }, [selectedList])

  useEffect(() => {
    syncGenericTasks();
  }, [tasks])

  return (
    <>
      {client && !accessToken &&
          <Button onClick={() => client.requestAccessToken()} startIcon={<GoogleIcon/>}>Log in</Button>
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
              isOptionEqualToValue={(option, value) => option.title === value.title}
              getOptionLabel={(option) => option.title}
              options={taskLists}
              loading={loadingTaskLists}
              value={selectedList}
              onChange={(event: any, newValue: IGoogleTaskList | null) => setSelectedList(newValue)}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Task list"
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
                  .filter(task => !task.parent)
                  .map(task => {
                    const children = tasks
                      .filter(subTask => subTask.parent === task.id)
                    if (children.length === 0 )
                      return (
                        <TreeItem
                          key={task.id}
                          nodeId={task.id}
                          label={
                            <Box sx={{ display: 'flex', alignItems: 'center', p: 0.5, pr: 0 }}>
                              <Checkbox aria-label={`Google task ${task.id}`}
                                        disabled
                                        checked={task.status != "needsAction"}
                                        icon={<RadioButtonUncheckedIcon/>}
                                        checkedIcon={<TaskAltIcon/>}/>
                              <Typography variant="body2" sx={{ fontWeight: 'inherit', flexGrow: 1 }}>
                                {task.title}
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
                              <Checkbox aria-label={`Google task ${task.id}`}
                                        disabled
                                        checked={task.status != "needsAction"}
                                        icon={<RadioButtonUncheckedIcon/>}
                                        checkedIcon={<TaskAltIcon/>}/>
                              <Typography variant="body2" sx={{ fontWeight: 'inherit', flexGrow: 1 }}>
                                {task.title}
                              </Typography>
                            </Box>
                          }>
                          {
                            children.map(subTask => {
                              return (
                                <TreeItem key={task.id + subTask.id} nodeId={task.id + subTask.id} label={
                                  <Box sx={{ display: 'flex', alignItems: 'center', p: 0.5, pr: 0 }}>
                                    <Checkbox aria-label={`Google task ${subTask.id}`}
                                              disabled
                                              checked={task.status != "needsAction"}
                                              icon={<RadioButtonUncheckedIcon/>}
                                              checkedIcon={<TaskAltIcon/>}/>
                                    <Typography variant="body2" sx={{ fontWeight: 'inherit', flexGrow: 1 }}>
                                      {subTask.title}
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
    </>
  );
};

export default GoogleTasks;