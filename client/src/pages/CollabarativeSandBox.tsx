import React, { useEffect, useRef, useState } from "react";
import MonacoEditor from "@monaco-editor/react";
import * as monaco from "monaco-editor";
import { Toaster } from "react-hot-toast";
import { useDebouncedCallback } from "use-debounce";
import { notify } from "../utils/notify";
import { useAppSelector } from "../app/hooks";
import SandBoxNav from "../components/SandBoxNav";
import RoomDetailsModal from "../components/RoomDetailsModal";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import useAxios from "../hooks/useAxios";
import useRoomService from "../hooks/useRoom";
import { queryClient } from "@/main";

import diff_match_patch, { Diff } from "diff-match-patch";

import { DeltaInterface, IRange, IRoom } from "../types/room";
import { initSocket } from "../sockets/initSocket";
import { Actions } from "../sockets/Actions";
import ErrorBoundary from "../components/Error";
import { User } from "../types/user";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { dateConverter, formatDateToString, stringToColor } from "@/utils/cn";
import { TiTick } from "react-icons/ti";
import { Calendar, MessageCirclePlusIcon, SendHorizontal } from "lucide-react";
import { MdDelete } from "react-icons/md";
import MessageBox from "./MessageBox";
import { FaCalendarAlt } from "react-icons/fa";

interface Participant {
  username: string;
  socketId: string;
}

// const FragmentWithKey = ({ children }: { children: React.ReactNode }) => {
//   return <>{children}</>;
// };

