import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import LoadingSpinner from "../components/LoadingSpinner";
import { useAdminFeedback } from "../hooks/useAdminFeedback";
import { useBookTickets, useTicketRoom } from "../hooks/useBooking";
import { useLichChieuPhim } from "../hooks/useCinema";
import { useMovieDetail } from "../hooks/useMovies";

const getDateValue = (dateValue) => {
  const date = new Date(dateValue);
  return Number.isNaN(date.getTime()) ? null : date;
};

const getDateKey = (dateValue) => {
  const date = getDateValue(dateValue);

  if (!date) return "";

  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");

  return `${date.getFullYear()}-${month}-${day}`;
};

const formatScheduleDate = (dateValue) => {
  const date = getDateValue(dateValue);

  if (!date) {
    return {
      dayMonth: "--/--",
      weekday: "Chưa rõ",
    };
  }

  return {
    dayMonth: date.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
    }),
    weekday: date.toLocaleDateString("vi-VN", { weekday: "long" }),
  };
};

const formatScheduleTime = (dateValue) => {
  const date = getDateValue(dateValue);

  if (!date) return "---";

  return date.toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatMoney = (money) => Number(money || 0).toLocaleString("vi-VN");

const SCHEDULE_DAY_COUNT = 9;
const SEAT_COLUMN_COUNT = 16;

const getSeatRowLabel = (rowIndex) => {
  let label = "";
  let index = rowIndex;

  do {
    label = String.fromCharCode(65 + (index % 26)) + label;
    index = Math.floor(index / 26) - 1;
  } while (index >= 0);

  return label;
};

const getSeatPosition = (seatIndex) => {
  const rowIndex = Math.floor(seatIndex / SEAT_COLUMN_COUNT);
  const columnNumber = (seatIndex % SEAT_COLUMN_COUNT) + 1;
  const rowLabel = getSeatRowLabel(rowIndex);

  return {
    rowLabel,
    columnNumber,
    label: `${rowLabel}${columnNumber}`,
  };
};

const BookingPage = () => {
  const { maPhim } = useParams();
  const [manualSelectedShowtimeId, setManualSelectedShowtimeId] = useState("");
  const [selectedScheduleDate, setSelectedScheduleDate] = useState("");
  const [scheduleStartOffset, setScheduleStartOffset] = useState(0);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const { notify, confirm } = useAdminFeedback();

  const { data: movie, isLoading: isMovieLoading } = useMovieDetail(maPhim);
  const {
    data: showtimeDetail,
    isLoading: isShowtimeLoading,
    isError: isShowtimeError,
    error: showtimeError,
  } = useLichChieuPhim(maPhim);
  const bookTickets = useBookTickets();

  const showtimes = useMemo(() => {
    const systems = showtimeDetail?.heThongRapChieu || [];

    return systems.flatMap(
      (system) =>
        system.cumRapChieu?.flatMap(
          (cluster) =>
            cluster.lichChieuPhim?.map((showtime) => ({
              ...showtime,
              dateKey: getDateKey(showtime.ngayChieuGioChieu),
              tenHeThongRap: system.tenHeThongRap,
              logo: system.logo,
              tenCumRap: cluster.tenCumRap,
              diaChi: cluster.diaChi,
            })) || [],
        ) || [],
    );
  }, [showtimeDetail]);

  const allScheduleDates = useMemo(() => {
    const dateMap = new Map();

    showtimes.forEach((showtime) => {
      const dateValue = getDateValue(showtime.ngayChieuGioChieu);
      const dateKey = showtime.dateKey;

      if (!dateValue || !dateKey || dateMap.has(dateKey)) return;

      const dateOnly = new Date(dateValue);
      dateOnly.setHours(0, 0, 0, 0);

      dateMap.set(dateKey, {
        key: dateKey,
        timestamp: dateOnly.getTime(),
        ...formatScheduleDate(dateValue),
      });
    });

    return Array.from(dateMap.values()).sort(
      (current, next) => current.timestamp - next.timestamp,
    );
  }, [showtimes]);

  const maxScheduleStartOffset = Math.max(
    0,
    allScheduleDates.length - SCHEDULE_DAY_COUNT,
  );
  const visibleScheduleStartOffset = Math.min(
    scheduleStartOffset,
    maxScheduleStartOffset,
  );
  const scheduleDates = allScheduleDates.slice(
    visibleScheduleStartOffset,
    visibleScheduleStartOffset + SCHEDULE_DAY_COUNT,
  );
  const selectedDateExists = allScheduleDates.some(
    (dateItem) => dateItem.key === selectedScheduleDate,
  );
  const activeScheduleDate = selectedDateExists
    ? selectedScheduleDate
    : allScheduleDates[0]?.key || "";
  const activeScheduleIndex = allScheduleDates.findIndex(
    (dateItem) => dateItem.key === activeScheduleDate,
  );
  const canMoveScheduleBack = activeScheduleIndex > 0;
  const canMoveScheduleNext =
    activeScheduleIndex >= 0 &&
    activeScheduleIndex < allScheduleDates.length - 1;

  const showtimesByCinema = useMemo(() => {
    const groupMap = new Map();

    showtimes
      .filter((showtime) => showtime.dateKey === activeScheduleDate)
      .sort(
        (current, next) =>
          new Date(current.ngayChieuGioChieu) -
          new Date(next.ngayChieuGioChieu),
      )
      .forEach((showtime) => {
        const groupKey = `${showtime.tenHeThongRap}-${showtime.tenCumRap}-${showtime.diaChi}`;

        if (!groupMap.has(groupKey)) {
          groupMap.set(groupKey, {
            key: groupKey,
            tenHeThongRap: showtime.tenHeThongRap,
            logo: showtime.logo,
            tenCumRap: showtime.tenCumRap,
            diaChi: showtime.diaChi,
            showtimes: [],
          });
        }

        groupMap.get(groupKey).showtimes.push(showtime);
      });

    return Array.from(groupMap.values());
  }, [activeScheduleDate, showtimes]);

  const visibleShowtimes = useMemo(() => {
    return showtimesByCinema.flatMap((cinema) => cinema.showtimes);
  }, [showtimesByCinema]);

  const hasManualSelectedShowtime = visibleShowtimes.some(
    (showtime) => showtime.maLichChieu?.toString() === manualSelectedShowtimeId,
  );
  const selectedShowtimeId = hasManualSelectedShowtime
    ? manualSelectedShowtimeId
    : visibleShowtimes[0]?.maLichChieu?.toString() || "";

  const {
    data: ticketRoom,
    isFetching: isTicketRoomFetching,
    isError: isTicketRoomError,
    error: ticketRoomError,
  } = useTicketRoom(selectedShowtimeId);
  const selectedShowtime = showtimes.find(
    (showtime) => showtime.maLichChieu?.toString() === selectedShowtimeId,
  );
  const selectedCinemaKey = showtimesByCinema.find((cinema) =>
    cinema.showtimes.some(
      (showtime) => showtime.maLichChieu?.toString() === selectedShowtimeId,
    ),
  )?.key;
  const seats = useMemo(() => ticketRoom?.danhSachGhe || [], [ticketRoom]);
  const seatRows = useMemo(() => {
    return Array.from(
      { length: Math.ceil(seats.length / SEAT_COLUMN_COUNT) },
      (_, rowIndex) => {
        const startIndex = rowIndex * SEAT_COLUMN_COUNT;

        return {
          rowLabel: getSeatRowLabel(rowIndex),
          seats: seats.slice(startIndex, startIndex + SEAT_COLUMN_COUNT),
          startIndex,
        };
      },
    );
  }, [seats]);
  const movieInfo = ticketRoom?.thongTinPhim;
  const totalPrice = selectedSeats.reduce(
    (total, seat) => total + seat.giaVe,
    0,
  );
  const isLoading =
    isMovieLoading || isShowtimeLoading || bookTickets.isPending;

  const handleSelectShowtime = (maLichChieu) => {
    setManualSelectedShowtimeId(maLichChieu?.toString());
    setSelectedSeats([]);
  };

  const handleSelectScheduleDate = (dateKey) => {
    setSelectedScheduleDate(dateKey);
    setManualSelectedShowtimeId("");
    setSelectedSeats([]);
  };

  const handleMoveScheduleDate = (direction) => {
    if (activeScheduleIndex < 0) return;
    if (direction < 0 && !canMoveScheduleBack) return;
    if (direction > 0 && !canMoveScheduleNext) return;

    const nextIndex = activeScheduleIndex + direction;
    const nextDate = allScheduleDates[nextIndex];

    if (!nextDate) return;

    if (nextIndex < visibleScheduleStartOffset) {
      setScheduleStartOffset(nextIndex);
    }

    if (nextIndex >= visibleScheduleStartOffset + SCHEDULE_DAY_COUNT) {
      setScheduleStartOffset(
        Math.min(nextIndex - SCHEDULE_DAY_COUNT + 1, maxScheduleStartOffset),
      );
    }

    handleSelectScheduleDate(nextDate.key);
  };

  const handleToggleSeat = (seat) => {
    if (seat.daDat) return;

    setSelectedSeats((currentSeats) => {
      const isSelected = currentSeats.some((item) => item.maGhe === seat.maGhe);
      return isSelected
        ? currentSeats.filter((item) => item.maGhe !== seat.maGhe)
        : [...currentSeats, seat];
    });
  };

  const handleBookTickets = async () => {
    if (!selectedShowtimeId) {
      notify({
        type: "warning",
        title: "Chưa chọn suất chiếu",
        message: "Bạn chọn một suất chiếu trước khi đặt vé.",
      });
      return;
    }

    if (selectedSeats.length === 0) {
      notify({
        type: "warning",
        title: "Chưa chọn ghế",
        message: "Bạn chọn ít nhất một ghế để tiếp tục đặt vé.",
      });
      return;
    }

    const seatNames = selectedSeats
      .map((seat) => seat.displaySeatName || seat.tenGhe)
      .join(", ");
    const accepted = await confirm({
      title: "Xác nhận đặt vé",
      message: `${movieInfo?.tenPhim || movie?.tenPhim || "Phim đã chọn"} · ${selectedShowtime?.tenCumRap || "Rạp đã chọn"} · ${formatScheduleTime(selectedShowtime?.ngayChieuGioChieu)} · Ghế ${seatNames} · ${formatMoney(totalPrice)} VND`,
      confirmText: "Xác nhận đặt vé",
      cancelText: "Kiểm tra lại",
      tone: "warning",
    });

    if (!accepted) return;

    try {
      await bookTickets.mutateAsync({
        maLichChieu: Number(selectedShowtimeId),
        danhSachVe: selectedSeats.map((seat) => ({
          maGhe: seat.maGhe,
          giaVe: seat.giaVe,
        })),
      });

      notify({
        type: "success",
        title: "Đặt vé thành công",
        message: `${selectedSeats.length} ghế - ${formatMoney(totalPrice)} VND`,
      });
      setSelectedSeats([]);
    } catch (error) {
      notify({
        type: "error",
        title: "Đặt vé thất bại",
        message: error.response?.data?.content || "Không thể đặt vé lúc này.",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {isLoading && (
        <div className="fixed inset-0 flex items-center justify-center bg-gray-950/70 z-50">
          <LoadingSpinner />
        </div>
      )}

      <div
        className="bg-cover bg-center"
        style={{
          backgroundImage: `url(${movie?.hinhAnh || movieInfo?.hinhAnh || ""})`,
        }}
      >
        <div className="bg-gray-950/85">
          <div className="max-w-7xl mx-auto px-4 py-8">
            <Link
              to={`/movie/${maPhim}`}
              className="inline-flex cursor-pointer items-center gap-2 text-gray-400 hover:text-yellow-400 transition-colors mb-6"
            >
              Quay lại chi tiết phim
            </Link>

            <div className="flex flex-col md:flex-row gap-5">
              <img
                src={movie?.hinhAnh || movieInfo?.hinhAnh}
                alt={movie?.tenPhim || movieInfo?.tenPhim}
                className="w-32 h-44 object-cover rounded-xl bg-gray-800 flex-shrink-0"
              />
              <div className="min-w-0 flex-1">
                <h1 className="text-3xl md:text-4xl font-bold">
                  {movie?.tenPhim || movieInfo?.tenPhim}
                </h1>
                <p className="text-gray-400 mt-3 max-w-3xl line-clamp-3">
                  {movie?.moTa || "Chọn suất chiếu và ghế để đặt vé."}
                </p>

                {movieInfo && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-5">
                    <div className="bg-gray-900/80 rounded-lg px-4 py-3 border border-gray-800">
                      <p className="text-gray-500 text-xs mb-1">Cụm rạp</p>
                      <p className="text-white text-sm">
                        {movieInfo.tenCumRap}
                      </p>
                    </div>
                    <div className="bg-gray-900/80 rounded-lg px-4 py-3 border border-gray-800">
                      <p className="text-gray-500 text-xs mb-1">Rap</p>
                      <p className="text-white text-sm">{movieInfo.tenRap}</p>
                    </div>
                    <div className="bg-gray-900/80 rounded-lg px-4 py-3 border border-gray-800">
                      <p className="text-gray-500 text-xs mb-1">
                        Ngày giờ chiếu
                      </p>
                      <p className="text-yellow-400 text-sm font-bold">
                        {movieInfo.ngayChieu} {movieInfo.gioChieu}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {isShowtimeError && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl px-5 py-4 mb-6">
            <p className="font-medium">Không thể tải lịch chiếu</p>
            <p className="text-sm text-red-300 mt-1">
              {showtimeError?.response?.data?.content || showtimeError?.message}
            </p>
          </div>
        )}

        <section className="bg-gray-900 border border-gray-800 rounded-xl p-5 md:p-7 mb-8">
          <div className="text-center mb-7">
            <p className="text-yellow-400 text-xs font-bold uppercase tracking-[0.35em] mb-2">
              Lịch phim
            </p>
            <h2 className="text-white text-2xl md:text-3xl font-black uppercase">
              Lịch chiếu
            </h2>
            <p className="text-gray-500 text-sm mt-2">
              {showtimes.length} suất chiếu đang có
            </p>
          </div>

          {showtimes.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-gray-400">
                Phim này chưa có lịch chiếu để đặt vé.
              </p>
            </div>
          ) : (
            <div>
              <div className="mb-8">
                <div className="flex items-center justify-center gap-2 rounded-3xl bg-gray-950/60 p-2.5 shadow-inner shadow-black/30">
                  <button
                    type="button"
                    onClick={() => handleMoveScheduleDate(-1)}
                    disabled={!canMoveScheduleBack}
                    className="grid h-20 w-12 flex-shrink-0 cursor-pointer place-items-center rounded-2xl bg-gray-900/80 text-3xl text-gray-400 shadow-sm shadow-black/20 transition-all duration-300 ease-out hover:bg-gray-800 hover:text-yellow-400 hover:shadow-yellow-400/10 disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:bg-gray-900/80 disabled:hover:text-gray-400"
                  >
                    ‹
                  </button>

                  <div className="grid min-w-0 flex-1 grid-cols-2 gap-2.5 sm:grid-cols-3 md:grid-cols-5 xl:grid-cols-9">
                    {scheduleDates.map((dateItem) => {
                      const isActive = activeScheduleDate === dateItem.key;

                      return (
                        <button
                          key={dateItem.key}
                          type="button"
                          onClick={() => handleSelectScheduleDate(dateItem.key)}
                          className={`h-20 w-full cursor-pointer rounded-2xl text-center transition-all duration-300 ease-out ${isActive ? "scale-[1.02] bg-yellow-400 text-gray-950 shadow-xl shadow-yellow-400/25" : "bg-gray-800/80 text-gray-200 shadow-sm shadow-black/20 hover:scale-[1.01] hover:bg-gray-800 hover:text-yellow-400 hover:shadow-yellow-400/10"}`}
                        >
                          <span className="block pt-3 text-2xl font-black leading-none">
                            {dateItem.dayMonth}
                          </span>
                          <span
                            className={`mt-2 block text-sm font-semibold capitalize ${isActive ? "text-gray-950" : "text-gray-400"}`}
                          >
                            {dateItem.weekday}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  <button
                    type="button"
                    onClick={() => handleMoveScheduleDate(1)}
                    disabled={!canMoveScheduleNext}
                    className="grid h-20 w-12 flex-shrink-0 cursor-pointer place-items-center rounded-2xl bg-gray-900/80 text-3xl text-gray-400 shadow-sm shadow-black/20 transition-all duration-300 ease-out hover:bg-gray-800 hover:text-yellow-400 hover:shadow-yellow-400/10 disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:bg-gray-900/80 disabled:hover:text-gray-400"
                  >
                    ›
                  </button>
                </div>
              </div>

              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-5">
                <h3 className="text-2xl font-black uppercase text-white">
                  Danh sách rạp
                </h3>
                <div className="inline-flex w-fit items-center gap-2 rounded-lg border border-yellow-400/70 px-3 py-2 text-xs font-bold uppercase text-yellow-400">
                  <span className="h-2 w-2 rounded-full bg-yellow-400" />
                  Hồ Chí Minh
                </div>
              </div>

              {showtimesByCinema.length === 0 ? (
                <div className="rounded-xl border border-gray-800 bg-gray-950/70 px-5 py-10 text-center">
                  <p className="text-gray-300 font-semibold">
                    Ngày này chưa có suất chiếu.
                  </p>
                  <p className="text-gray-500 text-sm mt-2">
                    Bạn chọn ngày khác trong thanh lịch chiếu phía trên.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {showtimesByCinema.map((cinema) => {
                    const isCinemaActive = selectedCinemaKey === cinema.key;

                    return (
                      <article
                        key={cinema.key}
                        role="button"
                        tabIndex={0}
                        onClick={() =>
                          handleSelectShowtime(cinema.showtimes[0]?.maLichChieu)
                        }
                        onKeyDown={(event) => {
                          if (event.key === "Enter" || event.key === " ") {
                            event.preventDefault();
                            handleSelectShowtime(
                              cinema.showtimes[0]?.maLichChieu,
                            );
                          }
                        }}
                        className={`cursor-pointer rounded-xl border bg-gray-800/80 p-5 transition-all duration-300 ease-out ${isCinemaActive ? "border-yellow-400 shadow-lg shadow-yellow-400/10" : "border-gray-700 hover:border-yellow-400/40 hover:bg-gray-800"}`}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex min-w-0 gap-3">
                            <img
                              src={cinema.logo}
                              alt={cinema.tenHeThongRap}
                              className="h-11 w-11 flex-shrink-0 rounded-lg bg-white object-contain p-1.5"
                            />
                            <div className="min-w-0">
                              <h4 className="text-lg font-black text-yellow-400">
                                {cinema.tenCumRap}
                              </h4>
                              <p className="mt-2 text-sm leading-relaxed text-gray-300">
                                {cinema.diaChi}
                              </p>
                            </div>
                          </div>
                          <span className="text-xl leading-none text-yellow-400">
                            ⌃
                          </span>
                        </div>

                        <div className="mt-5">
                          <p className="mb-3 text-sm font-bold text-gray-200">
                            Suất chiếu
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {cinema.showtimes.map((showtime) => {
                              const isActive =
                                selectedShowtimeId ===
                                showtime.maLichChieu?.toString();

                              return (
                                <button
                                  key={showtime.maLichChieu}
                                  type="button"
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    handleSelectShowtime(showtime.maLichChieu);
                                  }}
                                  className={`cursor-pointer rounded-lg border px-3 py-2 text-sm font-bold transition-all ${isActive ? "border-yellow-400 bg-yellow-400 text-gray-950" : "border-white/30 text-white hover:border-green-400 hover:bg-green-400 hover:text-gray-950"}`}
                                >
                                  {formatScheduleTime(
                                    showtime.ngayChieuGioChieu,
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </section>

        <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_360px] gap-8">
          <section className="bg-gray-900 border border-gray-800 rounded-xl p-4 sm:p-5">
            <div className="hidden">
              <div
                className="w-full max-w-[376px] sm:max-w-[568px] lg:max-w-[760px] mx-auto flex items-end justify-center text-white font-bold text-sm pb-2"
                style={{
                  borderBottom: "50px solid rgb(255, 159, 95)",
                  borderLeft: "50px solid transparent",
                  borderRight: "50px solid transparent",
                  filter: "drop-shadow(4px 20px 15px rgba(255,255,255,0.25))",
                }}
              >
                Màn hình
              </div>
            </div>

            {!selectedShowtimeId && (
              <div className="text-center py-16">
                <p className="text-gray-400">
                  Chọn suất chiếu để hiển thị phòng vé.
                </p>
              </div>
            )}

            {selectedShowtimeId && isTicketRoomFetching && (
              <div className="text-center py-16">
                <LoadingSpinner />
                <p className="text-gray-400 mt-4">
                  Đang tải ghế cho suất chiếu đã chọn...
                </p>
              </div>
            )}

            {selectedShowtimeId &&
              !isTicketRoomFetching &&
              isTicketRoomError && (
                <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl px-5 py-4">
                  <p className="font-medium">Không thể tải phòng vé</p>
                  <p className="text-sm text-red-300 mt-1">
                    {ticketRoomError?.response?.data?.content ||
                      ticketRoomError?.message}
                  </p>
                </div>
              )}

            {selectedShowtimeId &&
              !isTicketRoomFetching &&
              !isTicketRoomError &&
              seats.length > 0 && (
                <div
                  key={selectedShowtimeId}
                  className="w-full overflow-x-auto overscroll-x-contain rounded-2xl bg-gray-950/40 p-3 pb-4 shadow-inner shadow-black/30 [scrollbar-color:rgba(251,191,36,0.6)_rgba(17,24,39,0.9)] [scrollbar-width:thin]"
                >
                  <div className="mx-auto w-[840px]">
                    <div className="mb-8 text-center">
                      <div
                        className="mx-auto flex w-full items-end justify-center pb-2 text-sm font-bold text-white"
                        style={{
                          borderBottom: "50px solid rgb(255, 159, 95)",
                          borderLeft: "50px solid transparent",
                          borderRight: "50px solid transparent",
                          filter:
                            "drop-shadow(4px 20px 15px rgba(255,255,255,0.25))",
                        }}
                      >
                        Man hinh
                      </div>
                    </div>

                    <div className="grid gap-2">
                      <div
                        className="grid items-center gap-2"
                        style={{
                          gridTemplateColumns: `32px repeat(${SEAT_COLUMN_COUNT}, minmax(0, 1fr))`,
                        }}
                      >
                        <div />
                        {Array.from(
                          { length: SEAT_COLUMN_COUNT },
                          (_, columnIndex) => (
                            <div
                              key={columnIndex}
                              className="text-center text-xs font-extrabold text-yellow-300"
                            >
                              {columnIndex + 1}
                            </div>
                          ),
                        )}
                      </div>

                      {seatRows.map((row) => (
                        <div
                          key={row.rowLabel}
                          className="grid items-center gap-2"
                          style={{
                            gridTemplateColumns: `32px repeat(${SEAT_COLUMN_COUNT}, minmax(0, 1fr))`,
                          }}
                        >
                          <div className="text-center text-sm font-extrabold text-yellow-300">
                            {row.rowLabel}
                          </div>

                          {Array.from(
                            { length: SEAT_COLUMN_COUNT },
                            (_, columnIndex) => {
                              const seat = row.seats[columnIndex];

                              if (!seat) {
                                return (
                                  <div
                                    key={`${row.rowLabel}-${columnIndex}`}
                                    className="aspect-[5/4]"
                                  />
                                );
                              }

                              const seatPosition = getSeatPosition(
                                row.startIndex + columnIndex,
                              );
                              const seatWithDisplayName = {
                                ...seat,
                                displaySeatName: seatPosition.label,
                              };
                              const isSelected = selectedSeats.some(
                                (item) => item.maGhe === seat.maGhe,
                              );
                              let seatClass =
                                "border-orange-500 text-white hover:bg-orange-500/20";

                              if (seat.daDat) {
                                seatClass =
                                  "bg-orange-500 border-orange-500 text-gray-900 cursor-not-allowed";
                              } else if (isSelected) {
                                seatClass =
                                  "bg-green-400 border-green-400 text-gray-900";
                              }

                              return (
                                <button
                                  key={seat.maGhe}
                                  type="button"
                                  disabled={seat.daDat}
                                  aria-label={`Ghế ${seatPosition.label}, ${seat.daDat ? "đã được đặt" : isSelected ? "đang chọn" : "còn trống"}, giá ${formatMoney(seat.giaVe)} VND`}
                                  aria-pressed={isSelected}
                                  onClick={() =>
                                    handleToggleSeat(seatWithDisplayName)
                                  }
                                  className={`aspect-[5/4] w-full rounded border-2 text-xs font-bold transition-all duration-200 ${seat.daDat ? "cursor-not-allowed" : "cursor-pointer"} ${seatClass}`}
                                >
                                  {seatPosition.label}
                                </button>
                              );
                            },
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
          </section>

          <aside className="bg-gray-900 border border-yellow-700 rounded-xl p-5 h-fit xl:sticky xl:top-4">
            <h2 className="text-yellow-400 text-lg font-extrabold text-center uppercase mb-5">
              Ghế đã chọn
            </h2>

            <div className="flex flex-col gap-2 mb-5">
              <div className="flex items-center gap-3">
                <div className="w-7 h-5 rounded bg-orange-500 flex-shrink-0" />
                <span className="text-yellow-200 text-sm">Ghế đã đặt</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-7 h-5 rounded bg-green-400 flex-shrink-0" />
                <span className="text-yellow-200 text-sm">Ghế đang chọn</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-7 h-5 rounded border-2 border-orange-500 flex-shrink-0" />
                <span className="text-yellow-200 text-sm">Ghế chưa đặt</span>
              </div>
            </div>

            <div className="border border-yellow-700 rounded-xl overflow-hidden mb-4">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-yellow-700 bg-black/30">
                    <th className="text-yellow-400 py-2 px-3 text-left font-bold">
                      Ghế
                    </th>
                    <th className="text-yellow-400 py-2 px-3 text-left font-bold">
                      Giá
                    </th>
                    <th className="text-yellow-400 py-2 px-3 text-center font-bold">
                      Hủy
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {selectedSeats.map((seat) => (
                    <tr
                      key={seat.maGhe}
                      className="border-b border-yellow-900/50"
                    >
                      <td className="text-orange-400 py-2 px-3 font-bold">
                        {seat.displaySeatName || seat.tenGhe}
                      </td>
                      <td className="text-orange-400 py-2 px-3">
                        {formatMoney(seat.giaVe)}
                      </td>
                      <td className="py-2 px-3 text-center">
                        <button
                          type="button"
                          aria-label={`Bỏ chọn ghế ${seat.displaySeatName || seat.tenGhe}`}
                          onClick={() => handleToggleSeat(seat)}
                          className="cursor-pointer text-red-500 font-bold text-base leading-none"
                        >
                          x
                        </button>
                      </td>
                    </tr>
                  ))}

                  {selectedSeats.length === 0 && (
                    <tr>
                      <td
                        colSpan="3"
                        className="text-center text-yellow-200 py-4 italic"
                      >
                        Chưa chọn ghế
                      </td>
                    </tr>
                  )}

                  <tr>
                    <td className="text-yellow-300 py-2 px-3 font-bold">
                      Tổng tiền
                    </td>
                    <td className="text-orange-400 py-2 px-3 font-extrabold">
                      {formatMoney(totalPrice)}
                    </td>
                    <td />
                  </tr>
                </tbody>
              </table>
            </div>

            <button
              type="button"
              onClick={handleBookTickets}
              disabled={
                !selectedShowtimeId ||
                selectedSeats.length === 0 ||
                bookTickets.isPending
              }
              className="w-full cursor-pointer bg-orange-500 hover:bg-orange-400 disabled:cursor-not-allowed disabled:bg-orange-900 disabled:text-gray-400 text-black font-extrabold py-3 rounded-xl uppercase text-sm transition-colors"
            >
              Đặt vé
            </button>

            {selectedShowtime && (
              <p className="text-gray-500 text-xs mt-4 text-center">
                {selectedShowtime.tenCumRap} - {selectedShowtime.tenRap}
              </p>
            )}
          </aside>
        </div>
      </main>
    </div>
  );
};

export default BookingPage;
