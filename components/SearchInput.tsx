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
        <div className="relative">
            <Search className="absolute top-3 left-3 text-neutral-400" size={20} />
            <input
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder="What do you want to listen to?"
                className="w-full h-10 rounded-full bg-neutral-800 border-none outline-none text-white px-10 focus:ring-2 focus:ring-white/10"
            />
        </div>
    );
};

export default SearchInput;
