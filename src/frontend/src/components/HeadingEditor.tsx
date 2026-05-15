import { uploadFile } from "@/utils/uploadFile";
import {
  Edit2,
  Image,
  Layers,
  Palette,
  Save,
  Trash2,
  Type,
  X,
} from "lucide-react";
import type React from "react";
import { useRef, useState } from "react";
import type { BackgroundConfig } from "../backend";
import {
  useGetBackgroundConfig,
  useGetHeadingConfig,
  useUpdateBackgroundConfig,
  useUpdateHeadingConfig,
} from "../hooks/useQueries";

const FONT_OPTIONS = [
  { value: "cursive", label: "Cursive", className: "cursive-font" },
  { value: "serif", label: "Serif", className: "serif-font" },
  { value: "sans-serif", label: "Sans Serif", className: "sans-serif-font" },
  { value: "monospace", label: "Monospace", className: "monospace-font" },
  { value: "fantasy", label: "Fantasy", className: "fantasy-font" },
];

type ZoneKey = "page" | "about" | "blog" | "links";

interface ZoneState {
  color: string;
  imageUrl: string;
  uploading: boolean;
  uploadWarning: string;
}

const ZONES: {
  key: ZoneKey;
  label: string;
  colorField: keyof BackgroundConfig;
  imageField: keyof BackgroundConfig;
}[] = [
  {
    key: "page",
    label: "Page Background",
    colorField: "pageBackgroundColor",
    imageField: "pageBackgroundImageUrl",
  },
  {
    key: "about",
    label: "About Card",
    colorField: "aboutCardColor",
    imageField: "aboutCardImageUrl",
  },
  {
    key: "blog",
    label: "Blog Card",
    colorField: "blogCardColor",
    imageField: "blogCardImageUrl",
  },
  {
    key: "links",
    label: "Links Card",
    colorField: "linksCardColor",
    imageField: "linksCardImageUrl",
  },
];

