import { useState } from 'react'
import { useCumRapTheoHeThong, useHeThongRap } from '../hooks/useCinema'
import LoadingSpinner from '../components/LoadingSpinner'

const ErrorState = ({ message }) => (
  <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-5 py-4 text-red-300" role="alert">
    {message}
  </div>
)

const CinemaPage = () => {
  const [selectedCinema, setSelectedCinema] = useState('BHDStar')
  const {
    data: cinemaSystems,
    isLoading: isSystemsLoading,
    isError: isSystemsError,
  } = useHeThongRap()
  const {
    data: cinemaClusters,
    isLoading: isClustersLoading,
    isError: isClustersError,
  } = useCumRapTheoHeThong(selectedCinema)

  const selectedSystem = cinemaSystems?.find((item) => item.maHeThongRap === selectedCinema)

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="bg-gradient-to-b from-gray-900 to-gray-950 px-4 py-12 text-center">
        <h1 className="mb-3 text-4xl font-bold md:text-5xl">
          Hệ thống <span className="text-yellow-400">Rạp chiếu</span>
        </h1>
        <p className="text-lg text-gray-400">Chọn chuỗi rạp để xem danh sách địa điểm</p>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8">
        {isSystemsLoading && <LoadingSpinner />}
        {isSystemsError && <ErrorState message="Không thể tải danh sách hệ thống rạp. Vui lòng thử lại sau." />}

        {!isSystemsLoading && !isSystemsError && (
          <div className="flex flex-col gap-6 md:flex-row">
            <aside className="flex-shrink-0 md:w-72">
              <h2 className="mb-4 text-xs font-medium uppercase tracking-widest text-gray-400">Chuỗi rạp</h2>
              <div className="space-y-2">
                {cinemaSystems?.map((system) => (
                  <button
                    key={system.maHeThongRap}
                    type="button"
                    aria-pressed={selectedCinema === system.maHeThongRap}
                    onClick={() => setSelectedCinema(system.maHeThongRap)}
                    className={`flex w-full items-center gap-4 rounded-xl border px-4 py-3 transition-all duration-200 ${selectedCinema === system.maHeThongRap ? 'border-yellow-400 bg-yellow-400/10 text-yellow-400' : 'border-gray-700 bg-gray-800 text-gray-300 hover:bg-gray-700'}`}
                  >
                    <img src={system.logo} alt="" className="h-10 w-10 rounded-lg bg-white object-contain p-1" />
                    <span className="text-left text-sm font-medium">{system.tenHeThongRap}</span>
                  </button>
                ))}
              </div>
            </aside>

            <section className="min-w-0 flex-1" aria-live="polite">
              {selectedSystem && (
                <div className="mb-6 flex items-center gap-3">
                  <img src={selectedSystem.logo} alt="" className="h-12 w-12 rounded-xl bg-white object-contain p-1" />
                  <h2 className="text-2xl font-bold text-yellow-400">{selectedSystem.tenHeThongRap}</h2>
                </div>
              )}

              {isClustersLoading && <LoadingSpinner />}
              {isClustersError && <ErrorState message="Không thể tải các cụm rạp của hệ thống này." />}
              {!isClustersLoading && !isClustersError && cinemaClusters?.length === 0 && (
                <div className="rounded-xl border border-gray-800 bg-gray-900 px-5 py-10 text-center text-gray-400">
                  Hệ thống này chưa có cụm rạp.
                </div>
              )}

              <div className="space-y-4">
                {cinemaClusters?.map((cluster) => (
                  <article key={cluster.maCumRap} className="rounded-xl border border-gray-700 bg-gray-800 p-5 transition-colors hover:border-yellow-400/40">
                    <div className="mb-4 flex items-start justify-between gap-4">
                      <div>
                        <h3 className="text-lg font-semibold text-white">{cluster.tenCumRap}</h3>
                        <p className="mt-1 text-sm text-gray-400">📍 {cluster.diaChi}</p>
                      </div>
                      <span className="whitespace-nowrap rounded-full bg-yellow-400/10 px-3 py-1 text-xs font-medium text-yellow-400">
                        {cluster.danhSachRap?.length || 0} phòng
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {cluster.danhSachRap?.map((cinema) => (
                        <span key={cinema.maRap} className="rounded-lg bg-gray-700 px-3 py-1.5 text-xs text-gray-300">
                          {cinema.tenRap}
                        </span>
                      ))}
                    </div>
                  </article>
                ))}
              </div>
            </section>
          </div>
        )}
      </div>
    </div>
  )
}

export default CinemaPage
