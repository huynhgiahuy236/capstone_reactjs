import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useSearchParams } from 'react-router-dom'
import { useMovieList } from '../hooks/useMovies'
import LoadingSpinner from '../components/LoadingSpinner'
import MovieCard from '../components/MovieCard'
import Banner from '../components/Banner'
import { useDebouncedValue } from '../hooks/useDebouncedValue'

const normalizeText = (text = '') => {
    return text
        .toString()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
}

const movieSections = [
    {
        key: 'hot',
        title: 'Phim hot',
        eyebrow: 'Top nổi bật',
        description: 'Những bộ phim đang được quan tâm nhiều nhất',
        getMovies: (movies) => movies.filter((movie) => movie.hot)
    },
    {
        key: 'dang-chieu',
        title: 'Đang chiếu',
        eyebrow: 'Now showing',
        description: 'Các phim đang có lịch chiếu tại rạp',
        getMovies: (movies) => movies.filter((movie) => movie.dangChieu)
    },
    {
        key: 'sap-chieu',
        title: 'Sắp chiếu',
        eyebrow: 'Coming soon',
        description: 'Các phim sắp ra mắt trong thời gian tới',
        getMovies: (movies) => movies.filter((movie) => movie.sapChieu && !movie.dangChieu && !movie.hot)
    }
]

const getSectionByKey = (key) => {
    return movieSections.find((section) => section.key === key)
}

