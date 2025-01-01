import { Link, Navigate, useNavigate } from "react-router-dom";
import { User } from "../types/user";
import Loader from "../components/ui/Loader";
import useCodeService from "../hooks/useCode";
import { useEffect, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { File } from "../types/code";
import { cn, dateConverter } from "../utils/cn";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import useRoomService from "@/hooks/useRoom";
import { notify } from "@/utils/notify";
import { Toaster } from "react-hot-toast";
import { useAppSelector } from "@/app/hooks";
const Home = ({ user }: { user: User }) => {
  const [showDelModal, setShowDelModal] = useState<boolean>(false);
  const [fileSelected, setFileSelected] = useState<string>("");
  const navigate = useNavigate();
  const { createRoom, joinRoom } = useRoomService();
  const [roomId, setRoomId] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [title, setTitle] = useState<string>("");
  const {createFile} = useCodeService();
  const token = useAppSelector((state) => state.auth.token);

  const {mutate} = useMutation({
    mutationKey:["createfile"],
    mutationFn: createFile,
    onSuccess:(data)=>{
      navigate(`/sandbox/${user?._id}/${data.sandBox._id}`);
    },
    onError:(data)=>{
      notify(data.message, false);
    }
  });

  const handleCreateFile = async () => {
    try {
      if (!token) {
        notify("Not allowed", false);
        return;
      }
      if (title.length < 3) {
        notify("Title is too short", false);
        return;
      }
      mutate({title});
    } catch (error: any) {
      notify(error.message, false);
    }
  };


  // const handleToggle = () => {
  //     setCreate(!create);
  //     setRoomId("");
  //     setPassword("");
  // };
  const handleCreateRoom = async () => {
    try {
      if (!user) {
        notify("Not Allowed to create. Please Login", false);
        return;
      }
      const res = await createRoom({
        name: roomId,
        password,
        authorId: user._id,
        authorName: user.user_name,
      });
      notify("Room created!", true);
      setTimeout(() => {
        navigate(`/collab/${res.room._id}`);
      }, 2000);
    } catch (error: any) {
      if (error.response) notify(error.response.message, false);
      else notify(error.message, false);
    }
  };
  const handleJoinRoom = async () => {
    try {
      if (!user) {
        notify("Not Allowed to create. Please Login", false);
        return;
      }
      const res = await joinRoom({
        name: roomId,
        password,
        userId: user._id,
        userName: user.user_name,
      });
      notify("Room joined sucessfully", true);
      setTimeout(() => {
        navigate(`/collab/${res.room._id}`);
      }, 2000);
    } catch (error: any) {
      if (error.response) notify(error.response.message, false);
      else notify(error.message, false);
    }
  };

  const { getAllFiles } = useCodeService();
  const {
    data: files,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["files"],
    queryFn: getAllFiles,
  });

  if (isLoading) return <Loader />;
  if (error) {
    return <Navigate to={"*"} />;
  }

  return (
    <div className="w-full h-[80vh] p-5">
      <Toaster />
      <div className="container border-5 h-full mx-auto">
        <div className="w-[70%] mx-auto h-full flex justify-center">
          <div className="border-5 w-[60%]">
            <div className="flex justify-between mb-2">
              <DialogComponentRoom
                roomId={roomId}
                password={password}
                setRoomId={setRoomId}
                setPassword={setPassword}
                handleCreateRoom={handleCreateRoom}
                handleJoinRoom={handleJoinRoom}
              />
              {/* <Button variant={"default"}>Start a new File</Button> */}
              <DialogComponentCreateFile title = {title} setTitle = {setTitle} handleCreateFile = {handleCreateFile} />
              {/* <CardWithForm/> */}
              {/* <CommentBoxDisplay comments={comments}/> */}
            </div>

            {/* listing */}
            {/* <AllSandBoxs/> */}
            <div>

              <ul className="flex w-full max-w-[730px] flex-col gap-5">
                {files && files.length > 0 && 
                  files.map((file: File) => (
                    <li  key = {file._id} className="flex items-center justify-between gap-4 rounded-lg bg-doc bg-cover p-5 shadow-xl">
                      <Link to = {`/sandbox/${user?._id}/${file._id}`} className="flex flex-1 items-center gap-4">
                        <div className="hidden rounded-md bg-dark-500 p-2 sm:block">
                          <img
                            src={cn(
                              file.language === "c" && "/c.png",
                              (file.language === "javascript" || file.language === '') &&
                                "/javascript.png",
                              file.language === "cpp" && "/cpp.png",
                              file.language === "python" && "/python.png",
                              file.language === "java" && "/java.png"
                            )}
                            alt="file"
                            width={40}
                            height={40}
                          />
                        </div>
                        <div className="space-y-1">
                          <p className="line-clamp-1 text-lg">{file.title}</p>
                          <p className="text-sm">
                            Created about {dateConverter(file.createdAt)}
                          </p>
                        </div>
                      </Link>
                      {/* <DeleteModal roomId={id} /> */}
                    </li>
                  ))}
              </ul>
              
              {
                files && files.length === 0 && ( <div className="flex h-[70vh] w-full justify-center items-center bg-doc rounded-lg shadow-md"> <p className="text-gray-500 font-semibold">Sorry, there are no files available.</p> </div> )
              }
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // return (
  //   <div className="min-h-[50rem] px-8 w-full pb-10 dark:bg-black bg-white  dark:bg-dot-white/[0.2] bg-dot-black/[0.2] relative flex flex-col ">

  //   <div className="absolute pointer-events-none inset-0 flex flex-col dark:bg-black bg-white [mask-image:radial-gradient(ellipse_at_center,transparent_40%,black)]"></div>
  //   <p className="text-4xl sm:text-7xl font-bold relative z-20 bg-clip-text text-transparent bg-gradient-to-b from-neutral-200 to-neutral-500 py-8 text-center">
  //     Hey {user.user_name}!
  //   </p>
  //       <AllSandBoxs/>
  // </div>

  // )
};

export function DialogComponentCreateFile({
  title,
  setTitle,
  handleCreateFile
} : {
  title : string,
  setTitle : React.Dispatch<React.SetStateAction<string>>,
  handleCreateFile : () => Promise<void>
}) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="default">Create File</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            Let's Start
            {/* {isCreating ? "Let's Create a Room" : "Join a Room"} */}
          </DialogTitle>
          <DialogDescription>
            {/* Make changes to your profile here. Click save when you're done. */}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          {/* grid grid-cols-4 items-center gap-4 */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">
              File Name
            </Label>
            <Input
              id="title"
              value={title}
              onChange={(ev) => setTitle(ev.target.value)}
              className="col-span-3"
            />
          </div>
          {/* <div className="grid grid-cols-4 items-center gap-4 ">
            <Label htmlFor="username" className="text-right">
              Password
            </Label>
            <Input
              id="password"
              value={password}
              onChange={(ev) => setPassword(ev.target.value)}
              className="col-span-3"
            />
          </div> */}
        </div>
        <DialogFooter className="">
          <Button
            type="submit"
            className="w-full"
            onClick={() => {
              handleCreateFile()
            }}
          >
            {/* {isCreating ? "Create Room" : "Join Room"} */}
            Next
          </Button>
          {/* <Button variant={'outline'}>Join Room</Button> */}
          {/* <div className="text-sm text-center p-2">
            { {isCreating ? "Already have a Room ? " : "Don't have a room ? "} }
            <button
              className="underline"
              onClick={() => setIsCreating((prev) => !prev)}
            >
              {!isCreating ? "Create Room" : "Join Room"}
            </button>
          </div> */}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function DialogComponentRoom({
  setPassword,
  setRoomId,
  password,
  roomId,
  handleCreateRoom,
  handleJoinRoom,
}: {
  setRoomId: React.Dispatch<React.SetStateAction<string>>;
  setPassword: React.Dispatch<React.SetStateAction<string>>;
  roomId: string;
  password: string;
  handleCreateRoom: () => Promise<void>;
  handleJoinRoom: () => Promise<void>;
}) {
  const [isCreating, setIsCreating] = useState(true);

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="default">Create a Room</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {isCreating ? "Let's Create a Room" : "Join a Room"}
          </DialogTitle>
          <DialogDescription>
            {/* Make changes to your profile here. Click save when you're done. */}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          {/* grid grid-cols-4 items-center gap-4 */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">
              Room Name
            </Label>
            <Input
              id="roomId"
              value={roomId}
              onChange={(ev) => setRoomId(ev.target.value)}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4 ">
            <Label htmlFor="username" className="text-right">
              Password
            </Label>
            <Input
              id="password"
              value={password}
              onChange={(ev) => setPassword(ev.target.value)}
              className="col-span-3"
            />
          </div>
        </div>
        <DialogFooter className="">
          <Button
            type="submit"
            className="w-full"
            onClick={() => {
              isCreating ? handleCreateRoom() : handleJoinRoom();
            }}
          >
            {isCreating ? "Create Room" : "Join Room"}
          </Button>
          {/* <Button variant={'outline'}>Join Room</Button> */}
          <div className="text-sm text-center p-2">
            {isCreating ? "Already have a Room ? " : "Don't have a room ? "}
            <button
              className="underline"
              onClick={() => setIsCreating((prev) => !prev)}
            >
              {!isCreating ? "Create Room" : "Join Room"}
            </button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default Home;
