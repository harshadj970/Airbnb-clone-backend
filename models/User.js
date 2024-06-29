const mongoose=require('mongoose');
const {Schema}=require('mongoose');
const UserSchema=new Schema({
  name:String,
  email:{
    type:String,
    unique:true
  },
  password:String,
  avatar:{
    type:String,
  }
});

const User=mongoose.model('User',UserSchema);

module.exports=User;