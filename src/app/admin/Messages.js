"use client";
//Messages.js
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useUser } from "../lib/UserContext";
import "./Messages.css";
import { FiX } from "react-icons/fi";

const Messages = () => {
  const {
    user,
    userMessages,
    sentMessages,
    notificationMessages,
    deleteMessage,
    markMessageAsRead,
    sendMessage,
    actionOverlay,
    showActionOverlay,
    hideCancelAnimation,
    setHideCancelAnimation,
    setActionOverlay,
    loadMoreNotifications,
    hasMoreNotifications,
    loadMoreUserMessages,
    hasMoreUserMessages,
  } = useUser();

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

  const [isLoadingMoreMessages, setIsLoadingMoreMessages] = useState(false);
  const [
    isLoadingMoreConversationMessages,
    setIsLoadingMoreConversationMessages,
  ] = useState(false);
  const [
    visibleConversationMessageCounts,
    setVisibleConversationMessageCounts,
  ] = useState({});
  const [
    isLoadingMoreConversationThreads,
    setIsLoadingMoreConversationThreads,
  ] = useState(false);
  const [selectedConversationId, setSelectedConversationId] = useState(null);
  const [chatInput, setChatInput] = useState("");
  const conversationChatBodyRef = useRef(null);
  const [showDeleteConversationOverlay, setShowDeleteConversationOverlay] =
    useState(false);
  const [threadToDelete, setThreadToDelete] = useState(null);

  const [processingConversationDelete, setProcessingConversationDelete] =
    useState({
      isProcessing: false,
      message: "",
      textClass: "",
    });

  const processedNotifications = useMemo(() => {
    return notificationMessages;
  }, [notificationMessages]);

  const canLoadMoreNotifications = useMemo(() => {
    return hasMoreNotifications && !isLoadingMoreMessages;
  }, [hasMoreNotifications, isLoadingMoreMessages]);

  useEffect(() => {
    if (!isLoadingMoreMessages) return;

    const timer = setTimeout(() => {
      setIsLoadingMoreMessages(false);
    }, 600);

    return () => clearTimeout(timer);
  }, [notificationMessages.length, isLoadingMoreMessages]);

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

    const getMs = (msg) => {
      const ts = msg?.startTimestamp;
      if (ts?.toDate) return ts.toDate().getTime();
      if (typeof ts?.seconds === "number") return ts.seconds * 1000;
      if (typeof msg?.clientCreatedAt === "number") return msg.clientCreatedAt;
      return 0;
    };

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
                ? msg?.recipientContact || msg?.recipientPhone || "No contact"
                : msg?.contact || msg?.phone || "No contact",
            profilePic: msg?.profilePic || "/assets/profile.png",
          },
          messages: [],
          unreadCount: 0,
          latest: null,
        });
      }

      const thread = map.get(otherUid);
      thread.messages.push(msg);

      const isIncomingFromClient = senderUid !== user.uid;

      const candidateName = isIncomingFromClient
        ? msg?.name || msg?.email
        : msg?.recipientName || msg?.recipientEmail;

      const candidateEmail = isIncomingFromClient
        ? msg?.email
        : msg?.recipientEmail;

      const candidateContact = isIncomingFromClient
        ? msg?.contact || msg?.phone
        : msg?.recipientContact || msg?.recipientPhone;

      const candidateProfilePic = isIncomingFromClient ? msg?.profilePic : null;

      // Upgrade fallback values when better data appears in newer/other messages
      if (
        (!thread.participant?.name || thread.participant.name === otherUid) &&
        candidateName
      ) {
        thread.participant.name = candidateName;
      }

      if (
        (!thread.participant?.email ||
          thread.participant.email === "No email") &&
        candidateEmail
      ) {
        thread.participant.email = candidateEmail;
      }

      if (
        (!thread.participant?.contact ||
          thread.participant.contact === "No contact") &&
        candidateContact
      ) {
        thread.participant.contact = candidateContact;
      }

      if (
        (!thread.participant?.profilePic ||
          thread.participant.profilePic === "/assets/profile.png") &&
        candidateProfilePic
      ) {
        thread.participant.profilePic = candidateProfilePic;
      }

      if (msg._source === "inbox" && !msg.readStatus) {
        thread.unreadCount += 1;
      }

      if (!thread.latest || getMs(msg) > getMs(thread.latest)) {
        thread.latest = msg;
      }
    }

    const threads = Array.from(map.values())
      .map((thread) => {
        const messages = [...thread.messages].sort(
          (a, b) => getMs(a) - getMs(b),
        );

        // Always derive participant from the latest messages so profile updates reflect immediately
        const latestIncoming = [...messages]
          .reverse()
          .find((m) => (m?.senderUid || "") !== user.uid);

        const latestOutgoing = [...messages]
          .reverse()
          .find((m) => (m?.senderUid || "") === user.uid);

        const participant = {
          name:
            latestIncoming?.name ||
            latestOutgoing?.recipientName ||
            thread.participant?.name ||
            thread.id,
          email:
            latestIncoming?.email ||
            latestOutgoing?.recipientEmail ||
            thread.participant?.email ||
            "No email",
          contact:
            latestIncoming?.contact ||
            latestOutgoing?.recipientContact ||
            latestOutgoing?.recipientPhone ||
            thread.participant?.contact ||
            "No contact",
          profilePic:
            latestIncoming?.profilePic ||
            thread.participant?.profilePic ||
            "/assets/profile.png",
        };

        const latest =
          messages.length > 0
            ? messages[messages.length - 1]
            : thread.latest || null;

        return {
          ...thread,
          participant,
          messages,
          latest,
        };
      })
      .sort((a, b) => getMs(b.latest) - getMs(a.latest));

    return threads;
  }, [chatMessages, user?.uid]);

