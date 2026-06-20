"use client";

import { Toast, Toaster, createToaster } from "@ark-ui/react/toast";
import { Portal } from "@ark-ui/react/portal";
import { X, CheckCircle, AlertCircle, Info } from "lucide-react";

const toaster = createToaster({
  placement: "top-end",
  gap: 16,
  overlap: true,
});

const iconMap = {
  success: <CheckCircle className="w-5 h-5 text-green-500" />,
  error: <AlertCircle className="w-5 h-5 text-red-500" />,
  info: <Info className="w-5 h-5 text-blue-500" />,
  warning: <AlertCircle className="w-5 h-5 text-yellow-500" />,
};

const borderMap = {
  success: "border-l-4 border-l-green-500",
  error: "border-l-4 border-l-red-500",
  info: "border-l-4 border-l-blue-500",
  warning: "border-l-4 border-l-yellow-500",
};

export function showToast({ title, description, type = "success" }) {
  toaster.create({ title, description, type });
}

export default function ToastProvider() {
  return (
    <Portal>
      <Toaster toaster={toaster}>
        {(toast) => (
          <Toast.Root className={`bg-white rounded-lg shadow-lg min-w-80 p-4 relative overflow-anywhere transition-all duration-300 ease-default will-change-transform h-(--height) opacity-(--opacity) translate-x-(--x) translate-y-(--y) scale-(--scale) z-(--z-index) ${borderMap[toast.type] || borderMap.info}`}>
            <div className="flex items-start gap-3">
              <div className="shrink-0 mt-0.5">
                {iconMap[toast.type] || iconMap.info}
              </div>
              <div className="flex-1">
                <Toast.Title className="text-gray-900 font-semibold text-sm">
                  {toast.title}
                </Toast.Title>
                <Toast.Description className="text-gray-600 text-sm mt-1">
                  {toast.description}
                </Toast.Description>
              </div>
            </div>
            <Toast.CloseTrigger className="absolute top-3 right-3 p-1 hover:bg-gray-100 rounded transition-colors text-gray-400 hover:text-gray-600">
              <X className="w-3 h-3" />
            </Toast.CloseTrigger>
          </Toast.Root>
        )}
      </Toaster>
    </Portal>
  );
}
