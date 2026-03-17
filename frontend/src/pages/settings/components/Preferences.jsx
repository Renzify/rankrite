import { Moon, Sun } from "lucide-react";

function Preferences({
  settings,
  handleChange,
  handleSavePreferences,
  hasPreferencesChanged,
}) {
  const isLightMode = settings.theme === "light";
  const isDarkMode = settings.theme === "dark";

  return (
    <section className="app-surface h-full">
      <div className="app-section flex h-full flex-col">
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-semibold">Preferences</h2>
        </div>
        <p className="mt-1 text-sm text-base-content/60">
          Choose your viewing mode for this account.
        </p>

        <div className="mt-6 flex flex-1 flex-col gap-6">
          <div className="grid flex-1 grid-cols-1 gap-3 md:grid-cols-2">
            <button
              type="button"
              onClick={() => handleChange("theme", "light")}
              className={`flex h-full min-h-[190px] flex-col items-center justify-center gap-3 rounded-2xl border px-6 py-6 text-center transition-all duration-200 ${
                isLightMode
                  ? "border-base-content/30 bg-base-100 shadow-[0_12px_24px_-18px_rgba(15,23,42,0.55)]"
                  : "border-base-300/70 bg-base-200/30"
              }`}
            >
              <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-base-200">
                <Sun size={30} />
              </span>
              <span className="space-y-1">
                <span className="block text-lg font-bold leading-tight">
                  Light Mode
                </span>
                <span className="block text-sm text-base-content/70">
                  Brighter interface for daytime viewing.
                </span>
              </span>
            </button>

            <button
              type="button"
              onClick={() => handleChange("theme", "dark")}
              className={`flex h-full min-h-[190px] flex-col items-center justify-center gap-3 rounded-2xl border px-6 py-6 text-center transition-all duration-200 ${
                isDarkMode
                  ? "border-base-content/30 bg-base-100 shadow-[0_12px_24px_-18px_rgba(15,23,42,0.55)]"
                  : "border-base-300/70 bg-base-200/30"
              }`}
            >
              <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-base-200">
                <Moon size={30} />
              </span>
              <span className="space-y-1">
                <span className="block text-lg font-bold leading-tight">
                  Dark Mode
                </span>
                <span className="block text-sm text-base-content/70">
                  Reduced glare for low-light environments.
                </span>
              </span>
            </button>
          </div>

          <button
            type="button"
            className={`btn h-12 w-full text-base font-semibold ${hasPreferencesChanged ? "btn-primary" : "btn-disabled"}`}
            disabled={!hasPreferencesChanged}
            onClick={handleSavePreferences}
          >
            Save Changes
          </button>
        </div>
      </div>
    </section>
  );
}

export default Preferences;
