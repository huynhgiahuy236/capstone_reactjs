import { useEffect, useMemo, useRef, useState } from 'react'
import { useBanners } from '../hooks/useMovies'

const fallbackBanners = [
    {
        maBanner: 'fallback-1',
        hinhAnh: 'https://movienew.cybersoft.edu.vn/hinhanh/ban-tay-diet-quy.png',
        maPhim: 1282
    },
    {
        maBanner: 'fallback-2',
        hinhAnh: 'https://movienew.cybersoft.edu.vn/hinhanh/lat-mat-48h.png',
        maPhim: 1283
    },
    {
        maBanner: 'fallback-3',
        hinhAnh: 'https://movienew.cybersoft.edu.vn/hinhanh/cuoc-chien-sinh-tu.png',
        maPhim: 1284
    }
]

const Banner = () => {
    const { data: apiBanners } = useBanners()
    const banners = useMemo(() => {
        return apiBanners?.length ? apiBanners : fallbackBanners
    }, [apiBanners])

    const [activeIndex, setActiveIndex] = useState(0)
    const [dragStartX, setDragStartX] = useState(null)
    const [dragOffset, setDragOffset] = useState(0)
    const [interactionVersion, setInteractionVersion] = useState(0)
    const sliderRef = useRef(null)

    const goToSlide = (index) => {
        const lastIndex = banners.length - 1

        if (index < 0) {
            setActiveIndex(lastIndex)
            return
        }

        if (index > lastIndex) {
            setActiveIndex(0)
            return
        }

        setActiveIndex(index)
    }

    const goToSlideByUser = (index) => {
        setInteractionVersion((version) => version + 1)
        goToSlide(index)
    }

    useEffect(() => {
        if (banners.length <= 1 || dragStartX !== null) {
            return undefined
        }

        const timeoutId = setTimeout(() => {
            setActiveIndex((currentIndex) => (currentIndex + 1) % banners.length)
        }, 4000)

        return () => clearTimeout(timeoutId)
    }, [activeIndex, banners.length, dragStartX, interactionVersion])

    const handlePointerDown = (event) => {
        setInteractionVersion((version) => version + 1)
        setDragStartX(event.clientX)
        setDragOffset(0)
        sliderRef.current?.setPointerCapture?.(event.pointerId)
    }

    const handlePointerMove = (event) => {
        if (dragStartX === null) {
            return
        }

        setDragOffset(event.clientX - dragStartX)
    }

    const finishDrag = () => {
        if (dragStartX === null) {
            return
        }

        const threshold = 70
        const safeActiveIndex = banners.length > 0 ? activeIndex % banners.length : 0

        if (dragOffset > threshold) {
            goToSlide(safeActiveIndex - 1)
        }

        if (dragOffset < -threshold) {
            goToSlide(safeActiveIndex + 1)
        }

        setDragStartX(null)
        setDragOffset(0)
        setInteractionVersion((version) => version + 1)
    }

    const safeActiveIndex = banners.length > 0 ? activeIndex % banners.length : 0
    const translatePercent = safeActiveIndex * -100
    const dragTranslate = dragStartX === null ? '' : ` translateX(${dragOffset}px)`

    return (
        <section className="relative w-full h-[76vh] min-h-[520px] overflow-hidden bg-gray-950 select-none">
            <div
                ref={sliderRef}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={finishDrag}
                onPointerCancel={finishDrag}
                className={`h-full flex ${dragStartX === null ? 'transition-transform duration-700 ease-out' : ''}`}
                style={{
                    width: `${banners.length * 100}%`,
                    transform: `translateX(${translatePercent / banners.length}%)${dragTranslate}`,
                    touchAction: 'pan-y'
                }}
            >
                {banners.map((banner, index) => (
                    <div key={banner.maBanner || banner.maPhim || index} className="relative h-full flex-shrink-0" style={{ width: `${100 / banners.length}%` }}>
                        <img
                            src={banner.hinhAnh}
                            alt={`Banner ${index + 1}`}
                            draggable={false}
                            className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-r from-gray-950/90 via-gray-950/35 to-gray-950/20" />
                        <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-transparent to-transparent" />

                        <div className="absolute left-4 right-4 bottom-24 md:left-16 md:right-auto md:max-w-2xl">
                            <p className="text-yellow-400 text-sm font-bold uppercase tracking-[0.35em] mb-3">MovieApp</p>
                            <h1 className="text-4xl md:text-6xl font-black text-white leading-tight drop-shadow-2xl">
                                Trải nghiệm điện ảnh mỗi ngày
                            </h1>
                            <p className="text-gray-200 text-base md:text-lg mt-4 max-w-xl">
                                Khám phá phim hot, lịch chiếu mới và đặt vé nhanh trên cùng một giao diện.
                            </p>
                        </div>
                    </div>
                ))}
            </div>

            <button
                type="button"
                onClick={() => goToSlideByUser(safeActiveIndex - 1)}
                className="absolute left-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-black/50 hover:bg-yellow-400 hover:text-gray-900 text-white border border-white/20 transition-colors"
                aria-label="Slide trước"
            >
                ‹
            </button>
            <button
                type="button"
                onClick={() => goToSlideByUser(safeActiveIndex + 1)}
                className="absolute right-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-black/50 hover:bg-yellow-400 hover:text-gray-900 text-white border border-white/20 transition-colors"
                aria-label="Slide sau"
            >
                ›
            </button>

            <div className="absolute left-0 right-0 bottom-10 flex items-center justify-center gap-2">
                {banners.map((banner, index) => (
                    <button
                        key={banner.maBanner || banner.maPhim || index}
                        type="button"
                        onClick={() => goToSlideByUser(index)}
                        aria-label={`Chuyển đến slide ${index + 1}`}
                        className={`h-2.5 rounded-full transition-all ${index === safeActiveIndex ? 'w-10 bg-yellow-400' : 'w-2.5 bg-white/50 hover:bg-white'}`}
                    />
                ))}
            </div>
        </section>
    )
}

export default Banner
