import React, { useMemo } from "react";

const ContributionGraph = ({ submissions = [] }) => {
  // Simplified version - show last 30 days only for now
  const days = useMemo(() => {
    const result = [];
    const today = new Date();
    for (let i = 29; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      result.push(date);
    }
    return result;
  }, []);

  // Count submissions per day
  const submissionCounts = useMemo(() => {
    const counts = new Map();
    
    submissions.forEach((submission) => {
      if (submission.createdAt) {
        const date = new Date(submission.createdAt);
        const dateKey = date.toISOString().split("T")[0];
        counts.set(dateKey, (counts.get(dateKey) || 0) + 1);
      }
    });

    return counts;
  }, [submissions]);

  // Get intensity level for a day
  const getIntensity = (date) => {
    const dateKey = date.toISOString().split("T")[0];
    const count = submissionCounts.get(dateKey) || 0;
    
    if (count === 0) return 0;
    if (count === 1) return 1;
    if (count <= 3) return 2;
    if (count <= 5) return 3;
    return 4;
  };

  const getColor = (intensity) => {
    const colors = [
      "bg-base-200", // 0 - no contributions
      "bg-success/30", // 1 - 1 contribution
      "bg-success/50", // 2 - 2-3 contributions
      "bg-success/70", // 3 - 4-5 contributions
      "bg-success", // 4+ - 6+ contributions
    ];
    return colors[intensity] || colors[0];
  };

  const getTooltipText = (date, count) => {
    const dateStr = date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
    if (count === 0) {
      return `No contributions on ${dateStr}`;
    }
    return `${count} contribution${count > 1 ? "s" : ""} on ${dateStr}`;
  };

  return (
    <div className="w-full">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-sm text-base-content/70">Last 30 days</span>
        <span className="badge badge-ghost badge-sm">Full graph coming soon</span>
      </div>
      <div className="flex gap-1 flex-wrap">
        {days.map((day, index) => {
          const intensity = getIntensity(day);
          const dateKey = day.toISOString().split("T")[0];
          const count = submissionCounts.get(dateKey) || 0;

          return (
            <div
              key={index}
              className="relative group"
              title={getTooltipText(day, count)}
            >
              <div
                className={`w-4 h-4 rounded-sm ${getColor(intensity)} hover:ring-2 hover:ring-primary cursor-pointer transition-all`}
              />
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-between mt-4 text-sm text-base-content/70">
        <span>Less</span>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-sm bg-base-200"></div>
          <div className="w-3 h-3 rounded-sm bg-success/30"></div>
          <div className="w-3 h-3 rounded-sm bg-success/50"></div>
          <div className="w-3 h-3 rounded-sm bg-success/70"></div>
          <div className="w-3 h-3 rounded-sm bg-success"></div>
        </div>
        <span>More</span>
      </div>
    </div>
  );
};

export default ContributionGraph;
