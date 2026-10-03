/** Maps Supabase Auth error codes to Thai copy that names the problem and the fix. */
const MESSAGES: Record<string, string> = {
  invalid_credentials: "อีเมลหรือรหัสผ่านไม่ถูกต้อง ลองอีกครั้ง หรือกด “ลืมรหัสผ่าน”",
  email_not_confirmed: "ยังไม่ได้ยืนยันอีเมล เปิดอีเมลจาก frezill แล้วกดลิงก์ยืนยันก่อนนะ",
  user_already_exists: "อีเมลนี้มีบัญชีแล้ว ลองเข้าสู่ระบบแทน",
  email_exists: "อีเมลนี้มีบัญชีแล้ว ลองเข้าสู่ระบบแทน",
  weak_password: "รหัสผ่านเดาง่ายเกินไป ลองผสมตัวอักษรกับตัวเลข",
  same_password: "รหัสผ่านใหม่ต้องไม่ซ้ำกับรหัสเดิม",
  over_email_send_rate_limit: "ส่งอีเมลถี่เกินไป รอสักครู่แล้วลองใหม่",
  over_request_rate_limit: "ลองบ่อยเกินไป รอสักครู่แล้วลองใหม่",
  signup_disabled: "ตอนนี้ปิดรับสมัครชั่วคราว",
  validation_failed: "ข้อมูลไม่ถูกต้อง ตรวจอีกครั้งนะ",
};

export function authErrorMessage(err: { code?: string; message?: string } | null | undefined) {
  if (!err) return "เกิดข้อผิดพลาด ลองใหม่อีกครั้ง";
  if (err.code && MESSAGES[err.code]) return MESSAGES[err.code];
  return "เกิดข้อผิดพลาด ลองใหม่อีกครั้ง";
}
