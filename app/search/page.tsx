import Header from "@/components/Header";
import SearchInput from "@/components/SearchInput";
import SearchContent from "@/app/search/components/SearchContent";

interface SearchProps {
    searchParams: Promise<{
        title: string;
    }>;
}

const Search = async ({ searchParams }: SearchProps) => {
    const { title } = await searchParams;

    // In a real app, we would fetch from YouTube API here based on title
    // For now, we'll pass the title to a client component that will handle the search

    return (
        <div className="bg-neutral-900 rounded-lg h-full w-full overflow-hidden overflow-y-auto">
            <Header className="from-neutral-900">
                <div className="mb-2 flex flex-col gap-y-6">
                    <h1 className="text-white text-3xl font-semibold">Search</h1>
                    <SearchInput />
                </div>
            </Header>
            <SearchContent term={title} />
        </div>
    );
};

export default Search;
