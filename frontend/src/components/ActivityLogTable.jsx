function ActivityLogTable({ activities }) {
  return (
    <div className="overflow-hidden rounded-lg border border-base-300 bg-base-100 shadow-sm">
      <div className="overflow-x-auto">
        <table className="table w-full">
          <thead>
            <tr className="bg-base-200">
              <th className="text-base-content/70">ID</th>
              <th className="text-base-content/70">Action</th>
              <th className="text-base-content/70">User</th>
              <th className="text-base-content/70">Details</th>
              <th className="text-base-content/70">Timestamp</th>
            </tr>
          </thead>
          <tbody>
            {activities.length ? (
              activities.map((activity) => (
                <tr key={activity.id} className="hover:bg-base-200/50">
                  <td className="font-medium">{activity.id}</td>
                  <td>
                    <span className="badge badge-primary badge-outline">
                      {activity.action}
                    </span>
                  </td>
                  <td>{activity.user}</td>
                  <td className="text-base-content/70">{activity.details}</td>
                  <td className="text-sm text-base-content/60">
                    {activity.timestamp}
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