useEffect(() => {
    if (!isLoadingMoreConversationThreads) return;

    const timer = setTimeout(() => {
      setIsLoadingMoreConversationThreads(false);
    }, 600);

    return () => clearTimeout(timer);
  }, [chatMessages.length, isLoadingMoreConversationThreads]);

  const selectedThread = useMemo(() => {
    return (
      conversationThreads.find(
        (thread) => thread.id === selectedConversationId,
      ) || null
    );
  }, [conversationThreads, selectedConversationId]);

  const currentVisibleConversationMessageCount =
    visibleConversationMessageCounts[selectedConversationId] || 10;

  const displayedThreadMessages = useMemo(() => {
    if (!selectedThread?.messages) return [];
    return selectedThread.messages.slice(
      -currentVisibleConversationMessageCount,
    );
  }, [selectedThread?.messages, currentVisibleConversationMessageCount]);

const canLoadMoreConversationMessages = useMemo(() => {
    return (
      (selectedThread?.messages?.length || 0) >
        currentVisibleConversationMessageCount &&
      !isLoadingMoreConversationMessages
    );
  }, [
    selectedThread?.messages?.length,
    currentVisibleConversationMessageCount,
    isLoadingMoreConversationMessages,
  ]);

  useEffect(() => {
    if (!selectedConversationId) return;

    setVisibleConversationMessageCounts((prev) =>
      prev[selectedConversationId]
        ? prev
        : { ...prev, [selectedConversationId]: 10 },
    );
    setIsLoadingMoreConversationMessages(false);
  }, [selectedConversationId]);

  useEffect(() => {
    if (!isLoadingMoreConversationMessages) return;

    const timer = setTimeout(() => {
      setVisibleConversationMessageCounts((prev) => ({
        ...prev,
        [selectedConversationId]: (prev[selectedConversationId] || 10) + 10,
      }));
      setIsLoadingMoreConversationMessages(false);
    }, 400);

    return () => clearTimeout(timer);
  }, [isLoadingMoreConversationMessages, selectedConversationId]);

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

  const deleteConversationThread = async (thread) => {
    if (!thread?.id) return;

    setProcessingConversationDelete({
      isProcessing: true,
      message: "Deleting conversation...",
      textClass: "status-submitting",
    });

    try {
      const inboxIds = (thread.messages || [])
        .filter((m) => m?._source === "inbox" && m?.id)
        .map((m) => m.id);

      const sentIds = (thread.messages || [])
        .filter((m) => m?._source === "sentbox" && m?.id)
        .map((m) => m.id);

      if (inboxIds.length > 0) {
        await deleteMessage(inboxIds, "inbox");
      }

      if (sentIds.length > 0) {
        await deleteMessage(sentIds, "sentbox");
      }

      const deletedCount = inboxIds.length + sentIds.length;
      handleMessagesDeleted(deletedCount > 0 ? deletedCount : 1);

      if (selectedConversationId === thread.id) {
        setSelectedConversationId(null);
        setChatInput("");
      }

      setThreadToDelete(null);
    } catch (error) {
      console.error("Error deleting conversation:", error);
      showActionOverlay({
        message: "Failed to delete conversation.",
        type: "warning",
      });
    } finally {
      setProcessingConversationDelete({
        isProcessing: false,
        message: "",
        textClass: "",
      });
    }
  };

  useEffect(() => {
    if (activeTab !== "conversations") return;
    if (!selectedThread) return;
    if (!conversationChatBodyRef.current) return;

    conversationChatBodyRef.current.scrollTop =
      conversationChatBodyRef.current.scrollHeight;
  }, [activeTab, selectedThread?.id, selectedThread?.messages?.length]);

  const sendConversationMessage = async () => {
    const text = chatInput.trim();
    if (!text) return;
    if (!user?.uid || !selectedThread?.id) return;

    setChatInput(""); // clear immediately

    const contactInfo = {
      name: user.name,
      email: user.email,
      phone: user.phone,
      message: text,
      recipientUid: selectedThread.id,
      senderUid: user.uid,
      isAdminSender: true,
      recipientName: selectedThread.participant?.name,
      recipientEmail: selectedThread.participant?.email,
      recipientPhone: selectedThread.participant?.contact,
    };

    const result = await sendMessage(contactInfo);

    if (!result?.success) {
      setChatInput(text); // restore on failure
      showActionOverlay({
        message: result?.error || "Failed to send message.",
        type: "warning",
      });
      return;
    }

    showActionOverlay({
      message: "Message sent!",
      type: "success",
    });

    setTimeout(() => {
      if (conversationChatBodyRef.current) {
        conversationChatBodyRef.current.scrollTop =
          conversationChatBodyRef.current.scrollHeight;
      }
    }, 0);
  };

  const handleAdminChatKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendConversationMessage();
    }
  };

  const sendFleetDetailsLink = async () => {
    if (!user?.uid || !selectedThread?.id) return;

    const fleetUrl = `${window.location.origin}/fleet-details`;
    const quickMessage = `You can browse our available cars and pricing here:<br><a href="${fleetUrl}" target="_blank" rel="noopener noreferrer">${fleetUrl}</a>`;

    const contactInfo = {
      name: user.name,
      email: user.email,
      phone: user.phone,
      message: quickMessage,
      recipientUid: selectedThread.id,
      senderUid: user.uid,
      isAdminSender: true,
      recipientName: selectedThread.participant?.name,
      recipientEmail: selectedThread.participant?.email,
      recipientPhone: selectedThread.participant?.contact,
    };

    const result = await sendMessage(contactInfo);

    if (!result?.success) {
      showActionOverlay({
        message: result?.error || "Failed to send fleet link.",
        type: "warning",
      });
      return;
    }

    showActionOverlay({
      message: "Fleet details link sent!",
      type: "success",
    });

    setTimeout(() => {
      if (conversationChatBodyRef.current) {
        conversationChatBodyRef.current.scrollTop =
          conversationChatBodyRef.current.scrollHeight;
      }
    }, 0);
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

    if (typeof message?.clientCreatedAt === "number") {
      const d = new Date(message.clientCreatedAt);
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

        <h2>
          {activeTab === "notifications"
            ? `Notifications (${notificationMessages.length}${canLoadMoreNotifications ? "+" : ""})`
            : `Messages (${currentCount})`}
        </h2>

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
              <span className="selected-count">
                ({selectedMessageIds.length})
              </span>
            )}

            {activeTab === "notifications" && (
              <div className="checkbox-dropdown-wrapper">
                <div className="message-action-icons">
                  {selectedMessageIds.length > 0 && (
                    <>
                      {notificationMessages
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
                              const msg = notificationMessages.find(
                                (m) => m.id === id,
                              );
                              if (msg && !msg.readStatus) markMessageAsRead(id);
                            });
                          }}
                        />
                      )}

                      {notificationMessages
                        .filter((message) =>
                          selectedMessageIds.includes(message.id),
                        )
                        .some((message) => message.readStatus) && (
                        <img
                          src="/assets/close-envelope.png"
                          alt="Mark as Unread"
                          className="message-action-icon"
                          title="Mark as Unread"
                          onClick={(e) => {
                            e.stopPropagation();
                            selectedMessageIds.forEach((id) => {
                              const msg = notificationMessages.find(
                                (m) => m.id === id,
                              );
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
                          const messagesToDelete = notificationMessages.filter(
                            (msg) => selectedMessageIds.includes(msg.id),
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
                        selectedMessageIds.length <
                          processedNotifications.length;
                    }
                  }}
                  className="message-tabs-checkbox"
                  checked={
                    processedNotifications.length > 0 &&
                    selectedMessageIds.length === processedNotifications.length
                  }
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedMessageIds(
                        processedNotifications.map((msg) => msg.id),
                      );
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
                  <option value="none">
                    &nbsp;&nbsp;&nbsp;None&nbsp;&nbsp;&nbsp;
                  </option>
                  <option value="all">
                    &nbsp;&nbsp;&nbsp;All&nbsp;&nbsp;&nbsp;
                  </option>
                  <option value="unread">
                    &nbsp;&nbsp;&nbsp;Unread&nbsp;&nbsp;&nbsp;
                  </option>
                  <option value="read">
                    &nbsp;&nbsp;&nbsp;Read&nbsp;&nbsp;&nbsp;
                  </option>
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
                        <strong className="admin-message-name">
                          {message.name}
                        </strong>
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
                      {(message.content || "")
                        .replace(/<br\s*\/?>/gi, " ")
                        .replace(/<\/p>/gi, " ")
                        .replace(/<[^>]+>/g, "")
                        .replace(/\s+/g, " ")
                        .trim()}
                    </p>
                  </div>
                ))
              ) : (
                <p className="admin-empty-message">No notifications yet.</p>
              )}

              {processedNotifications.length > 0 &&
                (isLoadingMoreMessages ? (
                  <div className="admin-messages-spinner-wrap">
                    <div className="admin-messages-spinner" />
                  </div>
                ) : (
                  canLoadMoreNotifications && (
                    <button
                      type="button"
                      className="load-more-btn"
                      onClick={() => {
                        setIsLoadingMoreMessages(true);
                        loadMoreNotifications();
                      }}
                    >
                      Load 10 More Messages
                    </button>
                  )
                ))}
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
                  <>
                    {conversationThreads.map((thread) => {
                      const sourceTag =
                        thread.latest?.sourcePage === "contact-guest"
                          ? "[Guest Contact] "
                          : thread.latest?.sourcePage === "contact"
                            ? "[Contact] "
                            : "";

                      const lastText =
                        sourceTag +
                        (thread.latest?.content || "").replace(/<[^>]+>/g, "");
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
                              src={
                                thread.participant.profilePic ||
                                "/assets/profile.png"
                              }
                              alt="Avatar"
                              className="avatar"
                            />
                            <div className="thread-texts">
                              <div className="thread-top-row">
                                <div className="thread-name">
                                  {thread.participant.name}
                                </div>
                                <div className="thread-time">
                                  {formatElapsed(thread.latest)}
                                </div>
                              </div>

                              <div className="thread-bottom-row">
                                <div className="thread-preview">
                                  {lastText || "No message"}
                                </div>
                                {thread.unreadCount > 0 && (
                                  <span className="thread-unread-badge">
                                    {thread.unreadCount}
                                  </span>
                                )}
                              </div>
                            </div>

                            <div className="thread-row-actions">
                              <button
                                type="button"
                                className="thread-delete-btn"
                                title="Delete conversation"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setThreadToDelete(thread);
                                  setShowDeleteConversationOverlay(true);
                                }}
                              >
                                <img
                                  src="/assets/delete.png"
                                  alt="Delete conversation"
                                  className="message-action-icon"
                                  onMouseEnter={(e) =>
                                    (e.currentTarget.src =
                                      "/assets/delete-hover.png")
                                  }
                                  onMouseLeave={(e) =>
                                    (e.currentTarget.src = "/assets/delete.png")
                                  }
                                />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}

                    {isLoadingMoreConversationThreads ? (
                      <div className="admin-thread-spinner-wrap">
                        <div className="admin-thread-spinner" />
                      </div>
                    ) : (
                      hasMoreUserMessages && (
                        <button
                          type="button"
                          className="conversation-thread-load-more-btn"
                          onClick={() => {
                            setIsLoadingMoreConversationThreads(true);
                            loadMoreUserMessages();
                          }}
                        >
                          Load 10 More Conversations
                        </button>
                      )
                    )}
                  </>
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
                        src={
                          selectedThread.participant.profilePic ||
                          "/assets/profile.png"
                        }
                        alt="Avatar"
                        className="avatar"
                      />
                      <div>
                        <div className="conversation-chat-title">
                          {selectedThread.participant.name || "Unknown User"}
                        </div>
                        <div className="conversation-chat-email">
                          {selectedThread.participant.email} |{" "}
                          {selectedThread.participant.contact}
                        </div>
                      </div>
                    </div>

                    {/* <div
                      className="conversation-chat-body"
                      ref={conversationChatBodyRef}
                    >
                      {selectedThread.messages.map((msg) => {
                        const isMine = msg.senderUid === user?.uid;
                        const htmlContent = msg.content || "";

                        return (
                          <div
                            key={`${msg._source}-${msg.id}`}
                            className={`conversation-chat-row ${isMine ? "mine" : "other"}`}
                          >
                            <div
                              className={`conversation-bubble ${isMine ? "mine" : "other"}`}
                            >
                              {msg.sourcePage === "contact" && (
                                <div className="message-source-chip">
                                  From Contact Page
                                </div>
                              )}
                              <div
                                className="conversation-bubble-text"
                                dangerouslySetInnerHTML={{
                                  __html: htmlContent,
                                }}
                              />
                              <div className="conversation-bubble-time">
                                {formatMessageTimestamp(msg)}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div> */}

                    <div
                      className="conversation-chat-body"
                      ref={conversationChatBodyRef}
                    >
                      {isLoadingMoreConversationMessages ? (
                        <div className="admin-conversation-spinner-wrap">
                          <div className="admin-conversation-spinner" />
                        </div>
                      ) : (
                        canLoadMoreConversationMessages && (
                          <button
                            type="button"
                            className="conversation-load-more-btn"
                            onClick={() => {
                              setIsLoadingMoreConversationMessages(true);
                            }}
                          >
                            Load 10 More Messages
                          </button>
                        )
                      )}

                      {displayedThreadMessages.map((msg) => {
                        const isMine = msg.senderUid === user?.uid;
                        const htmlContent = msg.content || "";

                        return (
                          <div
                            key={`${msg._source}-${msg.id}`}
                            className={`conversation-chat-row ${isMine ? "mine" : "other"}`}
                          >
                            <div
                              className={`conversation-bubble ${isMine ? "mine" : "other"}`}
                            >
                              {msg.sourcePage === "contact" && (
                                <div className="message-source-chip">
                                  From Contact Page
                                </div>
                              )}
                              <div
                                className="conversation-bubble-text"
                                dangerouslySetInnerHTML={{
                                  __html: htmlContent,
                                }}
                              />
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
                        onKeyDown={handleAdminChatKeyDown}
                        placeholder="Type your message..."
                        className="conversation-chat-input"
                      />
                      <div className="conversation-chat-actions">
                        <button
                          className="fleet-link-btn"
                          onClick={sendFleetDetailsLink}
                        >
                          Send Fleet Link
                        </button>
                        <button
                          className="reply-btn"
                          onClick={sendConversationMessage}
                        >
                          Send
                        </button>
                      </div>
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
              {/* <button className="admin-close-btn" onClick={closeNotification}>
                ×
              </button> */}

              <button
                className="close-btn"
                type="button"
                onClick={closeNotification}
              >
                <FiX className="close-icon" />
              </button>

              <div className="message-header">
                <img
                  src={
                    selectedNotification?.profilePic || "/assets/profile.png"
                  }
                  alt="Avatar"
                  className="avatar"
                />
                <div className="admin-message-info">
                  <h3 className="admin-message-name">
                    {selectedNotification?.name}
                  </h3>
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
                dangerouslySetInnerHTML={{
                  __html: selectedNotification?.content,
                }}
              ></p>

              <div className="message-actions">
                <div className="message-actions-left">
                  <img
                    src="/assets/delete.png"
                    alt="Delete"
                    className="action-icon delete-icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      setMessageToDelete({
                        ...selectedNotification,
                        _source: "inbox",
                      });
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

        {showDeleteConversationOverlay && threadToDelete && (
          <div className="overlay-revert">
            <div className="confirm-modal">
              <h3>Delete Conversation</h3>
              <p>
                This will delete all messages in this conversation from your
                admin inbox and sentbox. Continue?
              </p>
              <div className="confirm-buttons">
                <button
                  className="confirm-btn revert"
                  onClick={() => {
                    setShowDeleteConversationOverlay(false);
                    deleteConversationThread(threadToDelete);
                  }}
                >
                  Yes, Delete
                </button>
                <button
                  className="confirm-btn cancel"
                  onClick={() => {
                    setShowDeleteConversationOverlay(false);
                    setThreadToDelete(null);
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {processingConversationDelete.isProcessing && (
          <div className="submitting-overlay">
            <div className="loading-container">
              <div className="loading-bar-road">
                <img
                  src="/assets/images/submitting.gif"
                  alt={processingConversationDelete.message}
                  className="car-gif"
                />
              </div>
              <p className={processingConversationDelete.textClass}>
                {processingConversationDelete.message}
              </p>
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

        {actionOverlay.isVisible && (
          <div
            className={`${
              actionOverlay.type === "warning"
                ? "date-warning-overlay"
                : "sent-ongoing-overlay"
            } ${hideCancelAnimation ? "hide" : ""}`}
          >
            <button
              className={
                actionOverlay.type === "warning"
                  ? "close-warning"
                  : "close-sent-ongoing"
              }
              onClick={() => {
                setHideCancelAnimation(true);
                setTimeout(
                  () =>
                    setActionOverlay({ ...actionOverlay, isVisible: false }),
                  400,
                );
              }}
            >
              ✖
            </button>
            <span className="warning-text">{actionOverlay.message}</span>
            <div
              className={
                actionOverlay.type === "warning"
                  ? "progress-bar"
                  : "sent-ongoing-progress-bar"
              }
            ></div>
          </div>
        )}
      </div>
    </div>
  );
};

export default React.memo(Messages);
