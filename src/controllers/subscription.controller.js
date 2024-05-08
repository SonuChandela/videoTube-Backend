import mongoose, { isValidObjectId } from "mongoose"
import { User } from "../models/user.model.js"
import { Subscription } from "../models/subscription.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"


const toggleSubscription = asyncHandler(async (req, res) => {
    const { channelId } = req.params;
    const userId = req.user?._id;    // TODO: toggle subscription

    if (!channelId || !isValidObjectId(channelId)) {
        throw new ApiError(404, "Please provide a valid channel Id.")
    }

    if (channelId === userId) {
        throw new ApiError(400, "You cann't subscribe your own channel.")
    }

    const channelExists = await User.findById(channelId);

    if (!channelExists) {
        throw new ApiError(404, `Channel with id:${channelId} not exists`);
    }

    let subscription = await Subscription.findOne({
        channel: channelId,
        subscriber: userId,
    });

    let message = null;
    if (subscription) {
        await subscription.deleteOne();
        message = "unsubscribe"
    } else {
        subscription = await Subscription.create({
            channel: channelId,
            subscriber: userId,
        })
        message = "subscribe"
    }
    return res.status(201).json(
        new ApiResponse(200, subscription, `you successfully ${subscription} `)
    )
})

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const { channelId } = req.params

    if (!channelId) {
        throw new ApiError(404, "Please provide a valid channel Id.")
    }

    const subscriberList = await Subscription.aggregate([
        {
            $match: {
                channel: new mongoose.Types.ObjectId(channelId.trim())
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "subscriber",
                foreignField: "_id",
                as: "subscriberList",
                pipeline: [
                    {
                        $project: {
                            username: 1,
                            fullName: 1,
                            avatar: 1,
                        }
                    }
                ]
            }
        },
        {
            $addFields: {
                subscribersList: {
                    $first: "$subscriberList"
                }
            }
        },
        {
            $project: {
                subscribersList: 1,
                _id: 0,
            }
        }
    ])

    if (!subscriberList) {
        throw new ApiError(500, "subscriber not exists in this channel")
    }
    return res
        .status(201)
        .json(
            new ApiResponse(200, subscriberList, "successfully fetch data of channel subscriber")
        )
})

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
    const { subscriberId } = req.params

    if (!subscriberId) {
        throw new ApiError(400, "subscriber Id Required");
    }

    const channelList = await Subscription.aggregate([
        {
            $match: {
                subscriber: new mongoose.Types.ObjectId(subscriberId.trim())
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "channel",
                foreignField: "_id",
                as: "channelList",
                pipeline: [
                    {
                        $project: {
                            username: 1,
                            fullName: 1,
                            avatar: 1,
                        }
                    }
                ]
            }
        },
        {
            $addFields: {
                channelList: {
                    $first: "$channelList"
                }
            }
        },
        {
            $project: {
                channelList: 1,
                _id: 0,
            }
        }
    ])

    if (!channelList) {
        throw new ApiError(500, "something went sronh we unable to send subscribed channel list")
    }
    return res
        .status(201)
        .json(
            new ApiResponse(200, channelList, "successfully fetch data of channel subscribers")
        )
})

export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
}