import express from "express";
import { verfiyJWT } from "../Middleware/userverifymiddlware.js";
import { addProblemInPlaylist, createPlaylist, deletePlaylist, getallproblemsfromPlaylist, getplaylistdetailsByPlaylistID, removeProblemFromPlaylist } from "../Controller/playlist_controller.js"
;

const router =express.Router();

router.post("/create-playlist", verfiyJWT, createPlaylist)
router.post("/:playlistID/add-problem", verfiyJWT, addProblemInPlaylist)
router.get("/", verfiyJWT, getallproblemsfromPlaylist )
router.get("/:playlistID", verfiyJWT, getplaylistdetailsByPlaylistID)
router.delete("/:playlistID", verfiyJWT, deletePlaylist)
router.post("/:playlistID/remove-problems", verfiyJWT, removeProblemFromPlaylist)

export default router;

