import React, { useState } from "react";
import { X, LoaderCircle, Copy, Download, RefreshCw } from "lucide-react";
import api from "../../configs/api";
import toast from "react-hot-toast";
import { useSelector } from "react-redux";

const CoverLetterModal = ({ isOpen, onClose, resumeId, user }) => {
  const { token } = useSelector((state) => state.auth);
  const [companyName, setCompanyName] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [coverLetter, setCoverLetter] = useState(null);

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!companyName.trim()) {
      toast.error("Please enter a company name");
      return;
    }
    setLoading(true);
    try {
      const { data } = await api.post(
        "/api/ai/cover-letter",
        { resumeId, companyName, jobTitle, notes },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setCoverLetter(data.coverLetter);
      toast.success("Cover letter generated!");
    } catch (err) {
      toast.error(err?.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  // ----- Copy to clipboard -----
  const copyText = () => {
    if (!coverLetter) return toast.error("No text to copy");
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(coverLetter)
        .then(() => toast.success("Copied!"))
        .catch(() => fallbackCopy());
    } else {
      fallbackCopy();
    }
  };

  const fallbackCopy = () => {
    const textArea = document.createElement("textarea");
    textArea.value = coverLetter;
    textArea.style.position = "fixed";
    textArea.style.top = "-9999px";
    textArea.style.left = "-9999px";
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    try {
      document.execCommand("copy");
      toast.success("Copied!");
    } catch (err) {
      toast.error("Copy failed. Please select and copy manually.");
    }
    document.body.removeChild(textArea);
  };

  // ----- Download as PDF using print() -----
  const downloadPDF = () => {
    if (!coverLetter) return toast.error("No content to download");
    try {
      const printWindow = window.open("", "_blank");
      if (!printWindow) {
        toast.error("Please allow popups for this site");
        return;
      }

      const htmlContent = `
        <!DOCTYPE html>
        <html>
          <head>
            <title>Cover Letter</title>
            <style>
              * { margin: 0; padding: 0; box-sizing: border-box; }
              body {
                font-family: 'Georgia', 'Times New Roman', serif;
                padding: 50px;
                max-width: 800px;
                margin: 0 auto;
                line-height: 1.8;
                color: #1a1a1a;
                background: white;
              }
              .letter {
                margin-top: 30px;
              }
              .letter p {
                margin-bottom: 16px;
                text-align: justify;
              }
              .letter .signature {
                margin-top: 50px;
                font-weight: bold;
              }
              .letter .date {
                text-align: right;
                margin-bottom: 30px;
              }
              @media print {
                body { padding: 40px; }
                .letter p { page-break-inside: avoid; }
              }
            </style>
          </head>
          <body>
            <div class="letter">
              ${coverLetter.split("\n").map(line => {
                const trimmed = line.trim();
                if (!trimmed) return "<br/>";
                if (trimmed.match(/^(Sincerely|Yours|Best|Regards)/i)) {
                  return `<p class="signature">${trimmed}</p>`;
                }
                if (trimmed.match(/^(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},?\s+\d{4}/)) {
                  return `<p class="date">${trimmed}</p>`;
                }
                return `<p>${trimmed}</p>`;
              }).join("")}
            </div>
          </body>
        </html>
      `;

      printWindow.document.write(htmlContent);
      printWindow.document.close();

      setTimeout(() => {
        printWindow.focus();
        printWindow.print();
        // Optionally close after print
        // printWindow.onafterprint = () => printWindow.close();
      }, 500);

      toast.success("Print dialog opened. Select 'Save as PDF'.");
    } catch (err) {
      console.error("Print error:", err);
      toast.error("Failed to open print dialog: " + err.message);
    }
  };

  const regenerate = () => {
    setCoverLetter(null);
  };

  const resetModal = () => {
    setCompanyName("");
    setJobTitle("");
    setNotes("");
    setCoverLetter(null);
    setLoading(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto relative p-6">
        {/* Header */}
        <div className="flex justify-between items-start mb-4">
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            📝 Cover Letter Generator
          </h2>
          <button
            onClick={resetModal}
            className="text-gray-500 hover:text-gray-700 transition"
          >
            <X className="size-6" />
          </button>
        </div>

        {/* Phase 1: Input */}
        {!loading && !coverLetter && (
          <form onSubmit={handleGenerate}>
            <p className="text-sm text-gray-600 mb-4">
              Enter the job details to generate a tailored cover letter.
            </p>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Company Name *
                </label>
                <input
                  type="text"
                  className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="e.g., Google"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Job Title (optional)
                </label>
                <input
                  type="text"
                  className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none"
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  placeholder="e.g., Software Engineer"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Additional Notes (optional)
                </label>
                <textarea
                  rows={3}
                  className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Any specific points you want to highlight..."
                />
              </div>
            </div>
            <div className="mt-4 flex justify-end">
              <button
                type="submit"
                className="px-6 py-2.5 bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-lg hover:shadow-lg transition flex items-center gap-2"
              >
                <span>✨ Generate Cover Letter</span>
              </button>
            </div>
          </form>
        )}

        {/* Phase 2: Loading */}
        {loading && (
          <div className="py-12 flex flex-col items-center justify-center">
            <LoaderCircle className="size-12 text-blue-500 animate-spin" />
            <p className="mt-4 text-gray-600 font-medium">Crafting your cover letter...</p>
            <p className="text-sm text-gray-400">This may take a few seconds</p>
          </div>
        )}

        {/* Phase 3: Results */}
        {coverLetter && !loading && (
          <div>
            {/* Display Cover Letter */}
            <div className="bg-gray-50 rounded-xl p-6 mb-4 border border-gray-200">
              <div className="font-serif text-gray-800 whitespace-pre-wrap leading-relaxed">
                {coverLetter.split("\n").map((line, i) => (
                  <React.Fragment key={i}>
                    {line}
                    <br />
                  </React.Fragment>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap gap-3 justify-end">
              <button
                onClick={copyText}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition flex items-center gap-2 text-sm"
              >
                <Copy className="size-4" />
                Copy Text
              </button>
              <button
                onClick={downloadPDF}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2 text-sm"
              >
                <Download className="size-4" />
                Download PDF
              </button>
              <button
                onClick={regenerate}
                className="px-4 py-2 border border-blue-300 text-blue-600 rounded-lg hover:bg-blue-50 transition flex items-center gap-2 text-sm"
              >
                <RefreshCw className="size-4" />
                Regenerate
              </button>
              <button
                onClick={resetModal}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CoverLetterModal;