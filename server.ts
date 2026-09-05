import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";

const app = express();
const PORT = Number(process.env.PORT) || 3000;

// Middleware for parsing JSON with generous limit for images, videos & backups
app.use(express.json({ limit: "250mb" }));
app.use(express.urlencoded({ extended: true, limit: "250mb" }));

// Local Ubuntu Server Data Directory
const DATA_DIR = path.join(process.cwd(), "data");
const DB_FILE = path.join(DATA_DIR, "database.json");
const UPLOADS_DIR = path.join(DATA_DIR, "uploads");
const VIDEOS_DIR = path.join(UPLOADS_DIR, "videos");

// Standard Seed User Accounts (Admin, Manager, Cashiers)
const SEED_USERS = [
  {
    id: "user-admin",
    username: "admin",
    password: "admin",
    fullName: "ប្រធានគ្រប់គ្រងទូទៅ (System Admin)",
    role: "admin",
    status: "active",
    plan: "lifetime",
    phone: "+855 12 888 999",
    email: "admin@miniposkh.com",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80",
    createdAt: new Date().toISOString()
  },
  {
    id: "user-manager-1",
    username: "manager",
    password: "123",
    fullName: "ចាន់ វ៉ាន់នី (Chan Vanny)",
    role: "manager",
    status: "active",
    plan: "lifetime",
    phone: "+855 77 123 456",
    email: "manager@miniposkh.com",
    avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=150&q=80",
    createdAt: new Date().toISOString()
  },
  {
    id: "user-cashier-1",
    username: "cashier01",
    password: "123",
    fullName: "សុខ ពិសិដ្ឋ (Sok Piseth)",
    role: "cashier",
    status: "active",
    plan: "free",
    phone: "+855 98 777 666",
    email: "piseth@miniposkh.com",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80",
    createdAt: new Date().toISOString()
  },
  {
    id: "user-cashier-2",
    username: "cashier",
    password: "123",
    fullName: "កែវ មុនី (Keo Mony)",
    role: "cashier",
    status: "active",
    plan: "free",
    phone: "+855 10 555 444",
    email: "mony@miniposkh.com",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80",
    createdAt: new Date().toISOString()
  }
];

// Helper to merge lists of objects by unique key or username
function mergeById<T extends { id?: string; username?: string }>(existing: T[] = [], incoming: T[] = []): T[] {
  const map = new Map<string, T>();
  for (const item of existing) {
    if (item) {
      const key = item.id || (item.username ? `u-${item.username.toLowerCase()}` : "");
      if (key) map.set(key, item);
    }
  }
  for (const item of incoming) {
    if (item) {
      const key = item.id || (item.username ? `u-${item.username.toLowerCase()}` : "");
      if (key) {
        const prev = map.get(key);
        map.set(key, prev ? { ...prev, ...item } : item);
      }
    }
  }
  return Array.from(map.values());
}

// Ensure data and uploads folders exist with safe permissions
try {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  }
  if (!fs.existsSync(VIDEOS_DIR)) {
    fs.mkdirSync(VIDEOS_DIR, { recursive: true });
  }

  // Seed DB_FILE if missing or missing seed users
  let initialDbData: any = {};
  if (fs.existsSync(DB_FILE)) {
    try {
      initialDbData = JSON.parse(fs.readFileSync(DB_FILE, "utf-8")) || {};
    } catch {}
  }
  const currentUsers = Array.isArray(initialDbData.users) ? initialDbData.users : [];
  const mergedUsers = mergeById(SEED_USERS, currentUsers);
  if (!fs.existsSync(DB_FILE) || currentUsers.length < mergedUsers.length) {
    initialDbData.users = mergedUsers;
    initialDbData.updatedAt = initialDbData.updatedAt || new Date().toISOString();
    fs.writeFileSync(DB_FILE, JSON.stringify(initialDbData, null, 2), "utf-8");
  }
} catch (err) {
  console.warn("Could not create local data/uploads directory or initialize db:", err);
}

// Function to ensure per-user upload directory exists on Ubuntu Server
function ensureUserUploadFolder(usernameOrId: string): { folderPath: string; folderRel: string } {
  const safeName = String(usernameOrId || "general").replace(/[^a-zA-Z0-9_-]/g, "_").toLowerCase();
  const folderPath = path.join(UPLOADS_DIR, safeName);
  try {
    if (!fs.existsSync(folderPath)) {
      fs.mkdirSync(folderPath, { recursive: true });
    }
  } catch (err) {
    console.warn(`Could not create folder for user ${safeName}:`, err);
  }
  return { folderPath, folderRel: safeName };
}

// Serve uploaded images statically (supports both root /uploads and nested /uploads/:username)
app.use("/uploads", express.static(UPLOADS_DIR));

// In-Memory Active User Sessions Registry for Ubuntu Server
interface ServerSession {
  sessionId: string;
  userId: string;
  username: string;
  fullName: string;
  role: string;
  avatar?: string;
  device: string;
  deviceType: "mobile" | "desktop" | "tablet";
  ip: string;
  activeView: string;
  loginTime: string;
  lastSeen: number;
}

const activeSessions = new Map<string, ServerSession>();

