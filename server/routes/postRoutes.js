const { Router } = require("express");
const {
  createPost,
  deletePosts,
  editPosts,
  getUserPosts,
  getCatPosts,
  getPost,
  getPosts,
} = require("../controllers/postController");
const authMiddleware= require('../middleware/authMiddleware')
const router = Router();

router.post("/", authMiddleware,createPost);
router.get("/", getPosts);
router.get("/:id", getPost);
router.patch("/:id", authMiddleware,editPosts);
router.get("/users/:id", getUserPosts);
router.get("/categories/:category", getCatPosts);
router.delete("/:id", authMiddleware,deletePosts);

module.exports = router;