export default function HeadingEditor() {
  const { data: headingConfig } = useGetHeadingConfig();
  const { data: bgConfig } = useGetBackgroundConfig();
  const updateHeadingConfig = useUpdateHeadingConfig();
  const updateBackgroundConfig = useUpdateBackgroundConfig();

  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"heading" | "background">(
    "heading",
  );

  // --- Heading tab state ---
  const [headingText, setHeadingText] = useState("");
  const [selectedFont, setSelectedFont] = useState("cursive");
  const [selectedColor, setSelectedColor] = useState("#f1f5f9");
  const [bgColor, setBgColor] = useState("");
  const [bgImageUrl, setBgImageUrl] = useState("");
  const [bgMode, setBgMode] = useState<"none" | "color" | "image">("none");
  const [uploadingBg, setUploadingBg] = useState(false);
  const [headerBgWarning, setHeaderBgWarning] = useState("");
  const [error, setError] = useState("");
  const bgImageInputRef = useRef<HTMLInputElement>(null);

  // --- Background tab state ---
  const [zones, setZones] = useState<Record<ZoneKey, ZoneState>>({
    page: { color: "", imageUrl: "", uploading: false, uploadWarning: "" },
    about: { color: "", imageUrl: "", uploading: false, uploadWarning: "" },
    blog: { color: "", imageUrl: "", uploading: false, uploadWarning: "" },
    links: { color: "", imageUrl: "", uploading: false, uploadWarning: "" },
  });
  const [bgSaving, setBgSaving] = useState(false);
  const [bgError, setBgError] = useState("");
  const zoneFileRefs = useRef<Record<ZoneKey, HTMLInputElement | null>>({
    page: null,
    about: null,
    blog: null,
    links: null,
  });

  const handleOpen = () => {
    // Heading tab
    setHeadingText(headingConfig?.text || "my site");
    setSelectedFont(headingConfig?.font || "cursive");
    setSelectedColor(headingConfig?.color || "#f97316");
    const savedBgImg = headingConfig?.backgroundImageUrl ?? "";
    const savedBgColor = headingConfig?.backgroundColor ?? "";
    if (savedBgImg) {
      setBgMode("image");
      setBgImageUrl(savedBgImg);
      setBgColor("");
    } else if (savedBgColor) {
      setBgMode("color");
      setBgColor(savedBgColor);
      setBgImageUrl("");
    } else {
      setBgMode("none");
      setBgColor("");
      setBgImageUrl("");
    }
    setHeaderBgWarning("");
    setError("");

    // Background tab
    setZones({
      page: {
        color: bgConfig?.pageBackgroundColor ?? "",
        imageUrl: bgConfig?.pageBackgroundImageUrl ?? "",
        uploading: false,
        uploadWarning: "",
      },
      about: {
        color: bgConfig?.aboutCardColor ?? "",
        imageUrl: bgConfig?.aboutCardImageUrl ?? "",
        uploading: false,
        uploadWarning: "",
      },
      blog: {
        color: bgConfig?.blogCardColor ?? "",
        imageUrl: bgConfig?.blogCardImageUrl ?? "",
        uploading: false,
        uploadWarning: "",
      },
      links: {
        color: bgConfig?.linksCardColor ?? "",
        imageUrl: bgConfig?.linksCardImageUrl ?? "",
        uploading: false,
        uploadWarning: "",
      },
    });
    setBgError("");

    setActiveTab("heading");
    setIsOpen(true);
  };

  // ---- Heading tab handlers ----
  const handleBgImageUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingBg(true);
    setError("");
    setHeaderBgWarning("");
    try {
      const result = await uploadFile(file, (msg) => setHeaderBgWarning(msg));
      setBgImageUrl(result.url);
      setBgMode("image");
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to upload background image. Please try again.",
      );
    } finally {
      setUploadingBg(false);
    }
  };

  const handleSaveHeading = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!headingText.trim()) {
      setError("Heading text cannot be empty");
      return;
    }
    try {
      await updateHeadingConfig.mutateAsync({
        text: headingText.trim(),
        font: selectedFont,
        color: selectedColor,
        backgroundColor: bgMode === "color" && bgColor ? bgColor : undefined,
        backgroundImageUrl:
          bgMode === "image" && bgImageUrl ? bgImageUrl : undefined,
      });
      setIsOpen(false);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to update heading");
    }
  };

  // ---- Background tab helpers ----
  const setZoneField = (
    key: ZoneKey,
    field: keyof ZoneState,
    value: string | boolean,
  ) => {
    setZones((prev) => ({ ...prev, [key]: { ...prev[key], [field]: value } }));
  };

  const handleZoneImageUpload = async (
    key: ZoneKey,
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setZoneField(key, "uploading", true);
    setZoneField(key, "uploadWarning", "");
    setBgError("");
    try {
      const result = await uploadFile(file, (msg) =>
        setZoneField(key, "uploadWarning", msg),
      );
      setZoneField(key, "imageUrl", result.url);
    } catch (err: unknown) {
      setBgError(
        err instanceof Error
          ? err.message
          : `Failed to upload image for ${key}. Please try again.`,
      );
    } finally {
      setZoneField(key, "uploading", false);
    }
  };

  const handleSaveBackground = async () => {
    setBgSaving(true);
    setBgError("");
    try {
      await updateBackgroundConfig.mutateAsync({
        pageBackgroundColor: zones.page.color || undefined,
        pageBackgroundImageUrl: zones.page.imageUrl || undefined,
        aboutCardColor: zones.about.color || undefined,
        aboutCardImageUrl: zones.about.imageUrl || undefined,
        blogCardColor: zones.blog.color || undefined,
        blogCardImageUrl: zones.blog.imageUrl || undefined,
        linksCardColor: zones.links.color || undefined,
        linksCardImageUrl: zones.links.imageUrl || undefined,
      });
      setIsOpen(false);
    } catch (err: unknown) {
      setBgError(
        err instanceof Error
          ? err.message
          : "Failed to save background settings",
      );
    } finally {
      setBgSaving(false);
    }
  };

  const handleCancel = () => {
    setIsOpen(false);
    setError("");
    setBgError("");
  };

  const getPreviewFontClass = (font: string) => {
    const option = FONT_OPTIONS.find((f) => f.value === font);
    return option?.className || "cursive-font";
  };

  const previewBgStyle: React.CSSProperties = {};
  if (bgMode === "image" && bgImageUrl) {
    previewBgStyle.backgroundImage = `url(${bgImageUrl})`;
    previewBgStyle.backgroundSize = "cover";
    previewBgStyle.backgroundPosition = "center";
  } else if (bgMode === "color" && bgColor) {
    previewBgStyle.backgroundColor = bgColor;
  }

  const anyZoneUploading = Object.values(zones).some((z) => z.uploading);

  return (
    <>
      <button
        type="button"
        onClick={handleOpen}
        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg transition-colors"
        title="Edit Heading & Backgrounds"
        data-ocid="heading.edit_button"
      >
        <Edit2 className="w-4 h-4" />
        Edit
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-slate-800 rounded-lg w-full max-w-2xl border border-slate-700 my-4">
            {/* Modal header */}
            <div className="flex items-center justify-between px-6 pt-6 pb-4">
              <div className="flex items-center gap-3">
                <Type className="w-6 h-6 text-blue-400" />
                <h2 className="text-xl font-semibold text-slate-100">
                  Edit Page
                </h2>
              </div>
              <button
                type="button"
                onClick={handleCancel}
                className="text-slate-400 hover:text-slate-200 transition-colors"
                data-ocid="heading.close_button"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-slate-700 px-6">
              <button
                type="button"
                onClick={() => setActiveTab("heading")}
                className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === "heading"
                    ? "border-blue-500 text-blue-400"
                    : "border-transparent text-slate-400 hover:text-slate-200"
                }`}
                data-ocid="heading.tab_heading"
              >
                <Type className="w-4 h-4" />
                Page Heading
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("background")}
                className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === "background"
                    ? "border-purple-500 text-purple-400"
                    : "border-transparent text-slate-400 hover:text-slate-200"
                }`}
                data-ocid="heading.tab_background"
              >
                <Layers className="w-4 h-4" />
                Page Background
              </button>
            </div>

            {/* ====== PAGE HEADING TAB ====== */}
            {activeTab === "heading" && (
              <form onSubmit={handleSaveHeading} className="p-6 space-y-6">
                {/* Heading Text */}
                <div>
                  <label
                    htmlFor="heading-text"
                    className="block text-sm font-medium text-slate-200 mb-2"
                  >
                    Heading Text
                  </label>
                  <input
                    id="heading-text"
                    type="text"
                    value={headingText}
                    onChange={(e) => setHeadingText(e.target.value)}
                    placeholder="Enter heading text"
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                    data-ocid="heading.input"
                  />
                </div>

                {/* Font Selection */}
                <div>
                  <p className="block text-sm font-medium text-slate-200 mb-2">
                    Font Style
                  </p>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {FONT_OPTIONS.map((font) => (
                      <button
                        key={font.value}
                        type="button"
                        onClick={() => setSelectedFont(font.value)}
                        className={`p-3 rounded border text-left transition-colors ${
                          selectedFont === font.value
                            ? "border-blue-500 bg-blue-600/20 text-blue-300"
                            : "border-slate-600 bg-slate-700 text-slate-300 hover:border-slate-500"
                        }`}
                      >
                        <div className={`text-lg ${font.className}`}>Aa</div>
                        <div className="text-xs mt-1">{font.label}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Text Color */}
                <div>
                  <p className="block text-sm font-medium text-slate-200 mb-2">
                    <Palette className="w-4 h-4 inline mr-1" />
                    Text Color
                  </p>
                  <input
                    type="color"
                    value={selectedColor}
                    onChange={(e) => setSelectedColor(e.target.value)}
                    className="h-10 w-24 rounded cursor-pointer border border-slate-600 bg-slate-700"
                    data-ocid="heading.color_input"
                  />
                </div>

                {/* Header Background */}
                <div className="space-y-3">
                  <p className="block text-sm font-medium text-slate-200">
                    <Image className="w-4 h-4 inline mr-1" />
                    Header Background
                  </p>
                  <p className="text-xs text-slate-400">
                    Set a color or image for the page header area.
                  </p>
                  <div className="flex gap-2">
                    {(["none", "color", "image"] as const).map((mode) => (
                      <button
                        key={mode}
                        type="button"
                        onClick={() => setBgMode(mode)}
                        className={`px-3 py-1.5 rounded text-sm border transition-colors capitalize ${
                          bgMode === mode
                            ? "border-blue-500 bg-blue-600/20 text-blue-300"
                            : "border-slate-600 bg-slate-700 text-slate-300 hover:border-slate-500"
                        }`}
                      >
                        {mode === "none"
                          ? "Default"
                          : mode === "color"
                            ? "Color"
                            : "Image"}
                      </button>
                    ))}
                  </div>

                  {bgMode === "color" && (
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={bgColor || "#1e293b"}
                        onChange={(e) => setBgColor(e.target.value)}
                        className="h-10 w-24 rounded cursor-pointer border border-slate-600 bg-slate-700"
                        data-ocid="heading.bg_color_input"
                      />
                      {bgColor && (
                        <button
                          type="button"
                          onClick={() => setBgColor("")}
                          className="flex items-center gap-1 text-slate-400 hover:text-red-400 text-sm transition-colors"
                        >
                          <Trash2 className="w-3 h-3" /> Clear
                        </button>
                      )}
                    </div>
                  )}

                  {bgMode === "image" && (
                    <div className="space-y-2">
                      <p className="text-xs text-amber-400">
                        ⚠ Images must be under 2 MB (ICP canister limit). Large
                        images will be compressed automatically.
                      </p>
                      <div className="flex gap-2 items-center">
                        <button
                          type="button"
                          onClick={() => bgImageInputRef.current?.click()}
                          disabled={uploadingBg}
                          className="flex items-center gap-2 bg-slate-600 hover:bg-slate-500 disabled:opacity-50 text-white px-3 py-2 rounded text-sm transition-colors"
                          data-ocid="heading.bg_upload_button"
                        >
                          <Image className="w-4 h-4" />
                          {uploadingBg ? "Uploading…" : "Upload Image"}
                        </button>
                        {bgImageUrl && (
                          <button
                            type="button"
                            onClick={() => setBgImageUrl("")}
                            className="flex items-center gap-1 text-slate-400 hover:text-red-400 text-sm transition-colors"
                          >
                            <Trash2 className="w-3 h-3" /> Remove
                          </button>
                        )}
                      </div>
                      {headerBgWarning && (
                        <p className="text-xs text-amber-400">
                          {headerBgWarning}
                        </p>
                      )}
                      <input
                        ref={bgImageInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleBgImageUpload}
                      />
                      {bgImageUrl && (
                        <img
                          src={bgImageUrl}
                          alt="Background preview"
                          className="h-16 w-full object-cover rounded border border-slate-600"
                        />
                      )}
                    </div>
                  )}
                </div>

                {/* Live preview */}
                <div>
                  <p className="block text-xs font-medium text-slate-400 mb-2">
                    Preview
                  </p>
                  <div
                    className="p-6 rounded border border-slate-600 text-center"
                    style={previewBgStyle}
                  >
                    <h1
                      className={`text-3xl font-bold ${getPreviewFontClass(
                        selectedFont,
                      )}`}
                      style={{ color: selectedColor }}
                    >
                      {headingText || "my site"}
                    </h1>
                  </div>
                </div>

                {error && <p className="text-red-400 text-sm">{error}</p>}

                <div className="flex gap-3">
                  <button
                    type="submit"
                    disabled={updateHeadingConfig.isPending || uploadingBg}
                    className="flex items-center gap-2 bg-green-600 hover:bg-green-700 disabled:bg-slate-600 text-white px-4 py-2 rounded transition-colors"
                    data-ocid="heading.submit_button"
                  >
                    <Save className="w-4 h-4" />
                    {updateHeadingConfig.isPending ? "Saving…" : "Save Changes"}
                  </button>
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="flex items-center gap-2 bg-slate-600 hover:bg-slate-500 text-white px-4 py-2 rounded transition-colors"
                    data-ocid="heading.cancel_button"
                  >
                    <X className="w-4 h-4" />
                    Cancel
                  </button>
                </div>
              </form>
            )}

            {/* ====== PAGE BACKGROUND TAB ====== */}
            {activeTab === "background" && (
              <div className="p-6 space-y-5">
                <p className="text-sm text-slate-400">
                  Set colors or background images for the page and each card
                  section. Images are automatically compressed if over 2 MB.
                </p>

                {ZONES.map((zone) => {
                  const z = zones[zone.key];
                  return (
                    <div
                      key={zone.key}
                      className="p-4 bg-slate-700 rounded-lg border border-slate-600"
                    >
                      <p className="text-sm font-semibold text-slate-200 mb-3">
                        {zone.label}
                      </p>

                      {/* Color row */}
                      <div className="flex flex-wrap items-center gap-3 mb-3">
                        <span className="text-xs text-slate-400 w-12">
                          Color
                        </span>
                        <input
                          type="color"
                          value={z.color || "#1e293b"}
                          onChange={(e) =>
                            setZoneField(zone.key, "color", e.target.value)
                          }
                          className="h-9 w-20 rounded cursor-pointer border border-slate-500 bg-slate-600"
                          data-ocid={`bg.${zone.key}_color_input`}
                        />
                        {z.color && (
                          <button
                            type="button"
                            onClick={() => setZoneField(zone.key, "color", "")}
                            className="flex items-center gap-1 text-xs text-slate-400 hover:text-red-400 transition-colors"
                            data-ocid={`bg.${zone.key}_color_clear`}
                          >
                            <Trash2 className="w-3 h-3" /> Clear color
                          </button>
                        )}
                      </div>

                      {/* Image upload row */}
                      <div className="flex flex-wrap items-center gap-3">
                        <span className="text-xs text-slate-400 w-12">
                          Image
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            zoneFileRefs.current[zone.key]?.click()
                          }
                          disabled={z.uploading}
                          className="flex items-center gap-2 bg-slate-600 hover:bg-slate-500 disabled:opacity-50 text-white px-3 py-1.5 rounded text-xs transition-colors"
                          data-ocid={`bg.${zone.key}_upload_button`}
                        >
                          <Image className="w-3 h-3" />
                          {z.uploading ? "Uploading…" : "Upload Image"}
                        </button>
                        {z.imageUrl && (
                          <button
                            type="button"
                            onClick={() =>
                              setZoneField(zone.key, "imageUrl", "")
                            }
                            className="flex items-center gap-1 text-xs text-slate-400 hover:text-red-400 transition-colors"
                            data-ocid={`bg.${zone.key}_image_clear`}
                          >
                            <Trash2 className="w-3 h-3" /> Remove image
                          </button>
                        )}
                        <input
                          ref={(el) => {
                            zoneFileRefs.current[zone.key] = el;
                          }}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => handleZoneImageUpload(zone.key, e)}
                        />
                      </div>

                      {/* Upload warning */}
                      {z.uploadWarning && (
                        <p className="mt-2 text-xs text-amber-400">
                          {z.uploadWarning}
                        </p>
                      )}

                      {/* Image preview */}
                      {z.imageUrl && (
                        <img
                          src={z.imageUrl}
                          alt={`${zone.label} background preview`}
                          className="mt-3 h-20 w-full object-cover rounded border border-slate-600"
                        />
                      )}
                    </div>
                  );
                })}

                {bgError && <p className="text-red-400 text-sm">{bgError}</p>}

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={handleSaveBackground}
                    disabled={bgSaving || anyZoneUploading}
                    className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 disabled:bg-slate-600 text-white px-4 py-2 rounded transition-colors"
                    data-ocid="bg.submit_button"
                  >
                    <Save className="w-4 h-4" />
                    {bgSaving ? "Saving…" : "Save Backgrounds"}
                  </button>
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="flex items-center gap-2 bg-slate-600 hover:bg-slate-500 text-white px-4 py-2 rounded transition-colors"
                    data-ocid="bg.cancel_button"
                  >
                    <X className="w-4 h-4" />
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
