import { useRef, useState } from "react";
import toast from "react-hot-toast";
import QRCode from "react-qr-code";

const QR_CODE_SIZE = 224;
const QR_CODE_PADDING = 24;
const QR_DOWNLOAD_SIZE = QR_CODE_SIZE + QR_CODE_PADDING * 2;

function createQrFilename(judgeName) {
  const nameSlug = String(judgeName || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return `${nameSlug || "judge"}-scoring-qr.png`;
}

export default function JudgeLinkModal({
  activeJudgeLink,
  activeJudgeName,
  copyMessage,
  isOpen,
  linkModalTab,
  onClose,
  onCopyLink,
  onTabChange,
}) {
  const qrCodeContainerRef = useRef(null);
  const [isDownloadingQr, setIsDownloadingQr] = useState(false);

  if (!isOpen) {
    return null;
  }

  const handleDownloadQr = async () => {
    const svgElement = qrCodeContainerRef.current?.querySelector("svg");

    if (!svgElement) {
      toast.error("QR code is not ready to download yet.");
      return;
    }

    let svgUrl = "";
    let pngUrl = "";

    try {
      setIsDownloadingQr(true);

      const svgClone = svgElement.cloneNode(true);
      const viewBox = svgElement.getAttribute("viewBox");

      svgClone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
      svgClone.setAttribute("width", String(QR_CODE_SIZE));
      svgClone.setAttribute("height", String(QR_CODE_SIZE));
      if (viewBox) {
        svgClone.setAttribute("viewBox", viewBox);
      }

      const svgMarkup = new XMLSerializer().serializeToString(svgClone);
      const svgBlob = new Blob([svgMarkup], {
        type: "image/svg+xml;charset=utf-8",
      });
      svgUrl = URL.createObjectURL(svgBlob);

      const image = new Image();
      await new Promise((resolve, reject) => {
        image.onload = () => resolve();
        image.onerror = () => reject(new Error("QR image failed to load"));
        image.src = svgUrl;
      });

      const canvas = document.createElement("canvas");
      canvas.width = QR_DOWNLOAD_SIZE;
      canvas.height = QR_DOWNLOAD_SIZE;

      const context = canvas.getContext("2d");
      if (!context) {
        throw new Error("Canvas context unavailable");
      }

      context.fillStyle = "#ffffff";
      context.fillRect(0, 0, QR_DOWNLOAD_SIZE, QR_DOWNLOAD_SIZE);
      context.drawImage(
        image,
        QR_CODE_PADDING,
        QR_CODE_PADDING,
        QR_CODE_SIZE,
        QR_CODE_SIZE,
      );

      const pngBlob = await new Promise((resolve, reject) => {
        canvas.toBlob((blob) => {
          if (blob) {
            resolve(blob);
            return;
          }

          reject(new Error("PNG generation failed"));
        }, "image/png");
      });

      pngUrl = URL.createObjectURL(pngBlob);

      const downloadLink = document.createElement("a");
      downloadLink.href = pngUrl;
      downloadLink.download = createQrFilename(activeJudgeName);
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);

      toast.success("QR image downloaded.");
    } catch {
      toast.error("Unable to download the QR image.");
    } finally {
      if (svgUrl) {
        URL.revokeObjectURL(svgUrl);
      }
      if (pngUrl) {
        URL.revokeObjectURL(pngUrl);
      }
      setIsDownloadingQr(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl rounded-2xl border border-base-300 bg-base-100 p-5 shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold">Judge Scoring Access</h3>
            <p className="text-sm text-base-content/70">{activeJudgeName}</p>
          </div>
          <button
            type="button"
            className="btn btn-sm btn-ghost"
            onClick={onClose}
          >
            Close
          </button>
        </div>

        <div
          role="tablist"
          className="tabs tabs-boxed mt-4 w-fit gap-1 bg-base-200/50"
        >
          <button
            type="button"
            role="tab"
            className={`tab ${linkModalTab === "qr" ? "tab-active" : ""}`}
            onClick={() => onTabChange("qr")}
          >
            QR
          </button>
          <button
            type="button"
            role="tab"
            className={`tab ${linkModalTab === "link" ? "tab-active" : ""}`}
            onClick={() => onTabChange("link")}
          >
            Link
          </button>
        </div>

        <div className="mt-4">
          {linkModalTab === "qr" ? (
            <div className="flex flex-col items-center gap-3">
              <div
                ref={qrCodeContainerRef}
                className="rounded-xl border border-base-300 bg-white p-4"
              >
                <QRCode
                  value={activeJudgeLink || " "}
                  size={QR_CODE_SIZE}
                  bgColor="#ffffff"
                  fgColor="#111827"
                />
              </div>
              <p className="text-center text-xs text-base-content/60">
                Scan this QR to open the judge scoring page.
              </p>
              <button
                type="button"
                className="btn btn-outline btn-sm"
                onClick={handleDownloadQr}
                disabled={!activeJudgeLink || isDownloadingQr}
              >
                {isDownloadingQr ? "Preparing image..." : "Download QR Image"}
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <label className="form-control w-full">
                <div className="label pb-1">
                  <span className="label-text font-semibold">Scoring Link</span>
                </div>
                <input
                  type="text"
                  className="input input-bordered w-full"
                  value={activeJudgeLink}
                  readOnly
                />
              </label>

              <div className="mt-4 flex flex-wrap items-center gap-3">
                <a
                  href={activeJudgeLink}
                  target="_blank"
                  rel="noreferrer"
                  className="btn btn-neutral btn-sm"
                >
                  Open Link
                </a>
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  onClick={onCopyLink}
                >
                  Copy Link
                </button>
                {copyMessage ? (
                  <span className="text-xs text-base-content/70">
                    {copyMessage}
                  </span>
                ) : null}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
