/** 1–2 tiny flies orbiting a going-off item. CSS transform animation only; decoration (the badge carries the meaning). */
export function Flies({ n }: { n: number }) {
  return (
    <span aria-hidden="true">
      {Array.from({ length: n }, (_, i) => (
        <span key={i} className="fly">
          <span>
            <svg width="8" height="8" viewBox="0 0 8 8">
              <ellipse cx="4" cy="5" rx="2" ry="2.5" fill="#12201A" opacity=".85" />
              <g className="wing" opacity=".75" fill="#fff" stroke="#12201A" strokeWidth=".4">
                <ellipse cx="2.2" cy="2.4" rx="1.5" ry="1.25" />
                <ellipse cx="5.8" cy="2.4" rx="1.5" ry="1.25" />
              </g>
            </svg>
          </span>
        </span>
      ))}
    </span>
  );
}
