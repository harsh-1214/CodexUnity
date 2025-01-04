import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import useRoomService from "@/hooks/useRoom";
import { DeltaInterface } from "@/types/room";
import { cn, formatDateToString } from "@/utils/cn";
import { notify } from "@/utils/notify";
import MonacoEditor from "@monaco-editor/react";
import { useQuery } from "@tanstack/react-query";
import { HistoryIcon, Loader2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { FaCalendarAlt} from "react-icons/fa";

export default function VersionBox({
  roomId,
  applyDeltas,
  handleSetRestoredCode
}: {
  roomId: string | undefined;
  applyDeltas: (initialcode: string, deltas: DeltaInterface[]) => string;
  handleSetRestoredCode : (code : string,versionId : string) => void
}) {
  const editorOptions = {
    selectOnLineNumbers: true,
    fontSize: Number(16),
  };

  const { getAllversions, getDeltaByVersionId } = useRoomService();
  const [code, setCode] = useState("");
  const [language, setLanguage] = useState("");
  const [selectedVersion, setSelectedVersion] = useState<number>(0);
  const [isRestoreLoading,setIsRestoreLoading] = useState(false);
  const dialogCloseRef = useRef<HTMLButtonElement>(null);


  const {
    data: versions,
  } = useQuery({
    queryKey: ["versions", { roomId }],
    queryFn: getAllversions,
  });

  async function handleVersionClick(
    versionId: string,
    code: string,
    language: string,
    index : number
  ) {
    try {
      const deltas = await getDeltaByVersionId(versionId);
      setLanguage(language);
      const latestcode = applyDeltas(code, deltas);
      setCode(latestcode);
      setSelectedVersion(index);
    } catch (err: any) {
      notify("Error In getting Version", false);
      console.log("Something went Wrong!");
    }
  }

  
  useEffect(() => {
    if(!versions) return;
    handleVersionClick(versions[0]._id,versions[0].code,versions[0].language,0);
  } ,[versions]);
  
  function handleRestore(){
    if(!versions) return;
    setIsRestoreLoading(true);
    console.log(versions[selectedVersion]._id);
    handleSetRestoredCode(code,versions[selectedVersion]._id);
    setIsRestoreLoading(false);
    dialogCloseRef.current?.click();
  }
  return (
    <Dialog>
      <DialogTrigger asChild>
        <button className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition duration-300">
          <HistoryIcon className="inline-block mr-2" size={20} />
          Versions
        </button>
      </DialogTrigger>
      <DialogContent
        aria-describedby={undefined}
        className="w-full max-w-[90vw] h-[90vh] bg-[#1e1e1e] flex text-white rounded-lg shadow-lg p-4"
      >
        <DialogTitle className="hidden"></DialogTitle>
        <MonacoEditor
          value={code}
          className="h-full border-gray-500"
          width="80vw"
          options={{
            ...editorOptions,
            readOnly: true,
          }}
          language={language}
          theme={"vs-dark"}
        />
        <div className="w-[20vw] border-l border-gray-700 pl-4">
          <div className="bg-[#1E1E1E] text-white rounded-lg shadow-lg h-full flex flex-col">
            <div className="px-4 py-4 border-b border-gray-700">
              <h2 className="text-xl font-semibold">Versions and History</h2>
            </div>
            <div className="flex-grow overflow-y-auto">
              {versions && versions.length > 0 && 
                versions.map((version, index) => (
                  <div
                    className="flex-grow"
                    key={version._id}
                    onClick={() =>
                      handleVersionClick(
                        version._id,
                        version.code,
                        version.language,
                        index
                      )
                    }
                  >
                    <div
                      className={cn(
                        selectedVersion !== index
                          ? "bg-[#2a2a2a]"
                          : "bg-[#3A3A3A]",
                        "p-4 rounded-lg shadow-md text-white w-full mx-auto hover:shadow-lg hover:bg-[#3A3A3A] transition duration-300 ease-in-out mb-2"
                      )}
                    >
                      <div className="flex flex-col items-start">
                        <div className="flex justify-between items-center w-full mb-2">
                          <p className="text-lg font-bold">
                            {formatDateToString(new Date(version.createdAt))}
                          </p>
                          <div className="text-gray-400 text-xs">
                            <FaCalendarAlt />
                          </div>
                        </div>
                        <div className="text-sm text-gray-400">
                          <p>Version preview shown here</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
            <div className="px-4 py-2 border-t border-gray-700">
              <Button
                className="w-full flex items-center gap-1 bg-blue-500 hover:bg-blue-600 text-white transition duration-300 ease-in-out rounded-lg"
                disabled = {isRestoreLoading}
                onClick={handleRestore}
              >
                Restore
                {
                  isRestoreLoading && <Loader2 size={20} className="animate-spin"/>
                }
              </Button>
            </div>
          </div>
        </div>
        <DialogClose ref = {dialogCloseRef}/>

      </DialogContent>
    </Dialog>
  );
}
