import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";    

const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
  },

  email:{
    type: String,
    required: true,
    unique: true,   
  },

  password: {
    type: String,
    required: true,
  },
  lastSeen: {
    type: Date,
    default: Date.now
  },
  refreshToken:{
            type:String
    }
},{timestamps:true});

UserSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  this.password = await bcrypt.hash(this.password, 10);
});

UserSchema.methods.isPasswordCorrect = async function (password) {
  return await bcrypt.compare(password, this.password);
};

UserSchema.methods.generateRefreshToken = function(){
    return jwt.sign({
         _id : this._id,  
    },
    process.env.REFRESH_TOKEN_SECRET,
    {expiresIn: process.env.REFRESH_TOKEN_EXPIRY}
    );
}
UserSchema.methods.generateAccessToken = function(){
   return jwt.sign({ 
        _id : this._id,
        email : this.email,
        username : this.username
    },
     process.env.ACCESS_TOKEN_SECRET,
     {expiresIn: process.env.ACCESS_TOKEN_EXPIRY}
    );
}

export const User = mongoose.model("User", UserSchema);    