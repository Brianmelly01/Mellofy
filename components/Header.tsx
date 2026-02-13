"use client";

import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import { cn } from "@/lib/utils";

interface HeaderProps {
    children?: React.ReactNode;
    className?: string;
}

const Header: React.FC<HeaderProps> = ({ children, className }) => {
    const router = useRouter();

    return (
        <div className={cn("h-fit bg-gradient-to-b from-emerald-800 p-6", className)}>
            <div className="w-full mb-4 flex items-center justify-between">
                <div className="hidden md:flex gap-x-2 items-center">
                    <button
                        onClick={() => router.back()}
                        className="rounded-full bg-black flex items-center justify-center hover:opacity-75 transition"
                    >
                        <ChevronLeft size={35} className="text-white" />
                    </button>
                    <button
                        onClick={() => router.forward()}
                        className="rounded-full bg-black flex items-center justify-center hover:opacity-75 transition"
                    >
                        <ChevronRight size={35} className="text-white" />
                    </button>
                </div>
                <div className="flex md:hidden gap-x-2 items-center">
                    {/* Mobile header icons could go here */}
                </div>
                <div className="flex justify-between items-center gap-x-4">
                    <>
                        <div>
                            <button className="bg-transparent text-neutral-300 font-medium hover:opacity-75 transition">
                                Sign up
                            </button>
                        </div>
                        <div>
                            <button className="bg-white px-6 py-2 rounded-full font-bold hover:opacity-75 transition text-black">
                                Log in
                            </button>
                        </div>
                    </>
                </div>
            </div>
            {children}
        </div>
    );
};

export default Header;
