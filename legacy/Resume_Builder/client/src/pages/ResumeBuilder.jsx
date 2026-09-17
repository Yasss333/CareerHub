import React, { useEffect, useState } from "react";
import InterviewModal from "../components/InterviewModal";
// ...
import { useParams, Link, useAsyncError } from "react-router-dom";
import { dummyResumeData } from "../assets/assets";
import ATSModal from "../components/ATSModal";
import {
  AppWindow,
  ArrowLeft,
  ArrowLeftIcon,
  Briefcase,
  BriefcaseBusiness,
  ChevronLeft,
  ChevronRight,
  DownloadIcon,
  EyeIcon,
  EyeOff,
  FileText,
  FolderIcon,
  GraduationCap,
  Mail,
  MapPin,
  Phone,
  Share2Icon,
  Sparkle,
  Sparkles,
  User,
} from "lucide-react";

import PersonalInfoForm from "../components/PersonalInfoForm.jsx";
import ResumePreview from "../components/ResumePreview.jsx";
import TemplateSelector from "../components/TemplateSelector.jsx";
import ColorPicker from "../components/ColorPicker.jsx";
import ProffesionalSummary from "../components/ProffesionalSummary.jsx";
import ExperienceForm from "../components/ExperienceForm.jsx";
import Education from "../components/Education.jsx";
import Project from "../components/Project.jsx";
import SkillsForm from "../components/SkillsForm.jsx";
import { useSelector } from "react-redux";
import api from "../../configs/api";
import toast from "react-hot-toast";
import CoverLetterModal from "../components/CoverLetterModal.jsx";


