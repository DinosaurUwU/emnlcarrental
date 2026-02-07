"use client";
//Messages.js
import React, { useState, useEffect, useRef, useMemo } from "react";
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

  const [selectedMessage, setSelectedMessage] = useState(null);
  const [closing, setClosing] = useState(false);

  const selectedMessageRef = useRef();
  const [replyMode, setReplyMode] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [activeTab, setActiveTab] = useState("inbox");

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

  const processedMessages = useMemo(() => {
    return [...userMessages]
      .sort(
        (a, b) =>
          (b.startTimestamp?.toDate?.().getTime() || 0) -
          (a.startTimestamp?.toDate?.().getTime() || 0),
      )
      .slice(0, visibleCount);
  }, [userMessages, visibleCount]);

  const handleMessagesDeleted = (count) => {
    setDeletedMessageCount(count);
    setHideMessagesDeletedAnimation(false);
    setShowMessagesDeletedOverlay(true);

    setTimeout(() => {
      setHideMessagesDeletedAnimation(true);
      setTimeout(() => setShowMessagesDeletedOverlay(false), 400);
    }, 5000);
  };

  const openMessage = (message) => {
    setSelectedMessage(message);
    setClosing(false);
    setReplyMode(false);
  };

  const closeMessage = () => {
    setClosing(true);

    setTimeout(() => {
      setSelectedMessage(null);
      setClosing(false);
      setReplyMode(false);
      setReplyText("");
    }, 300);
  };

  const toggleReply = () => {
    setReplyMode(!replyMode);
  };

  const sendReply = () => {
    if (replyText.trim() === "") return;

    if (!user || !user.uid || !selectedMessage?.senderUid) {
      console.error("❌ Missing user or recipientUid in sendReply");
      return;
    }

    const contactInfo = {
      name: user.name,
      email: user.email,
      phone: user.phone,
      message: replyText,
      recipientUid: selectedMessage.senderUid,
      senderUid: user.uid,
      isAdminSender: false,
      recipientName: selectedMessage.name,
      recipientEmail: selectedMessage.email,
      recipientPhone: selectedMessage.contact,
    };

    sendMessage(contactInfo);

    setMessageSuccessMessage("Your reply has been sent!");
    setShowMessageSuccess(true);

    setReplyText("");
  };

  const closeMessageSuccess = () => {
    setShowMessageSuccess(false);
    setMessageSuccessMessage("");
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
                    deleteMessage(messageToDelete.id, activeTab);
                    handleMessagesDeleted(1);
                    setShowDeleteOverlay(false);
                    setMessageToDelete(null);
                    setSelectedMessage(null);
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
                      deleteMessage(messageToDelete, activeTab);
                      handleMessagesDeleted(messageToDelete.length);
                      setShowDeleteOverlay(false);
                      setMessageToDelete(null);
                      setSelectedMessage(null);
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

        <h2>
          Messages & Notifications (
          {activeTab === "inbox" ? userMessages.length : sentMessages.length})
        </h2>

        {/* Tabs */}
        <div className="tabs-container">
          <div className="tabs-left">
            <button
              className={`tab ${activeTab === "inbox" ? "active" : ""}`}
              onClick={() => {
                setActiveTab("inbox");
                setSelectedMessageIds([]);
              }}
            >
              Inbox
            </button>
            <button
              className={`tab ${activeTab === "sentbox" ? "active" : ""}`}
              onClick={() => {
                setActiveTab("sentbox");
                setSelectedMessageIds([]);
              }}
            >
              Sentbox
            </button>
          </div>

          <div className="tabs-right">
            {selectedMessageIds.length > 0 && (
              <span className="selected-count">
                ({selectedMessageIds.length})
              </span>
            )}

            <div className="checkbox-dropdown-wrapper">
              <div className="message-action-icons">
                {activeTab === "inbox" && selectedMessageIds.length > 0 && (
                  <>
                    {userMessages
                      .filter((message) =>
                        selectedMessageIds.includes(message.id),
                      )
                      .some((message) => !message.readStatus) && (
                      <img
                        src="/assets/open-envelope.png"
                        alt="Mark as Read"
                        className="message-action-icon"
                        title="Mark as Read"
                        onClick={(e) => {
                          e.stopPropagation();
                          selectedMessageIds.forEach((id) => {
                            const msg = userMessages.find(
                              (msg) => msg.id === id,
                            );
                            if (msg && !msg.readStatus) {
                              markMessageAsRead(id);
                            }
                          });
                        }}
                      />
                    )}

                    {userMessages
                      .filter((msg) => selectedMessageIds.includes(msg.id))
                      .some((msg) => msg.readStatus) && (
                      <img
                        src="/assets/close-envelope.png"
                        alt="Mark as Unread"
                        className="message-action-icon"
                        title="Mark as Unread"
                        onClick={(e) => {
                          e.stopPropagation();
                          selectedMessageIds.forEach((id) => {
                            const msg = userMessages.find(
                              (msg) => msg.id === id,
                            );
                            if (msg && msg.readStatus) {
                              markMessageAsRead(id);
                            }
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
                        const messagesToDelete =
                          activeTab === "inbox"
                            ? userMessages.filter((msg) =>
                                selectedMessageIds.includes(msg.id),
                              )
                            : sentMessages.filter((msg) =>
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
                {activeTab === "sentbox" && selectedMessageIds.length > 0 && (
                  <img
                    src="/assets/delete.png"
                    alt="Delete"
                    className="message-action-icon"
                    title="Delete Selected"
                    onClick={(e) => {
                      e.stopPropagation();
                      const messagesToDelete = sentMessages.filter((msg) =>
                        selectedMessageIds.includes(msg.id),
                      );

                      if (messagesToDelete.length > 0) {
                        setMessageToDelete(messagesToDelete);
                        setShowDeleteOverlay(true);
                      }
                    }}
                  />
                )}
              </div>

              <input
                type="checkbox"
                ref={(el) => {
                  if (el) {
                    el.indeterminate =
                      selectedMessageIds.length > 0 &&
                      selectedMessageIds.length <
                        (activeTab === "inbox"
                          ? processedMessages.length
                          : sentMessages.length);
                  }
                }}
                className="message-tabs-checkbox"
                checked={
                  (activeTab === "inbox" &&
                    processedMessages.length > 0 &&
                    selectedMessageIds.length === processedMessages.length) ||
                  (activeTab === "sentbox" &&
                    sentMessages.length > 0 &&
                    selectedMessageIds.length === sentMessages.length)
                }
                onChange={(e) => {
                  const currentMessages =
                    activeTab === "inbox" ? processedMessages : sentMessages;

                  if (e.target.checked) {
                    setSelectedMessageIds(currentMessages.map((msg) => msg.id));
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
                  const currentMessages =
                    activeTab === "inbox" ? userMessages : sentMessages;

                  if (option === "all") {
                    selected = currentMessages.map((msg) => msg.id);
                  } else if (option === "unread") {
                    selected = currentMessages
                      .filter((msg) => !msg.readStatus)
                      .map((msg) => msg.id);
                  } else if (option === "read") {
                    selected = currentMessages
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
                <option value="none">
                  &nbsp;&nbsp;&nbsp;None&nbsp;&nbsp;&nbsp;
                </option>
                <option value="all">
                  &nbsp;&nbsp;&nbsp;All&nbsp;&nbsp;&nbsp;
                </option>
                {activeTab === "inbox" && (
                  <>
                    <option value="unread">
                      &nbsp;&nbsp;&nbsp;Unread&nbsp;&nbsp;&nbsp;
                    </option>
                    <option value="read">
                      &nbsp;&nbsp;&nbsp;Read&nbsp;&nbsp;&nbsp;
                    </option>
                  </>
                )}
              </select>
            </div>
          </div>
        </div>

        {/* Message List inside a scrollable container */}
        <div className="message-list">
          {/* Inbox Section */}
          {activeTab === "inbox" && (
            <div>
              {processedMessages.length > 0 ? (
                processedMessages.map((message) => (
                  <div
                    key={message.id}
                    className="message-item"
                    style={{
                      opacity: message.readStatus ? 0.5 : 1,
                      fontWeight: message.readStatus ? "lighter" : "bolder",
                      backgroundColor: selectedMessageIds.includes(message.id)
                        ? "#c8e6c9"
                        : "transparent",
                    }}
                    onClick={() => {
                      if (!message.readStatus) {
                        markMessageAsRead(message.id);
                      }
                      openMessage(message);
                    }}
                  >
                    <div className="message-actions-topright">
                      <img
                        src={
                          message.readStatus
                            ? "/assets/open-envelope.png"
                            : "/assets/close-envelope.png"
                        }
                        alt={
                          message.readStatus ? "Mark as Unread" : "Mark as Read"
                        }
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
                        onClick={(e) => e.stopPropagation()} // Prevent selecting message on checkbox click
                      />
                    </div>

                    <div className="message-header">
                      <img
                        src={message.profilePic || "/assets/profile.png"}
                        alt="Avatar"
                        className="avatar"
                      />
                      <div>
                        <strong className="admin-message-name">
                          {message.name}
                        </strong>
                        <div className="message-meta">
                          <span className="email">{message.email}</span>
                          <span className="phone">
                            {message.recipientContact ? (
                              <a
                                href={`tel:${message.recipientContact ? message.recipientContact.replace(/\s/g, "") : ""}`}
                              >
                                {message.recipientContact || "No contact"}
                              </a>
                            ) : (
                              "Notification"
                            )}
                          </span>
                        </div>
                        <div className="message-timestamp">
                          {message?.formattedDateTime || "No timestamp"}
                        </div>
                      </div>
                    </div>

                    <p className="message-preview">
                      {(() => {
                        const cleanText = message.content.replace(
                          /<[^>]+>/g,
                          "",
                        );
                        return cleanText.length > 90
                          ? cleanText.substring(0, 90) + "..."
                          : cleanText;
                      })()}
                    </p>
                  </div>
                ))
              ) : (
                <p className="admin-empty-message">No received messages yet.</p>
              )}

              {visibleCount < userMessages.length &&
                (() => {
                  const remaining = userMessages.length - visibleCount;
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

          {/* Sent Section */}
          {activeTab === "sentbox" && (
            <div>
              {sentMessages.length > 0 ? (
                [...sentMessages]
                  .sort(
                    (a, b) =>
                      (b.startTimestamp?.toDate?.().getTime() || 0) -
                      (a.startTimestamp?.toDate?.().getTime() || 0),
                  )
                  .map((message) => (
                    <div
                      key={message.id}
                      className="message-item"
                      style={{
                        backgroundColor: selectedMessageIds.includes(message.id)
                          ? "#c8e6c9"
                          : "transparent",
                      }}
                      onClick={() => openMessage(message)}
                    >
                      <div className="message-actions-topright">
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
                          src={message.profilePic}
                          alt="Avatar"
                          className="avatar"
                        />
                        <div>
                          <strong className="admin-message-name">
                            From: You
                          </strong>
                          <div className="message-meta">
                            <span className="email">
                              To: {message.recipientEmail}
                            </span>
                            <span className="phone">
                              {message.recipientContact ? (
                                <a
                                  href={`tel:${message.recipientContact ? message.recipientContact.replace(/\s/g, "") : ""}`}
                                >
                                  {message.recipientContact || "No contact"}
                                </a>
                              ) : (
                                "Notification"
                              )}
                            </span>
                          </div>
                          <div className="message-timestamp">
                            {message?.formattedDateTime || "No timestamp"}
                          </div>
                        </div>
                      </div>

                      <p className="message-preview">
                        {(() => {
                          const cleanText = (message.content || "").replace(
                            /<[^>]+>/g,
                            "",
                          );
                          return cleanText.length > 90
                            ? cleanText.substring(0, 90) + "..."
                            : cleanText;
                        })()}
                      </p>
                    </div>
                  ))
              ) : (
                <p className="admin-empty-message">No sent messages yet.</p>
              )}
            </div>
          )}
        </div>

        {/* Message Overlay */}
        {(selectedMessage || closing) && (
          <div
            className={`admin-message-overlay ${
              closing ? "fade-out" : "fade-in"
            }`}
          >
            <div className="admin-message-content">
              <button className="admin-close-btn" onClick={closeMessage}>
                ✖
              </button>

              <div className="message-header">
                <img
                  src={selectedMessage?.profilePic}
                  alt="Avatar"
                  className="avatar"
                />
                <div className="admin-message-info">
                  <h3 className="admin-message-name">
                    {activeTab === "inbox"
                      ? selectedMessage?.name
                      : `From: You`}
                  </h3>
                  <p className="message-meta">
                    <span className="email">
                      {activeTab === "inbox"
                        ? selectedMessage?.email
                        : `To: ${selectedMessage?.recipientEmail}`}
                    </span>
                    <span className="phone">
                      {activeTab === "inbox" ? (
                        selectedMessage?.contact ? (
                          <a
                            href={`tel:${selectedMessage.contact ? selectedMessage.contact.replace(/\s/g, "") : ""}`}
                          >
                            {selectedMessage.contact || "No contact"}
                          </a>
                        ) : (
                          "Notification"
                        )
                      ) : selectedMessage?.recipientContact ? (
                        <a
                          href={`tel:${selectedMessage.recipientContact ? selectedMessage.recipientContact.replace(/\s/g, "") : ""}`}
                        >
                          {selectedMessage.recipientContact || "No contact"}
                        </a>
                      ) : (
                        "Notification"
                      )}
                    </span>
                  </p>
                  <p className="message-timestamp">
                    {selectedMessage?.formattedDateTime || "No timestamp"}
                  </p>
                </div>
              </div>

              <p
                className="full-message"
                dangerouslySetInnerHTML={{ __html: selectedMessage?.content }}
              ></p>

              {replyMode && (
                <textarea
                  className="admin-reply-textarea"
                  placeholder="Type your reply..."
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                />
              )}

              <div className="message-actions">
                <div className="message-actions-left">
                  <img
                    src="/assets/delete.png"
                    alt="Delete"
                    className="action-icon delete-icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      setMessageToDelete(selectedMessage);
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

                <div className="message-actions-right">
                  <button className="forward-btn">Forward</button>
                  {activeTab === "inbox" &&
                    !selectedMessage?.isNotification && (
                      <button
                        className="reply-btn"
                        onClick={replyMode ? sendReply : toggleReply}
                      >
                        {replyMode ? "Send" : "Reply"}
                      </button>
                    )}
                </div>
              </div>
            </div>
          </div>
        )}

        {showMessagesDeletedOverlay && (
          <div
            className={`date-warning-overlay ${hideMessagesDeletedAnimation ? "hide" : ""}`}
          >
            <button
              className="close-warning"
              onClick={() => {
                setHideMessagesDeletedAnimation(true);
                setTimeout(() => setShowMessagesDeletedOverlay(false), 400);
              }}
            >
              ✖
            </button>
            <span className="warning-text">
              {deletedMessageCount === 1
                ? "1 Message Deleted!"
                : `${deletedMessageCount} Messages Deleted!`}
            </span>
            <div className="progress-bar"></div>
          </div>
        )}

        {/* ================= Message Success Overlay ================= */}
        {showMessageSuccess && (
          <div className="success-overlay" onClick={closeMessageSuccess}>
            <div
              className="success-container"
              onClick={(e) => e.stopPropagation()}
            >
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

// export default Messages;

export default React.memo(Messages);
