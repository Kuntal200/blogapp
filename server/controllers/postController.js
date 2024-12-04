const Post = require("../models/postModel");
const User = require("../models/userModel");
const fs = require("fs");
const path = require("path");
const { v4: uuid } = require("uuid");
const HttpError = require("../models/errorModel");

//POST: api/posts
const createPost = async (req, res, next) => {
  try {
    let { title, category, desc } = req.body;
    if (!title || !category || !desc) {
      return next(new HttpError("Fill in all the fields", 422));
    }
    const { thumbnail } = req.files;
    if (thumbnail.size > 20000000) {
      return next(
        new HttpError("Thumbnail too big. It should be less than 2mb", 404)
      );
    }
    let fileName = thumbnail.name;
    let splittedFileName = fileName.split(".");
    let newFileName =
      splittedFileName[0] +
      uuid() +
      "." +
      splittedFileName[splittedFileName.length - 1];
    thumbnail.mv(
      path.join(__dirname, "..", "/uploads", newFileName),
      async (err) => {
        if (err) {
          return next(new HttpError(err));
        } else {
          const newPost = await Post.create({
            title,
            category,
            desc,
            thumbnail: newFileName,
            creator: req.user.id,
          });
          if (!newPost) {
            return next(new HttpError("Post couldn't be created", 422));
          }
          const currentUser = await User.findById(req.user.id);
          const userPostCount = currentUser.posts + 1;
          await User.findByIdAndUpdate(req.user.id, { posts: userPostCount });
          res.status(201).json(newPost);
        }
      }
    );
  } catch (error) {
    return next(new HttpError(error));
  }
};

//GET: api/posts/:id
const getPosts = async (req, res, next) => {
  try {
    const posts = await Post.find().sort({ updatedAt: -1 });
    res.status(200).json(posts);
  } catch (error) {
    return next(new HttpError(error));
  }
};

//GET :api/post
const getPost = async (req, res, next) => {
  try {
    const postId = req.params.id;
    const post = await Post.findById(postId);
    if (!post) {
      return next(new HttpError("Post not found", 404));
    }
    res.status(200).json(post);
  } catch (error) {
    return next(new HttpError(error));
  }
};

//GET :api/posts/categories/:category
const getCatPosts = async (req, res, next) => {
  try {
    const { category } = req.params;
    const catPosts = await Post.find({ category }).sort({ createdAt: -1 });
    res.status(200).json(catPosts);
  } catch (error) {
    return next(new HttpError(error));
  }
};

//GET :api/posts/users/:id
const getUserPosts = async (req, res, next) => {
  try {
    const { id } = rrq.params;
    const posts = await Post.find({ creator: id }).sort({ createdAt: -1 });
    res.status(200).json(posts);
  } catch (error) {
    return next(new HttpError(error));
  }
};

//PATCH :api/posts/:id
const editPosts = async (req, res, next) => {
  try {
    let fileName;
    let newFileName;
    let updatedPost;
    const postId = req.params.id;
    let { title, desc, category } = req.body;
    if (!title || !category || desc.length < 12) {
      return next(new HttpError("Fill in all fields", 422));
    }
    if (!req.files) {
      updatedPost = await Post.findByIdAndUpdate(
        postId,
        { title, category, desc },
        { new: true }
      );
    } else {
      const oldPost = await Post.findById(postId);
      if(req.user.id==oldPost.creator){
        if(!req.files){
          updatedPost= await Post.findByIdAndUpdate(postId, {title,category,desc},{new:true})
        }else{
      fs.unlink(
        path.join(__dirname, "..", "uploads", oldPost.thumbnail),
        async (err) => {
          if (err) {
            return next(new HttpError(err));
          }
        }
      );
    }
      const { thumbnail } = req.files;
      if (thumbnail.size > 2000000) {
        return next(
          new HttpError("Thumbnail too big, should be less than 2 mb", 404)
        );
      }
      fileName = thumbnail.name;
      let splittedFileName = fileName.split(".");
      newFileName =
        splittedFileName[0] +
        uuid() +
        "." +
        splittedFileName[splittedFileName.length - 1];
      thumbnail.mv(
        path.join(__dirname, "..", "uploads", newFileName),
        async (err) => {
          if (err) {
            return next(new HttpError(err));
          }
        }
      );
      updatedPost = await Post.findByIdAndUpdate(
        postId,
        { title, category, desc, thumbnail: newFileName },
        { new: true }
      );
    }
    if (!updatedPost) {
      return next(new HttpError("Couldn't update Post", 402));
    }
    res.status(200).json(updatedPost);
  }
  } catch (error) {
    return next(new HttpError(error));
  }
};

//DELETE :api/posts/:id
const deletePosts = async (req, res, next) => {
  try {
    const postId= req.params.id;
    if (!postId) {
      return next(new HttpError("Post unavailable",404));
    }
    const post = await Post.findById(postId);
    const fileName = post?.thumbnail;
    if(req.user.id==post.creator){
    fs.unlink(path.join(__dirname, "..", "uploads", fileName), async (err) => {
      if (err) {
        return next(new HttpError(err));
      }else{
        await Post.findByIdAndDelete(postId);
        //reduce the post count
        const currentUser= await User.findById(req.user.id);
        const userPostCount= currentUser?.posts -1 ;
        await User.findByIdAndUpdate(req.user.id, {posts: userPostCount})
        res.json(`Post ${postId} deleted successfully`)
      }
    });
  }else{
    return next(new HttpError("Post couldn't be deleted",405));
  }
  } catch (error) {
    return next(new HttpError(error));
  }
};

module.exports = {
  createPost,
  deletePosts,
  editPosts,
  getUserPosts,
  getCatPosts,
  getPost,
  getPosts,
};
