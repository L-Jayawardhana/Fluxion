import './SpeedLoader.css';

export default function SpeedLoader({ label }) {
  return (
    <div className="speed-overlay">
      <div className="speed-loader">
        <span>
          <span></span><span></span><span></span><span></span>
        </span>
        <div className="speed-base">
          <span></span>
          <div className="speed-face"></div>
        </div>
      </div>
      <div className="speed-fazers">
        <span></span><span></span><span></span><span></span>
      </div>
      {label && <p className="speed-label">{label}</p>}
    </div>
  );
}
