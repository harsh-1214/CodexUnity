import React, { useEffect, useRef, useState } from "react";
import MonacoEditor from "@monaco-editor/react";
import { Toaster } from "react-hot-toast";
import { notify } from "../utils/notify";
import { useAppSelector } from "../app/hooks";
import SandBoxNav from "../components/SandBoxNav";
import { useParams } from "react-router-dom";
import useAxios from "../hooks/useAxios";

// import {
//   ResizableHandle,
//   ResizablePanel,
//   ResizablePanelGroup,
// } from "@/components/ui/resizable";

const SandBox: React.FC = () => {
  const [output, setOutput] = useState<string>("");
  const [language, setLanguage] = useState<string>("javascript");
  const [code, setCode] = useState<string>("");
  const [theme, setTheme] = useState<string>("vs-dark");
  const [fontSize, setFontSize] = useState<string>("16");
  const [running, setRunning] = useState<boolean>(false);
  const [runTime, setRunTime] = useState<number>(0);
  const { fileId } = useParams();

  useEffect(() => {
    fetchData();
  }, []);
  const axios = useAxios();
  const fetchData = async () => {
    try {
      const response = await axios.get(`code/file/${fileId}`);
      setCode(response.data.data.sandBox.code);
      setLanguage(response.data.data.sandBox.language || language);
    } catch (error: any) {
      notify(error.response.data.message, false);
      console.log(error);
    }
  };

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
      setRunning(false);
      notify(error.response.data.message || error.message, false);
      console.error("Error running code:", error);
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
      </div>
    </div>
  );
};

export default SandBox;
