const {Router}= require('express');
const authMiddleware = require("../middleware/authMiddleware")
const {registerUser, loginUser, getAuthors, changedAvatar,editUser,getUser}= require('../controllers/userController');
const router= Router();

router.post('/register',registerUser);
router.post('/login',loginUser);
router.get('/:id',getUser);
router.get('/',getAuthors);
router.post('/change_avatar',authMiddleware,changedAvatar);
router.patch('/edit_user',authMiddleware,editUser);

module.exports=router;