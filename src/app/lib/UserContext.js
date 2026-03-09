"use client";
// src/contexts/UserContext.js
import {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback,
} from "react";
import {
  onAuthStateChanged,
  onIdTokenChanged,
  signOut,
  deleteUser,
  GoogleAuthProvider,
  FacebookAuthProvider,
  reauthenticateWithPopup,
  reload,
  EmailAuthProvider,
  linkWithCredential,
  linkWithPopup,
  unlink,
  sendPasswordResetEmail,
  sendEmailVerification,
  applyActionCode,
  getAuth,
  updateEmail,
  verifyBeforeUpdateEmail,
  signInAnonymously,
} from "firebase/auth";

import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  collection,
  getDocs,
  serverTimestamp,
  Timestamp,
  query,
  orderBy,
  where,
  deleteField,
  increment,
} from "firebase/firestore";
import { auth, db } from "./firebase";
import { useRouter } from "next/navigation";

const fbProvider = new FacebookAuthProvider();

const UserContext = createContext();
export const useUser = () => useContext(UserContext);

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  const [isBackingUp, setIsBackingUp] = useState(false);
  const [backupProgress, setBackupProgress] = useState(0);
  const [isBackupMinimized, setIsBackupMinimized] = useState(false);

  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [isDownloadMinimized, setIsDownloadMinimized] = useState(false);

  const [showBackupSuccess, setShowBackupSuccess] = useState(false);
  const [hideBackupAnimation, setHideBackupAnimation] = useState(false);
  const [showDownloadSuccess, setShowDownloadSuccess] = useState(false);
  const [hideDownloadAnimation, setHideDownloadAnimation] = useState(false);
  const [showImportSuccess, setShowImportSuccess] = useState(false);
  const [hideImportAnimation, setHideImportAnimation] = useState(false);

  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [isImportMinimized, setIsImportMinimized] = useState(false);

  const [theme, setTheme] = useState("default"); // fallback theme

  const router = useRouter();

  const [imageCache, setImageCache] = useState({});

  const [blockedUsers, setBlockedUsers] = useState([]);

  const [showBlockUserReason, setShowBlockUserReason] = useState(false);
  const [showUnblockUserConfirm, setShowUnblockUserConfirm] = useState(false);
  const [blockReason, setBlockReason] = useState("");
  const [userToProcess, setUserToProcess] = useState(null); // hold selected user

  const [showBlockedUserOverlay, setShowBlockedUserOverlay] = useState(false);
  const [blockedUserReason, setBlockedUserReason] = useState("");
  const [adminContactInfo, setAdminContactInfo] = useState({
    email: "",
    contact: "",
    name: "",
    profilePic: "",
  });

  const [authLoading, setAuthLoading] = useState(true);
  const [originalUser, setOriginalUser] = useState(null);
  const [userMessages, setUserMessages] = useState([]);
  const [sentMessages, setSentMessages] = useState([]);
  const [adminUid, setAdminUid] = useState(null);
  const [adminName, setAdminName] = useState(null);
  const [adminEmail, setAdminEmail] = useState(null);
  const [adminContact, setAdminContact] = useState(null);
  const [unitData, setUnitData] = useState([]);
  const [fleetDetailsUnits, setFleetDetailsUnits] = useState([]);
  const [activeBookings, setActiveBookings] = useState([]);
  const [completedBookingsAnalytics, setCompletedBookingsAnalytics] = useState(
    {},
  );
  const [calendarEvents, setCalendarEvents] = useState([]);
  const calendarEventsRef = useRef([]);
  const [userBookingRequests, setUserBookingRequests] = useState([]);
  const [userActiveRentals, setUserActiveRentals] = useState([]);
  const [adminBookingRequests, setAdminBookingRequests] = useState([]);
  const [userRentalHistory, setUserRentalHistory] = useState([]);

  const [imageUpdateTrigger, setImageUpdateTrigger] = useState(0);

  // Initial MOP types
  const [mopTypes, setMopTypes] = useState([]);
  const [popTypesRevenue, setPopTypesRevenue] = useState([]);
  const [popTypesExpense, setPopTypesExpense] = useState([]);
  const [referralSources, setReferralSources] = useState([]);

  const [revenueGrid, setRevenueGrid] = useState({});
  const [expenseGrid, setExpenseGrid] = useState({});

  const [isActivatingBooking, setIsActivatingBooking] = useState(false);

  const [showVerifyOverlay, setShowVerifyOverlay] = useState(false);

  const [isUpdatingUser, setIsUpdatingUser] = useState(false);
  const suppressAuthChange = useRef(false);

  const [adminAccounts, setAdminAccounts] = useState([]);
  const [userAccounts, setUserAccounts] = useState([]);

  const [hasServerChange, setHasServerChange] = useState(false);
  const [serverChangeCounter, setServerChangeCounter] = useState(0);

  const [isSaving, setIsSaving] = useState(false);
  const justSavedRef = useRef(false);

  const [lastSyncedUid, setLastSyncedUid] = useState(null);

  const lastKnownUserRef = useRef(null);
  const [lastKnownUser, setLastKnownUser] = useState(null);
  const setUserAndRemember = (u) => {
    lastKnownUserRef.current = u;
    setLastKnownUser(u);
    setUser(u);
  };

  const signInWithFacebook = async () => {
    try {
      const result = await signInWithPopup(auth, fbProvider);
      console.log("✅ Facebook login success:", result.user);
      return { success: true, user: result.user };
    } catch (error) {
      console.error("❌ Facebook Sign-In Error:", error);
      return { success: false, error };
    }
  };

  // SAVE GUEST USER BOOKING FORM AFTER LOGIN
  useEffect(() => {
    if (user && user.emailVerified) {
      // Check for pending booking data
      const pendingBookingData = localStorage.getItem("pendingBookingData");

      if (pendingBookingData) {
        try {
          const data = JSON.parse(pendingBookingData);

          // Store in localStorage with user-specific key
          localStorage.setItem(
            `pendingBookingData_${user.uid}`,
            pendingBookingData,
          );

          // Clear the general pending data
          localStorage.removeItem("pendingBookingData");

          console.log("📝 Pending booking data restored for user:", user.uid);
        } catch (error) {
          console.error("Error parsing pending booking data:", error);
        }
      }
    }
  }, [user]);

  // Load ALL settings on mount (MOP, POP/POE, referralSources)
  useEffect(() => {
    const loadAllSettings = async () => {
      try {
        const docRef = doc(db, "config", "appSettings");
        const docSnap = await getDoc(docRef);

        const defaultMops = [
          "CASH",
          "GCASH",
          "MAYA",
          "GoTYME",
          "BDO",
          "CARD",
          "PNB BUSINESS",
        ];
        const defaultRevenue = [
          "RENTAL PAYMENT",
          "EXTENSION",
          "CARWASH",
          "DELIVERY FEE",
          "RESERVATION FEE",
          "INSURANCE",
        ];
        const defaultExpense = ["FUEL", "TIRE", "OTHERS"];
        const defaultReferralSources = [
          "Walk-in",
          "Facebook",
          "Instagram",
          "TikTok",
          "Google Search",
          "Advertisement",
          "Word of Mouth",
          "Referral from a Friend",
          "Repeat Client",
          "Other",
        ];

        if (docSnap.exists()) {
          setMopTypes(docSnap.data().mopTypes || defaultMops);
          setPopTypesRevenue(docSnap.data().popTypesRevenue || defaultRevenue);
          setPopTypesExpense(docSnap.data().popTypesExpense || defaultExpense);
          setReferralSources(
            docSnap.data().referralSources || defaultReferralSources,
          );
        } else {
          setMopTypes(defaultMops);
          setPopTypesRevenue(defaultRevenue);
          setPopTypesExpense(defaultExpense);
          setReferralSources(defaultReferralSources);
          await setDoc(docRef, {
            mopTypes: defaultMops,
            popTypesRevenue: defaultRevenue,
            popTypesExpense: defaultExpense,
            referralSources: defaultReferralSources,
          });
        }
      } catch (error) {
        console.error("Error loading settings:", error);
      }
    };

    loadAllSettings();
  }, []);

  // Save MOP types
  const saveMopTypesToFirestore = async (types) => {
    try {
      const docRef = doc(db, "config", "appSettings");
      await setDoc(docRef, { mopTypes: types }, { merge: true }); // merge true keeps other fields
    } catch (error) {
      console.error("Error saving MOP types:", error);
    }
  };

  const updateMopTypes = (newTypes) => {
    setMopTypes(newTypes);
    saveMopTypesToFirestore(newTypes);
  };

  // Save POP types
  const savePopTypesToFirestore = async (revenueTypes, expenseTypes) => {
    try {
      const docRef = doc(db, "config", "appSettings");
      await setDoc(
        docRef,
        {
          popTypesRevenue: revenueTypes,
          popTypesExpense: expenseTypes,
        },
        { merge: true },
      );
    } catch (error) {
      console.error("Error saving POP types:", error);
    }
  };

  // Helper functions
  const updatePopTypesRevenue = (newTypes) => {
    setPopTypesRevenue(newTypes);
    savePopTypesToFirestore(newTypes, popTypesExpense);
  };

  const updatePopTypesExpense = (newTypes) => {
    setPopTypesExpense(newTypes);
    savePopTypesToFirestore(popTypesRevenue, newTypes);
  };

  // Save function
  const saveReferralSourcesToFirestore = async (sources) => {
    try {
      const docRef = doc(db, "config", "appSettings");
      await setDoc(docRef, { referralSources: sources }, { merge: true });
    } catch (error) {
      console.error("Error saving referral sources:", error);
    }
  };

  // Update function
  const updateReferralSources = (newSources) => {
    setReferralSources(newSources);
    saveReferralSourcesToFirestore(newSources);
  };

  const [paymentEntries, setPaymentEntries] = useState({});

  // Trigger flag for autofill updates
  const [autoFillTrigger, setAutoFillTrigger] = useState(false);

  const [cancelTrigger, setCancelTrigger] = useState(null);

  // Updated triggerAutoFill
  const triggerAutoFill = (newEntries) => {
    setPaymentEntries(
      (prev) =>
        typeof newEntries === "function"
          ? newEntries(prev) // allow function form
          : { ...prev, ...newEntries }, // allow direct object merge
    );

    setAutoFillTrigger(true);
    setTimeout(() => setAutoFillTrigger(false), 300);
  };

  const triggerCancelFill = (bookingId) => {
    console.log("🔴 triggerCancelFill CALLED with bookingId:", bookingId);

    // Remove this booking from paymentEntries completely
    setPaymentEntries((prev) => {
      const updated = { ...prev };
      delete updated[bookingId];
      console.log("🔴 paymentEntries after delete:", Object.keys(updated));
      return updated;
    });

    // Trigger cancel cleanup in FinancialReports
    console.log("🔴 Setting cancelTrigger to:", bookingId);
    setCancelTrigger(bookingId);

    // Reset trigger safely after a short delay
    // setTimeout(() => setCancelTrigger(null), 300);

    // setTimeout(() => {
    //   console.log("🔴 Resetting cancelTrigger to null");
    //   setCancelTrigger(null);
    // }, 300);
  };

  const [allUnitData, setAllUnitData] = useState([]);

  const addPaymentEntry = (bookingId, entry) => {
    setPaymentEntries((prev) => ({
      ...prev,
      [bookingId]: [...(prev[bookingId] || []), entry],
    }));
  };

  const updatePaymentEntry = (bookingId, index, updatedEntry) => {
    setPaymentEntries((prev) => ({
      ...prev,
      [bookingId]: prev[bookingId].map((entry, i) =>
        i === index ? updatedEntry : entry,
      ),
    }));
  };

  // const removePaymentEntry = (bookingId, index) => {
  //   setPaymentEntries((prev) => ({
  //     ...prev,
  //     [bookingId]: prev[bookingId].filter((_, i) => i !== index),
  //   }));
  // };

  const removePaymentEntry = (bookingId, index) => {
    setPaymentEntries((prev) => {
      // Safety check: if bookingId doesn't exist or entries is not an array, return unchanged
      if (!prev[bookingId] || !Array.isArray(prev[bookingId])) {
        return prev;
      }
      return {
        ...prev,
        [bookingId]: prev[bookingId].filter((_, i) => i !== index),
      };
    });
  };

  // REALTIME FETCH UNITS COLLECTION
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "units"), (snapshot) => {
      const allFetchedUnits = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      setAllUnitData(allFetchedUnits);
      const filteredUnits = allFetchedUnits.filter((unit) => !unit.hidden);
      setUnitData(filteredUnits);
    });

    return () => unsubscribe();
  }, []);

  // useEffect(() => {
  //   const unsubscribe = onSnapshot(collection(db, "units"), (snapshot) => {
  //     const allFetchedUnits = snapshot.docs.map((doc) => ({
  //       id: doc.id,
  //       ...doc.data(),
  //     }));

  //     // Set all units (including hidden)
  //     setAllUnitData(allFetchedUnits);

  //     // Set filtered units (exclude hidden, existing logic)
  //     const filteredUnits = allFetchedUnits.filter((unit) => !unit.hidden);
  //     setUnitData(filteredUnits);
  //   });

  //   return () => unsubscribe();
  // }, []);

  // Shared Action Overlay
  const [actionOverlay, setActionOverlay] = useState({
    isVisible: false,
    message: "",
    type: "success",
  });
  const [hideCancelAnimation, setHideCancelAnimation] = useState(true);

  const showActionOverlay = ({
    message = "",
    type = "success",
    autoHide = true,
    duration = 5000,
  } = {}) => {
    setHideCancelAnimation(false);
    setActionOverlay({ isVisible: true, message, type });
    if (autoHide) {
      setTimeout(() => {
        setHideCancelAnimation(true);
        setTimeout(
          () => setActionOverlay((s) => ({ ...s, isVisible: false })),
          400,
        );
      }, duration);
    }
  };

  // REAL-TIME SYNC BOOKINGS TO USERS
  useEffect(() => {
    // Only run when someone is logged in
    if (!user?.uid || !adminUid) {
      return;
    }

    let unsubscribeUsers;

    // Sync bookings to a specific user
    const syncBookingsToUser = async (userId, userEmail) => {
      try {
        const adminActiveRef = collection(
          db,
          "users",
          adminUid,
          "activeBookings",
        );
        const bookingQuery = query(
          adminActiveRef,
          where("email", "==", userEmail),
        );
        const bookingSnapshot = await getDocs(bookingQuery);

        if (!bookingSnapshot.empty) {
          const copyPromises = bookingSnapshot.docs.map(async (docSnap) => {
            const bookingData = docSnap.data();

            const userBookingData = {
              ...bookingData,
              createdBy: userId,
              syncedFromAdmin: true,
              syncedAt: serverTimestamp(),
            };

            // Save booking under user's activeRentals
            const userRentalRef = doc(
              db,
              "users",
              userId,
              "activeRentals",
              docSnap.id,
            );
            await setDoc(userRentalRef, userBookingData);

            // Update admin's copy so cancelRental still works
            const adminBookingRef = doc(
              db,
              "users",
              adminUid,
              "activeBookings",
              docSnap.id,
            );
            await updateDoc(adminBookingRef, { createdBy: userId });

            console.log(`✅ Synced booking ${docSnap.id} to user ${userEmail}`);
          });

          await Promise.all(copyPromises);
          console.log(
            `✅ Auto-synced ${bookingSnapshot.docs.length} booking(s) for ${userEmail}`,
          );
        } else {
          console.log(`ℹ️ No admin bookings found for ${userEmail}`);
        }
      } catch (err) {
        console.error("❌ Error syncing bookings to user:", err);
      }
    };

    const setupSmartSync = async () => {
      console.log(
        "🔄 Setting up smart booking sync for:",
        user.role,
        user.email,
      );

      if (user.role === "admin") {
        // ADMIN MODE - Watch for new users being added
        console.log("👑 Admin mode: Watching for new users");

        const usersRef = collection(db, "users");
        const qUsers = query(usersRef, where("role", "==", "user"));

        unsubscribeUsers = onSnapshot(qUsers, async (snapshot) => {
          const changes = snapshot.docChanges();
          for (const change of changes) {
            if (change.type === "added") {
              const newUser = change.doc.data();
              const newUserId = change.doc.id;
              const newUserEmail = newUser.email?.trim().toLowerCase();

              console.log("👤 New user detected:", newUserEmail);
              if (newUserEmail) {
                await syncBookingsToUser(newUserId, newUserEmail);
              }
            }
          }
        });

        // REMOVED: adminActiveBookings listener (not needed)
        // User mode already handles sync when user logs in
      } else {
        // USER MODE - Check for existing admin bookings on login
        console.log("👤 User mode: Checking for existing admin bookings");

        if (lastSyncedUid === user.uid) {
          console.log("⏭️ User already synced, skipping");
          return;
        }

        try {
          const adminActiveRef = collection(
            db,
            "users",
            adminUid,
            "activeBookings",
          );
          const emailToSearch = user.email?.trim().toLowerCase();
          const q = query(adminActiveRef, where("email", "==", emailToSearch));

          console.log(
            "🔍 User searching for bookings with email:",
            emailToSearch,
          );
          const snapshot = await getDocs(q);

          if (snapshot.empty) {
            console.log("✅ No admin bookings found for this user");
            setLastSyncedUid(user.uid);
            return;
          }

          const copyPromises = snapshot.docs.map(async (docSnap) => {
            const bookingData = docSnap.data();

            const userBookingData = {
              ...bookingData,
              createdBy: user.uid,
              syncedFromAdmin: true,
              syncedAt: serverTimestamp(),
            };

            const userRentalRef = doc(
              db,
              "users",
              user.uid,
              "activeRentals",
              docSnap.id,
            );
            await setDoc(userRentalRef, userBookingData);

            console.log("✅ User synced booking:", docSnap.id);
          });

          await Promise.all(copyPromises);
          console.log(`✅ User synced ${snapshot.docs.length} booking(s)`);
          setLastSyncedUid(user.uid);
        } catch (error) {
          console.error("❌ User sync error:", error);
        }
      }
    };

    // Start
    setupSmartSync();

    // Cleanup
    return () => {
      if (unsubscribeUsers) {
        console.log("🧹 Cleaning up user listener");
        unsubscribeUsers();
      }
    };
  }, [user?.uid, user?.role, adminUid, lastSyncedUid]);

  // useEffect(() => {
  //   // Only run when someone is logged in
  //   if (!user?.uid || !adminUid) {
  //     return;
  //   }

  //   let unsubscribeUsers;
  //   let unsubscribeBookings;

  //   // Sync bookings to a specific user
  //   const syncBookingsToUser = async (userId, userEmail) => {
  //     try {
  //       const adminActiveRef = collection(
  //         db,
  //         "users",
  //         adminUid,
  //         "activeBookings",
  //       );
  //       const bookingQuery = query(
  //         adminActiveRef,
  //         where("email", "==", userEmail),
  //       );
  //       const bookingSnapshot = await getDocs(bookingQuery);

  //       if (!bookingSnapshot.empty) {
  //         const copyPromises = bookingSnapshot.docs.map(async (docSnap) => {
  //           const bookingData = docSnap.data();

  //           const userBookingData = {
  //             ...bookingData,
  //             createdBy: userId,
  //             syncedFromAdmin: true,
  //             syncedAt: serverTimestamp(),
  //           };

  //           // Save booking under user’s activeRentals
  //           const userRentalRef = doc(
  //             db,
  //             "users",
  //             userId,
  //             "activeRentals",
  //             docSnap.id,
  //           );
  //           await setDoc(userRentalRef, userBookingData);

  //           // Update admin’s copy so cancelRental still works
  //           const adminBookingRef = doc(
  //             db,
  //             "users",
  //             adminUid,
  //             "activeBookings",
  //             docSnap.id,
  //           );
  //           await updateDoc(adminBookingRef, { createdBy: userId });

  //           console.log(`✅ Synced booking ${docSnap.id} to user ${userEmail}`);
  //         });

  //         await Promise.all(copyPromises);
  //         console.log(
  //           `✅ Auto-synced ${bookingSnapshot.docs.length} booking(s) for ${userEmail}`,
  //         );
  //       } else {
  //         console.log(`ℹ️ No admin bookings found for ${userEmail}`);
  //       }
  //     } catch (err) {
  //       console.error("❌ Error syncing bookings to user:", err);
  //     }
  //   };

  //   const setupSmartSync = async () => {
  //     console.log(
  //       "🔄 Setting up smart booking sync for:",
  //       user.role,
  //       user.email,
  //     );

  //     if (user.role === "admin") {
  //       // ADMIN MODE
  //       console.log("👑 Admin mode: Watching for new users + new bookings");

  //       // Watch for brand new users being added
  //       const usersRef = collection(db, "users");
  //       const qUsers = query(usersRef, where("role", "==", "user"));

  //       unsubscribeUsers = onSnapshot(qUsers, async (snapshot) => {
  //         const changes = snapshot.docChanges();
  //         for (const change of changes) {
  //           if (change.type === "added") {
  //             const newUser = change.doc.data();
  //             const newUserId = change.doc.id;
  //             const newUserEmail = newUser.email?.trim().toLowerCase();

  //             console.log("👤 New user detected:", newUserEmail);
  //             if (newUserEmail) {
  //               await syncBookingsToUser(newUserId, newUserEmail);
  //             }
  //           }
  //         }
  //       });

  //       // Watch for new admin-created bookings
  //       const adminActiveRef = collection(
  //         db,
  //         "users",
  //         adminUid,
  //         "activeBookings",
  //       );
  //       unsubscribeBookings = onSnapshot(adminActiveRef, async (snapshot) => {
  //         const changes = snapshot.docChanges();
  //         for (const change of changes) {
  //           if (change.type === "added") {
  //             const booking = change.doc.data();
  //             const bookingId = change.doc.id;
  //             const bookingEmail = booking.email?.trim().toLowerCase();

  //             console.log(
  //               "📦 New booking created by admin:",
  //               bookingId,
  //               bookingEmail,
  //             );

  //             if (bookingEmail) {
  //               const usersRef = collection(db, "users");
  //               const userMatchQ = query(
  //                 usersRef,
  //                 where("email", "==", bookingEmail),
  //               );
  //               const userSnap = await getDocs(userMatchQ);

  //               if (!userSnap.empty) {
  //                 const matchedUser = userSnap.docs[0];
  //                 const matchedUserId = matchedUser.id;
  //                 await syncBookingsToUser(matchedUserId, bookingEmail);
  //               } else {
  //                 console.log(
  //                   `ℹ️ No user found yet for booking ${bookingId} (${bookingEmail})`,
  //                 );
  //               }
  //             }
  //           }
  //         }
  //       });
  //     } else {
  //       // USER MODE
  //       console.log("👤 User mode: Checking for existing admin bookings");

  //       // Prevent multiple syncs per session
  //       if (lastSyncedUid === user.uid) {
  //         console.log("⏭️ User already synced, skipping");
  //         return;
  //       }

  //       try {
  //         const adminActiveRef = collection(
  //           db,
  //           "users",
  //           adminUid,
  //           "activeBookings",
  //         );
  //         const emailToSearch = user.email?.trim().toLowerCase();
  //         const q = query(adminActiveRef, where("email", "==", emailToSearch));

  //         console.log(
  //           "🔍 User searching for bookings with email:",
  //           emailToSearch,
  //         );
  //         const snapshot = await getDocs(q);

  //         if (snapshot.empty) {
  //           console.log("✅ No admin bookings found for this user");
  //           setLastSyncedUid(user.uid);
  //           return;
  //         }

  //         const copyPromises = snapshot.docs.map(async (docSnap) => {
  //           const bookingData = docSnap.data();

  //           const userBookingData = {
  //             ...bookingData,
  //             createdBy: user.uid,
  //             syncedFromAdmin: true,
  //             syncedAt: serverTimestamp(),
  //           };

  //           const userRentalRef = doc(
  //             db,
  //             "users",
  //             user.uid,
  //             "activeRentals",
  //             docSnap.id,
  //           );
  //           await setDoc(userRentalRef, userBookingData);

  //           console.log("✅ User synced booking:", docSnap.id);
  //         });

  //         await Promise.all(copyPromises);
  //         console.log(`✅ User synced ${snapshot.docs.length} booking(s)`);
  //         setLastSyncedUid(user.uid);
  //       } catch (error) {
  //         console.error("❌ User sync error:", error);
  //       }
  //     }
  //   };

  //   // Start
  //   setupSmartSync();

  //   // Cleanup
  //   return () => {
  //     if (unsubscribeUsers) {
  //       console.log("🧹 Cleaning up user listener");
  //       unsubscribeUsers();
  //     }
  //     if (unsubscribeBookings) {
  //       console.log("🧹 Cleaning up booking listener");
  //       unsubscribeBookings();
  //     }
  //   };
  // }, [user?.uid, user?.role, adminUid, lastSyncedUid]);

  useEffect(() => {
    if (!adminUid || activeBookings.length === 0) return;

    const checkNinetyPercentWarnings = setInterval(() => {
      const now = Date.now();

      activeBookings.forEach(async (booking) => {
        // Parse start time
        const startTime =
          booking.startTimestamp?.toMillis?.() ||
          booking.startTimestamp?.seconds * 1000 ||
          new Date(`${booking.startDate}T${booking.startTime}`).getTime();

        const totalDurationMs = (booking.totalDurationInSeconds || 0) * 1000;
        const notifyAt = startTime + totalDurationMs * 0.9; // 90% point
        const endTime = startTime + totalDurationMs;

        // Skip if already notified for THIS endTime
        const lastNotified =
          booking.lastNinetyPercentNotifiedEnd?.toMillis?.() ||
          booking.lastNinetyPercentNotifiedEnd;
        if (lastNotified && lastNotified === endTime) return;

        // Notify if 90% progress
        if (now >= notifyAt && !lastNotified) {
          console.log(
            `⏰ Rental ${booking.id} has reached 90% of its duration!`,
          );

          // Send notifications
          await sendOneHourWarningNotifications(booking);

          // Mark in Firestore that this endTime was already notified
          const adminRentalRef = doc(
            db,
            "users",
            adminUid,
            "activeBookings",
            booking.id,
          );
          await updateDoc(adminRentalRef, {
            lastNinetyPercentNotifiedEnd: Timestamp.fromMillis(endTime),
          });

          if (
            booking.createdBy &&
            booking.createdBy !== "admin" &&
            booking.createdBy !== adminUid
          ) {
            const userRentalRef = doc(
              db,
              "users",
              booking.createdBy,
              "activeRentals",
              booking.id,
            );
            await updateDoc(userRentalRef, {
              lastNinetyPercentNotifiedEnd: Timestamp.fromMillis(endTime),
            });
          }
        }
      });
    }, 60000); // check every minute

    return () => clearInterval(checkNinetyPercentWarnings);
  }, [adminUid, activeBookings]);

  // Function to send notifications
  const sendOneHourWarningNotifications = async (booking) => {
    try {
      const fullName = `${booking.firstName || ""} ${
        booking.middleName || ""
      } ${booking.surname || ""}`.trim();
      const userId = booking.createdBy;

      // (WEBSITE) USER IN-APP MESSAGE
      const userMessage = {
        name: "EMNL Car Rental Services",
        profilePic: "/assets/profile.png",
        email: adminEmail,
        contact: adminContact,
        formattedDateTime: new Date().toLocaleString("en-US", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        }),
        startTimestamp: serverTimestamp(),
        content: `Hi ${fullName || "Customer"}, <br><br>
Your rental for <b>${
          booking.carName
        }</b> is ending in approximately 1 hour.<br><br>
Please call us immediately if you wish to extend your rental. If we don't hear from you within the hour, we'll call you to confirm.<br><br>
Thank you for choosing EMNL Car Rental Services.`,
        isNotification: true,
      };

      if (userId && userId !== adminUid) {
        await setDoc(
          doc(collection(db, "users", userId, "receivedMessages")),
          userMessage,
        );
      }

      // (WEBSITE) ADMIN IN-APP MESSAGE

      const adminMessage = {
        name: "System Notification",
        profilePic: "/assets/profile.png",
        email: "system@emnl.com",
        contact: "Notification",
        formattedDateTime: new Date().toLocaleString("en-US", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        }),
        startTimestamp: serverTimestamp(),
        content: `⚠️ Rental ending in 1 hour!<br><br>
<b>Customer:</b> ${fullName || "Customer"}<br>
<b>Car:</b> ${booking.carName} (${booking.plateNo})<br><br>
Call them now to check if they want to extend. If no response, call them when rental ends.`,
        isNotification: true,
      };

      await setDoc(
        doc(collection(db, "users", adminUid, "receivedMessages")),
        adminMessage,
      );

      // USER EMAIL (TEMPLATE 3)
      await sendEmail({
        toName: fullName || "Customer",
        toEmail: booking.email,
        templateId: 16, // BREVO TEMPLATE
        params: {
          fullName: fullName || "Customer",
          carName: booking.carName || "Selected Car",
          startDate: booking.startDate
            ? new Date(booking.startDate).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })
            : "",
          startTime: booking.startTime || "",
          addedHoursFee: "⚠️ Ending in 1 hour",
          newEndDate: booking.endTimestamp
            ? booking.endTimestamp.toDate().toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })
            : "",
          newEndTime: booking.endTimestamp
            ? booking.endTimestamp.toDate().toLocaleTimeString("en-US", {
                hour: "numeric",
                minute: "2-digit",
                hour12: true,
              })
            : "",
        },
      });

      // ADMIN EMAIL (TEMPLATE 7)
      await sendEmail({
        toName: "EMNL Admin",
        toEmail: adminEmail,
        templateId: 17, // BREVO TEMPLATE
        params: {
          userName: fullName || "Customer",
          userContact: booking.contact || "N/A",
          userEmail: booking.email,
          carName: booking.carName || "Selected Car",
          carPlateNo: booking.plateNo || "N/A",
          startDate: booking.startDate
            ? new Date(booking.startDate).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })
            : "",
          startTime: booking.startTime || "",
          addedHoursFee: "⚠️ Rental ending in 1 hour",
          newEndDate: booking.endTimestamp
            ? booking.endTimestamp.toDate().toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })
            : "",
          newEndTime: booking.endTimestamp
            ? booking.endTimestamp.toDate().toLocaleTimeString("en-US", {
                hour: "numeric",
                minute: "2-digit",
                hour12: true,
              })
            : "",
        },
      });

      console.log("✅ 1-hour warning notifications + emails sent");
    } catch (error) {
      console.error("❌ Error sending 1-hour warnings:", error);
    }
  };

  // Save Privacy Policy to Firestore
  const savePrivacyPolicy = async (content) => {
    try {
      const docRef = doc(db, "terms", "privacyPolicy");
      await setDoc(docRef, {
        content,
        lastUpdated: serverTimestamp(),
      });
      console.log("✅ Privacy Policy saved to Firestore (terms/privacyPolicy)");
      return { success: true };
    } catch (error) {
      console.error("❌ Error saving Privacy Policy:", error);
      return { success: false, error };
    }
  };

  // Save Terms & Conditions to Firestore
  const saveTermsConditions = async (content) => {
    try {
      const docRef = doc(db, "terms", "termsConditions");
      await setDoc(docRef, {
        content,
        lastUpdated: serverTimestamp(),
      });
      console.log(
        "✅ Terms & Conditions saved to Firestore (terms/termsConditions)",
      );
      return { success: true };
    } catch (error) {
      console.error("❌ Error saving Terms & Conditions:", error);
      return { success: false, error };
    }
  };

  // Fetch Privacy Policy from Firestore
  const fetchPrivacyPolicy = async () => {
    try {
      const docRef = doc(db, "terms", "privacyPolicy");
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        const data = snap.data();
        let lastUpdated = null;
        if (data.lastUpdated) {
          // Handle both Firestore Timestamp and string dates
          if (typeof data.lastUpdated.toDate === "function") {
            lastUpdated = data.lastUpdated.toDate();
          } else if (typeof data.lastUpdated === "string") {
            lastUpdated = new Date(data.lastUpdated);
          }
        }
        return {
          content: data.content || null,
          lastUpdated: lastUpdated,
        };
      }
      return { content: null, lastUpdated: null };
    } catch (error) {
      console.error("❌ Error fetching Privacy Policy:", error);
      return { content: null, lastUpdated: null };
    }
  };

  // Fetch Terms & Conditions from Firestore
  const fetchTermsConditions = async () => {
    try {
      const docRef = doc(db, "terms", "termsConditions");
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        const data = snap.data();
        let lastUpdated = null;
        if (data.lastUpdated) {
          // Handle both Firestore Timestamp and string dates
          if (typeof data.lastUpdated.toDate === "function") {
            lastUpdated = data.lastUpdated.toDate();
          } else if (typeof data.lastUpdated === "string") {
            lastUpdated = new Date(data.lastUpdated);
          }
        }
        return {
          content: data.content || null,
          lastUpdated: lastUpdated,
        };
      }
      return { content: null, lastUpdated: null };
    } catch (error) {
      console.error("❌ Error fetching Terms & Conditions:", error);
      return { content: null, lastUpdated: null };
    }
  };

  // Unified onIdTokenChanged (replace both old ones)
  useEffect(() => {
    const unsubscribe = onIdTokenChanged(auth, async (authUser) => {
      if (isBackingUp || isDownloading) {
        console.log(
          `Auth state update skipped: backup${isBackingUp ? " in progress" : ""}${
            isBackingUp && isDownloading ? " and" : ""
          }${isDownloading ? " download in progress" : ""}.`,
        );
        return;
      }

      setAuthLoading(true);

      // if (!authUser) {
      //   setUser(null);
      //   setOriginalUser(null);
      //   setAuthLoading(false);
      //   return;
      // }

      if (!authUser) {
        if (!user) {
          setUser(null);
          setOriginalUser(null);
        }
        setAuthLoading(false);
        return;
      }

      const userDocRef = doc(db, "users", authUser.uid);

      try {
        const userDocSnap = await getDoc(userDocRef);

        // Always sync emailVerified (Auth -> Firestore)
        try {
          await updateDoc(userDocRef, {
            emailVerified: authUser.emailVerified,
          });
        } catch (err) {
          console.warn("⚠️ Failed to sync emailVerified:", err.message);
        }

        // 🟢 First-time user
        if (!userDocSnap.exists()) {
          const [firstName, surname] = (authUser.displayName || "").split(" ");

          const newUserData = {
            uid: authUser.uid,
            name: authUser.displayName || "",
            email: authUser.email || "",
            phone: authUser.phoneNumber || "",
            profilePic: authUser.photoURL || "/assets/profile.png",
            role: "user",
            firstLogin: true,
            createdAt: serverTimestamp(),
            lastLogin: serverTimestamp(),

            // Profile fields
            surname: surname || "",
            firstName: firstName || "",
            middleName: "",
            occupation: "",
            address: "",

            // Originals
            originalName: authUser.displayName || "",
            originalFirstName: firstName || "",
            originalSurname: surname || "",
            originalPhone: authUser.phoneNumber || "",
            originalProfilePic: authUser.photoURL || "",
            originalMiddleName: "",
            originalOccupation: "",
            originalAddress: "",
            originalEmail: authUser.email || "",

            providerData: authUser.providerData,
            emailVerified: authUser.emailVerified,

            blocked: false,
          };

          // Create user doc
          await setDoc(userDocRef, newUserData);

          // Set state immediately (so Login.js redirects)
          setUser(newUserData);
          setOriginalUser({
            name: newUserData.originalName,
            phone: newUserData.originalPhone,
            profilePic: newUserData.originalProfilePic,
          });

          // Post-creation side effects (non-blocking)
          (async () => {
            try {
              // Fetch app settings for notifications
              const settingsSnap = await getDoc(
                doc(db, "config", "appSettings"),
              );
              const adminEmail = settingsSnap.data()?.adminEmail;
              const adminContact = settingsSnap.data()?.adminContact;
              const adminUid = settingsSnap.data()?.adminUid;

              // Welcome message
              try {
                const receivedMessagesRef = doc(
                  collection(db, "users", authUser.uid, "receivedMessages"),
                );
                const now = new Date();
                const formattedDateTime = `${now.toLocaleDateString("en-US", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })} | ${now.toLocaleTimeString("en-US", {
                  hour: "2-digit",
                  minute: "2-digit",
                  hour12: true,
                })}`;

                const welcomeMessage = {
                  name: "EMNL Car Rental Services",
                  profilePic: "/assets/profile.png",
                  email: adminEmail,
                  contact: adminContact,
                  date: now.toLocaleDateString(),
                  time: now.toLocaleTimeString(),
                  startTimestamp: serverTimestamp(),
                  formattedDateTime,
                  content: `
                  Welcome aboard, and thank you for joining 
                  <b>EMNL Car Rental Services!</b><br/><br/>
                  We’re thrilled to have you with us. From sleek city rides 
                  to spacious family cars, we’ve got the keys to your perfect journey.<br/><br/>
                  Buckle up and explore our fleet, discover amazing rides, 
                  and enjoy hassle-free bookings.<br/><br/>
                  Your journey starts here. Let’s <b>hit the road</b> 
                  and get you <b>ready to roll!</b>
                `,
                  isNotification: true,
                };

                await setDoc(receivedMessagesRef, welcomeMessage);
              } catch (err) {
                console.warn("Skipping welcome message:", err);
              }

              // Admin notification (WEBSITE)
              if (adminUid) {
                try {
                  const adminMessagesRef = doc(
                    collection(db, "users", adminUid, "receivedMessages"),
                  );
                  const now = new Date();
                  const formattedDateTime = `${now.toLocaleDateString(
                    "en-US",
                  )} | ${now.toLocaleTimeString("en-US")}`;
                  const adminNotification = {
                    name: "System Notification",
                    profilePic: "/assets/profile.png",
                    email: "system@emnl.com",
                    contact: "Notification",
                    date: now.toLocaleDateString(),
                    time: now.toLocaleTimeString(),
                    startTimestamp: serverTimestamp(),
                    formattedDateTime,
                    subject: "New User Signup",
                    content: `
                    <div style="font-family: Arial, sans-serif; line-height: 1.5;">
                      <h3 style="margin: 0; color: #2c3e50;">New User Signup</h3>
                      <p>A new user has registered on <b>EMNL Car Rental Services</b>.</p>
                      <p><b>Name:</b> ${newUserData.name || "None"}</p>
                      <p><b>Email:</b> ${newUserData.email}</p>
                      <p><b>Contact:</b> ${
                        newUserData.phone || "No Contact Yet"
                      }</p>
                    </div>
                  `,
                    isNotification: true,
                  };
                  await setDoc(adminMessagesRef, adminNotification);
                } catch (err) {
                  console.warn(
                    "❌ Failed to send admin signup notification:",
                    err,
                  );
                }
              }

              // EMAIL (ADMIN & USER)
              try {
                if (adminEmail) {
                  await sendEmail({
                    toName: "EMNL Admin",
                    toEmail: adminEmail,
                    templateId: 6,
                    params: {
                      userName: newUserData.name || "None",
                      userEmail: newUserData.email || "",
                      userContact: newUserData.phone || "No Contact Yet",
                      ADMIN_DASHBOARD_LINK:
                        "https://your-admin-dashboard-link.com",
                    },
                  });
                }

                const fullName =
                  newUserData.name || newUserData.firstName || "Customer";
                await sendEmail({
                  toName: fullName,
                  toEmail: newUserData.email,
                  templateId: 5,
                  params: {
                    fullName,
                    email: newUserData.email || "",
                  },
                });
              } catch (err) {
                console.warn("❌ Failed to send emails:", err);
              }
            } catch (err) {
              console.warn("❌ Post-signup side effects skipped:", err);
            }
          })();

          // 🟢 Existing user
        } else {
          const data = userDocSnap.data();

          const existingUserData = {
            uid: authUser.uid,
            email: authUser.email || "",
            emailVerified: authUser.emailVerified,
            providerData: authUser.providerData,
            ...data,
          };

          // Update lastLogin
          try {
            await updateDoc(userDocRef, { lastLogin: serverTimestamp() });
          } catch {}

          setUser(existingUserData);
          setOriginalUser({
            name: data.originalName,
            phone: data.originalPhone,
            profilePic: data.originalProfilePic,
          });
        }
      } catch (err) {
        console.error("🔥 Auth bootstrap failed:", err);
        setUser(null);
        setOriginalUser(null);
      } finally {
        setAuthLoading(false);
      }
    });

    return () => unsubscribe();
  }, [isBackingUp]);

  // RELOAD & SYNC LINKING/UNLINKING ACCOUNT
  async function reloadAndSyncUser() {
    // ensure latest auth user object
    await auth.currentUser?.reload();
    const authUser = auth.currentUser;
    if (!authUser) {
      setUser(null);
      setUserAndRemember(null);
      return null;
    }

    // providerData from Firebase Auth is the source of truth for linked providers
    const providerData = Array.isArray(authUser.providerData)
      ? authUser.providerData
      : [];

    try {
      const userDocRef = doc(db, "users", authUser.uid);
      const snap = await getDoc(userDocRef);

      // Build a normalized user object that ALWAYS includes providerData
      if (snap.exists()) {
        const data = snap.data();
        const normalized = {
          uid: authUser.uid,
          name: data.name || authUser.displayName || "",
          email: data.email || authUser.email || "",
          phone: data.phone || authUser.phoneNumber || "",
          profilePic: data.profilePic || authUser.photoURL || "",
          role: data.role || "user",
          providerData, // IMPORTANT: keep auth provider info
          // include other Firestore fields but prioritize auth
          ...data,
        };
        setUser(normalized);
        setUserAndRemember(normalized);
        return normalized;
      } else {
        const fallback = {
          uid: authUser.uid,
          name: authUser.displayName || "",
          email: authUser.email || "",
          phone: authUser.phoneNumber || "",
          profilePic: authUser.photoURL || "",
          role: "user",
          providerData,
        };
        setUser(fallback);
        setUserAndRemember(fallback);
        return fallback;
      }
    } catch (err) {
      console.error("reloadAndSyncUser error:", err);
      setUser(null);
      setUserAndRemember(null);
      return null;
    }
  }

  // LINK ACCOUNT
  const linkAccount = async (providerId, email, password) => {
    suppressAuthChange.current = true;
    setIsUpdatingUser(true);

    showActionOverlay({
      message:
        providerId === "google.com"
          ? "Linking account..."
          : "Linking Email account...",
      type: "success",
      autoHide: false,
    });

    try {
      if (providerId === "google.com") {
        const provider = new GoogleAuthProvider();
        await linkWithPopup(auth.currentUser, provider);
      } else if (providerId === "password") {
        if (!email || !password) throw new Error("Email and password required");
        const credential = EmailAuthProvider.credential(email, password);
        await linkWithCredential(auth.currentUser, credential);
      }

      // refresh auth and normalize app user from Firestore
      await reloadAndSyncUser();

      // small debounce to allow Firebase internal state to stabilize
      await new Promise((r) => setTimeout(r, 350));

      showActionOverlay({
        message: "Account Linked",
        type: "success",
        autoHide: true,
      });

      return { success: true };
    } catch (error) {
      console.error("linkAccount error:", error);

      // attempt to recover user state
      showActionOverlay({
        message: `Link failed: ${error?.message || "Unknown error"}`,
        type: "warning",
        autoHide: true,
      });

      try {
        await reloadAndSyncUser();
      } catch {}
      return { success: false, error };
    } finally {
      // release guard AFTER USER IS SET and BUFFER FOR Firebase
      suppressAuthChange.current = false;
      setIsUpdatingUser(false);
    }
  };

  // UNLINK ACCOUNT
  const unlinkAccount = async (providerId) => {
    suppressAuthChange.current = true;
    setIsUpdatingUser(true);

    showActionOverlay({
      message:
        providerId === "google.com"
          ? "Unlinking account..."
          : "Unlinking Email account...",
      type: "warning",
      autoHide: false,
    });

    try {
      await unlink(auth.currentUser, providerId);

      // refresh auth and normalize app user from Firestore
      await reloadAndSyncUser();

      // small debounce to allow Firebase internal state to stabilize
      await new Promise((r) => setTimeout(r, 350));

      showActionOverlay({
        message: "Account Unlinked",
        type: "warning",
        autoHide: true,
      });

      return { success: true };
    } catch (error) {
      console.error("unlinkAccount error:", error);

      showActionOverlay({
        message: `Unlink failed: ${error?.message || "Unknown error"}`,
        type: "warning",
        autoHide: true,
      });

      try {
        await reloadAndSyncUser();
      } catch {}
      return { success: false, error };
    } finally {
      suppressAuthChange.current = false;
      setIsUpdatingUser(false);
    }
  };

  // Forgot Password
  const forgotPassword = async (email) => {
    try {
      if (!email) {
        return { success: false, message: "Please provide an email address." };
      }

      const normalizedEmail = email.trim().toLowerCase();
      console.log("[ForgotPassword] Attempting reset for:", normalizedEmail);

      // Directly attempt to send the reset email (no method check)
      await sendPasswordResetEmail(auth, normalizedEmail);
      console.log("[ForgotPassword] Reset email sent successfully");
      return { success: true, message: "Password reset email sent." };
    } catch (error) {
      console.error("[ForgotPassword] Error:", error);

      // Handle specific Firebase errors
      if (error.code === "auth/user-not-found") {
        return {
          success: false,
          message: "No account is registered with this email.",
        };
      } else if (error.code === "auth/invalid-email") {
        return { success: false, message: "Invalid email address." };
      } else {
        return {
          success: false,
          message:
            error.message || "Failed to send reset email. Please try again.",
        };
      }
    }
  };

  // REMEMBER ME
  const REMEMBER_KEY = "rememberMeExpiry";
  let logoutTimer;

  // Save Remember Me
  const rememberUser = () => {
    const expiry = Date.now() + 10 * 1000; // FOR TESTING: SET TO 30s
    localStorage.setItem(REMEMBER_KEY, expiry.toString());

    if (logoutTimer) clearTimeout(logoutTimer);
    logoutTimer = setTimeout(() => {
      expireSession();
    }, 10 * 1000);
  };

  const clearRememberMe = () => {
    localStorage.removeItem(REMEMBER_KEY);
    if (logoutTimer) clearTimeout(logoutTimer);
  };

  // Centralized expiry logic
  const expireSession = () => {
    console.log("⏳ Remember Me expired, logging out globally...");
    signOut(auth).finally(() => {
      clearRememberMe();
      localStorage.setItem("rememberMeExpired", "true"); // Notify Login.js
      setUser(null); // Clears context
      router.replace("/login", { replace: true }); // Force redirect to login
    });
  };

  const isRemembered = () => {
    const expiry = localStorage.getItem(REMEMBER_KEY);
    if (!expiry) return false;

    if (Date.now() > Number(expiry)) {
      expireSession();
      return false;
    }

    return true;
  };

  useEffect(() => {
    const expiry = localStorage.getItem(REMEMBER_KEY);

    if (!expiry) {
      // No remember-me set -> do nothing, let Firebase handle normal sessions
      console.log("ℹ️ No Remember Me set, skipping auto-expire.");
      return;
    }

    if (Date.now() > Number(expiry)) {
      // Expired -> trigger session expiry
      expireSession();
    } else {
      // Still valid -> schedule future logout
      console.log("✅ Remember Me still valid.");
      const remaining = Number(expiry) - Date.now();
      logoutTimer = setTimeout(() => expireSession(), remaining);
    }
  }, []);

  // SEND EMAIL VERIFICATION
  const sendVerificationEmail = async () => {
    try {
      const u = auth.currentUser;
      if (u) {
        await sendEmailVerification(u);
        return { ok: true, email: u.email || "" }; // Return email
      }
      return { ok: false, email: "" };
    } catch (error) {
      console.error("❌ Failed to send verification email:", error);
      return { ok: false, email: "" };
    }
  };

  // HANDLE EMAIL VERIFICATION FROM URL
  useEffect(() => {
    const handleEmailVerification = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const actionCode = urlParams.get("oobCode");
      const mode = urlParams.get("mode");

      if (mode === "verifyEmail" && actionCode) {
        try {
          await applyActionCode(auth, actionCode);

          if (auth.currentUser) {
            await reload(auth.currentUser); // Forces Refresh of emailVerified

            // Force token refresh to trigger onIdTokenChanged
            await auth.currentUser.getIdToken(true);

            await setDoc(
              doc(db, "users", auth.currentUser.uid),
              { emailVerified: auth.currentUser.emailVerified },
              { merge: true },
            );

            // Update local state immediately as fallback
            setUser((prev) => ({
              ...prev,
              emailVerified: auth.currentUser.emailVerified,
            }));
          }

          showActionOverlay({
            isVisible: true,
            type: "success",
            message: "Email verified! Redirecting...",
          });

          // Redirect after delay
          setTimeout(() => {
            window.location.href = "/profile";
          }, 3000);
        } catch (error) {
          showActionOverlay({
            isVisible: true,
            type: "warning",
            message: "Verification failed: " + error.message,
          });
        } finally {
          // Clean URL
          window.history.replaceState(
            {},
            document.title,
            window.location.pathname,
          );
        }
      }
    };

    handleEmailVerification();
  }, []);

  // REALTIME BLOCKED USERS LISTENER
  useEffect(() => {
    // Listener for blocked users (KEEP - shows overlay immediately)
    const blockedUserQuery = query(
      collection(db, "users"),
      where("role", "==", "user"),
      where("blocked", "==", true),
    );
    const unsubscribeBlocked = onSnapshot(blockedUserQuery, (snapshot) => {
      const blocked = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setBlockedUsers(blocked);
    });

    // Fetch admin accounts and active users ONCE (not real-time)
    const fetchAccounts = async () => {
      const usersRef = collection(db, "users");

      // Admin accounts
      const adminQuery = query(usersRef, where("role", "==", "admin"));
      const adminSnap = await getDocs(adminQuery);
      setAdminAccounts(
        adminSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() })),
      );

      // Active users
      const activeQuery = query(
        usersRef,
        where("role", "==", "user"),
        where("blocked", "==", false),
      );
      const activeSnap = await getDocs(activeQuery);
      setUserAccounts(
        activeSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() })),
      );
    };

    fetchAccounts();

    return () => {
      unsubscribeBlocked();
    };
  }, []);

  // useEffect(() => {
  //   // Listener for admins
  //   const adminQuery = query(
  //     collection(db, "users"),
  //     where("role", "==", "admin"),
  //   );
  //   const unsubscribeAdmins = onSnapshot(adminQuery, (snapshot) => {
  //     const admins = snapshot.docs.map((doc) => ({
  //       id: doc.id,
  //       ...doc.data(),
  //     }));
  //     setAdminAccounts(admins);
  //   });

  //   // Listener for active users
  //   const activeUserQuery = query(
  //     collection(db, "users"),
  //     where("role", "==", "user"),
  //     where("blocked", "==", false),
  //   );
  //   const unsubscribeUsers = onSnapshot(activeUserQuery, (snapshot) => {
  //     const users = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  //     setUserAccounts(users);
  //   });

  //   // Listener for blocked users
  //   const blockedUserQuery = query(
  //     collection(db, "users"),
  //     where("role", "==", "user"),
  //     where("blocked", "==", true),
  //   );
  //   const unsubscribeBlocked = onSnapshot(blockedUserQuery, (snapshot) => {
  //     const blocked = snapshot.docs.map((doc) => ({
  //       id: doc.id,
  //       ...doc.data(),
  //     }));
  //     setBlockedUsers(blocked);
  //   });

  //   return () => {
  //     unsubscribeAdmins();
  //     unsubscribeUsers();
  //     unsubscribeBlocked();
  //   };
  // }, []);

  // BLOCK USER FUNCTION
  const confirmBlockUser = (usr) => {
    setUserToProcess(usr);
    setShowBlockUserReason(true);
  };

  const blockUsers = async (userToBlock, reason) => {
    try {
      await updateDoc(doc(db, "users", userToBlock.id), {
        blocked: true,
        blockedAt: serverTimestamp(),
        blockedReason: reason,
      });

      showActionOverlay({
        message: `🚫 User ${userToBlock.email} has been blocked.`,
        type: "warning",
      });
    } catch (error) {
      console.error("❌ Error blocking user:", error);
      showActionOverlay({
        message: "Failed to block user. Try again.",
        type: "warning",
      });
    }
  };

  // UNBLOCK USER FUNCTION
  const confirmUnblockUser = (usr) => {
    setUserToProcess(usr);
    setShowUnblockUserConfirm(true);
  };

  const unblockUser = async (usr) => {
    try {
      await updateDoc(doc(db, "users", usr.id), {
        blocked: false,
        unblockedAt: serverTimestamp(),
        blockedReason: deleteField(),
      });

      showActionOverlay({
        message: `✅ User ${usr.email} has been unblocked.`,
        type: "success",
      });
    } catch (error) {
      console.error("❌ Error unblocking user:", error);
      showActionOverlay({
        message: "Failed to unblock user. Try again.",
        type: "warning",
      });
    }
  };

  // REAL-TIME LISTENER FOR BLOCKED STATUS and REDIRECT TO /LOGIN
  useEffect(() => {
    if (!user?.uid) return;

    const userDocRef = doc(db, "users", user.uid);
    const unsubscribe = onSnapshot(userDocRef, async (userSnap) => {
      if (userSnap.exists()) {
        const userData = userSnap.data();

        if (userData.blocked === true) {
          setBlockedUserReason(userData.blockedReason || "No reason provided");
          setShowBlockedUserOverlay(true);

          try {
            const settingsRef = doc(db, "config", "appSettings");
            const settingsSnap = await getDoc(settingsRef);
            if (settingsSnap.exists()) {
              const data = settingsSnap.data();
              setAdminContactInfo({
                email: data.adminEmail || "rentalinquiries.emnl@gmail.com",
                contact: data.adminContact || "+63 975 477 8178",
                name: data.adminName || "EMNL Admin",
                profilePic: data.adminProfilePic || "/assets/profile.png",
              });
            }
          } catch (error) {
            console.error("Error fetching admin contact:", error);
          }

          await signOut(auth);
          router.replace("/login", { replace: true });
        }
      }
    });

    return () => unsubscribe();
  }, [user?.uid, router]);

  // SEND EMAIL VIA VERCEL SERVERLESS FUNCTION
  const sendEmail = async ({
    toName,
    toEmail,
    subject,
    message,
    templateId,
    params,
  }) => {
    try {
      const API_BASE = window.location.hostname.includes("localhost")
        ? "http://localhost:3000"
        : "";

      const response = await fetch(`${API_BASE}/api/sendEmail`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          toName,
          toEmail,
          subject,
          message,
          templateId,
          params,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Failed to send email");

      console.log("✅ Email sent:", data);
    } catch (error) {
      console.error("❌ Email error:", error);
    }
  };

  // (ADMIN) FETCH ADMINUID FOR CONTACT.JS
  const fetchAdminUid = async () => {
    try {
      const settingsRef = doc(db, "config", "appSettings");
      const settingsSnap = await getDoc(settingsRef);

      if (!settingsSnap.exists()) {
        console.warn("⚠️ appSettings does not exist.");
        return null;
      }

      const settingsData = settingsSnap.data() || {};
      const uid = (settingsData.adminUid || "").trim();

      if (!uid) {
        console.warn("⚠️ appSettings.adminUid is missing.");
        return null;
      }

      // Use appSettings first (publicly readable path for all users)
      let name = (settingsData.adminName || "").trim() || "Admin";
      let email = (settingsData.adminEmail || "").trim() || "No email";
      let contact = (settingsData.adminContact || "").trim() || "No contact";
      let profilePic = settingsData.adminProfilePic || "/assets/profile.png";

      // Try enriching from users/{adminUid} only when this user can likely read it.
      // Regular users should use appSettings values to avoid denied reads + quota waste.
      if (user?.role === "admin" || user?.uid === uid) {
        try {
          const adminUserSnap = await getDoc(doc(db, "users", uid));
          if (adminUserSnap.exists()) {
            const d = adminUserSnap.data() || {};
            name = (d.name || "").trim() || name;
            email = (d.email || "").trim() || email;
            contact = (d.phone || "").trim() || contact;
            profilePic = d.profilePic || profilePic;
          }
        } catch (err) {
          console.warn(
            "⚠️ users/{adminUid} not readable for this user, using appSettings only.",
          );
        }
      }

      // // Try enriching from users/{adminUid}; non-admin may not have permission (ignore if denied)
      // try {
      //   const adminUserSnap = await getDoc(doc(db, "users", uid));
      //   if (adminUserSnap.exists()) {
      //     const d = adminUserSnap.data() || {};
      //     name = (d.name || "").trim() || name;
      //     email = (d.email || "").trim() || email;
      //     contact = (d.phone || "").trim() || contact;
      //     profilePic = d.profilePic || profilePic;
      //   }
      // } catch (err) {
      //   console.warn("⚠️ users/{adminUid} not readable for this user, using appSettings only.");
      // }

      setAdminUid(uid);
      setAdminName(name);
      setAdminEmail(email);
      setAdminContact(contact);

      setAdminContactInfo({
        name,
        email,
        contact,
        profilePic,
      });

      return { uid, name, email, contact, profilePic };
    } catch (err) {
      console.error("🔥 fetchAdminUid failed:", err);
      return null;
    }
  };

  const toJsDate = (value) => {
    if (!value) return null;
    if (value?.toDate && typeof value.toDate === "function")
      return value.toDate();

    if (value instanceof Date) {
      return Number.isNaN(value.getTime()) ? null : value;
    }

    if (typeof value === "number") {
      const d = new Date(value);
      return Number.isNaN(d.getTime()) ? null : d;
    }

    if (typeof value === "string") {
      const d = new Date(value);
      return Number.isNaN(d.getTime()) ? null : d;
    }

    return null;
  };

  const formatBookingDate = (value) => {
    const d = toJsDate(value);
    if (!d) return "";
    return d.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatBookingTime = (value, baseDate = null) => {
    if (!value) return "";

    if (
      typeof value === "number" ||
      (value?.toDate && typeof value.toDate === "function")
    ) {
      const d = toJsDate(value);
      if (!d) return "";
      return d.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });
    }

    if (typeof value === "string") {
      const trimmed = value.trim();

      if (/am|pm/i.test(trimmed)) {
        const d = new Date(`1970-01-01 ${trimmed}`);
        if (!Number.isNaN(d.getTime())) {
          return d.toLocaleTimeString("en-US", {
            hour: "numeric",
            minute: "2-digit",
            hour12: true,
          });
        }
        return trimmed;
      }

      if (/^\d{1,2}:\d{2}$/.test(trimmed)) {
        const [h, m] = trimmed.split(":").map(Number);
        const base = toJsDate(baseDate) || new Date();
        base.setHours(h, m, 0, 0);
        return base.toLocaleTimeString("en-US", {
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
        });
      }

      const d = new Date(trimmed);
      if (!Number.isNaN(d.getTime())) {
        return d.toLocaleTimeString("en-US", {
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
        });
      }

      return trimmed;
    }

    return "";
  };

  // (ADMIN) SYNC ADMIN INFO TO appSettings (called from AdminSettings.js after admin updates their profile)
  const syncAdminInfoToAppSettings = async ({
    adminUid,
    adminName,
    adminEmail,
    adminContact,
    adminProfilePic,
  }) => {
    try {
      const nextUid = adminUid || "";
      const nextName = adminName || "";
      const nextEmail = adminEmail || "";
      const nextContact = adminContact || "";

      await setDoc(
        doc(db, "config", "appSettings"),
        {
          adminUid: nextUid,
          adminName: nextName,
          adminEmail: nextEmail,
          adminContact: nextContact,
          ...(adminProfilePic ? { adminProfilePic } : {}),
          updatedAt: serverTimestamp(),
        },
        { merge: true },
      );

      // instant UI sync (no manual reload needed)
      setAdminUid(nextUid);
      setAdminName(nextName);
      setAdminEmail(nextEmail);
      setAdminContact(nextContact);
      setAdminContactInfo((prev) => ({
        ...prev,
        name: nextName,
        email: nextEmail,
        contact: nextContact,
        profilePic: adminProfilePic || prev.profilePic || "/assets/profile.png",
      }));

      return { success: true };
    } catch (error) {
      console.error("❌ Failed to sync admin info to appSettings:", error);
      return { success: false, error: error.message };
    }
  };

  const resetAdminToAppSettingsOriginal = async () => {
    try {
      const settingsRef = doc(db, "config", "appSettings");
      const settingsSnap = await getDoc(settingsRef);

      if (!settingsSnap.exists()) {
        return { success: false, error: "appSettings not found" };
      }

      const data = settingsSnap.data() || {};

      const originalUid = (data.originalAdminUid || data.adminUid || "").trim();
      const originalName = (
        data.originalAdminName ||
        data.adminName ||
        "Admin"
      ).trim();
      const originalEmail = (
        data.originalAdminEmail ||
        data.adminEmail ||
        ""
      ).trim();
      const originalContact = (
        data.originalAdminContact ||
        data.adminContact ||
        ""
      ).trim();
      const originalProfilePic =
        data.originalAdminProfilePic ||
        data.adminProfilePic ||
        "/assets/profile.png";

      if (!originalUid) {
        return {
          success: false,
          error: "originalAdminUid/adminUid is missing",
        };
      }

      // Reset admin user document based on appSettings originals
      await updateDoc(doc(db, "users", originalUid), {
        name: originalName,
        phone: originalContact,
        profilePic: originalProfilePic,
      });

      // Also reset current appSettings public fields
      await setDoc(
        settingsRef,
        {
          adminUid: originalUid,
          adminName: originalName,
          adminEmail: originalEmail,
          adminContact: originalContact,
          adminProfilePic: originalProfilePic,
          updatedAt: serverTimestamp(),
        },
        { merge: true },
      );

      setAdminUid(originalUid);
      setAdminName(originalName);
      setAdminEmail(originalEmail);
      setAdminContact(originalContact);
      setAdminContactInfo({
        name: originalName,
        email: originalEmail,
        contact: originalContact,
        profilePic: originalProfilePic,
      });

      return {
        success: true,
        data: {
          adminUid: originalUid,
          adminName: originalName,
          adminEmail: originalEmail,
          adminContact: originalContact,
          adminProfilePic: originalProfilePic,
        },
      };
    } catch (error) {
      console.error("❌ resetAdminToAppSettingsOriginal failed:", error);
      return { success: false, error: error.message || "Reset failed" };
    }
  };

  //   const fetchAdminUid = async () => {
  //   try {
  //     const settingsRef = doc(db, "config", "appSettings");
  //     const settingsSnap = await getDoc(settingsRef);

  //     if (settingsSnap.exists()) {
  //       const data = settingsSnap.data();
  //       const uid = data.adminUid;
  //       const name = data.adminName;
  //       const email = data.adminEmail;
  //       const contact = data.adminContact;

  //       if (uid) {
  //         let profilePic = "/assets/profile.png";
  //         const adminUserSnap = await getDoc(doc(db, "users", uid));
  //         if (adminUserSnap.exists()) {
  //           profilePic = adminUserSnap.data()?.profilePic || "/assets/profile.png";
  //         }

  //         setAdminUid(uid);
  //         setAdminName(name);
  //         setAdminEmail(email);
  //         setAdminContact(contact);

  //         return { uid, name, email, contact, profilePic };
  //       } else {
  //         console.warn("⚠️ adminUid field is missing in appSettings.");
  //         return null;
  //       }
  //     } else {
  //       console.warn("⚠️ appSettings document does not exist.");
  //       return null;
  //     }
  //   } catch (err) {
  //     console.error("🔥 Error fetching admin UID from appSettings:", err);
  //     return null;
  //   }
  // };
  // const fetchAdminUid = async () => {
  //   try {
  //     const settingsRef = doc(db, "config", "appSettings");
  //     const settingsSnap = await getDoc(settingsRef);

  //     if (settingsSnap.exists()) {
  //       const data = settingsSnap.data();
  //       const uid = data.adminUid;
  //       const name = data.adminName;
  //       const email = data.adminEmail;
  //       const contact = data.adminContact;

  //       if (uid) {
  //         setAdminUid(uid);
  //         setAdminName(name);
  //         setAdminEmail(email);
  //         setAdminContact(contact);

  //         return { uid, name, email, contact };
  //       } else {
  //         console.warn("⚠️ adminUid field is missing in appSettings.");
  //         return null;
  //       }
  //     } else {
  //       console.warn("⚠️ appSettings document does not exist.");
  //       return null;
  //     }
  //   } catch (err) {
  //     console.error("🔥 Error fetching admin UID from appSettings:", err);
  //     return null;
  //   }
  // };

  // (ADMIN GLOBAL) FETCH ADMINUID FOR GLOBAL USE
  useEffect(() => {
    const loadAdmin = async () => {
      const result = await fetchAdminUid();
      if (!result) {
        console.warn("❌ Could not load admin UID");
      }
    };

    loadAdmin();
  }, []);

  const setCalendarEventsSafe = (updaterFn) => {
    calendarEventsRef.current = updaterFn(calendarEventsRef.current);
    setCalendarEvents(calendarEventsRef.current);
  };

  // UPDATE THEME IN FIRESTORE
  const updateTheme = async (newTheme) => {
    const settingsRef = doc(db, "config", "appSettings");
    await setDoc(settingsRef, { theme: newTheme }, { merge: true });
  };

  // LISTEN FOR THEME CHANGES FROM FIRESTORE (appConfig)
  useEffect(() => {
    if (!user) {
      setTheme("default");
      document.documentElement.setAttribute("data-theme", "default");
      return;
    }

    const fetchTheme = async () => {
      const settingsRef = doc(db, "config", "appSettings");
      const snapshot = await getDoc(settingsRef);
      if (snapshot.exists()) {
        const data = snapshot.data();
        if (data.theme) {
          setTheme(data.theme);
          document.documentElement.setAttribute("data-theme", data.theme);
        }
      }
    };

    fetchTheme();
  }, [user]);

  // useEffect(() => {
  //   if (!user) {
  //     // GUEST USERS: force default theme
  //     setTheme("default");
  //     document.documentElement.setAttribute("data-theme", "default");
  //     return;
  //   }

  //   // REGISTERED USERS: SET GLOBAL THEME BASED ON FIRESTORE
  //   const settingsRef = doc(db, "config", "appSettings");
  //   const unsub = onSnapshot(settingsRef, (snapshot) => {
  //     if (snapshot.exists()) {
  //       const data = snapshot.data();
  //       if (data.theme) {
  //         setTheme(data.theme);
  //         document.documentElement.setAttribute("data-theme", data.theme);
  //       }
  //     }
  //   });

  //   return () => unsub();
  // }, [user]);

  // // (USER) REAL-TIME LISTENER FOR UNIT DATA ARRAY !!! UNIT DATA !!!
  // useEffect(() => {
  //   const unsubscribe = onSnapshot(
  //     collection(db, "units"),
  //     (snapshot) => {
  //       const unitsArray = snapshot.docs.map((doc) => ({
  //         id: doc.id,
  //         ...doc.data(),
  //       }));
  //       setUnitData(unitsArray);
  //       console.log("USER UNIT DATA LOADED:", unitsArray);
  //     },
  //     (error) => {
  //       console.error("❌ Real-time fetch failed:", error);
  //     },
  //   );

  //   return () => unsubscribe();
  // }, []);

  //   // (USER) RENTAL HISTORY LISTENER BETTER???
  // useEffect(() => {
  //   if (!user?.uid) return;

  //   const rentalHistoryRef = collection(db, "users", user.uid, "rentalHistory");
  //   const q = query(rentalHistoryRef, orderBy("movedToActiveAt", "desc"));

  //   const unsubscribe = onSnapshot(q, (snapshot) => {
  //     const rentals = snapshot.docs.map((doc) => ({
  //       id: doc.id,
  //       ...doc.data(),
  //     }));
  //     setUserRentalHistory(rentals);
  //   });

  //   return () => unsubscribe();
  // }, [user?.uid]);

  // (USER) RENTAL HISTORY LISTENER
  useEffect(() => {
    if (!user?.uid) return;

    const rentalHistoryRef = collection(db, "users", user.uid, "rentalHistory");
    // Get all rentals and sort client-side by dateCompleted (newest first)
    const q = query(rentalHistoryRef);

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const rentals = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      // Sort client-side by dateCompleted (newest first)
      const sortedRentals = rentals.sort((a, b) => {
        const dateA = a.dateCompleted ? new Date(a.dateCompleted) : new Date(0);
        const dateB = b.dateCompleted ? new Date(b.dateCompleted) : new Date(0);
        return dateB - dateA;
      });
      setUserRentalHistory(sortedRentals);
    });

    return () => unsubscribe();
  }, [user?.uid]);

  // // (ADMIN) REAL-TIME LISTENER FOR UNIT DATA ARRAY !!! UNIT DATA !!! HIDDEN UNITS ARE "NOT" HIDDEN
  // useEffect(() => {
  //   if (!adminUid) return;

  //   // Set up a real-time listener on the units collection
  //   const unsubscribe = onSnapshot(
  //     collection(db, "units"),
  //     (snapshot) => {
  //       const data = snapshot.docs.map((doc) => ({
  //         id: doc.id,
  //         ...doc.data(),
  //       }));
  //       setUnitData(data); // Include all units
  //     },
  //     (error) => {
  //       console.error("Error with real-time unit listener:", error);
  //     },
  //   );

  //   return () => unsubscribe();
  // }, [adminUid]);

  // (ADMIN) REAL-TIME LISTENER FOR ACTIVE BOOKINGS // 1. Listener just updates state
  useEffect(() => {
    if (!adminUid) return;

    const bookingsRef = collection(db, "users", adminUid, "activeBookings");
    const unsubscribe = onSnapshot(
      bookingsRef,
      (snapshot) => {
        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setActiveBookings(data);
        console.log("✅ activeBookings UPDATED:", data);
      },
      (error) => {
        console.error("❌ Error in activeBookings snapshot:", error);
      },
    );

    return () => unsubscribe();
  }, [adminUid]);

  // (ADMIN) REAL-TIME LISTENER FOR ACTIVE BOOKINGS // 2. Interval is separate and only checks state
  useEffect(() => {
    if (!adminUid || activeBookings.length === 0) return;

    const intervalId = setInterval(() => {
      const now = new Date();

      activeBookings.forEach(async (booking) => {
        // if (
        //   booking.status === "Pending" &&
        //   now >= booking.startTimestamp?.toDate?.()
        // ) {
        const hasConflict = booking?.reservationConflict === true;

        if (
          booking.status === "Pending" &&
          !hasConflict &&
          now >= booking.startTimestamp?.toDate?.()
        ) {
          try {
            await updateDoc(
              doc(db, "users", adminUid, "activeBookings", booking.id),
              { status: "Active" },
            );
            console.log(`✅ Auto-updated booking ${booking.id} to Active`);
          } catch (err) {
            console.error(`❌ Failed to update booking ${booking.id}:`, err);
          }
        }
      });
    }, 5000);

    return () => clearInterval(intervalId);
  }, [adminUid, activeBookings]);

  //   // SYNC UNITS HIDDEN STATUS BASED ON ACTIVE BOOKINGS (ADMIN) - NEW APPROACH: TRIGGERED BY ACTIVE BOOKINGS CHANGES
  //   useEffect(() => {
  //   if (!adminUid || user?.role !== "admin") return;

  //   const syncUnitsHiddenFromActiveBookings = async () => {
  //     try {
  //       const activePlateSet = new Set(
  //         (activeBookings || [])
  //           .filter((booking) => {
  //             const status = String(booking?.status || "").toLowerCase();
  //             return status === "active" || status === "pending";
  //           })
  //           .map((booking) => String(booking?.plateNo || "").trim().toUpperCase())
  //           .filter(Boolean),
  //       );

  //       const unitsSnap = await getDocs(collection(db, "units"));
  //       const updateTasks = [];

  //       unitsSnap.docs.forEach((unitSnap) => {
  //         const unitData = unitSnap.data() || {};
  //         const plate = String(unitData.plateNo || unitSnap.id || "")
  //           .trim()
  //           .toUpperCase();

  //         if (!plate) return;

  //         const shouldBeHidden = activePlateSet.has(plate);
  //         const currentHidden = !!unitData.hidden;

  //         if (currentHidden !== shouldBeHidden) {
  //           updateTasks.push(
  //             updateDoc(doc(db, "units", unitSnap.id), { hidden: shouldBeHidden }),
  //           );
  //         }
  //       });

  //       if (updateTasks.length > 0) {
  //         await Promise.all(updateTasks);
  //       }
  //     } catch (error) {
  //       console.error("Error syncing units.hidden from activeBookings:", error);
  //     }
  //   };

  //   syncUnitsHiddenFromActiveBookings();
  // }, [adminUid, user?.role, activeBookings]);

  // SYNC UNITS HIDDEN STATUS BASED ON ACTIVE/PENDING BOOKINGS
  useEffect(() => {
    if (!adminUid || user?.role !== "admin") return;

    const syncUnitsHiddenFromActiveBookings = async () => {
      try {
        const activePlateSet = new Set(
          (activeBookings || [])
            .filter((booking) => {
              const status = String(booking?.status || "").toLowerCase();
              return status === "active" || status === "pending";
            })
            .map((booking) =>
              String(booking?.plateNo || "")
                .trim()
                .toUpperCase(),
            )
            .filter(Boolean),
        );

        const unitsSnap = await getDocs(collection(db, "units"));
        const updateTasks = [];

        unitsSnap.docs.forEach((unitSnap) => {
          const unitData = unitSnap.data() || {};
          const plate = String(unitData.plateNo || unitSnap.id || "")
            .trim()
            .toUpperCase();

          if (!plate) return;

          const shouldBeHidden = activePlateSet.has(plate);
          const currentHidden = !!unitData.hidden;

          if (currentHidden !== shouldBeHidden) {
            updateTasks.push(
              updateDoc(doc(db, "units", unitSnap.id), {
                hidden: shouldBeHidden,
              }),
            );
          }
        });

        if (updateTasks.length > 0) {
          await Promise.all(updateTasks);
        }
      } catch (error) {
        console.error("Error syncing units.hidden from activeBookings:", error);
      }
    };

    syncUnitsHiddenFromActiveBookings();
  }, [adminUid, user?.role, activeBookings]);

  // RECONCILE reservationConflict FLAGS WHEN ACTIVE/PENDING BOOKINGS CHANGE
  useEffect(() => {
    if (!adminUid || user?.role !== "admin") return;

    const toMs = (booking, edge) => {
      const tsKey = edge === "start" ? "startTimestamp" : "endTimestamp";
      const dateKey = edge === "start" ? "startDate" : "endDate";
      const timeKey = edge === "start" ? "startTime" : "endTime";

      if (booking?.[tsKey]?.toDate) return booking[tsKey].toDate().getTime();
      if (booking?.[dateKey] && booking?.[timeKey]) {
        const d = new Date(`${booking[dateKey]}T${booking[timeKey]}:00`);
        if (!Number.isNaN(d.getTime())) return d.getTime();
      }
      return edge === "start" ? 0 : Number.MAX_SAFE_INTEGER;
    };

    const reconcileReservationConflicts = async () => {
      try {
        const snap = await getDocs(
          collection(db, "users", adminUid, "activeBookings"),
        );
        const bookings = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

        const activeByPlate = {};
        bookings
          .filter((b) => String(b?.status || "").toLowerCase() === "active")
          .forEach((b) => {
            const plate = String(b?.plateNo || "").toUpperCase();
            if (!plate) return;
            if (!activeByPlate[plate]) activeByPlate[plate] = [];
            activeByPlate[plate].push({
              startMs: toMs(b, "start"),
              endMs: toMs(b, "end"),
            });
          });

        const reservedPending = bookings.filter((b) => {
          const isPending = String(b?.status || "").toLowerCase() === "pending";
          const isReserved = b?.reservation === true;
          return isPending && isReserved;
        });

        for (const pending of reservedPending) {
          const plate = String(pending?.plateNo || "").toUpperCase();
          const pendingStartMs = toMs(pending, "start");
          const pendingEndMs = toMs(pending, "end");

          const overlapsActive = (activeByPlate[plate] || []).some(
            (w) => w.startMs < pendingEndMs && w.endMs > pendingStartMs,
          );

          const currentlyConflict = pending?.reservationConflict === true;

          if (overlapsActive && !currentlyConflict) {
            const conflictPatch = {
              reservationConflict: true,
              conflictReason:
                "Active rental was extended and now overlaps this reserved booking.",
              conflictDetectedAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
            };

            await updateDoc(
              doc(db, "users", adminUid, "activeBookings", pending.id),
              conflictPatch,
            );

            const uid = pending?.createdBy;
            if (uid && uid !== "admin" && uid !== adminUid) {
              const userPendingRef = doc(
                db,
                "users",
                uid,
                "activeRentals",
                pending.id,
              );
              const userPendingSnap = await getDoc(userPendingRef);
              if (userPendingSnap.exists()) {
                await updateDoc(userPendingRef, conflictPatch);
              }
            }
          }

          if (!overlapsActive && currentlyConflict) {
            const clearPatch = {
              reservationConflict: false,
              conflictReason: deleteField(),
              conflictDetectedAt: deleteField(),
              updatedAt: serverTimestamp(),
            };

            await updateDoc(
              doc(db, "users", adminUid, "activeBookings", pending.id),
              clearPatch,
            );

            const uid = pending?.createdBy;
            if (uid && uid !== "admin" && uid !== adminUid) {
              const userPendingRef = doc(
                db,
                "users",
                uid,
                "activeRentals",
                pending.id,
              );
              const userPendingSnap = await getDoc(userPendingRef);
              if (userPendingSnap.exists()) {
                await updateDoc(userPendingRef, clearPatch);
              }
            }
          }
        }
      } catch (error) {
        console.error("Error reconciling reservation conflicts:", error);
      }
    };

    reconcileReservationConflicts();
  }, [adminUid, user?.role, activeBookings]);

  // (ADMIN) EXTEND RENTAL
  const extendRentalDuration = async (rentalId, addedSeconds) => {
    console.log("🧪 adminUid:", adminUid);
    console.log("🧪 rentalId:", rentalId);

    try {
      const adminRentalRef = doc(
        db,
        "users",
        adminUid,
        "activeBookings",
        rentalId,
      );
      const adminRentalSnap = await getDoc(adminRentalRef);

      if (!adminRentalSnap.exists()) {
        console.error("Rental not found in admin path.");
        return;
      }

      console.log("📄 Rental ID used:", rentalId);
      console.log("📄 Admin ref path:", adminRentalRef.path);
      console.log("📄 Snapshot data:", adminRentalSnap.data());

      const rentalData = adminRentalSnap.data();
      const userId = rentalData.createdBy;

      if (!userId) {
        console.error("No userId found in rental data.");
        return;
      }

      const unitRef = doc(db, "units", rentalData.plateNo);
      const unitSnap = await getDoc(unitRef);

      if (!unitSnap.exists()) {
        console.error(
          "❌ Unit not found in /units with ID:",
          rentalData.plateNo,
        );
        return;
      }

      const unitData = unitSnap.data();

      const originalDuration = rentalData.totalDurationInSeconds || 0;
      console.log("originalDuration:", originalDuration);
      const updatedDuration = originalDuration + addedSeconds;

      const addedHours = Math.floor(addedSeconds / 3600);
      const extraRatePerHour = unitData.extension;
      let additionalCharge = 0;

      // 🟢 Hours logic (unchanged for now)
      if (addedHours > 0 && addedHours <= 5) {
        additionalCharge = addedHours * extraRatePerHour;
      }
      // 🟢 Exceeding 5 hours = 1 day rate
      else if (addedHours > 5 && addedHours < 24) {
        additionalCharge = unitData.price;
      }
      // 🟢 Exact days extension
      else if (addedHours % 24 === 0 && addedHours < 24 * 30) {
        const addedDays = addedHours / 24;
        additionalCharge = unitData.price * addedDays;
      }
      // 🟢 Months (30 days each)
      else if (addedHours % (24 * 30) === 0) {
        const addedMonths = addedHours / (24 * 30);
        additionalCharge = unitData.price * 30 * addedMonths;
      }

      const updatedExtraHourCharge =
        (rentalData.extraHourCharge || 0) + additionalCharge;
      const updatedTotalPrice = (rentalData.totalPrice || 0) + additionalCharge;

      const startTimestamp = rentalData.startTimestamp?.toDate();
      const newEndDate = new Date(
        startTimestamp.getTime() + updatedDuration * 1000,
      );
      const endTimestamp = Timestamp.fromDate(newEndDate);

      // Recalculate payments (like updateActiveBooking)
      const totalPaid = rentalData.paymentEntries
        ? rentalData.paymentEntries.reduce(
            (sum, entry) => sum + Number(entry.amount || 0),
            0,
          )
        : 0;

      const balanceDue = Math.max(0, updatedTotalPrice - totalPaid);
      const paid = balanceDue === 0;

      // Shared data updates
      const updates = {
        totalDurationInSeconds: updatedDuration,
        extraHourCharge: updatedExtraHourCharge,
        totalPrice: updatedTotalPrice,
        totalPaid,
        balanceDue,
        paid,
        "rentalDuration.extraHours":
          (rentalData.rentalDuration?.extraHours || 0) + addedHours,
        endTimestamp,
        manuallyExtended: true,
        updatedAt: serverTimestamp(),
      };

      // Update admin path (always)
      await updateDoc(adminRentalRef, updates);

      // Update user path only if linked to a REGISTERED user
      if (userId && userId !== "admin" && userId !== adminUid) {
        const userDocRef = doc(db, "users", userId);
        const userDocSnap = await getDoc(userDocRef);

        if (userDocSnap.exists()) {
          const userRentalRef = doc(
            db,
            "users",
            userId,
            "activeRentals",
            rentalId,
          );
          await updateDoc(userRentalRef, updates);
          console.log(
            `✅ Extended rental (${rentalId}) for both admin and user ${userId} by ${addedHours} hour(s), ₱${additionalCharge}`,
          );
        } else {
          console.warn(
            `⚠️ User ${userId} does not exist. Skipping activeRentals update.`,
          );
          console.log(
            `✅ Extended rental (${rentalId}) for admin only by ${addedHours} hour(s), ₱${additionalCharge}`,
          );
        }
      } else {
        console.log(
          `✅ Extended rental (${rentalId}) for admin only (walk-in booking) by ${addedHours} hour(s), ₱${additionalCharge}`,
        );
      }

      // Detect conflicts: extended ACTIVE booking vs same-unit reserved PENDING bookings
      const parseBookingMs = (booking, edge) => {
        const tsKey = edge === "start" ? "startTimestamp" : "endTimestamp";
        const dateKey = edge === "start" ? "startDate" : "endDate";
        const timeKey = edge === "start" ? "startTime" : "endTime";

        if (booking?.[tsKey]?.toDate) return booking[tsKey].toDate().getTime();

        if (booking?.[dateKey] && booking?.[timeKey]) {
          const d = new Date(`${booking[dateKey]}T${booking[timeKey]}:00`);
          if (!Number.isNaN(d.getTime())) return d.getTime();
        }

        return edge === "start" ? 0 : Number.MAX_SAFE_INTEGER;
      };

      const extendedStartMs =
        startTimestamp?.getTime?.() || parseBookingMs(rentalData, "start");
      const extendedEndMs = endTimestamp.toDate().getTime();

      const activeBookingsSnap = await getDocs(
        collection(db, "users", adminUid, "activeBookings"),
      );

      const conflictChecks = activeBookingsSnap.docs
        .filter((snap) => snap.id !== String(rentalId))
        .map((snap) => ({ id: snap.id, ...snap.data() }))
        .filter((booking) => {
          const sameUnit =
            String(booking?.plateNo || "").toUpperCase() ===
            String(rentalData?.plateNo || "").toUpperCase();
          const isPending =
            String(booking?.status || "").toLowerCase() === "pending";
          const isReserved = booking?.reservation === true;
          return sameUnit && isPending && isReserved;
        });

      for (const pendingBooking of conflictChecks) {
        const pendingStartMs = parseBookingMs(pendingBooking, "start");
        const pendingEndMs = parseBookingMs(pendingBooking, "end");

        const hasOverlap =
          extendedStartMs < pendingEndMs && extendedEndMs > pendingStartMs;

        if (!hasOverlap) continue;

        const conflictPatch = {
          reservationConflict: true,
          conflictReason:
            "Active rental was extended and now overlaps this reserved booking.",
          conflictDetectedAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        };

        await updateDoc(
          doc(db, "users", adminUid, "activeBookings", pendingBooking.id),
          conflictPatch,
        );

        const pendingCreatedBy = pendingBooking?.createdBy;
        if (
          pendingCreatedBy &&
          pendingCreatedBy !== "admin" &&
          pendingCreatedBy !== adminUid
        ) {
          const userPendingRef = doc(
            db,
            "users",
            pendingCreatedBy,
            "activeRentals",
            pendingBooking.id,
          );
          const userPendingSnap = await getDoc(userPendingRef);
          if (userPendingSnap.exists()) {
            await updateDoc(userPendingRef, conflictPatch);
          }
        }
      }

      // EXTENSION EMAIL (TEMPLATE 3)
      // Build full name
      const fullName = `${rentalData.firstName || ""} ${
        rentalData.middleName || ""
      } ${rentalData.surname || ""}`.trim();

      const startDateStr = rentalData.startDate
        ? new Date(rentalData.startDate).toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
          })
        : "";

      // ✅ Helper to format both numeric timestamps and "HH:mm" strings
      function formatTime(value) {
        if (!value) return "";

        if (typeof value === "number") {
          return new Date(value).toLocaleTimeString("en-US", {
            hour: "numeric",
            minute: "2-digit",
            hour12: true,
          });
        }

        if (typeof value === "string") {
          const [hours, minutes] = value.split(":").map(Number);
          const d = new Date();
          d.setHours(hours, minutes);
          return d.toLocaleTimeString("en-US", {
            hour: "numeric",
            minute: "2-digit",
            hour12: true,
          });
        }

        return "";
      }

      // Format start time
      const startTimeStr = formatTime(rentalData.startTime);

      // Format new end date/time from Firestore `endTimestamp`
      const newEndDateStr = endTimestamp
        ? endTimestamp.toDate().toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
          })
        : "";

      const newEndTimeStr = endTimestamp
        ? endTimestamp.toDate().toLocaleTimeString("en-US", {
            hour: "numeric",
            minute: "2-digit",
            hour12: true,
          })
        : "";

      // Send extension email
      await sendEmail({
        toName: fullName || "Customer",
        toEmail: rentalData.email,
        templateId: 3, // BREVO TEMPLATE
        params: {
          fullName: fullName || "Customer",
          carName: rentalData.carName || "Selected Car",
          startDate: startDateStr,
          startTime: startTimeStr,
          addedHoursFee: `+${addedHours} ${
            addedHours === 1 ? "hr" : "hrs"
          } | ₱${additionalCharge}`,
          newEndDate: newEndDateStr,
          newEndTime: newEndTimeStr,
        },
      });

      console.log("📧 Extension email sent to user");

      // (WEBSITE) IN-APP MESSAGE NOTIFICATION
      // Current timestamp formatting
      const now = new Date();
      const datePart = now.toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });
      const timePart = now.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });
      const formattedDateTime = `${datePart} | ${timePart}`;

      const inAppMessage = {
        name: "EMNL Car Rental Services",
        profilePic: "/assets/profile.png",
        email: adminEmail,
        contact: adminContact,
        formattedDateTime,
        startTimestamp: serverTimestamp(),
        content: `Hi ${fullName || "Customer"}, <br><br>
Your rental for <b>${
          rentalData.carName
        }</b> has been <b>extended</b> by ${addedHours} hour(s).<br><br>
<b>Extra Charge:</b> ₱${additionalCharge} <br>
<b>New End Date & Time:</b> ${newEndDateStr} | ${newEndTimeStr}<br>
Thank you for choosing EMNL Car Rental Services.`,
        isNotification: true,
      };

      const userInboxRef = doc(
        collection(db, "users", userId, "receivedMessages"),
      );
      await setDoc(userInboxRef, inAppMessage);

      console.log("💬 In-app extension message sent to user");

      // (WEBSITE) IN-APP MESSAGE (ADMIN)
      const adminMessage = {
        name: "System Notification",
        profilePic: "/assets/profile.png",
        email: "system@emnl.com",
        contact: "Notification",
        startTimestamp: serverTimestamp(),
        formattedDateTime,
        subject: "Rental Extended",
        content: `
        <div style="font-family: Arial, sans-serif; line-height: 1.5;">
          <h3 style="margin: 0; color: #2c3e50;">Rental Extension</h3>
          <p>User <b>${fullName || "Customer"}</b> extended their rental for 
          <b>${rentalData.carName || "Selected Car"}(${
            rentalData.plateNo
          })</b>.</p>
          <p><b>Added Hours & Fee:</b> +${addedHours} hr(s) | ₱${additionalCharge}<br>
          <b>New End Date & Time:</b> ${newEndDateStr} | ${newEndTimeStr}</p>
        </div>`,
        isNotification: true,
      };

      await setDoc(
        doc(collection(db, "users", adminUid, "receivedMessages")),
        adminMessage,
      );
      console.log("💬 In-app extension message sent to admin");

      // EMAIL (ADMIN - TEMPLATE 7)
      await sendEmail({
        toName: "EMNL Admin",
        toEmail: adminEmail,
        templateId: 7, // BREVO TEMPLATE
        params: {
          userName: fullName || "Customer",
          userContact: rentalData.contact || "N/A",
          userEmail: rentalData.email,
          carName: rentalData.carName || "Selected Car",
          carPlateNo: rentalData.plateNo || "N/A",
          startDate: startDateStr,
          startTime: startTimeStr,
          addedHoursFee: `+${addedHours} ${
            addedHours === 1 ? "hr" : "hrs"
          } | ₱${additionalCharge}`,
          newEndDate: newEndDateStr,
          newEndTime: newEndTimeStr,
        },
      });

      console.log("📧 Admin extension email sent");

      return updatedDuration;
    } catch (error) {
      console.error("🔥 Error extending rental:", error);
    }
  };

  // (USER) MARK USER RENTAL AS COMPLETED IF USER IS FIRST TO FINISH
  const markUserRentalAsCompleted = async (completedData) => {
    try {
      const bookingId = completedData.id;
      const plateNo = String(completedData.plateNo);
      const userId = completedData.createdBy;

      if (!userId || !bookingId) {
        console.error("Missing userId or bookingId in completedData");
        return;
      }

      // 1. Add to USER rentalHistory
      await setDoc(doc(db, "users", userId, "rentalHistory", bookingId), {
        ...completedData,
        dateCompleted: new Date().toISOString(),
        status: "Completed",
      });
      console.log("✅ User rentalHistory saved:", bookingId);

      // 2. Delete from USER activeRentals
      await deleteDoc(doc(db, "users", userId, "activeRentals", bookingId));
      console.log("🗑️ Deleted from user activeRentals:", bookingId);
    } catch (error) {
      console.error("🔥 Error in markUserRentalAsCompleted:", error);
    }
  };

  // (ADMIN) MARK RENTAL COMPLETE, FINSHES ITSELF
  const markRentalAsCompleted = async (completedData) => {
    try {
      const plateNo = String(completedData.plateNo);
      const userId = completedData.createdBy;
      const bookingId = completedData.id;

      const now = new Date();

      // Ensure endTimestamp exists
      let finalEndTimestamp = completedData.endTimestamp;

      if (!finalEndTimestamp) {
        // Try to compute it if missing
        if (completedData.endDate && completedData.endTime) {
          const [hours, minutes] = completedData.endTime.split(":").map(Number);
          const computedEnd = new Date(completedData.endDate);
          computedEnd.setHours(hours, minutes, 0, 0);
          finalEndTimestamp = Timestamp.fromDate(computedEnd);
        } else {
          // fallback: just use "now"
          finalEndTimestamp = Timestamp.fromDate(now);
        }
      }

      // 1. Save to ADMIN completedBookings
      console.log(
        "📝 Attempting to CREATE admin completedBookings:",
        bookingId,
      );
      await setDoc(doc(db, "users", adminUid, "completedBookings", bookingId), {
        ...completedData,
        endTimestamp: finalEndTimestamp,
        dateCompleted: now.toISOString(),
        status: "Completed",
      });
      console.log("✅ Admin completedBookings saved:", bookingId);

      // 2. Delete from ADMIN activeBookings
      console.log("🗑️ Attempting to DELETE admin activeBookings:", bookingId);
      await deleteDoc(doc(db, "users", adminUid, "activeBookings", bookingId));
      console.log("🗑️ Deleted from admin activeBookings:", bookingId);

      // 3. Save to USER rentalHistory (only if it doesn't exist yet)
      const userHistoryRef = doc(
        db,
        "users",
        userId,
        "rentalHistory",
        bookingId,
      );
      console.log("🔍 Checking if user rentalHistory exists:", bookingId);
      const userHistorySnap = await getDoc(userHistoryRef);

      if (!userHistorySnap.exists()) {
        console.log("📝 Attempting to CREATE user rentalHistory:", bookingId);
        await setDoc(userHistoryRef, {
          ...completedData,
          endTimestamp: finalEndTimestamp,
          dateCompleted: now.toISOString(),
          status: "Completed",
        });
        console.log("✅ User rentalHistory saved:", bookingId);
      } else {
        console.warn(
          "⚠️ Skipped saving to rentalHistory (already exists):",
          bookingId,
        );
      }

      // 4. Delete from USER activeRentals, but only if it exists
      const userActiveRentalRef = doc(
        db,
        "users",
        userId,
        "activeRentals",
        bookingId,
      );
      console.log("🔍 Checking if user activeRentals exists:", bookingId);
      const userActiveRentalSnap = await getDoc(userActiveRentalRef);

      if (userActiveRentalSnap.exists()) {
        console.log("🗑️ Attempting to DELETE user activeRentals:", bookingId);
        await deleteDoc(userActiveRentalRef);
        console.log("🗑️ Deleted from user activeRentals:", bookingId);
      } else {
        console.warn(
          "⚠️ Skipped delete: user activeRentals already moved or missing:",
          bookingId,
        );
      }

      // 5. Unhide the unit
      const unitRef = doc(db, "units", plateNo);
      await updateDoc(unitRef, { hidden: false });
      console.log("👁️ Unit unhidden:", plateNo);

      // COMPLETION EMAIL (TEMPLATE 4)
      // Build full name
      const fullName = `${completedData.firstName || ""} ${
        completedData.middleName || ""
      } ${completedData.surname || ""}`.trim();

      // Format rental start date/time
      const startDateStr = formatBookingDate(completedData.startDate);
      const startTimeStr = formatBookingTime(
        completedData.startTime,
        completedData.startDate,
      );

      const endDateStr = formatBookingDate(finalEndTimestamp);
      const endTimeStr = formatBookingTime(finalEndTimestamp);
      // const startDateStr = completedData.startDate
      //   ? new Date(completedData.startDate).toLocaleDateString("en-US", {
      //       year: "numeric",
      //       month: "long",
      //       day: "numeric",
      //     })
      //   : "";

      // function formatTime(value) {
      //   if (!value) return "";

      //   if (typeof value === "number") {
      //     return new Date(value).toLocaleTimeString("en-US", {
      //       hour: "numeric",
      //       minute: "2-digit",
      //       hour12: true,
      //     });
      //   }

      //   if (typeof value === "string") {
      //     const [hours, minutes] = value.split(":").map(Number);
      //     const d = new Date();
      //     d.setHours(hours, minutes);
      //     return d.toLocaleTimeString("en-US", {
      //       hour: "numeric",
      //       minute: "2-digit",
      //       hour12: true,
      //     });
      //   }

      //   return "";
      // }

      // // Rental start time
      // const startTimeStr = formatTime(completedData.startTime);

      // // Rental end date/time
      // const endDateStr = finalEndTimestamp
      //   .toDate()
      //   .toLocaleDateString("en-US", {
      //     year: "numeric",
      //     month: "long",
      //     day: "numeric",
      //   });

      // const endTimeStr = finalEndTimestamp
      //   .toDate()
      //   .toLocaleTimeString("en-US", {
      //     hour: "numeric",
      //     minute: "2-digit",
      //     hour12: true,
      //   });

      // Send completion email
      await sendEmail({
        toName: fullName || "Customer",
        toEmail: completedData.email,
        templateId: 4, // BREVO TEMPLATE
        params: {
          fullName: fullName || "Customer",
          carName: completedData.carName || "Selected Car",
          startDate: startDateStr,
          startTime: startTimeStr,
          endDate: endDateStr,
          endTime: endTimeStr,
        },
      });

      console.log("📧 Completion email sent to user");

      // (WEBSITE) IN-APP MESSAGE NOTIFICATION
      const datePart = now.toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });
      const timePart = now.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });
      const formattedDateTime = `${datePart} | ${timePart}`;

      const completionMessage = {
        name: "EMNL Car Rental Services",
        profilePic: "/assets/profile.png",
        email: adminEmail,
        contact: adminContact,
        formattedDateTime,
        startTimestamp: serverTimestamp(),
        content: `Hi ${fullName || "Customer"}, <br><br>
Your rental for <b>${
          completedData.carName
        }</b> has been <b>successfully Completed</b>.<br><br>
<b>Car:</b> ${completedData.carName} <br>
<b>Start Date & Time:</b> ${startDateStr} | ${startTimeStr} <br>
<b>End Date & Time:</b> ${endDateStr} | ${endTimeStr} <br>
<b>Travel Location:</b> ${completedData.location || "Not specified"} <br><br>
We hope you had a great experience with EMNL Car Rental Services. Thank you for trusting us!`,
        isNotification: true,
      };

      const userInboxCompletionRef = doc(
        collection(db, "users", userId, "receivedMessages"),
      );
      await setDoc(userInboxCompletionRef, completionMessage);

      console.log("💬 In-app completion message sent to user");

      // ADMIN EMAIL NOTIFICATION
      await sendEmail({
        toName: "Admin",
        toEmail: adminEmail,
        templateId: 8, // BREVO TEMPLATE
        params: {
          userName: fullName || "Customer",
          userEmail: completedData.email || "N/A",
          userContact: completedData.contact || "N/A",
          carName: completedData.carName || "Selected Car",
          carPlateNo: completedData.plateNo || "N/A",
          startDate: startDateStr,
          startTime: startTimeStr,
          endDate: endDateStr,
          endTime: endTimeStr,
          location: completedData.location || "Not specified",
        },
      });
      console.log("📧 Completion email sent to admin");

      // (WEBSITE) ADMIN IN-APP NOTIFICATION
      const adminNotification = {
        name: "System Notification",
        profilePic: "/assets/profile.png",
        email: "system@emnl.com",
        contact: "Notification",
        formattedDateTime,
        startTimestamp: serverTimestamp(),
        content: `<b>Rental Completed</b><br><br>
<b>Customer:</b> ${fullName || "Customer"} <br>
<b>Car:</b> ${completedData.carName} <br>
<b>Plate No:</b> ${completedData.plateNo} <br>
<b>Start Date & Time:</b> ${startDateStr} | ${startTimeStr} <br>
<b>End Date & Time:</b> ${endDateStr} | ${endTimeStr} <br>
<b>Travel Location:</b> ${completedData.location || "Not specified"} <br><br>
Completion has been recorded on both admin and user history records.`,
        isNotification: true,
      };

      const adminInboxRef = doc(
        collection(db, "users", adminUid, "receivedMessages"),
      );
      await setDoc(adminInboxRef, adminNotification);

      console.log("💬 Admin in-app notification sent");
    } catch (error) {
      console.error("🔥 Error in markRentalAsCompleted:", error.message);
      console.error("🛑 Full Error:", error);
    }
  };

  // (ADMIN) FORCE FINISH RENTAL
  const triggerForceFinishRental = async (rentalId) => {
    try {
      const rentalRef = doc(db, "users", adminUid, "activeBookings", rentalId);

      await updateDoc(rentalRef, {
        totalDurationInSeconds: 0,
        forceFinishedAt: serverTimestamp(), // Use server time for accuracy
      });

      console.log("✅ Rental force-finished in Firestore:", rentalId);
    } catch (error) {
      console.error("🔥 Error in triggerForceFinishRental:", error);
    }
  };

  // (ADMIN) REJECT REQUEST
  const rejectBookingRequest = async (bookingId, reasonText) => {
    try {
      const adminBookingRef = doc(
        db,
        "users",
        adminUid,
        "adminBookingRequests",
        bookingId,
      );
      const adminBookingSnap = await getDoc(adminBookingRef);

      if (!adminBookingSnap.exists()) {
        console.warn("Booking not found in admin collection:", bookingId);
        return;
      }

      const adminBookingData = adminBookingSnap.data();
      const userId = adminBookingData.createdBy;

      // 1. Update USER bookingRequest document
      const userBookingRef = doc(
        db,
        "users",
        userId,
        "userBookingRequest",
        bookingId,
      );
      await updateDoc(userBookingRef, {
        status: "Rejected",
        rejectionReason: reasonText,
        isEditing: false,
        updatedAt: serverTimestamp(),
      });
      console.log("✍️ User booking status set to Rejected");

      // 2. Delete from adminBookingRequests
      await deleteDoc(adminBookingRef);
      console.log("🗑️ Removed from adminBookingRequests:", bookingId);

      // 3. Send Email + WEBSITE Notification
      const bookingPayload = adminBookingData;
      const now = new Date();

      const fullName = `${bookingPayload.firstName || ""} ${
        bookingPayload.middleName || ""
      } ${bookingPayload.surname || ""}`.trim();

      // Format dates
      const startDateStr = formatBookingDate(bookingPayload.startDate);
      const endDateStr = formatBookingDate(bookingPayload.endDate);
      const startTimeStr = formatBookingTime(
        bookingPayload.startTime,
        bookingPayload.startDate,
      );
      const endTimeStr = formatBookingTime(
        bookingPayload.endTime,
        bookingPayload.endDate,
      );
      // const startDateStr = bookingPayload.startDate
      //   ? new Date(bookingPayload.startDate).toLocaleDateString("en-US", {
      //       year: "numeric",
      //       month: "long",
      //       day: "numeric",
      //     })
      //   : "";

      // const endDateStr = bookingPayload.endDate
      //   ? new Date(bookingPayload.endDate).toLocaleDateString("en-US", {
      //       year: "numeric",
      //       month: "long",
      //       day: "numeric",
      //     })
      //   : "";

      // // Reuse helper for time formatting
      // function formatTime(value) {
      //   if (!value) return "";
      //   if (typeof value === "number") {
      //     return new Date(value).toLocaleTimeString("en-US", {
      //       hour: "numeric",
      //       minute: "2-digit",
      //       hour12: true,
      //     });
      //   }
      //   if (typeof value === "string") {
      //     const [hours, minutes] = value.split(":").map(Number);
      //     const d = new Date();
      //     d.setHours(hours, minutes);
      //     return d.toLocaleTimeString("en-US", {
      //       hour: "numeric",
      //       minute: "2-digit",
      //       hour12: true,
      //     });
      //   }
      //   return "";
      // }

      // const startTimeStr = formatTime(bookingPayload.startTime);
      // const endTimeStr = formatTime(bookingPayload.endTime);

      // Send rejection email TEMPLATE 2
      await sendEmail({
        toName: fullName || "Customer",
        toEmail: bookingPayload.email,
        templateId: 2, // BREVO TEMPLATE
        params: {
          fullName: fullName || "Customer",
          carName: bookingPayload.carName,
          startDate: startDateStr,
          startTime: startTimeStr,
          endDate: endDateStr,
          endTime: endTimeStr,
          location: bookingPayload.location || "",
          rejectionReason: reasonText || "No reason specified",
        },
      });

      // SEND WEBSITE MESSAGE NOTIFICATION
      const datePart = now.toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });
      const timePart = now.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });
      const formattedDateTime = `${datePart} | ${timePart}`;

      const inAppMessage = {
        name: "EMNL Car Rental Services",
        profilePic: "/assets/profile.png",
        email: adminEmail,
        contact: adminContact,
        formattedDateTime,
        startTimestamp: serverTimestamp(),
        content: `Hi ${fullName || "Customer"}, <br><br>
We regret to inform you that your booking request for <b>${
          bookingPayload.carName
        }</b> has been <b>Rejected ❌ </b>.<br><br>
      <b>Car:</b> ${bookingPayload.carName} <br>
<b>Start Date & Time:</b> ${startDateStr} | ${startTimeStr} <br>
<b>End Date & Time:</b> ${endDateStr} | ${endTimeStr} <br>
<b>Travel Location:</b> ${bookingPayload.location || "Not specified"} <br><br>
<b>Reason for Rejection:</b> ${reasonText || "No reason specified"} <br><br>
If you have any questions or would like to reschedule, please don’t hesitate to contact us.`,
        isNotification: true,
      };

      const userInboxRef = doc(
        collection(db, "users", userId, "receivedMessages"),
      );
      await setDoc(userInboxRef, inAppMessage);

      console.log("💬 Rejection in-app message sent to user");

      // Admin email TEMPLATE 9
      await sendEmail({
        toName: "Admin",
        toEmail: adminEmail,
        templateId: 9, // BREVO TEMPLATE
        params: {
          fullName,
          carName: bookingPayload.carName,
          carPlateNo: bookingPayload.plateNo || "N/A",
          startDate: startDateStr,
          startTime: startTimeStr,
          endDate: endDateStr,
          endTime: endTimeStr,
          location: bookingPayload.location || "",
          rejectionReason: reasonText || "No reason specified",
          formattedDateTime,
        },
      });

      // Admin WEBSITE NOTIFICATION
      const adminInboxRef = doc(
        collection(db, "users", adminUid, "receivedMessages"),
      );
      await setDoc(adminInboxRef, {
        name: "System Notification",
        profilePic: "/assets/profile.png",
        email: "system@emnl.com",
        contact: "Notification",
        formattedDateTime,
        startTimestamp: serverTimestamp(),
        content: `<b>Booking Request Rejected</b><br><br>
<b>Customer:</b> ${fullName || "Unknown"} <br>
<b>Car:</b> ${bookingPayload.carName} <br>
<b>Plate No:</b> ${bookingPayload.plateNo || "N/A"} <br>
<b>Start Date & Time:</b> ${startDateStr} | ${startTimeStr} <br>
<b>End Date & Time:</b> ${endDateStr} | ${endTimeStr} <br>
<b>Reason for Rejection:</b> ${reasonText || "No reason specified"} <br><br>
Please monitor for possible resubmission or customer follow-up.`,
        isNotification: true,
      });

      console.log("📩 Rejection in-app + email sent to Admin");

      // 4. Optional: Refetch adminBookingRequests
      fetchAdminBookingRequests?.();
    } catch (error) {
      console.error("🔥 Error rejecting booking request:", error);
    }
  };

  // (USER) RESUBMIT BOOKING
  const resubmitUserBookingRequest = async (originalBookingData) => {
    try {
      const userId = user.uid;

      if (!user || !user.uid) {
        throw new Error("User not authenticated");
      }

      const appSettingsDoc = await getDoc(doc(db, "config", "appSettings"));
      const adminUid = appSettingsDoc.data()?.adminUid;
      if (!adminUid) throw new Error("Admin UID not found.");

      // Generate new booking ID
      const now = new Date();
      const timestamp = `${String(now.getMonth() + 1).padStart(2, "0")}${String(
        now.getDate(),
      ).padStart(2, "0")}${String(now.getFullYear())}${String(
        now.getHours(),
      ).padStart(2, "0")}${String(now.getMinutes()).padStart(2, "0")}${String(
        now.getSeconds(),
      ).padStart(2, "0")}`;
      if (!originalBookingData?.bookingId)
        throw new Error("Original bookingId not found");
      const newDocId = originalBookingData.bookingId;

      let driverLicenseUrl = null;

      if (originalBookingData.driverLicense instanceof File) {
        driverLicenseUrl = await compressAndConvertFileToBase64(
          originalBookingData.driverLicense,
        );
      } else if (typeof originalBookingData.driverLicense === "string") {
        driverLicenseUrl = originalBookingData.driverLicense;
      }

      const cleanedBookingData = {
        ...originalBookingData,
        status: "Pending",
        isEditing: false,
        createdAt: Timestamp.now(),
        createdBy: user.uid,
        bookingId: newDocId,
        driverLicense: driverLicenseUrl,
      };

      const userRef = doc(
        db,
        "users",
        user.uid,
        "userBookingRequest",
        newDocId,
      );
      const adminRef = doc(
        db,
        "users",
        adminUid,
        "adminBookingRequests",
        newDocId,
      );

      await Promise.all([
        setDoc(userRef, cleanedBookingData),
        setDoc(adminRef, cleanedBookingData),
      ]);

      console.log("✅ RE-SUBMITTED BOOKING (resubmitUserBookingRequest)");

      // RESUBMISSION EMAIL (TEMPLATE 13)
      // Build full name
      const fullName = `${cleanedBookingData.firstName || ""} ${
        cleanedBookingData.middleName || ""
      } ${cleanedBookingData.surname || ""}`.trim();

      // Format rental start date/time
      const startDateStr = formatBookingDate(cleanedBookingData.startDate);
      const startTimeStr = formatBookingTime(
        cleanedBookingData.startTime,
        cleanedBookingData.startDate,
      );
      const endDateStr = formatBookingDate(cleanedBookingData.endDate);
      const endTimeStr = formatBookingTime(
        cleanedBookingData.endTime,
        cleanedBookingData.endDate,
      );
      // const startDateStr = cleanedBookingData.startDate
      //   ? new Date(cleanedBookingData.startDate).toLocaleDateString("en-US", {
      //       year: "numeric",
      //       month: "long",
      //       day: "numeric",
      //     })
      //   : "";

      // function formatTime(value) {
      //   if (!value) return "";

      //   if (typeof value === "number") {
      //     return new Date(value).toLocaleTimeString("en-US", {
      //       hour: "numeric",
      //       minute: "2-digit",
      //       hour12: true,
      //     });
      //   }

      //   if (typeof value === "string") {
      //     const [hours, minutes] = value.split(":").map(Number);
      //     const d = new Date();
      //     d.setHours(hours, minutes);
      //     return d.toLocaleTimeString("en-US", {
      //       hour: "numeric",
      //       minute: "2-digit",
      //       hour12: true,
      //     });
      //   }

      //   return "";
      // }

      // // Rental start/end times
      // const startTimeStr = formatTime(cleanedBookingData.startTime);
      // const endDateStr = cleanedBookingData.endDate
      //   ? new Date(cleanedBookingData.endDate).toLocaleDateString("en-US", {
      //       year: "numeric",
      //       month: "long",
      //       day: "numeric",
      //     })
      //   : "";
      // const endTimeStr = formatTime(cleanedBookingData.endTime);

      // Send resubmission confirmation email
      await sendEmail({
        toName: fullName || "Customer",
        toEmail: cleanedBookingData.email,
        templateId: 13, // BREVO TEMPLATE
        params: {
          fullName: fullName || "Customer",
          carName: cleanedBookingData.carName || "Selected Car",
          startDate: startDateStr,
          startTime: startTimeStr,
          endDate: endDateStr,
          endTime: endTimeStr,
          location: cleanedBookingData.location || "Not specified",
        },
      });

      
      console.log("📧 Resubmission email sent to user");

      // (WEBSITE) IN-APP MESSAGE NOTIFICATION
      const datePart = now.toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });
      const timePart = now.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });
      const formattedDateTime = `${datePart} | ${timePart}`;

      const resubmissionMessage = {
        name: "EMNL Car Rental Services",
        profilePic: "/assets/profile.png",
        email: adminEmail,
        contact: adminContact,
        formattedDateTime,
        startTimestamp: serverTimestamp(),
        content: `Hi ${fullName || "Customer"}, <br><br>
Your booking for <b>${
          cleanedBookingData.carName
        }</b> has been <b>successfully Resubmitted</b>.<br><br>
<b>Car:</b> ${cleanedBookingData.carName} <br>
<b>Start Date & Time:</b> ${startDateStr} | ${startTimeStr} <br>
<b>End Date & Time:</b> ${endDateStr} | ${endTimeStr} <br>
<b>Travel Location:</b> ${
          cleanedBookingData.location || "Not specified"
        } <br><br>
We’ll review your Resubmission and get back to you shortly. Thank you for your patience!`,
        isNotification: true,
      };

      const userInboxResubmitRef = doc(
        collection(db, "users", userId, "receivedMessages"),
      );
      await setDoc(userInboxResubmitRef, resubmissionMessage);

      console.log("💬 In-app resubmission message sent to user");

      // ADMIN EMAIL NOTIFICATION
      await sendEmail({
        toName: "Admin",
        toEmail: adminEmail,
        templateId: 14, // BREVO TEMPLATE
        params: {
          userName: fullName || "Customer",
          userEmail: cleanedBookingData.email || "N/A",
          userContact: cleanedBookingData.contact || "N/A",
          carName: cleanedBookingData.carName || "Selected Car",
          carPlateNo: cleanedBookingData.plateNo || "N/A",
          startDate: startDateStr,
          startTime: startTimeStr,
          endDate: endDateStr,
          endTime: endTimeStr,
          location: cleanedBookingData.location || "Not specified",
        },
      });
      console.log("📧 Resubmission email sent to admin");

      // (WEBSITE) ADMIN IN-APP NOTIFICATION
      const adminResubmitNotification = {
        name: "System Notification",
        profilePic: "/assets/profile.png",
        email: "system@emnl.com",
        contact: "Notification",
        formattedDateTime,
        startTimestamp: serverTimestamp(),
        content: `<b>Booking Resubmitted</b><br><br>
<b>Customer:</b> ${fullName || "Customer"} <br>
<b>Car:</b> ${cleanedBookingData.carName} <br>
<b>Plate No:</b> ${cleanedBookingData.plateNo || "N/A"} <br>
<b>Start Date & Time:</b> ${startDateStr} | ${startTimeStr} <br>
<b>End Date & Time:</b> ${endDateStr} | ${endTimeStr} <br>
<b>Travel Location:</b> ${cleanedBookingData.location || "Not specified"} <br><br>
Please review the resubmitted request and continue processing.`,
        isNotification: true,
      };

      const adminInboxResubmitRef = doc(
        collection(db, "users", adminUid, "receivedMessages"),
      );
      await setDoc(adminInboxResubmitRef, adminResubmitNotification);

      console.log("💬 Admin in-app resubmission notification sent");

      return { success: true };
    } catch (error) {
      console.error("❌ Error re-submitting booking request:", error);
      return { success: false, error };
    }
  };

  // (ADMIN) CANCEL RENTAL FUNCTION
  const cancelRental = async (rentalId) => {
    try {
      const rentalRef = doc(db, "users", adminUid, "activeBookings", rentalId);
      const rentalSnap = await getDoc(rentalRef);

      if (!rentalSnap.exists()) {
        console.error("❌ Rental not found.");
        return;
      }

      const rentalData = rentalSnap.data();
      const plateNo = String(rentalData.plateNo);
      const renterUid = rentalData.createdBy;

      // Delete from admin's 'activeBookings'
      await deleteDoc(rentalRef);
      console.log("🗑️ Rental deleted from activeBookings (admin):", rentalId);

      // Delete from user's 'activeRentals'
      if (renterUid) {
        const userRentalRef = doc(
          db,
          "users",
          renterUid,
          "activeRentals",
          rentalId,
        );
        await deleteDoc(userRentalRef);
        console.log("🗑️ Rental deleted from activeRentals (user):", rentalId);
      } else {
        console.warn("⚠️ renterUid not found. Cannot delete user-side rental.");
      }

      // Unhide the unit
      const unitRef = doc(db, "units", plateNo);
      await updateDoc(unitRef, { hidden: false });

      console.log("RENTAL ID:", rentalId);

      console.log("👁️ Unit unhidden:", plateNo);
    } catch (error) {
      console.error("🔥 Error in cancelRental:", error);
    }
  };

  // (ADMIN) RESERVE RENTAL (FLAG ACTIVE BOOKING AS RESERVED)
  const reserveUnit = async (rentalId) => {
    try {
      const bookingRef = doc(
        db,
        "users",
        adminUid,
        "activeBookings",
        String(rentalId),
      );
      const bookingSnap = await getDoc(bookingRef);

      if (!bookingSnap.exists()) {
        console.warn("⚠️ Active booking not found for reserve:", rentalId);
        return;
      }

      const bookingData = bookingSnap.data() || {};
      await updateDoc(bookingRef, { reservation: true });

      const renterUid = bookingData.createdBy;
      if (renterUid && renterUid !== "admin" && renterUid !== adminUid) {
        const userRentalRef = doc(
          db,
          "users",
          renterUid,
          "activeRentals",
          String(rentalId),
        );
        const userRentalSnap = await getDoc(userRentalRef);
        if (userRentalSnap.exists()) {
          await updateDoc(userRentalRef, { reservation: true });
        }
      }

      console.log("✅ Booking reserved:", rentalId);
    } catch (error) {
      console.error("🔥 Error in reserveUnit:", error);
    }
  };

  // (ADMIN) RESERVE RENTAL
  // const reserveUnit = async (unitId) => {
  //   try {
  //     const unitRef = doc(db, "units", String(unitId));
  //     await updateDoc(unitRef, { hidden: false });
  //     console.log("✅ Unit unhidden (reserved):", unitId);
  //   } catch (error) {
  //     console.error("🔥 Error in reserveUnit:", error);
  //   }
  // };

  // (ADMIN & USER) MARK MESSAGES AS READ/UNREAD
  const markMessageAsRead = async (messageId) => {
    if (!user || !messageId) return;

    try {
      const messageRef = doc(
        db,
        "users",
        user.uid,
        "receivedMessages",
        messageId,
      );
      const messageSnap = await getDoc(messageRef);

      if (messageSnap.exists()) {
        const currentStatus = messageSnap.data().readStatus || false;
        const newStatus = !currentStatus;

        await updateDoc(messageRef, { readStatus: newStatus });

        // Update local state
        setUserMessages((prevMessages) =>
          prevMessages.map((msg) =>
            msg.id === messageId ? { ...msg, readStatus: newStatus } : msg,
          ),
        );
      } else {
        console.warn(`⚠️ Message with ID ${messageId} does not exist.`);
      }
    } catch (err) {
      console.error("🔥 Error toggling message read status:", err);
    }
  };

  // (ADMIN & USER) SEND MESSAGE BETWEEN USERS
  const sendMessage = async ({
    name,
    email,
    phone,
    message,
    recipientUid,
    senderUid,
    isAdminSender,
    recipientName,
    recipientEmail,
    recipientPhone,
    sourcePage = "chat", // <-- add
    sourceLabel = "Chat", // <-- add
  }) => {
    if (!senderUid || !recipientUid) {
      console.error("❌ Missing senderUid or recipientUid.");
      return { success: false, error: "Missing senderUid or recipientUid." };
    }

    try {
      const senderSentRef = collection(db, "users", senderUid, "sentMessages");
      const recipientInboxRef = collection(
        db,
        "users",
        recipientUid,
        "receivedMessages",
      );

      const newMessage = {
        senderUid,
        recipientUid,
        name,
        email,
        contact: phone,
        content: message,
        recipientName,
        recipientEmail,
        recipientContact: recipientPhone,
        sourcePage, // <-- add
        sourceLabel, // <-- add
        date: new Date().toLocaleDateString("en-US", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        }),
        time: new Date().toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
        }),
        startTimestamp: serverTimestamp(),
        clientCreatedAt: Date.now(),
        formattedDateTime: new Date().toLocaleString("en-US", {
          year: "numeric",
          month: "short",
          day: "numeric",
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
          timeZone: "Asia/Manila",
        }),
        profilePic: user.profilePic || null,
        readStatus: false,
      };

      await setDoc(doc(senderSentRef), newMessage);
      await setDoc(doc(recipientInboxRef), newMessage);

      return { success: true };
    } catch (err) {
      console.error("🔥 Error sending message:", err);
      return {
        success: false,
        error: err?.message || "Failed to send message.",
      };
    }
  };

  // (GUEST) BUILD STABLE SENDER UID BASED ON GUEST DETAILS OR LOCAL STORAGE
  const buildStableGuestSenderUid = ({ name, email, phone }) => {
    const normalize = (v) =>
      (v || "").toString().trim().toLowerCase().replace(/\s+/g, " ");

    const slug = (v) =>
      normalize(v)
        .replace(/[^a-z0-9]+/g, "_")
        .replace(/^_+|_+$/g, "")
        .slice(0, 32);

    const emailKey = slug(email);
    const phoneKey = slug((phone || "").replace(/[^\d+]/g, ""));
    const nameKey = slug(name);

    // Deterministic ID for same guest details (prevents new conversation per message)
    const deterministic = [emailKey, phoneKey, nameKey]
      .filter(Boolean)
      .join("_");

    if (deterministic) {
      return `guest_${deterministic}`.slice(0, 120);
    }

    // Fallback: persistent browser-level guest ID
    const storageKey = "guest_contact_sender_uid";
    const existing =
      typeof window !== "undefined" ? localStorage.getItem(storageKey) : null;
    if (existing) return existing;

    const generated = `guest_local_${Math.random().toString(36).slice(2, 12)}`;
    if (typeof window !== "undefined")
      localStorage.setItem(storageKey, generated);
    return generated;
  };

  // (GUEST) SEND CONTACT MESSAGE TO ADMIN
  const sendGuestContactMessage = async ({
    name,
    email,
    phone,
    message,
    recipientUid,
    recipientName,
    recipientEmail,
    recipientPhone,
  }) => {
    try {
      if (!recipientUid) {
        return { success: false, error: "Missing recipientUid." };
      }

      const safeName = (name || "Guest").trim() || "Guest";
      const safeEmail = (email || "No email").trim() || "No email";
      const safePhone = (phone || "No contact").trim() || "No contact";
      const safeMessage = (message || "").trim();

      if (!safeMessage) {
        return { success: false, error: "Message is required." };
      }

      const guestSenderUid = buildStableGuestSenderUid({
        name: safeName,
        email: safeEmail,
        phone: safePhone,
      });

      const guestMessage = {
        senderUid: guestSenderUid,
        recipientUid,
        name: safeName,
        email: safeEmail,
        contact: safePhone,
        content: safeMessage,
        recipientName: recipientName || "Admin",
        recipientEmail: recipientEmail || "",
        recipientContact: recipientPhone || "",
        sourcePage: "contact-guest",
        sourceLabel: "Guest Contact Page",
        isGuest: true,
        date: new Date().toLocaleDateString("en-US", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        }),
        time: new Date().toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
        }),
        startTimestamp: serverTimestamp(),
        clientCreatedAt: Date.now(),
        formattedDateTime: new Date().toLocaleString("en-US", {
          year: "numeric",
          month: "short",
          day: "numeric",
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
          timeZone: "Asia/Manila",
        }),
        profilePic: "/assets/profile.png",
        readStatus: false,
      };

      await setDoc(
        doc(collection(db, "users", recipientUid, "receivedMessages")),
        guestMessage,
      );

      return { success: true, viaInApp: true, guest: true };
    } catch (error) {
      console.error("❌ sendGuestContactMessage failed:", error);
      return { success: false, error: error.message || "Guest send failed." };
    }
  };

  // const sendGuestContactMessage = async ({
  //   name,
  //   email,
  //   phone,
  //   message,
  //   recipientUid,
  //   recipientName,
  //   recipientEmail,
  //   recipientPhone,
  // }) => {
  //   try {
  //     if (!recipientUid) {
  //       return { success: false, error: "Missing recipientUid." };
  //     }

  //     const safeName = (name || "Guest").trim() || "Guest";
  //     const safeEmail = (email || "No email").trim() || "No email";
  //     const safePhone = (phone || "No contact").trim() || "No contact";
  //     const safeMessage = (message || "").trim();

  //     if (!safeMessage) {
  //       return { success: false, error: "Message is required." };
  //     }

  //     const guestKey = `${safeEmail}_${safePhone}_${Date.now()}`
  //       .toLowerCase()
  //       .replace(/[^a-z0-9]+/g, "_")
  //       .replace(/^_+|_+$/g, "")
  //       .slice(0, 64);

  //     const guestSenderUid = `guest_${guestKey}`;

  //     const guestMessage = {
  //       senderUid: guestSenderUid,
  //       recipientUid,
  //       name: safeName,
  //       email: safeEmail,
  //       contact: safePhone,
  //       content: safeMessage,
  //       recipientName: recipientName || "Admin",
  //       recipientEmail: recipientEmail || "",
  //       recipientContact: recipientPhone || "",
  //       sourcePage: "contact-guest",
  //       sourceLabel: "Guest Contact Page",
  //       isGuest: true,
  //       date: new Date().toLocaleDateString("en-US", {
  //         weekday: "long",
  //         year: "numeric",
  //         month: "long",
  //         day: "numeric",
  //       }),
  //       time: new Date().toLocaleTimeString("en-US", {
  //         hour: "2-digit",
  //         minute: "2-digit",
  //       }),
  //       startTimestamp: serverTimestamp(),
  //       clientCreatedAt: Date.now(),
  //       formattedDateTime: new Date().toLocaleString("en-US", {
  //         year: "numeric",
  //         month: "short",
  //         day: "numeric",
  //         hour: "numeric",
  //         minute: "2-digit",
  //         hour12: true,
  //         timeZone: "Asia/Manila",
  //       }),
  //       profilePic: "/assets/profile.png",
  //       readStatus: false,
  //     };

  //     await setDoc(
  //       doc(collection(db, "users", recipientUid, "receivedMessages")),
  //       guestMessage,
  //     );

  //     return { success: true, viaInApp: true, guest: true };
  //   } catch (error) {
  //     console.error("❌ sendGuestContactMessage failed:", error);
  //     return { success: false, error: error.message || "Guest send failed." };
  //   }
  // };

  // (ADMIN & USER) REAL-TIME LISTENER FOR MESSAGES
  useEffect(() => {
    if (!user?.uid) return;

    const messagesRef = collection(db, "users", user.uid, "receivedMessages");
    const sentRef = collection(db, "users", user.uid, "sentMessages");

    // Listener for inbox
    const unsubscribeInbox = onSnapshot(messagesRef, (snapshot) => {
      const msgs = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setUserMessages(msgs);
      console.log("📨 Real-time inbox:", msgs);
    });

    // Listener for sent messages
    const unsubscribeSent = onSnapshot(sentRef, (snapshot) => {
      const msgs = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setSentMessages(msgs);
      console.log("📨 Real-time sentbox:", msgs);
    });

    // Cleanup when user logs out or component unmounts
    return () => {
      unsubscribeInbox();
      unsubscribeSent();
    };
  }, [user?.uid]);

  // (ADMIN & USER) DELETE MESSAGE
  const deleteMessage = async (messageOrMessages, type = "inbox") => {
    console.log("🔥 deleteMessage CALLED:", messageOrMessages, type, user);

    if (!user || !messageOrMessages || !["inbox", "sentbox"].includes(type)) {
      console.warn("⚠️ Invalid deleteMessage parameters:", {
        user,
        messageOrMessages,
        type,
      });
      return;
    }

    const messagesArray = Array.isArray(messageOrMessages)
      ? messageOrMessages
      : [messageOrMessages];

    try {
      const collectionName =
        type === "inbox" ? "receivedMessages" : "sentMessages";

      const deletePromises = messagesArray.map((msg) => {
        const messageId = typeof msg === "string" ? msg : msg.id;
        const messageRef = doc(
          db,
          "users",
          user.uid,
          collectionName,
          messageId,
        );
        console.log("🔍 Deleting:", messageRef.path);
        return deleteDoc(messageRef);
      });

      await Promise.all(deletePromises);

      console.log(`✅ Deleted ${messagesArray.length} message(s) from ${type}`);
    } catch (error) {
      console.error("❌ Error during bulk delete:", error);
    }
  };

  // (USER) UPDATE USER PROFILE DATA IN FIRESTORE GLOBALLY
  const updateUser = async (updatedFields) => {
    try {
      setUser((prevUser) => ({
        ...prevUser,
        ...updatedFields,
      }));

      const userDocRef = doc(db, "users", user.uid);
      await updateDoc(userDocRef, updatedFields);
    } catch (err) {
      console.error("🔥 Error updating user data:", err);
    }
  };

  // (USER) REVERT USER PROFILE DATA TO ORIGINAL VALUES
  const revertUserData = async () => {
    try {
      const userDocRef = doc(db, "users", user.uid);
      const revertData = {
        name: user.originalName,
        phone: user.originalPhone,
        profilePic: user.originalProfilePic,
        surname: user.originalSurname,
        firstName: user.originalFirstName,
        middleName: user.originalMiddleName,
        occupation: user.originalOccupation,
        address: user.originalAddress,
      };

      // Update Firestore with original values
      await updateDoc(userDocRef, revertData);

      // Update local state
      setUser((prevUser) => ({
        ...prevUser,
        name: prevUser.originalName,
        phone: prevUser.originalPhone,
        profilePic: prevUser.originalProfilePic,

        surname: prevUser.originalSurname,
        firstName: prevUser.originalFirstName,
        middleName: prevUser.originalMiddleName,
        occupation: prevUser.originalOccupation,
        address: prevUser.originalAddress,
      }));
    } catch (err) {
      console.error("🔥 Error reverting user data:", err);
    }
  };

  // (USER) DELETE USER ACCOUNT FUNCTION
  const deleteUserAccount = async () => {
    const currentUser = auth.currentUser;

    if (!currentUser) return;

    try {
      // 1. Re-authenticate
      const provider = new GoogleAuthProvider();
      await reauthenticateWithPopup(currentUser, provider);

      const userId = currentUser.uid;
      const userDocRef = doc(db, "users", userId);
      const userDocSnap = await getDoc(userDocRef);

      // 2. Delete all subcollections
      const deleteSubcollection = async (subcollectionName) => {
        const subcollectionRef = collection(
          db,
          "users",
          userId,
          subcollectionName,
        );
        const snapshot = await getDocs(subcollectionRef);

        const deletePromises = snapshot.docs.map((doc) => deleteDoc(doc.ref));
        await Promise.all(deletePromises);
        console.log(`🗑️ Deleted subcollection: ${subcollectionName}`);
      };

      await Promise.all([
        deleteSubcollection("receivedMessages"),
        deleteSubcollection("sentMessages"),
        deleteSubcollection("rentalHistory"),
      ]);

      // 3. Move user doc to 'deleted_users'
      if (userDocSnap.exists()) {
        const userData = userDocSnap.data();
        const deletedDocRef = doc(db, "deleted_users", userId);
        await setDoc(deletedDocRef, {
          ...userData,
          deletedAt: new Date(),
        });
        console.log("📁 User document moved to 'deleted_users'");
      }

      // 4. Delete original user document
      await deleteDoc(userDocRef);

      // 5. Delete user from Firebase Auth
      await deleteUser(currentUser);
      console.log("✅ User account deleted from Firebase Auth");

      setUser(null);
    } catch (error) {
      console.error("🔥 Error deleting user account:", error);
      if (error.code === "auth/requires-recent-login") {
        showActionOverlay({
          message: "Please log in again to delete your account.",
          type: "warning",
        });
      } else {
        showActionOverlay({
          message: "Failed to delete account. Please try again.",
          type: "warning",
        });
      }
    }
  };

  // (ADMIN & USER) LOGOUT FUNCTION
  const logout = async () => {
    try {
      await signOut(auth);
      setUser(null);

      // Clear Remember Me data when logging out
      clearRememberMe();
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  // (ADMIN & USER) COMPRESS AND CONVERT FILE TO BASE64
  const compressAndConvertFileToBase64 = (
    file,
    minSizeKB = 900,
    maxSizeKB = 999,
  ) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = () => {
        const img = new Image();
        img.src = reader.result;

        img.onload = () => {
          const canvas = document.createElement("canvas");
          const MAX_WIDTH = 1000;
          const scaleSize = MAX_WIDTH / img.width;
          canvas.width = MAX_WIDTH;
          canvas.height = img.height * scaleSize;

          const ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

          let quality = 0.9;
          let base64 = canvas.toDataURL("image/jpeg", quality);
          let sizeKB = base64.length / 1024;

          // Reduce quality if over max
          while (sizeKB > maxSizeKB && quality > 0.4) {
            quality -= 0.05;
            base64 = canvas.toDataURL("image/jpeg", quality);
            sizeKB = base64.length / 1024;
          }

          // Increase quality if under min (but avoid going over max)
          while (sizeKB < minSizeKB && quality < 0.95) {
            quality += 0.02;
            const newBase64 = canvas.toDataURL("image/jpeg", quality);
            const newSizeKB = newBase64.length / 1024;

            if (newSizeKB > maxSizeKB) break;

            base64 = newBase64;
            sizeKB = newSizeKB;
          }

          console.log(
            `📦 Final size: ${Math.round(
              sizeKB,
            )} KB @ quality ${quality.toFixed(2)}`,
          );
          resolve(base64);
        };

        img.onerror = reject;
      };

      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  // (ADMIN & USER) CONVERT BASE64 TO FILE FUNCTION
  function base64ToFile(base64String, filename = "license.jpg") {
    const arr = base64String.split(",");
    const mime = arr[0].match(/:(.*?);/)[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);

    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }

    return new File([u8arr], filename, { type: mime });
  }

  
  // (ADMIN) SEND BOOKING DATA TO FIRESTORE
  const saveBookingToFirestore = async (plateNo, bookingData, bookingUid) => {
    try {
      const appSettingsDoc = await getDoc(doc(db, "config", "appSettings"));
      const adminUid = appSettingsDoc.data().adminUid;

      console.log("✅ plateNo received:", plateNo, "| type:", typeof plateNo);

      let driverLicenseUrl = null;
      if (bookingData.driverLicense instanceof File) {
        driverLicenseUrl = await compressAndConvertFileToBase64(
          bookingData.driverLicense,
        );

        console.log(
          "✅ Final driverLicense size (KB):",
          Math.round(driverLicenseUrl.length / 1024),
        );
      }

      const actualSeconds = bookingData?.rentalDuration?.actualSeconds;
      const totalDurationInSeconds =
        actualSeconds ??
        (bookingData.rentalDuration?.days || 0) * 86400 +
          (bookingData.rentalDuration?.extraHours || 0) * 3600;

      // const now = new Date();
      // const readableTimestamp = `${String(now.getMonth() + 1).padStart(
      //   2,
      //   "0",
      // )}${String(now.getDate()).padStart(2, "0")}${now.getFullYear()}${String(
      //   now.getHours(),
      // ).padStart(2, "0")}${String(now.getMinutes()).padStart(2, "0")}${String(
      //   now.getSeconds(),
      // ).padStart(2, "0")}`;
      // const docId = `${plateNo}_${readableTimestamp}`;

      // const bookingRef = doc(db, "users", adminUid, "activeBookings", docId);

      // Use the provided bookingUid as docId to ensure consistency
      const docId = bookingUid;

      const bookingRef = doc(db, "users", adminUid, "activeBookings", docId);

      // const userStartTime =
      //   bookingData.startTimestamp?.toDate?.() || new Date();
      // const hasStarted = userStartTime.getTime() <= Date.now();
      // const rentalStatus = hasStarted ? "Active" : "Pending";
      // const imageId = `${plateNo}_main`;

      // await setDoc(bookingRef, {
      //   totalDurationInSeconds,
      //   ...bookingData,
      //   driverLicense: driverLicenseUrl || null,
      //   plateNo,
      //   createdBy: user?.uid || "admin",
      //   status: rentalStatus,
      //   bookingUid,
      // });

       const userStartTime =
        bookingData.startTimestamp?.toDate?.() || new Date();
      const hasStarted = userStartTime.getTime() <= Date.now();
      const rentalStatus = hasStarted ? "Active" : "Pending";
      const imageId = `${plateNo}_main`;

      const paymentEntries = Array.isArray(bookingData.paymentEntries)
        ? bookingData.paymentEntries
        : [];

      const totalPaid =
        typeof bookingData.totalPaid === "number"
          ? bookingData.totalPaid
          : paymentEntries.reduce(
              (sum, entry) => sum + Number(entry?.amount || 0),
              0,
            );

      const discountType = bookingData.discountType || "peso";
      const discountValue = Number(bookingData.discountValue || 0);
      const baseTotalPrice = Number(bookingData.totalPrice || 0);

      const discountedTotal =
        discountType === "percent"
          ? Math.max(0, baseTotalPrice - baseTotalPrice * (discountValue / 100))
          : Math.max(0, baseTotalPrice - discountValue);

      const balanceDue =
        typeof bookingData.balanceDue === "number"
          ? Math.max(0, bookingData.balanceDue)
          : Math.max(0, discountedTotal - totalPaid);

      const paid =
        typeof bookingData.paid === "boolean"
          ? bookingData.paid
          : balanceDue === 0;

      await setDoc(bookingRef, {
        totalDurationInSeconds,
        ...bookingData,
        driverLicense: driverLicenseUrl || null,
        plateNo,
        createdBy: user?.uid || "admin",
        status: rentalStatus,
        bookingUid,
        paymentEntries,
        totalPaid,
        balanceDue,
        paid,
        discountType,
        discountValue,
        imageId,
      });

      console.log(
        "🚗 bookingData.plateNo:",
        bookingData.plateNo,
        typeof bookingData.plateNo,
      );

      console.log("✅ Booking data saved to admin activeBookings.", plateNo);

      const unitRef = doc(db, "units", plateNo);
      await updateDoc(unitRef, { hidden: true });

      console.log("✅ Unit hidden status updated.");
      return docId;
    } catch (error) {
      console.error("❌ saveBookingToFirestore:", error);
    }
  };

  // (USER) SUBMIT USER BOOKING REQUEST TO FIRESTORE
  const submitUserBookingRequest = async (bookingData) => {
    try {
      if (!user || !user.uid) {
        throw new Error("User not authenticated");
      }

      const appSettingsDoc = await getDoc(doc(db, "config", "appSettings"));
      const adminUid = appSettingsDoc.data().adminUid;
      const userId = user.uid;

      const isEditing = bookingData?.isEditing;
      const bookingId = bookingData?.bookingId;

      console.log("🛠 Editing existing booking:", isEditing, bookingId);

      // If editing, delegate to updateUserBookingRequest
      if (isEditing && bookingId) {
        await updateUserBookingRequest({
          formData: bookingData,
          uploadedID: bookingData.driverLicense,
          rentalDurationInSeconds: bookingData.totalDurationInSeconds,
          bookingId,
        });
        return;
      }

      // Else, this is a new submission
      let driverLicenseUrl = null;

      if (bookingData.driverLicense instanceof File) {
        driverLicenseUrl = await compressAndConvertFileToBase64(
          bookingData.driverLicense,
        );
      } else if (typeof bookingData.driverLicense === "string") {
        driverLicenseUrl = bookingData.driverLicense;
      }

      // Generate timestamp-based doc ID
      const now = new Date();
      const timestamp = `${String(now.getMonth() + 1).padStart(2, "0")}${String(
        now.getDate(),
      ).padStart(2, "0")}${String(now.getFullYear())}${String(
        now.getHours(),
      ).padStart(2, "0")}${String(now.getMinutes()).padStart(2, "0")}${String(
        now.getSeconds(),
      ).padStart(2, "0")}`;
      const docId = `${bookingData?.plateNo}_${timestamp}`;

      const bookingPayload = {
        ...bookingData,
        driverLicense: driverLicenseUrl || null,
        createdAt: Timestamp.now(),
        createdBy: userId,
        bookingUid: docId,
      };

      const userRef = doc(db, "users", userId, "userBookingRequest", docId);
      const adminRef = doc(
        db,
        "users",
        adminUid,
        "adminBookingRequests",
        docId,
      );

      await Promise.all([
        setDoc(userRef, bookingPayload),
        setDoc(adminRef, bookingPayload),
      ]);

      console.log("✅ Booking Submitted (submitUserBookingRequest)");

      const fullName = `${bookingData.firstName || ""} ${
        bookingData.middleName || ""
      } ${bookingData.surname || ""}`.trim();

      // Format rental start date/time
      const startDateStr = formatBookingDate(bookingData.startDate);
      const startTimeStr = formatBookingTime(
        bookingData.startTime,
        bookingData.startDate,
      );
      const endDateStr = formatBookingDate(bookingData.endDate);
      const endTimeStr = formatBookingTime(
        bookingData.endTime,
        bookingData.endDate,
      );
      // const startDateStr = bookingData.startDate
      //   ? new Date(bookingData.startDate).toLocaleDateString("en-US", {
      //       year: "numeric",
      //       month: "long",
      //       day: "numeric",
      //     })
      //   : "";

      // // Combine endDate + endTime into a Date object
      // const finalEndTimestamp = new Date(
      //   `${bookingData.endDate}T${bookingData.endTime}`,
      // );

      // // Format into separate strings
      // const endDateStr = finalEndTimestamp.toLocaleDateString("en-US", {
      //   year: "numeric",
      //   month: "long",
      //   day: "numeric",
      // });

      // const endTimeStr = finalEndTimestamp.toLocaleTimeString("en-US", {
      //   hour: "numeric",
      //   minute: "2-digit",
      //   hour12: true,
      // });

      // function formatTime(value) {
      //   if (!value) return "";

      //   if (typeof value === "number") {
      //     return new Date(value).toLocaleTimeString("en-US", {
      //       hour: "numeric",
      //       minute: "2-digit",
      //       hour12: true,
      //     });
      //   }

      //   if (typeof value === "string") {
      //     const [hours, minutes] = value.split(":").map(Number);
      //     const d = new Date();
      //     d.setHours(hours, minutes);
      //     return d.toLocaleTimeString("en-US", {
      //       hour: "numeric",
      //       minute: "2-digit",
      //       hour12: true,
      //     });
      //   }

      //   return "";
      // }

      // // Rental start time
      // const startTimeStr = formatTime(bookingData.startTime);

      // EMAIL NOTIFICATIONS TEMPLATE 11
      await sendEmail({
        toName: fullName || "Customer",
        toEmail: bookingData.email,
        templateId: 11, // BREVO TEMPLATE
        params: {
          fullName: fullName || "Customer",
          carName: bookingData.carName,
          startDate: bookingData.startDate,
          startTime: bookingData.startTime,
          endDate: bookingData.endDate,
          endTime: bookingData.endTime,
          location: bookingData.location || "Not specified",
        },
      });

      await sendEmail({
        toName: "Admin",
        toEmail: adminEmail,
        templateId: 12, // BREVO TEMPLATE
        params: {
          fullName: bookingData.fullName,
          carName: bookingData.carName,
          carPlateNo: bookingData.plateNo || "N/A",
          startDate: bookingData.startDate,
          startTime: bookingData.startTime,
          endDate: bookingData.endDate,
          endTime: bookingData.endTime,
          location: bookingData.location || "Not specified",
        },
      });

      // WEBSITE NOTIFICATIONS
      const datePart = now.toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });
      const timePart = now.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });
      const formattedDateTime = `${datePart} | ${timePart}`;

      // User WEBSITE message
      const userInboxRef = doc(
        collection(db, "users", userId, "receivedMessages"),
      );
      await setDoc(userInboxRef, {
        name: "EMNL Car Rental Services",
        profilePic: "/assets/profile.png",
        email: adminEmail,
        contact: adminContact,
        formattedDateTime,
        startTimestamp: serverTimestamp(),
        content: `<b>Booking Request Submitted</b><br><br>
<b>Car:</b> ${bookingData.carName} <br>
<b>Start Date & Time:</b> ${startDateStr} | ${startTimeStr} <br>
<b>End Date & Time:</b> ${endDateStr} | ${endTimeStr} <br>
<b>Travel Location:</b> ${bookingData.location || "Not specified"} <br><br>
Your request has been received and is now queued for review. We will notify you once there is an update.`,
        isNotification: true,
      });

      // Admin WEBSITE message
      const adminInboxRef = doc(
        collection(db, "users", adminUid, "receivedMessages"),
      );
      await setDoc(adminInboxRef, {
        name: "System Notification",
        profilePic: "/assets/profile.png",
        email: "system@emnl.com",
        contact: "Notification",
        formattedDateTime,
        startTimestamp: serverTimestamp(),
        content: `<b>New Booking Request Submitted</b><br><br>
<b>Customer:</b> ${fullName || "Customer"} <br>
<b>Car:</b> ${bookingData.carName} <br>
<b>Plate No:</b> ${bookingData.plateNo || "N/A"} <br>
<b>Start Date & Time:</b> ${startDateStr} | ${startTimeStr} <br>
<b>End Date & Time:</b> ${endDateStr} | ${endTimeStr} <br>
<b>Travel Location:</b> ${bookingData.location || "Not specified"} <br><br>
Please review this request in the admin panel and proceed with approval or rejection.`,
        isNotification: true,
      });

      console.log("📩 Notifications sent (User + Admin)");
    } catch (error) {
      console.error("❌ Error submitting booking request:", error);
    }
  };

  // (USER) SAVE BOOKING FORM DATA
  const saveBookingFormData = async (formData) => {
    try {
      if (!user || !user.uid) {
        throw new Error("User not authenticated");
      }

      const userId = user.uid;

      // Convert File object to base64
      let driverLicenseBase64 = null;
      if (formData.driverLicense instanceof File) {
        driverLicenseBase64 = await compressAndConvertFileToBase64(
          formData.driverLicense,
        );
      } else if (typeof formData.driverLicense === "string") {
        driverLicenseBase64 = formData.driverLicense;
      }

      // Create Clean save data object with defaults for undefined values
      const saveData = {
        firstName: formData.firstName || "",
        middleName: formData.middleName || "",
        surname: formData.surname || "",
        occupation: formData.occupation || "",
        address: formData.address || "",
        contactNo: formData.contactNo || "",
        email: formData.email || "",
        location: formData.location || "",
        dropoffLocation: formData.dropoffLocation || "",
        purpose: formData.purpose || "",
        additionalMessage: formData.additionalMessage || "",
        referralSource: formData.referralSource || "Not Specified",
        selectedCar: formData.selectedCar || "",
        selectedCarType: formData.selectedCarType || "ALL",
        driveType: formData.driveType || "Self-Drive",
        dropOffType: formData.dropOffType || "Pickup",
        startDate: formData.startDate || "",
        startTime: formData.startTime || "",
        endDate: formData.endDate || "",
        endTime: formData.endTime || "",
        driverLicense: driverLicenseBase64, // Use the converted base64 string
        savedAt: serverTimestamp(),
        userId: userId,
      };

      // Save to user's savedBookings collection
      const saveRef = doc(db, "users", userId, "savedBookings", "currentForm");
      await setDoc(saveRef, saveData);

      console.log("✅ Booking form data saved successfully");
      return { success: true };
    } catch (error) {
      console.error("❌ Error saving booking form data:", error);
      return { success: false, error };
    }
  };

  // (USER) LOAD SAVED BOOKING FORM DATA
  const loadSavedBookingFormData = async () => {
    try {
      if (!user || !user.uid) {
        throw new Error("User not authenticated");
      }

      const userId = user.uid;
      const saveRef = doc(db, "users", userId, "savedBookings", "currentForm");
      const saveSnap = await getDoc(saveRef);

      if (saveSnap.exists()) {
        const savedData = saveSnap.data();
        console.log("✅ Saved booking form data loaded successfully");

        // If driverLicense exists and is base64, convert it back into a File
        if (
          savedData.driverLicense &&
          typeof savedData.driverLicense === "string"
        ) {
          try {
            savedData.driverLicense = base64ToFile(
              savedData.driverLicense,
              "license.jpg",
            );
            console.log("📸 Driver license converted from base64 → File");
          } catch (err) {
            console.warn(
              "⚠️ Failed to convert driver license from base64:",
              err,
            );
            savedData.driverLicense = null;
          }
        }

        return { success: true, data: savedData };
      } else {
        console.log("ℹ️ No saved booking form data found");
        return { success: true, data: null };
      }
    } catch (error) {
      console.error("❌ Error loading saved booking form data:", error);
      return { success: false, error };
    }
  };

  // (USER) CLEAR SAVED BOOKING FORM DATA
  const clearSavedBookingFormData = async () => {
    try {
      if (!user || !user.uid) {
        throw new Error("User not authenticated");
      }

      const userId = user.uid;

      // Delete the saved booking data
      const saveRef = doc(db, "users", userId, "savedBookings", "currentForm");
      await deleteDoc(saveRef);

      console.log("✅ Saved booking form data cleared successfully");
      return { success: true };
    } catch (error) {
      console.error("❌ Error clearing saved booking form data:", error);
      return { success: false, error };
    }
  };

  // (USER) UPDATE USER BOOKING REQUEST TO FIRESTORE
  const updateUserBookingRequest = async (updatedBookingData) => {
    try {
      const appSettingsDoc = await getDoc(doc(db, "config", "appSettings"));
      const adminUid = appSettingsDoc.data()?.adminUid;
      if (!adminUid) throw new Error("Admin UID not found.");

      const docId = updatedBookingData.bookingId;
      const userBookingRef = doc(
        db,
        "users",
        user.uid,
        "userBookingRequest",
        docId,
      );
      const adminBookingRef = doc(
        db,
        "users",
        adminUid,
        "adminBookingRequests",
        docId,
      );

      let driverLicenseUrl = null;

      if (updatedBookingData.uploadedID instanceof File) {
        driverLicenseUrl = await compressAndConvertFileToBase64(
          updatedBookingData.uploadedID,
        );
      } else if (typeof updatedBookingData.uploadedID === "string") {
        driverLicenseUrl = updatedBookingData.uploadedID;
      }

      const updatedData = {
        ...updatedBookingData.formData,
        driverLicense: driverLicenseUrl,
        status: "Pending",
        updatedAt: serverTimestamp(),
      };

      await Promise.all([
        setDoc(userBookingRef, updatedData, { merge: true }),
        setDoc(adminBookingRef, updatedData, { merge: true }),
      ]);

      console.log("✅ Booking Updated! (updateUserBookingRequest)");
      return { success: true };
    } catch (error) {
      console.error("❌ Error updating booking request:", error);
      return { success: false, error };
    }
  };

  const updateAdminToUserBookingRequest = async (bookingId, updatedData) => {
    try {
      const appSettingsDoc = await getDoc(doc(db, "config", "appSettings"));
      const adminUid = appSettingsDoc.data()?.adminUid;
      if (!adminUid) throw new Error("Admin UID not found.");

      // Get the original booking data to find userId and other details
      const adminBookingRef = doc(
        db,
        "users",
        adminUid,
        "adminBookingRequests",
        bookingId,
      );
      const adminSnap = await getDoc(adminBookingRef);
      if (!adminSnap.exists()) throw new Error("Booking not found.");

      const bookingData = adminSnap.data() ?? {};
      const userId = bookingData.createdBy;

      // Calculate pricing components
      const billedDays = updatedData?.billedDays ?? bookingData.billedDays ?? 0;
      const discountedRate =
        updatedData?.discountedRate ?? bookingData.discountedRate ?? 0;
      const drivingPrice =
        updatedData?.drivingPrice ?? bookingData.drivingPrice ?? 0;
      const extraHourCharge =
        updatedData?.extraHourCharge ?? bookingData.extraHourCharge ?? 0;
      const pickupPrice =
        updatedData?.pickupPrice ?? bookingData.pickupPrice ?? 0;

      // Raw total before discount
      const rawTotal =
        billedDays * discountedRate +
        billedDays * drivingPrice +
        extraHourCharge +
        pickupPrice;

      // Discount
      const discountValue = Number(
        updatedData?.discountValue ?? bookingData.discountValue ?? 0,
      );
      const discountType =
        updatedData?.discountType ?? bookingData.discountType ?? "peso";

      let discountAmount = 0;
      if (discountType === "peso") {
        discountAmount = Math.min(discountValue, rawTotal);
      } else if (discountType === "percent") {
        discountAmount = Math.min((discountValue / 100) * rawTotal, rawTotal);
      }

      const discountedTotal = Math.max(0, rawTotal - discountAmount);

      // Payments (prefer updatedData.paymentEntries if present)
      const paymentEntries =
        updatedData?.paymentEntries ?? bookingData.paymentEntries ?? [];
      const totalPaid = paymentEntries.reduce(
        (sum, entry) => sum + Number(entry.amount || 0),
        0,
      );

      const balanceDue = Math.max(0, discountedTotal - totalPaid);
      const paid = balanceDue === 0;

      // Prepare data to update
      const dataToUpdate = {
        ...bookingData,
        ...updatedData,
        paymentEntries,
        totalPaid,
        balanceDue,
        totalPrice: discountedTotal, // save final price after discount
        discountValue,
        discountType,
        paid,
        updatedAt: serverTimestamp(),
      };

      // Update both admin and user collections
      const userBookingRef = doc(
        db,
        "users",
        userId,
        "userBookingRequest",
        bookingId,
      );
      await Promise.all([
        updateDoc(adminBookingRef, dataToUpdate),
        updateDoc(userBookingRef, dataToUpdate),
      ]);

      console.log("✅ User booking request updated for both admin and user");
      return { success: true };
    } catch (error) {
      console.error("❌ Error updating user booking request:", error);
      throw error;
    }
  };

  const updateActiveBooking = async (bookingId, updatedData) => {
    try {
      const appSettingsDoc = await getDoc(doc(db, "config", "appSettings"));
      const adminUid = appSettingsDoc.data()?.adminUid;
      if (!adminUid) throw new Error("Admin UID not found.");

      // Get the booking to find userId
      const adminBookingRef = doc(
        db,
        "users",
        adminUid,
        "activeBookings",
        bookingId,
      );
      const adminSnap = await getDoc(adminBookingRef);
      if (!adminSnap.exists()) throw new Error("Booking not found.");

      const bookingData = adminSnap.data() ?? {};
      const userId = bookingData.createdBy;

      // Prefer updatedData, fallback to bookingData
      const billedDays = updatedData?.billedDays ?? bookingData.billedDays ?? 0;
      const discountedRate =
        updatedData?.discountedRate ?? bookingData.discountedRate ?? 0;
      const drivingPrice =
        updatedData?.drivingPrice ?? bookingData.drivingPrice ?? 0;
      const extraHourCharge =
        updatedData?.extraHourCharge ?? bookingData.extraHourCharge ?? 0;
      const pickupPrice =
        updatedData?.pickupPrice ?? bookingData.pickupPrice ?? 0;

      // Raw total before discount
      const rawTotal =
        billedDays * discountedRate +
        billedDays * drivingPrice +
        extraHourCharge +
        pickupPrice;

      // Discount
      const discountValue = Number(
        updatedData?.discountValue ?? bookingData.discountValue ?? 0,
      );
      const discountType =
        updatedData?.discountType ?? bookingData.discountType ?? "peso";

      let discountAmount = 0;
      if (discountType === "peso") {
        discountAmount = Math.min(discountValue, rawTotal);
      } else if (discountType === "percent") {
        discountAmount = Math.min((discountValue / 100) * rawTotal, rawTotal);
      }

      const discountedTotal = Math.max(0, rawTotal - discountAmount);

      // Payments (prefer updatedData.paymentEntries if present)
      const paymentEntries =
        updatedData?.paymentEntries ?? bookingData.paymentEntries ?? [];
      const totalPaid = paymentEntries.reduce(
        (sum, entry) => sum + Number(entry.amount || 0),
        0,
      );

      const balanceDue = Math.max(0, discountedTotal - totalPaid);

      // Set paid status
      const paid = balanceDue === 0;

      // Add recalculated values to updatedData
      const dataToUpdate = {
        ...bookingData,
        ...updatedData,
        paymentEntries,
        totalPaid,
        balanceDue,
        totalPrice: discountedTotal, // store discounted price
        discountValue,
        discountType,
        paid,
      };

      // Update admin activeBookings
      await updateDoc(adminBookingRef, dataToUpdate);

      // Skip creating/updating user activeRentals if admin created the booking
      if (userId && userId !== adminUid) {
        const userDocRef = doc(db, "users", userId);
        const userSnap = await getDoc(userDocRef);

        if (userSnap.exists()) {
          const userBookingRef = doc(
            db,
            "users",
            userId,
            "activeRentals",
            bookingId,
          );
          await updateDoc(userBookingRef, dataToUpdate).catch(async (err) => {
            if (err.code === "not-found") {
              console.warn(
                `⚠️ Skipping user booking update — booking ${bookingId} not found for user ${userId}`,
              );
            } else {
              throw err;
            }
          });
          console.log("✅ Booking updated for both admin and user");
        } else {
          console.warn(
            `⚠️ Skipping user update — user ${userId} does not exist`,
          );
        }
      } else {
        console.log(
          "⏭️ Skipping user activeRentals update (admin-created booking).",
        );
      }
    } catch (error) {
      console.error("❌ Error updating booking:", error);
      throw error;
    }
  };

  const updateBalanceDueBooking = async (bookingId, updatedData) => {
    try {
      const appSettingsDoc = await getDoc(doc(db, "config", "appSettings"));
      const adminUid = appSettingsDoc.data()?.adminUid;
      if (!adminUid) throw new Error("Admin UID not found.");

      const completedBookingRef = doc(
        db,
        "users",
        adminUid,
        "completedBookings",
        bookingId,
      );
      const bookingSnap = await getDoc(completedBookingRef);
      if (!bookingSnap.exists()) throw new Error("Booking not found.");

      const bookingData = bookingSnap.data() ?? {};

      // Prefer values from updatedData; fall back to bookingData; final fallback safe default
      const billedDays = updatedData?.billedDays ?? bookingData.billedDays ?? 0;
      const discountedRate =
        updatedData?.discountedRate ?? bookingData.discountedRate ?? 0;
      const drivingPrice =
        updatedData?.drivingPrice ?? bookingData.drivingPrice ?? 0;
      const extraHourCharge =
        updatedData?.extraHourCharge ?? bookingData.extraHourCharge ?? 0;
      const pickupPrice =
        updatedData?.pickupPrice ?? bookingData.pickupPrice ?? 0;

      // Raw total before discount
      const rawTotal =
        billedDays * discountedRate +
        billedDays * drivingPrice +
        extraHourCharge +
        pickupPrice;

      // Discount
      const discountValue = Number(
        updatedData?.discountValue ?? bookingData.discountValue ?? 0,
      );
      const discountType =
        updatedData?.discountType ?? bookingData.discountType ?? "peso";

      let discountAmount = 0;
      if (discountType === "peso") {
        discountAmount = Math.min(discountValue, rawTotal);
      } else if (discountType === "percent") {
        discountAmount = Math.min((discountValue / 100) * rawTotal, rawTotal);
      }

      const discountedTotal = Math.max(0, rawTotal - discountAmount);

      // Payments (prefer updatedData.paymentEntries if present)
      const paymentEntries =
        updatedData?.paymentEntries ?? bookingData.paymentEntries ?? [];
      const totalPaid = paymentEntries.reduce(
        (sum, entry) => sum + Number(entry.amount || 0),
        0,
      );

      const balanceDue = Math.max(0, discountedTotal - totalPaid);

      const dataToUpdate = {
        ...bookingData,
        ...updatedData,
        paymentEntries,
        totalPaid,
        balanceDue,
        totalPrice: discountedTotal, // save final price after discount
        discountValue,
        discountType,
      };

      await updateDoc(completedBookingRef, dataToUpdate);

      console.log("✅ Balance due booking updated successfully");
    } catch (error) {
      console.error("❌ Error updating balance due booking:", error);
      throw error;
    }
  };

  // (ADMIN) MARK BOOKING PAID
  const markBookingAsPaid = async (bookingId) => {
    try {
      const appSettingsDoc = await getDoc(doc(db, "config", "appSettings"));
      const adminUid = appSettingsDoc.data()?.adminUid;
      if (!adminUid) throw new Error("Admin UID not found.");

      const completedBookingRef = doc(
        db,
        "users",
        adminUid,
        "completedBookings",
        bookingId,
      );
      const bookingSnap = await getDoc(completedBookingRef);
      if (!bookingSnap.exists()) throw new Error("Booking not found.");

      await updateDoc(completedBookingRef, {
        paid: true,
      });

      console.log("✅ Booking marked as PAID");
    } catch (error) {
      console.error("❌ Error marking booking as paid:", error);
      throw error;
    }
  };

  // (USER) CANCEL USER BOOKING REQUEST
  const cancelUserBookingRequest = async (docId) => {
    try {
      if (!user || !user.uid) {
        throw new Error("User not authenticated");
      }

      const userId = user.uid;
      const appSettingsDoc = await getDoc(doc(db, "config", "appSettings"));
      const adminUid = appSettingsDoc.data().adminUid;

      // References
      const userBookingRef = doc(
        db,
        "users",
        userId,
        "userBookingRequest",
        docId,
      );
      const adminBookingRef = doc(
        db,
        "users",
        adminUid,
        "adminBookingRequests",
        docId,
      );

      // Delete from both user and admin collections
      await Promise.all([
        deleteDoc(userBookingRef),
        deleteDoc(adminBookingRef),
      ]);

      console.log("✅ User booking request cancelled.");
    } catch (error) {
      console.error("❌ Failed to cancel booking:", error);
    }
  };

  // (USER) FETCH USER BOOKING REQUESTS
  const fetchUserBookingRequests = () => {
    if (!user?.uid) return;

    const userBookingRef = collection(
      db,
      "users",
      user.uid,
      "userBookingRequest",
    );

    const unsubscribe = onSnapshot(userBookingRef, (snapshot) => {
      const requests = snapshot.docs.map((doc) => {
        const data = doc.data();

        // Convert driverLicense base64 string to File object
        let convertedLicense = data.driverLicense;
        if (
          typeof data.driverLicense === "string" &&
          data.driverLicense.startsWith("data:image")
        ) {
          convertedLicense = base64ToFile(
            data.driverLicense,
            "driver-license.jpg",
          );
        }

        const fullName = `${data.surname || ""}, ${data.firstName || ""} ${
          data.middleName || ""
        }`.trim();

        return {
          id: doc.id,
          ...data,
          driverLicense: convertedLicense,
          renterName: fullName,
        };
      });

      setUserBookingRequests(requests);
    });

    return unsubscribe;
  };

  // (USER) FETCH USER ACTIVE RENTALS
  const fetchUserActiveRentals = () => {
    if (!user?.uid) return;

    const activeRentalsRef = collection(db, "users", user.uid, "activeRentals");

    const unsubscribe = onSnapshot(activeRentalsRef, (snapshot) => {
      const rentals = snapshot.docs.map((doc) => {
        const data = doc.data();

        // Convert base64 license
        let convertedLicense = data.driverLicense;
        if (
          typeof data.driverLicense === "string" &&
          data.driverLicense.startsWith("data:image")
        ) {
          convertedLicense = base64ToFile(
            data.driverLicense,
            "driver-license.jpg",
          );
        }

        const fullName = `${data.surname || ""}, ${data.firstName || ""} ${
          data.middleName || ""
        }`.trim();

        return {
          id: doc.id,
          ...data,
          driverLicense: convertedLicense,
          renterName: fullName,
        };
      });

      setUserActiveRentals(rentals);
    });

    return unsubscribe;
  };

  // (USER) FETCH USER ACTIVE RENTALS // 1. Listener for USER ACTIVE RENTALS
  useEffect(() => {
    if (!user?.uid) return;

    const activeRentalsRef = collection(db, "users", user.uid, "activeRentals");

    const unsubscribe = onSnapshot(activeRentalsRef, (snapshot) => {
      const rentals = snapshot.docs.map((doc) => {
        const data = doc.data();

        // Convert base64 license
        let convertedLicense = data.driverLicense;
        if (
          typeof data.driverLicense === "string" &&
          data.driverLicense.startsWith("data:image")
        ) {
          convertedLicense = base64ToFile(
            data.driverLicense,
            "driver-license.jpg",
          );
        }

        const fullName = `${data.surname || ""}, ${data.firstName || ""} ${
          data.middleName || ""
        }`.trim();

        return {
          id: doc.id,
          ...data,
          driverLicense: convertedLicense,
          renterName: fullName,
        };
      });

      setUserActiveRentals(rentals);
      console.log("✅ userActiveRentals UPDATED:", rentals);
    });

    return () => unsubscribe();
  }, [user?.uid]);

  // (USER) FETCH USER ACTIVE RENTALS // 2. INTERVAL: Auto-update user pending rentals to active
  useEffect(() => {
    if (!user?.uid || userActiveRentals.length === 0) return;

    const intervalId = setInterval(() => {
      const now = new Date();

      userActiveRentals.forEach(async (rental) => {
        if (
          rental.status === "Pending" &&
          now >= rental.startTimestamp?.toDate?.()
        ) {
          try {
            await updateDoc(
              doc(db, "users", user.uid, "activeRentals", rental.id),
              { status: "Active" },
            );
            console.log(`✅ Auto-updated user rental ${rental.id} to Active`);
          } catch (err) {
            console.error(`❌ Failed to update user rental ${rental.id}:`, err);
          }
        }
      });
    }, 5000);

    return () => clearInterval(intervalId);
  }, [user?.uid, userActiveRentals]);

  // (ADMIN) FETCH ADMIN BOOKING REQUESTS (REAL-TIME LISTENER)
  const fetchAdminBookingRequests = () => {
    if (!user?.uid || user.role !== "admin") return;

    const adminRequestsRef = collection(
      db,
      "users",
      user.uid,
      "adminBookingRequests",
    );

    const unsubscribe = onSnapshot(adminRequestsRef, (snapshot) => {
      const requests = snapshot.docs.map((doc) => {
        const data = doc.data();

        const fullName = `${data.surname || ""}, ${data.firstName || ""} ${
          data.middleName || ""
        }`.trim();

        return {
          id: doc.id,
          ...data,
          renterName: fullName,
        };
      });

      setAdminBookingRequests(requests);
      console.log("✅ adminBookingRequests UPDATED:", requests);
    });

    return unsubscribe;
  };

  // (ADMIN) FETCH ADMIN BOOKING REQUESTS // REAL-TIME LISTENER HOOK
  useEffect(() => {
    if (!user?.uid || user.role !== "admin") return;

    const unsubscribe = fetchAdminBookingRequests();

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [user?.uid, user?.role]);

  // (ADMIN) MOVE USER BOOKING TO ACTIVE RENTALS
  const moveUserBookingToActiveRentals = async (booking) => {
    if (!booking || booking.status !== "Active" || !user?.uid) return;

    setIsActivatingBooking(true);

    try {
      const adminDocRef = doc(db, "config", "appSettings");
      const adminDocSnap = await getDoc(adminDocRef);
      if (!adminDocSnap.exists()) throw new Error("Admin UID not found");

      const adminUid = adminDocSnap.data().adminUid;
      const userId = booking.createdBy;

      const originalBookingId = booking.bookingUid;
      const newBookingId = booking.bookingUid;

      const userActiveRef = doc(
        db,
        "users",
        userId,
        "activeRentals",
        newBookingId,
      );
      const adminActiveRef = doc(
        db,
        "users",
        adminUid,
        "activeBookings",
        newBookingId,
      );

      const userPendingRef = doc(
        db,
        "users",
        userId,
        "userBookingRequest",
        originalBookingId,
      );
      const adminPendingRef = doc(
        db,
        "users",
        adminUid,
        "adminBookingRequests",
        originalBookingId,
      );

      let driverLicenseBase64 = null;

      if (booking.driverLicense instanceof File) {
        driverLicenseBase64 = await compressAndConvertFileToBase64(
          booking.driverLicense,
        );
      } else if (typeof booking.driverLicense === "string") {
        driverLicenseBase64 = booking.driverLicense;
      } else {
        console.warn(
          "⚠️ booking.driverLicense is missing or not a valid type:",
          booking.driverLicense,
        );
      }

      // const now = new Date();
      // const bookingPayload = {
      //   ...booking,
      //   driverLicense: driverLicenseBase64,
      //   movedToActiveAt: Timestamp.fromDate(now),
      //   status: "Pending",
      // };
      const now = new Date();

      const paymentEntries = Array.isArray(booking.paymentEntries)
        ? booking.paymentEntries
        : [];

      const totalPaid =
        typeof booking.totalPaid === "number"
          ? booking.totalPaid
          : paymentEntries.reduce(
              (sum, entry) => sum + Number(entry?.amount || 0),
              0,
            );

      const discountType = booking.discountType || "peso";
      const discountValue = Number(booking.discountValue || 0);
      const baseTotalPrice = Number(booking.totalPrice || 0);

      const discountedTotal =
        discountType === "percent"
          ? Math.max(0, baseTotalPrice - baseTotalPrice * (discountValue / 100))
          : Math.max(0, baseTotalPrice - discountValue);

      const balanceDue =
        typeof booking.balanceDue === "number"
          ? Math.max(0, booking.balanceDue)
          : Math.max(0, discountedTotal - totalPaid);

      const paid =
        typeof booking.paid === "boolean" ? booking.paid : balanceDue === 0;

      const bookingPayload = {
        ...booking,
        driverLicense: driverLicenseBase64,
        movedToActiveAt: Timestamp.fromDate(now),
        status: "Pending",
        paymentEntries,
        totalPaid,
        balanceDue,
        paid,
        discountType,
        discountValue,
        assignedDriver: booking.assignedDriver || "",
      };

      await Promise.all([
        setDoc(userActiveRef, bookingPayload),
        setDoc(adminActiveRef, bookingPayload),
        deleteDoc(userPendingRef),
        deleteDoc(adminPendingRef),
      ]);

      console.log("✅ Booking moved to activeRentals and admin activeBookings");

      // SETUP FULLNAME
      const fullName = `${booking.firstName || ""} ${
        booking.middleName || ""
      } ${booking.surname || ""}`.trim();

      // Format dates
      const startDateStr = formatBookingDate(bookingPayload.startDate);
      const endDateStr = formatBookingDate(bookingPayload.endDate);
      const startTimeStr = formatBookingTime(
        bookingPayload.startTime,
        bookingPayload.startDate,
      );
      const endTimeStr = formatBookingTime(
        bookingPayload.endTime,
        bookingPayload.endDate,
      );
      // const startDateStr = bookingPayload.startDate
      //   ? new Date(bookingPayload.startDate).toLocaleDateString("en-US", {
      //       year: "numeric",
      //       month: "long",
      //       day: "numeric",
      //     })
      //   : "";

      // const endDateStr = bookingPayload.endDate
      //   ? new Date(bookingPayload.endDate).toLocaleDateString("en-US", {
      //       year: "numeric",
      //       month: "long",
      //       day: "numeric",
      //     })
      //   : "";

      // // Helper to format both numeric timestamps and "HH:mm" strings
      // function formatTime(value) {
      //   if (!value) return "";

      //   if (typeof value === "number") {
      //     return new Date(value).toLocaleTimeString("en-US", {
      //       hour: "numeric",
      //       minute: "2-digit",
      //       hour12: true,
      //     });
      //   }

      //   if (typeof value === "string") {
      //     const [hours, minutes] = value.split(":").map(Number);
      //     const d = new Date();
      //     d.setHours(hours, minutes);
      //     return d.toLocaleTimeString("en-US", {
      //       hour: "numeric",
      //       minute: "2-digit",
      //       hour12: true,
      //     });
      //   }

      //   return "";
      // }

      // // Format time
      // const startTimeStr = formatTime(bookingPayload.startTime);
      // const endTimeStr = formatTime(bookingPayload.endTime);

      await sendEmail({
        toName: fullName || "Customer",
        toEmail: bookingPayload.email,
        templateId: 1,
        params: {
          fullName: fullName || "Customer",
          carName: bookingPayload.carName,
          startDate: startDateStr,
          startTime: startTimeStr,
          endDate: endDateStr,
          endTime: endTimeStr,
          location: bookingPayload.location || "",
        },
      });

      // Send WEBSITE Message
      const datePart = now.toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });
      const timePart = now.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });
      const formattedDateTime = `${datePart} | ${timePart}`;

      const inAppMessage = {
        name: "EMNL Car Rental Services",
        profilePic: "/assets/profile.png",
        email: adminEmail,
        contact: adminContact,
        formattedDateTime,
        startTimestamp: serverTimestamp(),
        content: `Hi ${fullName || "Customer"}, <br><br>
Your booking for <b>${bookingPayload.carName}</b> has been <b>Approved ✅</b>.<br><br>
<b>Car:</b> ${bookingPayload.carName} <br>
<b>Start Date & Time:</b> ${startDateStr} | ${startTimeStr} <br>
<b>End Date & Time:</b> ${endDateStr} | ${endTimeStr} <br>
<b>Travel Location:</b> ${bookingPayload.location || "Not specified"} <br><br>
Your rental is now confirmed. If you need assistance or schedule adjustments, please contact us anytime.`,
        isNotification: true,
      };

      const userInboxRef = doc(
        collection(db, "users", userId, "receivedMessages"),
      );
      await setDoc(userInboxRef, inAppMessage);

      console.log("💬 Friendly in-app message sent to user");

      // Send Email to Admin
      await sendEmail({
        toName: "Admin",
        toEmail: adminEmail,
        templateId: 10, // BREVO TEMPLATE
        params: {
          fullName: fullName || "Customer",
          carName: bookingPayload.carName,
          carPlateNo: bookingPayload.plateNo,
          startDate: startDateStr,
          startTime: startTimeStr,
          endDate: endDateStr,
          endTime: endTimeStr,
          location: bookingPayload.location || "Not specified",
        },
      });

      // Send WEBSITE Message to Admin
      const adminInAppMessage = {
        name: "System Notification",
        profilePic: "/assets/profile.png",
        email: "system@emnl.com",
        contact: "Notification",
        formattedDateTime,
        startTimestamp: serverTimestamp(),
        content: `<b>Booking Approved</b><br><br>
<b>Customer:</b> ${fullName || "Customer"} <br>
<b>Car:</b> ${bookingPayload.carName} <br>
<b>Plate No:</b> ${bookingPayload.plateNo || "N/A"} <br>
<b>Start Date & Time:</b> ${startDateStr} | ${startTimeStr} <br>
<b>End Date & Time:</b> ${endDateStr} | ${endTimeStr} <br>
<b>Travel Location:</b> ${bookingPayload.location || "Not specified"} <br><br>
Please continue operational follow-ups and payment tracking for this rental.`,
        isNotification: true,
      };

      const adminInboxRef = doc(
        collection(db, "users", adminUid, "receivedMessages"),
      );
      await setDoc(adminInboxRef, adminInAppMessage);

      console.log("📩 Admin notified via email and in-app message");
    } catch (error) {
      console.error("❌ Failed to move booking:", error);
    } finally {
      setIsActivatingBooking(false);
    }
  };

  // (ADMIN) UPDATE UNIT DATA
  const updateUnitData = async (unitId, updatedData) => {
    try {
      if (!adminUid) {
        throw new Error("Admin UID not found");
      }

      updatedData.id = unitId;
      updatedData.imageId = `${unitId}_main`;

      const unitRef = doc(db, "units", unitId);
      await setDoc(
        unitRef,
        {
          ...updatedData,
          updatedAt: serverTimestamp(),
          updatedBy: adminUid,
        },
        { merge: true },
      ); // Use setDoc with merge to create or update

      console.log("✅ Unit data updated successfully:", unitId);
      return { success: true };
    } catch (error) {
      console.error("❌ Error updating unit data:", error);
      return { success: false, error };
    }
  };

  // (ADMIN) LISTEN TO BOOKINGS CHANGES FOR ANALYTICS & CALENDAR
  useEffect(() => {
    if (!adminUid) return;

    const statusColorMap = {
      Completed: "#28a74650",
      Pending: "#ffc107",
      Active: "#28a745",
    };

    const completedRef = collection(db, "users", adminUid, "completedBookings");
    const activeRef = collection(db, "users", adminUid, "activeBookings");

    // Keep track of processed document IDs
    const processedCompleted = new Set();
    const processedActive = new Set();

    // LISTEN TO COMPLETED BOOKINGS (incremental only)
    const unsubscribeCompleted = onSnapshot(completedRef, (snapshot) => {
      const changes = snapshot.docChanges();

      changes.forEach((change) => {
        if (change.type === "added") {
          const data = change.doc.data();
          if (data.status !== "Completed") return;

          const docId = change.doc.id;
          if (processedCompleted.has(docId)) return; // Skip duplicates
          processedCompleted.add(docId);

          // Process ONLY the new document
          const plateNo = data.plateNo || "UNKNOWN_UNIT";
          const carType = data.carType || "UNKNOWN";
          const carName = data.carName || plateNo;
          const totalRevenue = Number(data.totalPaid) || 0;
          const durationSec = Number(data.totalDurationInSeconds) || 0;

          if (!data.endTimestamp?.seconds && (!data.endDate || !data.endTime))
            return;

          let rentalEnd;
          if (data.endTimestamp?.seconds) {
            rentalEnd = new Date(data.endTimestamp.seconds * 1000);
          } else if (data.endDate && data.endTime) {
            const [year, month, day] = data.endDate.split("-");
            const [hour, minute] = data.endTime.split(":");
            rentalEnd = new Date(
              Number(year),
              Number(month) - 1,
              Number(day),
              Number(hour),
              Number(minute),
            );
          } else {
            return;
          }

          // // Update analyticsMap with new data
          // setCompletedBookingsAnalytics((prevMap) => {
          //   const newMap = { ...prevMap };
          //   if (!newMap[plateNo]) {
          //     newMap[plateNo] = {
          //       carName,
          //       carType,
          //       unitImage: data.unitImage || "",
          //     };
          //   }

          //   const dayKey = rentalEnd.toISOString().slice(0, 10);
          //   const monthKey = rentalEnd.toISOString().slice(0, 7);
          //   const yearKey = rentalEnd.getFullYear().toString();
          //   const keys = [dayKey, monthKey, yearKey];

          //   keys.forEach((key) => {
          //     if (!newMap[plateNo][key]) {
          //       newMap[plateNo][key] = {
          //         revenue: 0,
          //         hours: 0,
          //         timesRented: 0,
          //         bookings: [],
          //       };
          //     }
          //     newMap[plateNo][key].revenue += totalRevenue;
          //     newMap[plateNo][key].hours += durationSec / 3600;
          //     newMap[plateNo][key].timesRented += 1;
          //     newMap[plateNo][key].bookings.push({ id: docId, ...data });
          //   });

          //   return newMap;
          // });

          // Update analyticsMap with new data
          setCompletedBookingsAnalytics((prevMap) => {
            const newMap = { ...prevMap };
            if (!newMap[plateNo]) {
              newMap[plateNo] = {
                carName,
                carType,
                unitImage: data.unitImage || "",
              };
            }

            const dayKey = rentalEnd.toISOString().slice(0, 10);
            const monthKey = rentalEnd.toISOString().slice(0, 7);
            const yearKey = rentalEnd.getFullYear().toString();
            const keys = [dayKey, monthKey, yearKey];

            keys.forEach((key) => {
              if (!newMap[plateNo][key]) {
                newMap[plateNo][key] = {
                  revenue: 0,
                  hours: 0,
                  timesRented: 0,
                  bookings: [],
                };
              }
              newMap[plateNo][key].revenue += totalRevenue;
              newMap[plateNo][key].hours += durationSec / 3600;
              newMap[plateNo][key].timesRented += 1;
              newMap[plateNo][key].bookings.push({ id: docId, ...data });
            });

            // ✅ Rebuild flat bookings array for this plateNo
            const allBookings = [];
            for (const key in newMap[plateNo]) {
              if (["carType", "unitImage", "carName", "bookings"].includes(key))
                continue;
              if (Array.isArray(newMap[plateNo][key]?.bookings)) {
                allBookings.push(...newMap[plateNo][key].bookings);
              }
            }

            // Deduplicate by id
            const uniqueMap = new Map();
            allBookings.forEach((booking) => {
              const key =
                booking.id ||
                `${booking.startTimestamp?.seconds}-${booking.endTimestamp?.seconds}`;
              uniqueMap.set(key, booking);
            });

            newMap[plateNo].bookings = Array.from(uniqueMap.values());

            return newMap;
          });

          // Add to calendar
          if (data.startTimestamp?.seconds) {
            const start = new Date(data.startTimestamp.seconds * 1000);
            setCalendarEventsSafe((prev) => [
              ...prev,
              {
                title: `Completed: ${carName}`,
                start: start.toISOString(),
                end: rentalEnd.toISOString(),
                fullData: data,
                backgroundColor: statusColorMap["Completed"],
                borderColor: "#00000020",
                textColor: "#fff",
                source: "completed",
              },
            ]);
          }
        }
      });
    });

    // LISTEN TO ACTIVE BOOKINGS (incremental only)
    const unsubscribeActive = onSnapshot(activeRef, (snapshot) => {
      const changes = snapshot.docChanges();

      changes.forEach((change) => {
        if (change.type === "added" || change.type === "modified") {
          const data = change.doc.data();
          if (!data.startTimestamp?.seconds || !data.endDate || !data.endTime)
            return;

          const docId = change.doc.id;
          const start = new Date(data.startTimestamp.seconds * 1000);
          const [year, month, day] = data.endDate.split("-");
          const [hour, minute] = data.endTime.split(":");
          const end = data.endTimestamp?.seconds
            ? new Date(data.endTimestamp.seconds * 1000)
            : new Date(
                Number(year),
                Number(month) - 1,
                Number(day),
                Number(hour),
                Number(minute),
              );

          const carName = data.carName || "Unknown Car";
          const status =
            data.status?.charAt(0).toUpperCase() +
              data.status?.slice(1).toLowerCase() || "Unknown";

          setCalendarEventsSafe((prev) => {
            const filtered = prev.filter((e) => e.fullData?.id !== docId);
            return [
              ...filtered,
              {
                title: `${status}: ${carName}`,
                start: start.toISOString(),
                end: end.toISOString(),
                fullData: data,
                backgroundColor: statusColorMap[status] || "#6c757d",
                borderColor: "#00000020",
                textColor: "#fff",
                source: status.toLowerCase(),
              },
            ];
          });
        }

        if (change.type === "removed") {
          const docId = change.doc.id;
          setCalendarEventsSafe((prev) =>
            prev.filter((e) => e.fullData?.id !== docId),
          );
        }
      });
    });

    return () => {
      unsubscribeCompleted();
      unsubscribeActive();
    };
  }, [adminUid]);

  // useEffect(() => {
  //   if (!adminUid) return;

  //   const statusColorMap = {
  //     Completed: "#28a74650",
  //     Pending: "#ffc107",
  //     Active: "#28a745",
  //   };

  //   const completedRef = collection(db, "users", adminUid, "completedBookings");
  //   const activeRef = collection(db, "users", adminUid, "activeBookings");

  //   // LISTEN TO COMPLETED BOOKINGS
  //   const unsubscribeCompleted = onSnapshot(completedRef, (snapshot) => {
  //     const analyticsMap = {};
  //     const calendarEventsArray = [];

  //     snapshot.forEach((doc) => {
  //       const data = doc.data();
  //       if (data.status !== "Completed") return;

  //       const plateNo = data.plateNo || "UNKNOWN_UNIT";
  //       const carType = data.carType || "UNKNOWN";
  //       const carName = data.carName || plateNo;
  //       const unitImage = data.unitImage || "";
  //       const totalRevenue = Number(data.totalPaid) || 0;
  //       const durationSec = Number(data.totalDurationInSeconds) || 0;

  //       if (!data.endTimestamp?.seconds && (!data.endDate || !data.endTime))
  //         return;

  //       let rentalEnd;

  //       if (data.endTimestamp?.seconds) {
  //         rentalEnd = new Date(data.endTimestamp.seconds * 1000);
  //       } else if (data.endDate && data.endTime) {
  //         const [year, month, day] = data.endDate.split("-");
  //         const [hour, minute] = data.endTime.split(":");
  //         rentalEnd = new Date(
  //           Number(year),
  //           Number(month) - 1,
  //           Number(day),
  //           Number(hour),
  //           Number(minute),
  //         );
  //       } else {
  //         return;
  //       }

  //       const dayKey = rentalEnd.toISOString().slice(0, 10);
  //       const monthKey = rentalEnd.toISOString().slice(0, 7);
  //       const yearKey = rentalEnd.getFullYear().toString();
  //       const keys = [dayKey, monthKey, yearKey];

  //       // Determine rentalStart (so overlap checks can use both start & end)
  //       let rentalStart;
  //       if (data.startTimestamp?.seconds) {
  //         rentalStart = new Date(data.startTimestamp.seconds * 1000);
  //       } else if (data.startDate && data.startTime) {
  //         const [sy, sm, sd] = data.startDate.split("-");
  //         const [sh, smn] = data.startTime.split(":");
  //         rentalStart = new Date(
  //           Number(sy),
  //           Number(sm) - 1,
  //           Number(sd),
  //           Number(sh),
  //           Number(smn),
  //         );
  //       } else {
  //         // fallback: set rentalStart to rentalEnd (treat as single-day booking)
  //         rentalStart = new Date(rentalEnd);
  //         rentalStart.setHours(0, 0, 0, 0);
  //       }

  //       // Compute "yesterday" key
  //       const now = new Date();
  //       const yesterday = new Date(now);
  //       yesterday.setDate(now.getDate() - 1);
  //       const yesterdayKey = yesterday.toISOString().slice(0, 10);

  //       // Compute this week's full range (Sunday -> Saturday)
  //       const currentDay = now.getDay(); // Sunday = 0
  //       const weekStart = new Date(now);
  //       weekStart.setDate(now.getDate() - currentDay);
  //       weekStart.setHours(0, 0, 0, 0);

  //       const weekEnd = new Date(weekStart);
  //       weekEnd.setDate(weekStart.getDate() + 6);
  //       weekEnd.setHours(23, 59, 59, 999);

  //       // Booking overlaps this week if any part is within the range
  //       const overlapsThisWeek =
  //         rentalStart <= weekEnd && rentalEnd >= weekStart;
  //       const isYesterday = dayKey === yesterdayKey;

  //       // Add keys when appropriate
  //       if (overlapsThisWeek) keys.push("thisWeek");
  //       if (isYesterday) keys.push("yesterday");

  //       if (!analyticsMap[plateNo]) {
  //         analyticsMap[plateNo] = { carName, carType, unitImage };
  //       }

  //       keys.forEach((key) => {
  //         if (!analyticsMap[plateNo][key]) {
  //           analyticsMap[plateNo][key] = {
  //             revenue: 0,
  //             hours: 0,
  //             timesRented: 0,
  //             bookings: [],
  //           };
  //         }

  //         analyticsMap[plateNo][key].revenue += totalRevenue;
  //         analyticsMap[plateNo][key].hours += durationSec / 3600;
  //         analyticsMap[plateNo][key].timesRented += 1;
  //         analyticsMap[plateNo][key].bookings.push(data);
  //       });

  //       if (data.startTimestamp?.seconds) {
  //         const start = new Date(data.startTimestamp.seconds * 1000);
  //         calendarEventsArray.push({
  //           title: `Completed: ${carName}`,
  //           start: start.toISOString(),
  //           end: rentalEnd.toISOString(),
  //           fullData: data,
  //           backgroundColor: statusColorMap["Completed"],
  //           borderColor: "#00000020",
  //           textColor: "#fff",
  //           source: "completed",
  //         });
  //       }
  //     });

  //     // Deduplicate analytics bookings
  //     for (const plateNo in analyticsMap) {
  //       const carData = analyticsMap[plateNo];
  //       const allBookings = [];

  //       for (const key in carData) {
  //         if (["carType", "unitImage", "carName"].includes(key)) continue;
  //         if (Array.isArray(carData[key]?.bookings)) {
  //           allBookings.push(...carData[key].bookings);
  //         }
  //       }

  //       const uniqueMap = new Map();
  //       allBookings.forEach((booking) => {
  //         const key = `${booking.startTimestamp?.seconds}-${booking.endTimestamp?.seconds}-${booking.firstName}-${booking.surname}`;
  //         uniqueMap.set(key, booking);
  //       });

  //       analyticsMap[plateNo].bookings = Array.from(uniqueMap.values());
  //     }

  //     setCompletedBookingsAnalytics(analyticsMap);

  //     setCalendarEventsSafe((prevEvents) => {
  //       const others = prevEvents.filter((e) => e.source !== "completed");
  //       const existingKeys = new Set(
  //         others.map(
  //           (e) => `${e.fullData?.id || e.fullData?.bookingId}-${e.start}`,
  //         ),
  //       );

  //       const uniqueCompleted = calendarEventsArray.filter((e) => {
  //         const key = `${e.fullData?.id || e.fullData?.bookingId}-${e.start}`;
  //         return !existingKeys.has(key);
  //       });

  //       return [...others, ...uniqueCompleted];
  //     });
  //   });

  //   // LISTEN TO ACTIVE BOOKINGS
  //   const unsubscribeActive = onSnapshot(activeRef, (snapshot) => {
  //     const activeEvents = [];

  //     snapshot.forEach((doc) => {
  //       const data = doc.data();
  //       if (!data.startTimestamp?.seconds || !data.endDate || !data.endTime)
  //         return;

  //       const start = new Date(data.startTimestamp.seconds * 1000);
  //       const [year, month, day] = data.endDate.split("-");
  //       const [hour, minute] = data.endTime.split(":");
  //       const end = data.endTimestamp?.seconds
  //         ? new Date(data.endTimestamp.seconds * 1000)
  //         : new Date(
  //             Number(year),
  //             Number(month) - 1,
  //             Number(day),
  //             Number(hour),
  //             Number(minute),
  //           );

  //       const carName = data.carName || "Unknown Car";
  //       const status =
  //         data.status?.charAt(0).toUpperCase() +
  //           data.status?.slice(1).toLowerCase() || "Unknown";

  //       activeEvents.push({
  //         title: `${status}: ${carName}`,
  //         start: start.toISOString(),
  //         end: end.toISOString(),
  //         fullData: data,
  //         backgroundColor: statusColorMap[status] || "#6c757d",
  //         borderColor: "#00000020",
  //         textColor: "#fff",
  //         source: status.toLowerCase(),
  //       });
  //     });

  //     setCalendarEventsSafe((prevEvents) => {
  //       const others = prevEvents.filter(
  //         (e) => e.source !== "active" && e.source !== "pending",
  //       );
  //       const existingKeys = new Set(
  //         others.map(
  //           (e) => `${e.fullData?.id || e.fullData?.bookingId}-${e.start}`,
  //         ),
  //       );

  //       const uniqueActive = activeEvents.filter((e) => {
  //         const key = `${e.fullData?.id || e.fullData?.bookingId}-${e.start}`;
  //         return !existingKeys.has(key);
  //       });

  //       return [...others, ...uniqueActive];
  //     });
  //   });

  //   return () => {
  //     unsubscribeCompleted();
  //     unsubscribeActive();
  //   };
  // }, [adminUid]);

  // (ADMIN) GENERATE VACANCY FUNCTION
  const generatePerDayCalendarEvents = (booking) => {
    const events = [];

    const { carName, startTimestamp, totalPrice, totalDurationInSeconds } =
      booking;

    const dailyDisplayPrice = 1000;
    const status = booking.status || "Active";

    const start = new Date(startTimestamp.seconds * 1000);

    let end;
    if (booking.endTimestamp?.seconds) {
      end = new Date(booking.endTimestamp.seconds * 1000);
    } else if (booking.endDate && booking.endTime) {
      const [y, m, d] = booking.endDate.split("-");
      const [hh, mm] = booking.endTime.split(":");
      end = new Date(
        Number(y),
        Number(m) - 1,
        Number(d),
        Number(hh),
        Number(mm),
      );
    } else {
      return []; // skip if no valid end
    }

    // Strip time and keep only the date for loop comparison
    const startDateOnly = new Date(start);
    startDateOnly.setHours(0, 0, 0, 0);

    const endDateOnly = new Date(end);
    endDateOnly.setHours(0, 0, 0, 0);

    const oneDay = 1000 * 60 * 60 * 24;
    const totalDays = Math.round((endDateOnly - startDateOnly) / oneDay);

    for (let i = 0; i <= totalDays; i++) {
      const currentDate = new Date(startDateOnly.getTime() + i * oneDay);
      const isoDate = currentDate.toLocaleDateString("en-CA", {
        timeZone: "Asia/Manila",
      });

      const isLastDay = i === totalDays;

      const displayText = isLastDay
        ? `Vacant | ${end.toLocaleTimeString("en-PH", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
          })}`
        : `₱${dailyDisplayPrice.toLocaleString("en-PH")}${
            i === 0
              ? ` | ${start.toLocaleTimeString("en-PH", {
                  hour: "2-digit",
                  minute: "2-digit",
                  hour12: true,
                })}`
              : ""
          }`;

      events.push({
        title: displayText,
        start: isoDate,
        end: isoDate,
        backgroundColor: isLastDay ? "#ccc" : "#77f194",
        textColor: "#000",
        borderColor: "#00000020",
        fullData: booking,
      });
    }

    return events;
  };

  // (PUBLIC) FETCH FLEET DETAILS UNITS
  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, "units"),
      (snapshot) => {
        const unitsArray = snapshot.docs.map((doc) => ({
          id: doc.id, // This is the plateNo (e.g., "GAD 1075")
          ...doc.data(), // Includes plateNo and etc.
        }));

        setFleetDetailsUnits(unitsArray);
        console.log("🔥 FLEET DETAILS UNITS LOADED (filtered):", unitsArray);
      },
      (error) => {
        console.error("❌ Error fetching fleetDetailsUnits:", error);
      },
    );

    return () => unsubscribe();
  }, []);

  // REALTIME FINANCIALREPORTS SERVER COUNTER
  useEffect(() => {
    if (!user || user.role !== "admin") return;

    const ref = collection(db, "users", user.uid, "financialReports");

    let isInitial = true; // Flag to skip the first snapshot

    const unsub = onSnapshot(ref, (snapshot) => {
      if (isInitial) {
        isInitial = false;
        return; // Skip initial load
      }
      setServerChangeCounter((prev) => prev + 1);
    });

    return () => unsub();
  }, [user]);

  // Helper: Flatten grid for Firestore (no nested arrays)
  const convertGridForFirestore = (grid) => {
    const converted = {};
    Object.entries(grid).forEach(([monthIndex, rows]) => {
      converted[monthIndex] = rows.map((row) => ({
        col0: row[0] || "",
        col1: row[1] || "",
        col2: row[2] || "",
        col3: row[3] || "",
        col4: row[4] || "",
        _isAutoFill: row._isAutoFill || false,
        _bookingId: row._bookingId || null,
        _entryIndex: row._entryIndex ?? null,
      }));
    });
    return converted;
  };

  // Helper: Unflatten grid from Firestore back to arrays for UI
  const convertGridFromFirestore = (grid) => {
    const converted = {};
    Object.entries(grid).forEach(([monthIndex, rows]) => {
      converted[monthIndex] = rows.map((rowObj) => {
        const row = [
          rowObj.col0 || "",
          rowObj.col1 || "",
          rowObj.col2 || "",
          rowObj.col3 || "",
          rowObj.col4 || "",
        ];
        // Attach metadata as non-array properties
        row._isAutoFill = rowObj._isAutoFill || false;
        row._bookingId = rowObj._bookingId || null;
        row._entryIndex = rowObj._entryIndex ?? null;
        return row;
      });
    });
    return converted;
  };

  // // Save grid data
  // const saveFinancialReport = async (type, gridData) => {
  //   try {
  //     if (!user || user.role !== "admin") return;

  //     const reportRef = doc(db, `users/${user.uid}/financialReports/${type}`);
  //     const dataToSave = convertGridForFirestore(gridData); // flatten
  //     await setDoc(
  //       reportRef,
  //       { gridData: dataToSave, updatedAt: serverTimestamp() },
  //       { merge: true },
  //     );
  //     console.log(`✅ Saved ${type} financial report to Firestore`);
  //   } catch (error) {
  //     console.error("❌ Error saving financial report:", error);
  //   }
  // };

  // // Load grid data
  // const loadFinancialReport = async (type) => {
  //   try {
  //     if (!user || user.role !== "admin")
  //       return { gridData: {}, updatedAt: null };

  //     const reportRef = doc(db, `users/${user.uid}/financialReports/${type}`);
  //     const snap = await getDoc(reportRef);

  //     if (snap.exists()) {
  //       console.log(`📦 Loaded ${type} financial report from Firestore`);
  //       const data = snap.data();
  //       const rawGrid = data.gridData || {};
  //       return {
  //         gridData: convertGridFromFirestore(rawGrid),
  //         updatedAt: data.updatedAt || null,
  //       };
  //     } else {
  //       console.log(`⚠️ No ${type} financial report found`);
  //       return { gridData: {}, updatedAt: null };
  //     }
  //   } catch (error) {
  //     console.error("❌ Error loading financial reports:", error);
  //     return { gridData: {}, updatedAt: null };
  //   }
  // };

  // Use: users/{adminUid}/financialReports/{type}/{year}/gridData
  // Example: users/xxx/financialReports/revenue/2026/gridData

  const saveFinancialReport = async (type, gridData, year) => {
    console.log("saveFinancialReport called:", { type, year, adminUid });

    if (!adminUid || !type || !db) {
      console.warn("Early return - missing params");
      return;
    }

    const reportYear = `${year || new Date().getFullYear()}`;

    try {
      console.log("Creating docRef...");
      const docPath = `users/${adminUid}/financialReports/${type}/${reportYear}/gridData`;
      console.log("Doc path:", docPath);

      const docRef = doc(db, docPath);
      console.log("docRef created:", docRef);

      // Convert object format to Firestore-compatible format
      const firestoreData = {};

      Object.keys(gridData).forEach((monthKey) => {
        const monthRows = gridData[monthKey];
        firestoreData[monthKey] = {};

        Object.keys(monthRows).forEach((rowKey) => {
          const row = monthRows[rowKey];
          firestoreData[monthKey][rowKey] = Array.isArray(row) ? row : [];
        });
      });

      await setDoc(docRef, {
        gridData: firestoreData,
        updatedAt: serverTimestamp(),
      });
      console.log("✅ Saved successfully");
    } catch (err) {
      console.error("ERROR in saveFinancialReport:", err);
      console.error("Error name:", err.name);
      console.error("Error message:", err.message);
    }
  };

  const loadFinancialReport = async (type, year) => {
    console.log("LOAD FINANCIAL REPORT INPUTS:", { type, year, adminUid });

    if (!adminUid || !type || !db) {
      return { gridData: {} };
    }

    const reportYear = `${year || new Date().getFullYear()}`;

    console.log("About to create docRef with:", {
      segment1: "users",
      segment2: adminUid,
      segment3: "financialReports",
      segment4: type,
      segment5: reportYear,
      segment6: "gridData",
    });

    try {
      const docRef = doc(
        db,
        "users",
        adminUid,
        "financialReports",
        type,
        reportYear,
        "gridData",
      );
      console.log("docRef created successfully:", docRef);
      const docSnap = await getDoc(docRef);
      console.log("getDoc completed, exists:", docSnap.exists());

      if (docSnap.exists()) {
        const firestoreData = docSnap.data().gridData || {};

        // Convert object format back to UI format
        const gridData = {};

        Object.keys(firestoreData).forEach((monthKey) => {
          const monthData = firestoreData[monthKey];
          gridData[monthKey] = {};

          Object.keys(monthData).forEach((rowKey) => {
            gridData[monthKey][rowKey] = monthData[rowKey];
          });
        });

        console.log("✅ Loaded gridData:", gridData);
        return { gridData, updatedAt: docSnap.data().updatedAt };
      }

      // Return blank grid
      console.log("No existing data, returning blank grid");
      const blankGrid = {};
      for (let i = 0; i < 12; i++) {
        blankGrid[i] = {
          Row_0: ["", "", "", "", ""],
          Row_1: ["", "", "", "", ""],
          Row_2: ["", "", "", "", ""],
          Row_3: ["", "", "", "", ""],
          Row_4: ["", "", "", "", ""],
        };
      }
      return { gridData: blankGrid };
    } catch (err) {
      console.error("ERROR in loadFinancialReport:", err);
      console.error("Error name:", err.name);
      console.error("Error message:", err.message);
      console.error("Error code:", err.code);

      // Return blank grid on error
      const blankGrid = {};
      for (let i = 0; i < 12; i++) {
        blankGrid[i] = {
          Row_0: ["", "", "", "", ""],
          Row_1: ["", "", "", "", ""],
          Row_2: ["", "", "", "", ""],
          Row_3: ["", "", "", "", ""],
          Row_4: ["", "", "", "", ""],
        };
      }
      return { gridData: blankGrid };
    }
  };

  // Function to upload image to images collection
  const uploadImageToFirestore = async (
    imageId,
    base64,
    quality = "unknown",
  ) => {
    if (!user || user.role !== "admin") {
      return { success: false, error: "Unauthorized" };
    }

    try {
      // Calculate Base64 decoded size
      const base64Length = base64.length - base64.indexOf(",") - 1;
      const sizeInBytes = Math.floor((base64Length * 3) / 4);
      const sizeInKB = Math.round(sizeInBytes / 1024);

      const imageRef = doc(db, "images", imageId);
      await setDoc(imageRef, {
        base64,
        uploadedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      // Keep client cache in sync immediately after admin upload
      const localData = {
        base64,
        updatedAt: Date.now(), // local version stamp for cache
      };

      setImageCache((prev) => ({
        ...prev,
        [imageId]: localData,
      }));

      await setCachedImage(imageId, localData);

      // notify consumers (Carousel/FleetDetails) in this session
      setImageUpdateTrigger((prev) => prev + 1);

      console.log(
        `✅ Image uploaded: ${imageId} | Final size: ${sizeInKB} KB @ quality ${quality}`,
      );

      return { success: true, sizeInKB };
    } catch (error) {
      console.error("❌ Failed to upload image:", error);
      return { success: false, error: error.message };
    }
  };

  const deleteImageFromFirestore = async (imageId) => {
    try {
      const docRef = doc(db, "images", imageId);
      await deleteDoc(docRef);
      return { success: true };
    } catch (error) {
      console.error("Error deleting image:", error);
      return { success: false, error: error.message };
    }
  };

  const deleteUnit = async (plateNo) => {
    if (!user || user.role !== "admin") {
      return { success: false, error: "Unauthorized" };
    }

    try {
      const unitRef = doc(db, "units", plateNo);
      const unitSnap = await getDoc(unitRef);

      if (!unitSnap.exists()) {
        return { success: false, error: "Unit not found" };
      }

      const unitData = unitSnap.data();

      // Delete main image
      if (unitData.imageId) {
        await deleteImageFromFirestore(unitData.imageId);
      }

      // Delete gallery images
      if (Array.isArray(unitData.galleryIds)) {
        for (const id of unitData.galleryIds) {
          if (id) {
            await deleteImageFromFirestore(id);
          }
        }
      }

      // Delete the unit document
      await deleteDoc(unitRef);

      console.log("✅ Unit deleted:", plateNo);
      return { success: true };
    } catch (error) {
      console.error("❌ deleteUnit failed:", error);
      return { success: false, error: error.message };
    }
  };

  // const fetchImageFromFirestore = async (imageId) => {
  //   // Check cache first
  //   if (imageCache[imageId]) {
  //     console.log(`✅ Image ${imageId} loaded from cache`);
  //     return imageCache[imageId];
  //   }

  //   try {
  //     const docRef = doc(db, "images", imageId);
  //     const docSnap = await getDoc(docRef);

  //     if (docSnap.exists()) {
  //       const data = docSnap.data();
  //       const base64 = data.base64;
  //       const updatedAt = data.updatedAt;

  //       // Cache the result
  //       setImageCache((prev) => ({
  //         ...prev,
  //         [imageId]: { base64, updatedAt },
  //       }));

  //       return { base64, updatedAt };
  //     } else {
  //       console.warn(`No image found for ID: ${imageId}`);
  //       return null;
  //     }
  //   } catch (error) {
  //     console.error(`Error fetching image ${imageId}:`, error);
  //     return null;
  //   }
  // };

  // Clear cache for a specific image (call this when image is updated)
  const clearImageCache = async (imageId) => {
    // Clear from React state
    setImageCache((prev) => {
      const updated = { ...prev };
      delete updated[imageId];
      return updated;
    });

    // Clear from IndexedDB
    try {
      const db = await getImageDB();
      return new Promise((resolve) => {
        const transaction = db.transaction("images", "readwrite");
        const store = transaction.objectStore("images");
        store.delete(imageId);
        transaction.oncomplete = () => resolve();
      });
    } catch (e) {
      console.warn(`Error clearing cache for ${imageId}:`, e);
    }
  };

  // Update cache with new image data (call this when image is updated)
  const updateImageCache = async (imageId, data) => {
    // Update React state
    setImageCache((prev) => ({
      ...prev,
      [imageId]: data,
    }));

    // Update IndexedDB
    try {
      const db = await getImageDB();
      return new Promise((resolve) => {
        const transaction = db.transaction("images", "readwrite");
        const store = transaction.objectStore("images");
        store.put({ id: imageId, data });
        transaction.oncomplete = () => resolve();
      });
    } catch (e) {
      console.warn(`Error updating cache for ${imageId}:`, e);
    }
  };

  // Single DB connection reference
  const imageDBRef = useRef(null);

  const getImageDB = async () => {
    if (imageDBRef.current) return imageDBRef.current;
    return new Promise((resolve, reject) => {
      const request = indexedDB.open("ImageCacheDB", 1);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        imageDBRef.current = request.result;
        resolve(request.result);
      };
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains("images")) {
          db.createObjectStore("images", { keyPath: "id" });
        }
      };
    });
  };

  const getMultipleCachedImages = async (imageIds) => {
    try {
      const db = await getImageDB();
      return new Promise((resolve) => {
        const transaction = db.transaction("images", "readonly");
        const store = transaction.objectStore("images");
        const results = {};
        imageIds.forEach((id) => {
          const request = store.get(id);
          request.onsuccess = () => {
            if (request.result?.data) results[id] = request.result.data;
          };
        });
        transaction.oncomplete = () => resolve(results);
      });
    } catch (e) {
      return {};
    }
  };

  const getCachedImage = async (imageId) => {
    try {
      const db = await getImageDB();
      return new Promise((resolve) => {
        const transaction = db.transaction("images", "readonly");
        const store = transaction.objectStore("images");
        const request = store.get(imageId);
        request.onsuccess = () => resolve(request.result?.data || null);
      });
    } catch (e) {
      return null;
    }
  };

  const setCachedImage = async (imageId, data) => {
    try {
      const db = await getImageDB();
      return new Promise((resolve) => {
        const transaction = db.transaction("images", "readwrite");
        const store = transaction.objectStore("images");
        store.put({ id: imageId, data });
        transaction.oncomplete = () => resolve();
      });
    } catch (e) {}
  };

  useEffect(() => {
    let cancelled = false;

    const preloadImages = async () => {
      const imageIds = [];

      for (let i = 0; i < 20; i++) imageIds.push(`FleetPage_${i}`);
      for (let i = 0; i < 5; i++) imageIds.push(`LandingPage_${i}`);

      const cachedImages = await getMultipleCachedImages(imageIds);
      if (cancelled) return;

      // Defer heavy base64 state injection so route transitions stay snappy.
      setTimeout(() => {
        if (cancelled) return;
        setImageCache((prev) => ({ ...prev, ...cachedImages }));
      }, 0);
    };

    if (typeof window !== "undefined" && "requestIdleCallback" in window) {
      const id = window.requestIdleCallback(preloadImages, { timeout: 1200 });
      return () => {
        cancelled = true;
        window.cancelIdleCallback(id);
      };
    }

    preloadImages();
    return () => {
      cancelled = true;
    };
  }, []);

  //   // Pre-load all images on app startup
  // useEffect(() => {
  //   const preloadImages = async () => {
  //     const imageIds = [];

  //     // FleetPage carousel images
  //     for (let i = 0; i < 20; i++) imageIds.push(`FleetPage_${i}`);

  //     // LandingPage carousel images
  //     for (let i = 0; i < 5; i++) imageIds.push(`LandingPage_${i}`);

  //     const cachedImages = await getMultipleCachedImages(imageIds);
  //     setImageCache((prev) => ({ ...prev, ...cachedImages }));
  //     console.log(`🚀 Pre-loaded ${Object.keys(cachedImages).length} images from IndexedDB`);
  //   };
  //   preloadImages();
  // }, []);

  const fetchImageFromFirestore = async (imageId, skipValidation = false) => {
    // Check React state cache first
    if (imageCache[imageId]) {
      // console.log(`✅ Image ${imageId} loaded from React cache`);
      return imageCache[imageId];
    }

    // Check IndexedDB cache
    try {
      const cachedData = await getCachedImage(imageId);

      if (cachedData) {
        // If skipValidation is true, use cache without checking Firestore
        if (skipValidation) {
          setImageCache((prev) => ({
            ...prev,
            [imageId]: cachedData,
          }));
          console.log(
            `✅ Image ${imageId} loaded from IndexedDB cache (no validation)`,
          );
          return cachedData;
        }

        // Otherwise, validate with Firestore
        const docRef = doc(db, "images", imageId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const serverUpdatedAt = docSnap.data().updatedAt;

          if (serverUpdatedAt === cachedData.updatedAt) {
            setImageCache((prev) => ({
              ...prev,
              [imageId]: cachedData,
            }));
            console.log(
              `✅ Image ${imageId} loaded from IndexedDB cache (validated)`,
            );
            return cachedData;
          }

          // Timestamps don't match - fetch new version
          console.log(`🔄 Image ${imageId} outdated, fetching new version...`);
          const base64 = docSnap.data().base64;
          const result = { base64, updatedAt: serverUpdatedAt };

          setImageCache((prev) => ({ ...prev, [imageId]: result }));
          await setCachedImage(imageId, result);
          return result;
        }
      }
    } catch (e) {
      console.warn(`Error checking cache for ${imageId}:`, e);
    }

    // No cache - fetch from Firestore
    try {
      const docRef = doc(db, "images", imageId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        const result = { base64: data.base64, updatedAt: data.updatedAt };

        setImageCache((prev) => ({ ...prev, [imageId]: result }));
        await setCachedImage(imageId, result);
        return result;
      } else {
        console.warn(`No image found for ID: ${imageId}`);
        return null;
      }
    } catch (error) {
      console.error(`Error fetching image ${imageId}:`, error);
      return null;
    }
  };

  // UpdateUnitImage Function
  const updateUnitImage = async (
    plateNo,
    imageType = "main",
    file,
    galleryIndex = null,
  ) => {
    if (!user || user.role !== "admin") {
      return { success: false, error: "Unauthorized" };
    }
    try {
      // Compress the image
      const { base64, sizeInKB } = await compressAndConvertToBase64(file);
      console.log(`Final size: ${sizeInKB} KB`);

      // Firestore-safe ceiling (leave headroom for metadata)
      if (sizeInKB > 1000) {
        throw new Error(`Image too large for Firestore (${sizeInKB} KB)`);
      }

      // Generate unique image ID
      const imageId =
        imageType === "main"
          ? `${plateNo}_main`
          : `${plateNo}_gallery_${galleryIndex}`;

      // Upload to images collection
      const uploadResult = await uploadImageToFirestore(imageId, base64);
      if (!uploadResult.success) {
        throw new Error(uploadResult.error);
      }

      // Update unit document with image ID reference
      const unitRef = doc(db, "units", plateNo);
      if (imageType === "main") {
        await updateDoc(unitRef, { imageId });
        setImageUpdateTrigger((prev) => prev + 1);
      } else if (imageType === "gallery" && galleryIndex !== null) {
        const unit = unitData.find((u) => u.plateNo === plateNo);
        const updatedGalleryIds = Array.isArray(unit?.galleryIds)
          ? [...unit.galleryIds]
          : [];

        // Ensure array is dense
        if (galleryIndex >= updatedGalleryIds.length) {
          updatedGalleryIds.push(imageId);
        } else {
          updatedGalleryIds[galleryIndex] = imageId;
        }

        await updateDoc(unitRef, {
          galleryIds: updatedGalleryIds.filter(Boolean), // extra safety
        });

        setImageUpdateTrigger((prev) => prev + 1);
      }

      return { success: true, base64, imageId };
    } catch (error) {
      console.error("❌ updateUnitImage failed:", error);
      return { success: false, error: error.message };
    }
  };

  const updateUnitGalleryImages = async (
    plateNo,
    editedGalleryImages,
    editedGalleryImageFiles,
    originalGalleryImages,
    originalGalleryIds,
  ) => {
    if (!user || user.role !== "admin") {
      return { success: false, error: "Unauthorized" };
    }

    try {
      const newGalleryIds = [];
      const finalGalleryImages = [...editedGalleryImages];

      for (let i = 0; i < editedGalleryImages.length; i++) {
        if (editedGalleryImageFiles[i]) {
          // Upload and get new ID
          const uploadResult = await updateUnitImage(
            plateNo,
            "gallery",
            editedGalleryImageFiles[i],
            i,
          );
          if (uploadResult.success) {
            newGalleryIds.push(uploadResult.imageId);
            finalGalleryImages[i] = {
              base64: uploadResult.base64,
              updatedAt: Date.now(),
            }; // Object
          } else {
            return {
              success: false,
              error: `Failed to upload gallery image ${i}: ${uploadResult.error}`,
            };
          }
        } else {
          // Reuse original ID
          const originalIndex = originalGalleryImages.indexOf(
            editedGalleryImages[i],
          );
          if (originalIndex !== -1 && originalGalleryIds[originalIndex]) {
            newGalleryIds.push(originalGalleryIds[originalIndex]);
          }
        }
      }

      // Delete removed images
      const newGalleryIdsSet = new Set(newGalleryIds);
      for (const oldId of originalGalleryIds) {
        if (oldId && !newGalleryIdsSet.has(oldId)) {
          await deleteImageFromFirestore(oldId);
        }
      }

      // Update unit with new gallery IDs
      const unitRef = doc(db, "units", plateNo);
      await updateDoc(unitRef, { galleryIds: newGalleryIds });
      setImageUpdateTrigger((prev) => prev + 1);

      return { success: true, newGalleryImages: finalGalleryImages };
    } catch (error) {
      console.error("❌ updateUnitGalleryImages failed:", error);
      return { success: false, error: error.message };
    }
  };

  const FIRESTORE_LIMIT_BYTES = 1048487;

  const compressAndConvertToBase64 = async (file) => {
    return new Promise((resolve, reject) => {
      const img = new Image();

      img.onload = () => {
        const MAX_WIDTH = 2873;
        const scale = Math.min(1, MAX_WIDTH / img.naturalWidth);

        const canvas = document.createElement("canvas");
        canvas.width = Math.round(img.naturalWidth * scale);
        canvas.height = Math.round(img.naturalHeight * scale);

        const ctx = canvas.getContext("2d");
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        let best = null;

        for (let q = 1.0; q >= 0.7; q -= 0.01) {
          const base64 = canvas.toDataURL("image/jpeg", q);

          const base64Bytes = new TextEncoder().encode(base64).length;

          if (base64Bytes <= FIRESTORE_LIMIT_BYTES) {
            if (!best || base64Bytes > best.base64Bytes) {
              best = {
                base64,
                quality: q,
                base64Bytes,
                decodedKB: Math.round(
                  ((base64.length - base64.indexOf(",") - 1) * 3) / 4 / 1024,
                ),
              };
            }
          }
        }

        if (!best) {
          reject(
            new Error(
              "Image cannot fit into Firestore when Base64-encoded. Use Firebase Storage.",
            ),
          );
          return;
        }

        console.log(
          `Final image: ${best.decodedKB} KB decoded, ` +
            `${Math.round(best.base64Bytes / 1024)} KB Base64 @ quality ${best.quality.toFixed(2)} ` +
            `(${canvas.width}x${canvas.height})`,
        );

        resolve({
          base64: best.base64,
          sizeInKB: best.decodedKB,
          quality: best.quality,
        });
      };

      img.onerror = reject;
      img.src = URL.createObjectURL(file);
    });
  };

  // FUNCTION TO CREATE A NEW REVIEW WITH AUTO-INCREMENTED ID
  const createReview = async (reviewData) => {
    try {
      const reviewsRef = collection(db, "reviews");
      const snapshot = await getDocs(reviewsRef);
      let maxIndex = -1;
      snapshot.forEach((doc) => {
        const id = doc.id;
        if (id.startsWith("review_")) {
          const index = parseInt(id.split("_")[1]);
          if (index > maxIndex) maxIndex = index;
        }
      });
      const newIndex = maxIndex + 1;
      const docId = `review_${newIndex}`;
      await setDoc(doc(db, "reviews", docId), reviewData);
      console.log("Review created:", docId);
      return { success: true, id: docId };
    } catch (error) {
      console.error("Error creating review:", error);
      return { success: false, error };
    }
  };

  // FUNCTION TO UPDATE A REVIEW BY DOCUMENT ID
  const updateReview = async (docId, reviewData) => {
    try {
      await updateDoc(doc(db, "reviews", docId), reviewData);
      console.log("Review updated:", docId);
      return { success: true };
    } catch (error) {
      console.error("Error updating review:", error);
      return { success: false, error };
    }
  };

  // FUNCTION TO DELETE A REVIEW BY DOCUMENT ID
  const deleteReview = async (docId) => {
    try {
      await deleteDoc(doc(db, "reviews", docId));
      console.log("Review deleted:", docId);
      return { success: true };
    } catch (error) {
      console.error("Error deleting review:", error);
      return { success: false, error };
    }
  };

  // FUNCTION TO FETCH ALL REVIEWS SORTED BY INDEX
  const fetchReviews = async () => {
    try {
      const reviewsRef = collection(db, "reviews");
      const snapshot = await getDocs(reviewsRef);
      const reviews = [];
      snapshot.forEach((doc) => {
        reviews.push({ id: doc.id, ...doc.data() });
      });
      // Sort by index
      // reviews.sort((a, b) => {
      //   const aIndex = parseInt(a.id.split("_")[1]);
      //   const bIndex = parseInt(b.id.split("_")[1]);
      //   return aIndex - bIndex;
      // });

      const validReviews = reviews.filter((r) => r?.id);
      validReviews.sort((a, b) => {
        const aIndex = parseInt(a.id.split("_")[1]);
        const bIndex = parseInt(b.id.split("_")[1]);
        return aIndex - bIndex;
      });

      return { success: true, reviews };
    } catch (error) {
      console.error("Error fetching reviews:", error);
      return { success: false, error };
    }
  };

  // UPDATE ADMIN PROFILE PICTURE
  const updateAdminProfilePic = async (adminId, file) => {
    try {
      const compressedBase64 = await compressAndConvertFileToBase64(file);
      const adminDocRef = doc(db, "users", adminId);

      await updateDoc(adminDocRef, {
        profilePic: compressedBase64,
        updatedAt: serverTimestamp(),
      });

      console.log("✅ Admin profile picture updated in Firestore");
      return { success: true, profilePic: compressedBase64 };
    } catch (error) {
      console.error("❌ Error updating admin profile picture:", error);
      return { success: false, error: error.message };
    }
  };

  // RESET ADMIN PROFILE PICTURE TO ORIGINAL
  const resetAdminProfilePic = async (adminId) => {
    try {
      const adminDocRef = doc(db, "users", adminId);
      const adminSnap = await getDoc(adminDocRef);
      if (adminSnap.exists()) {
        const data = adminSnap.data();
        const originalPic = data.originalProfilePic || "/assets/profile.png";
        await updateDoc(adminDocRef, {
          profilePic: originalPic,
          updatedAt: serverTimestamp(),
        });
        console.log("✅ Admin profile picture reset to original");
      }
    } catch (error) {
      console.error("❌ Error resetting admin profile picture:", error);
      throw error;
    }
  };

  // FUNCTION TO COPY A COLLECTION RECURSIVELY
  const WRITE_THROTTLE_MS = 120;
  const READ_THROTTLE_MS = 20;

  const sleepMs = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  const throttledGetDocs = async (...args) => {
    const snap = await getDocs(...args);
    if (READ_THROTTLE_MS > 0) await sleepMs(READ_THROTTLE_MS);
    return snap;
  };

  const throttledSetDoc = async (...args) => {
    await setDoc(...args);
    if (WRITE_THROTTLE_MS > 0) await sleepMs(WRITE_THROTTLE_MS);
  };

  const throttledDeleteDoc = async (...args) => {
    await deleteDoc(...args);
    if (WRITE_THROTTLE_MS > 0) await sleepMs(WRITE_THROTTLE_MS);
  };
  const copyCollectionRecursive = async (
    sourceColl,
    targetColl,
    subCollNames = [],
    onProgress,
  ) => {
    try {
      const snapshot = await throttledGetDocs(sourceColl);
      for (const docSnap of snapshot.docs) {
        const data = docSnap.data();
        await throttledSetDoc(doc(targetColl, docSnap.id), data);
        if (onProgress) onProgress();

        // Recursively copy known subcollections
        for (const subName of subCollNames) {
          const sourceSub = collection(sourceColl, docSnap.id, subName);
          const targetSub = collection(targetColl, docSnap.id, subName);
          await copyCollectionRecursive(
            sourceSub,
            targetSub,
            subCollNames,
            onProgress,
          );
        }
      }
    } catch (error) {
      console.error("Error copying collection:", error);
    }
  };

  // FUNCTION TO CREATE BACKUP
  const createBackup = async (selectedCollections = null) => {
    if (!user || user.role !== "admin") {
      console.error("Unauthorized: Only admins can create backups");
      return;
    }

    setIsBackingUp(true);
    setBackupProgress(0);
    setIsBackupMinimized(false);

    const adminUid = user.uid;

    const now = new Date();

    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: "Asia/Manila",
      month: "2-digit",
      day: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    })
      .formatToParts(now)
      .reduce((acc, part) => {
        acc[part.type] = part.value;
        return acc;
      }, {});

    const allCollections = [
      "config",
      "images",
      "reviews",
      "terms",
      "units",
      "users",
    ];

    const adminAvailableSubcollections = [
      "completedBookings",
      "financialReports",
      "activeBookings",
      "adminBookingRequests",
      "sentMessages",
      "receivedMessages",
    ];

    const userAvailableSubcollections = [
      "rentalHistory",
      "activeRentals",
      "userBookingRequest",
      "sentMessages",
      "receivedMessages",
    ];

    const defaultUsersOptions = {
      scope: "all",
      specificUserIds: [],
      subcollectionsByRole: {
        admin: adminAvailableSubcollections,
        user: userAvailableSubcollections,
      },
    };

    let rootCollections = allCollections;
    let usersOptions = defaultUsersOptions;

    if (Array.isArray(selectedCollections)) {
      rootCollections = allCollections.filter((key) =>
        selectedCollections.includes(key),
      );
    } else if (selectedCollections && typeof selectedCollections === "object") {
      const hasCollectionsKey = Object.prototype.hasOwnProperty.call(
        selectedCollections,
        "collections",
      );

      if (hasCollectionsKey) {
        const selectedRoot = selectedCollections.collections;
        if (Array.isArray(selectedRoot)) {
          rootCollections = allCollections.filter((key) =>
            selectedRoot.includes(key),
          );
        } else if (selectedRoot && typeof selectedRoot === "object") {
          rootCollections = allCollections.filter((key) => selectedRoot[key]);
        }
      } else {
        rootCollections = allCollections.filter(
          (key) => selectedCollections[key],
        );
      }

      if (
        selectedCollections.users &&
        typeof selectedCollections.users === "object"
      ) {
        const usersConfig = selectedCollections.users;
        const scopeRaw = String(usersConfig.scope || "all").toLowerCase();
        const normalizedScope =
          scopeRaw === "admin" || scopeRaw === "user" || scopeRaw === "specific"
            ? scopeRaw
            : "all";

        const specificUserIds = Array.isArray(usersConfig.specificUserIds)
          ? [
              ...new Set(
                usersConfig.specificUserIds
                  .filter(Boolean)
                  .map((id) => String(id)),
              ),
            ]
          : [];

        const adminSubsRaw = usersConfig.subcollectionsByRole?.admin;
        const userSubsRaw = usersConfig.subcollectionsByRole?.user;

        const adminSubs = Array.isArray(adminSubsRaw)
          ? adminAvailableSubcollections.filter((name) =>
              adminSubsRaw.includes(name),
            )
          : adminAvailableSubcollections;

        const userSubs = Array.isArray(userSubsRaw)
          ? userAvailableSubcollections.filter((name) =>
              userSubsRaw.includes(name),
            )
          : userAvailableSubcollections;

        usersOptions = {
          scope: normalizedScope,
          specificUserIds,
          subcollectionsByRole: {
            admin: adminSubs,
            user: userSubs,
          },
        };
      }
    }

    if (rootCollections.length === 0) {
      rootCollections = allCollections;
    }

    const selectedLabel = `[${rootCollections.join(", ")}]`;
    const backupId = `Backup_${selectedLabel}_${parts.month}${parts.day}${parts.year}${parts.hour}${parts.minute}${parts.second}_${now.getMilliseconds()}_PHT`;

    const normalizeUserRole = (roleValue) =>
      String(roleValue || "").toLowerCase() === "admin" ? "admin" : "user";

    const filterUsersByScope = (docs) => {
      if (usersOptions.scope === "specific") {
        const idSet = new Set(usersOptions.specificUserIds);
        return docs.filter((docSnap) => idSet.has(docSnap.id));
      }

      if (usersOptions.scope === "admin") {
        return docs.filter(
          (docSnap) => normalizeUserRole(docSnap.data()?.role) === "admin",
        );
      }

      if (usersOptions.scope === "user") {
        return docs.filter(
          (docSnap) => normalizeUserRole(docSnap.data()?.role) === "user",
        );
      }

      return docs;
    };

    const getSubcollectionsForRole = (roleValue) => {
      return normalizeUserRole(roleValue) === "admin"
        ? usersOptions.subcollectionsByRole.admin
        : usersOptions.subcollectionsByRole.user;
    };

    try {
      let totalDocs = 0;

      for (const collName of rootCollections) {
        if (collName !== "users") {
          const sourceColl = collection(db, collName);
          const snapshot = await throttledGetDocs(sourceColl);
          totalDocs += snapshot.size;
          continue;
        }

        const usersSnap = await throttledGetDocs(collection(db, "users"));
        const filteredUsers = filterUsersByScope(usersSnap.docs);
        totalDocs += filteredUsers.length;

        for (const userDoc of filteredUsers) {
          const selectedSubs = getSubcollectionsForRole(userDoc.data()?.role);
          for (const subName of selectedSubs) {
            const subSnap = await throttledGetDocs(
              collection(db, "users", userDoc.id, subName),
            );
            totalDocs += subSnap.size;
          }
        }
      }

      let copiedDocs = 0;
      const advanceProgress = (count = 1) => {
        copiedDocs += count;
        setBackupProgress(
          totalDocs > 0 ? Math.min(100, (copiedDocs / totalDocs) * 100) : 100,
        );
      };

      for (const collName of rootCollections) {
        if (collName !== "users") {
          const sourceColl = collection(db, collName);
          const targetColl = collection(
            db,
            "users",
            adminUid,
            "backups",
            backupId,
            collName,
          );

          await copyCollectionRecursive(sourceColl, targetColl, [], () => {
            advanceProgress(1);
          });
          continue;
        }

        const usersSnap = await throttledGetDocs(collection(db, "users"));
        const filteredUsers = filterUsersByScope(usersSnap.docs);

        for (const userDoc of filteredUsers) {
          const userTargetDoc = doc(
            db,
            "users",
            adminUid,
            "backups",
            backupId,
            "users",
            userDoc.id,
          );

          await throttledSetDoc(userTargetDoc, userDoc.data());
          advanceProgress(1);

          const selectedSubs = getSubcollectionsForRole(userDoc.data()?.role);

          for (const subName of selectedSubs) {
            const sourceSub = collection(db, "users", userDoc.id, subName);
            const targetSub = collection(
              db,
              "users",
              adminUid,
              "backups",
              backupId,
              "users",
              userDoc.id,
              subName,
            );

            await copyCollectionRecursive(sourceSub, targetSub, [], () => {
              advanceProgress(1);
            });
          }
        }
      }

      await updateDoc(doc(db, "users", adminUid), {
        backupAt: new Date().toISOString(),
      });

      console.log("Backup completed successfully");
      showActionOverlay({
        message: "Backup completed successfully!",
        type: "success",
      });

      setShowBackupSuccess(true);
      setHideBackupAnimation(false);

      setTimeout(() => {
        setHideBackupAnimation(true);
        setTimeout(() => setShowBackupSuccess(false), 400);
      }, 5000);
    } catch (error) {
      console.error("Error creating backup:", error);
      showActionOverlay({
        message: "Backup failed. Please try again.",
        type: "warning",
      });
    } finally {
      setIsBackingUp(false);
      setBackupProgress(0);
    }
  };

  // FUNCTION TO CREATE DOWNLOAD
  const createDownload = async (selectedCollections = null) => {
    if (!user || user.role !== "admin") {
      console.error("Unauthorized: Only admins can download data");
      return;
    }

    setIsDownloading(true);
    setDownloadProgress(0);
    setIsDownloadMinimized(false);

    const now = new Date();

    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: "Asia/Manila",
      month: "2-digit",
      day: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    })
      .formatToParts(now)
      .reduce((acc, part) => {
        acc[part.type] = part.value;
        return acc;
      }, {});

    const allCollections = [
      "config",
      "images",
      "reviews",
      "terms",
      "units",
      "users",
    ];

    const adminAvailableSubcollections = [
      "completedBookings",
      "financialReports",
      "activeBookings",
      "adminBookingRequests",
      "sentMessages",
      "receivedMessages",
    ];

    const userAvailableSubcollections = [
      "rentalHistory",
      "activeRentals",
      "userBookingRequest",
      "sentMessages",
      "receivedMessages",
    ];

    const defaultUsersOptions = {
      scope: "all",
      specificUserIds: [],
      subcollectionsByRole: {
        admin: adminAvailableSubcollections,
        user: userAvailableSubcollections,
      },
    };

    let rootCollections = allCollections;
    let usersOptions = defaultUsersOptions;

    if (Array.isArray(selectedCollections)) {
      rootCollections = allCollections.filter((key) =>
        selectedCollections.includes(key),
      );
    } else if (selectedCollections && typeof selectedCollections === "object") {
      const hasCollectionsKey = Object.prototype.hasOwnProperty.call(
        selectedCollections,
        "collections",
      );

      if (hasCollectionsKey) {
        const selectedRoot = selectedCollections.collections;
        if (Array.isArray(selectedRoot)) {
          rootCollections = allCollections.filter((key) =>
            selectedRoot.includes(key),
          );
        } else if (selectedRoot && typeof selectedRoot === "object") {
          rootCollections = allCollections.filter((key) => selectedRoot[key]);
        }
      } else {
        rootCollections = allCollections.filter(
          (key) => selectedCollections[key],
        );
      }

      if (
        selectedCollections.users &&
        typeof selectedCollections.users === "object"
      ) {
        const usersConfig = selectedCollections.users;
        const scopeRaw = String(usersConfig.scope || "all").toLowerCase();
        const normalizedScope =
          scopeRaw === "admin" || scopeRaw === "user" || scopeRaw === "specific"
            ? scopeRaw
            : "all";

        const specificUserIds = Array.isArray(usersConfig.specificUserIds)
          ? [
              ...new Set(
                usersConfig.specificUserIds
                  .filter(Boolean)
                  .map((id) => String(id)),
              ),
            ]
          : [];

        const adminSubsRaw = usersConfig.subcollectionsByRole?.admin;
        const userSubsRaw = usersConfig.subcollectionsByRole?.user;

        const adminSubs = Array.isArray(adminSubsRaw)
          ? adminAvailableSubcollections.filter((name) =>
              adminSubsRaw.includes(name),
            )
          : adminAvailableSubcollections;

        const userSubs = Array.isArray(userSubsRaw)
          ? userAvailableSubcollections.filter((name) =>
              userSubsRaw.includes(name),
            )
          : userAvailableSubcollections;

        usersOptions = {
          scope: normalizedScope,
          specificUserIds,
          subcollectionsByRole: {
            admin: adminSubs,
            user: userSubs,
          },
        };
      }
    }

    if (!rootCollections.length) {
      console.warn("No collections selected for download");
      setIsDownloading(false);
      setDownloadProgress(0);
      return;
    }

    const selectedLabel = `[${rootCollections.join(", ")}]`;
    const downloadId = `Download_${selectedLabel}_${parts.month}${parts.day}${parts.year}${parts.hour}${parts.minute}${parts.second}_${now.getMilliseconds()}_PHT`;

    const triggerBlobDownload = (blob, filename) => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.style.display = "none";
      document.body.appendChild(a);
      a.click();

      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 2000);
    };

    const normalizeUserRole = (roleValue) =>
      String(roleValue || "").toLowerCase() === "admin" ? "admin" : "user";

    const sortUsersDocs = (docs) => {
      return [...docs].sort((a, b) => {
        const roleA = normalizeUserRole(a.data()?.role);
        const roleB = normalizeUserRole(b.data()?.role);

        if (roleA === "admin" && roleB !== "admin") return -1;
        if (roleA !== "admin" && roleB === "admin") return 1;
        return a.id.localeCompare(b.id);
      });
    };

    const filterUsersByScope = (docs) => {
      if (usersOptions.scope === "specific") {
        const idSet = new Set(usersOptions.specificUserIds);
        return docs.filter((docSnap) => idSet.has(docSnap.id));
      }

      if (usersOptions.scope === "admin") {
        return docs.filter(
          (docSnap) => normalizeUserRole(docSnap.data()?.role) === "admin",
        );
      }

      if (usersOptions.scope === "user") {
        return docs.filter(
          (docSnap) => normalizeUserRole(docSnap.data()?.role) === "user",
        );
      }

      return docs;
    };

    const getSubcollectionsForRole = (roleValue) => {
      const normalizedRole = normalizeUserRole(roleValue);
      return normalizedRole === "admin"
        ? usersOptions.subcollectionsByRole.admin
        : usersOptions.subcollectionsByRole.user;
    };

    const exportUserWithSubcollections = async (userDocSnap) => {
      const userData = {
        id: userDocSnap.id,
        ...userDocSnap.data(),
        _subcollections: {},
      };

      const selectedSubcollections = getSubcollectionsForRole(
        userDocSnap.data()?.role,
      );

      for (const subName of selectedSubcollections) {
        const subRef = collection(db, "users", userDocSnap.id, subName);
        const subSnap = await throttledGetDocs(subRef);
        userData._subcollections[subName] = subSnap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        }));
      }

      return userData;
    };

    try {
      let totalDocs = 0;

      for (const collName of rootCollections) {
        const sourceColl = collection(db, collName);
        const snapshot = await throttledGetDocs(sourceColl);
        totalDocs += snapshot.size;
      }

      if (rootCollections.includes("users")) {
        const usersSnap = await throttledGetDocs(collection(db, "users"));
        const filteredUsers = filterUsersByScope(sortUsersDocs(usersSnap.docs));

        totalDocs = totalDocs - usersSnap.size + filteredUsers.length;

        for (const userDoc of filteredUsers) {
          const selectedSubcollections = getSubcollectionsForRole(
            userDoc.data()?.role,
          );
          for (const subName of selectedSubcollections) {
            const subSnap = await throttledGetDocs(
              collection(db, "users", userDoc.id, subName),
            );
            totalDocs += subSnap.size;
          }
        }
      }

      let copiedDocs = 0;
      const allData = {};
      const excelData = {};

      const sanitizeForExcel = (value, maxLength = 32767) => {
        if (typeof value === "string") {
          return value.length > maxLength
            ? value.substring(0, maxLength - 3) + "..."
            : value;
        }

        if (Array.isArray(value)) {
          return value.map((item) => sanitizeForExcel(item, maxLength));
        }

        if (value && typeof value === "object") {
          const out = {};
          for (const key of Object.keys(value)) {
            out[key] = sanitizeForExcel(value[key], maxLength);
          }
          return out;
        }

        return value;
      };

      for (const collName of rootCollections) {
        const sourceColl = collection(db, collName);
        const snapshot = await throttledGetDocs(sourceColl);

        let rawData = [];

        if (collName === "users") {
          const filteredUsers = filterUsersByScope(
            sortUsersDocs(snapshot.docs),
          );
          rawData = await Promise.all(
            filteredUsers.map((docSnap) =>
              exportUserWithSubcollections(docSnap),
            ),
          );

          copiedDocs += filteredUsers.length;
          setDownloadProgress(
            totalDocs > 0 ? Math.min(100, (copiedDocs / totalDocs) * 100) : 100,
          );

          for (const userRow of rawData) {
            const subcollections = userRow?._subcollections || {};
            for (const subName of Object.keys(subcollections)) {
              copiedDocs += Array.isArray(subcollections[subName])
                ? subcollections[subName].length
                : 0;
            }

            setDownloadProgress(
              totalDocs > 0
                ? Math.min(100, (copiedDocs / totalDocs) * 100)
                : 100,
            );
          }
        } else {
          rawData = snapshot.docs.map((docSnap) => ({
            id: docSnap.id,
            ...docSnap.data(),
          }));

          copiedDocs += snapshot.size;
          setDownloadProgress(
            totalDocs > 0 ? Math.min(100, (copiedDocs / totalDocs) * 100) : 100,
          );
        }

        allData[collName] = rawData;
        excelData[collName] = rawData.map((row) => sanitizeForExcel(row));
      }

      const XLSX = await import("xlsx");
      const wb = XLSX.utils.book_new();

      for (const collName of rootCollections) {
        const ws = XLSX.utils.json_to_sheet(excelData[collName] || []);
        XLSX.utils.book_append_sheet(wb, ws, collName);
      }

      const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
      const excelBlob = new Blob([excelBuffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });

      const jsonData = JSON.stringify(allData, null, 2);
      const jsonBlob = new Blob([jsonData], { type: "application/json" });

      triggerBlobDownload(excelBlob, `${downloadId}.xlsx`);
      await new Promise((resolve) => setTimeout(resolve, 350));
      triggerBlobDownload(jsonBlob, `${downloadId}.json`);

      showActionOverlay({
        message: "Download completed successfully!",
        type: "success",
      });

      setShowDownloadSuccess(true);
      setHideDownloadAnimation(false);

      setTimeout(() => {
        setHideDownloadAnimation(true);
        setTimeout(() => setShowDownloadSuccess(false), 400);
      }, 5000);
    } catch (error) {
      console.error("Error creating download:", error);
      showActionOverlay({
        message: "Download failed. Please try again.",
        type: "warning",
      });
    } finally {
      setIsDownloading(false);
      setDownloadProgress(0);
    }
  };

  // FUNCTION TO IMPORT DATA FROM JSON
  const importDataFromJson = async (
    importedData,
    { mode = "merge", selectedCollections = null } = {},
  ) => {
    if (!user || user.role !== "admin") {
      return { success: false, error: "Unauthorized" };
    }

    setIsImporting(true);
    setImportProgress(0);
    setIsImportMinimized(false);

    const allCollections = [
      "config",
      "images",
      "reviews",
      "terms",
      "units",
      "users",
    ];

    const adminAvailableSubcollections = [
      "completedBookings",
      "financialReports",
      "activeBookings",
      "adminBookingRequests",
      "sentMessages",
      "receivedMessages",
    ];

    const userAvailableSubcollections = [
      "rentalHistory",
      "activeRentals",
      "userBookingRequest",
      "sentMessages",
      "receivedMessages",
    ];

    const defaultUsersOptions = {
      scope: "all",
      specificUserIds: [],
      subcollectionsByRole: {
        admin: adminAvailableSubcollections,
        user: userAvailableSubcollections,
      },
    };

    let targetCollections = allCollections;
    let usersOptions = defaultUsersOptions;

    if (Array.isArray(selectedCollections)) {
      targetCollections = allCollections.filter((k) =>
        selectedCollections.includes(k),
      );
    } else if (selectedCollections && typeof selectedCollections === "object") {
      const hasCollectionsKey = Object.prototype.hasOwnProperty.call(
        selectedCollections,
        "collections",
      );

      if (hasCollectionsKey) {
        const selectedRoot = selectedCollections.collections;
        if (Array.isArray(selectedRoot)) {
          targetCollections = allCollections.filter((k) =>
            selectedRoot.includes(k),
          );
        } else if (selectedRoot && typeof selectedRoot === "object") {
          targetCollections = allCollections.filter((k) => selectedRoot[k]);
        }
      } else {
        targetCollections = allCollections.filter(
          (k) => selectedCollections[k],
        );
      }

      if (
        selectedCollections.users &&
        typeof selectedCollections.users === "object"
      ) {
        const usersConfig = selectedCollections.users;
        const scopeRaw = String(usersConfig.scope || "all").toLowerCase();
        const normalizedScope =
          scopeRaw === "admin" || scopeRaw === "user" || scopeRaw === "specific"
            ? scopeRaw
            : "all";

        const specificUserIds = Array.isArray(usersConfig.specificUserIds)
          ? [
              ...new Set(
                usersConfig.specificUserIds
                  .filter(Boolean)
                  .map((id) => String(id)),
              ),
            ]
          : [];

        const adminSubsRaw = usersConfig.subcollectionsByRole?.admin;
        const userSubsRaw = usersConfig.subcollectionsByRole?.user;

        const adminSubs = Array.isArray(adminSubsRaw)
          ? adminAvailableSubcollections.filter((name) =>
              adminSubsRaw.includes(name),
            )
          : adminAvailableSubcollections;

        const userSubs = Array.isArray(userSubsRaw)
          ? userAvailableSubcollections.filter((name) =>
              userSubsRaw.includes(name),
            )
          : userAvailableSubcollections;

        usersOptions = {
          scope: normalizedScope,
          specificUserIds,
          subcollectionsByRole: {
            admin: adminSubs,
            user: userSubs,
          },
        };
      }
    }

    if (!targetCollections.length) {
      setIsImporting(false);
      setImportProgress(0);
      return { success: false, error: "No collections selected" };
    }

    const normalizeUserRole = (roleValue) =>
      String(roleValue || "").toLowerCase() === "admin" ? "admin" : "user";

    const getSubcollectionsForRole = (roleValue) => {
      return normalizeUserRole(roleValue) === "admin"
        ? usersOptions.subcollectionsByRole.admin
        : usersOptions.subcollectionsByRole.user;
    };

    const shouldIncludeUserByScope = (userId, roleValue) => {
      if (usersOptions.scope === "specific") {
        return usersOptions.specificUserIds.includes(String(userId));
      }
      if (usersOptions.scope === "admin") {
        return normalizeUserRole(roleValue) === "admin";
      }
      if (usersOptions.scope === "user") {
        return normalizeUserRole(roleValue) === "user";
      }
      return true;
    };

    // Convert exported JSON timestamp objects back to Firestore Timestamp
    const normalizeFirestoreValue = (value) => {
      if (Array.isArray(value)) {
        return value.map(normalizeFirestoreValue);
      }

      if (value && typeof value === "object") {
        const keys = Object.keys(value);

        if (
          keys.length === 2 &&
          keys.includes("seconds") &&
          keys.includes("nanoseconds") &&
          typeof value.seconds === "number" &&
          typeof value.nanoseconds === "number"
        ) {
          return new Timestamp(value.seconds, value.nanoseconds);
        }

        const out = {};
        for (const key of keys) {
          out[key] = normalizeFirestoreValue(value[key]);
        }
        return out;
      }

      return value;
    };

    try {
      // Count total incoming docs for progress %
      let totalDocs = 0;

      for (const collName of targetCollections) {
        const incoming = Array.isArray(importedData?.[collName])
          ? importedData[collName]
          : [];

        if (collName !== "users") {
          totalDocs += incoming.filter((item) => item?.id).length;
          continue;
        }

        const filteredUsers = incoming.filter(
          (item) => item?.id && shouldIncludeUserByScope(item.id, item.role),
        );

        totalDocs += filteredUsers.length;

        for (const userItem of filteredUsers) {
          const selectedSubs = getSubcollectionsForRole(userItem.role);
          const subcollections = userItem?._subcollections || {};

          for (const subName of selectedSubs) {
            const incomingSub = Array.isArray(subcollections[subName])
              ? subcollections[subName].filter((subItem) => subItem?.id)
              : [];
            totalDocs += incomingSub.length;
          }
        }
      }

      let processedDocs = 0;

      for (const collName of targetCollections) {
        const incoming = Array.isArray(importedData?.[collName])
          ? importedData[collName]
          : [];

        if (collName !== "users") {
          // OVERWRITE: remove docs not present in incoming file
          if (mode === "overwrite") {
            const existingSnap = await throttledGetDocs(
              collection(db, collName),
            );
            const incomingIds = new Set(
              incoming.map((d) => d?.id).filter(Boolean),
            );

            for (const docSnap of existingSnap.docs) {
              if (!incomingIds.has(docSnap.id)) {
                await throttledDeleteDoc(doc(db, collName, docSnap.id));
              }
            }
          }

          // MERGE/OVERWRITE write pass
          for (const item of incoming) {
            if (!item?.id) continue;
            const { id, ...payload } = item;
            const normalizedPayload = normalizeFirestoreValue(payload);

            await throttledSetDoc(doc(db, collName, id), normalizedPayload, {
              merge: mode === "merge",
            });

            processedDocs += 1;
            setImportProgress(
              totalDocs > 0 ? (processedDocs / totalDocs) * 100 : 100,
            );
          }

          continue;
        }

        const filteredUsers = incoming.filter(
          (item) => item?.id && shouldIncludeUserByScope(item.id, item.role),
        );

        if (mode === "overwrite") {
          const existingUsersSnap = await throttledGetDocs(
            collection(db, "users"),
          );
          const targetExistingUsers = existingUsersSnap.docs.filter((docSnap) =>
            shouldIncludeUserByScope(docSnap.id, docSnap.data()?.role),
          );
          const incomingUserIds = new Set(
            filteredUsers.map((u) => String(u.id)),
          );

          for (const docSnap of targetExistingUsers) {
            if (!incomingUserIds.has(docSnap.id)) {
              await throttledDeleteDoc(doc(db, "users", docSnap.id));
            }
          }
        }

        for (const userItem of filteredUsers) {
          const { id: userId, _subcollections = {}, ...userPayload } = userItem;
          const normalizedUserPayload = normalizeFirestoreValue(userPayload);

          await throttledSetDoc(
            doc(db, "users", userId),
            normalizedUserPayload,
            { merge: mode === "merge" },
          );

          processedDocs += 1;
          setImportProgress(
            totalDocs > 0 ? (processedDocs / totalDocs) * 100 : 100,
          );

          const selectedSubs = getSubcollectionsForRole(userPayload.role);

          for (const subName of selectedSubs) {
            const incomingSub = Array.isArray(_subcollections[subName])
              ? _subcollections[subName].filter((subItem) => subItem?.id)
              : [];

            if (mode === "overwrite") {
              const existingSubSnap = await throttledGetDocs(
                collection(db, "users", userId, subName),
              );
              const incomingSubIds = new Set(
                incomingSub.map((sub) => String(sub.id)),
              );

              for (const existingDoc of existingSubSnap.docs) {
                if (!incomingSubIds.has(existingDoc.id)) {
                  await throttledDeleteDoc(
                    doc(db, "users", userId, subName, existingDoc.id),
                  );
                }
              }
            }

            for (const subItem of incomingSub) {
              const { id: subId, ...subPayload } = subItem;
              const normalizedSubPayload = normalizeFirestoreValue(subPayload);

              await throttledSetDoc(
                doc(db, "users", userId, subName, subId),
                normalizedSubPayload,
                { merge: mode === "merge" },
              );

              processedDocs += 1;
              setImportProgress(
                totalDocs > 0 ? (processedDocs / totalDocs) * 100 : 100,
              );
            }
          }
        }
      }

      if (
        targetCollections.includes("units") &&
        mode === "overwrite" &&
        adminUid
      ) {
        const activeBookingsSnap = await throttledGetDocs(
          collection(db, "users", adminUid, "activeBookings"),
        );

        const activePlateSet = new Set(
          activeBookingsSnap.docs
            .map((snap) => String(snap.data()?.plateNo || "").trim())
            .filter(Boolean),
        );

        const unitsSnap = await throttledGetDocs(collection(db, "units"));

        for (const unitSnap of unitsSnap.docs) {
          const unitData = unitSnap.data() || {};
          const plateNo = String(unitData.plateNo || unitSnap.id || "").trim();
          const shouldBeHidden = activePlateSet.has(plateNo);

          if (unitData.hidden !== shouldBeHidden) {
            await throttledSetDoc(
              doc(db, "units", unitSnap.id),
              { hidden: shouldBeHidden },
              { merge: true },
            );
          }
        }
      }

      setImportProgress(100);

      showActionOverlay({
        message: `Import completed (${mode}).`,
        type: "success",
      });

      setShowImportSuccess(true);
      setHideImportAnimation(false);

      setTimeout(() => {
        setHideImportAnimation(true);
        setTimeout(() => setShowImportSuccess(false), 400);
      }, 5000);

      return { success: true };
    } catch (error) {
      console.error("Import failed:", error);
      showActionOverlay({
        message: "Import failed. Please check your file.",
        type: "warning",
      });
      return { success: false, error: error.message };
    } finally {
      setTimeout(() => {
        setIsImporting(false);
        setImportProgress(0);
      }, 300);
    }
  };

  return (
    <UserContext.Provider
      value={{
        clearImageCache,
        updateImageCache,
        signInWithFacebook,
        isUpdatingUser,
        linkAccount,
        unlinkAccount,
        forgotPassword,
        sendVerificationEmail,
        showVerifyOverlay,
        setShowVerifyOverlay,
        rememberUser,
        clearRememberMe,
        isRemembered,

        savePrivacyPolicy,
        saveTermsConditions,
        fetchPrivacyPolicy,
        fetchTermsConditions,

        adminAccounts,
        userAccounts,
        blockedUsers,
        blockUsers,
        unblockUser,
        confirmBlockUser,
        confirmUnblockUser,
        reloadAndSyncUser,

        showBlockedUserOverlay,
        setShowBlockedUserOverlay,
        blockedUserReason,
        adminContactInfo,

        showBlockUserReason,
        setShowBlockUserReason,
        showUnblockUserConfirm,
        setShowUnblockUserConfirm,
        blockReason,
        setBlockReason,
        userToProcess,
        setUserToProcess,

        user,
        setUser,
        updateUser,
        revertUserData,
        deleteUserAccount,

        logout,
        markMessageAsRead,

        sendMessage,
        deleteMessage,
        sentMessages,
        userMessages,
        sendGuestContactMessage,

        saveBookingToFirestore,
        unitData,
        allUnitData,
        fleetDetailsUnits,
        activeBookings,

        paymentEntries,
        setPaymentEntries,
        addPaymentEntry,
        updatePaymentEntry,
        removePaymentEntry,

        triggerAutoFill,
        autoFillTrigger,

        triggerCancelFill,
        cancelTrigger,
        setCancelTrigger,

        hasServerChange,
        setHasServerChange,
        serverChangeCounter,

        saveFinancialReport,
        loadFinancialReport,

        mopTypes,
        setMopTypes: updateMopTypes,

        popTypesRevenue,
        popTypesExpense,
        setPopTypesRevenue: updatePopTypesRevenue,
        setPopTypesExpense: updatePopTypesExpense,

        referralSources,
        setReferralSources: updateReferralSources,

        revenueGrid,
        expenseGrid,
        setRevenueGrid,
        setExpenseGrid,

        imageCache,
        deleteImageFromFirestore,
        uploadImageToFirestore,
        imageUpdateTrigger,
        updateUnitGalleryImages,
        fetchImageFromFirestore,
        compressAndConvertToBase64,
        updateUnitImage,
        deleteUnit,

        createReview,
        deleteReview,
        updateReview,
        fetchReviews,

        updateAdminProfilePic,
        resetAdminProfilePic,
        createBackup,

        isBackingUp,
        backupProgress,
        isBackupMinimized,
        setIsBackupMinimized,

        isDownloading,
        downloadProgress,
        isDownloadMinimized,
        setIsDownloadMinimized,
        createDownload,

        importDataFromJson,
        isImporting,
        importProgress,
        isImportMinimized,
        setIsImportMinimized,
        showImportSuccess,
        setShowImportSuccess,
        hideImportAnimation,
        setHideImportAnimation,

        showBackupSuccess,
        setShowBackupSuccess,
        hideBackupAnimation,
        setHideBackupAnimation,
        showDownloadSuccess,
        setShowDownloadSuccess,
        hideDownloadAnimation,
        setHideDownloadAnimation,

        completedBookingsAnalytics,
        calendarEvents,

        generatePerDayCalendarEvents,
        submitUserBookingRequest,

        saveBookingFormData,
        loadSavedBookingFormData,
        clearSavedBookingFormData,

        updateUserBookingRequest,

        updateAdminToUserBookingRequest,
        updateActiveBooking,
        updateBalanceDueBooking,
        markBookingAsPaid,

        cancelUserBookingRequest,
        userBookingRequests,
        fetchUserBookingRequests,

        userActiveRentals,
        fetchUserActiveRentals,
        moveUserBookingToActiveRentals,

        rejectBookingRequest,
        resubmitUserBookingRequest,

        adminBookingRequests,
        fetchAdminBookingRequests,
        compressAndConvertFileToBase64,

        userRentalHistory,
        serverTimestamp,
        markRentalAsCompleted,
        markUserRentalAsCompleted,
        triggerForceFinishRental,
        cancelRental,
        extendRentalDuration,
        reserveUnit,
        authLoading,
        isLoggedIn: !!user,
        isAdmin: user?.role === "admin",
        adminUid,
        fetchAdminUid,
        syncAdminInfoToAppSettings,
        resetAdminToAppSettingsOriginal,
        updateUnitData,

        theme,
        updateTheme,

        sendEmail,
        isActivatingBooking,

        actionOverlay,
        showActionOverlay,
        hideCancelAnimation,
        setHideCancelAnimation,
        setActionOverlay,

        hasGoogle: (user?.providerData || []).some(
          (p) => p.providerId === "google.com",
        ),
        hasEmail: (user?.providerData || []).some(
          (p) => p.providerId === "password",
        ),
      }}
    >
      {children}
    </UserContext.Provider>
  );
};

