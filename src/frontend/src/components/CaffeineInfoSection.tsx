import { uploadFile } from "@/utils/uploadFile";
import {
  Coffee,
  Edit2,
  Plus,
  Save,
  Sparkles,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import type React from "react";
import { useEffect, useRef, useState } from "react";
import type { CaffeineInfoScreenRecord } from "../backend";
import {
  useGetCaffeineInfo,
  useGetCaffeineInfoConfig,
  useUpdateCaffeineInfo,
  useUpdateCaffeineInfoConfig,
} from "../hooks/useQueries";

interface LocalScreen {
  id: string;
  title: string;
  content: string;
  order: number;
  mediaUrl?: string;
}

interface CaffeineInfoSectionProps {
  isAdmin: boolean;
  cardBgStyle?: React.CSSProperties;
}

const DEFAULT_SECTION_TITLE = "About Caffeine AI";

const defaultScreens: LocalScreen[] = [
  {
    id: "default-0",
    title: "AI-Powered Development",
    content:
      "Caffeine is an advanced AI system designed to accelerate software development. It understands code patterns, generates intelligent solutions, and helps developers build applications faster than ever before.",
    order: 0,
  },
  {
    id: "default-1",
    title: "Smart Code Generation",
    content:
      "With deep understanding of programming languages and frameworks, Caffeine can generate complete applications, components, and functions based on natural language descriptions and requirements.",
    order: 1,
  },
  {
    id: "default-2",
    title: "Intelligent Problem Solving",
    content:
      "Caffeine analyzes complex technical challenges and provides optimized solutions. It can debug code, suggest improvements, and implement best practices automatically.",
    order: 2,
  },
  {
    id: "default-3",
    title: "Multi-Language Support",
    content:
      "Supporting dozens of programming languages and frameworks, Caffeine adapts to your tech stack. From React and TypeScript to Python and Rust, it speaks your language.",
    order: 3,
  },
  {
    id: "default-4",
    title: "Real-Time Collaboration",
    content:
      "Work alongside Caffeine as your AI pair programmer. It understands context, maintains code consistency, and helps you iterate quickly on ideas and implementations.",
    order: 4,
  },
];

function toLocalScreens(records: CaffeineInfoScreenRecord[]): LocalScreen[] {
  return [...records]
    .sort((a, b) => Number(a.order) - Number(b.order))
    .map((r) => ({
      id: r.id,
      title: r.title,
      content: r.content,
      order: Number(r.order),
      mediaUrl: r.mediaUrl,
    }));
}

function toBackendScreens(screens: LocalScreen[]): CaffeineInfoScreenRecord[] {
  return screens.map((s, idx) => ({
    id: s.id,
    title: s.title,
    content: s.content,
    order: BigInt(idx),
    mediaUrl: s.mediaUrl,
  }));
}

function isVideoUrl(url: string): boolean {
  return /\.(mp4|webm|mov|avi|ogv)$/i.test(url);
}

function MediaDisplay({ url }: { url: string }) {
  if (isVideoUrl(url)) {
    return (
      <video
        src={url}
        controls
        className="w-full rounded-lg mb-3 max-h-64 object-cover"
      >
        <track kind="captions" />
      </video>
    );
  }
  return (
    <img
      src={url}
      alt=""
      className="w-full rounded-lg mb-3 max-h-64 object-cover"
    />
  );
}

function ScreenMediaUpload({
  screenId,
  currentMediaUrl,
  onUpload,
  onRemove,
}: {
  screenId: string;
  currentMediaUrl?: string;
  onUpload: (url: string) => void;
  onRemove: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setUploadError(null);
    try {
      const result = await uploadFile(file);
      onUpload(result.url);
    } catch (err) {
      console.error("Upload failed:", err);
      setUploadError("Upload failed. Please try again.");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div className="mt-2">
      {currentMediaUrl && (
        <div className="mb-2 flex items-center gap-2">
          <span className="text-xs text-slate-400 truncate max-w-[200px]">
            {currentMediaUrl.split("/").pop()}
          </span>
          <button
            type="button"
            onClick={onRemove}
            className="text-red-400 hover:text-red-300 transition-colors p-1"
            title="Remove media"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/*,video/*"
        onChange={handleFile}
        className="hidden"
        id={`media-upload-${screenId}`}
      />
      <label
        htmlFor={`media-upload-${screenId}`}
        className={`inline-flex items-center gap-1.5 px-2 py-1 rounded text-xs cursor-pointer transition-colors ${
          uploading
            ? "bg-slate-600 text-slate-400 cursor-not-allowed"
            : "bg-slate-600 hover:bg-slate-500 text-slate-300"
        }`}
      >
        <Upload className="w-3 h-3" />
        {uploading
          ? "Uploading..."
          : currentMediaUrl
            ? "Replace media"
            : "Upload image/video"}
      </label>
      {uploadError && (
        <p className="text-red-400 text-xs mt-1">{uploadError}</p>
      )}
    </div>
  );
}

export default function CaffeineInfoSection({
  isAdmin,
  cardBgStyle,
}: CaffeineInfoSectionProps) {
  const { data: legacyCaffeineInfo, isLoading: legacyLoading } =
    useGetCaffeineInfo();
  const updateCaffeineInfo = useUpdateCaffeineInfo();

  const { data: configData, isLoading: configLoading } =
    useGetCaffeineInfoConfig();
  const updateConfig = useUpdateCaffeineInfoConfig();

  const [isEditing, setIsEditing] = useState(false);
  const [isManaging, setIsManaging] = useState(false);
  const [currentInfoIndex, setCurrentInfoIndex] = useState(0);
  const [isRotationPaused, setIsRotationPaused] = useState(false);

  const [editSectionTitle, setEditSectionTitle] = useState(
    DEFAULT_SECTION_TITLE,
  );
  const [editScreens, setEditScreens] = useState<LocalScreen[]>(defaultScreens);
  const [editingTitleMode, setEditingTitleMode] = useState(false);
  const [pendingTitle, setPendingTitle] = useState("");
  const [editingScreenId, setEditingScreenId] = useState<string | null>(null);
  const [editScreenData, setEditScreenData] = useState({
    title: "",
    content: "",
  });
  const [editScreenMediaMode, setEditScreenMediaMode] = useState<
    "text" | "media"
  >("text");
  const [editScreenMediaUrl, setEditScreenMediaUrl] = useState<
    string | undefined
  >(undefined);
  const [isAddingScreen, setIsAddingScreen] = useState(false);
  const [newScreen, setNewScreen] = useState({ title: "", content: "" });
  const [newScreenMediaMode, setNewScreenMediaMode] = useState<
    "text" | "media"
  >("text");
  const [newScreenMediaUrl, setNewScreenMediaUrl] = useState<
    string | undefined
  >(undefined);
  const [saveError, setSaveError] = useState<string | null>(null);

  const [editContent, setEditContent] = useState("");

  const displaySectionTitle = configData?.sectionTitle ?? DEFAULT_SECTION_TITLE;
  const displayScreens =
    configData && configData.screens.length > 0
      ? toLocalScreens(configData.screens)
      : defaultScreens;

  const useLegacyMode =
    legacyCaffeineInfo !== null && legacyCaffeineInfo !== undefined;

  const isLoading = legacyLoading || configLoading;

  useEffect(() => {
    if (
      !useLegacyMode &&
      !isRotationPaused &&
      displayScreens.length > 0 &&
      !isEditing &&
      !isManaging
    ) {
      const interval = setInterval(() => {
        setCurrentInfoIndex((prev) => (prev + 1) % displayScreens.length);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [
    useLegacyMode,
    isRotationPaused,
    displayScreens.length,
    isEditing,
    isManaging,
  ]);

  const handleTextClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (
      isRotationPaused &&
      !useLegacyMode &&
      !isEditing &&
      !isManaging &&
      displayScreens.length > 0
    ) {
      setCurrentInfoIndex((prev) => (prev + 1) % displayScreens.length);
    }
  };

  const handleProgressClick = (index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!useLegacyMode && !isEditing && !isManaging) {
      setIsRotationPaused(true);
      setCurrentInfoIndex(index);
    }
  };

  const startLegacyEdit = () => {
    if (!isAdmin) return;
    setEditContent(legacyCaffeineInfo?.content || "");
    setIsEditing(true);
  };

  const cancelLegacyEdit = () => {
    setIsEditing(false);
    setEditContent("");
  };

  const handleLegacySave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editContent.trim()) {
      try {
        await updateCaffeineInfo.mutateAsync(editContent.trim());
        setIsEditing(false);
        setEditContent("");
      } catch (error) {
        console.error("Failed to update caffeine info:", error);
      }
    }
  };

  const startManaging = () => {
    if (!isAdmin) return;
    setEditSectionTitle(displaySectionTitle);
    setEditScreens(displayScreens);
    setSaveError(null);
    setEditingTitleMode(false);
    setEditingScreenId(null);
    setIsAddingScreen(false);
    setNewScreen({ title: "", content: "" });
    setNewScreenMediaMode("text");
    setNewScreenMediaUrl(undefined);
    setEditScreenData({ title: "", content: "" });
    setIsManaging(true);
  };

  const cancelManaging = () => {
    setIsManaging(false);
    setEditingTitleMode(false);
    setEditingScreenId(null);
    setIsAddingScreen(false);
    setPendingTitle("");
    setNewScreen({ title: "", content: "" });
    setNewScreenMediaMode("text");
    setNewScreenMediaUrl(undefined);
    setEditScreenData({ title: "", content: "" });
    setSaveError(null);
  };

  const handleUpdateSectionTitle = (e: React.FormEvent) => {
    e.preventDefault();
    if (pendingTitle.trim()) {
      setEditSectionTitle(pendingTitle.trim());
      setEditingTitleMode(false);
    }
  };

  const handleAddScreen = (e: React.FormEvent) => {
    e.preventDefault();
    const hasText = newScreen.title.trim() || newScreen.content.trim();
    const hasMedia = newScreenMediaMode === "media" && newScreenMediaUrl;
    if (!hasText && !hasMedia) return;
    const screen: LocalScreen = {
      id: `new-${Date.now()}`,
      title: newScreen.title.trim(),
      content:
        newScreenMediaMode === "media"
          ? newScreen.content
          : newScreen.content.trim(),
      order: editScreens.length,
      mediaUrl: newScreenMediaMode === "media" ? newScreenMediaUrl : undefined,
    };
    setEditScreens([...editScreens, screen]);
    setNewScreen({ title: "", content: "" });
    setNewScreenMediaMode("text");
    setNewScreenMediaUrl(undefined);
    setIsAddingScreen(false);
  };

  const startEditScreen = (screen: LocalScreen) => {
    setEditingScreenId(screen.id);
    setEditScreenData({ title: screen.title, content: screen.content });
    setEditScreenMediaMode(screen.mediaUrl ? "media" : "text");
    setEditScreenMediaUrl(screen.mediaUrl);
  };

  const handleEditScreen = (e: React.FormEvent) => {
    e.preventDefault();
    if (
      editingScreenId !== null &&
      editScreenData.title.trim() &&
      (editScreenMediaMode === "media" || editScreenData.content.trim())
    ) {
      setEditScreens(
        editScreens.map((s) =>
          s.id === editingScreenId
            ? {
                ...s,
                title: editScreenData.title.trim(),
                content:
                  editScreenMediaMode === "media"
                    ? editScreenData.content
                    : editScreenData.content.trim(),
                mediaUrl:
                  editScreenMediaMode === "media"
                    ? editScreenMediaUrl
                    : undefined,
              }
            : s,
        ),
      );
      setEditingScreenId(null);
      setEditScreenData({ title: "", content: "" });
      setEditScreenMediaMode("text");
      setEditScreenMediaUrl(undefined);
    }
  };

  const handleDeleteScreen = (id: string) => {
    if (window.confirm("Are you sure you want to delete this screen?")) {
      const updated = editScreens.filter((s) => s.id !== id);
      setEditScreens(updated);
      if (currentInfoIndex >= updated.length) {
        setCurrentInfoIndex(0);
      }
    }
  };

  const handleScreenMediaUpload = (screenId: string, url: string) => {
    setEditScreens((prev) =>
      prev.map((s) => (s.id === screenId ? { ...s, mediaUrl: url } : s)),
    );
  };

  const handleScreenMediaRemove = (screenId: string) => {
    setEditScreens((prev) =>
      prev.map((s) => (s.id === screenId ? { ...s, mediaUrl: undefined } : s)),
    );
  };

  const handleSaveAll = async () => {
    setSaveError(null);
    try {
      await updateConfig.mutateAsync({
        sectionTitle: editSectionTitle,
        screens: toBackendScreens(editScreens),
      });
      setIsManaging(false);
    } catch (err) {
      console.error("Failed to save about section:", err);
      setSaveError("Failed to save changes. Please try again.");
    }
  };

  const formatDate = (timestamp: bigint) => {
    const date = new Date(Number(timestamp) / 1000000);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const currentScreen = displayScreens[currentInfoIndex] || displayScreens[0];

  return (
    <div
      className="bg-slate-800 rounded-lg p-6 border border-slate-700 transition-colors"
      style={cardBgStyle}
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex-1 flex justify-center">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Coffee className="w-6 h-6 text-orange-400" />
              <Sparkles className="w-3 h-3 text-yellow-400 absolute -top-1 -right-1 animate-pulse" />
            </div>
            <h2 className="text-xl font-semibold text-slate-100">
              {isManaging ? editSectionTitle : displaySectionTitle}
            </h2>
          </div>
        </div>
        {isAdmin && !isEditing && !isManaging && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              if (useLegacyMode) {
                startLegacyEdit();
              } else {
                startManaging();
              }
            }}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg transition-colors"
          >
            <Edit2 className="w-4 h-4" />
            Edit
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="text-center py-8 text-slate-400">
          Loading about section...
        </div>
      ) : isManaging ? (
        <div
          onClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => e.stopPropagation()}
          className="space-y-6"
        >
          {/* Section Title Management */}
          <div className="p-4 bg-slate-700 rounded-lg border border-slate-600">
            <h3 className="text-lg font-medium text-slate-100 mb-3">
              Section Title
            </h3>
            {editingTitleMode ? (
              <form onSubmit={handleUpdateSectionTitle} className="flex gap-2">
                <input
                  type="text"
                  value={pendingTitle}
                  onChange={(e) => setPendingTitle(e.target.value)}
                  className="flex-1 px-3 py-2 bg-slate-600 border border-slate-500 rounded text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
                <button
                  type="submit"
                  className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded transition-colors"
                >
                  <Save className="w-4 h-4" />
                  Set
                </button>
                <button
                  type="button"
                  onClick={() => setEditingTitleMode(false)}
                  className="flex items-center gap-2 bg-slate-600 hover:bg-slate-500 text-white px-3 py-2 rounded transition-colors"
                >
                  <X className="w-4 h-4" />
                  Cancel
                </button>
              </form>
            ) : (
              <div className="flex items-center justify-between">
                <span className="text-slate-300">{editSectionTitle}</span>
                <button
                  type="button"
                  onClick={() => {
                    setPendingTitle(editSectionTitle);
                    setEditingTitleMode(true);
                  }}
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded transition-colors"
                >
                  <Edit2 className="w-4 h-4" />
                  Edit Title
                </button>
              </div>
            )}
          </div>

          {/* Screens Management */}
          <div className="p-4 bg-slate-700 rounded-lg border border-slate-600">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-slate-100">
                Information Screens
              </h3>
              <button
                type="button"
                onClick={() => setIsAddingScreen(true)}
                className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add Screen
              </button>
            </div>

            {/* Add New Screen Form */}
            {isAddingScreen && (
              <form
                onSubmit={handleAddScreen}
                className="mb-4 p-4 bg-slate-600 rounded border border-slate-500"
              >
                {/* Screen title (optional) */}
                <div className="mb-3">
                  <input
                    type="text"
                    value={newScreen.title}
                    onChange={(e) =>
                      setNewScreen({ ...newScreen, title: e.target.value })
                    }
                    placeholder="Screen title (optional)"
                    className="w-full px-3 py-2 bg-slate-500 border border-slate-400 rounded text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                {/* Content mode toggle */}
                <div className="flex gap-1 mb-3">
                  <button
                    type="button"
                    onClick={() => setNewScreenMediaMode("text")}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                      newScreenMediaMode === "text"
                        ? "bg-blue-600 text-white"
                        : "bg-slate-500 text-slate-300 hover:bg-slate-400"
                    }`}
                  >
                    📝 Text
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewScreenMediaMode("media")}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                      newScreenMediaMode === "media"
                        ? "bg-blue-600 text-white"
                        : "bg-slate-500 text-slate-300 hover:bg-slate-400"
                    }`}
                  >
                    🖼️ Image / Video
                  </button>
                </div>
                {/* Text content area (only in text mode) */}
                {newScreenMediaMode === "text" && (
                  <div className="mb-3">
                    <textarea
                      value={newScreen.content}
                      onChange={(e) =>
                        setNewScreen({ ...newScreen, content: e.target.value })
                      }
                      placeholder="Screen content (optional)"
                      rows={4}
                      className="w-full px-3 py-2 bg-slate-500 border border-slate-400 rounded text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    />
                  </div>
                )}
                {/* Media upload (only in media mode) */}
                {newScreenMediaMode === "media" && (
                  <div className="mb-3">
                    {newScreenMediaUrl && (
                      <div className="mb-2">
                        {isVideoUrl(newScreenMediaUrl) ? (
                          <video
                            src={newScreenMediaUrl}
                            controls
                            className="w-full rounded max-h-40 object-cover mb-1"
                          >
                            <track kind="captions" />
                          </video>
                        ) : (
                          <img
                            src={newScreenMediaUrl}
                            alt="preview"
                            className="w-full rounded max-h-40 object-cover mb-1"
                          />
                        )}
                        <button
                          type="button"
                          onClick={() => setNewScreenMediaUrl(undefined)}
                          className="flex items-center gap-1 text-xs text-red-400 hover:text-red-300 transition-colors"
                        >
                          <X className="w-3 h-3" /> Remove media
                        </button>
                      </div>
                    )}
                    <ScreenMediaUpload
                      screenId="new-screen"
                      currentMediaUrl={newScreenMediaUrl}
                      onUpload={(url) => setNewScreenMediaUrl(url)}
                      onRemove={() => setNewScreenMediaUrl(undefined)}
                    />
                    {!newScreenMediaUrl && (
                      <p className="text-xs text-slate-400 mt-1">
                        Upload an image or video to display on this screen
                      </p>
                    )}
                    {/* Optional caption for media screens */}
                    <div className="mt-3">
                      <input
                        type="text"
                        value={newScreen.content}
                        onChange={(e) =>
                          setNewScreen({
                            ...newScreen,
                            content: e.target.value,
                          })
                        }
                        placeholder="Optional caption text (shown below media)"
                        className="w-full px-3 py-2 bg-slate-500 border border-slate-400 rounded text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      />
                    </div>
                  </div>
                )}
                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded transition-colors"
                  >
                    <Save className="w-4 h-4" />
                    Add
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsAddingScreen(false);
                      setNewScreen({ title: "", content: "" });
                      setNewScreenMediaMode("text");
                      setNewScreenMediaUrl(undefined);
                    }}
                    className="flex items-center gap-2 bg-slate-600 hover:bg-slate-500 text-white px-3 py-2 rounded transition-colors"
                  >
                    <X className="w-4 h-4" />
                    Cancel
                  </button>
                </div>
              </form>
            )}

            {/* Existing Screens */}
            <div className="space-y-3">
              {editScreens.map((screen: LocalScreen, index: number) => (
                <div
                  key={screen.id}
                  className="p-3 bg-slate-600 rounded border border-slate-500"
                >
                  {editingScreenId === screen.id ? (
                    <form onSubmit={handleEditScreen}>
                      {/* Screen title */}
                      <div className="mb-3">
                        <input
                          type="text"
                          value={editScreenData.title}
                          onChange={(e) =>
                            setEditScreenData({
                              ...editScreenData,
                              title: e.target.value,
                            })
                          }
                          placeholder="Screen title"
                          className="w-full px-3 py-2 bg-slate-500 border border-slate-400 rounded text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          required
                        />
                      </div>
                      {/* Content mode toggle */}
                      <div className="flex gap-1 mb-3">
                        <button
                          type="button"
                          onClick={() => setEditScreenMediaMode("text")}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                            editScreenMediaMode === "text"
                              ? "bg-blue-600 text-white"
                              : "bg-slate-500 text-slate-300 hover:bg-slate-400"
                          }`}
                        >
                          📝 Text
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditScreenMediaMode("media")}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                            editScreenMediaMode === "media"
                              ? "bg-blue-600 text-white"
                              : "bg-slate-500 text-slate-300 hover:bg-slate-400"
                          }`}
                        >
                          🖼️ Image / Video
                        </button>
                      </div>
                      {/* Text content area (only in text mode) */}
                      {editScreenMediaMode === "text" && (
                        <div className="mb-3">
                          <textarea
                            value={editScreenData.content}
                            onChange={(e) =>
                              setEditScreenData({
                                ...editScreenData,
                                content: e.target.value,
                              })
                            }
                            placeholder="Screen content"
                            rows={4}
                            className="w-full px-3 py-2 bg-slate-500 border border-slate-400 rounded text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                            required
                          />
                        </div>
                      )}
                      {/* Media upload (only in media mode) */}
                      {editScreenMediaMode === "media" && (
                        <div className="mb-3">
                          {editScreenMediaUrl && (
                            <div className="mb-2">
                              {isVideoUrl(editScreenMediaUrl) ? (
                                <video
                                  src={editScreenMediaUrl}
                                  controls
                                  className="w-full rounded max-h-40 object-cover mb-1"
                                >
                                  <track kind="captions" />
                                </video>
                              ) : (
                                <img
                                  src={editScreenMediaUrl}
                                  alt="preview"
                                  className="w-full rounded max-h-40 object-cover mb-1"
                                />
                              )}
                              <button
                                type="button"
                                onClick={() => setEditScreenMediaUrl(undefined)}
                                className="flex items-center gap-1 text-xs text-red-400 hover:text-red-300 transition-colors"
                              >
                                <X className="w-3 h-3" /> Remove media
                              </button>
                            </div>
                          )}
                          <ScreenMediaUpload
                            screenId={`edit-${screen.id}`}
                            currentMediaUrl={editScreenMediaUrl}
                            onUpload={(url) => setEditScreenMediaUrl(url)}
                            onRemove={() => setEditScreenMediaUrl(undefined)}
                          />
                          {!editScreenMediaUrl && (
                            <p className="text-xs text-slate-400 mt-1">
                              Upload an image or video to display on this screen
                            </p>
                          )}
                          {/* Optional caption for media screens */}
                          <div className="mt-3">
                            <input
                              type="text"
                              value={editScreenData.content}
                              onChange={(e) =>
                                setEditScreenData({
                                  ...editScreenData,
                                  content: e.target.value,
                                })
                              }
                              placeholder="Optional caption text (shown below media)"
                              className="w-full px-3 py-2 bg-slate-500 border border-slate-400 rounded text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                            />
                          </div>
                        </div>
                      )}
                      <div className="flex gap-2">
                        <button
                          type="submit"
                          className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-2 py-1 rounded transition-colors text-sm"
                        >
                          <Save className="w-3 h-3" />
                          Update
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingScreenId(null);
                            setEditScreenData({ title: "", content: "" });
                            setEditScreenMediaMode("text");
                            setEditScreenMediaUrl(undefined);
                          }}
                          className="flex items-center gap-2 bg-slate-600 hover:bg-slate-500 text-white px-2 py-1 rounded transition-colors text-sm"
                        >
                          <X className="w-3 h-3" />
                          Cancel
                        </button>
                      </div>
                    </form>
                  ) : (
                    <>
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <h4 className="font-medium text-slate-100 mb-1">
                            {screen.title}
                          </h4>
                          <p className="text-slate-300 text-sm line-clamp-2">
                            {screen.content}
                          </p>
                          {/* Media preview in edit list */}
                          {screen.mediaUrl && (
                            <div className="mt-2 flex items-center gap-1 text-xs text-slate-400">
                              {isVideoUrl(screen.mediaUrl) ? "🎬" : "🖼️"}
                              <span className="truncate max-w-[180px]">
                                {screen.mediaUrl.split("/").pop()}
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="flex gap-1 ml-2">
                          <button
                            type="button"
                            onClick={() => startEditScreen(screen)}
                            className="p-1 text-slate-400 hover:text-blue-400 transition-colors"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          {editScreens.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleDeleteScreen(screen.id)}
                              className="p-1 text-slate-400 hover:text-red-400 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                      {/* Media upload per screen */}
                      <ScreenMediaUpload
                        screenId={screen.id}
                        currentMediaUrl={screen.mediaUrl}
                        onUpload={(url) =>
                          handleScreenMediaUpload(screen.id, url)
                        }
                        onRemove={() => handleScreenMediaRemove(screen.id)}
                      />
                      <div className="text-xs text-slate-400 mt-2">
                        Screen {index + 1} of {editScreens.length}
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Save error */}
          {saveError && (
            <div className="text-red-400 text-sm px-1">{saveError}</div>
          )}

          {/* Action buttons */}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleSaveAll}
              disabled={updateConfig.isPending}
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700 disabled:bg-slate-600 text-white px-4 py-2 rounded transition-colors"
            >
              <Save className="w-4 h-4" />
              {updateConfig.isPending ? "Saving..." : "Save Changes"}
            </button>
            <button
              type="button"
              onClick={cancelManaging}
              disabled={updateConfig.isPending}
              className="flex items-center gap-2 bg-slate-600 hover:bg-slate-500 disabled:opacity-50 text-white px-4 py-2 rounded transition-colors"
            >
              <X className="w-4 h-4" />
              Cancel
            </button>
          </div>
        </div>
      ) : isEditing && useLegacyMode ? (
        <form
          onSubmit={handleLegacySave}
          onClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => e.stopPropagation()}
        >
          <div className="mb-4">
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              placeholder="Enter information about Caffeine..."
              rows={8}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              required
            />
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={updateCaffeineInfo.isPending}
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700 disabled:bg-slate-600 text-white px-3 py-2 rounded transition-colors"
            >
              <Save className="w-4 h-4" />
              {updateCaffeineInfo.isPending ? "Saving..." : "Save"}
            </button>
            <button
              type="button"
              onClick={cancelLegacyEdit}
              className="flex items-center gap-2 bg-slate-600 hover:bg-slate-500 text-white px-3 py-2 rounded transition-colors"
            >
              <X className="w-4 h-4" />
              Cancel
            </button>
          </div>
        </form>
      ) : useLegacyMode ? (
        <div>
          <div
            className="text-slate-300 whitespace-pre-wrap mb-4 p-2 rounded transition-colors select-none"
            onClick={handleTextClick}
            onKeyDown={(e) => {
              if (e.key === "Enter")
                handleTextClick(e as unknown as React.MouseEvent);
            }}
          >
            {legacyCaffeineInfo.content}
          </div>
          <div className="text-sm text-slate-400">
            Last updated: {formatDate(legacyCaffeineInfo.lastUpdated)}
          </div>
        </div>
      ) : (
        <div className="transition-all duration-500 ease-in-out">
          <div className="mb-4">
            {currentScreen && (
              <>
                <h3 className="text-lg font-semibold text-blue-400 mb-2 flex items-center gap-2 select-none">
                  <Sparkles className="w-5 h-5" />
                  {currentScreen.title}
                </h3>
                {/* Image between heading and text */}
                {currentScreen.mediaUrl && (
                  <MediaDisplay url={currentScreen.mediaUrl} />
                )}
                <p
                  className={`text-slate-300 leading-relaxed select-none ${
                    isRotationPaused
                      ? "cursor-pointer hover:bg-slate-700 p-2 rounded transition-colors"
                      : ""
                  }`}
                  onClick={handleTextClick}
                  onKeyDown={(e) => {
                    if (e.key === "Enter")
                      handleTextClick(e as unknown as React.MouseEvent);
                  }}
                >
                  {currentScreen.content}
                </p>
              </>
            )}
          </div>

          {/* Progress indicator - clickable lines */}
          {displayScreens.length > 1 && (
            <div className="flex gap-2 mb-4">
              {displayScreens.map((screen: LocalScreen, index: number) => (
                <button
                  type="button"
                  key={screen.id}
                  className={`h-1 flex-1 rounded transition-colors duration-300 cursor-pointer hover:opacity-80 ${
                    index === currentInfoIndex
                      ? "bg-blue-500"
                      : "bg-slate-600 hover:bg-slate-500"
                  }`}
                  onClick={(e) => handleProgressClick(index, e)}
                  title={`Go to: ${displayScreens[index]?.title || `Screen ${index + 1}`}`}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
