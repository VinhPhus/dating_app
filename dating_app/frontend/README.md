# Dating App Frontend

## 📁 Cấu trúc thư mục

```
frontend/
├── public/
│   ├── index.html         # 🆕 Trang chủ mới (trước đây là home.html)
│   ├── login.html         # Trang đăng nhập/đăng ký (trước đây là index.html)
│   ├── app.html           # Trang chính sau khi đăng nhập
│   └── assets/
│       ├── css/
│       │   ├── home.css   # CSS cho trang chủ
│       │   ├── style.css  # CSS chung
│       │   ├── chat.css   # CSS cho chat
│       │   └── profile.css # CSS cho profile
│       ├── js/
│       │   ├── home.js    # JS cho trang chủ
│       │   ├── auth.js    # JS xử lý đăng nhập/đăng ký
│       │   ├── main.js    # JS cho trang chính
│       │   └── chat.js    # JS cho chat
│       └── images/
│           └── default-avatar.jpg
└── README.md
```

## 🚀 Cách sử dụng

### 1. Trang chủ (index.html)
- **URL**: `index.html` (Mặc định khi truy cập server)
- **Mô tả**: Trang landing page với thiết kế hiện đại.
- **Tính năng**:
  - Hero section với animation
  - Giới thiệu tính năng
  - Hướng dẫn sử dụng
  - Call-to-action buttons
  - Footer đầy đủ

### 2. Trang đăng nhập/đăng ký (login.html)
- **URL**: `login.html`
- **Mô tả**: Form đăng nhập và đăng ký.
- **Tính năng**:
  - Chuyển đổi giữa form đăng nhập và đăng ký.
  - Validation cơ bản.
  - Link trực tiếp đến form đăng ký: `login.html#register`

### 3. Trang chính (app.html)
- **URL**: `app.html` (Sau khi đăng nhập thành công)
- **Mô tả**: Giao diện chính của ứng dụng.
- **Tính năng**:
  - Khám phá người dùng
  - Chat với người đã match
  - Quản lý hồ sơ

## 🎨 Thiết kế

### Trang chủ (home.html)
- **Thiết kế**: Modern, responsive
- **Màu sắc**: Gradient pink/purple theme
- **Animation**: 
  - Floating cards
  - Smooth scrolling
  - Intersection Observer
  - Button ripple effects
  - Parallax scrolling

### Responsive Design
- **Desktop**: Layout 2 cột cho hero section
- **Tablet**: Layout 1 cột, cards stack vertically
- **Mobile**: Tối ưu cho màn hình nhỏ

## 🔗 Navigation

### Từ trang chủ:
- **"Đăng nhập"** → `login.html`
- **"Đăng ký"** → `login.html#register`
- **"Bắt đầu ngay"** → `login.html#register`

### Từ trang đăng nhập:
- **"🏠 Trang chủ"** → `index.html`
- **"Đăng ký ngay"** → Chuyển sang form đăng ký

## 🛠️ Công nghệ sử dụng

- **HTML5**: Semantic markup
- **CSS3**: 
  - Flexbox & Grid
  - CSS Animations
  - Media Queries
  - Custom Properties
- **JavaScript (ES6+)**:
  - Intersection Observer API
  - Smooth scrolling
  - Event handling
  - DOM manipulation

## 📱 Tính năng đặc biệt

### Trang chủ:
1. **Hero Section**: 
   - Typing effect cho tiêu đề
   - Floating user cards
   - Gradient background

2. **Features Section**:
   - Hover animations
   - Icon animations
   - Responsive grid

3. **How it works**:
   - Step-by-step guide
   - Numbered circles
   - Clean layout

4. **CTA Section**:
   - Gradient background
   - Call-to-action buttons
   - Social proof

5. **Footer**:
   - Social media links
   - Company information
   - Legal links

### Hiệu ứng:
- **Scroll Progress Bar**: Thanh tiến trình khi scroll
- **Navbar Effects**: Thay đổi background khi scroll
- **Button Ripple**: Hiệu ứng gợn sóng khi click
- **Smooth Animations**: Transition mượt mà

## 🚀 Chạy ứng dụng

1.  **Mở thư mục**: `dating-app/frontend/public`
2.  **Sử dụng live server**:
    - Nếu bạn dùng VS Code, có thể cài extension "Live Server" và click "Go Live".
    - Hoặc chạy lệnh trong terminal:
      ```bash
      # Điều hướng đến đúng thư mục
      cd dating-app/frontend/public

      # Chạy server
      live-server --port=3000
      ```
    - Trình duyệt sẽ tự động mở trang chủ (`index.html`).

## 📝 Ghi chú
- Trang chủ giờ đây là `index.html`, vì vậy `live-server` sẽ tự động nhận diện và mở nó.
- Các liên kết và chuyển hướng đã được cập nhật để phù hợp với cấu trúc file mới.

## 🎯 Mục tiêu

Trang chủ được thiết kế để:
- Thu hút người dùng mới
- Giải thích rõ tính năng
- Tăng tỷ lệ đăng ký
- Tạo ấn tượng chuyên nghiệp
- Responsive trên mọi thiết bị 