//   const createBackup = async (selectedCollections = null) => {
//     if (!user || user.role !== "admin") {
//       console.error("Unauthorized: Only admins can create backups");
//       return;
//     }

//     setIsBackingUp(true);
//     setBackupProgress(0);
//     setIsBackupMinimized(false);

//     const adminUid = user.uid;

//     // BACKUP DATA ID
//     const now = new Date();

//     const parts = new Intl.DateTimeFormat("en-US", {
//       timeZone: "Asia/Manila",
//       month: "2-digit", // 01
//       day: "2-digit", // 10
//       year: "numeric", // 2026
//       hour: "2-digit", // 01
//       minute: "2-digit", // 10
//       second: "2-digit", // 20
//       hour12: false,
//     })
//       .formatToParts(now)
//       .reduce((acc, part) => {
//         acc[part.type] = part.value;
//         return acc;
//       }, {});

//     // Backup ID
//     const backupId = `Backup_${parts.month}${parts.day}${parts.year}${parts.hour}${parts.minute}${parts.second}_${now.getMilliseconds()}_PHT`;

//     // Define root collections to backup (add more if needed)
//     const allCollections = ["config", "images", "reviews", "terms", "units", "users"];

//     // selectedCollections can be:
//     // - null => default behavior (backup all in allCollections)
//     // - array => ["images", "users"]
//     // - object => { images: true, users: false, ... }
//     let rootCollections = allCollections;

