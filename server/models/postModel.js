const {Schema, model }= require('mongoose');

const postSchema= new Schema({
    title:{type:String, required: true},
    category:{type:String, enum:["Agriculture",
    "Weather",
    "Education",
    "Science",
    "Entertainment",
    "Art",
    "Sports",
    "Investment",
    "Uncategorized"],message:'VALUE IS NOT SUPPORTED'},
    desc:{type:String, required: true},
    creator:{type:Schema.Types.ObjectId, ref:'User'},
    thumbnail:{type:String, required: true}

},{timestamps:true})

module.exports= model("Post",postSchema)