const MovieSection = ({ section, movies, preview = false }) => {
    const visibleMovies = preview ? movies.slice(0, 4) : movies

    if (movies.length === 0) {
        return null
    }

    return (
        <section id={section.key === 'hot' ? 'phim-hot' : section.key} className="scroll-mt-32 py-12 border-b border-gray-800/80 last:border-b-0">
            <div className="text-center max-w-3xl mx-auto mb-8">
                <div className="inline-flex items-center gap-3 mb-3">
                    <span className="h-px w-12 bg-yellow-400/70" />
                    <span className="text-yellow-400 text-xs font-bold uppercase tracking-[0.35em]">
                        {section.eyebrow}
                    </span>
                    <span className="h-px w-12 bg-yellow-400/70" />
                </div>
                <h2 className="text-3xl md:text-4xl font-black text-white tracking-wide">
                    {section.title}
                </h2>
                <p className="text-gray-400 text-sm md:text-base mt-3">{section.description}</p>
                <p className="text-gray-500 text-xs mt-2">{movies.length} phim</p>

                {preview && movies.length > 4 && (
                    <Link
                        to={`/movie?type=${section.key}`}
                        className="inline-flex items-center justify-center mt-5 border border-yellow-400/50 hover:bg-yellow-400 hover:text-gray-900 text-yellow-400 text-sm font-bold px-5 py-2 rounded-full transition-colors"
                    >
                        Xem thêm
                    </Link>
                )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {visibleMovies.map((movie) => (
                    <MovieCard key={movie.maPhim} movie={movie} />
                ))}
            </div>
        </section>
    )
}

const MovieListPage = () => {
    const [searchParams] = useSearchParams()
    const location = useLocation()
    const [searchTerm, setSearchTerm] = useState('')
    const debouncedSearchTerm = useDebouncedValue(searchTerm, 400)
    const selectedType = searchParams.get('type')
    const { data: movies, isLoading, isError, error } = useMovieList("GP01")

    const filteredMovies = useMemo(() => {
        const keyword = normalizeText(debouncedSearchTerm.trim())
        const movieList = movies || []

        if (!keyword) {
            return movieList
        }

        return movieList.filter((movie) => {
            return (
                normalizeText(movie.tenPhim).includes(keyword) ||
                normalizeText(movie.biDanh).includes(keyword) ||
                movie.maPhim?.toString().includes(keyword)
            )
        })
    }, [movies, debouncedSearchTerm])

    const sectionGroups = useMemo(() => {
        return movieSections.map((section) => ({
            ...section,
            movies: section.getMovies(filteredMovies)
        }))
    }, [filteredMovies])

    const selectedSection = getSectionByKey(selectedType)
    const selectedSectionMovies = selectedSection?.getMovies(filteredMovies) || []
    const isAllView = selectedType === 'all'
    const isCategoryView = selectedSection !== undefined
    const isOverview = !isAllView && !isCategoryView
    const isWaitingForDebounce = searchTerm !== debouncedSearchTerm

    useEffect(() => {
        if (!location.hash || isLoading || isError || !isOverview) return

        const scrollTimer = setTimeout(() => {
            const target = document.querySelector(location.hash)

            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                })
            }
        }, 100)

        return () => clearTimeout(scrollTimer)
    }, [location.hash, isLoading, isError, isOverview, filteredMovies.length])

    return (
        <div className="min-h-screen bg-gray-950 text-white">
            <Banner />

            <div className="bg-gray-950 py-14 px-4 text-center border-b border-gray-800">
                <p className="text-yellow-400 text-xs font-bold uppercase tracking-[0.35em] mb-3">
                    Movie collection
                </p>
                <h1 className="text-4xl md:text-5xl font-black mb-4">
                    Danh sách <span className="text-yellow-400">Phim</span>
                </h1>
                <p className="text-gray-400 text-lg mb-8">Khám phá các bộ phim theo từng nhóm trạng thái</p>

                <div className="max-w-lg mx-auto relative">
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(event) => setSearchTerm(event.target.value)}
                        placeholder="Tìm kiếm tên phim..."
                        className="w-full bg-gray-900 text-white placeholder-gray-500 border border-gray-700 rounded-full px-6 py-3 pr-20 outline-none focus:ring-2 focus:ring-yellow-400 transition-all"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm flex items-center gap-2">
                        {isWaitingForDebounce ? (
                            <span className="w-3 h-3 border-2 border-yellow-400/40 border-t-yellow-400 rounded-full animate-spin" />
                        ) : (
                            'Tìm'
                        )}
                    </span>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 py-8">
                {isLoading && <LoadingSpinner />}

                {isError && (
                    <div className="text-center py-20">
                        <p className="text-red-400 text-xl mb-2">Đã xảy ra lỗi!</p>
                        <p className="text-gray-500">{error?.message}</p>
                    </div>
                )}

                {!isLoading && !isError && (
                    <>
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                            <p className="text-gray-400">
                                Hiển thị <span className="text-yellow-400 font-medium">{filteredMovies.length}</span> phim
                            </p>

                            {!isOverview && (
                                <Link to="/movie" className="text-yellow-400 hover:text-yellow-300 text-sm font-medium">
                                    Quay lại danh mục
                                </Link>
                            )}
                        </div>

                        {filteredMovies.length === 0 && (
                            <div className="text-center py-16">
                                <p className="text-gray-400">Không tìm thấy phim phù hợp.</p>
                            </div>
                        )}

                        {isOverview && (
                            <>
                                {sectionGroups.map((section) => (
                                    <MovieSection
                                        key={section.key}
                                        section={section}
                                        movies={section.movies}
                                        preview
                                    />
                                ))}

                                <div className="text-center py-12">
                                    <Link
                                        to="/movie?type=all"
                                        className="inline-flex items-center justify-center bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-black px-10 py-3 rounded-full transition-colors"
                                    >
                                        Xem tất cả
                                    </Link>
                                </div>
                            </>
                        )}

                        {isCategoryView && (
                            <MovieSection
                                section={selectedSection}
                                movies={selectedSectionMovies}
                            />
                        )}

                        {isAllView && (
                            <section className="py-8">
                                <div className="text-center max-w-3xl mx-auto mb-8">
                                    <div className="inline-flex items-center gap-3 mb-3">
                                        <span className="h-px w-12 bg-yellow-400/70" />
                                        <span className="text-yellow-400 text-xs font-bold uppercase tracking-[0.35em]">
                                            Full catalog
                                        </span>
                                        <span className="h-px w-12 bg-yellow-400/70" />
                                    </div>
                                    <h2 className="text-3xl md:text-4xl font-black text-white">Tất cả phim</h2>
                                    <p className="text-gray-400 text-sm md:text-base mt-3">Toàn bộ phim hiện có trong hệ thống</p>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                                    {filteredMovies.map((movie) => (
                                        <MovieCard key={movie.maPhim} movie={movie} />
                                    ))}
                                </div>
                            </section>
                        )}
                    </>
                )}
            </div>
        </div>
    )
}

export default MovieListPage
