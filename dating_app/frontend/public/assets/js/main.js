function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => {
        notification.remove();
    }, 3000); // Tự động xóa sau 3 giây
}

document.addEventListener('DOMContentLoaded', () => {
    // 1. Kiểm tra authentication
    const token = localStorage.getItem('token');
    const userData = JSON.parse(localStorage.getItem('user'));
    
    if (!token || !userData) {
        window.location.href = 'login.html';
      return;
    }
  
    // 2. DOM Elements
    const navLinks = document.querySelectorAll('.nav-link');
    const contentSections = document.querySelectorAll('.content-section');
    const logoutBtn = document.getElementById('logout');
    const mainTitle = document.querySelector('.discover-header h1'); // Giả định title ban đầu
  
    // 3. Functions
    function handleLogout() {
      localStorage.clear();
        window.location.href = 'login.html';
    }
  
    function handleNavigation(e) {
      e.preventDefault();
        const sectionId = e.currentTarget.dataset.section;
  
        // Ẩn tất cả section và bỏ active trên link
        contentSections.forEach(section => {
            section.classList.remove('active');
        });
        navLinks.forEach(link => {
            link.classList.remove('active');
        });
  
        // Hiện section tương ứng và active link
        const targetSection = document.getElementById(sectionId + 'Section');
        if (targetSection) {
            e.currentTarget.classList.add('active');
            targetSection.classList.add('active');
  
            // Gửi sự kiện để các module khác biết và khởi chạy
            // Chúng ta dùng CustomEvent để giao tiếp giữa các file JS
            const event = new CustomEvent('sectionChanged', { 
                detail: { 
                    section: sectionId, 
                    token: token, 
                    userData: userData 
        }
      });
            document.dispatchEvent(event);
        }
    }
  
    // 4. Event Listeners
    navLinks.forEach(link => {
        link.addEventListener('click', handleNavigation);
    });
  
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }
    
    // 5. Initial Load - Tự động click vào tab "Tìm bạn" khi tải trang
    const discoverLink = document.querySelector('.nav-link[data-section="discover"]');
    if (discoverLink) {
        discoverLink.click();
    }
  });