import mongoose from "mongoose"
import { User } from "../models/user.model.js"
import { Video } from "../models/video.model.js"
import { Subscription } from "../models/subscription.model.js"
import { Like } from "../models/like.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"

const getChannelStats = asyncHandler(async (req, res) => {
    // TODO: Get the channel stats like total video views, total subscribers, total videos, total likes etc.
    const userId = req.user._id;

    const channelStats = await User.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(userId,),
            }
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "channel",
                as: "subscribers",
                pipeline: [
                    {
                        $project: {
                            _id: 1,
                            subscriber: 1
                        }
                    }
                ]
            }
        },
        {
            $lookup: {
                from: "videos",
                localField: "_id",
                foreignField: "owner",
                as: "videos",
            }
        },
        {
            $lookup: {
                from: "likes",
                let: { userId: "$_id" },
                pipeline: [
                    {
                        $match: { $expr: { $eq: ["$likedBy", "$$userId"] } }
                    },
                    {
                        $project: {
                            videoCount: { $size: "$video" } // Count the number of videos in each like document
                        }
                    }
                ],
                as: "likes"
            }
        },
        {
            $addFields: {
                totalVideoLikes: {
                    $sum: "$likes.videoCount"
                },
                totalViews: {
                    $sum: "$videos.views"
                },
                totalVideos: {
                    $size: "$videos"
                },
                totalSubscriber: {
                    $size: "$subscribers"
                }
            }
        },
        {
            $project: {
                _id: 0,
                totalVideoLikes: 1,
                totalViews: 1,
                totalVideos: 1,
                totalSubscriber: 1
            }
        }
    ])

    if (!channelStats) throw new ApiError(500, "No data available");

    res
        .status(200)
        .json(new ApiResponse(200, channelStats, "Succesfully fetch data."))

})

const getChannelVideos = asyncHandler(async (req, res) => {
    // TODO: Get all the videos uploaded by the channel
    const getChannelVideo = await Video.aggregate([
        {
            $match: {
                owner: new mongoose.Types.ObjectId(req.user._id)
            }
        },
        {
            $project: {
                _id: 1,
                title: 1,
                description: 1,
                videoFile: 1,
            }
        }
    ])

    if (!getChannelVideo) {
        throw new ApiError(505, "Somthing went wrong we can't fetch channel videos try again after some time.")
    } else if (getChannelVideo.length < 1) {
        throw new ApiError(404, "No video found in this channel video list.")
    }

    return res
        .json(
            new ApiResponse(200, getChannelVideo, `Channel video fetch succesfully.`)
        )
})

export {
    getChannelStats,
    getChannelVideos
}