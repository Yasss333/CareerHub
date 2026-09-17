import mongoose from "mongoose";
import bcrypt from "bcrypt";

    
const userSchema= new mongoose.Schema({
    name:{
        type:String,
        required:true
    },
    email:{
        type:String,
        unique:true,
        required:true
    },
    password:{
        type:String,
        required:true
    }
})

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  this.password = await bcrypt.hash(this.password, 10);
    });


userSchema.methods.isPasswordCorrect=async function  (password){
           return await bcrypt.compare(password,this.password  )
}

const User=new mongoose.model("User",userSchema);

export default User;    