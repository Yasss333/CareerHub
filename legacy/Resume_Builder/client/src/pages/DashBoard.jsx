import React, { useEffect, useState } from "react";
import {
  FilePenLineIcon,
  LoaderCircleIcon,
  PenBoxIcon,
  Plus,
  Trash2Icon,
  UploadCloudIcon,
  XIcon,
} from "lucide-react";

import api from "../../configs/api";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import toast from "react-hot-toast";
import pdfToText from "react-pdftotext";

const DashBoard = () => {
  const { token } = useSelector((state) => state.auth);

  const colors = ["#d97706", "#dc2626", "#0284c7", "#9333ea", "#16a34a"];
  const [resumes, setAllResumes] = useState([]);
  const [publicResumes, setPublicResumes] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [title, setTitle] = useState("");
  const [resumeFile, setResumeFile] = useState(null);
  const [editResumeId, setEditResumeId] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [profile, setProfile] = useState("");
  const [filterProfile, setFilterProfile] = useState("");

  const navigate = useNavigate();

  const loadAllResumes = async () => {
    if (!token) return;
    try {
      const { data } = await api.get("/api/user/resumes", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAllResumes(Array.isArray(data.resumes) ? data.resumes : []);
    } catch (error) {
      toast.error(error?.response?.data?.message || error.message);
    }
  };

  const loadPublicResumes = async () => {
    try {
      const { data } = await api.get("/api/resume/public-resumes");
      setPublicResumes(Array.isArray(data.resumes) ? data.resumes : []);
    } catch (error) {
      console.error("Failed to load public resumes", error);
    }
  };

  useEffect(() => {
    loadAllResumes();
    loadPublicResumes();
  }, [token]);

  const createResume = async (e) => {
    e.preventDefault();
    if (!token) {
      toast.error("You must be logged in to create a resume.");
      return;
    }

    try {
      const { data } = await api.post(
        "/api/resume/create",
        { title, profile },
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      setAllResumes((prev) => [...prev, data.resume]);
      setTitle("");
      setProfile("");
      setShowCreateModal(false);
      navigate(`/app/builder/${data.resume._id}`);
    } catch (error) {
      toast.error(error?.response?.data?.message || error.message);
    }
  };

  const uploadResume = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (!resumeFile) {
        toast.error("Please select a PDF file.");
        return;
      }

      if (resumeFile.type !== "application/pdf") {
        toast.error("Please upload a valid PDF file.");
        return;
      }

      const resumeText = await pdfToText(resumeFile);
      if (!resumeText || typeof resumeText !== "string" || resumeText.trim().length === 0) {
        toast.error("Could not extract text from PDF.");
        return;
      }

      const { data } = await api.post(
        "/api/ai/upload-resume",
        { title, resumeText },
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (!data || !data.resumeId) {
        toast.error("Invalid response from server.");
        return;
      }

      setTitle("");
      setResumeFile(null);
      setShowUploadModal(false);
      toast.success("Resume uploaded successfully!");
      navigate(`/app/builder/${data.resumeId}`);
    } catch (error) {
      console.error("Upload error:", error);
      toast.error(error?.response?.data?.message || error.message || "Failed to upload resume");
    } finally {
      setIsLoading(false);
    }
  };

  const editTitle = async (e) => {
    e.preventDefault();
    if (!token) {
      toast.error("You must be logged in to update a resume.");
      return;
    }

    try {
      const resumeDataUpdate = { title };
      if (profile) resumeDataUpdate.profile = profile;

      const { data } = await api.put(
        "/api/resume/update",
        { resumeId: editResumeId, resumeData: resumeDataUpdate },
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      setAllResumes((prev) =>
        prev.map((item) =>
          item._id === editResumeId ? { ...item, title, profile: profile || item.profile } : item,
        ),
      );
      setTitle("");
      setProfile("");
      setEditResumeId("");
      toast.success(data.message);
    } catch (error) {
      toast.error(error?.response?.data?.message || error.message);
    }
  };

  const deleteResume = async (resumeId) => {
    if (!token) {
      toast.error("You must be logged in to delete a resume.");
      return;
    }

    const confirmDelete = window.confirm("Are you sure you want to delete this resume?");
    if (!confirmDelete) return;

    try {
      const { data } = await api.delete(`/api/resume/delete/${resumeId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAllResumes((prev) => prev.filter((item) => item._id !== resumeId));
      toast.success(data.message);
    } catch (error) {
      toast.error(error?.response?.data?.message || error.message);
    }
  };

  const filteredResumes = resumes.filter(
    (resumeItem) => filterProfile === "" || resumeItem.profile === filterProfile,
  );

  return (
    <div>
      <div className="max-w-7xl mx-auto px-4 py-8">
        <p className="text-2xl font-medium mb-6 bg-gray-100 text-slate-900 sm:hidden">Welcome back</p>

        <div className="flex gap-4 mb-6">
          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            className="w-full sm:max-w-36 h-48 bg-white flex flex-col items-center justify-center rounded-lg gap-3 text-slate-400 border border-dashed border-slate-300 hover:border-indigo-500 hover:shadow-lg transition-all duration-300"
          >
            <Plus className="size-11 p-2.5 bg-linear-to-r from-indigo-200 to-indigo-400 text-white rounded-full" />
            <p className="text-sm group-hover:text-indigo-400 transition-all duration-300">Create Resume</p>
          </button>

          <button
            type="button"
            onClick={() => setShowUploadModal(true)}
            className="w-full sm:max-w-36 h-48 bg-white flex flex-col items-center justify-center rounded-lg gap-3 text-slate-400 border border-dashed border-slate-300 hover:border-indigo-500 hover:shadow-lg transition-all duration-300"
          >
            <UploadCloudIcon className="size-11 p-2.5 bg-linear-to-r from-indigo-200 to-indigo-400 text-white rounded-full" />
            <p className="text-sm group-hover:text-indigo-400 transition-all duration-300">Upload Existing</p>
          </button>
        </div>

        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-xl font-semibold">My Resumes</p>
              <p className="text-sm text-slate-500">Your personal resumes are shown first.</p>
            </div>
            <div className="flex items-center gap-4">
              <label className="text-sm font-medium text-slate-700">Filter by Profile:</label>
              <select
                value={filterProfile}
                onChange={(e) => setFilterProfile(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-1 text-sm focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All</option>
                <option value="Full-stack">Full-stack</option>
                <option value="Data Science">Data Science</option>
                <option value="ML/AI">ML/AI</option>
                <option value="DevOps">DevOps</option>
                <option value="Frontend">Frontend</option>
                <option value="Backend">Backend</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredResumes.length > 0 ? (
              filteredResumes.map((resumeItem, index) => {
                const baseColor = colors[index % colors.length];
                return (
                  <button
                    key={resumeItem._id || index}
                    type="button"
                    onClick={() => navigate(`/app/builder/${resumeItem._id}`)}
                    className="group flex flex-col justify-center items-center relative w-full h-48 rounded-lg border gap-2 hover:shadow-lg transition-all duration-300 cursor-pointer"
                    style={{
                      background: `linear-gradient(135deg, ${baseColor}10, ${baseColor}40)`,
                      borderColor: baseColor + "40",
                    }}
                  >
                    <FilePenLineIcon className="size-7 group-hover:scale-105 transition-all" style={{ color: baseColor }} />
                    <p className="text-sm group-hover:scale-105 transition-all px-2 text-center" style={{ color: baseColor }}>
                      {resumeItem.title}
                    </p>
                    <p className="absolute text-[12px] bottom-1 text-slate-600 group-hover:text-slate-950 transition-all duration-300 text-center py-2" style={{ color: baseColor + "40" }}>
                      Updated on {new Date(resumeItem.updatedAt).toLocaleDateString()}
                    </p>
                    <div onClick={(e) => e.stopPropagation()} className="absolute top-1 right-1 hidden group-hover:flex items-center gap-1">
                      <Trash2Icon
                        type="button"
                        onClick={() => deleteResume(resumeItem._id)}
                        className="size-7 p-1.5 hover:bg-white rounded text-slate-700 transition-colors"
                      />
                      <PenBoxIcon
                        type="button"
                        onClick={() => {
                          setEditResumeId(resumeItem._id);
                          setTitle(resumeItem.title);
                          setProfile(resumeItem.profile || "");
                        }}
                        className="size-7 p-1.5 hover:bg-white/50 transition-colors rounded text-slate-700"
                      />
                    </div>
                  </button>
                );
              })
            ) : (
              <div className="col-span-full rounded-lg border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-slate-500">
                No resumes found.
              </div>
            )}
          </div>
        </div>

        <hr className="border-slate-800 my-6 sm:w-325" />

        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-xl font-semibold">Public Resumes</p>
              <p className="text-sm text-slate-500">View resumes shared publicly by other users.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {publicResumes.length > 0 ? (
              publicResumes.map((resumeItem, index) => {
                const baseColor = colors[index % colors.length];
                return (
                  <button
                    key={resumeItem._id || index}
                    type="button"
                    onClick={() => navigate(`/view/${resumeItem._id}`)}
                    className="group flex flex-col justify-between items-start w-full h-52 rounded-lg border p-4 gap-3 text-left hover:shadow-lg transition-all duration-300 bg-white"
                    style={{ borderColor: baseColor + "40" }}
                  >
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{resumeItem.title || "Untitled Resume"}</p>
                      <p className="text-xs text-slate-500 mt-1">{resumeItem.profile || "General"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">By {resumeItem.userName}</p>
                      <p className="text-[11px] text-slate-400 mt-2">Updated on {new Date(resumeItem.updatedAt).toLocaleDateString()}</p>
                    </div>
                  </button>
                );
              })
            ) : (
              <div className="col-span-full rounded-lg border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-slate-500">
                No public resumes are available yet.
              </div>
            )}
          </div>
        </div>

        {showCreateModal && (
          <form
            onSubmit={createResume}
            onClick={() => setShowCreateModal(false)}
            className="fixed inset-0 z-10 bg-black/70 backdrop-blur bg-opacity-50 flex items-center justify-center"
          >
            <div onClick={(e) => e.stopPropagation()} className="relative border p-6 w-full max-w-sm bg-slate-50 shadow-md rounded-lg">
              <h2 className="text-xl mb-4 font-bold">Create Resume</h2>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                type="text"
                placeholder="Enter Resume"
                className="w-full py-2 px-4 mb-3 border rounded focus:border-green-500 ring-green-500"
                required
              />
              <input
                type="text"
                value={profile}
                onChange={(e) => setProfile(e.target.value)}
                placeholder="Job Profile (e.g., Full-stack)"
                className="w-full py-2 px-4 mb-3 border rounded focus:border-green-500 ring-green-500"
              />
              <button type="submit" className="w-full py-4 bg-green-500 text-white hover:bg-green-700 rounded transition-colors">
                Create Resume
              </button>
              <XIcon
                className="absolute top-4 right-4 text-slate-500 hover:text-slate-700 cursor-pointer"
                onClick={() => {
                  setShowCreateModal(false);
                  setTitle("");
                }}
              />
            </div>
          </form>
        )}

        {showUploadModal && (
          <div className="fixed inset-0 z-20 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/70 backdrop-blur bg-opacity-50 z-10" onClick={() => !isLoading && setShowUploadModal(false)} />
            <form
              onSubmit={uploadResume}
              className="relative border p-6 w-full max-w-sm bg-slate-50 shadow-md rounded-lg z-20"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-xl mb-4 font-bold">Upload Resume</h2>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter Resume"
                className="w-full py-2 px-3 mb-3 border rounded focus:border-green-500 ring-green-500"
                required
                disabled={isLoading}
              />
              <label htmlFor="resume-input" className="block text-sm text-slate-700">
                Select Resume File
              </label>
              <div
                className="flex flex-col justify-center items-center border border-dashed border-slate-700 p-4 py-10 rounded-md text-slate-400 my-4 gap-2 hover:border-green-500 hover:text-green-400 cursor-pointer transition-colors"
                onClick={() => document.getElementById("resume-input")?.click()}
              >
                {resumeFile ? <p className="text-green-400">{resumeFile.name}</p> : <UploadCloudIcon className="size-14" />}
                <p>{resumeFile ? "Change PDF" : "Upload Resume"}</p>
              </div>
              <input
                id="resume-input"
                type="file"
                accept=".pdf"
                hidden
                onChange={(e) => setResumeFile(e.target.files?.[0] ?? null)}
                disabled={isLoading}
              />
              <button type="submit" disabled={isLoading} className="flex items-center justify-center w-full py-4 bg-green-500 text-white hover:bg-green-700 rounded transition-colors mt-2">
                {isLoading && <LoaderCircleIcon className="animate-spin size-4 text-white mr-2" />}
                {isLoading ? "Uploading..." : "Upload Resume"}
              </button>
              <XIcon
                className="absolute top-4 right-4 text-slate-500 hover:text-slate-700 cursor-pointer"
                onClick={() => {
                  if (!isLoading) {
                    setShowUploadModal(false);
                    setTitle("");
                    setResumeFile(null);
                  }
                }}
                style={{ pointerEvents: isLoading ? "none" : "auto", opacity: isLoading ? 0.5 : 1 }}
              />
            </form>
          </div>
        )}

        {editResumeId && (
          <form
            onSubmit={editTitle}
            onClick={() => setEditResumeId("")}
            className="fixed inset-0 z-10 bg-black/70 backdrop-blur bg-opacity-50 flex items-center justify-center"
          >
            <div onClick={(e) => e.stopPropagation()} className="relative border p-6 w-full max-w-sm bg-slate-50 shadow-md rounded-lg">
              <h2 className="text-xl mb-4 font-bold">Edit Resume</h2>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                type="text"
                placeholder="Update title"
                className="w-full py-2 px-4 mb-3 border rounded focus:border-green-500 ring-green-500"
                required
              />
              <input
                type="text"
                value={profile}
                onChange={(e) => setProfile(e.target.value)}
                placeholder="Update Job Profile"
                className="w-full py-2 px-4 mb-3 border rounded focus:border-green-500 ring-green-500"
              />
              <button type="submit" className="w-full py-4 bg-green-500 text-white hover:bg-green-700 rounded transition-colors">
                Update Resume
              </button>
              <XIcon
                className="absolute top-4 right-4 text-slate-500 hover:text-slate-700 cursor-pointer"
                onClick={() => setEditResumeId("")}
              />
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default DashBoard;
