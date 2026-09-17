  import React from "react";
  import ModernTemplate from "./templates/ModernTemplate";
  import ClassicTemplate from "./templates/ClassicTemplate";
  import MinimalTemplate from "./templates/MinimalTemplate";
  import MinimalImageTemplate from "./templates/MinimalImageTemplate";

  const ResumePreview = ({ accentColor, template, data, classes = "" }) => {
    const renderTemplate = () => {
      switch (template) {
        case "modern":
          return <ModernTemplate data={data} accentColor={accentColor} />;

        case "minimal-image":
          return <MinimalImageTemplate data={data} accentColor={accentColor} />;
          break;

        case "minimal":
          return <MinimalTemplate data={data} accentColor={accentColor} />;
          break;

        default:
          return <ClassicTemplate data={data} accentColor={accentColor} />;
      }
    };

    return (
      <div className="w-full bg-gray-100 max-h-screen overflow-auto">
        <div
          id="resume-preview"
          className={
            "border border-gray-100  print:shadow-none print:border-none " + classes
          }
        >
          {renderTemplate()}
        </div>
      <style jsx>{`
    /* Paper setup */
    @page {
      size: letter;      /* 8.5 x 11 inches */
      margin: 0;
    }

    /* Print-only rules */
    @media print {
      html,
      body {
        width: 8.5in;
        height: 11in;
        overflow: hidden;
      }

      /*  1️⃣ Hide EVERYTHING on the page */
      body * {
        visibility: hidden;
      }

      /*  2️⃣ Show ONLY the resume preview */
      #resume-preview,
      #resume-preview * {
        visibility: visible;
      }

      /* 3️⃣ Clean resume layout for printing */
      #resume-preview {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        width: 100%;
        height: auto;
        margin: 0;
        padding: 0;
        box-shadow: none !important;
        border: none !important;
        background: white;
      }
    }
  `}</style>

      </div>
    );
  };

  export default ResumePreview;
