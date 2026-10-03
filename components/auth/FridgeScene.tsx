/**
 * 2.5D fridge for the auth brand panel: layered CSS planes with perspective,
 * door swung open, shelves holding items tagged by expiry status.
 */
const shelves: { label: string; when: string; tone: "danger" | "warn" | "soon" | "ok" }[][] = [
  [
    { label: "นมจืด", when: "เปิดมา 8 วัน", tone: "danger" },
    { label: "หมูสับ", when: "พรุ่งนี้", tone: "warn" },
  ],
  [
    { label: "ผักบุ้ง", when: "อีก 2 วัน", tone: "soon" },
    { label: "ไข่ไก่", when: "อีก 12 วัน", tone: "ok" },
  ],
  [{ label: "ผักกาดขาว", when: "อีก 5 วัน", tone: "ok" }],
];

const toneClass = {
  danger: "bg-danger-soft text-[#7a1810] ring-[#f1b9b3]",
  warn: "bg-warn-soft text-[#7a3a05] ring-[#f3c99b]",
  soon: "bg-soon-soft text-[#5e4500] ring-[#ecd480]",
  ok: "bg-brand-soft text-brand-ink ring-[#b5dccb]",
};

export function FridgeScene() {
  return (
    <div className="relative mx-auto h-[420px] w-[300px] [perspective:1100px]" aria-hidden="true">
      {/* floor shadow */}
      <div className="absolute -bottom-6 left-1/2 h-8 w-[340px] -translate-x-1/2 rounded-[50%] bg-[#0b3d2e]/25 blur-xl" />

      {/* cabinet */}
      <div className="absolute inset-0 rounded-[28px] bg-[#f6fbf8] p-3 shadow-[0_30px_60px_-20px_rgb(4_40_30/0.55)] [transform:rotateY(-14deg)_rotateX(4deg)] [transform-style:preserve-3d]">
        <div className="flex h-full flex-col gap-3 rounded-[20px] bg-gradient-to-b from-[#e3f1ea] to-[#d2e7dc] p-4 shadow-[inset_0_8px_24px_-8px_rgb(4_40_30/0.25)]">
          {/* freezer strip */}
          <div className="flex h-14 items-center justify-between rounded-xl bg-[#c7e2f0]/70 px-3 text-xs font-semibold text-[#24506a] [transform:translateZ(10px)]">
            ช่องแช่แข็ง
            <span className="rounded-full bg-white/70 px-2 py-0.5">−18°</span>
          </div>
          {shelves.map((row, i) => (
            <div key={i} className="relative flex flex-1 items-end gap-2 pb-2 [transform-style:preserve-3d]">
              {row.map((it) => (
                <div
                  key={it.label}
                  className={`rounded-lg px-2.5 py-1.5 text-left ring-1 shadow-[0_6px_10px_-6px_rgb(4_40_30/0.4)] [transform:translateZ(28px)] ${toneClass[it.tone]}`}
                >
                  <p className="text-[0.8125rem] font-semibold leading-tight">{it.label}</p>
                  <p className="text-[0.6875rem] leading-tight opacity-80">{it.when}</p>
                </div>
              ))}
              <div className="absolute inset-x-0 bottom-0 h-1.5 rounded-full bg-white/80 shadow-[0_2px_4px_rgb(4_40_30/0.15)]" />
            </div>
          ))}
        </div>
      </div>

      {/* open door */}
      <div className="absolute inset-y-0 left-full w-[150px] origin-left rounded-r-[28px] bg-gradient-to-r from-[#e9f4ee] to-[#f8fcfa] shadow-[12px_20px_40px_-18px_rgb(4_40_30/0.5)] [transform:rotateY(-62deg)]">
        <div className="absolute left-4 top-1/3 h-24 w-2 rounded-full bg-[#b9d3c6]" />
      </div>
    </div>
  );
}
