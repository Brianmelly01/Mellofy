import Header from "@/components/Header";
import SearchInput from "@/components/SearchInput";
import SearchContent from "@/app/search/components/SearchContent";
import { searchYouTube } from "@/lib/actions";
import { Track } from "@/lib/store/usePlayerStore";

interface SearchProps {
    searchParams: Promise<{
        title: string;
    }>;
}

const Search = async ({ searchParams }: SearchProps) => {
    const { title } = await searchParams;

    let results: Track[] = [];
    let errorMsg = "";
    try {
        if (title) {
            results = await searchYouTube(title);
            if (results.length === 0) {
                console.log("No results returned for:", title);
            }
        }
    } catch (error: any) {
        console.error("Search page error:", error);
        errorMsg = error.message || "An unexpected error occurred.";
    }

    return (
        <div className="bg-neutral-900 rounded-lg h-full w-full overflow-hidden overflow-y-auto">
            <Header className="from-neutral-900">
                <div className="mb-2 flex flex-col gap-y-6">
                    <h1 className="text-white text-3xl font-semibold">Search</h1>
                    <SearchInput />
                </div>
            </Header>
            <SearchContent results={results} term={title} error={errorMsg} />
        </div>
    );
};

export default Search;
