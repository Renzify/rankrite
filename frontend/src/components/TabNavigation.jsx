import { useTemplateStore } from "../stores/templateStore";

const TABS = [
  { key: "details", label: "Event Details", icon: "📋" },
  { key: "judges", label: "Add Judges", icon: "👨‍⚖️" },
  { key: "contestants", label: "Add Contestants", icon: "👥" },
];

function TabNavigation({ isFormComplete }) {
  const currentTab = useTemplateStore((state) => state.currentTab);
  const setCurrentTab = useTemplateStore((state) => state.setCurrentTab);

  const handleTabClick = (tabKey) => {
    if (tabKey === "details" || isFormComplete) {
      setCurrentTab(tabKey);
    }
  };

  return (
    <div className="card border border-base-300 bg-base-100/90 shadow-sm">
      <div className="card-body gap-0">
        <div className="tabs tabs-bordered">
          {TABS.map((tab) => {
            const isDisabled =
              (tab.key === "judges" || tab.key === "contestants") &&
              !isFormComplete;
            return (
              <button
                key={tab.key}
                onClick={() => handleTabClick(tab.key)}
                disabled={isDisabled}
                className={`tab ${currentTab === tab.key ? "tab-active" : ""} ${
                  isDisabled ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default TabNavigation;
