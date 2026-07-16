// Tạo mã QR chuyển tiền: VietQR (napas 247) cho ngân hàng + QR chuyển tiền MoMo.
// Nội dung mặc định để không diacritic cho chắc chắn app quét được (memo ngân hàng
// vốn cũng bỏ dấu). Cấu hình nhận tiền lấy theo người bán tạo đơn, không cố định.

export const TRANSFER_NOTE = "Chuyen tien do an";

// Thông tin nhận tiền lưu trên profile của từng người bán.
export interface PaymentInfo {
  momo_phone: string | null;
  bank_bin: string | null;
  bank_account: string | null;
  bank_account_name: string | null;
}

export interface Bank {
  bin: string; // mã napas 6 số dùng trong VietQR
  short: string; // tên viết tắt hiển thị
  name: string; // tên đầy đủ
}

// Danh sách ngân hàng phổ biến (mã BIN napas). Đủ dùng cho nhu cầu cá nhân.
export const BANKS: Bank[] = [
  { bin: "970436", short: "Vietcombank", name: "Ngoại thương Việt Nam (VCB)" },
  { bin: "970407", short: "Techcombank", name: "Kỹ Thương (TCB)" },
  { bin: "970418", short: "BIDV", name: "Đầu tư và Phát triển (BIDV)" },
  { bin: "970415", short: "VietinBank", name: "Công Thương (CTG)" },
  { bin: "970422", short: "MB Bank", name: "Quân Đội (MB)" },
  { bin: "970416", short: "ACB", name: "Á Châu (ACB)" },
  { bin: "970432", short: "VPBank", name: "Việt Nam Thịnh Vượng (VPB)" },
  { bin: "970405", short: "Agribank", name: "Nông nghiệp (Agribank)" },
  { bin: "970403", short: "Sacombank", name: "Sài Gòn Thương Tín (STB)" },
  { bin: "970423", short: "TPBank", name: "Tiên Phong (TPB)" },
  { bin: "970441", short: "VIB", name: "Quốc Tế (VIB)" },
  { bin: "970443", short: "SHB", name: "Sài Gòn - Hà Nội (SHB)" },
  { bin: "970437", short: "HDBank", name: "Phát triển TP.HCM (HDB)" },
  { bin: "970448", short: "OCB", name: "Phương Đông (OCB)" },
  { bin: "970426", short: "MSB", name: "Hàng Hải (MSB)" },
  { bin: "970440", short: "SeABank", name: "Đông Nam Á (SeABank)" },
  { bin: "970431", short: "Eximbank", name: "Xuất Nhập Khẩu (EIB)" },
  { bin: "970449", short: "LPBank", name: "Lộc Phát / LienVietPost (LPB)" },
  { bin: "970429", short: "SCB", name: "Sài Gòn (SCB)" },
  { bin: "970425", short: "ABBANK", name: "An Bình (ABB)" },
  { bin: "970428", short: "Nam A Bank", name: "Nam Á (NAB)" },
  { bin: "970412", short: "PVcomBank", name: "Đại Chúng (PVCB)" },
  { bin: "970409", short: "BacABank", name: "Bắc Á (BAB)" },
  { bin: "970454", short: "BVBank", name: "Bản Việt (BVB)" },
  { bin: "970452", short: "KienlongBank", name: "Kiên Long (KLB)" },
  { bin: "970400", short: "SaigonBank", name: "Sài Gòn Công Thương (SGB)" },
  { bin: "970433", short: "VietBank", name: "Việt Nam Thương Tín (VBB)" },
  { bin: "970430", short: "PGBank", name: "Xăng dầu Petrolimex (PGB)" },
];

export function bankByBin(bin: string | null): Bank | undefined {
  if (!bin) return undefined;
  return BANKS.find((b) => b.bin === bin);
}

export function hasMomo(p: PaymentInfo): boolean {
  return !!p.momo_phone?.trim();
}

export function hasBank(p: PaymentInfo): boolean {
  return !!(p.bank_bin?.trim() && p.bank_account?.trim());
}

// ---- EMVCo TLV helpers (VietQR) ----

function tlv(id: string, value: string): string {
  return id + value.length.toString().padStart(2, "0") + value;
}

// CRC-16/CCITT-FALSE (poly 0x1021, init 0xFFFF) — chuẩn checksum của EMVCo QR.
function crc16(input: string): string {
  let crc = 0xffff;
  for (let i = 0; i < input.length; i++) {
    crc ^= input.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      crc = crc & 0x8000 ? (crc << 1) ^ 0x1021 : crc << 1;
      crc &= 0xffff;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, "0");
}

// Chuỗi VietQR động (có sẵn số tiền) chuyển khoản nhanh 24/7 đến số tài khoản.
export function buildVietQr(args: {
  bin: string;
  account: string;
  amount: number;
  note: string;
}): string {
  const merchantAccountInfo =
    tlv("00", "A000000727") +
    tlv("01", tlv("00", args.bin) + tlv("01", args.account)) +
    tlv("02", "QRIBFTTA"); // chuyển tới tài khoản

  let payload =
    tlv("00", "01") + // payload format indicator
    tlv("01", "12") + // dynamic QR (dùng một lần, có số tiền)
    tlv("38", merchantAccountInfo) +
    tlv("53", "704") + // VND
    (args.amount > 0 ? tlv("54", String(args.amount)) : "") +
    tlv("58", "VN");

  if (args.note) payload += tlv("62", tlv("08", args.note));

  payload += "6304"; // id + len của CRC, tính checksum trên cả tiền tố này
  return payload + crc16(payload);
}

// MoMo là "ngân hàng" trên napas (BIN 971025), số tài khoản chính là số điện thoại.
export const MOMO_BIN = "971025";

// Từ 10/2025 MoMo nhận tiền qua VietQR như một ngân hàng napas. Mã này quét được
// bằng cả app MoMo lẫn mọi app ngân hàng, không dính lỗi "ví chưa xác thực" như
// chuỗi transfer_p2p (2|99|...) cũ.
export function buildMomoQr(args: { phone: string; amount: number; note: string }): string {
  return buildVietQr({ bin: MOMO_BIN, account: args.phone, amount: args.amount, note: args.note });
}
