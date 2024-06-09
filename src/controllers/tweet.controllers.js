import mongoose, { isValidObjectId } from "mongoose";
import { Tweet } from "../models/tweet.model.js"
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js";

const createTweet = asyncHandler(async (req, res) => {
    const { content } = req.body;
  
    if (!content?.trim()) {
      throw new ApiError(400, "Content is required");
    }
  
    const tweet = await Tweet.create({
      content,
      owner: req.user?._id,
    });
  
    if (!tweet) {
      throw new ApiError(500, "Something went wrong while creating the tweet");
    }
  
    res
    .status(201)
    .json(new ApiResponse(201, tweet, "Tweet created successfully"));

});

const getUserTweets = asyncHandler(async (req, res) => {
    // TODO: get user tweets
    const {userId} = req.params
    if(!userId){
        throw new ApiError(400,"userId is Required!!!")
    }
    try {
        const tweet = await Tweet.aggregate([{
            $match:{
                owner:new mongoose.Types.ObjectId(userId)
            }
        },{
            $group:{
                _id:"owner",
                tweets:{$push:"$content"}
            }

        },{
            $project:{
                _id:0,
                tweets:1
            }
        }])
        if(!tweet || tweet.length === 0){
            return res
             .status(200)
             .json(new ApiResponse(200, [], "User have no tweets"));
        }
        return res
        .status(200)
        .json(new ApiResponse(200,tweet,"Tweet for the user fetched successfully!"))
    } catch (e) {
        throw new ApiError(500,e?.message || "Unable to fetch tweets")

    }
})

const updateTweet = asyncHandler(async (req, res) => {
    //TODO: update 
    const { tweetId }= req.params;
    const { newcontent } =req.body;

    if(!isValidObjectId(tweetId)) throw ApiError(404, "Not found tweet for this id")
    
    const user = await User.findById(req.user?._id, { _id: 1 });
    if (!user) throw new ApiError(404, "User not found");

    const tweet = await Tweet.findById(tweetId, { _id : 1});
    if (!tweet) throw new ApiError(404, "Tweet not found");

    if(!content || content?.trim() === "") throw new ApiError(404, "content is required");

    const updatedTweet = await Tweet.findByIdAndUpdate(
        tweetId,
        {
            $set: {
                content
            }
        },
        {
            new : true
        }
    )

    if(!updatedTweet) throw new ApiError(500, "Something went wrong while updating tweet")

    return res
    .status(201)
    .json(new ApiResponse(
        201,
        updatedTweet,
        "tweet updated Successfully"
    ))
})

const deleteTweet = asyncHandler(async (req, res) => {
    const { tweetId } = req.params;

    const user = await User.findById(req.user?._id, { _id: 1 });
    if (!user) throw new ApiError(404, "User not found");

    if (!isValidObjectId(tweetId))
        throw new ApiError(404, "Not found tweet for this id")

    const tweet = await Tweet.findById(tweetId, { _id: 1 });
    if (!tweet) throw new ApiError(404, "Tweet not found");


    const deletedTweet = await Tweet.findByIdAndDelete(tweetId);
    if(!deletedTweet) throw new ApiError(500, "Something went wrong while deleting tweet")

    return res.status(200)
        .json(new ApiResponse(
            200,
            {},
            "tweet deleted successfully"
    ))

})

export{
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet

}