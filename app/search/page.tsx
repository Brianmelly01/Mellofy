import SearchInput from "@/components/SearchInput";
import SearchContent from "@/app/search/components/SearchContent";

interface SearchProps {
    searchParams: Promise<{
        title: string;
    }>;
}

const Search = async ({ searchParams }: SearchProps) => {
    const { title } = await searchParams;

    return (
        <div className="min-h-screen pt-20 pb-24 px-4 md:px-6">
            <div className="mb-6">
                <h1 className="text-white text-3xl font-bold mb-2">Search</h1>
                <p className="text-neutral-400">Explore everything on Mellofy</p>
            </div>

            <div className="mb-8">
                <SearchInput />
            </div>

            <SearchContent term={title} />
        </div>
    );
};

export default Search;
