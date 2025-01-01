import { CommentWithReplies, IRange, VersionInterface } from '@/types/room';
import useAxios from '../hooks/useAxios';
import { Diff } from 'diff-match-patch';
const useRoomService = () => {
    const api = useAxios();
    const createRoom = async ({ name, password, authorId,authorName }: { name: string, password: string, authorId: string,authorName:string }) => {
        try {
            const { data } = await api.post(`room`, { name, password, authorId,authorName});
            return data.data;
        } catch (error:any) {
            throw new Error(error.response?.data.message || 'Something went wrong');
        }
    };
    const joinRoom = async ({ name, password, userId,userName }: { name: string, password: string, userId: string,userName:string }) => {
        try {
            const { data } = await api.post(`room/join`, { name, password, userId,userName});
            return data.data;
        } catch (error:any) {
            throw new Error(error.response?.data.message || 'Something went wrong');
        }
    };

    const getAllComments = async ({queryKey} : {queryKey : [string,{roomId : string | undefined}]}) => {
        const [_key,{roomId}] = queryKey;
        if(!roomId){
            throw new Error('Please Provide RoomId');
        }
        try {
            const { data } = await api.get(`room/get-comments/${roomId}`)
            const res : { allCommentsInARoom : CommentWithReplies[]} = data.data
            return res.allCommentsInARoom;
        } catch (error : any) {
            throw new Error(error.response?.data.message || 'Failed To fetch comments');
        }
    }
    const getAllversions = async ({queryKey} : {queryKey : [string,{roomId : string | undefined}]}) => {
        const [_key,{roomId}] = queryKey;
        if(!roomId){
            throw new Error('Please Provide RoomId');
        }
        try {
            const { data } = await api.get(`room/get-versions/${roomId}`)
            const res : VersionInterface[] = data.data
            return res
        } catch (error : any) {
            throw new Error(error.response?.data.message || 'Failed To fetch comments');
        }
    }

    // 

    const postCommentOrReplies = async({userId, comment, selected_range, roomId,parent_id,selected_text} : {
        userId : string,
        comment : string,
        selected_range : IRange,
        roomId : string,
        parent_id : string | null,
        selected_text : string,
    }) => {

        // console.log({userId, comment, selected_range, roomId,parent_id})

        try {
            const {data} = await api.post('/room/post-comment',{userId, comment, selected_range, roomId,parent_id,selected_text})
            return data.data
        } catch (error : any) {
            throw new Error(error.response?.data.message || 'Something went wrong');
        }

    }

    const getRoom = async (roomId:string) => {
        try {
            const { data } = await api.get(`room/${roomId}`);
            return data.data;
        } catch (error:any) {
            throw new Error(error.response?.data.message || 'Something went wrong');
        }
    };

    const createVersion = async({roomId,code,language} : {roomId : string,code:string,language : string}) => {
        try {
            const {data} = await api.post('/room/create-version',{roomId,code,language})
            return data.data;
        } catch (error : any) {
            throw new Error(error.response?.data.message || 'Something went wrong');
        }
    }

    const createDelta = async({roomId,versionId,diffs} : {roomId : string,versionId : string,diffs : Diff[] }) => {
        try {
            console.log(roomId,versionId,diffs);
            const {data} = await api.post('/room/create-delta',{roomId,versionId,diffs});
            return data.data;
        } catch (error : any) {
            throw new Error(error.response?.data.message || 'Something went wrong');
        }
    }

    const loadIntialVersionAndDeltas = async(roomId : string) => {
        try {
            const {data} = await api.post('/room/get-version-and-deltas',{roomId});
            return data.data
        } catch (error : any) {
            throw new Error(error.response?.data.message || 'Something went wrong');
        }
    }

    const getDeltaByVersionId = async(versionId : string) => {
        try {
            const {data} = await api.get(`/room/get-delta/${versionId}`);
            return data.data
        } catch (error : any) {
            throw new Error(error.response?.data.message || 'Something went wrong');
        }

    }

    const updateVersionId = async({versionId,roomId} : {versionId : string,roomId : string}) => {
        try {
            const {data} = await api.post(`/room/update-version/`,{versionId,roomId});
            return data.data
        } catch (error : any) {
            throw new Error(error.response?.data.message || 'Something went wrong');
        }    
    }


    return { createRoom,getRoom,joinRoom ,getAllComments,postCommentOrReplies,createVersion,createDelta,loadIntialVersionAndDeltas,getAllversions,getDeltaByVersionId,updateVersionId};
};
export default useRoomService;
