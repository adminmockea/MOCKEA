import SystemConfig from "../model/systemConfig.js";

// Helper function to normalize URLs (e.g. drive.google.com -> https://drive.google.com)
const normalizeUrl = (url) => {
  if (!url || typeof url !== "string") return "";
  const trimmed = url.trim();
  if (!trimmed) return "";
  if (!/^https?:\/\//i.test(trimmed) && !trimmed.startsWith("/")) {
    return `https://${trimmed}`;
  }
  return trimmed;
};

// GET /api/settings/watch-demo
export const getWatchDemoConfig = async (req, res) => {
  try {
    let config = await SystemConfig.findOne();
    if (!config) {
      config = new SystemConfig();
      await config.save();
    }
    return res.status(200).json({
      success: true,
      watchDemoUrl: config.watchDemoUrl || "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      watchDemoEnabled: config.watchDemoEnabled !== undefined ? config.watchDemoEnabled : true,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// PUT /api/settings/watch-demo (Admin / SuperAdmin)
export const updateWatchDemoConfig = async (req, res) => {
  try {
    const { watchDemoUrl, watchDemoEnabled } = req.body;

    let config = await SystemConfig.findOne();
    if (!config) {
      config = new SystemConfig();
    }

    if (watchDemoUrl !== undefined) {
      config.watchDemoUrl = normalizeUrl(watchDemoUrl);
    }
    if (watchDemoEnabled !== undefined) {
      config.watchDemoEnabled = Boolean(watchDemoEnabled);
    }

    await config.save();

    return res.status(200).json({
      success: true,
      message: "Watch Demo settings updated successfully",
      watchDemoUrl: config.watchDemoUrl,
      watchDemoEnabled: config.watchDemoEnabled,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
