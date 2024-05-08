import mongoose, { isValidObjectId } from "mongoose"
import { Tweet } from "../models/tweet.model.js"
import { User } from "../models/user.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"

const createTweet = asyncHandler(async (req, res) => {

    const { content } = req.body;

    if (!content) {
        throw new ApiError(404, "Empty Tweet content not accepted")
    }

    const tweet = await Tweet.create(
        {
            content,
            owner: req.user._id
        }
    )
    if (!tweet) {
        throw new ApiError(500, "Something went wrong while adding tweet. Try again later.")
    }
    return res.status(201).json(
        new ApiResponse(200, tweet, "Tweet Added Successfully")
    )

})

const getUserTweets = asyncHandler(async (req, res) => {
    // TODO: get user tweets by user id
    const { userId } = req.params

    if (!userId) {
        throw new ApiError(400, "user id params are compulsory to define")
    }
    const userTweets = await Tweet.aggregate([
        {
            $match: {
                owner: new mongoose.Types.ObjectId(userId)
            }
        },
        {
            $group: {
                _id: "$owner",
                tweets: { $push: "$content" }
            }

        }, {
            $project: {
                tweets: 1
            }
        }])

    if (!userTweets) {
        throw ApiError(404, "Tweet is not defined")
    }


    return res.status(201).json(
        new ApiResponse(200, userTweets, "User tweet fetched Successfully")
    )

})

const updateTweet = asyncHandler(async (req, res) => {
    //TODO: update tweet

    const { tweetId } = req.params
    const { content } = req.body;


    if (!tweetId || !content) {
        throw new ApiError(400, "Tweet id and content params are required")
    }

    const updatedTweet = await Tweet.findByIdAndUpdate(tweetId, {
        $set: { content }
    },
        { new: true }
    )

    if (!updatedTweet) {
        throw new ApiError(500, "Oops content is not update ")
    }

    return res.status(201).json(
        new ApiResponse(200, updatedTweet, "Tweet is updated Successfully")
    )

})

const deleteTweet = asyncHandler(async (req, res) => {
    //TODO: delete tweet

    const { tweetId } = req.params

    if (!tweetId) {
        throw new ApiError(400, "id paramre is required")
    }

    const deletedTweet = await Tweet.findByIdAndDelete(tweetId)


    if (!deletedTweet) {
        throw new ApiError(500, `Somthing wrong unable to delete id:${tweetId} tweet.try again after some time.`)
    }

    return res.status(201).json(
        new ApiResponse(200, deletedTweet, `Tweet id:${tweetId} deleted Successfully`)
    )
})

export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
}
