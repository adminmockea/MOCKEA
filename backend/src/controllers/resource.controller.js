import Resource from "../model/Resource.js";
import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
}

export const getAllResources = async (req, res) => {
  try {
    const resources = await Resource.find({ 
      status: "Approved", 
      isFeaturedOnRegister: { $ne: true } 
    }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, resources });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getAllResourcesForManagement = async (req, res) => {
  try {
    const resources = await Resource.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, resources });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const incrementDownload = async (req, res) => {
  try {
    const resource = await Resource.findByIdAndUpdate(
      req.params.id,
      { $inc: { downloadCount: 1 } },
      { returnDocument: 'after' }
    );
    if (!resource) {
      return res.status(404).json({ success: false, message: "Resource not found" });
    }
    res.status(200).json({ success: true, downloadCount: resource.downloadCount });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getFeaturedBook = async (req, res) => {
  try {
    const { examType } = req.query;
    let query = { status: "Approved" };
    if (examType) {
      query.examType = { $in: [examType, "Both"] };
    }
    
    // First try to find explicit featured book
    let featuredBook = await Resource.findOne({ ...query, isFeaturedOnRegister: true }).sort({ updatedAt: -1 });
    
    // Fallback to the latest approved book or resource
    if (!featuredBook) {
      featuredBook = await Resource.findOne(query).sort({ createdAt: -1 });
    }

    if (!featuredBook) {
      // Default fallback object if DB has no books yet
      featuredBook = {
        _id: "default-book-id",
        title: "Ultimate PTE & IELTS Academic Masterclass 2026",
        description: "150+ Pages of certified vocabulary lists, high-scoring speaking templates, AI essay scoring formulas, and practice tips.",
        ctaText: "Download Free E-Book",
        link: "/books/mockea-ultimate-prep-guide.pdf",
        imageUrl: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=800&q=80",
        category: "General",
        fileType: "PDF",
        size: "14.8 MB",
        downloadCount: 12450,
        isFeaturedOnRegister: true,
      };
    }

    res.status(200).json({ success: true, featuredBook });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createResource = async (req, res) => {
  try {
    const resourceData = { ...req.body };
    resourceData.addedBy = req.user?.email || req.decoded_email || "system@mockea.com";
    resourceData.status = req.user?.role === "admin" ? "Approved" : "Pending";

    if (resourceData.isFeaturedOnRegister) {
      await Resource.updateMany({}, { isFeaturedOnRegister: false });
    }

    const resource = new Resource(resourceData);
    await resource.save();
    res.status(201).json({ success: true, resource });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateResource = async (req, res) => {
  try {
    const updateData = { ...req.body };
    
    // Instructors updates go back to Pending
    if (req.user?.role === "instructor") {
      updateData.status = "Pending";
      updateData.addedBy = req.user.email;
    }

    if (updateData.isFeaturedOnRegister) {
      await Resource.updateMany({ _id: { $ne: req.params.id } }, { isFeaturedOnRegister: false });
    }

    const resource = await Resource.findByIdAndUpdate(
      req.params.id,
      updateData,
      { returnDocument: 'after', runValidators: true }
    );
    if (!resource) {
      return res.status(404).json({ success: false, message: "Resource not found" });
    }
    res.status(200).json({ success: true, resource });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteResource = async (req, res) => {
  try {
    const resource = await Resource.findByIdAndDelete(req.params.id);
    if (!resource) {
      return res.status(404).json({ success: false, message: "Resource not found" });
    }
    res.status(200).json({ success: true, message: "Resource deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const formatFileSize = (bytes) => {
  if (!bytes || bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
};

export const uploadResourceFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "No file was uploaded" });
    }

    const isCover = req.file.fieldname === "cover";
    const subfolder = isCover ? "covers" : "resources";
    const cloudinaryFolder = `mockea/${subfolder}`;
    const ext = req.file.originalname.split(".").pop().toLowerCase();

    // Determine Cloudinary resource_type dynamically:
    // Cloudinary allows public unrestricted access to 'image' (which includes PDFs) and 'video'.
    // Do NOT set 'raw' as default because Cloudinary restricts public delivery of 'raw' files (HTTP 401).
    let resourceType = "auto";
    if (isCover || ["png", "jpg", "jpeg", "webp", "gif", "svg", "pdf"].includes(ext)) {
      resourceType = "image";
    } else if (["mp3", "wav", "mp4", "webm", "m4a"].includes(ext)) {
      resourceType = "video";
    }

    const uploadResult = await cloudinary.uploader.upload(req.file.path, {
      folder: cloudinaryFolder,
      resource_type: resourceType,
      use_filename: true,
      unique_filename: true,
    });

    // Clean up local temporary file safely
    try {
      if (req.file.path && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
    } catch (cleanupErr) {
      console.warn("[uploadResourceFile] Temp file cleanup warning:", cleanupErr.message);
    }

    const uppercaseExt = ext.toUpperCase();
    const formattedSize = formatFileSize(req.file.size || uploadResult.bytes);

    res.status(200).json({
      success: true,
      url: uploadResult.secure_url,
      publicId: uploadResult.public_id,
      fileType: uppercaseExt,
      size: formattedSize,
      originalName: req.file.originalname,
    });
  } catch (error) {
    if (req.file?.path && fs.existsSync(req.file.path)) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (_) {}
    }
    console.error("[uploadResourceFile] Cloudinary upload error:", error);
    res.status(500).json({ success: false, message: error.message || "Failed to upload file to Cloudinary" });
  }
};

export const downloadResourceFileStream = async (req, res) => {
  try {
    const resource = await Resource.findById(req.params.id);
    if (!resource || !resource.link) {
      return res.status(404).json({ success: false, message: "Resource or file not found" });
    }

    // Increment download count
    await Resource.findByIdAndUpdate(req.params.id, { $inc: { downloadCount: 1 } });

    const fileUrl = resource.link;

    // If it's a non-cloudinary URL or external web link, redirect directly
    if (!fileUrl.includes("res.cloudinary.com") || resource.fileType === "LINK") {
      return res.redirect(fileUrl);
    }

    const ext = resource.fileType ? resource.fileType.toLowerCase() : "pdf";
    const filename = `${resource.title.toLowerCase().replace(/[^a-z0-9]/g, "_")}.${ext}`;

    const mimeTypes = {
      pdf: "application/pdf",
      docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      zip: "application/zip",
      epub: "application/epub+zip",
      mp3: "audio/mpeg",
      mp4: "video/mp4",
      jpg: "image/jpeg",
      png: "image/png",
      webp: "image/webp",
    };

    const contentType = mimeTypes[ext] || "application/octet-stream";

    // Clean any auto format / transformation flags from Cloudinary URL
    let cleanUrl = fileUrl
      .replace(/\/f_auto,q_auto\/?/g, "/")
      .replace(/\/f_auto\/?/g, "/")
      .replace(/\/q_auto\/?/g, "/")
      .replace(/\/fl_attachment\/?/g, "/");

    let fileResponse = await fetch(cleanUrl);
    
    // Fallback try if cleanUrl returned non-200 (e.g. raw path variant)
    if (!fileResponse.ok && cleanUrl.includes("/image/upload/")) {
      const rawUrl = cleanUrl.replace("/image/upload/", "/raw/upload/");
      const rawResponse = await fetch(rawUrl);
      if (rawResponse.ok) {
        fileResponse = rawResponse;
      }
    } else if (!fileResponse.ok && cleanUrl.includes("/raw/upload/")) {
      const imgUrl = cleanUrl.replace("/raw/upload/", "/image/upload/");
      const imgResponse = await fetch(imgUrl);
      if (imgResponse.ok) {
        fileResponse = imgResponse;
      }
    }

    if (!fileResponse.ok) {
      return res.redirect(cleanUrl);
    }

    res.setHeader("Content-Type", contentType);
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);

    const arrayBuffer = await fileResponse.arrayBuffer();
    return res.send(Buffer.from(arrayBuffer));
  } catch (error) {
    console.error("[downloadResourceFileStream] Error:", error);
    res.status(500).json({ success: false, message: "Failed to download resource file" });
  }
};