//     if (Array.isArray(selectedCollections)) {
//       rootCollections = allCollections.filter((key) => selectedCollections.includes(key));
//     } else if (selectedCollections && typeof selectedCollections === "object") {
//       rootCollections = allCollections.filter((key) => selectedCollections[key]);
//     }

//     // safety fallback
//     if (rootCollections.length === 0) {
//       rootCollections = allCollections;
// }

//     // Map of known subcollections for each root collection (based on your Firestore structure)
//     const subCollMap = {
//       config: [],
//       images: [],
//       reviews: [],
//       terms: [],
//       units: [],
//       users: [
//         "completedBookings",
//         "receivedMessages",
//         "sentMessages",
//         "rentalHistory",
//         "userBookingRequest",
//         "adminBookingRequests",
//         "completedBookings",
//         "financialReports",
//       ],
//     };

//     try {
//       // Count total documents for progress calculation
//       let totalDocs = 0;
//       for (const collName of rootCollections) {
//         const sourceColl = collection(db, collName);
//         const snapshot = await getDocs(sourceColl);
//         totalDocs += snapshot.size;
//       }

//       let copiedDocs = 0;

//       // Copy each root collection recursively
//       for (const collName of rootCollections) {
//         const sourceColl = collection(db, collName);
//         const targetColl = collection(
//           db,
//           "users",
//           adminUid,
//           "backups",
//           backupId,
//           collName,
//         );
//         await copyCollectionRecursive(
//           sourceColl,
//           targetColl,
//           subCollMap[collName] || [],
//           () => {
//             copiedDocs++;
//             setBackupProgress(Math.min(100, (copiedDocs / totalDocs) * 100));
//           },
//         );
//       }

