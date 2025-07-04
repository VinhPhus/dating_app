document.addEventListener("sectionChanged", (e) => {
  if (e.detail.section === "messages") {
    initMessages(e.detail);
  }
});

let isMessagesInitialized = false;

function initMessages(detail) {
  if (isMessagesInitialized) return;

  const { token, userData } = detail;
  const backendUrl = "http://localhost:5000";

  // DOM Elements
  const tabButtons = document.querySelectorAll(".messages-tabs .tab-btn");
  const likedBadge = document.getElementById("likedBadge");
  const matchBadge = document.getElementById("matchBadge");
  const messagesList = document.getElementById("messagesList");
  const chatList = document.getElementById("chatList");
  const deletedMatchesList = document.getElementById("deletedMatchesList");
  const chatWindow = document.getElementById("chatWindow");
  const chatMessages = document.getElementById("chatMessages");
  const chatUserName = document.getElementById("chatUserName");
  const chatUserAvatar = document.getElementById("chatUserAvatar");
  const messageInput = document.getElementById("messageInput");
  const sendBtn = document.getElementById("sendBtn");
  const backToListBtn = document.getElementById("backToListBtn");
  const chatHeaderInfo = document.querySelector(".chat-user-info");

  let currentChatUserId = null;

  // --- Helper Functions ---
  async function fetchData(endpoint, options = {}) {
    try {
      const defaultOptions = {
        headers: { Authorization: `Bearer ${token}` },
      };
      if (options.body) {
        defaultOptions.headers["Content-Type"] = "application/json";
      }
      const response = await fetch(`${backendUrl}/api${endpoint}`, {
        ...defaultOptions,
        ...options,
      });
      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({ message: `HTTP error! status: ${response.status}` }));
        throw new Error(errorData.message);
      }
      // Some responses might be empty (e.g., DELETE)
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.indexOf("application/json") !== -1) {
        return await response.json();
      }
      return {};
    } catch (error) {
      console.error(`Failed to fetch from ${endpoint}:`, error);
      alert(error.message); // Show error to user
      return null; // Return null to indicate failure
    }
  }

  // --- "Liked You" Tab Logic ---
  async function handleLikedUserAction(targetId, action, cardElement) {
    // Thêm loading state cho nút action
    const actionBtn = cardElement.querySelector(
      `.action-btn-small.${action === "like" ? "like" : "dislike"}`
    );
    const originalContent = actionBtn.innerHTML;
    actionBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
    actionBtn.disabled = true;

    // Ẩn element với animation mượt mà
    cardElement.style.transition =
      "opacity 0.3s ease, transform 0.3s ease, height 0.3s ease";
    cardElement.style.opacity = "0";
    cardElement.style.transform = "scale(0.95)";
    cardElement.style.height = "0";
    cardElement.style.padding = "0";
    cardElement.style.margin = "0";
    cardElement.style.overflow = "hidden";

    try {
      const result = await fetchData("/swipe", {
        method: "POST",
        body: JSON.stringify({ targetId, action }),
      });

      if (result && result.matched) {
        // Hiển thị thông báo match
        setTimeout(() => {
          alert("It's a match!");
          // Cập nhật badge nếu đang ở tab matches
          const matchesTab = document.querySelector(
            '.tab-btn[data-tab="matches"]'
          );
          if (matchesTab && matchesTab.classList.contains("active")) {
            loadMatchedUsers();
          }
        }, 300);
      } else if (result === null) {
        // Nếu lỗi, khôi phục lại element
        cardElement.style.opacity = "1";
        cardElement.style.transform = "scale(1)";
        cardElement.style.height = "";
        cardElement.style.padding = "";
        cardElement.style.margin = "";
        cardElement.style.overflow = "";
        actionBtn.innerHTML = originalContent;
        actionBtn.disabled = false;
        alert("Có lỗi xảy ra. Vui lòng thử lại.");
      } else {
        // Thành công, xóa element sau animation
        setTimeout(() => {
          cardElement.remove();
          // Cập nhật badge số lượng
          const currentBadge = document.getElementById("likedBadge");
          if (currentBadge) {
            const currentCount = parseInt(currentBadge.textContent) || 0;
            currentBadge.textContent = Math.max(0, currentCount - 1);
          }
        }, 300);
      }
    } catch (error) {
      // Xử lý lỗi network
      cardElement.style.opacity = "1";
      cardElement.style.transform = "scale(1)";
      cardElement.style.height = "";
      cardElement.style.padding = "";
      cardElement.style.margin = "";
      cardElement.style.overflow = "";
      actionBtn.innerHTML = originalContent;
      actionBtn.disabled = false;
      alert("Lỗi kết nối. Vui lòng kiểm tra internet và thử lại.");
    }
  }

  // Tab logic mới: mỗi tab sẽ hiển thị 1 content, ẩn các tab khác
  function showTab(tabName) {
    // Ẩn tất cả tab-content
    document.getElementById("likedYouTab").classList.remove("active");
    document.getElementById("matchesTab").classList.remove("active");
    document.getElementById("deletedTab").classList.remove("active");
    // Hiện tab-content tương ứng
    if (tabName === "liked-you") {
      document.getElementById("likedYouTab").classList.add("active");
    } else if (tabName === "matches") {
      document.getElementById("matchesTab").classList.add("active");
    } else if (tabName === "deleted") {
      document.getElementById("deletedTab").classList.add("active");
    }
  }

  async function loadLikedUsers() {
    const likedMeMatches = await fetchData("/messages/liked-you");
    messagesList.innerHTML = "";
    if (!likedMeMatches || likedMeMatches.length === 0) {
      messagesList.innerHTML =
        '<p class="empty-tab-message">Chưa có ai thích bạn.</p>';
      likedBadge.textContent = "0";
      return;
    }
    likedBadge.textContent = likedMeMatches.length;
    likedMeMatches.forEach((match) => {
      const user = match.Swiper;
      if (!user) return;

      const userCard = document.createElement("div");
      userCard.className = "user-card-small";
      userCard.innerHTML = `
                <div class="card-image">
                    <img src="${
                      user.profile_picture
                        ? backendUrl + user.profile_picture
                        : "./assets/images/default-avatar.jpg"
                    }" alt="${user.name}">
                </div>
                <div class="card-info">
                    <h4>${user.name}</h4>
                    <p>${user.age ? user.age + " tuổi" : "N/A"}</p>
                </div>
                <div class="card-actions">
                    <button class="action-btn-small dislike" title="Bỏ qua" tabindex="0"><i class="fas fa-times"></i></button>
                    <button class="action-btn-small like" title="Thích lại" tabindex="0"><i class="fas fa-heart"></i></button>
                </div>`;

      // Ngăn click vào card khi bấm nút
      userCard.querySelector(".like").addEventListener("click", (e) => {
        e.stopPropagation();
        userCard.classList.add("active");
        handleLikedUserAction(user.id, "like", userCard);
        setTimeout(() => userCard.classList.remove("active"), 300);
      });
      userCard.querySelector(".dislike").addEventListener("click", (e) => {
        e.stopPropagation();
        userCard.classList.add("active");
        handleLikedUserAction(user.id, "dislike", userCard);
        setTimeout(() => userCard.classList.remove("active"), 300);
      });

      messagesList.appendChild(userCard);
    });
  }

  // --- "Matches" Tab Logic ---
  async function loadMatchedUsers() {
    const matches = await fetchData("/messages/matched-users");
    chatList.innerHTML = "";
    if (!matches || matches.length === 0) {
      chatList.innerHTML =
        '<p class="empty-tab-message">Bạn chưa có cặp đôi nào. Hãy tiếp tục tìm kiếm!</p>';
      matchBadge.textContent = "0";
      return;
    }

    // Tính tổng số tin nhắn chưa đọc
    const totalUnread = matches.reduce(
      (total, match) => total + (match.unread_count || 0),
      0
    );
    matchBadge.textContent = totalUnread > 0 ? totalUnread : "";

    matches.forEach((match) => {
      const otherUser = match.user;
      if (!otherUser) return;
      const chatItem = document.createElement("div");
      chatItem.className = "chat-item";
      chatItem.dataset.userId = otherUser.id;
      chatItem.innerHTML = `
                <div class="avatar-wrapper">
                  <img src="${
                    otherUser.profile_picture
                      ? backendUrl + otherUser.profile_picture
                      : "./assets/images/default-avatar.jpg"
                  }" alt="avatar">
                  ${match.online ? '<span class="online-dot"></span>' : ""}
                </div>
                <div class="chat-item-info">
                    <h4>${otherUser.name}</h4>
                    <p class="last-message">${
                      match.lastMessage
                        ? match.lastMessage
                        : "Bắt đầu trò chuyện..."
                    }</p>
                </div>
                <div class="chat-item-meta">
                  <span class="last-message-time">${
                    match.lastMessageTime
                      ? new Date(match.lastMessageTime).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : ""
                  }</span>
                  ${
                    match.unread_count > 0
                      ? `<span class="unread-badge">${match.unread_count}</span>`
                      : ""
                  }
                </div>
                <button class="unmatch-btn" title="Bỏ tương hợp"><i class="fas fa-times-circle"></i></button>
            `;
      chatItem.querySelector(".unmatch-btn").addEventListener("click", (e) => {
        e.stopPropagation();
        handleDeleteMatch(otherUser.id, chatItem);
      });

      chatItem.addEventListener("click", () => openChat(otherUser));
      chatList.appendChild(chatItem);
    });
  }

  async function handleDeleteMatch(targetId, element) {
    if (!confirm("Bạn có chắc muốn ẩn cuộc trò chuyện này?")) return;

    const unmatchBtn = element.querySelector(".unmatch-btn");
    const originalContent = unmatchBtn.innerHTML;
    unmatchBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
    unmatchBtn.disabled = true;

    element.style.transition =
      "opacity 0.3s, height 0.3s, margin 0.3s, padding 0.3s";
    element.style.opacity = "0";
    element.style.height = "0";
    element.style.margin = "0";
    element.style.padding = "0";

    setTimeout(() => {
      element.remove();
      // Cập nhật lại tổng số tin nhắn chưa đọc
      updateTotalUnreadCount();
      // Nếu không còn chat-item nào, hiển thị thông báo trống
      if (!chatList.querySelector(".chat-item")) {
        chatList.innerHTML =
          '<p class="empty-tab-message">Bạn chưa có cặp đôi nào. Hãy tiếp tục tìm kiếm!</p>';
      }
    }, 300);

    try {
      await fetchData(`/messages/match/${targetId}`, { method: "DELETE" });
      // Không render lại danh sách từ backend response nữa
    } catch (error) {
      element.style.opacity = "1";
      element.style.height = "";
      element.style.margin = "";
      element.style.padding = "";
      unmatchBtn.innerHTML = originalContent;
      unmatchBtn.disabled = false;
      alert("Lỗi kết nối. Vui lòng kiểm tra internet và thử lại.");
    }
  }

  // Ẩn avatar, tên, trạng thái khi load trang/chưa chọn chat
  chatHeaderInfo.style.display = "none";

  // Khi mở chat (openChat), nếu là mobile thì ẩn panel trái, hiện chat window
  function isMobileView() {
    return window.innerWidth <= 700;
  }

  async function openChat(user) {
    currentChatUserId = user.id;
    // Hiện avatar, tên, trạng thái và nút back
    chatHeaderInfo.style.display = "";
    if (backToListBtn) backToListBtn.style.display = "inline-flex";
    chatUserName.textContent = user.name;
    chatUserAvatar.src = user.profile_picture
      ? backendUrl + user.profile_picture
      : "./assets/images/default-avatar.jpg";
    // Hiển thị trạng thái online
    const chatUserStatus = document.getElementById("chatUserStatus");
    if (user.online) {
      chatUserStatus.textContent = "Đang hoạt động";
      chatUserStatus.style.color = "#4caf50";
    } else {
      chatUserStatus.textContent = "Ngoại tuyến";
      chatUserStatus.style.color = "#aaa";
    }
    chatWindow.classList.add("active");
    if (isMobileView()) {
      document
        .querySelector(".messages-left-panel")
        .classList.add("hide-on-mobile");
    }

    document
      .querySelectorAll(".chat-item")
      .forEach((item) => item.classList.remove("active"));
    const currentChatItem = document.querySelector(
      `.chat-item[data-user-id='${user.id}']`
    );
    if (currentChatItem) currentChatItem.classList.add("active");

    // Đánh dấu tin nhắn đã đọc
    await fetchData(`/messages/mark-read/${user.id}`, { method: "PUT" });

    // Ẩn unread badge cho chat item này
    const unreadBadge = currentChatItem?.querySelector(".unread-badge");
    if (unreadBadge) {
      unreadBadge.remove();
    }

    const messages = await fetchData(`/messages?withUser=${user.id}`);
    chatMessages.innerHTML = "";
    if (!messages || messages.length === 0) {
      chatMessages.innerHTML = `<div class=\"no-chat-selected\"><i class=\"fas fa-comments\"></i><p>Bắt đầu cuộc trò chuyện với ${user.name}</p></div>`;
      return;
    }
    messages.forEach((msg) => appendMessage(msg));
    // Tự động scroll xuống cuối
    chatMessages.scrollTop = chatMessages.scrollHeight;

    // Cập nhật lại tổng số tin nhắn chưa đọc
    updateTotalUnreadCount();
  }

  function appendMessage(msg) {
    const messageEl = document.createElement("div");
    messageEl.className = `message ${
      msg.sender_id === userData.id ? "sent" : "received"
    }`;

    let messageContent = "";

    // Xử lý hiển thị tin nhắn dựa trên loại
    if (
      msg.message_type === "image" ||
      msg.message_type === "image_with_text"
    ) {
      messageEl.classList.add("message-with-image");
      messageContent = `
                <div class="message-content">
                    ${
                      msg.image_url
                        ? `
                        <div class="message-image-container">
                            <img src="${backendUrl}${msg.image_url}" alt="Message image" class="message-image" onclick="openImageModal('${backendUrl}${msg.image_url}')">
                            <div class="message-image-overlay">
                                <i class="fas fa-expand"></i>
                            </div>
                        </div>
                    `
                        : ""
                    }
                    ${
                      msg.content && msg.content.trim()
                        ? `<p class="message-text">${msg.content}</p>`
                        : ""
                    }
                </div>
            `;
    } else {
      messageContent = `<div class="message-content">${msg.content}</div>`;
    }

    messageEl.innerHTML = messageContent;
    chatMessages.appendChild(messageEl);
  }

  // Function để cập nhật tổng số tin nhắn chưa đọc
  async function updateTotalUnreadCount() {
    const matches = await fetchData("/messages/matched-users");
    if (!matches || matches.length === 0) {
      matchBadge.textContent = "";
      return;
    }

    const totalUnread = matches.reduce(
      (total, match) => total + (match.unread_count || 0),
      0
    );
    matchBadge.textContent = totalUnread > 0 ? totalUnread : "";
  }

  async function sendMessage() {
    const content = messageInput.value.trim();
    if (!content || !currentChatUserId) return;

    const tempMessage = { sender_id: userData.id, content: content };
    appendMessage(tempMessage);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    const noChatEl = chatMessages.querySelector(".no-chat-selected");
    if (noChatEl) noChatEl.remove();

    const messageData = {
      sender_id: userData.id,
      receiver_id: currentChatUserId,
      content: content,
    };
    messageInput.value = "";

    await fetchData("/messages", {
      method: "POST",
      body: JSON.stringify(messageData),
    });
  }

  // Function để gửi ảnh
  async function sendImage(file, textContent = "") {
    if (!currentChatUserId) return;

    // Hiển thị loading state
    const loadingEl = document.createElement("div");
    loadingEl.className = "image-upload-loading";
    loadingEl.innerHTML = `
        <div class="spinner"></div>
        <span>Đang gửi ảnh...</span>
    `;
    chatMessages.appendChild(loadingEl);
    chatMessages.scrollTop = chatMessages.scrollHeight;

    const noChatEl = chatMessages.querySelector(".no-chat-selected");
    if (noChatEl) noChatEl.remove();

    try {
      const formData = new FormData();
      formData.append("image", file);
      formData.append("receiver_id", currentChatUserId);
      if (textContent) {
        formData.append("content", textContent);
      }

      const response = await fetch(`${backendUrl}/api/messages`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({ message: `HTTP error! status: ${response.status}` }));
        throw new Error(errorData.message);
      }

      const result = await response.json();

      // Xóa loading state
      loadingEl.remove();

      // Hiển thị tin nhắn mới
      appendMessage(result.data);
      chatMessages.scrollTop = chatMessages.scrollHeight;
    } catch (error) {
      console.error("Lỗi gửi ảnh:", error);
      loadingEl.remove();
      alert("Có lỗi xảy ra khi gửi ảnh: " + error.message);
    }
  }

  // Function để xử lý chọn ảnh
  function handleImageSelect(event) {
    const file = event.target.files[0];
    if (!file) return;

    // Kiểm tra loại file
    if (!file.type.startsWith("image/")) {
      alert("Vui lòng chọn file ảnh hợp lệ");
      return;
    }

    // Kiểm tra kích thước file (5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert("Kích thước ảnh không được vượt quá 5MB");
      return;
    }

    // Hỏi người dùng có muốn thêm text không
    const textContent = messageInput.value.trim();
    if (!textContent) {
      // Nếu không có text, gửi ảnh ngay
      sendImage(file);
    } else {
      // Nếu có text, gửi ảnh với text
      sendImage(file, textContent);
      messageInput.value = "";
    }

    // Reset input file
    event.target.value = "";
  }

  // --- "Deleted" Tab Logic ---
  async function loadDeletedUsers() {
    deletedMatchesList.innerHTML = "";
    const users = await fetchData("/messages/deleted");
    if (!users || users.length === 0) {
      deletedMatchesList.innerHTML =
        '<p class="empty-tab-message">Không có cuộc trò chuyện nào bị xóa.</p>';
      return;
    }

    users.forEach((user) => {
      const userCard = document.createElement("div");
      userCard.className = "deleted-chat-item";
      userCard.innerHTML = `
                <img src="${
                  user.profile_picture
                    ? backendUrl + user.profile_picture
                    : "./assets/images/default-avatar.jpg"
                }" alt="${user.name}">
                <div class="deleted-chat-info">
                    <h4>${user.name}</h4>
                    <p>${user.age ? user.age + " tuổi" : ""} - ${
        user.bio ? user.bio.substring(0, 30) + "..." : "Không có giới thiệu"
      }</p>
                </div>
                <button class="restore-btn" title="Khôi phục"><i class="fas fa-undo"></i></button>
            `;
      userCard
        .querySelector(".restore-btn")
        .addEventListener("click", () => handleRestoreMatch(user.id, userCard));
      deletedMatchesList.appendChild(userCard);
    });
  }

  async function handleRestoreMatch(targetId, element) {
    const restoreBtn = element.querySelector(".restore-btn");
    const originalContent = restoreBtn.innerHTML;
    restoreBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
    restoreBtn.disabled = true;

    element.style.transition =
      "opacity 0.3s, height 0.3s, margin 0.3s, padding 0.3s";
    element.style.opacity = "0";
    element.style.height = "0";
    element.style.margin = "0";
    element.style.padding = "0";

    try {
      const result = await fetchData(`/messages/restore/${targetId}`, {
        method: "POST",
      });
      if (result === null) {
        element.style.opacity = "1";
        element.style.height = "";
        element.style.margin = "";
        element.style.padding = "";
        restoreBtn.innerHTML = originalContent;
        restoreBtn.disabled = false;
        alert("Có lỗi xảy ra khi khôi phục cuộc trò chuyện. Vui lòng thử lại.");
      } else {
        setTimeout(() => {
          element.remove();
        }, 300);
      }
    } catch (error) {
      element.style.opacity = "1";
      element.style.height = "";
      element.style.margin = "";
      element.style.padding = "";
      restoreBtn.innerHTML = originalContent;
      restoreBtn.disabled = false;
      alert("Lỗi kết nối. Vui lòng kiểm tra internet và thử lại.");
    }
  }

  // --- General Tab Handling ---
  function handleTabSwitch(e) {
    const targetTab = e.currentTarget.dataset.tab;
    // Bỏ active tất cả tab-btn
    tabButtons.forEach((btn) => btn.classList.remove("active"));
    // Active tab-btn hiện tại
    e.currentTarget.classList.add("active");
    // Hiện đúng tab-content
    showTab(targetTab);
    // Load dữ liệu tab
    if (targetTab === "liked-you") {
      loadLikedUsers();
    } else if (targetTab === "matches") {
      loadMatchedUsers();
    } else if (targetTab === "deleted") {
      loadDeletedUsers();
    }
  }

  // Gán lại event listener cho tab-btn (KHÔNG dùng cloneNode nữa)
  tabButtons.forEach((btn) => {
    btn.addEventListener("click", handleTabSwitch);
  });
  sendBtn.addEventListener("click", sendMessage);
  messageInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });

  // Event listeners cho gửi ảnh
  const attachImageBtn = document.getElementById("attachImageBtn");
  const imageInput = document.getElementById("imageInput");

  if (attachImageBtn) {
    attachImageBtn.addEventListener("click", () => {
      imageInput.click();
    });
  }

  if (imageInput) {
    imageInput.addEventListener("change", handleImageSelect);
  }

  // Initial load: tab đầu tiên
  if (tabButtons.length > 0) {
    tabButtons[0].click();
  }

  // Thêm sự kiện cho nút back
  if (backToListBtn) {
    backToListBtn.addEventListener("click", () => {
      // Ẩn avatar, tên, trạng thái khi quay lại danh sách
      chatHeaderInfo.style.display = "none";
      chatUserName.textContent = "Chọn cuộc trò chuyện";
      chatUserAvatar.src = "./assets/images/default-avatar.jpg";
      document.getElementById("chatUserStatus").textContent = "";
      chatMessages.innerHTML = `<div class=\"no-chat-selected\"><i class=\"fas fa-comments\"></i><p>Chọn một cuộc trò chuyện để bắt đầu</p></div>`;
      // Ẩn nút back khi quay lại danh sách
      backToListBtn.style.display = "none";

      // Reload lại danh sách chat để đồng bộ UI với backend
      loadMatchedUsers();
      loadDeletedUsers();

      // Responsive: trở về danh sách chat trên mobile
      if (isMobileView()) {
        document
          .querySelector(".messages-left-panel")
          .classList.remove("hide-on-mobile");
        chatWindow.classList.remove("active");
      }
    });
  }

  // Function để mở modal xem ảnh
  window.openImageModal = function (imageSrc) {
    const modal = document.getElementById("imageModal");
    const modalImage = document.getElementById("modalImage");
    modalImage.src = imageSrc;
    modal.classList.add("show");
  };

  // Đóng modal ảnh
  document.addEventListener("click", function (e) {
    const modal = document.getElementById("imageModal");
    const closeBtn = document.querySelector(".image-modal-close");

    if (
      e.target === modal ||
      e.target === closeBtn ||
      e.target.closest(".image-modal-close")
    ) {
      modal.classList.remove("show");
    }
  });

  // Đóng modal bằng phím ESC
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") {
      const modal = document.getElementById("imageModal");
      modal.classList.remove("show");
    }
  });

  isMessagesInitialized = true;
}
