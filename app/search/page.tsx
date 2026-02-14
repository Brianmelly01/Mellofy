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
    let errorMessage = "";

    try {
        if (title) {
            results = await searchYouTube(title);
        }
    } catch (error: any) {
        console.error("Search page error:", error);
        errorMessage = error.message || "Failed to fetch search results.";
    }

    return (
        <div className="bg-neutral-900 rounded-lg h-full w-full overflow-hidden overflow-y-auto">
            <Header className="from-neutral-900">
                <div className="mb-2 flex flex-col gap-y-6">
                    <h1 className="text-white text-3xl font-semibold">Search</h1>
                    <SearchInput />
                </div>
            </Header>
            <SearchContent results={results} term={title} error={errorMessage} />
        </div>
    );
};

export default Search;
