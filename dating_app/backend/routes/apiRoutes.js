const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticate } = require('../utils/authUtils'); // Đã thay đổi dòng này

// Bảo vệ các route bằng middleware xác thực
router.use(authenticate); // Sử dụng từ authUtils

router.get('/users', userController.getPotentialMatches);
router.post('/swipe', userController.handleSwipe);
router.put('/profile', userController.updateProfile);
router.post('/profile/avatar', ...userController.uploadAvatar);
router.get('/profile', userController.getProfile);

// Thêm route upload nhiều ảnh
router.post('/profile/photos', ...userController.uploadUserPhotos);

// Lấy danh sách ảnh của user (của mình hoặc user khác)
router.get('/users/:id/photos', userController.getUserPhotos);
router.get('/profile/photos', userController.getUserPhotos); // lấy ảnh của chính mình
router.delete('/profile/photos/:photoId', userController.deleteUserPhoto);

module.exports = router;