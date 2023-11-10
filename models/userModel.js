const mongoose = require('mongoose');

const userModel = new mongoose.Schema({
   name:{
      type:String,
      required:true
   },
   email:{
      type:String,
      required:true
   },
   password:{
      type:String,
      requird:true
   },
   mobile:{
      type:Number,
      required:true
   },
   is_admin:{
      type:Number,
      default:0
   },
   isBlocked: {
      type: Boolean,
      default: false,
    }
})

module.exports = mongoose.model('User',userModel);