//       // Update the admin's backupAt timestamp
//       await updateDoc(doc(db, "users", adminUid), {
//         backupAt: new Date().toISOString(),
//       });

//       console.log("Backup completed successfully");
//       showActionOverlay({
//         message: "Backup completed successfully!",
//         type: "success",
//       });

//       setShowBackupSuccess(true);
//       setHideBackupAnimation(false);

//       setTimeout(() => {
//         setHideBackupAnimation(true);
//         setTimeout(() => setShowBackupSuccess(false), 400);
//       }, 5000);
//     } catch (error) {
//       console.error("Error creating backup:", error);
//       showActionOverlay({
//         message: "Backup failed. Please try again.",
//         type: "warning",
//       });
//     } finally {
//       setIsBackingUp(false);
//       setBackupProgress(0);
//     }
//   };

// const createDownload = async (selectedCollections = null) => {
//   if (!user || user.role !== "admin") {
//     console.error("Unauthorized: Only admins can download data");
//     return;
//   }

//   setIsDownloading(true);
//   setDownloadProgress(0);
//   setIsDownloadMinimized(false);

//   const now = new Date();

//   const parts = new Intl.DateTimeFormat("en-US", {
//     timeZone: "Asia/Manila",
//     month: "2-digit",
//     day: "2-digit",
//     year: "numeric",
//     hour: "2-digit",
//     minute: "2-digit",
//     second: "2-digit",
//     hour12: false,
//   })
//     .formatToParts(now)
//     .reduce((acc, part) => {
//       acc[part.type] = part.value;
//       return acc;
//     }, {});

