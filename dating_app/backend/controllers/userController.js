const { User, UserPhoto, Match, Sequelize } = require('../models');
const { Op } = Sequelize;
const multer = require('multer');
const path = require('path');

// Cấu hình cho ảnh đại diện
const upload = multer({
  dest: 'uploads/', // Thư mục lưu ảnh
  limits: { fileSize: 5 * 1024 * 1024 }, // Tăng lên 5MB
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (ext !== '.jpg' && ext !== '.jpeg' && ext !== '.png') {
      return cb(new Error('Chỉ chấp nhận file ảnh định dạng JPG, JPEG, PNG'));
    }
    cb(null, true);
  }
});

// Cấu hình cho ảnh gallery
const uploadPhotos = multer({
  dest: 'uploads/',
  limits: { fileSize: 10 * 1024 * 1024 }, // Tăng lên 10MB
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (ext !== '.jpg' && ext !== '.jpeg' && ext !== '.png') {
      return cb(new Error('Chỉ chấp nhận file ảnh định dạng JPG, JPEG, PNG'));
    }
    cb(null, true);
  }
});

// Lấy danh sách người dùng để quẹt
exports.getPotentialMatches = async (req, res) => {
  try {
    const currentUserId = req.user.id;
    const gender = req.query.gender;
    const minAge = parseInt(req.query.minAge, 10);
    const maxAge = parseInt(req.query.maxAge, 10);

    console.log(`[getPotentialMatches] Bắt đầu cho user: ${currentUserId}, lọc giới tính: ${req.query.gender}`);

    // Lấy danh sách userId đã quẹt (like hoặc dislike)
    const matches = await Match.findAll({
      where: { user1_id: currentUserId },
      attributes: ['user2_id']
    });
    const swipedUserIds = matches.map(m => m.user2_id);
    console.log(`[getPotentialMatches] User ${currentUserId} đã quẹt các ID:`, swipedUserIds);

    const where = {
      id: {
        [Sequelize.Op.and]: [
          { [Sequelize.Op.ne]: currentUserId },
          { [Sequelize.Op.notIn]: swipedUserIds.length ? swipedUserIds : [0] }
        ]
      }
    };
    if (gender) where.gender = gender;
    if (!isNaN(minAge) && !isNaN(maxAge)) {
      where.age = { [Sequelize.Op.between]: [minAge, maxAge] };
    } else if (!isNaN(minAge)) {
      where.age = { [Sequelize.Op.gte]: minAge };
    } else if (!isNaN(maxAge)) {
      where.age = { [Sequelize.Op.lte]: maxAge };
    }
    
    console.log('[getPotentialMatches] Điều kiện truy vấn (where clause):', JSON.stringify(where, null, 2));

    const users = await User.findAll({ where });
    
    console.log(`[getPotentialMatches] Tìm thấy ${users.length} người dùng.`);
    
    res.json(users);
  } catch (error) {
    console.error('Lỗi lấy danh sách người dùng:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

// Xử lý quẹt phải (like) hoặc trái (dislike)
exports.handleSwipe = async (req, res) => {
  try {
    const { targetId, action } = req.body;
    const currentUserId = req.user.id;

    console.log('Swipe:', { currentUserId, targetId, action });

    // Kiểm tra xem người kia đã like mình chưa (pending)
    const reverseMatch = await Match.findOne({
      where: {
        user1_id: targetId,
        user2_id: currentUserId,
        status: 'pending'
      }
    });

    if (action === 'like') {
      if (reverseMatch) {
        // Đã có người kia like mình => cập nhật cả 2 thành matched
        await reverseMatch.update({ status: 'matched' });
        // Cập nhật hoặc tạo bản ghi chiều này thành matched
        let myMatch = await Match.findOne({
          where: { user1_id: currentUserId, user2_id: targetId }
        });
        if (myMatch) {
          await myMatch.update({ status: 'matched' });
        } else {
          await Match.create({ user1_id: currentUserId, user2_id: targetId, status: 'matched' });
        }
        return res.json({ matched: true, message: 'Đã match!' });
      } else {
        // Chưa ai like mình, tạo mới hoặc giữ pending
        let myMatch = await Match.findOne({
          where: { user1_id: currentUserId, user2_id: targetId }
        });
        if (!myMatch) {
          await Match.create({ user1_id: currentUserId, user2_id: targetId, status: 'pending' });
        }
        return res.json({ matched: false, message: 'Đã like, chờ đối phương like lại.' });
      }
    } else if (action === 'dislike') {
      // Xử lý dislike nếu cần
      await Match.create({ user1_id: currentUserId, user2_id: targetId, status: 'rejected' });
      return res.json({ matched: false, message: 'Đã dislike.' });
    }
  } catch (error) {
    console.error('Lỗi khi tạo match:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findByPk(userId);
    if (!user) {
        return res.status(404).json({ message: 'Không tìm thấy user' });
    }

    const fieldsToUpdate = {};
    const possibleFields = ['name', 'age', 'gender', 'birthday', 'bio', 'height', 'weight', 'job', 'hobbies'];

    // Xây dựng đối tượng fieldsToUpdate một cách an toàn
    possibleFields.forEach(field => {
        // Chỉ xử lý các trường có trong req.body
        if (req.body[field] !== undefined) {
            fieldsToUpdate[field] = req.body[field] === '' ? null : req.body[field];
        }
    });

    // Tự động tính tuổi nếu có ngày sinh được cung cấp
    if (fieldsToUpdate.birthday) {
        const birthDate = new Date(fieldsToUpdate.birthday);
        // Kiểm tra xem ngày có hợp lệ không
        if (!isNaN(birthDate.getTime())) {
            const today = new Date();
            let calculatedAge = today.getFullYear() - birthDate.getFullYear();
            const m = today.getMonth() - birthDate.getMonth();
            if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
                calculatedAge--;
            }
            // Chỉ cập nhật tuổi nếu không có tuổi được cung cấp trực tiếp
            if (fieldsToUpdate.age === undefined) {
                fieldsToUpdate.age = calculatedAge;
            }
        }
    } else if (fieldsToUpdate.birthday === null) {
        // Nếu người dùng xóa ngày sinh, cũng xóa luôn tuổi (chỉ khi không có tuổi được cung cấp trực tiếp)
        if (fieldsToUpdate.age === undefined) {
            fieldsToUpdate.age = null;
        }
    }

    await user.update(fieldsToUpdate);
    
    // Trả về user đã được cập nhật
    res.json(user);

  } catch (error) {
    // Bắt lỗi validation từ Sequelize và gửi về thông báo rõ ràng
    if (error.name === 'SequelizeValidationError') {
        const messages = error.errors.map(e => e.message);
        return res.status(400).json({ message: messages.join(', ') });
    }
    console.error('Lỗi cập nhật hồ sơ:', error);
    res.status(500).json({ message: 'Lỗi server không xác định', error: error.message });
  }
};

exports.uploadAvatar = [
  upload.single('avatar'),
  async (req, res, next) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'Vui lòng chọn một file để upload.' });
      }

    const userId = req.user.id;
    const user = await User.findByPk(userId);

      if (!user) {
        return res.status(404).json({ message: 'Không tìm thấy user' });
      }

    user.profile_picture = `/uploads/${req.file.filename}`;
    await user.save();
      
    res.json({ message: 'Cập nhật ảnh đại diện thành công', url: user.profile_picture });
    
    } catch (error) {
      // Chuyển lỗi đến middleware xử lý lỗi chung
      next(error);
    }
  }
];

