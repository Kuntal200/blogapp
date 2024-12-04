const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const fs = require("fs");
const path = require("path");
const HttpError = require("../models/errorModel");
const User = require("../models/userModel");
const { v4: uuid } = require("uuid");

//POST : api/users/register
const registerUser = async (req, res, next) => {
  try {
    const { name, email, password, password2 } = req.body;
    if (!name || !email || !password) {
      return next(new HttpError("Please fill all fields", 422));
    }
    const newEmail = email.toLowerCase();
    const emailExists = await User.findOne({ email: newEmail });
    if (emailExists) {
      return next(new HttpError("Email already exists", 422));
    }

    if (password.trim().length < 6) {
      return next(
        new HttpError("Password should be atleast 6 characters", 422)
      );
    }

    if (password != password2) {
      return next(new HttpError("Password do not match", 422));
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const newUser = await User.create({
      name,
      email: newEmail,
      password: hashedPassword,
    });
    res.status(201).json(`New User ${newUser.email} registered`);
  } catch (error) {
    console.error("Error during registration:", error);
    return next(new HttpError("User Registration failed", 422));
  }
};

//POST : api/users/login
const loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return next(new HttpError("Please fill all fields", 422));
    }
    const newEmail = email.toLowerCase();

    const user = await User.findOne({ email: newEmail });
    if (!user) {
      return next(new HttpError("Invalid Credentials", 422));
    }
    const comparePass = await bcrypt.compare(password, user.password);
    if (!comparePass) {
      return next(new HttpError("Passwords didn't match", 422));
    }

    const { _id: id, name } = user;
    const token = jwt.sign({ id, name }, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });

    res.status(200).json({ token, id, name });
  } catch (error) {
    console.error("Error during Login:", error);
    return next(new HttpError("Login failed", 422));
  }
};

//GET : api/users/:id
const getUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id).select("-password");
    if (!user) {
      return next(new HttpError("User not found", 404));
    }
    res.status(200).json(user);
  } catch (error) {
    console.error("Error during geting Users", error);
    return next(new HttpError("Error during geting Users", error));
  }
};

//POST : api/users/change_avatar
// const changedAvatar = async (req, res, next) => {
//   try {
//     if (!req.files||!req.files.avatar) {
//       return next(new HttpError("Please choose an image", 422));
//     }
//     // Finding user from database
//     const user = await User.findById(req.user.id);
//     if (user.avatar) {
//       fs.promises.unlink(path.join(__dirname, "..", "uploads", user.avatar), (err) => {
//         if (err) {
//           return next(new HttpError(err));
//         }
//       });
//     }
//     const { avatar } = req.files;
//     if (avatar.size > 500000) {
//       return next(new HttpError("Profile picture too big, It should be less than 500kb", 422));
//     }
// let fileName;
// fileName=avatar.name;
// let splittedFileName= fileName.split('.');
// let newFileName=splittedFileName[0]+ uuid() + '.' +splittedFileName[splittedFileName.length-1];
// avatar.mv(path.join(__dirname,'..','uploads',newFileName), async(err)=>{
//   if(err){
//     return next(new HttpError(err));
//   }
//   const updatedAvatar= await User.findByIdAndUpdate(req.user.id,{avatar:newFileName},{new:true})
//   if(!updatedAvatar){
//     return next(new HttpError("Avatar didn't change",422));
//   }
//   res.status(200).json(updatedAvatar);
// })

//   } catch (error) {
//     console.error("Error during changing avatars", error);
//     return next(new HttpError("Error during changing avatars", 500));
//   }
// };
const changedAvatar = async (req, res, next) => {
  try {
    console.log('Files:', req.files); // Log all files received
    console.log('Body:', req.body);  // Log other form data
    // Check if file is provided
    if (!req.files || !req.files.avatar) {
      return next(new HttpError("Please choose an image", 422));
    }

    // Validate avatar size
    const { avatar } = req.files;
    if (avatar.size > 500000) {
      return next(
        new HttpError(
          "Profile picture too big, it should be less than 500kb",
          422
        )
      );
    }

    // Find user in the database
    const user = await User.findById(req.user.id);
    if (!user) {
      return next(new HttpError("User not found", 404));
    }

    // Delete old avatar if it exists
    if (user.avatar) {
      try {
        await fs.promises.unlink(
          path.join(__dirname, "..", "uploads", user.avatar)
        );
      } catch (err) {
        console.error("Error deleting old avatar:", err);
        return next(new HttpError("Error deleting old avatar", 500));
      }
    }

    // Generate new file name
    const fileExtension = path.extname(avatar.name);
    const baseName = path.basename(avatar.name, fileExtension);
    const newFileName = `${baseName}-${uuid()}${fileExtension}`;

    // Move the new file to uploads
    try {
      await new Promise((resolve, reject) => {
        avatar.mv(path.join(__dirname, "..", "uploads", newFileName), (err) => {
          if (err) reject(err);
          resolve();
        });
      });
    } catch (err) {
      console.error("Error moving avatar file:", err);
      return next(new HttpError("Error uploading new avatar", 500));
    }

    // Update user's avatar in the database
    user.avatar = newFileName;
    const updatedUser = await user.save();
    if (!updatedUser) {
      return next(new HttpError("Avatar didn't change", 422));
    }

    res.status(200).json(updatedUser);
  } catch (error) {
    console.error("Error during changing avatars:", error);
    return next(new HttpError("Error during changing avatars", 500));
  }
};
// const changedAvatar = async (req, res, next) => {
//   try {
//     // Log request details for debugging
//     console.log("Incoming files:", req.files);
//     console.log("Incoming body:", req.body);

