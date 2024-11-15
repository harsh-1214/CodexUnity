import { CommentInterface, IRange } from "@/types/room";
import { cn, dateConverter, stringToColor } from "@/utils/cn";
import { MdDelete } from "react-icons/md";
import { TiTick } from "react-icons/ti";

const MessageBox = ({
  comment,
  handleCommentClick,
}: {
  comment: CommentInterface & {
    user_name: string;
  };
  handleCommentClick: (selected_range: IRange) => void;
}) => {
  const color = stringToColor(comment.user_name);
  return (
    <>
      <div className="flex justify-between my-3">
        <div className="flex items-center gap-3">
          <div
            title={comment.user_name}
            className={cn(
              "flex items-center justify-center w-8 h-8 text-white shadow-xl rounded-full",
              `bg-[` + color + `]`
              // 'bg-blue-100'
            )}
          >
            {comment.user_name.charAt(0).toUpperCase()}
            {/* Harsh */}
          </div>
          <div className="flex flex-col">
            <div className="capitalize text-lg">{comment.user_name}</div>
            <div className="text-gray-500 text-xs">
              {dateConverter(new Date(comment.createdAt))}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <TiTick
            className={cn(
              "text-gray-400 cursor-pointer hover:text-gray-300 transition duration-300",
              comment.parent_id !== null && "hidden"
            )}
            size={20}
          />
          <MdDelete
            className="text-gray-400 cursor-pointer hover:text-red-500 transition duration-300"
            size={20}
          />
        </div>
      </div>
      <div
        className="mt-2 text-white"
        onClick={() => handleCommentClick(comment.selected_range)}
      >
        {comment.message}
      </div>
    </>
  );
};

export default MessageBox;
