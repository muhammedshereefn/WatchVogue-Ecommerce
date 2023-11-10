const mongoose = require('mongoose');

const productModel = new mongoose.Schema({
   images:[
    {
        type:String
    }

   ],

   coverimage:{
    type:String
   },
   name:{
    type:String
   },
   quantity:{
    type:Number
   },
   category:{
    type:String,
    required:true
   },
   brand:{
    type:String
   },
   isFeature:{
    type:Boolean,
    default:false
   },
   status:{
    type:Boolean,
    default:true
   },
   description:{
    type:String
   },
   price:{
    type:Number,
    default:1
   },
   block:{
    type:Boolean,
    default:false
   }

},
{
    timestamps:true 
}
)

const Product = mongoose.model('products',productModel)

module.exports = {Product}