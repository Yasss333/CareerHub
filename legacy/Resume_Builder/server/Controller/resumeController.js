import imageKit from "../config/imageKit.js";
import Resume from "../models/resuem.model.js";
import fs from "fs";

const normalizeResumeForClient = (resumeDoc) => {
  const resume = typeof resumeDoc?.toObject === "function" ? resumeDoc.toObject() : { ...resumeDoc };
  const personalInfo = resume.personal_info || {};
  return {
    ...resume,
    professional_summary: resume.professional_summary ?? resume.proffession_summary ?? "",
    personal_info: {
      ...personalInfo,
      profession: personalInfo.profession ?? personalInfo.proffesion ?? "",
    },
    experience: Array.isArray(resume.experience)
      ? resume.experience.map((exp) => ({
          ...exp ,
          position: exp.position ?? exp.positon ?? "",
        }))
      : [] ,
    project: Array.isArray(resume.project)
      ? resume.project
      : Array.isArray(resume.projects)
        ? resume.projects
        : [] ,
  };
};

const normalizeResumeForDb = (resumeData) => {
  const normalized = structuredClone(resumeData || {});
  const personalInfo = normalized.personal_info || {};

  if (normalized.professional_summary !== undefined) {
    normalized.proffession_summary = normalized.professional_summary;
    delete normalized.professional_summary;
  }

  if (personalInfo.profession !== undefined) {
    personalInfo.proffesion = personalInfo.profession;
    delete personalInfo.profession;
  }
  normalized.personal_info = personalInfo;

  if (Array.isArray(normalized.experience)) {
    normalized.experience = normalized.experience.map((exp) => {
      const mapped = { ...exp };
      if (mapped.position !== undefined) {
        mapped.positon = mapped.position;
        delete mapped.position;
      }
      return mapped;
    });
  }

  if (Array.isArray(normalized.project) && !Array.isArray(normalized.projects)) {
    normalized.projects = normalized.project;
  }
  delete normalized.project;

  return normalized;
};

//POST :/api/resumes/create
export const createResumeHandler = async (req, res) => {
  //get title, userId from middleware, create resume, and return response
  try {
    const userId = req.userId;
    const { title, profile } = req.body;

    const resume = await Resume.create({ userId, title, profile });
    return res
      .status(200)
      .json({ message: "Successfully created your resume", resume: resume });
  } catch (error) {
    return res
      .status(400)
      .json({ message: "Failed to create the resume ", error: error.message });
  }
};

//delete :/api/resume/delete

export const deleteResumehandler = async (req, res) => {
  try {
    const userId = req.userId;
    const { resumeId } = req.params;
    const deletedresume = await Resume.deleteOne({ userId, _id: resumeId });

    return res.status(200).json({ message: "Resume Deleted Succesfully " });
  } catch (error) {
    return res
      .status(400)
      .json({ message: "Failed to delete the resume ", error: error.message });
  }
};

//getreusme by id

export const getResumeById = async (req, res) => {
  try {
    const userId = req.userId;
    const { resumeId } = req.params;
    const resume = await Resume.findOne({ userId, _id: resumeId });

    if (!resume) {
      return res.status(400).json({ message: "Failed to get resume " });
    }
    resume.__v = undefined;
    resume.createdAt = undefined;
    resume.updatedAt = undefined;
    return res.status(200).json({
      message: "Resume diplayed Succesfully ",
      resume: normalizeResumeForClient(resume),
    });
  } catch (error) {
    return res
      .status(400)
      .json({ message: "Failed to get the resume ", error: error.message });
  }
};

export const getPublicResumeById = async (req, res) => {
  try {
    const { resumeId } = req.params;
    const resume = await Resume.findOne({ public: true, _id: resumeId });
    if (!resume) {
      return res
        .status(401)
        .json({ message: "Either resume not public or no such resume." });
    }

    return res.status(200).json({ resume: normalizeResumeForClient(resume) });
  } catch (error) {
    return res
      .status(400)
      .json({
        message: "Failed to get this public resume.",
        error: error.message,
      });
  }
};

export const getPublicResumesHandler = async (req, res) => {
  try {
    const resumes = await Resume.find({ public: true })
      .sort({ updatedAt: -1 })
      .populate("userId", "name");
    
    const publicResumes = resumes.map((resume) => ({
      _id: resume._id,
      title: resume.title,
      profile: resume.profile,
      personal_info: resume.personal_info,
      updatedAt: resume.updatedAt,
      userName: resume.userId?.name || "Unknown",
    }));

    return res.status(200).json({ resumes: publicResumes });
  } catch (error) {
    return res
      .status(400)
      .json({ message: "Failed to fetch public resumes", error: error.message });
  }
};

export const updateResumeHandler = async (req, res) => {
  try {
    const userId = req.userId;
    const { resumeId, resumeData, removeBackground } = req.body;
    const image = req.file;
    const shouldRemoveBackground =
      removeBackground === true ||
      removeBackground === "true" ||
      removeBackground === "1" ||
      removeBackground === "yes";
    let resumeDataCopy;
    if (typeof resumeData === "string") {
      resumeDataCopy = await JSON.parse(resumeData);
    } else {
      resumeDataCopy = structuredClone(resumeData);
    }

    resumeDataCopy = normalizeResumeForDb(resumeDataCopy);
    if (image) {
      const bufferData = fs.createReadStream(image.path);
      const uploadResponse = await imageKit.files.upload({
        file: bufferData,
        fileName: `resume-${Date.now()}.png`,
        folder: "user-resumes",
      });

      // Use delivery-time transforms for better reliability:
      // - c-thumb + fo-face keeps the face centered in a square avatar
      // - e-bgremove removes background when enabled
      const transforms = ["w-400", "h-400", "c-thumb", "fo-face"];
      if (shouldRemoveBackground) transforms.push("e-bgremove");

      resumeDataCopy.personal_info.image = `${uploadResponse.url}?tr=${transforms.join(",")}`;
    }
    // Debug logs
    console.log('updateResumeHandler debug:', {
      userId,
      resumeId,
      resumeDataCopy
    });

    const resume = await Resume.findOneAndUpdate(
      { userId, _id: resumeId },
      resumeDataCopy,
      { new: true },
    );
    return res.status(200).json({
      message: "Saved Succesfully ",
      resume: normalizeResumeForClient(resume),
    });
  } catch (error) {
    console.error("failed to update the resume", error);
    return res.status(400).json({ message: "Failed to update resume", error: error.message, stack: error.stack });
  }
};
