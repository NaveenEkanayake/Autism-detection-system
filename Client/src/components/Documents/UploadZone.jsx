import { FilePlus, CheckCircle } from "lucide-react";

export default function UploadZone({ uploading, uploadProgress, dragOver, onDragOver, onDragLeave, onDrop, onClick }) {
  if (uploading) {
    return (
      <div className="border-2 border-dashed rounded-2xl p-10 text-center border-blue-500/60" style={{ background: "rgba(59,147,245,0.06)" }}>
        <div className="w-12 h-12 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto mb-4" />
        <p className="text-white font-medium mb-2">Uploading...</p>
        <div className="w-48 h-2 rounded-full bg-white/10 mx-auto overflow-hidden">
          <div
            className="h-full rounded-full bg-blue-500 transition-all duration-300"
            style={{ width: `${uploadProgress}%` }}
          />
        </div>
      </div>
    );
  }

  return (
    <div
      className={`border-2 border-dashed rounded-2xl p-10 text-center transition-all duration-300 cursor-pointer ${
        dragOver ? "border-blue-500/60" : "border-white/10 hover:border-blue-500/30"
      }`}
      style={{ background: dragOver ? "rgba(59,147,245,0.06)" : "rgba(255,255,255,0.02)" }}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      onClick={onClick}
    >
      <div className="flex justify-center gap-3 mb-4">
        <FilePlus className="w-8 h-8 text-slate-600" />
      </div>
      <p className="text-slate-300 font-medium mb-1">Drop files here or click to browse</p>
      <p className="text-slate-600 text-sm">PDF, images, videos, and clinical documents</p>
    </div>
  );
}
