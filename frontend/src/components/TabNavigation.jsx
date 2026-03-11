import { useTemplateStore } from "../stores/templateStore";

const TABS = [
  { key: "details", label: "Event Details", step: "01" },
  { key: "judges", label: "Add Judges", step: "02" },
  { key: "contestants", label: "Add Contestants", step: "03" },
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
    <div className="app-surface-soft">
      <div className="app-section py-3">
        <div className="tabs tabs-boxed w-full justify-start gap-2 bg-transparent p-0">
          {TABS.map((tab) => {
            const isDisabled =
              (tab.key === "judges" || tab.key === "contestants") &&
              !isFormComplete;

            return (
              <button
                key={tab.key}
                onClick={() => handleTabClick(tab.key)}
                disabled={isDisabled}
                className={`tab h-auto px-4 py-2 ${currentTab === tab.key ? "tab-active" : ""} ${
                  isDisabled ? "cursor-not-allowed opacity-50" : ""
                }`}
              >
                <span className="mr-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-base-content/60">
                  {tab.step}
                </span>
                <span className="font-medium">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default TabNavigation;