//     // Check if the avatar file is present
//     if (!req.files || !req.files.avatar) {
//       return next(new HttpError("Please choose an image", 422));
//     }

//     const { avatar } = req.files;

//     // Validate file size (less than 500 KB)
//     if (avatar.size > 500 * 1024) { // 500 KB
//       return next(new HttpError("Profile picture too big, it should be less than 500 KB", 422));
//     }

//     // Validate file type (e.g., only allow images)
//     const allowedExtensions = [".png", ".jpg", ".jpeg"];
//     const fileExtension = path.extname(avatar.name).toLowerCase();
//     if (!allowedExtensions.includes(fileExtension)) {
//       return next(new HttpError("Invalid file type. Only PNG, JPG, and JPEG are allowed.", 422));
//     }

//     // Find the user in the database
//     const user = await User.findById(req.user.id);
//     if (!user) {
//       return next(new HttpError("User not found", 404));
//     }

//     // Delete the old avatar if it exists
//     if (user.avatar) {
//       const oldAvatarPath = path.join(__dirname, "..", "uploads", user.avatar);
//       try {
//         await fs.promises.unlink(oldAvatarPath);
//         console.log("Old avatar deleted:", user.avatar);
//       } catch (err) {
//         console.error("Error deleting old avatar:", err);
//       }
//     }

//     // Generate a new unique filename for the uploaded file
//     const baseName = path.basename(avatar.name, fileExtension);
//     const newFileName = `${baseName}-${uuid()}${fileExtension}`;
//     const uploadPath = path.join(__dirname, "..", "uploads", newFileName);

//     // Move the uploaded file to the uploads directory
//     await new Promise((resolve, reject) => {
//       avatar.mv(uploadPath, (err) => {
//         if (err) {
//           console.error("Error moving file:", err);
//           reject(new HttpError("Error uploading the new avatar", 500));
//         }
//         resolve();
//       });
//     });

//     // Update the user's avatar in the database
//     user.avatar = newFileName;
//     const updatedUser = await user.save();
//     if (!updatedUser) {
//       return next(new HttpError("Avatar update failed", 422));
//     }

//     res.status(200).json({
//       message: "Avatar updated successfully",
//       user: updatedUser,
//     });
//   } catch (error) {
//     console.error("Error during changing avatar:", error);
//     return next(new HttpError("Error during changing avatars", 500));
//   }
// };

//POST : api/users/edit_user
const editUser = async (req, res, next) => {
  try {
    const { name, email, currentPassword, newPassword, confirmNewPassword } =
      req.body;
    if (!name || !email || !currentPassword || !newPassword) {
      return next(new HttpError("Please fill all fields", 422));
    }
    const user = await User.findById(req.user.id);
    if (!user) {
      return next(new HttpError("User not found", 403));
    }
    const emailExist = await User.findOne({ email });
    if (emailExist && emailExist._id != req.user.id) {
      return next(new HttpError("Email already exists", 404));
    }
    const validateUserPassword = await bcrypt.compare(
      currentPassword,
      user.password
    );
    if (!validateUserPassword) {
      return next(new HttpError("Invalid Current Password", 404));
    }
    if (newPassword !== confirmNewPassword) {
      return next(new HttpError("New Passwords didn't match", 404));
    }
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(newPassword, salt);

    const newInfo = await User.findByIdAndUpdate(
      req.user.id,
      { name, email, password: hash },
      { new: true }
    );
    res.status(200).json(newInfo);
  } catch (error) {
    console.error("Error during changing avatars", error);
    return next(new HttpError("Error during changing avatars", error));
  }
};

//GET : api/users/authors
const getAuthors = async (req, res, next) => {
  try {
    const authors = await User.find().select("-password");
    res.json(authors);
  } catch (error) {
    console.error("Error during geting Users", error);
    return next(new HttpError("Error during geting Users", error));
  }
};

module.exports = {
  registerUser,
  loginUser,
  getAuthors,
  changedAvatar,
  editUser,
  getUser,
};
