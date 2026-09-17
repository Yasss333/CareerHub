import {
  CheckCircle2,
  XCircle,
  Clock,
  MemoryStick as Memory,
  Calendar,
} from "lucide-react";

const SubmissionsList = ({ submissions, isLoading }) => {

  /* -----------------------------
     Helpers
  ------------------------------ */

  const safeParseArray = (data) => {
    if (!data || typeof data !== "string") return [];
    try {
      const parsed = JSON.parse(data);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  };

  const extractAverage = (data) => {
    const arr = safeParseArray(data)
      .map(v => parseFloat(v))
      .filter(v => !isNaN(v));

    if (!arr.length) return null;

    return arr.reduce((a, b) => a + b, 0) / arr.length;
  };

  const getStatusUI = (status) => {
    if (status === "Accepted") {
      return {
        icon: <CheckCircle2 className="w-6 h-6" />,
        color: "text-success",
        label: "Accepted",
      };
    }

    return {
      icon: <XCircle className="w-6 h-6" />,
      color: "text-warning",
      label: status || "Executed",
    };
  };

  /* -----------------------------
     Loading / Empty states
  ------------------------------ */

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-8">
        <span className="loading loading-spinner loading-lg text-primary"></span>
      </div>
    );
  }

  if (!submissions?.length) {
    return (
      <div className="text-center p-8 text-base-content/70">
        No submissions yet
      </div>
    );
  }

  /* -----------------------------
     Render
  ------------------------------ */

  return (
    <div className="space-y-4">
      {submissions.map((submission) => {
        const avgMemory = extractAverage(submission.memory);
        const avgTime = extractAverage(submission.time);
        const statusUI = getStatusUI(submission.status);

        return (
          <div
            key={submission.id}
            className="card bg-base-200 shadow-lg hover:shadow-xl transition-shadow rounded-lg"
          >
            <div className="card-body p-4">
              <div className="flex items-center justify-between">

                {/* Left: Status + Language */}
                <div className="flex items-center gap-4">
                  <div className={`flex items-center gap-2 ${statusUI.color}`}>
                    {statusUI.icon}
                    <span className="font-semibold">{statusUI.label}</span>
                  </div>

                  <div className="badge badge-neutral">
                    {submission.language || "Unknown"}
                  </div>
                </div>

                {/* Right: Metrics */}
                <div className="flex items-center gap-4 text-base-content/70">
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    <span>
                      {avgTime !== null ? `${avgTime.toFixed(3)} s` : "N/A"}
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    <Memory className="w-4 h-4" />
                    <span>
                      {avgMemory !== null ? `${avgMemory.toFixed(0)} KB` : "N/A"}
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    <span>
                      {new Date(submission.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>

              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default SubmissionsList;