exports.uploadUserPhotos = [
  uploadPhotos.array('photos', 5), // tối đa 5 ảnh/lần
  async (req, res, next) => {
    try {
      const userId = req.user.id;
      const files = req.files;
      if (!files || files.length === 0) {
        return res.status(400).json({ message: 'Không có ảnh nào được upload' });
      }
      
      const photoRecords = files.map(file => ({
            user_id: userId,
            photo_url: `/uploads/${file.filename}`
      }));

      const newPhotos = await UserPhoto.bulkCreate(photoRecords);

      res.status(201).json({ 
          message: 'Upload ảnh thành công', 
          photos: newPhotos 
      });

    } catch (error) {
      // Chuyển lỗi đến middleware xử lý lỗi chung
      next(error);
    }
  }
];

exports.getUserPhotos = async (req, res) => {
  try {
    const userId = req.params.id || req.user.id;
    const photos = await UserPhoto.findAll({ where: { user_id: userId } });
    res.json(photos);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
};

exports.getProfile = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);
    if (!user) return res.status(404).json({ message: 'Không tìm thấy user' });
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server' });
  }
};

exports.deleteUserPhoto = async (req, res) => {
  try {
    const photoId = req.params.photoId;
    const userId = req.user.id;
    const photo = await UserPhoto.findOne({ where: { id: photoId, user_id: userId } });
    if (!photo) return res.status(404).json({ message: 'Không tìm thấy ảnh' });
    await photo.destroy();
    res.json({ message: 'Đã xóa ảnh' });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
};