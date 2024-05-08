import mongoose, { isValidObjectId } from "mongoose"
import { Video } from "../models/video.model.js"
import { User } from "../models/user.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js"




const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query
    //TODO: get all videos based on query, sort, pagination

    const queryParams = {};

    if (query) {
        queryObject.title = { $regex: query, $options: "i" };
    }

    if (userId) {
        queryParams.userId = userId;
    }

    const sortParams = {};
    if (sortBy) {
        sortParams[sortBy] = sortType === "desc" ? -1 : 1;
    }

    const skipedProduct = (page - 1) * limit;

    const allVideos = await Video.find(queryParams)
        .sort(sortParams)
        .skip(skipedProduct)
        .limit(limit);

    if (!allVideos) {
        throw new ApiError(500, "Something went wrong unable to fetch videos.")
    }

    return res.status(201).json(
        new ApiResponse(200, allVideos, "Video fetched Successfully")
    )
})

const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description } = req.body

    // check title and description is define 
    if (!title && !description) {
        throw new ApiError(400, "title and description is required")
    }

    // check video title is already define 

    const existedvideo = await Video.findOne({ title })

    if (existedvideo) {
        throw new ApiError(409, "Video with title already exists")
    }

    // video file local path
    const videoFileLocalPath = req.files?.videoFile[0]?.path;
    const thumbnailLocalPath = req.files?.thumbnail[0]?.path;

    if (!videoFileLocalPath && !thumbnailLocalPath) {
        throw new ApiError(400, "Videofile and Thumbnail is required");
    }

    const videoFile = await uploadOnCloudinary(videoFileLocalPath)
    const thumbnail = await uploadOnCloudinary(thumbnailLocalPath)

    if (!videoFile && !thumbnail) {
        throw new ApiError(500, "Videofile and Thumbnail is required");
    }

    const video = await Video.create({
        title,
        description,
        videoFile: videoFile.url,
        thumbnail: thumbnail.url,
        duration: videoFile.duration,
        views: 0,
        isPublished: true,
        owner: req.user?._id,
    })

    const createdVideo = await Video.findById(video._id)

    if (!createdVideo) {
        throw new ApiError(500, "Something went wrong while adding the video try agin later")
    }

    return res.status(201).json(
        new ApiResponse(200, createdVideo, "Video added Successfully")
    )

})

const getVideoById = asyncHandler(async (req, res) => {

    const { videoId } = req.params
    //TODO: get video by id

    if (!videoId) {
        throw new ApiError(400, "define a valid params")
    }

    const selectVideo = await Video.findById(videoId)

    if (!selectVideo) {
        throw new ApiError(404, "Video id not found in video collection")
    }

    return res.status(201).json(
        new ApiResponse(200, selectVideo, `Video id:${videoId} found`)
    )

})

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    const { title, description } = req.body
    const thumbnail = req.file
    //TODO: update video details like title, description, thumbnail

    if (!videoId) {
        throw new ApiError(400, "define a valid params")
    }

    const selectedVideo = await Video.findById(videoId)

    if (!selectedVideo) {
        throw new ApiError(404, "Video does not found in video collection")
    }

    const { owner } = selectedVideo

    if (!owner.equals(req.user._id)) {
        throw new ApiError(401, "user is Unauthorized to do this action")
    }

    const updateData = {}

    if (title) {
        updateData.title = title
    }

    if (description) {
        updateData.description = description
    }

    if (thumbnail) {
        const thumbnailLocalPath = req.file?.path

        const thumbnailCloud = await uploadOnCloudinary(thumbnailLocalPath)

        if (!thumbnailCloud) {
            throw new ApiError(500, "Oops! Thumbnail cloud path is not created");
        }

        updateData.thumbnail = thumbnailCloud.url
    }

    if (!title && !description && !thumbnail) {
        throw new ApiError(404, "Title, descripttion and Thumbnail is required");
    }

    const updatedVideo = await Video.findByIdAndUpdate(videoId, updateData, { new: true });

    // Check if the video exists
    if (!updatedVideo) {
        throw new ApiError(404, "Video not found");
    }

    return res.status(201).json(
        new ApiResponse(200, updatedVideo, `Video id:${videoId} is update Successfully`)
    )

})

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params

    if (!videoId) {
        throw new ApiError(400, "Id params is not defined")
    }

    const deletedVideo = await Video.findByIdAndDelete(videoId)


    if (!deletedVideo) {
        throw new ApiError(500, "Somthing Wrong id not deleted")
    }

    return res.status(201).json(
        new ApiResponse(200, deletedVideo, `Video id:${videoId} deleted Successfully`)
    )
})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params

    if (!videoId) {
        throw new ApiError(400, "Id params is not defined")
    }

    const video = await Video.findById(videoId)

    if (!video) {
        throw new ApiError(404, `Video id:${videoId} not exists`)
    }

    const toggleStatus = await Video.findByIdAndUpdate(
        videoId,
        {
            $set: { isPublished: !video.isPublished }
        },
        { new: true }
    )

    if (!toggleStatus) {
        throw new ApiError(500, "Somthing went wrong while toggle status")
    }

    return res.status(201).json(
        new ApiResponse(200, toggleStatus, `Video id:${videoId} status toggle Successfully`)
    )
})

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}