//   const allCollections = ["config", "images", "reviews", "terms", "units", "users"];

//   let rootCollections = allCollections;
//   if (Array.isArray(selectedCollections)) {
//     rootCollections = allCollections.filter((key) => selectedCollections.includes(key));
//   } else if (selectedCollections && typeof selectedCollections === "object") {
//     rootCollections = allCollections.filter((key) => selectedCollections[key]);
//   }

//   if (!rootCollections.length) {
//     console.warn("No collections selected for download");
//     setIsDownloading(false);
//     setDownloadProgress(0);
//     return;
//   }

//   const selectedLabel = `[${rootCollections.join(", ")}]`;
//   const downloadId = `Download_${selectedLabel}_${parts.month}${parts.day}${parts.year}${parts.hour}${parts.minute}${parts.second}_${now.getMilliseconds()}_PHT`;

//   const triggerBlobDownload = (blob, filename) => {
//     const url = URL.createObjectURL(blob);
//     const a = document.createElement("a");
//     a.href = url;
//     a.download = filename;
//     a.style.display = "none";
//     document.body.appendChild(a);
//     a.click();

//     setTimeout(() => {
//       document.body.removeChild(a);
//       URL.revokeObjectURL(url);
//     }, 2000);
//   };

//   const userSubcollections = [
//     "receivedMessages",
//     "sentMessages",
//     "userBookingRequest",
//     "adminBookingRequests",
//     "activeBookings",
//     "activeRentals",
//     "completedBookings",
//     "rentalHistory",
//     "pendingBookings",
//     "financialReports",
//   ];

