import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, CheckCircle, XCircle } from "@phosphor-icons/react";

interface InviteCollaboratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInvite: (email: string, role: string) => Promise<void>;
  status: null | "success" | "error" | "sending";
}

const roles = [
  { value: "editor", label: "Editor" },
  { value: "viewer", label: "Viewer" },
  { value: "admin", label: "Admin" },
];

const InviteCollaboratorModal = ({
  isOpen,
  onClose,
  onInvite,
  status,
}: InviteCollaboratorModalProps) => {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("editor");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isOpen) {
      setEmail("");
      setRole("editor");
      setError("");
    }
  }, [isOpen]);

  const handleInvite = async () => {
    setError("");
    if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      setError("Please enter a valid email address");
      return;
    }
    await onInvite(email, role);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-[1000] font-sans"
        onClick={onClose}
        role="dialog"
        aria-modal="true"
        tabIndex={-1}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          transition={{ duration: 0.2 }}
          style={{ width: "95%", maxWidth: 400 }}
          className="bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden flex flex-col"
          onClick={e => e.stopPropagation()}
        >
          {/* 头部 */}
          <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-gray-50">
            <h2 className="text-lg font-bold text-gray-900">Invite Collaborator</h2>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-full text-gray-500 hover:bg-gray-200 hover:text-gray-900 focus:outline-none transition"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* 内容区域 */}
          <div className="flex-1 p-6 space-y-5 bg-white">
            <div>
              <label htmlFor="invite-email" className="block text-sm font-semibold text-gray-900 mb-1">Collaborator Email</label>
              <input
                id="invite-email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full p-3 border text-black border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition text-base font-normal"
                placeholder="Enter collaborator email"
                disabled={status === "sending" || status === "success"}
              />
            </div>
            <div>
              <label htmlFor="invite-role" className="block text-sm font-semibold text-gray-900 mb-1">Role</label>
              <select
                id="invite-role"
                value={role}
                onChange={e => setRole(e.target.value)}
                className="w-full p-3 border text-black border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition text-base font-normal"
                disabled={status === "sending" || status === "success"}
              >
                {roles.map(r => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </select>
            </div>
            {error && <div className="text-red-500 text-xs font-semibold animate-fade-in">{error}</div>}
            {status === "success" && (
              <div className="flex items-center bg-sky-50 border border-sky-200 rounded-md px-3 py-2 text-sky-700 text-xs font-semibold animate-fade-in">
                <CheckCircle className="w-5 h-5 mr-2" /> Invitation sent!
              </div>
            )}
            {status === "error" && (
              <div className="flex items-center bg-red-50 border border-red-200 rounded-md px-3 py-2 text-red-700 text-xs font-semibold animate-fade-in">
                <XCircle className="w-5 h-5 mr-2" /> Invitation failed, please try again.
              </div>
            )}
          </div>

          {/* 底部按钮 */}
          <div className="p-6 border-t border-gray-100 flex justify-end space-x-2 bg-gray-50">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 focus:outline-none border border-gray-200 transition text-base font-medium"
              disabled={status === "sending"}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleInvite}
              className={`px-4 py-2 rounded-md text-base font-bold text-white bg-sky-500 hover:bg-sky-600 shadow-md focus:outline-none focus:ring-2 focus:ring-sky-500 transition ${status === "sending" || status === "success" ? "opacity-60 cursor-not-allowed" : ""}`}
              disabled={status === "sending" || status === "success"}
            >
              {status === "sending" ? (
                <span className="flex items-center">
                  <svg className="animate-spin h-4 w-4 mr-2" viewBox="0 0 24 24" fill="none">
                    <title>Loading</title>
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                  </svg>
                  Sending...
                </span>
              ) : "Send Invitation"}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default InviteCollaboratorModal; 