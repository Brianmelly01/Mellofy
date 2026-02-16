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

    return (
        <div className="bg-[#080808] h-full w-full overflow-hidden overflow-y-auto no-scrollbar">
            <Header className="bg-transparent border-none">
                <div className="mb-4 flex flex-col gap-y-2">
                    <h1 className="text-white text-3xl font-black tracking-tighter">Browse</h1>
                    <p className="text-neutral-400 text-sm font-medium">Explore everything on Mellofy</p>
                </div>
            </Header>
            <div className="px-5 md:px-8 pb-32">
                <div className="mb-8">
                    <SearchInput />
                </div>
                <SearchContent term={title} />
            </div>
        </div>
    );
};

export default Search;