//   // For admin users: explicit priority requested
//   const adminPrioritySubcollections = [
//     "completedBookings",
//     "financialReports",
//     "receivedMessages",
//     "sentMessages",
//     "activeBookings",
//   ];

//   const getOrderedSubcollectionsForRole = (role) => {
//     const normalizedRole = String(role || "").toLowerCase();
//     if (normalizedRole !== "admin") return userSubcollections;

//     const remaining = userSubcollections.filter(
//       (name) => !adminPrioritySubcollections.includes(name),
//     );

//     return [...adminPrioritySubcollections, ...remaining];
//   };

//   // Sort users: admins first, then regular users
//   const sortUsersDocs = (docs) => {
//     return [...docs].sort((a, b) => {
//       const roleA = String(a.data()?.role || "").toLowerCase();
//       const roleB = String(b.data()?.role || "").toLowerCase();

//       if (roleA === "admin" && roleB !== "admin") return -1;
//       if (roleA !== "admin" && roleB === "admin") return 1;
//       return a.id.localeCompare(b.id);
//     });
//   };

//   const exportUserWithSubcollections = async (userDocSnap) => {
//     const userRole = userDocSnap.data()?.role;
//     const orderedSubcollections = getOrderedSubcollectionsForRole(userRole);

//     const userData = {
//       id: userDocSnap.id,
//       ...userDocSnap.data(),
//       _subcollections: {},
//     };

