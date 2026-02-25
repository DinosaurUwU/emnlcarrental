"use client";
//Messages.js
import React, { useMemo, useState } from "react";
import { useUser } from "../lib/UserContext";
import "./Messages.css";
import { MdCheckCircle } from "react-icons/md";

const Messages = () => {
  const {
    user,
    userMessages,
    sentMessages,
    deleteMessage,
    markMessageAsRead,
    sendMessage,
  } = useUser();

  const [showMessageSuccess, setShowMessageSuccess] = useState(false);
  const [messageSuccessMessage, setMessageSuccessMessage] = useState("");

  const [selectedNotification, setSelectedNotification] = useState(null);

  const [activeTab, setActiveTab] = useState("notifications");

  const [showDeleteOverlay, setShowDeleteOverlay] = useState(false);
  const [messageToDelete, setMessageToDelete] = useState(null);

  const [selectedMessageIds, setSelectedMessageIds] = useState([]);
  const [selectedOption, setSelectedOption] = useState("none");

  const [showMessagesDeletedOverlay, setShowMessagesDeletedOverlay] =
    useState(false);
  const [hideMessagesDeletedAnimation, setHideMessagesDeletedAnimation] =
    useState(false);
  const [deletedMessageCount, setDeletedMessageCount] = useState(0);

  const [visibleCount, setVisibleCount] = useState(50);

  const [selectedConversationId, setSelectedConversationId] = useState(null);
  const [chatInput, setChatInput] = useState("");

  const notificationMessages = useMemo(() => {
    return [...(userMessages || [])]
      .filter((m) => m?.isNotification === true)
      .sort(
        (a, b) =>
          (b.startTimestamp?.toDate?.().getTime() || 0) -
          (a.startTimestamp?.toDate?.().getTime() || 0),
      );
  }, [userMessages]);

  const processedNotifications = useMemo(() => {
    return notificationMessages.slice(0, visibleCount);
  }, [notificationMessages, visibleCount]);

  const chatMessages = useMemo(() => {
    const inboxChat = (userMessages || [])
      .filter((m) => !m?.isNotification)
      .map((m) => ({ ...m, _source: "inbox" }));

    const sentChat = (sentMessages || [])
      .filter((m) => !m?.isNotification)
      .map((m) => ({ ...m, _source: "sentbox" }));

    return [...inboxChat, ...sentChat];
  }, [userMessages, sentMessages]);

  const conversationThreads = useMemo(() => {
    if (!user?.uid) return [];

    const map = new Map();

    const getMs = (msg) => msg?.startTimestamp?.toDate?.().getTime() || 0;

    for (const msg of chatMessages) {
      const senderUid = msg?.senderUid || "";
      const recipientUid = msg?.recipientUid || "";

      const otherUid = senderUid === user.uid ? recipientUid : senderUid;
      if (!otherUid) continue;

      if (!map.has(otherUid)) {
        map.set(otherUid, {
          id: otherUid,
          participant: {
            name:
              senderUid === user.uid
                ? msg?.recipientName || msg?.recipientEmail || otherUid
                : msg?.name || msg?.email || otherUid,
            email:
              senderUid === user.uid
                ? msg?.recipientEmail || "No email"
                : msg?.email || "No email",
            contact:
              senderUid === user.uid
                ? msg?.recipientContact || "No contact"
                : msg?.contact || "No contact",
            profilePic: msg?.profilePic || "/assets/profile.png",
          },
          messages: [],
          unreadCount: 0,
          latest: null,
        });
      }

      const thread = map.get(otherUid);
      thread.messages.push(msg);

      if (msg._source === "inbox" && !msg.readStatus) {
        thread.unreadCount += 1;
      }

      if (!thread.latest || getMs(msg) > getMs(thread.latest)) {
        thread.latest = msg;
      }
    }

    const threads = Array.from(map.values())
      .map((thread) => ({
        ...thread,
        messages: [...thread.messages].sort((a, b) => getMs(a) - getMs(b)),
      }))
      .sort((a, b) => getMs(b.latest) - getMs(a.latest));

    return threads;
  }, [chatMessages, user?.uid]);

  const selectedThread = useMemo(() => {
    return (
      conversationThreads.find((thread) => thread.id === selectedConversationId) ||
      null
    );
  }, [conversationThreads, selectedConversationId]);

  const handleMessagesDeleted = (count) => {
    setDeletedMessageCount(count);
    setHideMessagesDeletedAnimation(false);
    setShowMessagesDeletedOverlay(true);

    setTimeout(() => {
      setHideMessagesDeletedAnimation(true);
      setTimeout(() => setShowMessagesDeletedOverlay(false), 400);
    }, 5000);
  };

  const openNotification = (message) => {
    if (!message.readStatus) {
      markMessageAsRead(message.id);
    }
    setSelectedNotification(message);
  };

  const closeNotification = () => {
    setSelectedNotification(null);
  };

  const openConversation = (threadId) => {
    setSelectedConversationId(threadId);

    const thread = conversationThreads.find((t) => t.id === threadId);
    if (!thread) return;

    thread.messages.forEach((msg) => {
      if (msg._source === "inbox" && !msg.readStatus) {
        markMessageAsRead(msg.id);
      }
    });
  };

  const sendConversationMessage = () => {
    if (!chatInput.trim()) return;
    if (!user?.uid || !selectedThread?.id) return;

    const contactInfo = {
      name: user.name,
      email: user.email,
      phone: user.phone,
      message: chatInput.trim(),
      recipientUid: selectedThread.id,
      senderUid: user.uid,
      isAdminSender: true,
      recipientName: selectedThread.participant?.name,
      recipientEmail: selectedThread.participant?.email,
      recipientPhone: selectedThread.participant?.contact,
    };

    sendMessage(contactInfo);

    setMessageSuccessMessage("Message sent!");
    setShowMessageSuccess(true);
    setChatInput("");
  };

  const closeMessageSuccess = () => {
    setShowMessageSuccess(false);
    setMessageSuccessMessage("");
  };

  const currentCount =
    activeTab === "notifications"
      ? notificationMessages.length
      : conversationThreads.length;

        const formatMessageTimestamp = (message) => {
    const ts = message?.startTimestamp;

    if (ts?.toDate) {
      const datePart = ts.toDate().toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        timeZone: "Asia/Manila",
      });
      const timePart = ts.toDate().toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
        timeZone: "Asia/Manila",
      });
      return `${datePart} | ${timePart}`;
    }

    if (typeof ts?.seconds === "number") {
      const d = new Date(ts.seconds * 1000);
      const datePart = d.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        timeZone: "Asia/Manila",
      });
      const timePart = d.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
        timeZone: "Asia/Manila",
      });
      return `${datePart} | ${timePart}`;
    }

    return message?.formattedDateTime || "No timestamp";
  };

  

   const formatElapsed = (message) => {
    const ts = message?.startTimestamp;
    const now = Date.now();

    let msgMs = 0;
    if (ts?.toDate) {
      msgMs = ts.toDate().getTime();
    } else if (typeof ts?.seconds === "number") {
      msgMs = ts.seconds * 1000;
    } else {
      return "";
    }

    const diffMs = Math.max(0, now - msgMs);
    const minute = 60 * 1000;
    const hour = 60 * minute;
    const day = 24 * hour;

    if (diffMs < hour) return `${Math.max(1, Math.floor(diffMs / minute))}m`;
    if (diffMs < day) return `${Math.floor(diffMs / hour)}h`;
    return `${Math.floor(diffMs / day)}d`;
  };

  return (
    <div className="parent-messages-container">
      <div className="messages-container">
        {showDeleteOverlay && !Array.isArray(messageToDelete) && (
          <div className="overlay-revert">
            <div className="confirm-modal">
              <h3>Delete Message</h3>
              <p>This message will be permanently deleted. Are you sure?</p>
              <div className="confirm-buttons">
                <button
                  className="confirm-btn revert"
                  onClick={() => {
                    const deleteType = messageToDelete?._source || "inbox";
                    deleteMessage(messageToDelete.id, deleteType);
                    handleMessagesDeleted(1);
                    setShowDeleteOverlay(false);
                    setMessageToDelete(null);

                    if (selectedNotification?.id === messageToDelete?.id) {
                      setSelectedNotification(null);
                    }
                  }}
                >
                  Yes, Delete
                </button>

                <button
                  onClick={() => {
                    setShowDeleteOverlay(false);
                    setMessageToDelete(null);
                  }}
                  className="confirm-btn cancel"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {showDeleteOverlay &&
          Array.isArray(messageToDelete) &&
          messageToDelete.length >= 1 && (
            <div className="overlay-revert">
              <div className="confirm-modal">
                <h3>
                  Delete {messageToDelete.length === 1 ? "Message" : "Messages"}
                </h3>
                <p>
                  {messageToDelete.length === 1
                    ? "This message will be permanently deleted. Are you sure?"
                    : `These ${messageToDelete.length} messages will be permanently deleted. Are you sure?`}
                </p>
                <div className="confirm-buttons">
                  <button
                    className="confirm-btn revert"
                    onClick={() => {
                      deleteMessage(messageToDelete, "inbox");
                      handleMessagesDeleted(messageToDelete.length);
                      setShowDeleteOverlay(false);
                      setMessageToDelete(null);
                      setSelectedMessageIds([]);
                    }}
                  >
                    Delete
                  </button>
                  <button
                    className="confirm-btn cancel"
                    onClick={() => {
                      setShowDeleteOverlay(false);
                      setMessageToDelete(null);
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

        <h2>Messages & Notifications ({currentCount})</h2>

        <div className="tabs-container">
          <div className="tabs-left">
            <button
              className={`tab ${activeTab === "notifications" ? "active" : ""}`}
              onClick={() => {
                setActiveTab("notifications");
                setSelectedMessageIds([]);
              }}
            >
              Notifications
            </button>
            <button
              className={`tab ${activeTab === "conversations" ? "active" : ""}`}
              onClick={() => {
                setActiveTab("conversations");
                setSelectedMessageIds([]);
              }}
            >
              Conversations
            </button>
          </div>

          <div className="tabs-right">
            {activeTab === "notifications" && selectedMessageIds.length > 0 && (
              <span className="selected-count">({selectedMessageIds.length})</span>
            )}

            {activeTab === "notifications" && (
              <div className="checkbox-dropdown-wrapper">
                <div className="message-action-icons">
                  {selectedMessageIds.length > 0 && (
                    <>
                      {notificationMessages
                        .filter((message) => selectedMessageIds.includes(message.id))
                        .some((message) => !message.readStatus) && (
                        <img
                          src="/assets/open-envelope.png"
                          alt="Mark as Read"
                          className="message-action-icon"
                          title="Mark as Read"
                          onClick={(e) => {
                            e.stopPropagation();
                            selectedMessageIds.forEach((id) => {
                              const msg = notificationMessages.find((m) => m.id === id);
                              if (msg && !msg.readStatus) markMessageAsRead(id);
                            });
                          }}
                        />
                      )}

                      {notificationMessages
                        .filter((message) => selectedMessageIds.includes(message.id))
                        .some((message) => message.readStatus) && (
                        <img
                          src="/assets/close-envelope.png"
                          alt="Mark as Unread"
                          className="message-action-icon"
                          title="Mark as Unread"
                          onClick={(e) => {
                            e.stopPropagation();
                            selectedMessageIds.forEach((id) => {
                              const msg = notificationMessages.find((m) => m.id === id);
                              if (msg && msg.readStatus) markMessageAsRead(id);
                            });
                          }}
                        />
                      )}

                      <img
                        src="/assets/delete.png"
                        alt="Delete"
                        className="message-action-icon"
                        title="Delete Selected"
                        onClick={(e) => {
                          e.stopPropagation();
                          const messagesToDelete = notificationMessages.filter((msg) =>
                            selectedMessageIds.includes(msg.id),
                          );

                          if (messagesToDelete.length > 0) {
                            setMessageToDelete(messagesToDelete);
                            setShowDeleteOverlay(true);
                          }
                        }}
                      />
                    </>
                  )}
                </div>

                <input
                  type="checkbox"
                  ref={(el) => {
                    if (el) {
                      el.indeterminate =
                        selectedMessageIds.length > 0 &&
                        selectedMessageIds.length < processedNotifications.length;
                    }
                  }}
                  className="message-tabs-checkbox"
                  checked={
                    processedNotifications.length > 0 &&
                    selectedMessageIds.length === processedNotifications.length
                  }
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedMessageIds(processedNotifications.map((msg) => msg.id));
                    } else {
                      setSelectedMessageIds([]);
                    }
                  }}
                  title="Select All"
                />

                <select
                  className="message-tabs-select hide-text"
                  onChange={(e) => {
                    const option = e.target.value;
                    setSelectedOption(option);

                    let selected = [];

                    if (option === "all") {
                      selected = notificationMessages.map((msg) => msg.id);
                    } else if (option === "unread") {
                      selected = notificationMessages
                        .filter((msg) => !msg.readStatus)
                        .map((msg) => msg.id);
                    } else if (option === "read") {
                      selected = notificationMessages
                        .filter((msg) => msg.readStatus)
                        .map((msg) => msg.id);
                    } else if (option === "none") {
                      selected = [];
                    }

                    setSelectedMessageIds(selected);
                    e.target.selectedIndex = 0;
                  }}
                  title="More select options"
                >
                  <option value="none">&nbsp;&nbsp;&nbsp;None&nbsp;&nbsp;&nbsp;</option>
                  <option value="all">&nbsp;&nbsp;&nbsp;All&nbsp;&nbsp;&nbsp;</option>
                  <option value="unread">&nbsp;&nbsp;&nbsp;Unread&nbsp;&nbsp;&nbsp;</option>
                  <option value="read">&nbsp;&nbsp;&nbsp;Read&nbsp;&nbsp;&nbsp;</option>
                </select>
              </div>
            )}
          </div>
        </div>

        <div className="message-list">
          {activeTab === "notifications" && (
            <div>
              {processedNotifications.length > 0 ? (
                processedNotifications.map((message) => (
                  <div
                    key={message.id}
                    className={`message-item notification-item ${
                      message.readStatus ? "is-read" : "is-unread"
                    } ${selectedMessageIds.includes(message.id) ? "is-selected" : ""}`}
                    onClick={() => openNotification(message)}
                  >
                    <div className="message-actions-topright">
                      <img
                        src={
                          message.readStatus
                            ? "/assets/open-envelope.png"
                            : "/assets/close-envelope.png"
                        }
                        alt={message.readStatus ? "Mark as Unread" : "Mark as Read"}
                        className="action-icon envelope-icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          markMessageAsRead(message.id);
                        }}
                      />
                      <img
                        src="/assets/delete.png"
                        alt="Delete"
                        className="action-icon delete-icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          setMessageToDelete(message);
                          setShowDeleteOverlay(true);
                        }}
                        onMouseEnter={(e) =>
                          (e.currentTarget.src = "/assets/delete-hover.png")
                        }
                        onMouseLeave={(e) =>
                          (e.currentTarget.src = "/assets/delete.png")
                        }
                      />
                      <input
                        type="checkbox"
                        className="message-checkbox"
                        checked={selectedMessageIds.includes(message.id)}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          setSelectedMessageIds((prev) =>
                            checked
                              ? [...prev, message.id]
                              : prev.filter((id) => id !== message.id),
                          );
                        }}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>

                    <div className="message-header">
                      <img
                        src={message.profilePic || "/assets/profile.png"}
                        alt="Avatar"
                        className="avatar"
                      />
                      <div>
                        <strong className="admin-message-name">{message.name}</strong>
                        <div className="message-meta">
                          <span className="email">{message.email}</span>
                          <span className="phone">Notification</span>
                        </div>
                        <div className="message-timestamp">
                          {formatMessageTimestamp(message)}
                        </div>
                      </div>
                    </div>

                    <p className="message-preview">
                      {(() => {
                        const cleanText = (message.content || "").replace(/<[^>]+>/g, "");
                        return cleanText.length > 90
                          ? `${cleanText.substring(0, 90)}...`
                          : cleanText;
                      })()}
                    </p>
                  </div>
                ))
              ) : (
                <p className="admin-empty-message">No notifications yet.</p>
              )}

              {visibleCount < notificationMessages.length &&
                (() => {
                  const remaining = notificationMessages.length - visibleCount;
                  const toLoad = Math.min(50, remaining);
                  return (
                    <button
                      className="load-more-btn"
                      onClick={() => setVisibleCount((prev) => prev + toLoad)}
                    >
                      Load {toLoad} more message{toLoad === 1 ? "" : "s"}
                    </button>
                  );
                })()}
            </div>
          )}

          {activeTab === "conversations" && (
            <div className="conversation-layout">
              <div className="conversation-thread-list">
                {conversationThreads.length === 0 ? (
                  <p className="admin-empty-message conversation-empty">
                    No conversations yet.
                  </p>
                ) : (
                  conversationThreads.map((thread) => {
                    const lastText = (thread.latest?.content || "").replace(/<[^>]+>/g, "");
                    return (
                      <div
                        key={thread.id}
                        onClick={() => openConversation(thread.id)}
                        className={`conversation-thread-item ${
                          selectedConversationId === thread.id ? "active" : ""
                        }`}
                      >
                        <div className="conversation-thread-row">
                          <img
                            src={thread.participant.profilePic || "/assets/profile.png"}
                            alt="Avatar"
                            className="avatar"
                          />
                          <div className="thread-texts">
                            <div className="thread-top-row">
                              <div className="thread-name">{thread.participant.name}</div>
                              <div className="thread-time">
                                {formatElapsed(thread.latest)}
                              </div>
                            </div>
                            <div className="thread-preview">{lastText || "No message"}</div>
                          </div>
                          {thread.unreadCount > 0 && (
                            <span className="thread-unread-badge">{thread.unreadCount}</span>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              <div className="conversation-chat-panel">
                {!selectedThread ? (
                  <div className="conversation-chat-empty">
                    Select a conversation to start chatting.
                  </div>
                ) : (
                  <>
                    <div className="conversation-chat-header">
                      <img
                        src={selectedThread.participant.profilePic || "/assets/profile.png"}
                        alt="Avatar"
                        className="avatar"
                      />
                      <div>
                        <div className="conversation-chat-title">
                          {selectedThread.participant.name}
                        </div>
                        <div className="conversation-chat-email">
                          {selectedThread.participant.email}
                        </div>
                      </div>
                    </div>

                    <div className="conversation-chat-body">
                      {selectedThread.messages.map((msg) => {
                        const isMine = msg.senderUid === user?.uid;
                        const plain = (msg.content || "").replace(/<[^>]+>/g, "");

                        return (
                          <div
                            key={`${msg._source}-${msg.id}`}
                            className={`conversation-chat-row ${isMine ? "mine" : "other"}`}
                          >
                            <div className={`conversation-bubble ${isMine ? "mine" : "other"}`}>
                              <div className="conversation-bubble-text">{plain}</div>
                              <div className="conversation-bubble-time">
                                {formatMessageTimestamp(msg)}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <div className="conversation-chat-composer">
                      <textarea
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        placeholder="Type your message..."
                        className="conversation-chat-input"
                      />
                      <button className="reply-btn" onClick={sendConversationMessage}>
                        Send
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        {selectedNotification && (
          <div className="admin-message-overlay fade-in">
            <div className="admin-message-content">
              <button className="admin-close-btn" onClick={closeNotification}>
                ×
              </button>

              <div className="message-header">
                <img
                  src={selectedNotification?.profilePic || "/assets/profile.png"}
                  alt="Avatar"
                  className="avatar"
                />
                <div className="admin-message-info">
                  <h3 className="admin-message-name">{selectedNotification?.name}</h3>
                  <p className="message-meta">
                    <span className="email">{selectedNotification?.email}</span>
                    <span className="phone">Notification</span>
                  </p>
                  <p className="message-timestamp">
                    {formatMessageTimestamp(selectedNotification)}
                  </p>
                </div>
              </div>

              <p
                className="full-message"
                dangerouslySetInnerHTML={{ __html: selectedNotification?.content }}
              ></p>

              <div className="message-actions">
                <div className="message-actions-left">
                  <img
                    src="/assets/delete.png"
                    alt="Delete"
                    className="action-icon delete-icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      setMessageToDelete({ ...selectedNotification, _source: "inbox" });
                      setShowDeleteOverlay(true);
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.src = "/assets/delete-hover.png")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.src = "/assets/delete.png")
                    }
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {showMessagesDeletedOverlay && (
          <div
            className={`date-warning-overlay ${
              hideMessagesDeletedAnimation ? "hide" : ""
            }`}
          >
            <button
              className="close-warning"
              onClick={() => {
                setHideMessagesDeletedAnimation(true);
                setTimeout(() => setShowMessagesDeletedOverlay(false), 400);
              }}
            >
              ×
            </button>
            <span className="warning-text">
              {deletedMessageCount === 1
                ? "1 Message Deleted!"
                : `${deletedMessageCount} Messages Deleted!`}
            </span>
            <div className="progress-bar"></div>
          </div>
        )}

        {showMessageSuccess && (
          <div className="success-overlay" onClick={closeMessageSuccess}>
            <div className="success-container" onClick={(e) => e.stopPropagation()}>
              <div className="success-icon">
                <MdCheckCircle size={32} />
              </div>
              <h3>Success!</h3>
              <p>{messageSuccessMessage}</p>
              <button className="success-btn" onClick={closeMessageSuccess}>
                OK
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default React.memo(Messages);


///////////////////////////////////////////////////////////////////////////////////////////////////////////////////



// "use client";
// //Messages.js
// import React, { useState, useEffect, useRef, useMemo } from "react";
// import { useUser } from "../lib/UserContext";
// import "./Messages.css";
// import { MdCheckCircle } from "react-icons/md";

// const Messages = () => {
//   const {
//     user,
//     userMessages,
//     sentMessages,
//     deleteMessage,
//     markMessageAsRead,
//     sendMessage,
//   } = useUser();

//   const [showMessageSuccess, setShowMessageSuccess] = useState(false);
//   const [messageSuccessMessage, setMessageSuccessMessage] = useState("");

//   const [selectedMessage, setSelectedMessage] = useState(null);
//   const [closing, setClosing] = useState(false);

//   const selectedMessageRef = useRef();
//   const [replyMode, setReplyMode] = useState(false);
//   const [replyText, setReplyText] = useState("");
//   const [activeTab, setActiveTab] = useState("inbox");

//   const [showDeleteOverlay, setShowDeleteOverlay] = useState(false);
//   const [messageToDelete, setMessageToDelete] = useState(null);

//   const [selectedMessageIds, setSelectedMessageIds] = useState([]);
//   const [selectedOption, setSelectedOption] = useState("none");

//   const [showMessagesDeletedOverlay, setShowMessagesDeletedOverlay] =
//     useState(false);
//   const [hideMessagesDeletedAnimation, setHideMessagesDeletedAnimation] =
//     useState(false);
//   const [deletedMessageCount, setDeletedMessageCount] = useState(0);

//   const [visibleCount, setVisibleCount] = useState(50);

//   const processedMessages = useMemo(() => {
//     return [...userMessages]
//       .sort(
//         (a, b) =>
//           (b.startTimestamp?.toDate?.().getTime() || 0) -
//           (a.startTimestamp?.toDate?.().getTime() || 0),
//       )
//       .slice(0, visibleCount);
//   }, [userMessages, visibleCount]);

//   const handleMessagesDeleted = (count) => {
//     setDeletedMessageCount(count);
//     setHideMessagesDeletedAnimation(false);
//     setShowMessagesDeletedOverlay(true);

//     setTimeout(() => {
//       setHideMessagesDeletedAnimation(true);
//       setTimeout(() => setShowMessagesDeletedOverlay(false), 400);
//     }, 5000);
//   };

//   const openMessage = (message) => {
//     setSelectedMessage(message);
//     setClosing(false);
//     setReplyMode(false);
//   };

// const closeMessage = () => {
//   setReplyMode(false);
//   setReplyText("");
//   setClosing(false);
//   setSelectedMessage(null);
// };

//   const toggleReply = () => {
//     setReplyMode(!replyMode);
//   };

//   const sendReply = () => {
//     if (replyText.trim() === "") return;

//     if (!user || !user.uid || !selectedMessage?.senderUid) {
//       console.error("❌ Missing user or recipientUid in sendReply");
//       return;
//     }

//     const contactInfo = {
//       name: user.name,
//       email: user.email,
//       phone: user.phone,
//       message: replyText,
//       recipientUid: selectedMessage.senderUid,
//       senderUid: user.uid,
//       isAdminSender: false,
//       recipientName: selectedMessage.name,
//       recipientEmail: selectedMessage.email,
//       recipientPhone: selectedMessage.contact,
//     };

//     sendMessage(contactInfo);

//     setMessageSuccessMessage("Your reply has been sent!");
//     setShowMessageSuccess(true);

//     setReplyText("");
//   };

//   const closeMessageSuccess = () => {
//     setShowMessageSuccess(false);
//     setMessageSuccessMessage("");
//   };

//   return (
//     <div className="parent-messages-container">
//       <div className="messages-container">
//         {showDeleteOverlay && !Array.isArray(messageToDelete) && (
//           <div className="overlay-revert">
//             <div className="confirm-modal">
//               <h3>Delete Message</h3>
//               <p>This message will be permanently deleted. Are you sure?</p>
//               <div className="confirm-buttons">
//                 <button
//                   className="confirm-btn revert"
//                   onClick={() => {
//                     deleteMessage(messageToDelete.id, activeTab);
//                     handleMessagesDeleted(1);
//                     setShowDeleteOverlay(false);
//                     setMessageToDelete(null);
//                     setSelectedMessage(null);
//                   }}
//                 >
//                   Yes, Delete
//                 </button>

//                 <button
//                   onClick={() => {
//                     setShowDeleteOverlay(false);
//                     setMessageToDelete(null);
//                   }}
//                   className="confirm-btn cancel"
//                 >
//                   Cancel
//                 </button>
//               </div>
//             </div>
//           </div>
//         )}

//         {showDeleteOverlay &&
//           Array.isArray(messageToDelete) &&
//           messageToDelete.length >= 1 && (
//             <div className="overlay-revert">
//               <div className="confirm-modal">
//                 <h3>
//                   Delete {messageToDelete.length === 1 ? "Message" : "Messages"}
//                 </h3>
//                 <p>
//                   {messageToDelete.length === 1
//                     ? "This message will be permanently deleted. Are you sure?"
//                     : `These ${messageToDelete.length} messages will be permanently deleted. Are you sure?`}
//                 </p>
//                 <div className="confirm-buttons">
//                   <button
//                     className="confirm-btn revert"
//                     onClick={() => {
//                       deleteMessage(messageToDelete, activeTab);
//                       handleMessagesDeleted(messageToDelete.length);
//                       setShowDeleteOverlay(false);
//                       setMessageToDelete(null);
//                       setSelectedMessage(null);
//                       setSelectedMessageIds([]);
//                     }}
//                   >
//                     Delete
//                   </button>
//                   <button
//                     className="confirm-btn cancel"
//                     onClick={() => {
//                       setShowDeleteOverlay(false);
//                       setMessageToDelete(null);
//                     }}
//                   >
//                     Cancel
//                   </button>
//                 </div>
//               </div>
//             </div>
//           )}

//         <h2>
//           Messages & Notifications (
//           {activeTab === "inbox" ? userMessages.length : sentMessages.length})
//         </h2>

//         {/* Tabs */}
//         <div className="tabs-container">
//           <div className="tabs-left">
//             <button
//               className={`tab ${activeTab === "inbox" ? "active" : ""}`}
//               onClick={() => {
//                 setActiveTab("inbox");
//                 setSelectedMessageIds([]);
//               }}
//             >
//               Inbox
//             </button>
//             <button
//               className={`tab ${activeTab === "sentbox" ? "active" : ""}`}
//               onClick={() => {
//                 setActiveTab("sentbox");
//                 setSelectedMessageIds([]);
//               }}
//             >
//               Sentbox
//             </button>
//           </div>

//           <div className="tabs-right">
//             {selectedMessageIds.length > 0 && (
//               <span className="selected-count">
//                 ({selectedMessageIds.length})
//               </span>
//             )}

//             <div className="checkbox-dropdown-wrapper">
//               <div className="message-action-icons">
//                 {activeTab === "inbox" && selectedMessageIds.length > 0 && (
//                   <>
//                     {userMessages
//                       .filter((message) =>
//                         selectedMessageIds.includes(message.id),
//                       )
//                       .some((message) => !message.readStatus) && (
//                       <img
//                         src="/assets/open-envelope.png"
//                         alt="Mark as Read"
//                         className="message-action-icon"
//                         title="Mark as Read"
//                         onClick={(e) => {
//                           e.stopPropagation();
//                           selectedMessageIds.forEach((id) => {
//                             const msg = userMessages.find(
//                               (msg) => msg.id === id,
//                             );
//                             if (msg && !msg.readStatus) {
//                               markMessageAsRead(id);
//                             }
//                           });
//                         }}
//                       />
//                     )}

//                     {userMessages
//                       .filter((msg) => selectedMessageIds.includes(msg.id))
//                       .some((msg) => msg.readStatus) && (
//                       <img
//                         src="/assets/close-envelope.png"
//                         alt="Mark as Unread"
//                         className="message-action-icon"
//                         title="Mark as Unread"
//                         onClick={(e) => {
//                           e.stopPropagation();
//                           selectedMessageIds.forEach((id) => {
//                             const msg = userMessages.find(
//                               (msg) => msg.id === id,
//                             );
//                             if (msg && msg.readStatus) {
//                               markMessageAsRead(id);
//                             }
//                           });
//                         }}
//                       />
//                     )}

//                     <img
//                       src="/assets/delete.png"
//                       alt="Delete"
//                       className="message-action-icon"
//                       title="Delete Selected"
//                       onClick={(e) => {
//                         e.stopPropagation();
//                         const messagesToDelete =
//                           activeTab === "inbox"
//                             ? userMessages.filter((msg) =>
//                                 selectedMessageIds.includes(msg.id),
//                               )
//                             : sentMessages.filter((msg) =>
//                                 selectedMessageIds.includes(msg.id),
//                               );

//                         if (messagesToDelete.length > 0) {
//                           setMessageToDelete(messagesToDelete);
//                           setShowDeleteOverlay(true);
//                         }
//                       }}
//                     />
//                   </>
//                 )}
//                 {activeTab === "sentbox" && selectedMessageIds.length > 0 && (
//                   <img
//                     src="/assets/delete.png"
//                     alt="Delete"
//                     className="message-action-icon"
//                     title="Delete Selected"
//                     onClick={(e) => {
//                       e.stopPropagation();
//                       const messagesToDelete = sentMessages.filter((msg) =>
//                         selectedMessageIds.includes(msg.id),
//                       );

//                       if (messagesToDelete.length > 0) {
//                         setMessageToDelete(messagesToDelete);
//                         setShowDeleteOverlay(true);
//                       }
//                     }}
//                   />
//                 )}
//               </div>

//               <input
//                 type="checkbox"
//                 ref={(el) => {
//                   if (el) {
//                     el.indeterminate =
//                       selectedMessageIds.length > 0 &&
//                       selectedMessageIds.length <
//                         (activeTab === "inbox"
//                           ? processedMessages.length
//                           : sentMessages.length);
//                   }
//                 }}
//                 className="message-tabs-checkbox"
//                 checked={
//                   (activeTab === "inbox" &&
//                     processedMessages.length > 0 &&
//                     selectedMessageIds.length === processedMessages.length) ||
//                   (activeTab === "sentbox" &&
//                     sentMessages.length > 0 &&
//                     selectedMessageIds.length === sentMessages.length)
//                 }
//                 onChange={(e) => {
//                   const currentMessages =
//                     activeTab === "inbox" ? processedMessages : sentMessages;

//                   if (e.target.checked) {
//                     setSelectedMessageIds(currentMessages.map((msg) => msg.id));
//                   } else {
//                     setSelectedMessageIds([]);
//                   }
//                 }}
//                 title="Select All"
//               />

//               <select
//                 className="message-tabs-select hide-text"
//                 onChange={(e) => {
//                   const option = e.target.value;
//                   setSelectedOption(option);

//                   let selected = [];
//                   const currentMessages =
//                     activeTab === "inbox" ? userMessages : sentMessages;

//                   if (option === "all") {
//                     selected = currentMessages.map((msg) => msg.id);
//                   } else if (option === "unread") {
//                     selected = currentMessages
//                       .filter((msg) => !msg.readStatus)
//                       .map((msg) => msg.id);
//                   } else if (option === "read") {
//                     selected = currentMessages
//                       .filter((msg) => msg.readStatus)
//                       .map((msg) => msg.id);
//                   } else if (option === "none") {
//                     selected = [];
//                   }

//                   setSelectedMessageIds(selected);
//                   e.target.selectedIndex = 0;
//                 }}
//                 title="More select options"
//               >
//                 <option value="none">
//                   &nbsp;&nbsp;&nbsp;None&nbsp;&nbsp;&nbsp;
//                 </option>
//                 <option value="all">
//                   &nbsp;&nbsp;&nbsp;All&nbsp;&nbsp;&nbsp;
//                 </option>
//                 {activeTab === "inbox" && (
//                   <>
//                     <option value="unread">
//                       &nbsp;&nbsp;&nbsp;Unread&nbsp;&nbsp;&nbsp;
//                     </option>
//                     <option value="read">
//                       &nbsp;&nbsp;&nbsp;Read&nbsp;&nbsp;&nbsp;
//                     </option>
//                   </>
//                 )}
//               </select>
//             </div>
//           </div>
//         </div>

//         {/* Message List inside a scrollable container */}
//         <div className="message-list">
//           {/* Inbox Section */}
//           {activeTab === "inbox" && (
//             <div>
//               {processedMessages.length > 0 ? (
//                 processedMessages.map((message) => (
//                   <div
//                     key={message.id}
//                     className="message-item"
//                     style={{
//                       opacity: message.readStatus ? 0.5 : 1,
//                       fontWeight: message.readStatus ? "lighter" : "bolder",
//                       backgroundColor: selectedMessageIds.includes(message.id)
//                         ? "#c8e6c9"
//                         : "transparent",
//                     }}
//                     onClick={() => {
//                       if (!message.readStatus) {
//                         markMessageAsRead(message.id);
//                       }
//                       openMessage(message);
//                     }}
//                   >
//                     <div className="message-actions-topright">
//                       <img
//                         src={
//                           message.readStatus
//                             ? "/assets/open-envelope.png"
//                             : "/assets/close-envelope.png"
//                         }
//                         alt={
//                           message.readStatus ? "Mark as Unread" : "Mark as Read"
//                         }
//                         className="action-icon envelope-icon"
//                         onClick={(e) => {
//                           e.stopPropagation();
//                           markMessageAsRead(message.id);
//                         }}
//                       />
//                       <img
//                         src="/assets/delete.png"
//                         alt="Delete"
//                         className="action-icon delete-icon"
//                         onClick={(e) => {
//                           e.stopPropagation();
//                           setMessageToDelete(message);
//                           setShowDeleteOverlay(true);
//                         }}
//                         onMouseEnter={(e) =>
//                           (e.currentTarget.src = "/assets/delete-hover.png")
//                         }
//                         onMouseLeave={(e) =>
//                           (e.currentTarget.src = "/assets/delete.png")
//                         }
//                       />
//                       <input
//                         type="checkbox"
//                         className="message-checkbox"
//                         checked={selectedMessageIds.includes(message.id)}
//                         onChange={(e) => {
//                           const checked = e.target.checked;
//                           setSelectedMessageIds((prev) =>
//                             checked
//                               ? [...prev, message.id]
//                               : prev.filter((id) => id !== message.id),
//                           );
//                         }}
//                         onClick={(e) => e.stopPropagation()} // Prevent selecting message on checkbox click
//                       />
//                     </div>

//                     <div className="message-header">
//                       <img
//                         src={message.profilePic || "/assets/profile.png"}
//                         alt="Avatar"
//                         className="avatar"
//                       />
//                       <div>
//                         <strong className="admin-message-name">
//                           {message.name}
//                         </strong>
//                         <div className="message-meta">
//                           <span className="email">{message.email}</span>
//                           <span className="phone">
//                             {message.recipientContact ? (
//                               <a
//                                 href={`tel:${message.recipientContact ? message.recipientContact.replace(/\s/g, "") : ""}`}
//                               >
//                                 {message.recipientContact || "No contact"}
//                               </a>
//                             ) : (
//                               "Notification"
//                             )}
//                           </span>
//                         </div>
//                         <div className="message-timestamp">
//                           {message?.formattedDateTime || "No timestamp"}
//                         </div>
//                       </div>
//                     </div>

//                     <p className="message-preview">
//                       {(() => {
//                         const cleanText = message.content.replace(
//                           /<[^>]+>/g,
//                           "",
//                         );
//                         return cleanText.length > 90
//                           ? cleanText.substring(0, 90) + "..."
//                           : cleanText;
//                       })()}
//                     </p>
//                   </div>
//                 ))
//               ) : (
//                 <p className="admin-empty-message">No received messages yet.</p>
//               )}

//               {visibleCount < userMessages.length &&
//                 (() => {
//                   const remaining = userMessages.length - visibleCount;
//                   const toLoad = Math.min(50, remaining);
//                   return (
//                     <button
//                       className="load-more-btn"
//                       onClick={() => setVisibleCount((prev) => prev + toLoad)}
//                     >
//                       Load {toLoad} more message{toLoad === 1 ? "" : "s"}
//                     </button>
//                   );
//                 })()}
//             </div>
//           )}

//           {/* Sent Section */}
//           {activeTab === "sentbox" && (
//             <div>
//               {sentMessages.length > 0 ? (
//                 [...sentMessages]
//                   .sort(
//                     (a, b) =>
//                       (b.startTimestamp?.toDate?.().getTime() || 0) -
//                       (a.startTimestamp?.toDate?.().getTime() || 0),
//                   )
//                   .map((message) => (
//                     <div
//                       key={message.id}
//                       className="message-item"
//                       style={{
//                         backgroundColor: selectedMessageIds.includes(message.id)
//                           ? "#c8e6c9"
//                           : "transparent",
//                       }}
//                       onClick={() => openMessage(message)}
//                     >
//                       <div className="message-actions-topright">
//                         <img
//                           src="/assets/delete.png"
//                           alt="Delete"
//                           className="action-icon delete-icon"
//                           onClick={(e) => {
//                             e.stopPropagation();
//                             setMessageToDelete(message);
//                             setShowDeleteOverlay(true);
//                           }}
//                           onMouseEnter={(e) =>
//                             (e.currentTarget.src = "/assets/delete-hover.png")
//                           }
//                           onMouseLeave={(e) =>
//                             (e.currentTarget.src = "/assets/delete.png")
//                           }
//                         />
//                         <input
//                           type="checkbox"
//                           className="message-checkbox"
//                           checked={selectedMessageIds.includes(message.id)}
//                           onChange={(e) => {
//                             const checked = e.target.checked;
//                             setSelectedMessageIds((prev) =>
//                               checked
//                                 ? [...prev, message.id]
//                                 : prev.filter((id) => id !== message.id),
//                             );
//                           }}
//                           onClick={(e) => e.stopPropagation()}
//                         />
//                       </div>

//                       <div className="message-header">
//                         <img
//                           src={message.profilePic}
//                           alt="Avatar"
//                           className="avatar"
//                         />
//                         <div>
//                           <strong className="admin-message-name">
//                             From: You
//                           </strong>
//                           <div className="message-meta">
//                             <span className="email">
//                               To: {message.recipientEmail}
//                             </span>
//                             <span className="phone">
//                               {message.recipientContact ? (
//                                 <a
//                                   href={`tel:${message.recipientContact ? message.recipientContact.replace(/\s/g, "") : ""}`}
//                                 >
//                                   {message.recipientContact || "No contact"}
//                                 </a>
//                               ) : (
//                                 "Notification"
//                               )}
//                             </span>
//                           </div>
//                           <div className="message-timestamp">
//                             {message?.formattedDateTime || "No timestamp"}
//                           </div>
//                         </div>
//                       </div>

//                       <p className="message-preview">
//                         {(() => {
//                           const cleanText = (message.content || "").replace(
//                             /<[^>]+>/g,
//                             "",
//                           );
//                           return cleanText.length > 90
//                             ? cleanText.substring(0, 90) + "..."
//                             : cleanText;
//                         })()}
//                       </p>
//                     </div>
//                   ))
//               ) : (
//                 <p className="admin-empty-message">No sent messages yet.</p>
//               )}
//             </div>
//           )}
//         </div>

//         {/* Message Overlay */}
//         {selectedMessage && (
//           <div
// className="admin-message-overlay fade-in"
//           >
//             <div className="admin-message-content">
//               <button className="admin-close-btn" onClick={closeMessage}>
//                 ✖
//               </button>

//               <div className="message-header">
//                 <img
//                   src={selectedMessage?.profilePic}
//                   alt="Avatar"
//                   className="avatar"
//                 />
//                 <div className="admin-message-info">
//                   <h3 className="admin-message-name">
//                     {activeTab === "inbox"
//                       ? selectedMessage?.name
//                       : `From: You`}
//                   </h3>
//                   <p className="message-meta">
//                     <span className="email">
//                       {activeTab === "inbox"
//                         ? selectedMessage?.email
//                         : `To: ${selectedMessage?.recipientEmail}`}
//                     </span>
//                     <span className="phone">
//                       {activeTab === "inbox" ? (
//                         selectedMessage?.contact ? (
//                           <a
//                             href={`tel:${selectedMessage.contact ? selectedMessage.contact.replace(/\s/g, "") : ""}`}
//                           >
//                             {selectedMessage.contact || "No contact"}
//                           </a>
//                         ) : (
//                           "Notification"
//                         )
//                       ) : selectedMessage?.recipientContact ? (
//                         <a
//                           href={`tel:${selectedMessage.recipientContact ? selectedMessage.recipientContact.replace(/\s/g, "") : ""}`}
//                         >
//                           {selectedMessage.recipientContact || "No contact"}
//                         </a>
//                       ) : (
//                         "Notification"
//                       )}
//                     </span>
//                   </p>
//                   <p className="message-timestamp">
//                     {selectedMessage?.formattedDateTime || "No timestamp"}
//                   </p>
//                 </div>
//               </div>

//               <p
//                 className="full-message"
//                 dangerouslySetInnerHTML={{ __html: selectedMessage?.content }}
//               ></p>

//               {replyMode && (
//                 <textarea
//                   className="admin-reply-textarea"
//                   placeholder="Type your reply..."
//                   value={replyText}
//                   onChange={(e) => setReplyText(e.target.value)}
//                 />
//               )}

//               <div className="message-actions">
//                 <div className="message-actions-left">
//                   <img
//                     src="/assets/delete.png"
//                     alt="Delete"
//                     className="action-icon delete-icon"
//                     onClick={(e) => {
//                       e.stopPropagation();
//                       setMessageToDelete(selectedMessage);
//                       setShowDeleteOverlay(true);
//                     }}
//                     onMouseEnter={(e) =>
//                       (e.currentTarget.src = "/assets/delete-hover.png")
//                     }
//                     onMouseLeave={(e) =>
//                       (e.currentTarget.src = "/assets/delete.png")
//                     }
//                   />
//                 </div>

//                 <div className="message-actions-right">
//                   {activeTab === "inbox" &&
//                     !selectedMessage?.isNotification && (
//                       <button
//                         className="reply-btn"
//                         onClick={replyMode ? sendReply : toggleReply}
//                       >
//                         {replyMode ? "Send" : "Reply"}
//                       </button>
//                     )}
//                 </div>
//               </div>
//             </div>
//           </div>
//         )}

//         {showMessagesDeletedOverlay && (
//           <div
//             className={`date-warning-overlay ${hideMessagesDeletedAnimation ? "hide" : ""}`}
//           >
//             <button
//               className="close-warning"
//               onClick={() => {
//                 setHideMessagesDeletedAnimation(true);
//                 setTimeout(() => setShowMessagesDeletedOverlay(false), 400);
//               }}
//             >
//               ✖
//             </button>
//             <span className="warning-text">
//               {deletedMessageCount === 1
//                 ? "1 Message Deleted!"
//                 : `${deletedMessageCount} Messages Deleted!`}
//             </span>
//             <div className="progress-bar"></div>
//           </div>
//         )}

//         {/* ================= Message Success Overlay ================= */}
//         {showMessageSuccess && (
//           <div className="success-overlay" onClick={closeMessageSuccess}>
//             <div
//               className="success-container"
//               onClick={(e) => e.stopPropagation()}
//             >
//               <div className="success-icon">
//                 <MdCheckCircle size={32} />
//               </div>
//               <h3>Success!</h3>
//               <p>{messageSuccessMessage}</p>
//               <button className="success-btn" onClick={closeMessageSuccess}>
//                 OK
//               </button>
//             </div>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// };

// // export default Messages;

// export default React.memo(Messages);
