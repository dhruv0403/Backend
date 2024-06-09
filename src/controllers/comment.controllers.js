import mongoose, { isValidObjectId } from "mongoose"
import {Comment} from "../models/comment.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {Video} from "../models/video.model.js"
import User from '../models/user.js';

const getComment = asyncHandler(async (req, res) => {
    const {videoId} = req.params
    const { page = 1, limit = 10 } = req.query
    if (!isValidObjectId(videoId)) throw new ApiError(400, "Invalid Video Id")

    const video = await Video.findById(videoId, { _id: 1 });
    if(!video) throw new ApiError(401, "Video not found")

    var commentAggregate;
    try {
        commentAggregate = Comment.aggregate([
        // stage 1 : getting all comments of a video using videoId
            {
                $match: {
                    video: new mongoose.Types.ObjectId(videoId)
                }
            },
            // stage 2 getting user info form users collection
            {
                $lookup: {
                    from: "users",
                    localField: "owner",
                    foreignField: "_id",
                    as: "owner",
                    pipeline: [
                        {
                            $project: {
                                _id:1,
                                username: 1,
                                avatar: "$avatar.url",

                            }
                        }
                    ]
                }

            },
            {
                $addFields: {

                    owner: {
                        $first : "$owner"
                    } 
                }
            },
            {
                $sort: {
                    "createdAt": -1
                }
            },

        ])
    } catch (error) {
        console.error("Error in aggregation:", error);
        throw new ApiError(500, error.message || "Internal server error in comment aggregation");

    }
    const options = {
        page,
        limit,
        customLabels: {
            docs: "comments",
            totalDocs: "totalComments",

        },
        skip: (page - 1) * limit,
        limit: parseInt(limit),
    }

    Comment.aggregatePaginate(
        commentAggregate,
        options
    ).then(result => {
        if (result?.comments.length === 0) {
            return res.status(200)
                .json(new ApiResponse(
                            200,
                            [],
                        "No comments found"
                        )
                )
        }
        return res.status(200)
            .json(new ApiResponse(
                200,
                result,
                "success"
        ))
    }).catch(error => {
        console.error("Error in aggregation:", error);
        res.status(500).
            json(new ApiResponse(500, error.message || "Internal server error"));
    })

    // console.log("comment :: ",comment)

})

const addComment=asyncHandler(async (req,res)=>{
    const { videoId }=req.params;
    const { text }=req.body;

    if (!isValidObjectId(videoId)) throw new ApiError(400, "Invalid Video Id")
    if (text?.trim() === "") throw new ApiError(404, "content is required")

    const video = await Video.findById(videoId);
    const user=await User.findById(req.user?._id);

    if (!user) throw new ApiError(404, "User not found");
    if (!video) throw new ApiError(404, "Video not found");

    const comment = await Comment.create({
        content,
        video: videoId,
        owner: req.user?._id
    })

    if (!comment) throw new ApiError(500, "Something went wrong while adding comment")

    return res
    .status(201)
    .json(new ApiResponse(201,comment,"Comment Added Successfully"))

})

const updateComment = asyncHandler(async (req, res) => {
    const { commentId } = req.params;
    const { text } = req.body;

    // Check if the commentId is a valid MongoDB ObjectId
    if (!isValidObjectId(commentId)) throw new ApiError(400, "Invalid Comment Id");

    // Check if the text is provided and not empty
    if (!text?.trim()) throw new ApiError(400, "Content is required");

    // Find the comment by commentId
    const comment = await Comment.findById(commentId);

    // Ensure the comment exists
    if (!comment) throw new ApiError(404, "Comment not found");

    // Ensure the user trying to update the comment is the owner
    if (comment.user.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You do not have permission to update this comment");
    }

    // Update the comment with the new text
    const updatedComment = await Comment.findByIdAndUpdate(
        commentId,
        { $set: { text } },
        { new: true }
    );

    // Ensure the comment update was successful
    if (!updatedComment) throw new ApiError(500, "Something went wrong while updating comment");

    // Return a success response with the updated comment
    return res
        .status(200)
        .json(new ApiResponse(200, updatedComment, "Comment Updated Successfully"));
});


const deleteComment = asyncHandler(async (req, res) => {
    const { commentId } = req.params;
    if (!isValidObjectId(commentId)) throw new ApiError(404, "Not found comment for this id");

    const comment = await Comment.findById(commentId, { _id: 1 });
    if (!comment) throw new ApiError(404, "Not found comment for this id")


    const deletedComment = await Comment.findByIdAndDelete(
        commentId,
        {
            new : true
        }
    )
    if(!deletedComment) throw new ApiError(500, "Something went wrong while deleting comment")
    return res.status(200)
        .json(new ApiResponse(
            200,
            {},
            "Comment Deleted Successfully"
    ))
})

export {
    getComment,
    addComment,
    updateComment,
    deleteComment,
}