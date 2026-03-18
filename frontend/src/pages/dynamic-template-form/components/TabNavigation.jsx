import { useTemplateStore } from "../../../stores/templateStore";

const TABS = [
  { key: "details", label: "Event Details" },
  { key: "judges", label: "Add Judges" },
  { key: "contestants", label: "Add Contestants" },
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
    <div className="overflow-x-auto pb-1">
      <div
        className="tabs tabs-boxed w-max min-w-max gap-2 bg-base-200/50 p-1 sm:w-full sm:min-w-0"
        role="tablist"
      >
        {TABS.map((tab) => {
          const isDisabled =
            (tab.key === "judges" || tab.key === "contestants") &&
            !isFormComplete;

          return (
            <button
              key={tab.key}
              type="button"
              role="tab"
              onClick={() => handleTabClick(tab.key)}
              disabled={isDisabled}
              className={`tab whitespace-nowrap rounded-lg px-3 sm:px-4 ${currentTab === tab.key ? "tab-active" : ""} ${
                isDisabled ? "cursor-not-allowed opacity-50" : ""
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default TabNavigation;
