import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

let modalCount = 0;

function useBodyLock(open) {
  useEffect(() => {
    if (open) {
      modalCount++;
      if (modalCount === 1) {
        document.body.style.overflow = "hidden";
      }
    }
    return () => {
      if (open) {
        modalCount--;
        if (modalCount <= 0) {
          modalCount = 0;
          document.body.style.overflow = "";
        }
      }
    };
  }, [open]);
}

function CloseIcon() {
  return (
    <div className="relative w-5 h-5 flex items-center justify-center">
      <motion.span
        className="absolute h-[2px] w-5 bg-neutral-400 rounded-full"
        animate={{ rotate: 45, y: 0 }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
      />
      <motion.span
        className="absolute h-[2px] w-5 bg-neutral-400 rounded-full"
        animate={{ opacity: 0, x: 10 }}
        transition={{ duration: 0.2 }}
      />
      <motion.span
        className="absolute h-[2px] w-5 bg-neutral-400 rounded-full"
        animate={{ rotate: -45, y: 0 }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
      />
    </div>
  );
}

function AuthModal({ open, onClose, title, description, children }) {
  useBodyLock(open);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={onClose}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="relative z-10 w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto rounded-2xl border border-white/10 bg-neutral-900/95 backdrop-blur-xl shadow-2xl"
          >
            <div className="sticky top-0 flex items-center justify-between p-6 pb-4 border-b border-white/5 bg-neutral-900/95 backdrop-blur-xl z-20">
              <div>
                <h2 className="text-xl font-bold text-white">{title}</h2>
                {description && <p className="text-sm text-neutral-400 mt-1">{description}</p>}
              </div>
              <button
                onClick={onClose}
                className="relative w-9 h-9 rounded-xl bg-white/[0.03] border border-white/[0.08] flex items-center justify-center hover:bg-white/10 transition-colors"
                aria-label="Close"
              >
                <CloseIcon />
              </button>
            </div>

            <div className="p-6 pt-4">{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

export default AuthModal;
