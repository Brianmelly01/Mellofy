"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import useDebounce from "@/hooks/useDebounce";
import qs from "query-string";

const SearchInput = () => {
    const router = useRouter();
    const [value, setValue] = useState<string>("");
    const debouncedValue = useDebounce<string>(value, 500);

    useEffect(() => {
        const query = {
            title: debouncedValue,
        };

        const url = qs.stringifyUrl({
            url: "/search",
            query: query,
        });

        router.push(url);
    }, [debouncedValue, router]);

    return (
        <div className="relative group">
            <Search
                className="absolute top-1/2 -translate-y-1/2 left-4 text-neutral-500 group-focus-within:text-white transition-colors"
                size={22}
                strokeWidth={2.5}
            />
            <input
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder="Artists, songs, or podcasts"
                className="w-full h-14 rounded-2xl bg-white/5 border border-white/10 outline-none text-white px-12 text-base font-medium placeholder:text-neutral-500 transition-all focus:bg-white/10 focus:ring-2 focus:ring-white/5 focus:border-white/20 shadow-xl"
            />
        </div>
    );
};

export default SearchInput;
