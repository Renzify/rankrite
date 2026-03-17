function PreferenceToggle({ checked, onChange, checkedLabel, uncheckedLabel }) {
  return (
    <label className="app-muted-panel flex cursor-pointer items-center justify-between gap-4">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-base-content/50">
          {checked ? checkedLabel : uncheckedLabel}
        </p>
      </div>

      <input
        type="checkbox"
        className="toggle toggle-primary"
        checked={checked}
        onChange={onChange}
      />
    </label>
  );
}
function Preferences({
  settings,
  handleChange,
  handleSavePreferences,
  hasPreferencesChanged,
}) {
  return (
    <div>
      <section className="app-surface">
        <div className="app-section">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-semibold">Preferences</h2>
            {/* <div
                    className="tooltip tooltip-warning tooltip-bottom z-[100] w-[25px] h-[25px] rounded-full border-2 border-warning bg-transparent text-warning flex items-center justify-center text-sm font-medium cursor-help hover:bg-warning hover:text-warning-content transition-all duration-200"
                    data-tip="Preferences: Manage how the system looks and how alerts work. It lets you adjust your viewing and notification settings."
                  >
                    ?
                  </div> */}
          </div>
          <p className="mt-1 text-sm text-base-content/60">
            Adjust the interface theme for this account.
          </p>

          <div className="mt-6 space-y-6">
            <PreferenceToggle
              description=""
              checked={settings.theme === "dark"}
              onChange={(event) =>
                handleChange("theme", event.target.checked ? "dark" : "light")
              }
              checkedLabel="Dark mode"
              uncheckedLabel="Light mode"
            />

            <button
              type="button"
              className={`btn w-full ${hasPreferencesChanged ? "btn-primary" : "btn-disabled"}`}
              disabled={!hasPreferencesChanged}
              onClick={handleSavePreferences}
            >
              Save Changes
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

export default Preferences;
