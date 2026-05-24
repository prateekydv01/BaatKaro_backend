import { ConnectionRequest } from "../models/requestModel.js"
import { User } from "../models/userModel.js"

const generateAccessAndRefreshToken = async (user) => {

    const accessToken = user.generateAccessToken()

    const refreshToken = user.generateRefreshToken()

    user.refreshToken = refreshToken

    await user.save({
        validateBeforeSave: false
    })

    return {
        accessToken,
        refreshToken
    }
}

export const registerUser = async (req, res) => {

    try {

        const { username, email, password } = req.body

        if (!username || !email || !password) {
            return res.status(400).json({
                message: "All fields are required"
            })
        }

        const existingUser = await User.findOne({
            $or: [{ email }, { username }]
        })

        if (existingUser) {
            return res.status(400).json({
                message: "User already exists"
            })
        }

        const newUser = await User.create({
            username,
            email,
            password
        })

        const tokens =
            await generateAccessAndRefreshToken(newUser)

        const createdUser = await User.findById(newUser._id)
            .select("-password -refreshToken")

        const options = {
            httpOnly: true,
            secure: false,
            sameSite: "strict"
        }

        return res
            .status(201)
            .cookie("accessToken", tokens.accessToken, options)
            .cookie("refreshToken", tokens.refreshToken, options)
            .json({
                message: "User registered successfully",
                user: createdUser,
                accessToken: tokens.accessToken,
                refreshToken: tokens.refreshToken
            })

    } catch (error) {

        console.log(error)

        return res.status(500).json({
            message: "Server error"
        })
    }
}

export const loginUser = async (req, res) => {

    try {

        const { email, password } = req.body

        if (!email || !password) {
            return res.status(400).json({
                message: "All fields are required"
            })
        }

        const user = await User.findOne({ email })

        if (!user) {
            return res.status(400).json({
                message: "Invalid credentials"
            })
        }

        const isPasswordCorrect =
            await user.isPasswordCorrect(password)

        if (!isPasswordCorrect) {
            return res.status(400).json({
                message: "Invalid credentials"
            })
        }

        const tokens =
            await generateAccessAndRefreshToken(user)

        const loggedInUser = await User.findById(user._id)
            .select("-password -refreshToken")

        const options = {
            httpOnly: true,
            secure: false,
            sameSite: "strict"
        }

        return res
            .status(200)
            .cookie("accessToken", tokens.accessToken, options)
            .cookie("refreshToken", tokens.refreshToken, options)
            .json({
                message: "Login successful",
                user: loggedInUser,
                accessToken: tokens.accessToken,
                refreshToken: tokens.refreshToken
            })

    } catch (error) {

        console.log(error)

        return res.status(500).json({
            message: "Server error"
        })
    }
}

export const getCurrentUser = async (req, res) => {

    try {

        const user = await User.findById(req.user._id)
            .select("-password -refreshToken")

        if (!user) {
            return res.status(404).json({
                message: "User not found"
            })
        }

        return res.status(200).json({
            user
        })

    } catch (error) {

        console.log(error)

        return res.status(500).json({
            message: "Server error"
        })
    }
}

export const logoutUser = async (req, res) => {

    try {

        const user = await User.findById(req.user._id)

        if (!user) {
            return res.status(404).json({
                message: "User not found"
            })
        }

        user.refreshToken = null

        await user.save({
            validateBeforeSave: false
        })

        const options = {
            httpOnly: true,
            secure: false,
            sameSite: "strict"
        }

        return res
            .status(200)
            .clearCookie("accessToken", options)
            .clearCookie("refreshToken", options)
            .json({
                message: "Logout successful"
            })

    } catch (error) {

        console.log(error)

        return res.status(500).json({
            message: "Server error"
        })
    }
}

export const searchUser = async (req, res) => {

    try {

        const username = req.query.username?.trim();

        if (!username) {
            return res.status(400).json({
                message: "Please enter username"
            });
        }

        // search users except current user
        const users = await User.find({

            _id: {
                $ne: req.user._id
            },

            username: {
                $regex: username,
                $options: "i"
            }

        }).select("-password -refreshToken");

        // attach request status
        const updatedUsers = await Promise.all(

    users.map(async (user) => {

        const existingRequest =
            await ConnectionRequest.findOne({

                $or: [

                    {
                        senderId: req.user._id,
                        receiverId: user._id
                    },

                    {
                        senderId: user._id,
                        receiverId: req.user._id
                    }

                ]

            }).lean();

        let requestStatus = "none";

        if (existingRequest) {

            // request received by current user
            if (

                existingRequest.receiverId.toString() ===
                req.user._id.toString()

                &&

                existingRequest.status === "pending"

            ) {

                requestStatus = "received";

            }

            // request sent by current user
            else if (

                existingRequest.senderId.toString() ===
                req.user._id.toString()

            ) {

                requestStatus = existingRequest.status;

            }

            // already connected
            else {

                requestStatus = existingRequest.status;

            }
        }

        return {
            ...user.toObject(),
            requestStatus
        };

    })
);

        return res.status(200).json({
            users: updatedUsers
        });

    } catch (error) {

        console.log(error);

        return res.status(500).json({
            message: "Server error!"
        });

    }
};