import { useFormik } from "formik";
import { useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { Link, useNavigate, useParams } from "react-router-dom";
import * as Yup from "yup";
import LoadingSpinner from "../../components/LoadingSpinner";
import { useCreateShowtime } from "../../hooks/useBooking";
import {
  useCumRapTheoHeThong,
  useHeThongRap,
  useLichChieuPhim,
} from "../../hooks/useCinema";
import { useDebouncedValue } from "../../hooks/useDebouncedValue";
import { useAdminFeedback } from "../../hooks/useAdminFeedback";
import { useMovieDetail, useMovieList } from "../../hooks/useMovies";
import { selectorUser } from "../../store/authSlice";

const showtimeSchema = Yup.object().shape({
  maPhim: Yup.string().required("Phim không được để trống"),
  maHeThongRap: Yup.string().required("Hệ thống rạp không được để trống"),
  maCumRap: Yup.string().required("Cụm rạp không được để trống"),
  maRap: Yup.string().required("Rạp không được để trống"),
  ngayChieu: Yup.string().required("Ngày chiếu không được để trống"),
  gioChieu: Yup.string().required("Giờ chiếu không được để trống"),
  giaVe: Yup.number()
    .min(75000, "Giá vé tối thiểu 75.000")
    .max(200000, "Giá vé tối đa 200.000")
    .required("Giá vé không được để trống"),
});

const initialShowtimeValues = {
  maPhim: "",
  maHeThongRap: "",
  maCumRap: "",
  maRap: "",
  ngayChieu: "",
  gioChieu: "",
  giaVe: 75000,
};

const MOVIE_PAGE_SIZE = 9;

const getTodayInputValue = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const formatDateTime = (dateValue) => {
  if (!dateValue) {
    return "Chưa có thời gian";
  }

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return dateValue;
  }

  return date.toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatApiDateTime = (dateValue, timeValue) => {
  if (!dateValue || !timeValue) {
    return "";
  }

  const [year, month, day] = dateValue.split("-");
  return `${day}/${month}/${year} ${timeValue}:00`;
};

const formatInputDateTime = (dateValue) => {
  const date = new Date(dateValue);

  if (!dateValue || Number.isNaN(date.getTime())) {
    return {
      ngayChieu: "",
      gioChieu: "",
    };
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hour = String(date.getHours()).padStart(2, "0");
  const minute = String(date.getMinutes()).padStart(2, "0");

  return {
    ngayChieu: `${year}-${month}-${day}`,
    gioChieu: `${hour}:${minute}`,
  };
};

const scrollPageTop = () => {
  document.querySelector("main")?.scrollTo({ top: 0, behavior: "smooth" });
  window.scrollTo({ top: 0, behavior: "smooth" });
};

const ShowtimePage = () => {
  const { maPhim } = useParams();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [currentMoviePage, setCurrentMoviePage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingShowtime, setEditingShowtime] = useState(null);
  const [selectedCluster, setSelectedCluster] = useState(null);
  const { notify } = useAdminFeedback();
  const currentUser = useSelector(selectorUser);
  const adminMovieGroup = currentUser?.maNhom || "GP01";

  const {
    data: movies,
    isLoading: isMovieLoading,
    isError: isMovieError,
    error: movieError,
  } = useMovieList(adminMovieGroup);
  const { data: heThongRap, isLoading: isCinemaSystemLoading } =
    useHeThongRap();
  const createShowtime = useCreateShowtime();

  const {
    data: showtimeDetail,
    isLoading: isShowtimeLoading,
    isError: isShowtimeError,
    error: showtimeError,
  } = useLichChieuPhim(maPhim);
  const {
    data: movieDetail,
    isLoading: isMovieDetailLoading,
  } = useMovieDetail(maPhim);

  const formik = useFormik({
    initialValues: initialShowtimeValues,
    validationSchema: showtimeSchema,
    onSubmit: async (values, { resetForm }) => {
      try {
        if (!currentUser?.accessToken) {
          notify({
            type: "warning",
            title: "Cần đăng nhập lại",
            message:
              "Phiên admin hiện tại không có token hợp lệ. Bạn đăng xuất rồi đăng nhập lại bằng tài khoản quản trị.",
          });
          return;
        }

        const selectedCinemaCluster = cumRap?.find(
          (item) => item.maCumRap === values.maCumRap,
        );
        const selectedCinema = selectedCinemaCluster?.danhSachRap?.find(
          (rap) => rap.maRap?.toString() === values.maRap?.toString(),
        );

        if (!selectedCinemaCluster) {
          notify({
            type: "warning",
            title: "Chưa chọn được cụm rạp",
            message:
              "Bạn chọn lại hệ thống rạp và cụm rạp rồi thử thêm lịch chiếu.",
          });
          return;
        }

        if (!selectedCinema) {
          notify({
            type: "warning",
            title: "Chưa chọn được rạp",
            message:
              "Danh sách rạp chưa khớp với cụm rạp hiện tại. Bạn chọn lại rạp rồi thử tiếp.",
          });
          return;
        }

        if (!Number.isInteger(activeMovieId) || activeMovieId <= 0) {
          notify({
            type: "warning",
            title: "Mã phim không hợp lệ",
            message:
              "Bạn quay lại danh sách lịch chiếu rồi chọn lại phim trước khi thêm lịch chiếu.",
          });
          return;
        }

        const showtimeData = {
          maPhim: activeMovieId,
          ngayChieuGioChieu: formatApiDateTime(
            values.ngayChieu,
            values.gioChieu,
          ),
          maRap: selectedCinema.maRap.toString(),
          giaVe: Number(values.giaVe),
        };

        await createShowtime.mutateAsync(showtimeData);
        notify({
          type: "success",
          title: editingShowtime
            ? "Tạo lịch chiếu thành công"
            : "Thêm lịch chiếu thành công",
          message: "Lịch chiếu đã được cập nhật trong hệ thống",
        });
        resetForm();
        setEditingShowtime(null);
        setIsModalOpen(false);
      } catch (error) {
        console.log(error);
        if (error.response?.status === 401) {
          notify({
            type: "error",
            title: "Phiên đăng nhập không hợp lệ",
            message:
              "Backend từ chối quyền tạo lịch chiếu. Bạn đăng xuất rồi đăng nhập lại bằng tài khoản quản trị.",
          });
          return;
        }

        const apiMessage =
          error.response?.data?.content ||
          error.response?.data?.message ||
          error.message ||
          "Không thể tạo lịch chiếu. Bạn kiểm tra lại thông tin vừa nhập.";

        if (
          error.response?.status === 404 &&
          apiMessage.toLowerCase().includes("mã phim")
        ) {
          notify({
            type: "error",
            title: "Mã phim không hợp lệ",
            message:
              "Backend không nhận mã phim hiện tại. Bạn quay lại danh sách lịch chiếu, chọn lại phim rồi thêm lịch chiếu.",
          });
          return;
        }

        notify({
          type: "error",
          title: "Tạo lịch chiếu thất bại",
          message: apiMessage,
        });
      }
    },
  });

  const { data: cumRap, isLoading: isCinemaClusterLoading } =
    useCumRapTheoHeThong(formik.values.maHeThongRap);
  const debouncedSearchTerm = useDebouncedValue(searchTerm, 2000);
  const isSearching = searchTerm !== debouncedSearchTerm;

  const filteredMovies = useMemo(() => {
    const keyword = debouncedSearchTerm.trim().toLowerCase();

    if (!keyword) {
      return movies || [];
    }

    return (
      movies?.filter((movie) => {
        return (
          movie.tenPhim?.toLowerCase().includes(keyword) ||
          movie.biDanh?.toLowerCase().includes(keyword) ||
          movie.maPhim?.toString().includes(keyword)
        );
      }) || []
    );
  }, [movies, debouncedSearchTerm]);

  const selectedMovie = useMemo(() => {
    return movies?.find((movie) => movie.maPhim?.toString() === maPhim);
  }, [movies, maPhim]);

  const totalMoviePages = Math.max(
    1,
    Math.ceil(filteredMovies.length / MOVIE_PAGE_SIZE),
  );
  const safeMoviePage = Math.min(currentMoviePage, totalMoviePages);
  const paginatedMovies = useMemo(() => {
    const startIndex = (safeMoviePage - 1) * MOVIE_PAGE_SIZE;
    return filteredMovies.slice(startIndex, startIndex + MOVIE_PAGE_SIZE);
  }, [filteredMovies, safeMoviePage]);

  const selectedCumRap = useMemo(() => {
    return cumRap?.find((item) => item.maCumRap === formik.values.maCumRap);
  }, [cumRap, formik.values.maCumRap]);

  const danhSachRap = selectedCumRap?.danhSachRap || [];

  useEffect(() => {
    if (!selectedCumRap || !formik.values.maRap) {
      return;
    }

    const currentRap = selectedCumRap.danhSachRap?.find(
      (rap) => rap.maRap?.toString() === formik.values.maRap?.toString(),
    );

    if (currentRap) {
      return;
    }

    const matchedRap = selectedCumRap.danhSachRap?.find(
      (rap) => rap.tenRap === editingShowtime?.tenRap,
    );

    formik.setFieldValue("maRap", matchedRap?.maRap?.toString() || "");
  }, [selectedCumRap, editingShowtime, formik.values.maRap]);

  const cinemaClusters = useMemo(() => {
    const cinemaSystems = showtimeDetail?.heThongRapChieu || [];

    return cinemaSystems.flatMap((system) => {
      return (
        system.cumRapChieu?.map((cluster) => ({
          system,
          cluster,
          totalShowtimes: cluster.lichChieuPhim?.length || 0,
        })) || []
      );
    });
  }, [showtimeDetail?.heThongRapChieu]);

  const totalShowtimes = cinemaClusters.reduce(
    (total, item) => total + item.totalShowtimes,
    0,
  );
  const movieInfo = showtimeDetail || movieDetail || selectedMovie;
  const activeMovieId = Number(movieInfo?.maPhim || maPhim);

  const openAddModal = () => {
    if (!Number.isInteger(activeMovieId) || activeMovieId <= 0 || !movieInfo) {
      notify({
        type: "warning",
        title: "Chưa lấy được phim",
        message:
          "Bạn quay lại danh sách lịch chiếu rồi chọn lại phim trước khi thêm lịch chiếu.",
      });
      return;
    }

    setEditingShowtime(null);
    formik.setValues({
      ...initialShowtimeValues,
      maPhim: activeMovieId.toString(),
    });
    setIsModalOpen(true);
  };

  const openEditModal = (system, cluster, showtime) => {
    const inputDateTime = formatInputDateTime(showtime.ngayChieuGioChieu);

    setEditingShowtime(showtime);
    formik.setValues({
      maPhim: maPhim || "",
      maHeThongRap: system.maHeThongRap || "",
      maCumRap: cluster.maCumRap || "",
      maRap: showtime.maRap?.toString() || "",
      ngayChieu: inputDateTime.ngayChieu,
      gioChieu: inputDateTime.gioChieu,
      giaVe: showtime.giaVe || 75000,
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    formik.resetForm();
    setEditingShowtime(null);
    setIsModalOpen(false);
  };

  const closeSchedulePopup = () => {
    setSelectedCluster(null);
  };

  const changeMoviePage = (page) => {
    setCurrentMoviePage(page);
    scrollPageTop();
  };

  const isDetailPage = Boolean(maPhim);
  const isLoading =
    isMovieLoading ||
    (isDetailPage && isShowtimeLoading) ||
    (isDetailPage && isMovieDetailLoading) ||
    (isModalOpen && isCinemaSystemLoading) ||
    createShowtime.isPending;

  return (
    <div>
      {isLoading && (
        <div className="fixed inset-0 flex items-center justify-center bg-gray-950/70 z-50">
          <LoadingSpinner />
        </div>
      )}

      {!isDetailPage && (
        <div>
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
            <div>
              <h2 className="text-white text-2xl font-bold">
                Quản lý lịch chiếu
              </h2>
              <p className="text-gray-400 text-sm mt-1">
                Chọn phim để xem chi tiết lịch chiếu và các cụm rạp hiện có.
              </p>
            </div>

            <div className="relative w-full lg:w-96">
              <input
                type="text"
                value={searchTerm}
                onChange={(event) => {
                  setSearchTerm(event.target.value);
                  setCurrentMoviePage(1);
                }}
                placeholder="Tìm theo tên phim, bí danh, mã phim..."
                className="w-full bg-gray-800 text-white placeholder-gray-500 border border-gray-700 rounded-xl px-4 py-2.5 pr-10 outline-none focus:ring-2 focus:ring-yellow-400 text-sm transition-all"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-xs flex items-center gap-2">
                {isSearching ? (
                  <span className="w-3 h-3 border-2 border-yellow-400/40 border-t-yellow-400 rounded-full animate-spin" />
                ) : (
                  "Search"
                )}
              </span>
            </div>
          </div>

          {isMovieError && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl px-5 py-4 mb-6">
              <p className="font-medium">Không thể tải danh sách phim</p>
              <p className="text-sm text-red-300 mt-1">{movieError?.message}</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {paginatedMovies.map((movie) => {
              const hasMovieBadges =
                movie.hot || movie.dangChieu || movie.sapChieu;

              return (
                <div
                  key={movie.maPhim}
                  className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden hover:border-yellow-400/40 transition-colors flex flex-col min-h-[212px]"
                >
                  <button
                    type="button"
                    onClick={() => navigate(`/admin/showtimes/${movie.maPhim}`)}
                    className="w-full cursor-pointer text-left flex-1"
                  >
                    <div className="flex gap-4 p-4 h-full">
                      <img
                        src={movie.hinhAnh}
                        alt={movie.tenPhim}
                        className="w-24 h-32 object-cover rounded-lg bg-gray-800 flex-shrink-0"
                      />
                      <div className="min-w-0 flex-1 flex flex-col">
                        <p className="text-white font-bold line-clamp-2 min-h-[40px]">
                          {movie.tenPhim}
                        </p>
                        <p className="text-gray-500 text-xs mt-1">
                          Mã phim #{movie.maPhim}
                        </p>
                        <p className="text-gray-400 text-sm mt-3 line-clamp-3 min-h-[60px]">
                          {movie.moTa || "Chưa có mô tả phim"}
                        </p>
                      </div>
                    </div>

                  </button>
                    <div
                      className={`flex flex-wrap gap-2 mb-3 justify-center min-h-[28px] ${hasMovieBadges ? "" : "invisible"}`}
                    >
                      {movie.hot && (
                        <span className="bg-red-500/15 text-red-400 border border-red-500/30 text-xs font-medium px-2.5 py-1 rounded-full">
                          Hot
                        </span>
                      )}
                      {movie.dangChieu && (
                        <span className="bg-green-500/15 text-green-400 border border-green-500/30 text-xs font-medium px-2.5 py-1 rounded-full">
                          Đang chiếu
                        </span>
                      )}
                      {movie.sapChieu && (
                        <span className="bg-blue-500/15 text-blue-400 border border-blue-500/30 text-xs font-medium px-2.5 py-1 rounded-full">
                          Sắp chiếu
                        </span>
                      )}
                    </div>

                  <div className="px-4 pb-4 mt-auto">
                    <Link
                      to={`/admin/showtimes/${movie.maPhim}`}
                      className="inline-flex w-full items-center justify-center bg-yellow-400 hover:bg-yellow-500 text-gray-900 text-sm font-bold px-4 py-2.5 rounded-lg transition-colors"
                    >
                      Xem chi tiết
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>

          {filteredMovies.length > MOVIE_PAGE_SIZE && (
            <div className="flex flex-wrap items-center justify-center gap-2 mt-6">
              <button
                type="button"
                onClick={() => changeMoviePage(Math.max(1, safeMoviePage - 1))}
                disabled={safeMoviePage === 1}
                className="px-4 py-2 rounded-lg bg-gray-800 text-gray-300 hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-sm"
              >
                Trước
              </button>

              {Array.from(
                { length: totalMoviePages },
                (_, index) => index + 1,
              ).map((page) => (
                <button
                  key={page}
                  type="button"
                  onClick={() => changeMoviePage(page)}
                  className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors ${
                    page === safeMoviePage
                      ? "bg-yellow-400 text-gray-900"
                      : "bg-gray-800 text-gray-300 hover:bg-gray-700"
                  }`}
                >
                  {page}
                </button>
              ))}

              <button
                type="button"
                onClick={() =>
                  changeMoviePage(Math.min(totalMoviePages, safeMoviePage + 1))
                }
                disabled={safeMoviePage === totalMoviePages}
                className="px-4 py-2 rounded-lg bg-gray-800 text-gray-300 hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-sm"
              >
                Sau
              </button>
            </div>
          )}

          {!isMovieLoading && filteredMovies.length === 0 && (
            <div className="bg-gray-900 border border-gray-800 rounded-xl px-6 py-12 text-center">
              <p className="text-gray-400">Không tìm thấy phim phù hợp</p>
            </div>
          )}
        </div>
      )}

      {isDetailPage && (
        <div className="space-y-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <button
              type="button"
              onClick={() => navigate("/admin/showtimes")}
              className="cursor-pointer text-gray-400 hover:text-white text-sm transition-colors"
            >
              &lt; Quay lại danh sách phim
            </button>
            <button
              type="button"
              onClick={openAddModal}
              className="cursor-pointer bg-yellow-400 hover:bg-yellow-500 text-gray-900 text-sm font-bold px-4 py-2.5 rounded-lg transition-colors"
            >
              Thêm lịch chiếu
            </button>
          </div>

          <section className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
            <div className="flex flex-col lg:flex-row gap-6 p-6">
              <img
                src={movieInfo?.hinhAnh}
                alt={movieInfo?.tenPhim}
                className="w-full lg:w-52 h-72 object-cover rounded-xl bg-gray-800 flex-shrink-0"
              />
              <div className="min-w-0 flex-1">
                <p className="text-yellow-400 text-sm font-medium mb-2">
                  Mã phim #{movieInfo?.maPhim || maPhim}
                </p>
                <h2 className="text-white text-3xl font-bold">
                  {movieInfo?.tenPhim || "Thông tin phim"}
                </h2>
                <p className="text-gray-400 text-sm mt-4 leading-6">
                  {movieInfo?.moTa || "Chưa có mô tả phim"}
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-6">
                  <div className="bg-gray-800/70 rounded-lg px-4 py-3">
                    <p className="text-gray-500 text-xs mb-1">
                      Ngày khởi chiếu
                    </p>
                    <p className="text-white text-sm">
                      {formatDateTime(movieInfo?.ngayKhoiChieu)}
                    </p>
                  </div>
                  <div className="bg-gray-800/70 rounded-lg px-4 py-3">
                    <p className="text-gray-500 text-xs mb-1">Cụm rạp</p>
                    <p className="text-yellow-400 text-sm font-bold">
                      {cinemaClusters.length}
                    </p>
                  </div>
                  <div className="bg-gray-800/70 rounded-lg px-4 py-3">
                    <p className="text-gray-500 text-xs mb-1">
                      Tổng suất chiếu
                    </p>
                    <p className="text-yellow-400 text-sm font-bold">
                      {totalShowtimes}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {isShowtimeError && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl px-5 py-4">
              <p className="font-medium">Không thể tải lịch chiếu của phim</p>
              <p className="text-sm text-red-300 mt-1">
                {showtimeError?.response?.data?.content ||
                  showtimeError?.message}
              </p>
            </div>
          )}

          {!isShowtimeLoading &&
            !isShowtimeError &&
            cinemaClusters.length === 0 && (
              <div className="bg-gray-900 border border-gray-800 rounded-xl px-6 py-12 text-center">
                <p className="text-white font-bold">
                  Phim này chưa có lịch chiếu
                </p>
                <p className="text-gray-400 text-sm mt-2">
                  Bạn có thể bấm Thêm lịch chiếu để tạo suất chiếu đầu tiên.
                </p>
              </div>
            )}

          {cinemaClusters.length > 0 && (
            <section className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-800">
                <h3 className="text-white font-bold text-lg">
                  Cụm rạp đang có lịch chiếu
                </h3>
                <p className="text-gray-500 text-sm mt-1">
                  Bấm vào một cụm rạp để xem toàn bộ suất chiếu.
                </p>
              </div>

              <div
                className={`divide-y divide-gray-800 ${cinemaClusters.length > 3 ? "max-h-[390px] overflow-y-auto" : ""}`}
              >
                {cinemaClusters.map(
                  ({ system, cluster, totalShowtimes: clusterShowtimes }) => (
                    <button
                      key={`${system.maHeThongRap}-${cluster.maCumRap}`}
                      type="button"
                      onClick={() => setSelectedCluster({ system, cluster })}
                      className="w-full cursor-pointer text-left px-4 py-5 hover:bg-gray-800/60 transition-colors sm:px-6"
                    >
                      <div className="flex items-start gap-4">
                        <img
                          src={system.logo}
                          alt={system.tenHeThongRap}
                          className="w-12 h-12 object-contain rounded-lg bg-white p-1 flex-shrink-0"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                            <div>
                              <p className="text-white font-semibold">
                                {cluster.tenCumRap}
                              </p>
                              <p className="text-yellow-400 text-xs mt-1">
                                {system.tenHeThongRap}
                              </p>
                            </div>
                            <span className="bg-yellow-400/15 text-yellow-400 border border-yellow-400/30 text-xs font-bold px-3 py-1 rounded-full w-fit">
                              {clusterShowtimes} suất chiếu
                            </span>
                          </div>
                          <p className="text-gray-500 text-sm mt-2 line-clamp-2">
                            {cluster.diaChi}
                          </p>
                        </div>
                      </div>
                    </button>
                  ),
                )}
              </div>
            </section>
          )}
        </div>
      )}

      {selectedCluster && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 py-6"
          onClick={closeSchedulePopup}
        >
          <div
            className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-3xl shadow-2xl max-h-[88vh] flex flex-col overflow-hidden"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4 px-6 py-5 border-b border-gray-800">
              <div>
                <p className="text-yellow-400 text-xs font-medium mb-1">
                  {selectedCluster.system.tenHeThongRap}
                </p>
                <h3 className="text-white text-lg font-bold">
                  {selectedCluster.cluster.tenCumRap}
                </h3>
                <p className="text-gray-500 text-sm mt-1">
                  {selectedCluster.cluster.diaChi}
                </p>
              </div>
              <button
                type="button"
                onClick={closeSchedulePopup}
                className="cursor-pointer text-gray-500 hover:text-white transition-colors text-xl leading-none"
              >
                x
              </button>
            </div>

            <div className="overflow-y-auto px-6 py-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {selectedCluster.cluster.lichChieuPhim?.map((showtime) => (
                  <div
                    key={showtime.maLichChieu}
                    className="bg-gray-800/70 border border-gray-700 rounded-lg px-4 py-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-yellow-400 font-bold text-sm">
                          {formatDateTime(showtime.ngayChieuGioChieu)}
                        </p>
                        <p className="text-gray-500 text-xs mt-1">
                          Mã lịch chiếu #{showtime.maLichChieu}
                        </p>
                      </div>
                      <span className="text-white text-sm font-medium whitespace-nowrap">
                        {Number(showtime.giaVe || 0).toLocaleString("vi-VN")}{" "}
                        VND
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-3 mt-4">
                      <div>
                        <p className="text-gray-300 text-sm">
                          {showtime.tenRap}
                        </p>
                        {showtime.thoiLuong && (
                          <p className="text-gray-500 text-xs mt-1">
                            Thời lượng: {showtime.thoiLuong} phút
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            openEditModal(
                              selectedCluster.system,
                              selectedCluster.cluster,
                              showtime,
                            )
                          }
                          className="cursor-pointer bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium px-3 py-1.5 rounded-lg transition-colors"
                        >
                          Sửa
                        </button>
                        <button
                          type="button"
                          disabled
                          title="API hiện tại chưa hỗ trợ xóa lịch chiếu"
                          className="cursor-not-allowed bg-gray-700 text-gray-400 text-xs font-medium px-3 py-1.5 rounded-lg"
                        >
                          Xóa
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {isModalOpen && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 px-4 py-6"
          onClick={closeModal}
        >
          <div
            className="bg-gray-900 rounded-2xl border border-gray-800 w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-800">
              <h3 className="text-white text-lg font-bold">
                {editingShowtime ? "Sửa lịch chiếu" : "Thêm lịch chiếu mới"}
              </h3>
              <button
                type="button"
                onClick={closeModal}
                className="cursor-pointer text-gray-500 hover:text-white transition-colors text-xl leading-none"
              >
                x
              </button>
            </div>

            <form
              onSubmit={formik.handleSubmit}
              className="px-6 py-5 space-y-4"
            >
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-400 text-xs font-medium mb-1.5">
                    Phim
                  </label>
                  <select
                    {...formik.getFieldProps("maPhim")}
                    disabled
                    className="w-full bg-gray-800 text-white border border-gray-700 rounded-lg px-3 py-2.5 outline-none focus:ring-2 focus:ring-yellow-400 text-sm disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    <option value="">Chọn phim</option>
                    {movies?.map((movie) => (
                      <option key={movie.maPhim} value={movie.maPhim}>
                        {movie.tenPhim}
                      </option>
                    ))}
                  </select>
                  {formik.touched.maPhim && formik.errors.maPhim && (
                    <p className="text-red-500 text-xs mt-1">
                      {formik.errors.maPhim}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-gray-400 text-xs font-medium mb-1.5">
                    Hệ thống rạp
                  </label>
                  <select
                    name="maHeThongRap"
                    value={formik.values.maHeThongRap}
                    onBlur={formik.handleBlur}
                    onChange={(event) => {
                      formik.setFieldValue("maHeThongRap", event.target.value);
                      formik.setFieldValue("maCumRap", "");
                      formik.setFieldValue("maRap", "");
                    }}
                    className="w-full bg-gray-800 text-white border border-gray-700 rounded-lg px-3 py-2.5 outline-none focus:ring-2 focus:ring-yellow-400 text-sm"
                  >
                    <option value="">Chọn hệ thống rạp</option>
                    {heThongRap?.map((item) => (
                      <option key={item.maHeThongRap} value={item.maHeThongRap}>
                        {item.tenHeThongRap}
                      </option>
                    ))}
                  </select>
                  {formik.touched.maHeThongRap &&
                    formik.errors.maHeThongRap && (
                      <p className="text-red-500 text-xs mt-1">
                        {formik.errors.maHeThongRap}
                      </p>
                    )}
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-400 text-xs font-medium mb-1.5">
                    Cụm rạp
                  </label>
                  <select
                    name="maCumRap"
                    value={formik.values.maCumRap}
                    onBlur={formik.handleBlur}
                    onChange={(event) => {
                      formik.setFieldValue("maCumRap", event.target.value);
                      formik.setFieldValue("maRap", "");
                    }}
                    disabled={
                      !formik.values.maHeThongRap || isCinemaClusterLoading
                    }
                    className="w-full bg-gray-800 text-white border border-gray-700 rounded-lg px-3 py-2.5 outline-none focus:ring-2 focus:ring-yellow-400 text-sm disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    <option value="">
                      {isCinemaClusterLoading
                        ? "Đang tải cụm rạp..."
                        : "Chọn cụm rạp"}
                    </option>
                    {cumRap?.map((item) => (
                      <option key={item.maCumRap} value={item.maCumRap}>
                        {item.tenCumRap}
                      </option>
                    ))}
                  </select>
                  {formik.touched.maCumRap && formik.errors.maCumRap && (
                    <p className="text-red-500 text-xs mt-1">
                      {formik.errors.maCumRap}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-gray-400 text-xs font-medium mb-1.5">
                    Rạp
                  </label>
                  <select
                    {...formik.getFieldProps("maRap")}
                    disabled={
                      !formik.values.maCumRap || isCinemaClusterLoading
                    }
                    className="w-full bg-gray-800 text-white border border-gray-700 rounded-lg px-3 py-2.5 outline-none focus:ring-2 focus:ring-yellow-400 text-sm disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    <option value="">Chọn rạp</option>
                    {danhSachRap.map((rap) => (
                      <option key={rap.maRap} value={rap.maRap}>
                        {rap.tenRap}
                      </option>
                    ))}
                  </select>
                  {formik.touched.maRap && formik.errors.maRap && (
                    <p className="text-red-500 text-xs mt-1">
                      {formik.errors.maRap}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-gray-400 text-xs font-medium mb-1.5">
                    Ngày chiếu
                  </label>
                  <input
                    type="date"
                    min={getTodayInputValue()}
                    {...formik.getFieldProps("ngayChieu")}
                    className="w-full bg-gray-800 text-white border border-gray-700 rounded-lg px-3 py-2.5 outline-none focus:ring-2 focus:ring-yellow-400 text-sm"
                  />
                  {formik.touched.ngayChieu && formik.errors.ngayChieu && (
                    <p className="text-red-500 text-xs mt-1">
                      {formik.errors.ngayChieu}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-gray-400 text-xs font-medium mb-1.5">
                    Giờ chiếu
                  </label>
                  <input
                    type="time"
                    {...formik.getFieldProps("gioChieu")}
                    className="w-full bg-gray-800 text-white border border-gray-700 rounded-lg px-3 py-2.5 outline-none focus:ring-2 focus:ring-yellow-400 text-sm"
                  />
                  {formik.touched.gioChieu && formik.errors.gioChieu && (
                    <p className="text-red-500 text-xs mt-1">
                      {formik.errors.gioChieu}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-gray-400 text-xs font-medium mb-1.5">
                    Giá vé
                  </label>
                  <input
                    type="number"
                    min="75000"
                    max="200000"
                    step="5000"
                    {...formik.getFieldProps("giaVe")}
                    className="w-full bg-gray-800 text-white border border-gray-700 rounded-lg px-3 py-2.5 outline-none focus:ring-2 focus:ring-yellow-400 text-sm"
                  />
                  {formik.touched.giaVe && formik.errors.giaVe && (
                    <p className="text-red-500 text-xs mt-1">
                      {formik.errors.giaVe}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-5 py-2.5 rounded-xl text-sm font-medium text-gray-400 hover:text-white border border-gray-700 hover:border-gray-600 transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={
                    !formik.isValid ||
                    createShowtime.isPending ||
                    isCinemaClusterLoading
                  }
                  className="bg-yellow-400 hover:bg-yellow-500 disabled:bg-yellow-700 text-gray-900 font-bold px-5 py-2.5 rounded-xl text-sm transition-colors"
                >
                  {editingShowtime
                    ? "Lưu thành lịch chiếu mới"
                    : "Thêm lịch chiếu"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ShowtimePage;
