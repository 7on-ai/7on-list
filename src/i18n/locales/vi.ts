import type { Dictionary } from "../types";

export const vi: Dictionary = {
  meta: {
    title: "7on ARC — Hãy là người đầu tiên sở hữu Sunday",
    description: "7on ARC, AI theo bạn mọi nơi. Nhận thông số sơ bộ của nơi Sunday sống — AI Agent luôn bật.",
    ogLine: "Sunday sống trên 7on ARC.",
  },
  hero: {
    headline: ["Hãy là người đầu tiên", "sở hữu Sunday."],
    sub: "ARC đi kèm một đám mây riêng của bạn: một container, một cơ sở dữ liệu, cho đúng một người. Sunday sống ở đó và lo mọi việc trong khi bạn sống ngày của mình.",
    placeholder: "Email của bạn",
    cta: "Nhận thông số ARC",
    note: "Không spam. Thông số gửi ngay bây giờ, và thêm một email khi ARC của bạn sẵn sàng.",
  },
  form: {
    success: "Bạn đã có tên. Thông số đang được gửi đến hộp thư của bạn.",
    invalid: "Email này có vẻ chưa đúng.",
    required: "Hãy nhập email của bạn.",
    error: "Đã có lỗi xảy ra. Vui lòng thử lại.",
    sending: "Đang gửi…",
    emailLabel: "Địa chỉ email",
  },
  orbit: {
    headline: ["Một Agent.", "Mọi thứ quanh bạn."],
    sub: "Cuộc gọi, email, lịch, nhà cửa, tiền bạc — xử lý từ một nơi.",
  },
  day: {
    eyebrow: "Ngày đầu tiên của bạn",
    headline: "Ngày ARC của bạn đến",
    moments: [
      {
        time: "07:00",
        tag: "Tia nắng đầu",
        title: "Buổi sáng, đã xong",
        line: "Chào buổi sáng. Hôm nay trời quang, 24°, và cuộc họp 9 giờ đã dời sang 10 giờ.",
      },
      {
        time: "11:30",
        tag: "Khi bạn làm việc",
        title: "Hộp thư, đã gọn",
        line: "Tôi đã trả lời ba thư chỉ cần một chữ “được”. Hai thư cần bạn xem — đã ghim lại.",
      },
      {
        time: "16:45",
        tag: "Trên đường",
        title: "Việc vặt, đã xong",
        line: "Bưu kiện của bạn dời sang ngày mai. Đã thêm vào lịch.",
      },
      {
        time: "22:10",
        tag: "Tắt đèn",
        title: "Nhà, đã ngủ",
        line: "Cửa đã khóa, đèn đã tắt, báo thức đặt lúc 6:30. Chúc ngủ ngon.",
      },
    ],
  },
  machine: {
    tagline: "AI theo bạn mọi nơi",
    headline: ["Thật sự của bạn."],
    body: "Sunday hiểu bạn. Không ai khác. Dữ liệu của bạn không bao giờ được dùng để huấn luyện mô hình của bất kỳ ai.",
    points: [
      { title: "Một đám mây. Một người.", line: "Container và cơ sở dữ liệu riêng. Không bao giờ dùng chung." },
      { title: "Không gì định danh bạn.", line: "Tên và số được loại bỏ trước khi xử lý." },
      { title: "Xóa bất cứ lúc nào.", line: "Xem mọi ký ức. Xóa bất cứ điều gì." },
    ],
    cta: "Nhận thông số ARC",
  },
  prefs: {
    title: "Tùy chọn email",
    /* {email} is replaced with the address */
    intro: "Chọn những gì chúng tôi gửi đến {email}.",
    options: {
      updates: { label: "Tin cập nhật", description: "Thỉnh thoảng cập nhật về Sunday và ARC, cùng email khi ARC của bạn sẵn sàng." },
      launch: { label: "Chỉ ngày ra mắt", description: "Một email khi ARC của bạn sẵn sàng. Không gì khác." },
      none: { label: "Không nhận", description: "Không nhận thêm email nào từ 7on." },
    },
    current: "Hiện tại",
    choose: "Chọn",
    confirm: "Có, cập nhật cho tôi",
    saved: "Đã lưu.",
    invalid: "Liên kết này không hoạt động. Hãy dùng liên kết trong email mới nhất từ 7on.",
    back: "Quay lại ARC",
  },
  invite: {
    invited: "Một người bạn đã mời bạn",
    title: "Muốn có sớm hơn?",
    body: "Mỗi người bạn nhận thông số qua liên kết của bạn sẽ đưa bạn lên trước trong hàng chờ.",
    copy: "Sao chép liên kết",
    copied: "Đã sao chép",
    share: "Chia sẻ",
    shareText: "Sunday sống trên ARC. Nhận thông số tại:",
    pageTitle: "Vị trí của bạn trong hàng chờ",
    place: "Vị trí",
    friends: "Bạn bè đã tham gia",
    how: "Khi ARC sẵn sàng, chúng tôi gửi email theo thứ tự hàng chờ. Một người bạn được tính khi email thông số đã đến hộp thư của họ.",
    out: "Địa chỉ này đã tắt email từ 7on nên không có trong hàng chờ.",
    manage: "Tùy chọn email",
  },
  footer: "Sinh ra để luôn bật.",
};
