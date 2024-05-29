import mongoose, { isValidObjectId } from "mongoose"
import { Like } from "../models/like.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"

const toggleVideoLike = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: toggle like on video

    if (!videoId) {
        throw new ApiError(400, "Please provide videoId is require");
    }

    let likedUser = await Like.findOne({ likedBy: req.user._id })
    let message = null;

    if (!likedUser) {
        likedUser = await Like.create({ likedBy: req.user._id, video: videoId, })
        message = "like"
    } else {
        const videoExist = likedUser.video.includes(videoId)
        if (videoExist) {
            likedUser.video.pull(videoId);
            message = "unlike"
        } else {
            likedUser.video.push(videoId);
            message = "like"
        }
        await likedUser.save();
    }

    return res
        .json(
            new ApiResponse(200, likedUser, `successfully ${message} video`)
        )
})

const toggleCommentLike = asyncHandler(async (req, res) => {
    const { commentId } = req.params
    //TODO: toggle like on comment
    if (!commentId) {
        throw new ApiError(400, "Please provide commentId is require");
    }

    let likedUser = await Like.findOne({ likedBy: req.user._id })
    let message = null;

    if (!likedUser) {
        likedUser = await Like.create({ likedBy: req.user._id, video: videoId, })
        message = "like"
    } else {
        const commentExist = likedUser.comment.includes(commentId)
        if (commentExist) {
            likedUser.video.pull(commentId);
            message = "unlike"
        } else {
            likedUser.video.push(commentId);
            message = "like"
        }
        await likedUser.save();
    }

    return res
        .json(
            new ApiResponse(200, likedUser, `successfully ${message} comment.`)
        )

})

const toggleTweetLike = asyncHandler(async (req, res) => {
    const { tweetId } = req.params
    //TODO: toggle like on tweet
    if (!tweetId) {
        throw new ApiError(400, "Please provide tweetId is require");
    }

    let likedUser = await Like.findOne({ likedBy: req.user._id })
    let message = null;

    if (!likedUser) {
        likedUser = await Like.create({ likedBy: req.user._id, tweet: tweetId, })
        message = "like"
    } else {
        const commentExist = likedUser.tweet.includes(tweetId)
        if (commentExist) {
            likedUser.tweet.pull(commentId);
            message = "unlike"
        } else {
            likedUser.tweet.push(commentId);
            message = "like"
        }
        await likedUser.save();
    }

    return res
        .json(
            new ApiResponse(200, likedUser, `successfully ${message} tweet.`)
        )
}
)

const getLikedVideos = asyncHandler(async (req, res) => {
    //TODO: get all liked videos

    const likedUser = await Like.findOne({ likedBy: req.user._id })

    if (!likedUser) {
        throw new ApiError(400, "User not like any video please first like a video.");
    }

    const likedVideos = await Like.aggregate([
        {
            $match: {
                likedBy: new mongoose.Types.ObjectId(req.user._id)
            }
        },
        {
            $unwind: '$video'
        },
        {
            $lookup: {
                from: 'videos',
                localField: 'video',
                foreignField: '_id',
                as: 'videoDetails',
                pipeline: [
                    {
                        $project: {
                            title: 1,
                            description: 1,
                            videoFile: 1,
                        }
                    }
                ]
            }
        },
        {
            $project: {
                videoDetails: 1,
                _id: 0
            }
        }
    ])


    return res
        .json(
            new ApiResponse(200, likedVideos, `liked videos fetch.`)
        )
})

export {
    toggleCommentLike,
    toggleTweetLike,
    toggleVideoLike,
    getLikedVideos
}