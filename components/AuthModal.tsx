"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { motion } from "framer-motion";
import { useAuthStore } from "@/lib/store/useAuthStore";
import Modal from "./Modal";

const loginSchema = z.object({
    email: z.string().email("Invalid email address"),
    password: z.string().min(6, "Password must be at least 6 characters"),
});

const signupSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Invalid email address"),
    password: z.string().min(6, "Password must be at least 6 characters"),
});

const AuthModal = () => {
    const { isOpen, onClose, view, setView, setUser } = useAuthStore();
    const [isLoading, setIsLoading] = useState(false);

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm<z.infer<typeof loginSchema | typeof signupSchema>>({
        resolver: zodResolver(view === "login" ? loginSchema : signupSchema),
    });

    const onSubmit = async (data: any) => {
        setIsLoading(true);
        // Simulate API call
        await new Promise((resolve) => setTimeout(resolve, 1500));

        setUser({
            id: "1",
            email: data.email,
            name: data.name || data.email.split("@")[0],
        });

        setIsLoading(false);
        onClose();
        reset();
    };

    const toggleView = () => {
        setView(view === "login" ? "signup" : "login");
        reset();
    };

    return (
        <Modal
            title={view === "login" ? "Welcome Back" : "Create Account"}
            description={
                view === "login"
                    ? "Login to your account to continue"
                    : "Sign up to start your musical journey"
            }
            isOpen={isOpen}
            onClose={onClose}
        >
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                {view === "signup" && (
                    <div>
                        <input
                            {...register("name")}
                            type="text"
                            placeholder="Full Name"
                            className="w-full rounded-xl bg-white/5 border border-white/10 p-4 text-white outline-none transition focus:border-emerald-500/50 focus:bg-white/10"
                            disabled={isLoading}
                        />
                        {/* @ts-ignore */}
                        {(errors as any).name && (
                            <p className="mt-1 text-xs text-red-500">{(errors as any).name.message}</p>
                        )}
                    </div>
                )}
                <div>
                    <input
                        {...register("email")}
                        type="email"
                        placeholder="Email Address"
                        className="w-full rounded-xl bg-white/5 border border-white/10 p-4 text-white outline-none transition focus:border-emerald-500/50 focus:bg-white/10"
                        disabled={isLoading}
                    />
                    {errors.email && (
                        <p className="mt-1 text-xs text-red-500">{errors.email.message as string}</p>
                    )}
                </div>
                <div>
                    <input
                        {...register("password")}
                        type="password"
                        placeholder="Password"
                        className="w-full rounded-xl bg-white/5 border border-white/10 p-4 text-white outline-none transition focus:border-emerald-500/50 focus:bg-white/10"
                        disabled={isLoading}
                    />
                    {errors.password && (
                        <p className="mt-1 text-xs text-red-500">{errors.password.message as string}</p>
                    )}
                </div>

                <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    className="w-full rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 py-4 font-bold text-white shadow-lg shadow-emerald-500/20 transition hover:shadow-emerald-500/40 disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={isLoading}
                >
                    {isLoading ? "Processing..." : view === "login" ? "Login" : "Sign Up"}
                </motion.button>

                <div className="text-center">
                    <button
                        type="button"
                        onClick={toggleView}
                        className="text-sm text-neutral-400 transition hover:text-white"
                        disabled={isLoading}
                    >
                        {view === "login"
                            ? "Don't have an account? Sign up"
                            : "Already have an account? Login"}
                    </button>
                </div>
            </form>
        </Modal>
    );
};

export default AuthModal;