const ResumeBuilder = () => {
  const { resumeId } = useParams();
  const { token } = useSelector((state) => state.auth);
  const [showATSModal, setShowATSModal] = useState(false);
  const [showCoverLetterModal, setShowCoverLetterModal] = useState(false);
  const [resumeData, setresumeData] = useState({
    _id: "",
    title: "",
    personal_info: {},
    professional_summary: "",
    experience: [],
    education: [],
    project: [],
    skills: [],
    template: "classic",
    accent_color: "#3B82F6",
    public: false,
  });
  const [showInterviewModal, setShowInterviewModal] = useState(false);

  const loadExistingResume = async (resumeId) => {
    try {
      const { data } = await api.get("/api/resume/getResumeById/" + resumeId, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (data.resume) {
        setresumeData(data.resume);
        document.title = data.resume.title;
      }
    } catch (error) {
      console.log(error.message);
    }
  };

  useEffect(() => {
    if (resumeId && token) {
      loadExistingResume(resumeId);
    }
    console.log("resumeId:", resumeId);
    console.log("dummy data:", dummyResumeData);
  }, [resumeId, token]);

  const changeResumeVisibility = async () => {
    try {
      const { data } = await api.put(
        "/api/resume/update",
        {
          resumeId,
          resumeData: JSON.stringify({ public: !resumeData.public }),
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      setresumeData({ ...resumeData, public: !resumeData.public });
      toast.success(data.message);
    } catch (error) {
      console.error("Error saving resume : ", error);
      toast.error(error?.response?.data?.message || error.message || "Unable to toggle visibility");
    }
  };
  const handleShare = async () => {
    const frontendURL = window.location.href.split("/app/")[0];
    const resumeUrl = frontendURL + "/view/" + resumeId;

    if (navigator.share) {
      navigator.share({ url: resumeUrl, text: "My Resume" });
    } else {
      alert("Share is not available on thsi browser . ");
    }
  };

  const downloadResume = async () => {
    console.log("Dowload Hit , Window", window);
    await window.print();
  };
  const [activeSectionIndex, setactiveSectionIndex] = useState(0);
  const [removeBackgorund, setremoveBackgorund] = useState(false);

  const sections = [
    { id: "profile", name: "Profile Info", icon: User },
    { id: "summary", name: "Summary", icon: FileText },
    { id: "experience", name: "Experience", icon: Briefcase },
    { id: "education", name: "Education", icon: GraduationCap },
    { id: "projects", name: "Project", icon: FolderIcon },
    { id: "skills", name: "Skills", icon: Sparkles },
  ];

  const activeSection = sections[activeSectionIndex];

  // const handleSaveChanges = async () => {
  //   try {
  //     const token = localStorage.getItem("token");
  //     await api.put(
  //       "/api/resume/update",
  //       {
  //         resumeId,
  //         resumeData: JSON.stringify(resumeData),
  //         removeBackground: removeBackgorund,
  //       },
  //       {
  //         headers: { Authorization: `Bearer ${token}` },
  //       },
  //     );
  //     alert("Resume saved successfully!");
  //   } catch (error) {
  //     alert(error?.response?.data?.message || error.message);
  //   }
  // };

  const saveResume = async () => {
    try {
      let updatedResumeData = structuredClone(resumeData);

      //remove image from updatedResumeData

      if (typeof resumeData.personal_info.image === "object") {
        delete updatedResumeData.personal_info.image;
      }

      const formData = new FormData();
      formData.append("resumeId", resumeId);
      formData.append("resumeData", JSON.stringify(updatedResumeData));
      removeBackgorund && formData.append("removeBackground", "yes");
      typeof resumeData.personal_info.image === "object" &&
        formData.append("image", resumeData.personal_info.image);

      const { data } = await api.put("/api/resume/update", formData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setresumeData(data.resume);
      toast.success(data.message);
    } catch (error) {
      console.log("Error saving resume : ", error);
    }
  };

  return (
    <div>
      <div className="max-w-7xl   mx-auto py-6 px-4">
        <Link
          to={"/app"}
          className="inline-flex justify-center text-slate-500 gap-2 items-center hover:text-slate-800 border rounded-2xl p-2 hover:border-cyan-300  hover:bg-green-200 transition-all duration-100"
        >
          <ArrowLeftIcon className="size-4" />
          Back to Dashboard
        </Link>
      </div>
      {/* <div className="max-w-7xl mx-auto px-4 py-5 bg-gray-50 " >
        <Link to={"/profile"} className="inline-flex  gap-2 justify-center align-center border p-2 rounded-full text-slate-600 hover:text-amber-100 hover:border-gray-700 bg-gray-50 transition-all duration-700 shadow-xl  shadow-amber-700 hover:shadow-amber-200 hover:bg-gray-400">
        <User className="size-5"/> Go to Profile 
        </Link>
       </div> */}
      <div className="max-w-7xl mx-auto px-4 pb-8">
        <div className="grid lg:grid-cols-12 gap-8">
          {/*Left Panel FOrm */}
          <div className="relative lg:col-span-5 bg-white border border-gray-200 shadow-2xl  px-3 py-2 rounded-lg overflow-y-auto h-[calc(100vh-120px)]">
            <div className=" border-gray-200 rounded-b-lg px-1.5 pt-1"></div>
            {/* Active section using activesectionIndex */}
            <hr className="absolute    border-2 bg-amber-200 border-gray-200 top-0 left-0 right-0 " />
            <hr
              className="absolute top-0 left-0 h-1 bg-gradient-to-r  from-green-500 to-green-600 border-none
               transition-all duration-2000"
              style={{
                width: `${((activeSectionIndex + 1) / sections.length) * 100}%`,
              }}
            />

            {/* Section Navigation */}
            <div className="flex justify-between items-center border-b border-slate-600 mb-6 py-1">
              <div className="flex gap-2">
                <TemplateSelector
                  selectedTemplate={resumeData.template}
                  onChange={(template) =>
                    setresumeData((prev) => ({ ...prev, template }))
                  }
                />
                <ColorPicker
                  selectedColor={resumeData.accent_color}
                  onChange={(color) =>
                    setresumeData((prev) => ({ ...prev, accent_color: color }))
                  }
                />
              </div>
              <div className="flex items-center ">
                {activeSectionIndex !== 0 && (
                  <button
                    onClick={() =>
                      setactiveSectionIndex((prev) => Math.max(prev - 1, 0))
                    }
                    className="flex item-center rounded-lg text-sm font-meduim text-slate-600 
                hover:bg-white-50 transition-all gap -1 p-3 }"
                    disabled={activeSectionIndex === 0}
                  >
                    <ChevronLeft className="size-4" />
                    Previous
                  </button>
                )}
                <button
                  onClick={() =>
                    setactiveSectionIndex((prev) =>
                      Math.min(prev + 1, sections.length - 1),
                    )
                  }
                  className={`flex item-center rounded-lg text-sm font-meduim text-slate-600 
                hover:bg-white-50 transition-all gap -1 p-3
                     ${activeSectionIndex === sections.length - 1 && "opacity-50"}`}
                  disabled={activeSectionIndex === sections.length - 1}
                >
                  <ChevronRight className="size-4" />
                  Next
                </button>
              </div>
            </div>

            {/* Form for inputs */}
            <div className="space-y-6">
              {activeSection.id === "profile" && (
                <PersonalInfoForm
                  data={resumeData.personal_info}
                  onChange={(data) => {
                    setresumeData((prev) => ({ ...prev, personal_info: data }));
                  }}
                  removeBackground={removeBackgorund}
                  setremoveBackground={setremoveBackgorund}
                />
              )}
              {activeSection.id === "summary" && (
                <ProffesionalSummary
                  data={resumeData.professional_summary}
                  onChange={(data) => {
                    setresumeData((prev) => ({
                      ...prev,
                      professional_summary: data,
                    }));
                  }}
                  setResumeData={setresumeData}
                />
              )}
              {activeSection.id === "experience" && (
                <ExperienceForm
                  data={resumeData.experience}
                  onChange={(data) => {
                    setresumeData((prev) => ({ ...prev, experience: data }));
                  }}
                />
              )}
              {activeSection.id === "education" && (
                <Education
                  data={resumeData.education}
                  onChange={(data) => {
                    setresumeData((prev) => ({ ...prev, education: data }));
                  }}
                />
              )}
              {activeSection.id === "projects" && (
                <Project
                  data={resumeData.project}
                  onChange={(data) => {
                    setresumeData((prev) => ({ ...prev, project: data }));
                  }}
                />
              )}
              {activeSection.id === "skills" && (
                <SkillsForm
                  data={resumeData.skills}
                  onChange={(data) => {
                    setresumeData((prev) => ({ ...prev, skills: data }));
                  }}
                />
              )}
            </div>
            <button
              className="bg-gradient-to-br from-green-100 to-green-200  ring-green-200 rounded-md ring-2 text-sm px-6 py-2 text-green-600 hover:ring-green-400 hover=bg mt-6 transition-all"
              onClick={() => {
                toast.promise(saveResume, { loading: "Saving..." });
              }}
            >
              Save Changes
            </button>
          </div>
          {/*Right Panel Preview */}

          <div className="lg:col-span-7 max-lg:md-6 h-[calc(100vh-120px)]">
            <div className="relative w-full">
              {/* -------BUTTON(live, share ) */}
              <div
                className="absolute bottom-3 left-0 right-0 
              flex item-center  justify-end gap-2 "
              >
                {resumeData.public && (
                  <button
                    onClick={handleShare}
                    className=" flex  gap-2   items-center bg-gradient-to-br from-blue-100 to-blue-200  ring-green-200
            rounded-lg ring-blue-300  text-xs px-4 p-2 text-blue-600 hover:ring transition-all "
                  >
                    <Share2Icon className="size-4" />
                    <p className="text-xs *:">Share</p>
                  </button>
                )}
                <button
                  onClick={changeResumeVisibility}
                  className="flex gap-2 items-center bg-gradient-to-br from-purple-100 to-purple-200  ring-purple-200
            rounded-lg ring-purple-300  text-xs px-4 p-2 text-purple-600 hover:ring transition-all "
                >
                  {resumeData.public ? (
                    <EyeIcon className="size-4" />
                  ) : (
                    <EyeOff className="size-4" />
                  )}
                  {resumeData.public ? "Public" : "Private"}
                </button>
                <button
                  onClick={() => setShowATSModal(true)}
                  className="flex gap-2 items-center rounded-lg bg-gradient-to-br from-purple-100 to-purple-300 ring-purple-300 text-xs hover:ring px-4 p-2 transition-colors"
                >
                  <span>🎯</span>
                  <p>ATS Score</p>
                </button>
                //Interview question
                <button
  onClick={() => setShowInterviewModal(true)}
  className="flex items-center gap-1 rounded-lg bg-gradient-to-br from-indigo-100 to-indigo-300 ring-indigo-300 text-xs hover:ring px-3 py-2 transition"
>
  Test Yourself
</button>
                {/* -------dowload Preview---------- */}
                <button
                  onClick={downloadResume}
                  className="flex gap-2 items-center rounded-lg  bg-gradient-to-br from-green-100 to-green-300
                 ring-green-300 text-xs hover:ring px-4 p-2 transition-colors "
                >
                  <DownloadIcon className="size-4" />
                  <p>Download</p>
                </button>
              </div>
            </div>
            {/* -------Cover leter---------- */}
            <button
  onClick={() => setShowCoverLetterModal(true)}
  className="flex gap-2 items-center rounded-lg bg-gradient-to-br from-green-100 to-green-300 ring-green-300 text-xs hover:ring px-4 p-2 transition-colors"
>
  <span>📝</span>
  <p>Cover Letter</p>
</button>
            {/* -------Resume Preview---------- */}
            <ResumePreview
              data={resumeData}
              template={resumeData.template}
              accentColor={resumeData.accent_color}
            />
            <ATSModal
  isOpen={showATSModal}
  onClose={() => setShowATSModal(false)}
  resumeId={resumeId}
/>

<InterviewModal
  isOpen={showInterviewModal}
  onClose={() => setShowInterviewModal(false)}
  resumeId={resumeId}
/>
<CoverLetterModal
  isOpen={showCoverLetterModal}
  onClose={() => setShowCoverLetterModal(false)}
  resumeId={resumeId}
  user={resumeData.personal_info}
/>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResumeBuilder;
