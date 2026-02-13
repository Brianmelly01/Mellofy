"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    description?: string;
    children: React.ReactNode;
}

const Modal: React.FC<ModalProps> = ({
    isOpen,
    onClose,
    title,
    description,
    children,
}) => {
    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                {/* Overlay */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                />

                {/* Modal Content */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className={cn(
                        "relative w-full max-w-md overflow-hidden rounded-2xl border border-white/10",
                        "bg-neutral-900/40 backdrop-blur-xl p-8 shadow-2xl"
                    )}
                >
                    <div className="mb-6 flex items-center justify-between">
                        {title && (
                            <h2 className="text-2xl font-bold text-white tracking-tight">
                                {title}
                            </h2>
                        )}
                        <button
                            onClick={onClose}
                            className="rounded-full p-1 text-neutral-400 transition hover:bg-white/10 hover:text-white"
                        >
                            <X size={24} />
                        </button>
                    </div>
                    {description && (
                        <p className="mb-6 text-neutral-400">
                            {description}
                        </p>
                    )}
                    <div>{children}</div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default Modal;
