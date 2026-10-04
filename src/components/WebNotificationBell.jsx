import React, { useEffect, useState } from "react";

const API = "http://localhost:8080/api";

export default function WebNotificationBell({ user }) {
  const [items, setItems] = useState([]);
  const [open, setOpen] = useState(false);

  const userId = Number(user?.userId);

  const load = async () => {
    if (!userId) return;

    try {
      const r = await fetch(`${API}/web-notifications/user/${userId}`);
      if (r.ok) {
        const data = await r.json();
        if (Array.isArray(data)) setItems(data);
      }
    } catch (_) {}
  };

  useEffect(() => {
    load();
    const timer = setInterval(load, 5000);
    return () => clearInterval(timer);
  }, [userId]);

  const unread = items.filter(n => !n.readStatus).length;

  const markRead = async (id) => {
    try {
      await fetch(`${API}/web-notifications/${id}/read`, {
        method: "PUT"
      });
      load();
    } catch (_) {}
  };

  const markAllRead = async () => {
    try {
      await fetch(
        `${API}/web-notifications/user/${userId}/read-all`,
        { method: "PUT" }
      );
      load();
    } catch (_) {}
  };

  return (
    <div style={{
      position: "fixed",
      top: "75px",
      right: "18px",
      zIndex: 99999
    }}>
      <button
        onClick={() => setOpen(v => !v)}
        style={{
          border: "0",
          borderRadius: "14px",
          padding: "10px 13px",
          background: "#fff",
          boxShadow: "0 3px 15px rgba(0,0,0,.15)",
          cursor: "pointer",
          fontSize: "20px",
          position: "relative"
        }}
      >
        🔔

        {unread > 0 && (
          <span style={{
            position: "absolute",
            top: "-6px",
            right: "-6px",
            background: "#ef4444",
            color: "#fff",
            borderRadius: "20px",
            minWidth: "20px",
            height: "20px",
            padding: "0 4px",
            fontSize: "11px",
            fontWeight: "700",
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
          }}>
            {unread > 99 ? "99+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div style={{
          position: "absolute",
          right: 0,
          top: "48px",
          width: "340px",
          maxWidth: "90vw",
          background: "#fff",
          borderRadius: "16px",
          boxShadow: "0 15px 40px rgba(0,0,0,.2)",
          overflow: "hidden"
        }}>
          <div style={{
            padding: "14px 16px",
            borderBottom: "1px solid #eee",
            display: "flex",
            justifyContent: "space-between"
          }}>
            <strong>🔔 Notifications</strong>

            <button
              onClick={markAllRead}
              disabled={!unread}
              style={{
                border: 0,
                background: "none",
                color: "#e11d48",
                cursor: "pointer",
                fontSize: "12px"
              }}
            >
              Mark all read
            </button>
          </div>

          <div style={{
            maxHeight: "380px",
            overflowY: "auto"
          }}>
            {items.length === 0 ? (
              <div style={{
                padding: "30px",
                textAlign: "center",
                color: "#777"
              }}>
                No notifications yet
              </div>
            ) : (
              items.map(n => (
                <div
                  key={n.id}
                  onClick={() => !n.readStatus && markRead(n.id)}
                  style={{
                    padding: "13px 16px",
                    borderBottom: "1px solid #f1f1f1",
                    background: n.readStatus
                      ? "#fff"
                      : "#fff1f2",
                    cursor: n.readStatus
                      ? "default"
                      : "pointer"
                  }}
                >
                  <div style={{
                    fontWeight: 700,
                    fontSize: "14px"
                  }}>
                    {n.title}
                  </div>

                  <div style={{
                    fontSize: "13px",
                    color: "#555",
                    marginTop: "4px"
                  }}>
                    {n.message}
                  </div>

                  <div style={{
                    fontSize: "10px",
                    color: "#999",
                    marginTop: "5px"
                  }}>
                    {n.createdAt
                      ? new Date(n.createdAt).toLocaleString()
                      : ""}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
