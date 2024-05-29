import mongoose, { isValidObjectId } from "mongoose"
import { Comment } from "../models/comment.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"

const getVideoComments = asyncHandler(async (req, res) => {
    //TODO: get all comments for a video
    const { videoId } = req.params
    
    if (!videoId) throw new ApiError(404, "Id not found");
    
    const { page = 1, limit = 10 } = req.query
    const commentLimit = parseInt(limit);
    const commentSkip = (page - 1) * commentLimit;

    const allComments = await Comment.aggregate([
        {
            $match: {
                video: new mongoose.Types.ObjectId(videoId),
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "owner",
                pipeline: [
                    {
                        $project: {
                            "fullName": 1,
                            "avatar": 1,
                        }
                    }
                ]
            }
        },
        {
            $lookup: {
                from: "videos",
                localField: "video",
                foreignField: "_id",
                as: "video",
                pipeline: [
                    {
                        $project: {
                            "title": 1,
                            "description": 1,
                            "videoFile": 1,
                            "thumbnail": 1,
                        }
                    }
                ]
            }
        },
        {
            $skip: commentSkip
        },
        {
            $limit: commentLimit
        }
    ]);

    if (!allComments) throw new ApiError(504, "not created");

    res.status(200).json(new ApiResponse(200, allComments, "comment data fetch succesfully"));

})

const addComment = asyncHandler(async (req, res) => {
    // TODO: add a comment to a video
    const { content } = req.body;
    const { videoId } = req.params;
    if (!videoId && !content) {
        throw new ApiError(404, "content and videoId are required fileds.")
    }

    const comment = await Comment.create({
        content,
        video: videoId,
        owner: req.user._id
    })

    if (!comment) {
        throw new ApiError(500, "Opps sorry somethig went wrong. please try again after sometime.")
    }

    return res
        .json(
            new ApiResponse(200, comment, `comment succesfully added on video id:${videoId}`)
        )
})

const updateComment = asyncHandler(async (req, res) => {
    // TODO: update a comment
    const { commentId } = req.params;
    const { content } = req.body;
    if (!commentId) {
        throw new ApiError(404, "Please provide comment Id comment id is required filed.")
    }

    const updatedComment = await Comment.findByIdAndUpdate(commentId, { content }, { new: true });

    if (!updatedComment) {
        throw new ApiError(505, "Opps somthing wrong please try agin later.")
    }

    return res
        .json(
            new ApiResponse(200, updatedComment, `comment updated succesfully.`)
        )
})

const deleteComment = asyncHandler(async (req, res) => {
    // TODO: delete a comment
    const { commentId } = req.params;
    if (!commentId) {
        throw new ApiError(404, "Please provide comment Id comment id is required filed.")
    }

    const deletedComment = await Comment.findByIdAndDelete(commentId, { new: true });

    if (!deletedComment) {
        throw new ApiError(505, "Opps somthing wrong please try agin later.")
    }

    return res
        .json(
            new ApiResponse(200, deletedComment, `comment deleted succesfully.`)
        )
})

export {
    getVideoComments,
    addComment,
    updateComment,
    deleteComment
}
