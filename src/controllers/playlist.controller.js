import mongoose, { isValidObjectId } from "mongoose"
import { Playlist } from "../models/playlist.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { Video } from "../models/video.model.js";


//TODO: create playlist
const createPlaylist = asyncHandler(async (req, res) => {
    const { name, description } = req.body

    if (!(name && description)) {
        throw new ApiError(400, "Playlist name and description are required")
    }

    const playList = await Playlist.create({
        name: name.trim(),
        description: description.trim(),
        owner: req.user._id,
    })

    if (!playList) {
        throw new ApiError(500, "Something went wrong while creating playlist")
    }

    return res.status(201).json(
        new ApiResponse(200, { playList }, `you successfully create a playlist.`)
    )
})

const getUserPlaylists = asyncHandler(async (req, res) => {
    const { userId } = req.params

    if (!userId) {
        throw new ApiError(400, "userId param is required For get user playlists")
    }


    const getPlaylist = await Playlist.aggregate([
        {
            $match: {
                owner: new mongoose.Types.ObjectId(userId.trim())
            }
        },
        {
            $sort: {
                createdAt: 1
            }
        },
        {
            $project: {
                name: 1,
                description: 1,
            }
        },

    ]);
    // const getPlaylist = await Playlist.find({
    //     owner: new mongoose.Types.ObjectId(userId.trim())
    // })

    if (!getPlaylist) {
        throw new ApiError(500, "Something went wrong can not fetch playlist data")
    }

    return res.status(201).json(
        new ApiResponse(200, { getPlaylist }, `PlayLists Data fetch successfully.`)
    )
})

const getPlaylistById = asyncHandler(async (req, res) => {
    const { playlistId } = req.params
    //TODO: get playlist by id
    if (!playlistId) {
        throw new ApiError(400, "playlistId param is required for get user playlist by id")
    }

    const getPlaylistById = await Playlist.findById(playlistId).select("-createdAt -updatedAt")

    if (!getPlaylistById) {
        throw new ApiError(500, "Something went wrong can't fetch playlistById data")
    }

    return res.status(201).json(
        new ApiResponse(200, { getPlaylistById }, `PlayLists Data fetch successfully.`)
    )
})

const addVideoToPlaylist = asyncHandler(async (req, res) => {

    const { playlistId, videoId } = req.params

    if (!(playlistId && videoId)) {
        throw new ApiError(400, "playlistId and videoId param is required.")
    }

    const video = await Video.findById((videoId.trim()))

    if (!video) {
        throw new ApiError(404, `Video ID:${videoId} not matched with any other data.`)
    }

    const playlist = await Playlist.findById(playlistId.trim());

    if (!playlist) {
        throw new ApiError(404, "Playlist not found");
    }

    if (playlist.owner?.toString() !== req.user?._id?.toString()) {
        throw new ApiError(401, "You cannot add video to this playlist");
    }

    const isExist = playlist.videos.findIndex(v => v.toString() === video._id?.toString());

    if (isExist !== -1) {
        throw new ApiError(400, "This video is already in this playlist");
    }

    playlist.videos.push(video._id);
    await playlist.save();

    return res.status(201).json(
        new ApiResponse(200, { playlist }, `Video save into playlist colletion successfully.`)
    )

})

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    const { playlistId, videoId } = req.params
    // TODO: remove video from playlist

    if (!(playlistId && videoId)) {
        throw new ApiError(400, "playlistId and videoId param is required.")
    }

    const videoPlaylist = await Playlist.findById(playlistId);

    if (!videoPlaylist) {
        throw new ApiError(404, "playlistId is not found.")
    }

    const removeVideoIndex = videoPlaylist.videos.findIndex(vId => vId.toString() === videoId)

    if (removeVideoIndex === -1) {
        throw new ApiError(404, `Id:${videoId} not Exist.`)
    }

    videoPlaylist.videos.splice(removeVideoIndex, 1);
    await videoPlaylist.save();

    return res.status(201).json(
        new ApiResponse(200, { videoPlaylist }, `Video removed from playlist colletion successfully.`)
    )
})

const deletePlaylist = asyncHandler(async (req, res) => {
    const { playlistId } = req.params
    // TODO: delete playlist

    if (!(playlistId)) {
        throw new ApiError(400, "playlistId is required.")
    }

    const removePlaylist = await Playlist.findByIdAndDelete(playlistId)

    if (!removePlaylist) {
        throw new ApiError(500, "Something want wrong we can't delete this playlistId. Please try after some time.");
    }

    return res.status(201).json(
        new ApiResponse(200, { removePlaylist }, `playlist delete successfully.`)
    )
})

const updatePlaylist = asyncHandler(async (req, res) => {
    const { playlistId } = req.params
    const { name, description } = req.body
    //TODO: update playlist
    if (!playlistId || !name || !description) {
        throw new ApiError(400, "PlaylistId , Name, Description are required");
    }

    const updatedPlaylist = await Playlist.findByIdAndUpdate(playlistId, { name, description }, { new: true })

    if (!updatedPlaylist) {
        throw new ApiError(500, "Something went wrong, we couldn't update this playlistId. Please try again later.");
    }

    return res.status(201).json(
        new ApiResponse(200, { updatedPlaylist }, "Playlist updated sucessfully.")
    )
})

export {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist
}