// Helper to clean up dead sessions (inactive for > 40 seconds)
function cleanupStaleSessions() {
  const now = Date.now();
  for (const [id, sess] of activeSessions.entries()) {
    if (now - sess.lastSeen > 40000) {
      activeSessions.delete(id);
    }
  }
}
setInterval(cleanupStaleSessions, 15000);

// Health Check API
app.get("/api/health", (req, res) => {
  cleanupStaleSessions();
  res.json({
    status: "ok",
    server: "Ubuntu / Node.js Self-Hosted POS Server",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    activeUsersCount: activeSessions.size
  });
});

// GET Active Live Sessions on Ubuntu Server
app.get("/api/sessions", (req, res) => {
  cleanupStaleSessions();
  const sessionsList = Array.from(activeSessions.values()).map(s => ({
    ...s,
    isOnline: (Date.now() - s.lastSeen) < 25000
  }));

  res.json({
    success: true,
    count: sessionsList.length,
    sessions: sessionsList,
    serverTime: new Date().toISOString()
  });
});

// POST Session Heartbeat & Login Detection
app.post("/api/sessions/heartbeat", (req, res) => {
  try {
    const { sessionId, userId, username, fullName, role, avatar, device, deviceType, activeView, isNewLogin } = req.body;
    if (!sessionId || !userId) {
      return res.status(400).json({ success: false, error: "Missing sessionId or userId" });
    }

    // Extract client IP address
    const rawIp = req.headers["x-forwarded-for"] || req.socket.remoteAddress || "127.0.0.1";
    const clientIp = typeof rawIp === "string" ? rawIp.replace("::ffff:", "") : "127.0.0.1";

    const isFirstTimeSeen = !activeSessions.has(sessionId) || Boolean(isNewLogin);
    const existing = activeSessions.get(sessionId);

    const sessionData: ServerSession = {
      sessionId,
      userId,
      username: username || "user",
      fullName: fullName || username || "User",
      role: role || "cashier",
      avatar: avatar || (existing ? existing.avatar : ""),
      device: device || "Web Browser",
      deviceType: deviceType || "desktop",
      ip: clientIp,
      activeView: activeView || "pos",
      loginTime: existing ? existing.loginTime : new Date().toISOString(),
      lastSeen: Date.now()
    };

    activeSessions.set(sessionId, sessionData);

    // If new login, record activity into database.json logs
    if (isFirstTimeSeen && fs.existsSync(DB_FILE)) {
      try {
        const fileData = JSON.parse(fs.readFileSync(DB_FILE, "utf-8"));
        if (fileData) {
          const currentLogs = Array.isArray(fileData.logs) ? fileData.logs : [];
          const newLog = {
            id: `log-login-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            userId,
            username,
            userRole: role,
            action: "LOGIN",
            details: `User ${fullName} (@${username}) logged in from ${sessionData.device} (IP: ${clientIp})`,
            timestamp: new Date().toISOString()
          };

          // Avoid duplicate rapid logs within 5 seconds for same user
          const hasRecentLogin = currentLogs.slice(0, 3).some(
            (l: any) => l.userId === userId && l.action === "LOGIN" && (Date.now() - new Date(l.timestamp).getTime() < 5000)
          );

          if (!hasRecentLogin) {
            fileData.logs = [newLog, ...currentLogs.slice(0, 199)];
            fs.writeFileSync(DB_FILE, JSON.stringify(fileData, null, 2), "utf-8");
          }
        }
      } catch (err) {
        console.warn("Could not log login event to file:", err);
      }
    }

    return res.json({
      success: true,
      activeCount: activeSessions.size,
      registeredIp: clientIp
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// POST Logout Session
app.post("/api/sessions/logout", (req, res) => {
  try {
    const { sessionId, userId, username, fullName } = req.body;
    if (sessionId && activeSessions.has(sessionId)) {
      activeSessions.delete(sessionId);
    }

    // Record logout log to DB file
    if (fs.existsSync(DB_FILE) && userId) {
      try {
        const fileData = JSON.parse(fs.readFileSync(DB_FILE, "utf-8"));
        if (fileData) {
          const currentLogs = Array.isArray(fileData.logs) ? fileData.logs : [];
          const newLog = {
            id: `log-logout-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            userId,
            username: username || "user",
            userRole: "user",
            action: "LOGOUT",
            details: `User ${fullName || username} signed out`,
            timestamp: new Date().toISOString()
          };
          fileData.logs = [newLog, ...currentLogs.slice(0, 199)];
          fs.writeFileSync(DB_FILE, JSON.stringify(fileData, null, 2), "utf-8");
        }
      } catch (err) {
        console.warn("Could not write logout log:", err);
      }
    }

    return res.json({ success: true, message: "Logged out session cleared" });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// GET Upgrade Requests from DB file
app.get("/api/upgrade-requests", (req, res) => {
  try {
    if (fs.existsSync(DB_FILE)) {
      const fileData = JSON.parse(fs.readFileSync(DB_FILE, "utf-8"));
      return res.json({ success: true, requests: Array.isArray(fileData?.upgradeRequests) ? fileData.upgradeRequests : [] });
    }
    return res.json({ success: true, requests: [] });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// POST Submit / Update Upgrade Request
app.post("/api/upgrade-requests", (req, res) => {
  try {
    const request = req.body;
    if (!request || !request.id || !request.userId) {
      return res.status(400).json({ success: false, error: "Missing required request fields" });
    }

    let fileData: any = {};
    if (fs.existsSync(DB_FILE)) {
      try {
        fileData = JSON.parse(fs.readFileSync(DB_FILE, "utf-8")) || {};
      } catch {}
    }

    const currentRequests = Array.isArray(fileData.upgradeRequests) ? fileData.upgradeRequests : [];
    const exists = currentRequests.some((r: any) => r.id === request.id);
    const updatedRequests = exists
      ? currentRequests.map((r: any) => (r.id === request.id ? { ...r, ...request } : r))
      : [request, ...currentRequests];

    fileData.upgradeRequests = updatedRequests;
    fileData.updatedAt = new Date().toISOString();

    // Also record log
    const currentLogs = Array.isArray(fileData.logs) ? fileData.logs : [];
    const newLog = {
      id: `log-upg-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      userId: request.userId,
      username: request.username || "user",
      userRole: "cashier",
      action: "SUBMIT_UPGRADE",
      details: `User ${request.fullName || request.username} submitted KHQR payment slip for Lifetime Upgrade`,
      timestamp: new Date().toISOString()
    };
    fileData.logs = [newLog, ...currentLogs.slice(0, 199)];

    fs.writeFileSync(DB_FILE, JSON.stringify(fileData, null, 2), "utf-8");
    return res.json({ success: true, message: "Upgrade request submitted successfully on server" });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// POST Approve Upgrade Request (Authoritative approval on Ubuntu Server)
app.post("/api/upgrade-requests/approve", (req, res) => {
  try {
    const { requestId, adminId, adminName } = req.body;
    if (!requestId) {
      return res.status(400).json({ success: false, error: "Missing requestId" });
    }

    let fileData: any = {};
    if (fs.existsSync(DB_FILE)) {
      try {
        fileData = JSON.parse(fs.readFileSync(DB_FILE, "utf-8")) || {};
      } catch {}
    }

    const currentRequests = Array.isArray(fileData.upgradeRequests) ? fileData.upgradeRequests : [];
    const targetReq = currentRequests.find((r: any) => r.id === requestId);
    if (!targetReq) {
      return res.status(404).json({ success: false, error: "Upgrade request not found on server" });
    }

    const now = new Date().toISOString();
    // 1. Update request status
    fileData.upgradeRequests = currentRequests.map((r: any) =>
      r.id === requestId
        ? {
            ...r,
            status: "approved",
            reviewedAt: now,
            reviewedBy: adminName || "Admin"
          }
        : r
    );

    // 2. Update user's plan to 'lifetime' in database.json
    const users = Array.isArray(fileData.users) ? fileData.users : [];
    fileData.users = users.map((u: any) => {
      if (u.id === targetReq.userId || u.username === targetReq.username) {
        return { ...u, plan: "lifetime" };
      }
      return u;
    });

    // 3. Add activity log
    const currentLogs = Array.isArray(fileData.logs) ? fileData.logs : [];
    const newLog = {
      id: `log-approve-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      userId: adminId || "user-admin",
      username: adminName || "admin",
      userRole: "admin",
      action: "APPROVE_UPGRADE",
      details: `Admin approved Lifetime License for ${targetReq.fullName} (@${targetReq.username})`,
      timestamp: now
    };
    fileData.logs = [newLog, ...currentLogs.slice(0, 199)];
    fileData.updatedAt = now;

    fs.writeFileSync(DB_FILE, JSON.stringify(fileData, null, 2), "utf-8");

    return res.json({
      success: true,
      message: `Successfully approved Lifetime plan for ${targetReq.fullName}`,
      targetUserId: targetReq.userId,
      users: fileData.users
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// POST Reject Upgrade Request
app.post("/api/upgrade-requests/reject", (req, res) => {
  try {
    const { requestId, adminId, adminName, reason } = req.body;
    if (!requestId) {
      return res.status(400).json({ success: false, error: "Missing requestId" });
    }

    let fileData: any = {};
    if (fs.existsSync(DB_FILE)) {
      try {
        fileData = JSON.parse(fs.readFileSync(DB_FILE, "utf-8")) || {};
      } catch {}
    }

    const currentRequests = Array.isArray(fileData.upgradeRequests) ? fileData.upgradeRequests : [];
    const now = new Date().toISOString();

    fileData.upgradeRequests = currentRequests.map((r: any) =>
      r.id === requestId
        ? {
            ...r,
            status: "rejected",
            adminNote: reason || "Payment slip unclear",
            reviewedAt: now,
            reviewedBy: adminName || "Admin"
          }
        : r
    );

    const currentLogs = Array.isArray(fileData.logs) ? fileData.logs : [];
    const newLog = {
      id: `log-reject-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      userId: adminId || "user-admin",
      username: adminName || "admin",
      userRole: "admin",
      action: "REJECT_UPGRADE",
      details: `Admin rejected upgrade request (${reason || "unspecified"})`,
      timestamp: now
    };
    fileData.logs = [newLog, ...currentLogs.slice(0, 199)];
    fileData.updatedAt = now;

    fs.writeFileSync(DB_FILE, JSON.stringify(fileData, null, 2), "utf-8");
    return res.json({ success: true, message: "Upgrade request rejected" });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// GET Admin Upgrade KHQR Configuration
app.get("/api/admin/upgrade-khqr", (req, res) => {
  try {
    if (fs.existsSync(DB_FILE)) {
      const fileData = JSON.parse(fs.readFileSync(DB_FILE, "utf-8"));
      return res.json({ success: true, config: fileData?.settings?.adminUpgradeKhqr || null });
    }
    return res.json({ success: true, config: null });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// POST Save Admin Upgrade KHQR Configuration
app.post("/api/admin/upgrade-khqr", (req, res) => {
  try {
    const config = req.body;
    let fileData: any = {};
    if (fs.existsSync(DB_FILE)) {
      try {
        fileData = JSON.parse(fs.readFileSync(DB_FILE, "utf-8")) || {};
      } catch {}
    }

    if (!fileData.settings) {
      fileData.settings = {};
    }
    fileData.settings.adminUpgradeKhqr = config;
    fileData.updatedAt = new Date().toISOString();

    fs.writeFileSync(DB_FILE, JSON.stringify(fileData, null, 2), "utf-8");
    return res.json({ success: true, message: "Admin Upgrade KHQR saved on server" });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// Helper to write JSON files asynchronously and safely without blocking the event loop
async function writeJsonFileAsync(filePath: string, data: any): Promise<void> {
  const jsonStr = JSON.stringify(data, null, 2);
  const tempPath = `${filePath}.tmp.${Date.now()}`;
  await fs.promises.writeFile(tempPath, jsonStr, "utf-8");
  await fs.promises.rename(tempPath, filePath);
}

// POST Image Upload Handler (Stores images directly in per-user folders on Ubuntu Server disk asynchronously)
app.post("/api/upload", async (req, res) => {
  try {
    const { image, filename, type, userId, username } = req.body;
    if (!image || typeof image !== "string") {
      return res.status(400).json({ success: false, error: "No image data provided" });
    }

    // Determine extension and clean base64 data
    let ext = "jpg";
    let base64Data = image;

    if (image.startsWith("data:image/")) {
      const match = image.match(/^data:image\/([a-zA-Z0-9+.-]+);base64,(.+)$/);
      if (match) {
        ext = match[1] === "jpeg" ? "jpg" : match[1].replace("+xml", "");
        base64Data = match[2];
      }
    }

    // Identify user folder name (e.g. username 'manager', 'cashier01', or userId)
    let userFolderName = "general";
    if (username) {
      userFolderName = String(username).replace(/[^a-zA-Z0-9_-]/g, "_").toLowerCase();
    } else if (userId) {
      // Check if username known in DB
      if (fs.existsSync(DB_FILE)) {
        try {
          const fileData = JSON.parse(fs.readFileSync(DB_FILE, "utf-8")) || {};
          const matchedUser = (fileData.users || []).find((u: any) => u.id === userId);
          if (matchedUser && matchedUser.username) {
            userFolderName = String(matchedUser.username).replace(/[^a-zA-Z0-9_-]/g, "_").toLowerCase();
          } else {
            userFolderName = `u_${String(userId).replace(/[^a-zA-Z0-9_-]/g, "_")}`;
          }
        } catch {}
      } else {
        userFolderName = `u_${String(userId).replace(/[^a-zA-Z0-9_-]/g, "_")}`;
      }
    }

    const { folderPath, folderRel } = ensureUserUploadFolder(userFolderName);

    const safePrefix = type ? `${type}_` : "img_";
    const uniqueFileName = filename
      ? `${Date.now()}_${filename.replace(/[^a-zA-Z0-9._-]/g, "")}`
      : `${safePrefix}${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}.${ext}`;

    const filePath = path.join(folderPath, uniqueFileName);
    const buffer = Buffer.from(base64Data, "base64");

    // Asynchronous non-blocking disk write
    await fs.promises.writeFile(filePath, buffer);

    const publicUrl = `/uploads/${folderRel}/${uniqueFileName}`;
    return res.json({
      success: true,
      url: publicUrl,
      filename: uniqueFileName,
      userFolder: folderRel,
      sizeBytes: buffer.length,
      userId: userId || null,
      message: `Image uploaded and saved to Ubuntu Server storage in /uploads/${folderRel}/`
    });
  } catch (err: any) {
    console.error("Upload error on server:", err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// POST Video Upload Handler (Stores video tutorials directly on Ubuntu Server disk in /uploads/videos/)
app.post("/api/upload-video", async (req, res) => {
  try {
    if (!fs.existsSync(VIDEOS_DIR)) {
      fs.mkdirSync(VIDEOS_DIR, { recursive: true });
    }

    const contentType = req.headers["content-type"] || "";
    let finalFileName = "";
    let fileSizeBytes = 0;

    // Support direct binary stream upload
    if (contentType.includes("video/") || contentType.includes("application/octet-stream")) {
      const headerFilename = (req.headers["x-filename"] as string) || "tutorial_a2hs.mp4";
      const cleanExt = path.extname(headerFilename) || ".mp4";
      const baseName = path.basename(headerFilename, cleanExt).replace(/[^a-zA-Z0-9_-]/g, "_");
      finalFileName = `tutorial_${Date.now()}_${baseName}${cleanExt}`;
      const destPath = path.join(VIDEOS_DIR, finalFileName);

      const writeStream = fs.createWriteStream(destPath);
      await new Promise<void>((resolve, reject) => {
        req.pipe(writeStream);
        req.on("error", reject);
        writeStream.on("finish", () => {
          fileSizeBytes = fs.statSync(destPath).size;
          resolve();
        });
        writeStream.on("error", reject);
      });
    } else {
      // JSON body with base64 data
      const { video, filename, title } = req.body;
      if (!video) {
        return res.status(400).json({ success: false, error: "No video data provided" });
      }

      let ext = ".mp4";
      let base64Content = video;

      if (typeof video === "string" && video.startsWith("data:video/")) {
        const match = video.match(/^data:video\/([a-zA-Z0-9+.-]+);base64,(.+)$/);
        if (match) {
          ext = `.${match[1] === "quicktime" ? "mov" : match[1]}`;
          base64Content = match[2];
        }
      }

      const cleanFileName = filename
        ? `${Date.now()}_${filename.replace(/[^a-zA-Z0-9._-]/g, "")}`
        : `tutorial_${Date.now()}${ext}`;
      finalFileName = cleanFileName;
      const destPath = path.join(VIDEOS_DIR, finalFileName);

      const buffer = Buffer.from(base64Content, "base64");
      await fs.promises.writeFile(destPath, buffer);
      fileSizeBytes = buffer.length;
    }

    const publicUrl = `/uploads/videos/${finalFileName}`;

    // Auto-update database.json settings
    let fileData: any = {};
    if (fs.existsSync(DB_FILE)) {
      try {
        fileData = JSON.parse(fs.readFileSync(DB_FILE, "utf-8")) || {};
      } catch {}
    }
    if (!fileData.settings) {
      fileData.settings = {};
    }
    fileData.settings.tutorialVideoUrl = publicUrl;
    if (req.body?.title) {
      fileData.settings.tutorialVideoTitle = req.body.title;
    }
    fileData.updatedAt = new Date().toISOString();
    await fs.promises.writeFile(DB_FILE, JSON.stringify(fileData, null, 2), "utf-8");

    return res.json({
      success: true,
      url: publicUrl,
      filename: finalFileName,
      sizeBytes: fileSizeBytes,
      message: "Video tutorial uploaded and saved to Ubuntu Server in /uploads/videos/"
    });
  } catch (err: any) {
    console.error("Video upload error on server:", err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// GET Tutorial Video Settings
app.get("/api/settings/tutorial-video", (req, res) => {
  try {
    let fileData: any = {};
    if (fs.existsSync(DB_FILE)) {
      try {
        fileData = JSON.parse(fs.readFileSync(DB_FILE, "utf-8")) || {};
      } catch {}
    }
    return res.json({
      success: true,
      tutorialVideoUrl: fileData?.settings?.tutorialVideoUrl || null,
      tutorialVideoTitle: fileData?.settings?.tutorialVideoTitle || "របៀបដំឡើង MINI MART POS លើទូរស័ព្ទ (Add to Home Screen)"
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// POST Save Tutorial Video Settings
app.post("/api/settings/tutorial-video", async (req, res) => {
  try {
    const { videoUrl, title } = req.body;
    let fileData: any = {};
    if (fs.existsSync(DB_FILE)) {
      try {
        fileData = JSON.parse(fs.readFileSync(DB_FILE, "utf-8")) || {};
      } catch {}
    }
    if (!fileData.settings) {
      fileData.settings = {};
    }
    fileData.settings.tutorialVideoUrl = videoUrl;
    if (title !== undefined) {
      fileData.settings.tutorialVideoTitle = title;
    }
    fileData.updatedAt = new Date().toISOString();
    await fs.promises.writeFile(DB_FILE, JSON.stringify(fileData, null, 2), "utf-8");
    return res.json({ success: true, settings: fileData.settings });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE Tutorial Video Settings
app.delete("/api/settings/tutorial-video", async (req, res) => {
  try {
    let fileData: any = {};
    if (fs.existsSync(DB_FILE)) {
      try {
        fileData = JSON.parse(fs.readFileSync(DB_FILE, "utf-8")) || {};
      } catch {}
    }
    const existingUrl = fileData?.settings?.tutorialVideoUrl;
    if (existingUrl && existingUrl.startsWith("/uploads/videos/")) {
      const fileName = path.basename(existingUrl);
      const filePath = path.join(VIDEOS_DIR, fileName);
      if (fs.existsSync(filePath)) {
        try {
          fs.unlinkSync(filePath);
        } catch {}
      }
    }
    if (fileData.settings) {
      delete fileData.settings.tutorialVideoUrl;
      delete fileData.settings.tutorialVideoTitle;
    }
    fileData.updatedAt = new Date().toISOString();
    await fs.promises.writeFile(DB_FILE, JSON.stringify(fileData, null, 2), "utf-8");
    return res.json({ success: true, message: "Tutorial video removed from server" });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// GET Products (Optionally filtered by userId)
app.get("/api/products", (req, res) => {
  try {
    const { userId } = req.query;
    let fileData: any = {};
    if (fs.existsSync(DB_FILE)) {
      try {
        fileData = JSON.parse(fs.readFileSync(DB_FILE, "utf-8")) || {};
      } catch {}
    }

    let products = Array.isArray(fileData.products) ? fileData.products : [];
    // Ensure all products have a valid userId
    products = products.map((p: any) => ({
      ...p,
      userId: p.userId || "user-admin"
    }));

    if (userId && typeof userId === "string" && userId !== "all") {
      if (userId === "user-admin") {
        products = products.filter((p: any) => p.userId === "user-admin" || !p.userId);
      } else {
        products = products.filter((p: any) => p.userId === userId);
      }
    }

    return res.json({ success: true, products });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// POST Save / Update Product on Ubuntu Server
app.post("/api/products", (req, res) => {
  try {
    const product = req.body;
    if (!product || !product.id) {
      return res.status(400).json({ success: false, error: "Missing product id or invalid product data" });
    }

    // Ensure product has userId
    if (!product.userId) {
      product.userId = "user-admin";
    }

    let fileData: any = {};
    if (fs.existsSync(DB_FILE)) {
      try {
        fileData = JSON.parse(fs.readFileSync(DB_FILE, "utf-8")) || {};
      } catch {}
    }

    const currentProds = Array.isArray(fileData.products) ? fileData.products : [];
    const exists = currentProds.some((p: any) => p.id === product.id);
    const updatedProds = exists
      ? currentProds.map((p: any) => (p.id === product.id ? { ...p, ...product } : p))
      : [product, ...currentProds];

    fileData.products = updatedProds;
    fileData.updatedAt = new Date().toISOString();

    fs.writeFileSync(DB_FILE, JSON.stringify(fileData, null, 2), "utf-8");
    return res.json({ success: true, message: "Product saved on Ubuntu Server", product });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE Product on Ubuntu Server
app.delete("/api/products/:id", (req, res) => {
  try {
    const productId = req.params.id;
    if (!productId) {
      return res.status(400).json({ success: false, error: "Missing product ID" });
    }

    let fileData: any = {};
    if (fs.existsSync(DB_FILE)) {
      try {
        fileData = JSON.parse(fs.readFileSync(DB_FILE, "utf-8")) || {};
      } catch {}
    }

    const currentProds = Array.isArray(fileData.products) ? fileData.products : [];
    fileData.products = currentProds.filter((p: any) => p.id !== productId);
    fileData.updatedAt = new Date().toISOString();

    fs.writeFileSync(DB_FILE, JSON.stringify(fileData, null, 2), "utf-8");
    return res.json({ success: true, message: "Product deleted from Ubuntu Server" });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// POST Save / Update Order on Ubuntu Server
app.post("/api/orders", (req, res) => {
  try {
    const order = req.body;
    if (!order || !order.id) {
      return res.status(400).json({ success: false, error: "Missing order id" });
    }

    let fileData: any = {};
    if (fs.existsSync(DB_FILE)) {
      try {
        fileData = JSON.parse(fs.readFileSync(DB_FILE, "utf-8")) || {};
      } catch {}
    }

    const currentOrders = Array.isArray(fileData.orders) ? fileData.orders : [];
    const exists = currentOrders.some((o: any) => o.id === order.id);
    const updatedOrders = exists
      ? currentOrders.map((o: any) => (o.id === order.id ? { ...o, ...order } : o))
      : [order, ...currentOrders];

    fileData.orders = updatedOrders;
    fileData.updatedAt = new Date().toISOString();

    fs.writeFileSync(DB_FILE, JSON.stringify(fileData, null, 2), "utf-8");
    return res.json({ success: true, message: "Order saved on Ubuntu Server", order });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE Order on Ubuntu Server
app.delete("/api/orders/:id", (req, res) => {
  try {
    const orderId = req.params.id;
    if (!orderId) {
      return res.status(400).json({ success: false, error: "Missing order ID" });
    }

    let fileData: any = {};
    if (fs.existsSync(DB_FILE)) {
      try {
        fileData = JSON.parse(fs.readFileSync(DB_FILE, "utf-8")) || {};
      } catch {}
    }

    const currentOrders = Array.isArray(fileData.orders) ? fileData.orders : [];
    fileData.orders = currentOrders.filter((o: any) => o.id !== orderId);
    fileData.updatedAt = new Date().toISOString();

    fs.writeFileSync(DB_FILE, JSON.stringify(fileData, null, 2), "utf-8");
    return res.json({ success: true, message: "Order deleted from Ubuntu Server" });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// POST Save / Update Expense on Ubuntu Server
app.post("/api/expenses", (req, res) => {
  try {
    const expense = req.body;
    if (!expense || !expense.id) {
      return res.status(400).json({ success: false, error: "Missing expense id" });
    }

    let fileData: any = {};
    if (fs.existsSync(DB_FILE)) {
      try {
        fileData = JSON.parse(fs.readFileSync(DB_FILE, "utf-8")) || {};
      } catch {}
    }

    const currentExpenses = Array.isArray(fileData.expenses) ? fileData.expenses : [];
    const exists = currentExpenses.some((e: any) => e.id === expense.id);
    const updatedExpenses = exists
      ? currentExpenses.map((e: any) => (e.id === expense.id ? { ...e, ...expense } : e))
      : [expense, ...currentExpenses];

    fileData.expenses = updatedExpenses;
    fileData.updatedAt = new Date().toISOString();

    fs.writeFileSync(DB_FILE, JSON.stringify(fileData, null, 2), "utf-8");
    return res.json({ success: true, message: "Expense saved on Ubuntu Server", expense });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE Expense on Ubuntu Server
app.delete("/api/expenses/:id", (req, res) => {
  try {
    const expenseId = req.params.id;
    if (!expenseId) {
      return res.status(400).json({ success: false, error: "Missing expense ID" });
    }

    let fileData: any = {};
    if (fs.existsSync(DB_FILE)) {
      try {
        fileData = JSON.parse(fs.readFileSync(DB_FILE, "utf-8")) || {};
      } catch {}
    }

    const currentExpenses = Array.isArray(fileData.expenses) ? fileData.expenses : [];
    fileData.expenses = currentExpenses.filter((e: any) => e.id !== expenseId);
    fileData.updatedAt = new Date().toISOString();

    fs.writeFileSync(DB_FILE, JSON.stringify(fileData, null, 2), "utf-8");
    return res.json({ success: true, message: "Expense deleted from Ubuntu Server" });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE Customer on Ubuntu Server
app.delete("/api/customers/:id", (req, res) => {
  try {
    const customerId = req.params.id;
    if (!customerId) {
      return res.status(400).json({ success: false, error: "Missing customer ID" });
    }

    let fileData: any = {};
    if (fs.existsSync(DB_FILE)) {
      try {
        fileData = JSON.parse(fs.readFileSync(DB_FILE, "utf-8")) || {};
      } catch {}
    }

    const currentCustomers = Array.isArray(fileData.customers) ? fileData.customers : [];
    fileData.customers = currentCustomers.filter((c: any) => c.id !== customerId);
    fileData.updatedAt = new Date().toISOString();

    fs.writeFileSync(DB_FILE, JSON.stringify(fileData, null, 2), "utf-8");
    return res.json({ success: true, message: "Customer deleted from Ubuntu Server" });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// GET Users on Ubuntu Server
app.get("/api/users", (req, res) => {
  try {
    let fileUsers: any[] = [];
    if (fs.existsSync(DB_FILE)) {
      const fileData = JSON.parse(fs.readFileSync(DB_FILE, "utf-8")) || {};
      fileUsers = Array.isArray(fileData.users) ? fileData.users : [];
    }
    const finalUsers = mergeById(SEED_USERS, fileUsers);
    return res.json({ success: true, users: finalUsers });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// POST Save / Update User on Ubuntu Server
app.post("/api/users", async (req, res) => {
  try {
    const user = req.body;
    if (!user || !user.id || !user.username) {
      return res.status(400).json({ success: false, error: "Missing user information" });
    }

    // Auto create dedicated user folder in /data/uploads/:username/ on Ubuntu Server
    const { folderPath, folderRel } = ensureUserUploadFolder(user.username);

    let fileData: any = {};
    if (fs.existsSync(DB_FILE)) {
      try {
        fileData = JSON.parse(fs.readFileSync(DB_FILE, "utf-8")) || {};
      } catch {}
    }

    const currentUsers = Array.isArray(fileData.users) ? fileData.users : [];
    const exists = currentUsers.some((u: any) => u.id === user.id || u.username?.toLowerCase() === user.username.toLowerCase());
    const updatedUsers = exists
      ? currentUsers.map((u: any) => (u.id === user.id || u.username?.toLowerCase() === user.username.toLowerCase()) ? { ...u, ...user } : u)
      : [user, ...currentUsers];

    fileData.users = updatedUsers;
    fileData.updatedAt = new Date().toISOString();

    await writeJsonFileAsync(DB_FILE, fileData);
    return res.json({ 
      success: true, 
      message: `User saved on Ubuntu Server with dedicated upload directory /uploads/${folderRel}/`, 
      user,
      uploadFolder: `/uploads/${folderRel}/`
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE User on Ubuntu Server
app.delete("/api/users/:id", async (req, res) => {
  try {
    const userId = req.params.id;
    if (!userId) {
      return res.status(400).json({ success: false, error: "Missing user ID" });
    }

    let fileData: any = {};
    if (fs.existsSync(DB_FILE)) {
      try {
        fileData = JSON.parse(fs.readFileSync(DB_FILE, "utf-8")) || {};
      } catch {}
    }

    const currentUsers = Array.isArray(fileData.users) ? fileData.users : [];
    // Protect primary root admin
    const targetUser = currentUsers.find((u: any) => u.id === userId);
    if (targetUser && targetUser.username === "admin") {
      return res.status(403).json({ success: false, error: "Cannot delete root admin account" });
    }

    fileData.users = currentUsers.filter((u: any) => u.id !== userId);
    fileData.updatedAt = new Date().toISOString();

    await writeJsonFileAsync(DB_FILE, fileData);
    return res.json({ success: true, message: "User deleted from Ubuntu Server" });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// GET Database snapshot from server local file
app.get("/api/db", (req, res) => {
  try {
    if (fs.existsSync(DB_FILE)) {
      const content = fs.readFileSync(DB_FILE, "utf-8");
      const parsed = JSON.parse(content);
      if (parsed) {
        if (Array.isArray(parsed.products)) {
          parsed.products = parsed.products.map((p: any) => ({
            ...p,
            userId: p.userId || "user-admin"
          }));
        }
        const fileUsers = Array.isArray(parsed.users) ? parsed.users : [];
        parsed.users = mergeById(SEED_USERS, fileUsers);
      }
      return res.json({ success: true, data: parsed });
    }
    return res.json({ 
      success: true, 
      data: {
        users: SEED_USERS,
        products: [],
        orders: [],
        expenses: [],
        customers: [],
        tables: []
      }, 
      message: "Initialized server snapshot" 
    });
  } catch (err: any) {
    console.error("Error reading database file:", err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// POST Database snapshot to server local file (Persist on Ubuntu filesystem with safe merge)
app.post("/api/db", async (req, res) => {
  try {
    const payload = req.body;
    if (!payload || typeof payload !== "object") {
      return res.status(400).json({ success: false, error: "Invalid database payload" });
    }

    let existingData: any = {};
    if (fs.existsSync(DB_FILE)) {
      try {
        existingData = JSON.parse(fs.readFileSync(DB_FILE, "utf-8")) || {};
      } catch {}
    }

    const rawProducts = Array.isArray(payload.products) ? payload.products : (existingData.products || []);
    const normalizedProducts = rawProducts.map((p: any) => ({
      ...p,
      userId: p.userId || "user-admin"
    }));

    const rawOrders = Array.isArray(payload.orders) ? payload.orders : (existingData.orders || []);
    const normalizedOrders = rawOrders.map((o: any) => ({
      ...o,
      userId: o.userId || "user-admin"
    }));

    const rawExpenses = Array.isArray(payload.expenses) ? payload.expenses : (existingData.expenses || []);
    const normalizedExpenses = rawExpenses.map((e: any) => ({
      ...e,
      userId: e.userId || "user-admin"
    }));

    const rawCustomers = Array.isArray(payload.customers) ? payload.customers : (existingData.customers || []);
    const normalizedCustomers = rawCustomers.map((c: any) => ({
      ...c,
      userId: c.userId || "user-admin"
    }));

    const existingUsers = Array.isArray(existingData.users) ? existingData.users : [];
    const incomingUsers = Array.isArray(payload.users) ? payload.users : [];
    // Ensure SEED_USERS + existingUsers + incomingUsers are preserved and never lost
    const mergedUsers = mergeById(mergeById(SEED_USERS, existingUsers), incomingUsers);

    // Auto ensure directories for all merged users
    for (const u of mergedUsers) {
      if (u && u.username) {
        ensureUserUploadFolder(u.username);
      }
    }

    const mergedData = {
      ...existingData,
      ...payload,
      products: normalizedProducts,
      orders: normalizedOrders,
      expenses: normalizedExpenses,
      customers: normalizedCustomers,
      tables: Array.isArray(payload.tables) ? payload.tables : existingData.tables,
      users: mergedUsers,
      settings: payload.settings || existingData.settings,
      logs: mergeById(existingData.logs, payload.logs),
      upgradeRequests: mergeById(existingData.upgradeRequests, payload.upgradeRequests),
      updatedAt: new Date().toISOString()
    };

    // Write formatted JSON to database.json asynchronously
    await writeJsonFileAsync(DB_FILE, mergedData);
    return res.json({
      success: true,
      message: "Database saved successfully on local server",
      timestamp: mergedData.updatedAt
    });
  } catch (err: any) {
    console.error("Error saving database file:", err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// Export Database as downloadable JSON file
app.get("/api/db/export", (req, res) => {
  try {
    if (fs.existsSync(DB_FILE)) {
      res.setHeader("Content-Disposition", `attachment; filename=minipos_backup_${Date.now()}.json`);
      res.setHeader("Content-Type", "application/json");
      return fs.createReadStream(DB_FILE).pipe(res);
    }
    return res.status(404).json({ success: false, error: "Database file not found yet" });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

async function startServer() {
  const distPath = path.join(process.cwd(), "dist");
  const hasDistIndex = fs.existsSync(path.join(distPath, "index.html"));
  const isProduction = process.env.NODE_ENV === "production" || (hasDistIndex && process.env.NODE_ENV !== "development");

  if (!isProduction) {
    // Vite middleware in development
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Static file serving in production
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  const server = app.listen(PORT, "0.0.0.0", () => {
    console.log(`Self-Hosted POS Server is running on http://0.0.0.0:${PORT} (${isProduction ? 'Production' : 'Development'})`);
  });

  server.on("error", (e: any) => {
    if (e.code === "EADDRINUSE") {
      console.error(`\n❌ Error: Port ${PORT} is already in use by another process.`);
      console.error(`👉 Run 'sudo fuser -k ${PORT}/tcp' or 'npx kill-port ${PORT}' or check PM2 status.\n`);
    } else {
      console.error("Server error:", e);
    }
  });
}

startServer();
