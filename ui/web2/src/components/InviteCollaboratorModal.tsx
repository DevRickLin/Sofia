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
  { value: "editor", label: "可编辑" },
  { value: "viewer", label: "只读" },
  { value: "admin", label: "管理员" },
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
      setError("请输入有效的邮箱地址");
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
        className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[1000]"
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
          className="bg-white rounded-lg shadow-xl overflow-hidden flex flex-col"
          onClick={e => e.stopPropagation()}
        >
          {/* 头部 */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <h2 className="text-lg font-bold text-black">邀请协作者</h2>
            <button
              type="button"
              onClick={onClose}
              className="text-gray-600 hover:text-gray-900 focus:outline-none"
              aria-label="关闭"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* 内容区域 */}
          <div className="flex-1 p-4 space-y-4">
            <div>
              <label htmlFor="invite-email" className="block text-sm font-medium text-gray-900 mb-1">协作者邮箱</label>
              <input
                id="invite-email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full p-2 border text-black border-gray-300 rounded-md shadow-sm focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                placeholder="请输入协作者邮箱"
                disabled={status === "sending" || status === "success"}
              />
            </div>
            <div>
              <label htmlFor="invite-role" className="block text-sm font-medium text-gray-900 mb-1">权限</label>
              <select
                id="invite-role"
                value={role}
                onChange={e => setRole(e.target.value)}
                className="w-full p-2 border text-black border-gray-300 rounded-md shadow-sm focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                disabled={status === "sending" || status === "success"}
              >
                {roles.map(r => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </select>
            </div>
            {error && <div className="text-red-500 text-sm">{error}</div>}
            {status === "success" && (
              <div className="flex items-center text-emerald-600 text-sm">
                <CheckCircle className="w-5 h-5 mr-1" />邀请已发送！
              </div>
            )}
            {status === "error" && (
              <div className="flex items-center text-red-500 text-sm">
                <XCircle className="w-5 h-5 mr-1" />邀请失败，请重试。
              </div>
            )}
          </div>

          {/* 底部按钮 */}
          <div className="p-4 border-t border-gray-200 flex justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 focus:outline-none"
              disabled={status === "sending"}
            >
              取消
            </button>
            <button
              type="button"
              onClick={handleInvite}
              className={`px-4 py-2 rounded-md font-semibold text-white bg-emerald-500 hover:bg-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-colors ${status === "sending" || status === "success" ? "opacity-60 cursor-not-allowed" : ""}`}
              disabled={status === "sending" || status === "success"}
            >
              {status === "sending" ? "发送中..." : "发送邀请"}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default InviteCollaboratorModal; 