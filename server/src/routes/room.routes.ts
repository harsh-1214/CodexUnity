import express from 'express';
import { createComment, createDelta, createRoom, createVersion, getCommentsByRoomId, getDeltaByVersionId, getLatestVersionAndDeltas, getRoomById,getVersionsByRoomId,joinRoom } from '../controller/room';
import {authMiddleware} from '../middleware/authMiddleware'
const router = express.Router();

router.post("/",authMiddleware,createRoom);
router.get("/:roomId",getRoomById);
router.post("/join",authMiddleware,joinRoom);
router.patch("/",)
router.get('/get-comments/:roomId',getCommentsByRoomId);
router.get('/get-versions/:roomId',getVersionsByRoomId);
router.post('/post-comment',createComment);
router.post('/create-delta',createDelta);
router.post('/get-version-and-deltas',getLatestVersionAndDeltas)
router.post('/create-version',createVersion);
router.get('/get-delta/:versionId',getDeltaByVersionId)
export default router;