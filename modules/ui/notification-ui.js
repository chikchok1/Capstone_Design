// ============================================================
// 알림 UI 모듈
// ============================================================
import { auth } from "../firebase-config.js";
import { getMyNotifications, getUnreadNotificationCount, markNotificationAsRead, markAllNotificationsAsRead } from "../notifications.js";

export let notificationCheckInterval = null;

export function initNotificationUI() {
  window.updateNotificationBadge = async function () {
    const user = auth.currentUser;
    if (!user) return;

    try {
      const count = await getUnreadNotificationCount(user.uid);
      const badge = document.getElementById("notificationBadge");
      
      if (!badge) {
        const btn = document.querySelector('button[onclick="openNotificationCenter()"]');
        if (btn && count > 0) {
          const newBadge = document.createElement("span");
          newBadge.id = "notificationBadge";
          newBadge.className = "notification-badge";
          newBadge.textContent = count > 99 ? "99+" : count;
          btn.style.position = "relative";
          btn.appendChild(newBadge);
        }
      } else {
        if (count > 0) {
          badge.textContent = count > 99 ? "99+" : count;
          badge.style.display = "flex";
        } else {
          badge.style.display = "none";
        }
      }
    } catch (error) {
      console.error("알림 배지 업데이트 실패:", error);
    }
  };

  window.openNotificationCenter = async function () {
    const user = auth.currentUser;
    if (!user) return;

    const notifications = await getMyNotifications(user.uid);

    const modal = document.createElement("div");
    modal.className = "modal active";
    modal.id = "notificationModal";
    modal.innerHTML = `
      <div class="modal-content" style="max-width: 600px; max-height: 80vh; overflow-y: auto;">
        <button class="modal-close" onclick="closeNotificationCenter()">×</button>
        <div class="auth-form">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
            <h2 class="form-title" style="margin: 0;">🔔 알림</h2>
            ${notifications.filter(n => !n.isRead).length > 0 ? `
              <button class="btn btn-outline" onclick="markAllNotificationsRead()" style="font-size: 0.9rem; padding: 8px 16px;">
                모두 읽음
              </button>
            ` : ''}
          </div>

          <div id="notificationsList">
            ${notifications.length === 0 ? '<p style="text-align: center; padding: 40px; color: #6b7280;">알림이 없습니다.</p>' : notifications.map(notif => `
              <div class="notification-item ${notif.isRead ? '' : 'unread'}" onclick="markNotificationRead('${notif.id}')" style="padding: 15px; border: 1px solid ${notif.isRead ? '#e5e7eb' : '#3b82f6'}; border-radius: 12px; margin-bottom: 10px; cursor: pointer; background: ${notif.isRead ? 'white' : '#eff6ff'};">
                <h4 style="margin: 0 0 5px 0; color: #1f2937; font-size: 1rem;">${notif.title}</h4>
                <p style="margin: 0 0 8px 0; color: #6b7280; font-size: 0.9rem;">${notif.message}</p>
                <span style="color: #9ca3af; font-size: 0.8rem;">${formatDate(notif.createdAt)}</span>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(modal);
  };

  window.closeNotificationCenter = function () {
    const modal = document.getElementById("notificationModal");
    if (modal) modal.remove();
  };

  window.markNotificationRead = async function (notificationId) {
    await markNotificationAsRead(notificationId);
    window.closeNotificationCenter();
    await window.openNotificationCenter();
    await window.updateNotificationBadge();
  };

  window.markAllNotificationsRead = async function () {
    const user = auth.currentUser;
    if (!user) return;

    await markAllNotificationsAsRead(user.uid);
    window.closeNotificationCenter();
    await window.openNotificationCenter();
    await window.updateNotificationBadge();
  };

  window.startNotificationCheck = function () {
    window.updateNotificationBadge();
    notificationCheckInterval = setInterval(() => {
      window.updateNotificationBadge();
    }, 10000); // 10초마다 체크 (기존 30초에서 변경)
  };

  window.stopNotificationCheck = function () {
    if (notificationCheckInterval) {
      clearInterval(notificationCheckInterval);
      notificationCheckInterval = null;
    }
  };

  function formatDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 365) return `${Math.floor(days / 365)}년 전`;
    if (days > 30) return `${Math.floor(days / 30)}개월 전`;
    if (days > 7) return `${Math.floor(days / 7)}주 전`;
    if (days > 0) return `${days}일 전`;
    if (hours > 0) return `${hours}시간 전`;
    if (minutes > 0) return `${minutes}분 전`;
    return "방금 전";
  }
}
