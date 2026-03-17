function ActivityLogTable({
  activities,
  isLoading = false,
  errorMessage = "",
}) {
  const formatTimestamp = (value) => {
    if (!value) {
      return "--";
    }

    const parsedDate = new Date(value);

    if (Number.isNaN(parsedDate.getTime())) {
      return String(value);
    }

    return parsedDate.toLocaleString();
  };

  const formatDetails = (activity) => {
    const rawDetails = String(activity?.details ?? "");

    if (!rawDetails) {
      return "--";
    }

    const judgeMatch = rawDetails.match(
      /Added\s+judge\s+"?([^"(]+?)"?\s*(?:\(|to|$)/i,
    );
    if (judgeMatch?.[1]) {
      return "Added " + judgeMatch[1].trim() + " as a judge";
    }

    const contestantMatch = rawDetails.match(
      /Added\s+contestant\s+"?([^"(]+?)"?\s*(?:\(|to|$)/i,
    );
    if (contestantMatch?.[1]) {
      return "Added " + contestantMatch[1].trim() + " as a contestant";
    }

    return rawDetails
      .replace(/\s*\(ID:\s*[^)]+\)/gi, "")
      .replace(/\bID:\s*[^,\s)]+/gi, "")
      .replace(/\s{2,}/g, " ")
      .trim();
  };

  return (
    <div className="overflow-hidden rounded-lg border border-base-300 bg-base-100 shadow-sm">
      <div className="overflow-x-auto">
        <table className="table w-full">
          <thead>
            <tr className="bg-base-200">
              <th className="text-base-content/70">Action</th>
              <th className="text-base-content/70">User</th>
              <th className="text-base-content/70">Details</th>
              <th className="text-base-content/70">Timestamp</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td
                  colSpan={5}
                  className="py-10 text-center text-sm text-base-content/60"
                >
                  Loading activity logs...
                </td>
              </tr>
            ) : errorMessage ? (
              <tr>
                <td
                  colSpan={5}
                  className="py-10 text-center text-sm text-error"
                >
                  {errorMessage}
                </td>
              </tr>
            ) : activities.length ? (
              activities.map((activity) => (
                <tr key={activity.id} className="hover:bg-base-200/50">
                  <td>
                    <span className="badge badge-primary badge-outline">
                      {activity.action}
                    </span>
                  </td>
                  <td>{activity.user} </td>
                  <td className="text-base-content/70">
                    {formatDetails(activity)}
                  </td>
                  <td className="text-sm text-base-content/60">
                    {formatTimestamp(activity.timestamp)}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={5}
                  className="py-10 text-center text-sm text-base-content/60"
                >
                  No activity matched the current search or filter.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default ActivityLogTable;