const CollaborativeSandBox: React.FC = () => {
  const [output, setOutput] = useState<string>("");
  const [language, setLanguage] = useState<string>("javascript");
  const [code, setCode] = useState<string>("");
  const [theme, setTheme] = useState<string>("vs-dark");
  const [fontSize, setFontSize] = useState<string>("16");
  const [running, setRunning] = useState<boolean>(false);
  const [runTime, setRunTime] = useState<number>(0);
  const [isAllowed, setIsAllowed] = useState<boolean>(false);
  const [room, setRoom] = useState<IRoom | undefined>(undefined);
  const [showModal, setShowModal] = useState<boolean>(false);
  const [participants, setParticipants] = useState<Participant[]>([]);

  const user = useAppSelector((state) => state.auth.user);
  const userId = user?._id || "";

  const [isAddingComment, setIsAddingComment] = useState(false);
  const [selectedText, setSelectedText] = useState("");

  const [selectedRange, setSelectedRange] = useState<monaco.IRange | null>(
    null
  );
  const [iconPosition, setIconPosition] = useState<{
    top: number;
    left: number;
  } | null>(null);

  const { roomId } = useParams();
  const {
    getRoom,
    getAllComments,
    postCommentOrReplies,
    createVersion,
    createDelta,
    loadIntialVersionAndDeltas,
  } = useRoomService();
  const navigate = useNavigate();
  const axios = useAxios();

  // Current Debounced code of editor
  const debouncedCode = useRef<string>("");
  // const [sideBarContent, setSideBarContent] = useState<"comment" | "version">(
  // "version"
  // );

  // Full Previous Code of editor,
  // const [previousCode, setPreviousCode] = useState("");
  const [previousCodeForDelta, setPreviousCodeForDelta] = useState("");
  const [triggerReRender, setTriggerReRender] = useState(false);
  const previousCodeForVersion = useRef<string>("");
  const [currentVersionId, setCurrentVersionId] = useState("");
  const [db, setDb] = useState<IDBDatabase>();

  const debouncedContentChange = useDebouncedCallback(
    // function
    (code: string) => {
      // setDeboundcedCode(code);
      console.log("bruhh");
      debouncedCode.current = code;
      // Just to trigger re-render
      setTriggerReRender((prev) => !prev);
    },
    // delay in ms
    1000 * 5
  );

  const [isOnline, setIsOnline] = useState(navigator.onLine);

  function syncCode(roomId : string,versionId : string) {
    if (typeof window == undefined) return;
    // const isOnline = window.navigator.onLine;
    // if (!isOnline) return;

    console.log("syncDocuments function called");
    return new Promise((resolve, reject) => {
      // Open the database
      const request = indexedDB.open("documentEditorDB", 1);

      request.onsuccess = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        const transaction = db.transaction(["documents"], "readwrite");
        const store = transaction.objectStore("documents");
        const getAllRequest = store.getAll();
        
        getAllRequest.onsuccess = () => {
          const documents = getAllRequest.result;
          const myDocuments = documents.filter( (val) => val.roomId === roomId).sort( (a,b) => {
            const date1= new Date(a.createdAt) 
            const date2 =  new Date(b.createdAt);
            return date1.getTime() - date2.getTime();
          });
          const content = applyDeltas(code,myDocuments);
          console.log(content);
          // resolve();
          // Send documents to the server
          myDocuments.forEach(async (deltas) => {
            try {
    
              const response = await createDelta({
                diffs: deltas.diffs,
                versionId,
                roomId,
              });
    
              console.log('Response from createDelta:', response);
    
              if (!!response) {
                // Open a new transaction to delete the document
                const deleteTransaction = db.transaction(["documents"], "readwrite");
                const deleteStore = deleteTransaction.objectStore("documents");
                deleteStore.delete(deltas.id);
                deleteTransaction.oncomplete = () => {
                  console.log('Deleted document with id:', deltas.id);
                };
              } else {
                console.log('Failed To Syncing Documents');
              }
            } catch (err) {
              console.log('Error In Syncing Documents !!', err);
            }
          });
          setPreviousCodeForDelta(debouncedCode.current ?? "");

        };

        getAllRequest.onerror = () => {
          console.error("Error retrieving documents");
          reject();
        };
      };

      request.onerror = () => {
        console.error("Error opening database");
        reject();
      };
    });
  }

  const {
    data: comments,
    isLoading: isCommentLoading,
    isError: isCommentError,
  } = useQuery({
    queryKey: ["comments", { roomId }],
    queryFn: getAllComments,
  });

  const { mutate } = useMutation({
    mutationFn: postCommentOrReplies,
    onSuccess() {
      queryClient.invalidateQueries({
        queryKey: ["comments", { roomId }],
      });
      setIsAddingComment(false);
    },
  });

  const socketRef = useRef<any>(null);
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);

  // useEffect( () => {

  //   // Filter aou comments which are not in context,

  // },[comments])

  // fetch the intial code

  function applyDeltas(initialcode: string, deltas: DeltaInterface[]) {
    let content = initialcode;
    const dmp = new diff_match_patch();

    console.log('Intial Content : ',content);

    if (!deltas || deltas.length === 0) return content;

    deltas.forEach((deltaObject) => {
      const diffs = deltaObject.diffs;
      console.log("Diffs : ", diffs);
      const patches = dmp.patch_make(diffs);
      // console.log("Patches : ", patches);

      const [patchedContent] = dmp.patch_apply(patches, content);

      console.log("Patched Content : ", patchedContent);
      content = patchedContent;
    });

    console.log("Content", content);
    return content;
  }

  useEffect(() => {
    (async () => {
      if (!roomId) return;
      // deltas should be in ascending order, means latest delta should be at last,
      try {
        const { latestVersion, deltas } = await loadIntialVersionAndDeltas(
          roomId
        );
        if (!latestVersion) {
          // Room Id is wrong
          return;
        }
        // console.log(latestVersion);

        // console.log("Deltas : ", deltas);
        setCurrentVersionId(latestVersion._id);
        const latestCode = applyDeltas(latestVersion.code, deltas);

        setCode(latestCode);
        setPreviousCodeForDelta(latestCode);
        previousCodeForVersion.current = latestCode;

        // Starting IndexedDb
        const request = indexedDB.open("documentEditorDB", 1);

        request.onupgradeneeded = (event) => {
          const db = (event.target as IDBOpenDBRequest).result;
          db.createObjectStore("documents", { keyPath: "id" ,autoIncrement : true});
        };

        request.onsuccess = (event) => {
          const db = (event.target as IDBOpenDBRequest).result;
          console.log(db);
          setDb(db);
          console.log("Database Intialized Successfully");
          // Database is ready to use
        };
        request.onerror = (event) => {
          console.error("Database initialization failed", event);
        };
      } catch (err: any) {
        // Either RoomId is wrong, Or There is no versions Present
        console.log("Failed to load Latest Version");
        // CreatingVersionAtIntervals();
        // return;
      }
    })();
  }, []);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      if(!roomId) return;
      syncCode(roomId,currentVersionId);
    };
    const handleOffline = () => setIsOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    // Clean up event listeners on component unmount
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [currentVersionId,roomId]);

  useEffect(() => {
    const intervalId = setInterval(async () => {
      // Capture the latest values in the closure

      console.log("Debounced ", debouncedCode.current);
      console.log("Previous", previousCodeForVersion.current);

      // Check conditions to create version
      if (
        previousCodeForVersion.current === debouncedCode.current ||
        !roomId ||
        !debouncedCode.current ||
        !language
      )
        return;

      console.log("Creating Version");
      const response = await createVersion({
        roomId,
        code: debouncedCode.current,
        language,
      });
      console.log(response);
      setCurrentVersionId(response._id);
      previousCodeForVersion.current = debouncedCode.current;
    }, 1000 * 60 * 30);

    return () => clearInterval(intervalId);
  }, []);

  const calculateDiffs = (previousContent: string, currentContent: string) => {
    const dmp = new diff_match_patch();
    const diffs = dmp.diff_main(previousContent, currentContent);
    dmp.diff_cleanupEfficiency(diffs);
    return diffs;
  };

  useEffect(() => {
    // Create Delta and store it,

    if (!roomId) return;

    (async () => {
      // console.log("Previous code for delta", previousCodeForDelta);
      // console.log("Debounced Code", debouncedCode);

      if (debouncedCode.current === previousCodeForDelta) return;
      console.log("Creating Deltas");
      const diffs = calculateDiffs(
        previousCodeForDelta,
        debouncedCode.current ?? ""
      );

      console.log('Online Status : ',isOnline);
      // Save Deltas in IndexedDb If they are offline
      if (!isOnline) {
        console.log('Db and diffs' , db, " " ,diffs);
        if (!db || !diffs) return;

        const transaction = db.transaction(["documents"], "readwrite");
        const store = transaction.objectStore("documents");
        store.put({ roomId, diffs, createdAt : new Date() });
        console.log('Debounced Code in creating deltas in IDB : ',debouncedCode.current);
        console.log('Previous Code in creating deltas : ',previousCodeForDelta);
        setPreviousCodeForDelta(debouncedCode.current ?? "");

        transaction.oncomplete = () => {
          console.log("Document saved successfully");
        };

        transaction.onerror = () => {
          console.error("Error saving document");
        };
      }
      else{
        // Maybe we should Create new version if there is no version,
        const response = await createDelta({
          diffs,
          versionId: currentVersionId,
          roomId,
        });
        setPreviousCodeForDelta(debouncedCode.current ?? "");
      }

      
    })().catch( () => {
      console.log('Something Went Wrong in Creating Deltas !!');
    });
  }, [debouncedCode.current, roomId]);

  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) return;
    // console.log(editor);

    // editor.
    const disposable = editor.onDidChangeCursorSelection((event) => {
      const selection = event.selection;
      if (!selection) return;
      const selectedText = editor.getModel()?.getValueInRange(event.selection);

      // editor.setSelection()
      // console.log("Selected text:", selectedText);
      const range = new monaco.Range(
        selection.startLineNumber,
        selection.startColumn,
        selection.endLineNumber,
        selection.endColumn
      );
      if (selectedText) {
        const startPosition = editor.getScrolledVisiblePosition(
          selection.getStartPosition()
        );
        if (!startPosition) return;
        setIconPosition({
          top: startPosition.top,
          left: startPosition.left,
        });

        setSelectedRange(range);
        setSelectedText(selectedText);
      } else {
        setIconPosition(null);
        setSelectedRange(null);
        setSelectedText("");
        setIsAddingComment(false);
      }

      // const a : monaco.editor.IActionDescriptor

      // background-color : #FFD700;

      // applied when user successfully commented

      // editor.createDecorationsCollection([
      //   {
      //     range,
      //     options: {
      //       className: "border-b-2 border-solid",
      //     },
      //   },
      // ]);
    });

    return () => disposable.dispose();
  }, [editorRef.current]);

  useEffect(() => {
    if (!editorRef.current || !comments || comments.length === 0) return;

    let decorations: monaco.editor.IEditorDecorationsCollection | undefined;

    const updateDecorations = () => {
      if (!editorRef.current) return;

      const newDecorations = comments.flatMap((val) => {
        const range = val.selected_range;
        const text = editorRef.current?.getModel()?.getValueInRange(range);

        // Text On which user commented intially
        const { selected_text } = val;

        if (!text || text === "") return [];

        return [
          {
            range,
            options: {
              className: "bg-highlight border-b-2 border-highlightBorder",
            },
          },
        ];
      });

      decorations?.clear();
      decorations =
        editorRef.current.createDecorationsCollection(newDecorations);
    };

    // Initial decoration
    updateDecorations();

    // Listen for content changes in the editor
    const disposable = editorRef.current.getModel()?.onDidChangeContent(() => {
      updateDecorations();
    });

    console.log("Model", editorRef.current?.getModel()?.id);

    return () => {
      decorations?.clear();
      disposable?.dispose();
    };
  }, [editorRef.current, comments]);

  useEffect(() => {
    const init = async () => {
      if (!user) {
        notify("Login required to join", false);
        setTimeout(() => {
          navigate("/login");
        }, 2000);
        return;
      }
      try {
        const res = await getRoom(roomId || "");
        setRoom(res.room);
        if (res.room.participants.find((e: any) => e.id === user._id)) {
          setIsAllowed(true);
        } else {
          setIsAllowed(false);
          return;
        }
        socketRef.current = await initSocket();
        if (!socketRef.current) return <Navigate to={"/"} />;
        socketRef.current.on("connect_error", (err: string) => {
          handleError(err);
        });
        socketRef.current.on("connect_failed", (err: string) => {
          handleError(err);
        });
        // socketRef.current.emit(Actions.JOIN, {
        //   roomId,
        //   username: user?.user_name,
        // });

        // socketRef.current.on(
        //   Actions.JOINED,
        //   ({
        //     clients,
        //     username,
        //   }: {
        //     clients: Participant[];
        //     username: string;
        //     socketId: string;
        //   }) => {
        //     if (username != user?.user_name) {
        //       notify(username + " Joined", true);
        //     }
        //     setParticipants(clients);
        //   }
        // );
        // socketRef.current.on(
        //   Actions.SYNC_CODE,
        //   ({ code }: { code: string }) => {
        //     setCode(code);
        //   }
        // );
        socketRef.current.on(
          Actions.DISCONNECTED,
          ({ socketId, username }: { socketId: string; username: string }) => {
            notify(`${username} Left`, false);
            setParticipants((prev) => {
              return prev.filter((e) => e.socketId != socketId);
            });
          }
        );
      } catch (error: any) {
        notify(error.message, false);
        setTimeout(() => {
          navigate("/login");
        }, 1000);
        return;
      }

      const handleError = (err: string) => {
        console.log(err);
        return <ErrorBoundary />;
      };
    };

    init();
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current.off(Actions.JOINED);
        socketRef.current.off(Actions.DISCONNECTED);
      }
    };
  }, []);

  useEffect(() => {
    if (socketRef && socketRef.current) {
      socketRef.current.on(
        Actions.CODE_CHANGED,
        ({ code }: { code: string; user: User; position: any }) => {
          setCode(code);
        }
      );
    }
    return () => {
      if (socketRef && socketRef.current)
        socketRef.current.off(Actions.CODE_CHANGED);
    };
  }, [socketRef.current]);

  const editorOptions = {
    selectOnLineNumbers: true,
    fontSize: Number(fontSize),
  };
  const runCode = async () => {
    try {
      if (code.length == 0) {
        notify("Empty code", false);
        return;
      }
      setRunning(true);
      const response = await axios.post("code/execute", {
        code,
        language,
        userId,
      });
      const jobId = response.data.jobId;

      const intervalId = setInterval(async () => {
        const { data } = await axios.get("code/status", { params: { jobId } });
        if (data.success) {
          const { output, startedAt, completedAt, status } = data.data.job;
          if (status == "pending") {
            return;
          }
          clearInterval(intervalId);
          setOutput(output);
          const startedAt1: Date = new Date(startedAt);
          const completedAt1: Date = new Date(completedAt);
          const durationInMilliseconds: number =
            completedAt1.getTime() - startedAt1.getTime();
          setRunTime(durationInMilliseconds);
          setRunning(false);
        } else {
          clearInterval(intervalId);
          setOutput(data.data.job.output);
          setRunning(false);
        }
      }, 1000);
    } catch (error: any) {
      setRunning(false);
      if (error.response) {
        notify(error.response.data, false);
        return;
      }
      notify(error.message, false);
      console.error("Error running code:", error);
    }
  };

  if (!isAllowed) {
    return <ErrorBoundary />;
  }

  const handleCodeChange = (e: any, position: any) => {
    setCode(e);
    socketRef.current.emit(Actions.CODE_CHANGED, {
      roomId,
      code: e,
      user,
      position,
    });
  };

  const handleCommentSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const formData = new FormData(e.currentTarget);
    const comment = formData.get("comment");
    if (!comment || !selectedRange || !user?._id || !roomId || !selectedText)
      return;

    const newComment = {
      userId: user._id,
      roomId,
      comment: comment.toString(),
      selected_range: selectedRange,
      parent_id: null,
      selected_text: selectedText,
    };
    mutate(newComment);
  };

  const handleReplySubmit = (
    e: React.FormEvent<HTMLFormElement>,
    parent_id: string,
    selectedRange: IRange,
    selected_text: string
  ) => {
    e.preventDefault();

    const formData = new FormData(e.currentTarget);
    const comment = formData.get("comment");

    if (
      !comment ||
      !user?._id ||
      !selectedRange ||
      !roomId ||
      !parent_id ||
      !selected_text
    )
      return;

    const newComment = {
      userId: user._id,
      roomId,
      comment: comment.toString(),
      selected_range: selectedRange,
      parent_id,
      selected_text,
    };

    mutate(newComment);
    // e.currentTarget.firstChil

    // console.log(e.currentTarget.firstElementChild?.textContent)
  };
  const handleIconClick = () => {
    // Show your comment form here
    setIsAddingComment(true);
  };

  const handleCommentClick = (selected_range: IRange) => {
    if (editorRef.current) {
      const editor = editorRef.current;

      // Focus on the range
      editor.setSelection(selected_range);
      setIconPosition(null);
      editor.revealRangeInCenter(selected_range);

      // Highlight the range
      const decorations = editor.createDecorationsCollection([
        {
          range: selected_range,
          options: {
            className: "animate-highlight",
          },
        },
      ]);

      // Remove highlight after 1 second
      setTimeout(() => {
        decorations.clear();
      }, 1000);
    }
  };

  function handleSetRestoredCode(code: string) {
    setCode(code);
    setPreviousCodeForDelta(code);
    previousCodeForVersion.current = code;
    // What to do of Version Id,
  }

  // const handleVersionClick = (versionId: string, code: string) => {
  //   const { deltas } = getDeltas({versionId});
  //   const latestCode = applyDeltas(code, deltas);
  //   setCode(latestCode);
  // };

  // if (isCommentLoading) return <>Loding...</>;
  // if (isCommentError) return <>Error...</>;

  return (
    <>
      {showModal && participants ? (
        <RoomDetailsModal
          roomName={room?.name || ""}
          roomPassword={room?.password || ""}
          setShowModal={setShowModal}
          participants={participants}
        />
      ) : (
        <></>
      )}
      <Toaster />
      <SandBoxNav
        runCode={runCode}
        fontSize={fontSize}
        setFontSize={setFontSize}
        code={code}
        theme={theme}
        setTheme={setTheme}
        running={running}
        setCode={setCode}
        language={language}
        setLanguage={setLanguage}
        room={room}
        applyDeltas={applyDeltas}
        participants={participants}
        setShowModal={setShowModal}
        handleSetRestoredCode={handleSetRestoredCode}
      />

      <div className="flex relative">
        {iconPosition && (
          <div
            className="flex items-center gap-2 absolute cursor-pointer z-50 bg-[#2E2E2E] text-white p-2 rounded-md"
            style={{ top: iconPosition.top - 50, left: iconPosition.left }}
            onClick={handleIconClick}
          >
            <span>Comment</span>
            <MessageCirclePlusIcon className="" size={25} color="white" />
          </div>
        )}
        <ResizablePanelGroup
          direction="vertical"
          className="min-h-[80vh] max-w-[70vw] rounded-lg border"
          // className=""
        >
          <ResizablePanel defaultSize={75}>
            <MonacoEditor
              onChange={(e) => {
                // console.log(editorRef.current.getPosition())
                if (!e) return;
                debouncedContentChange(e);
                handleCodeChange(e, editorRef.current?.getPosition());
              }}
              onMount={(a) => {
                editorRef.current = a;
              }}
              value={code}
              height="100vh"
              width="70vw"
              options={editorOptions}
              language={language}
              theme={theme}
            />
          </ResizablePanel>
          <ResizableHandle withHandle={true} />
          <ResizablePanel defaultSize={25} minSize={15}>
            <div className="bg-black border text-green-400 h-full w-full">
              <h2>Output:</h2>
              <pre className="text-green-400 break-all whitespace-pre-wrap">
                {output}
              </pre>
              <h4>Completed in {runTime} ms</h4>
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>

        <div className="bg-[#1E1E1E] w-[30vw] text-white rounded-lg shadow-lg h-[80vh] overflow-y-auto">
          <div className="px-4 py-4 border-b border-gray-700">
            <h2 className="text-xl font-semibold">Comments and Suggestions</h2>
          </div>

          {!isAddingComment && comments && comments.length <= 0 && (
            <div className="h-full flex justify-center items-center bg-[#1E1E1E]">
              No Comments Or Replies
            </div>
          )}

          {((comments && comments.length > 0) || isAddingComment) && (
            <div className="bg-[#2E2E2E] flex flex-col items-center p-5 rounded-b-lg">
              {isAddingComment && (
                <>
                  <div className="flex justify-between w-full mb-4">
                    <div className="flex items-center gap-3 p-2">
                      <div
                        title={user?.user_name}
                        className={`flex items-center justify-center w-10 h-10 text-white shadow-xl rounded-full bg-[${stringToColor(
                          user?.user_name ?? "guest"
                        )}]`}
                      >
                        {user?.user_name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex flex-col">
                        <div className="capitalize text-xl">
                          {user?.user_name}
                        </div>
                        <div className="text-gray-500 text-xs">
                          {/* {dateConverter(new Date())} */}
                          Draft
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <TiTick
                        className="text-gray-400 cursor-pointer hover:text-gray-300 transition duration-300"
                        size={25}
                      />
                      <MdDelete
                        className="text-gray-400 cursor-pointer hover:text-red-500 transition duration-300"
                        size={25}
                      />
                    </div>
                  </div>
                  <form
                    className="w-full flex items-center gap-3 pb-2"
                    onSubmit={handleCommentSubmit}
                  >
                    <input
                      name="comment"
                      type="text"
                      placeholder="Add your Comment..."
                      className="bg-[#2E2E2E] p-3 rounded-lg flex-grow text-white focus:outline-none focus:ring-2 focus:ring-gray-600"
                    />
                    <button
                      type="submit"
                      className="bg-gray-600 p-3 rounded-full hover:bg-gray-500 transition duration-300"
                    >
                      <SendHorizontal className="text-white" size={20} />
                    </button>
                  </form>
                </>
              )}
              {comments &&
                comments.map((comment) => (
                  <>
                    <div
                      key={comment._id}
                      className="w-full mb-4 p-2 border-b border-gray-600"
                    >
                      <MessageBox
                        comment={{
                          selected_text: comment.selected_text,
                          _id: comment._id,
                          authorId: comment.authorId,
                          createdAt: comment.createdAt,
                          message: comment.message,
                          roomId: comment.roomId,
                          user_name: comment.user_info.user_name,
                          updatedAt: comment.updatedAt,
                          parent_id: comment.parent_id,
                          selected_range: comment.selected_range,
                        }}
                        handleCommentClick={handleCommentClick}
                      />

                      {comment.replies &&
                        comment.replies.length > 0 &&
                        comment.replies.map((reply) => (
                          <MessageBox
                            comment={{
                              _id: reply._id,
                              selected_text: reply.selected_text,
                              authorId: reply.authorId,
                              createdAt: reply.createdAt,
                              message: reply.message,
                              roomId: reply.roomId,
                              user_name: reply.RepliedUserInfo.user_name,
                              updatedAt: reply.updatedAt,
                              parent_id: reply.parent_id,
                              selected_range: reply.selected_range,
                            }}
                            handleCommentClick={handleCommentClick}
                          />
                        ))}
                    </div>
                    <form
                      className="w-full flex items-center gap-3 mt-3"
                      onSubmit={(e) =>
                        handleReplySubmit(
                          e,
                          comment._id,
                          comment.selected_range,
                          comment.selected_text
                        )
                      }
                    >
                      <input
                        type="text"
                        name="comment"
                        placeholder="Add your Reply..."
                        className="bg-[#2E2E2E] p-3 rounded-lg flex-grow text-white focus:outline-none focus:ring-2 focus:ring-gray-600"
                      />
                      <button
                        type="submit"
                        className="bg-gray-600 p-3 rounded-full hover:bg-gray-500 transition duration-300"
                      >
                        <SendHorizontal className="text-white" size={20} />
                      </button>
                    </form>
                  </>
                ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

// const VersionCard = ({ dateTime } : {dateTime : Date}) => {
//   return (

//       <div className="bg-[#2E2E2E] p-6 rounded-lg shadow-md text-white w-full mx-auto hover:shadow-lg duration-300 ease-in-out">
//         <div className="flex flex-col items-start">
//           <p className="text-lg font-bold mb-1">{formatDateToString(dateTime)}</p>
//         </div>
//       </div>
//   );
// };

export default CollaborativeSandBox;