//     for (const subName of orderedSubcollections) {
//       const subRef = collection(db, "users", userDocSnap.id, subName);
//       const subSnap = await getDocs(subRef);

//       userData._subcollections[subName] = subSnap.docs.map((d) => ({
//         id: d.id,
//         ...d.data(),
//       }));
//     }

//     return userData;
//   };

//   try {
//     let totalDocs = 0;

//     for (const collName of rootCollections) {
//       const sourceColl = collection(db, collName);
//       const snapshot = await getDocs(sourceColl);
//       totalDocs += snapshot.size;
//     }

//     // include nested users subcollections in progress count
//     if (rootCollections.includes("users")) {
//       const usersSnap = await getDocs(collection(db, "users"));
//       const sortedUsers = sortUsersDocs(usersSnap.docs);

//       for (const userDoc of sortedUsers) {
//         const role = userDoc.data()?.role;
//         const orderedSubcollections = getOrderedSubcollectionsForRole(role);

//         for (const subName of orderedSubcollections) {
//           const subSnap = await getDocs(collection(db, "users", userDoc.id, subName));
//           totalDocs += subSnap.size;
//         }
//       }
//     }

//     let copiedDocs = 0;
//     const allData = {};
//     const excelData = {};

//     const sanitizeForExcel = (value, maxLength = 32767) => {
//       if (typeof value === "string") {
//         return value.length > maxLength
//           ? value.substring(0, maxLength - 3) + "..."
//           : value;
//       }

