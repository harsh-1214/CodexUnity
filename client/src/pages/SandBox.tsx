import React, { useEffect, useRef, useState } from "react";
import * as monaco from "monaco-editor";
import MonacoEditor from "@monaco-editor/react";
import { Toaster } from "react-hot-toast";
import { notify } from "../utils/notify";
import { useAppSelector } from "../app/hooks";
import SandBoxNav from "../components/SandBoxNav";
import { useParams } from "react-router-dom";
import useAxios from "../hooks/useAxios";

import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";

const SandBox: React.FC = () => {
  const [output, setOutput] = useState<string>("");
  const [language, setLanguage] = useState<string>("javascript");
  const [code, setCode] = useState<string>("");
  const [theme, setTheme] = useState<string>("vs-dark");
  const [fontSize, setFontSize] = useState<string>("16");
  const [running, setRunning] = useState<boolean>(false);
  const [runTime, setRunTime] = useState<number>(0);
  const { fileId } = useParams();
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);

  useEffect(() => {
    fetchData();
  }, []);
  const axios = useAxios();
  const fetchData = async () => {
    try {
      const response = await axios.get(`code/file/${fileId}`);
      setCode(response.data.data.sandBox.code);
      setLanguage(response.data.data.sandBox.language);
    } catch (error: any) {
      notify(error.response.data.message, false);
      console.log(error);
    }
  };

  useEffect(() => {
    if (editorRef.current) {
      const editor = editorRef.current;
      console.log(editor);

      editor.onDidChangeCursorSelection((event) => {
        const selectedText = editor
          .getModel()
          ?.getValueInRange(event.selection);

        console.log("Selected text:", selectedText);
        const selection = editor.getSelection();
        console.log(selection);
        if (!selection) return;
        const range = new monaco.Range(
          selection.startLineNumber,
          selection.startColumn,
          selection.endLineNumber,
          selection.endColumn
        );

        // background-color : #FFD700;

        editor.createDecorationsCollection([
          {
            range,
            options: {
              className: "border-b-2 border-solid",
            },
          },
        ]);
      });

      // Event triggered when the text content changes, helps in version control
      // editor.onDidChangeModelContent( (ev) => {

      // })
    }
  }, [editorRef.current]);

  const userId = useAppSelector((state) => {
    return state.auth.user?._id;
  });

  const editorOptions = {
    selectOnLineNumbers: true,
    fontSize: Number(fontSize),
  };
  const runCode = async () => {
    try {
      if (code.length === 0) {
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
      console.log(error);
      setRunning(false);
      // return
      // if (error.response) {
      //   notify(error.response.data, false);
      //   return;
      // }
      notify(error.response.data || error.message, false);
      console.error("Error running code:", error);
      return;
    }
  };
  return (
    <div>
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
      />

      <div className="flex">
        <MonacoEditor
          onMount={(editor) => {
            editorRef.current = editor;
          }}
          value={code}
          height="80vh"
          width="70vw"
          options={editorOptions}
          language={language}
          theme={theme}
          onChange={(val) => {
            setCode(val || "");
          }}
        />
        <div className="bg-black border text-green-400 h-[80vh] w-[40%]">
          <h2>Output:</h2>
          <pre className="text-green-400 break-all whitespace-pre-wrap">
            {output}
          </pre>
          <h4>Completed in {runTime} ms</h4>
        </div>

        {/* <div className="bg-[#1E1E1E] w-[30vw] text-white">
          dsdasdasdasd
          {/* <MonacoEditor
          onMount={(editor) => {
            editorRef.current = editor;
          }}
          value={code}
          height="100vh"
          width="70vw"
          options={editorOptions}
          language={language}
          theme={theme}
          onChange={(val) => {
            setCode(val || "");
          }}
        /> */}
          {/* <div className="bg-black border text-green-400 w-[40%]">
          <h2>Output:</h2>
          <pre className="text-green-400">{output}</pre>
          <h4>Completed in {runTime} ms</h4>
        </div> }
        </div> */}
      </div>
    </div>
  );
};

export default SandBox;