//       if (Array.isArray(value)) {
//         return value.map((item) => sanitizeForExcel(item, maxLength));
//       }

//       if (value && typeof value === "object") {
//         const out = {};
//         for (const key of Object.keys(value)) {
//           out[key] = sanitizeForExcel(value[key], maxLength);
//         }
//         return out;
//       }

//       return value;
//     };

//     for (const collName of rootCollections) {
//       const sourceColl = collection(db, collName);
//       const snapshot = await getDocs(sourceColl);

//       let rawData = [];

//       if (collName === "users") {
//         const sortedUsers = sortUsersDocs(snapshot.docs);
//         rawData = await Promise.all(sortedUsers.map((docSnap) => exportUserWithSubcollections(docSnap)));

//         copiedDocs += snapshot.size;
//         setDownloadProgress(
//           totalDocs > 0 ? Math.min(100, (copiedDocs / totalDocs) * 100) : 100,
//         );

//         for (const userRow of rawData) {
//           const subcollections = userRow?._subcollections || {};
//           for (const subName of Object.keys(subcollections)) {
//             copiedDocs += Array.isArray(subcollections[subName]) ? subcollections[subName].length : 0;
//           }

//           setDownloadProgress(
//             totalDocs > 0 ? Math.min(100, (copiedDocs / totalDocs) * 100) : 100,
//           );
//         }
//       } else {
//         rawData = snapshot.docs.map((docSnap) => ({
//           id: docSnap.id,
//           ...docSnap.data(),
//         }));

//         copiedDocs += snapshot.size;
//         setDownloadProgress(
//           totalDocs > 0 ? Math.min(100, (copiedDocs / totalDocs) * 100) : 100,
//         );
//       }

//       allData[collName] = rawData;
//       excelData[collName] = rawData.map((row) => sanitizeForExcel(row));
//     }

//     const XLSX = await import("xlsx");
//     const wb = XLSX.utils.book_new();

//     for (const collName of rootCollections) {
//       const ws = XLSX.utils.json_to_sheet(excelData[collName] || []);
//       XLSX.utils.book_append_sheet(wb, ws, collName);
//     }

//     const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
//     const excelBlob = new Blob([excelBuffer], {
//       type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
//     });

//     const jsonData = JSON.stringify(allData, null, 2);
//     const jsonBlob = new Blob([jsonData], { type: "application/json" });

//     triggerBlobDownload(excelBlob, `${downloadId}.xlsx`);
//     await new Promise((resolve) => setTimeout(resolve, 350));
//     triggerBlobDownload(jsonBlob, `${downloadId}.json`);

//     showActionOverlay({
//       message: "Download completed successfully!",
//       type: "success",
//     });

//     setShowDownloadSuccess(true);
//     setHideDownloadAnimation(false);

//     setTimeout(() => {
//       setHideDownloadAnimation(true);
//       setTimeout(() => setShowDownloadSuccess(false), 400);
//     }, 5000);
//   } catch (error) {
//     console.error("Error creating download:", error);
//     showActionOverlay({
//       message: "Download failed. Please try again.",
//       type: "warning",
//     });
//   } finally {
//     setIsDownloading(false);
//     setDownloadProgress(0);
//   }
// };

// const importDataFromJson = async (
//   importedData,
//   { mode = "merge", selectedCollections = null } = {},
// ) => {
//   if (!user || user.role !== "admin") {
//     return { success: false, error: "Unauthorized" };
//   }

//   setIsImporting(true);
//   setImportProgress(0);
//   setIsImportMinimized(false);

//   const allCollections = ["config", "images", "reviews", "terms", "units", "users"];

//   let targetCollections = allCollections;
//   if (Array.isArray(selectedCollections)) {
//     targetCollections = allCollections.filter((k) => selectedCollections.includes(k));
//   } else if (selectedCollections && typeof selectedCollections === "object") {
//     targetCollections = allCollections.filter((k) => selectedCollections[k]);
//   }

//   if (!targetCollections.length) {
//     setIsImporting(false);
//     setImportProgress(0);
//     return { success: false, error: "No collections selected" };
//   }

//   // Convert exported JSON timestamp objects back to Firestore Timestamp
//   const normalizeFirestoreValue = (value) => {
//     if (Array.isArray(value)) {
//       return value.map(normalizeFirestoreValue);
//     }

//     if (value && typeof value === "object") {
//       const keys = Object.keys(value);

//       if (
//         keys.length === 2 &&
//         keys.includes("seconds") &&
//         keys.includes("nanoseconds") &&
//         typeof value.seconds === "number" &&
//         typeof value.nanoseconds === "number"
//       ) {
//         return new Timestamp(value.seconds, value.nanoseconds);
//       }

//       const out = {};
//       for (const key of keys) {
//         out[key] = normalizeFirestoreValue(value[key]);
//       }
//       return out;
//     }

//     return value;
//   };

//   try {
//     // Count total incoming docs for progress %
//     const totalDocs = targetCollections.reduce((sum, collName) => {
//       const incoming = Array.isArray(importedData?.[collName]) ? importedData[collName] : [];
//       return sum + incoming.filter((item) => item?.id).length;
//     }, 0);

//     let processedDocs = 0;

//     for (const collName of targetCollections) {
//       const incoming = Array.isArray(importedData?.[collName]) ? importedData[collName] : [];

//       // OVERWRITE: remove docs not present in incoming file
//       if (mode === "overwrite") {
//         const existingSnap = await getDocs(collection(db, collName));
//         const incomingIds = new Set(incoming.map((d) => d?.id).filter(Boolean));

//         for (const docSnap of existingSnap.docs) {
//           if (!incomingIds.has(docSnap.id)) {
//             await deleteDoc(doc(db, collName, docSnap.id));
//           }
//         }
//       }

//       // MERGE/OVERWRITE write pass
//       for (const item of incoming) {
//         if (!item?.id) continue;
//         const { id, ...payload } = item;
//         const normalizedPayload = normalizeFirestoreValue(payload);

//         await setDoc(
//           doc(db, collName, id),
//           normalizedPayload,
//           { merge: mode === "merge" },
//         );

//         processedDocs += 1;
//         setImportProgress(totalDocs > 0 ? (processedDocs / totalDocs) * 100 : 100);
//       }
//     }

//     setImportProgress(100);

//     showActionOverlay({
//       message: `Import completed (${mode}).`,
//       type: "success",
//     });

//     setShowImportSuccess(true);
//     setHideImportAnimation(false);

//     setTimeout(() => {
//       setHideImportAnimation(true);
//       setTimeout(() => setShowImportSuccess(false), 400);
//     }, 5000);

//     return { success: true };
//   } catch (error) {
//     console.error("Import failed:", error);
//     showActionOverlay({
//       message: "Import failed. Please check your file.",
//       type: "warning",
//     });
//     return { success: false, error: error.message };
//   } finally {
//     setTimeout(() => {
//       setIsImporting(false);
//       setImportProgress(0);
//     }, 300);
//   }
// };

// const createDownload = async (selectedCollections = null) => {
//   if (!user || user.role !== "admin") {
//     console.error("Unauthorized: Only admins can download data");
//     return;
//   }

//   setIsDownloading(true);
//   setDownloadProgress(0);
//   setIsDownloadMinimized(false);

//   const now = new Date();

//   const parts = new Intl.DateTimeFormat("en-US", {
//     timeZone: "Asia/Manila",
//     month: "2-digit",
//     day: "2-digit",
//     year: "numeric",
//     hour: "2-digit",
//     minute: "2-digit",
//     second: "2-digit",
//     hour12: false,
//   })
//     .formatToParts(now)
//     .reduce((acc, part) => {
//       acc[part.type] = part.value;
//       return acc;
//     }, {});

//   const allCollections = ["config", "images", "reviews", "terms", "units", "users"];

//   let rootCollections = allCollections;
//   if (Array.isArray(selectedCollections)) {
//     rootCollections = allCollections.filter((key) => selectedCollections.includes(key));
//   } else if (selectedCollections && typeof selectedCollections === "object") {
//     rootCollections = allCollections.filter((key) => selectedCollections[key]);
//   }

//   if (!rootCollections.length) {
//     console.warn("No collections selected for download");
//     setIsDownloading(false);
//     setDownloadProgress(0);
//     return;
//   }

//   const selectedLabel = `[${rootCollections.join(", ")}]`;
//   const downloadId = `Download_${selectedLabel}_${parts.month}${parts.day}${parts.year}${parts.hour}${parts.minute}${parts.second}_${now.getMilliseconds()}_PHT`;

//   const triggerBlobDownload = (blob, filename) => {
//     const url = URL.createObjectURL(blob);
//     const a = document.createElement("a");
//     a.href = url;
//     a.download = filename;
//     a.style.display = "none";
//     document.body.appendChild(a);
//     a.click();

//     // Delay revoke/cleanup so browser has time to start download
//     setTimeout(() => {
//       document.body.removeChild(a);
//       URL.revokeObjectURL(url);
//     }, 2000);
//   };

//   try {
//     let totalDocs = 0;
//     for (const collName of rootCollections) {
//       const sourceColl = collection(db, collName);
//       const snapshot = await getDocs(sourceColl);
//       totalDocs += snapshot.size;
//     }

//     let copiedDocs = 0;
//     const allData = {};
//     const excelData = {};

//     const sanitizeForExcel = (value, maxLength = 32767) => {
//       if (typeof value === "string") {
//         return value.length > maxLength
//           ? value.substring(0, maxLength - 3) + "..."
//           : value;
//       }

//       if (Array.isArray(value)) {
//         return value.map((item) => sanitizeForExcel(item, maxLength));
//       }

//       if (value && typeof value === "object") {
//         const out = {};
//         for (const key of Object.keys(value)) {
//           out[key] = sanitizeForExcel(value[key], maxLength);
//         }
//         return out;
//       }

//       return value;
//     };

//     for (const collName of rootCollections) {
//       const sourceColl = collection(db, collName);
//       const snapshot = await getDocs(sourceColl);

//       const rawData = snapshot.docs.map((docSnap) => ({
//         id: docSnap.id,
//         ...docSnap.data(),
//       }));

//       allData[collName] = rawData;
//       excelData[collName] = rawData.map((row) => sanitizeForExcel(row));

//       copiedDocs += snapshot.size;
//       setDownloadProgress(totalDocs > 0 ? Math.min(100, (copiedDocs / totalDocs) * 100) : 100);
//     }

//     // Build Excel
//     const XLSX = await import("xlsx");
//     const wb = XLSX.utils.book_new();
//     for (const collName of rootCollections) {
//       const ws = XLSX.utils.json_to_sheet(excelData[collName] || []);
//       XLSX.utils.book_append_sheet(wb, ws, collName);
//     }

//     const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
//     const excelBlob = new Blob([excelBuffer], {
//       type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
//     });

//     const jsonData = JSON.stringify(allData, null, 2);
//     const jsonBlob = new Blob([jsonData], { type: "application/json" });

//     // Trigger downloads
//     triggerBlobDownload(excelBlob, `${downloadId}.xlsx`);
//     await new Promise((resolve) => setTimeout(resolve, 350)); // spacing helps browser allow both
//     triggerBlobDownload(jsonBlob, `${downloadId}.json`);

//     showActionOverlay({
//       message: "Download completed successfully!",
//       type: "success",
//     });

//     setShowDownloadSuccess(true);
//     setHideDownloadAnimation(false);

//     setTimeout(() => {
//       setHideDownloadAnimation(true);
//       setTimeout(() => setShowDownloadSuccess(false), 400);
//     }, 5000);
//   } catch (error) {
//     console.error("Error creating download:", error);
//     showActionOverlay({
//       message: "Download failed. Please try again.",
//       type: "warning",
//     });
//   } finally {
//     setIsDownloading(false);
//     setDownloadProgress(0);
//   }
// };

// const importDataFromJson = async (
//   importedData,
//   { mode = "merge", selectedCollections = null } = {},
// ) => {
//   if (!user || user.role !== "admin") {
//     return { success: false, error: "Unauthorized" };
//   }

//   setIsImporting(true);
//   setImportProgress(0);
//   setIsImportMinimized(false);

//   const allCollections = ["config", "images", "reviews", "terms", "units", "users"];

//   let targetCollections = allCollections;
//   if (Array.isArray(selectedCollections)) {
//     targetCollections = allCollections.filter((k) => selectedCollections.includes(k));
//   } else if (selectedCollections && typeof selectedCollections === "object") {
//     targetCollections = allCollections.filter((k) => selectedCollections[k]);
//   }

//   if (!targetCollections.length) {
//     setIsImporting(false);
//     setImportProgress(0);
//     return { success: false, error: "No collections selected" };
//   }

//   try {
//     // Count total incoming docs for progress %
//     const totalDocs = targetCollections.reduce((sum, collName) => {
//       const incoming = Array.isArray(importedData?.[collName]) ? importedData[collName] : [];
//       return sum + incoming.filter((item) => item?.id).length;
//     }, 0);

//     let processedDocs = 0;

//     for (const collName of targetCollections) {
//       const incoming = Array.isArray(importedData?.[collName]) ? importedData[collName] : [];

//       // OVERWRITE: remove docs not present in incoming file
//       if (mode === "overwrite") {
//         const existingSnap = await getDocs(collection(db, collName));
//         const incomingIds = new Set(incoming.map((d) => d?.id).filter(Boolean));

//         for (const docSnap of existingSnap.docs) {
//           if (!incomingIds.has(docSnap.id)) {
//             await deleteDoc(doc(db, collName, docSnap.id));
//           }
//         }
//       }

//       // MERGE/OVERWRITE write pass
//       for (const item of incoming) {
//         if (!item?.id) continue;
//         const { id, ...payload } = item;

//         await setDoc(
//           doc(db, collName, id),
//           payload,
//           { merge: mode === "merge" },
//         );

//         processedDocs += 1;
//         setImportProgress(totalDocs > 0 ? (processedDocs / totalDocs) * 100 : 100);
//       }
//     }

//     setImportProgress(100);

//     showActionOverlay({
//       message: `Import completed (${mode}).`,
//       type: "success",
//     });

//     // NEW: show import success overlay
//     setShowImportSuccess(true);
//     setHideImportAnimation(false);

//     setTimeout(() => {
//       setHideImportAnimation(true);
//       setTimeout(() => setShowImportSuccess(false), 400);
//     }, 5000);

//     return { success: true };
//   } catch (error) {
//     console.error("Import failed:", error);
//     showActionOverlay({
//       message: "Import failed. Please check your file.",
//       type: "warning",
//     });
//     return { success: false, error: error.message };
//   } finally {
//     setTimeout(() => {
//       setIsImporting(false);
//       setImportProgress(0);
//     }, 300);
//   }
// };

// const state = useMemo(() => ({
//   isUpdatingUser,

//   showVerifyOverlay,
//   isRemembered,

//   adminAccounts,
//   userAccounts,
//   blockedUsers,

//   showBlockedUserOverlay,
//   blockedUserReason,
//   adminContactInfo,

//   showBlockUserReason,
//   showUnblockUserConfirm,
//   blockReason,
//   userToProcess,

//   user,
//   sentMessages,
//   userMessages,

//   unitData,
//   allUnitData,
//   fleetDetailsUnits,
//   activeBookings,

//   paymentEntries,

//   triggerAutoFill,
//   autoFillTrigger,

//   triggerCancelFill,
//   cancelTrigger,

//   hasServerChange,
//   serverChangeCounter,

//   mopTypes,
//   popTypesRevenue,
//   popTypesExpense,
//   referralSources,

//   revenueGrid,
//   expenseGrid,

//   imageCache,
//   imageUpdateTrigger,

//   isBackingUp,
//   backupProgress,
//   isBackupMinimized,

//   isDownloading,
//   downloadProgress,
//   isDownloadMinimized,

//   showBackupSuccess,
//   showDownloadSuccess,
//   hideBackupAnimation,
//   hideDownloadAnimation,

//   completedBookingsAnalytics,
//   calendarEvents,

//   userBookingRequests,
//   userActiveRentals,
//   userRentalHistory,

//   adminBookingRequests,

//   authLoading,
//   adminUid,

//   theme,

//   isActivatingBooking,

//   actionOverlay,
// }), [
//   isUpdatingUser,
//   showVerifyOverlay,
//   isRemembered,
//   adminAccounts,
//   userAccounts,
//   blockedUsers,
//   showBlockedUserOverlay,
//   blockedUserReason,
//   adminContactInfo,
//   showBlockUserReason,
//   showUnblockUserConfirm,
//   blockReason,
//   userToProcess,
//   user,
//   sentMessages,
//   userMessages,
//   unitData,
//   allUnitData,
//   fleetDetailsUnits,
//   activeBookings,
//   paymentEntries,
//   triggerAutoFill,
//   autoFillTrigger,
//   triggerCancelFill,
//   cancelTrigger,
//   hasServerChange,
//   serverChangeCounter,
//   mopTypes,
//   popTypesRevenue,
//   popTypesExpense,
//   referralSources,
//   revenueGrid,
//   expenseGrid,
//   imageCache,
//   imageUpdateTrigger,
//   isBackingUp,
//   backupProgress,
//   isBackupMinimized,
//   isDownloading,
//   downloadProgress,
//   isDownloadMinimized,
//   showBackupSuccess,
//   showDownloadSuccess,
//   hideBackupAnimation,
//   hideDownloadAnimation,
//   completedBookingsAnalytics,
//   calendarEvents,
//   userBookingRequests,
//   userActiveRentals,
//   userRentalHistory,
//   adminBookingRequests,
//   authLoading,
//   adminUid,
//   theme,
//   isActivatingBooking,
//   actionOverlay,
// ]);

// const actions = useMemo(() => ({
//   linkAccount,
//   unlinkAccount,
//   forgotPassword,
//   sendVerificationEmail,

//   setShowVerifyOverlay,
//   rememberUser,
//   clearRememberMe,

//   savePrivacyPolicy,
//   saveTermsConditions,
//   fetchPrivacyPolicy,
//   fetchTermsConditions,

//   blockUsers,
//   unblockUser,
//   confirmBlockUser,
//   confirmUnblockUser,
//   reloadAndSyncUser,

//   setShowBlockedUserOverlay,

//   setShowBlockUserReason,
//   setShowUnblockUserConfirm,
//   setBlockReason,
//   setUserToProcess,

//   setUser,
//   updateUser,
//   revertUserData,
//   deleteUserAccount,

//   logout,
//   markMessageAsRead,

//   sendMessage,
//   deleteMessage,

//   saveBookingToFirestore,

//   setPaymentEntries,
//   addPaymentEntry,
//   updatePaymentEntry,
//   removePaymentEntry,

//   setHasServerChange,

//   saveFinancialReport,
//   loadFinancialReport,

//   updateMopTypes,
//   updatePopTypesRevenue,
//   updatePopTypesExpense,
//   updateReferralSources,

//   setRevenueGrid,
//   setExpenseGrid,

//   deleteImageFromFirestore,
//   uploadImageToFirestore,
//   updateUnitGalleryImages,
//   fetchImageFromFirestore,
//   compressAndConvertToBase64,
//   updateUnitImage,
//   deleteUnit,

//   createReview,
//   deleteReview,
//   updateReview,
//   fetchReviews,

//   updateAdminProfilePic,
//   resetAdminProfilePic,
//   createBackup,

//   setIsBackupMinimized,
//   createDownload,
//   setIsDownloadMinimized,

//   setShowBackupSuccess,
//   setHideBackupAnimation,
//   setShowDownloadSuccess,
//   setHideDownloadAnimation,

//   generatePerDayCalendarEvents,
//   submitUserBookingRequest,

//   saveBookingFormData,
//   loadSavedBookingFormData,
//   clearSavedBookingFormData,

//   updateUserBookingRequest,
//   updateAdminToUserBookingRequest,
//   updateActiveBooking,
//   updateBalanceDueBooking,
//   markBookingAsPaid,

//   cancelUserBookingRequest,
//   fetchUserBookingRequests,

//   fetchUserActiveRentals,
//   moveUserBookingToActiveRentals,

//   rejectBookingRequest,
//   resubmitUserBookingRequest,

//   fetchAdminBookingRequests,

//   markRentalAsCompleted,
//   markUserRentalAsCompleted,
//   triggerForceFinishRental,
//   cancelRental,
//   extendRentalDuration,
//   reserveUnit,

//   fetchAdminUid,
//   updateUnitData,

//   updateTheme,

//   sendEmail,

//   showActionOverlay,
//   hideCancelAnimation,
//   setHideCancelAnimation,
//   setActionOverlay,
// }), []);

// const value = useMemo(() => ({
//   ...state,
//   ...actions,

//   isLoggedIn: !!user,
//   isAdmin: user?.role === "admin",

//   hasGoogle: (user?.providerData || []).some(
//     (p) => p.providerId === "google.com"
//   ),
//   hasEmail: (user?.providerData || []).some(
//     (p) => p.providerId === "password"
//   ),
// }), [state, actions, user]);

// return (
//   <UserContext.Provider value={value}>
//     {children}
//   </UserContext.Provider>
// );
// };
