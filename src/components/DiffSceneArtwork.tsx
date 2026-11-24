import React from 'react';
import { DiffSceneDefinition } from '../utils/svagoGames';
import { getEmoji3DUrl } from '../utils/emoji3dDatabase';

interface DiffSceneArtworkProps {
  scene: DiffSceneDefinition;
  /** False = Reference picture (A), True = Variant picture (B) with active differences applied */
  isVariant: boolean;
  activeSpotIds: string[];
  foundSpotIds: string[];
  hintSpotId: string | null;
  missRipple: { x: number; y: number; key: number } | null;
  onTapPoint: (svgX: number, svgY: number) => void;
}

export const DiffSceneArtwork: React.FC<DiffSceneArtworkProps> = ({
  scene,
  isVariant,
  activeSpotIds,
  foundSpotIds,
  hintSpotId,
  missRipple,
  onTapPoint,
}) => {
  const diffActive = (spotId: string) => isVariant && activeSpotIds.includes(spotId);
  const uid = `${scene.id}-${isVariant ? 'b' : 'a'}`;

  const renderEmoji3D = (emoji: string, cx: number, cy: number, size: number) => {
    const url = getEmoji3DUrl(emoji);
    if (!url) return null;
    return (
      <image
        href={url}
        x={cx - size / 2}
        y={cy - size / 2}
        width={size}
        height={size}
        preserveAspectRatio="xMidYMid meet"
        className="pointer-events-none"
      />
    );
  };

  const handleSvgClick = (e: React.MouseEvent<SVGSVGElement>) => {
    const svg = e.currentTarget;
    const rect = svg.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;
    const x = ((e.clientX - rect.left) / rect.width) * 320;
    const y = ((e.clientY - rect.top) / rect.height) * 210;
    onTapPoint(x, y);
  };

  return (
    <svg
      viewBox="0 0 320 210"
      onClick={handleSvgClick}
      role="img"
      aria-label={`${scene.title} - ${isVariant ? 'Immagine B' : 'Immagine A'}`}
      className="w-full h-auto block rounded-2xl cursor-pointer touch-manipulation select-none"
    >
      <defs>
        <linearGradient id={`${uid}-sky`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#38bdf8" />
          <stop offset="100%" stopColor="#bae6fd" />
        </linearGradient>
        <linearGradient id={`${uid}-grass`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#4ade80" />
          <stop offset="100%" stopColor="#16a34a" />
        </linearGradient>
        <linearGradient id={`${uid}-sea`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0ea5e9" />
          <stop offset="100%" stopColor="#0369a1" />
        </linearGradient>
        <linearGradient id={`${uid}-space`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0f172a" />
          <stop offset="60%" stopColor="#1e1b4b" />
          <stop offset="100%" stopColor="#312e81" />
        </linearGradient>
      </defs>

      {/* ================================================================= */}
      {/* SCENE 1: LA CASETTA NEL PRATO                                     */}
      {/* ================================================================= */}
      {scene.id === 'meadow' && (
        <g>
          {/* Sky & Hills */}
          <rect x="0" y="0" width="320" height="210" fill={`url(#${uid}-sky)`} />
          <ellipse cx="90" cy="175" rx="140" ry="52" fill="#86efac" />
          <ellipse cx="255" cy="180" rx="135" ry="56" fill={`url(#${uid}-grass)`} />
          <rect x="0" y="156" width="320" height="54" fill={`url(#${uid}-grass)`} />

          {/* Winding cream garden path */}
          <path
            d="M135 162 Q148 184 126 210 L166 210 Q176 184 157 162 Z"
            fill="#fef3c7"
            stroke="#fde68a"
            strokeWidth="2"
          />

          {/* SPOT 1: sun_rays (52, 40) */}
          <g>
            <circle
              cx="52"
              cy="40"
              r="21"
              fill={diffActive('sun_rays') ? 'rgba(251, 146, 60, 0.35)' : 'rgba(253, 224, 71, 0.32)'}
            />
            {diffActive('sun_rays')
              ? renderEmoji3D('😎', 52, 40, 38)
              : renderEmoji3D('☀️', 52, 40, 44)}
          </g>

          {/* SPOT 7: cloud_bird (122, 36) */}
          <g>
            {renderEmoji3D('☁️', 124, 40, 46)}
            {diffActive('cloud_bird') && renderEmoji3D('🐦', 126, 22, 24)}
          </g>

          {/* SPOT 5: butterfly (204, 52) */}
          {!diffActive('butterfly') && renderEmoji3D('🦋', 204, 52, 34)}

          {/* Cozy House */}
          <rect x="108" y="102" width="76" height="62" rx="6" fill="#fffbeb" stroke="#d97706" strokeWidth="2.5" />
          {/* Windows */}
          <rect x="116" y="116" width="16" height="16" rx="3" fill="#7dd3fc" stroke="#0284c7" strokeWidth="2" />
          <line x1="124" y1="116" x2="124" y2="132" stroke="#ffffff" strokeWidth="1.5" />
          <line x1="116" y1="124" x2="132" y2="124" stroke="#ffffff" strokeWidth="1.5" />

          <rect x="160" y="116" width="16" height="16" rx="3" fill="#7dd3fc" stroke="#0284c7" strokeWidth="2" />
          <line x1="168" y1="116" x2="168" y2="132" stroke="#ffffff" strokeWidth="1.5" />
          <line x1="160" y1="124" x2="176" y2="124" stroke="#ffffff" strokeWidth="1.5" />

          {/* SPOT 2: roof_color (146, 86) */}
          <g>
            <rect x="165" y="68" width="12" height="22" rx="2" fill={diffActive('roof_color') ? '#facc15' : '#9a3412'} stroke="#ffffff" strokeWidth="1.2" />
            <polygon
              points="98,104 146,64 194,104"
              fill={diffActive('roof_color') ? '#2563eb' : '#ef4444'}
              stroke="#ffffff"
              strokeWidth="2.5"
              strokeLinejoin="round"
            />
          </g>

          {/* SPOT 3: door_color (146, 146) */}
          <g>
            <path
              d="M136 164 L136 138 Q146 130 156 138 L156 164 Z"
              fill={diffActive('door_color') ? '#9333ea' : '#92400e'}
              stroke="#ffffff"
              strokeWidth="2"
            />
            <circle cx="152" cy="150" r="2.2" fill="#fde047" />
            {diffActive('door_color') && (
              <circle cx="146" cy="143" r="3.5" fill="#fde047" />
            )}
          </g>

          {/* Big Tree on Right + SPOT 4: tree_fruit (256, 96) */}
          <rect x="248" y="118" width="16" height="48" rx="5" fill="#92400e" />
          <circle cx="256" cy="96" r="32" fill="#22c55e" stroke="#15803d" strokeWidth="2" />
          <circle cx="236" cy="102" r="20" fill="#22c55e" />
          <circle cx="276" cy="102" r="20" fill="#22c55e" />
          {[
            { x: 242, y: 92 },
            { x: 260, y: 82 },
            { x: 268, y: 104 },
          ].map((f, i) => (
            <g key={i}>
              {renderEmoji3D(diffActive('tree_fruit') ? '🍏' : '🍎', f.x, f.y, 17)}
            </g>
          ))}

          {/* SPOT 6: flower_left (66, 168) */}
          <g>
            {diffActive('flower_left')
              ? renderEmoji3D('🌷', 66, 174, 34)
              : renderEmoji3D('🌸', 66, 174, 34)}
          </g>
        </g>
      )}

      {/* ================================================================= */}
      {/* SCENE 2: LA BARCA NEL MARE BLU                                    */}
      {/* ================================================================= */}
      {scene.id === 'sea' && (
        <g>
          <rect x="0" y="0" width="320" height="126" fill={`url(#${uid}-sky)`} />
          <rect x="0" y="122" width="320" height="88" fill={`url(#${uid}-sea)`} />
          {/* Gentle waves */}
          <path d="M0 132 Q20 124 40 132 T80 132 T120 132 T160 132 T200 132 T240 132 T280 132 T320 132" fill="none" stroke="rgba(255,255,255,0.45)" strokeWidth="2.5" />
          <path d="M0 154 Q24 146 48 154 T96 154 T144 154 T192 154 T240 154 T288 154 T336 154" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="2" />

          {/* Sandy Island on right */}
          <ellipse cx="268" cy="146" rx="56" ry="26" fill="#fde68a" stroke="#f59e0b" strokeWidth="2" />
          <ellipse cx="258" cy="186" rx="74" ry="28" fill="#fcd34d" />

          {/* SPOT 6: sun_glasses (50, 40) */}
          <g>
            <circle cx="50" cy="40" r="20" fill="rgba(253, 224, 71, 0.34)" />
            {diffActive('sun_glasses')
              ? renderEmoji3D('😎', 50, 40, 36)
              : renderEmoji3D('☀️', 50, 40, 42)}
          </g>

          {/* Sailboat */}
          <line x1="146" y1="44" x2="146" y2="122" stroke="#78350f" strokeWidth="4" strokeLinecap="round" />
          {/* SPOT 2: flag_top (146, 42) */}
          {!diffActive('flag_top') && (
            <polygon points="146,34 168,42 146,50" fill="#ef4444" stroke="#ffffff" strokeWidth="1.5" />
          )}
          {/* SPOT 1: sail_color (158, 88) */}
          <polygon
            points="148,52 192,114 148,114"
            fill={diffActive('sail_color') ? '#facc15' : '#ffffff'}
            stroke="#1e293b"
            strokeWidth="2"
            strokeLinejoin="round"
          />
          <polygon
            points="144,62 114,114 144,114"
            fill={diffActive('sail_color') ? '#10b981' : '#fb7185'}
            stroke="#1e293b"
            strokeWidth="2"
            strokeLinejoin="round"
          />
          {/* Hull */}
          <path d="M106 116 L194 116 L180 138 L120 138 Z" fill="#b45309" stroke="#ffffff" strokeWidth="2" strokeLinejoin="round" />
          <circle cx="136" cy="127" r="4" fill="#fde047" />
          <circle cx="152" cy="127" r="4" fill="#fde047" />
          <circle cx="168" cy="127" r="4" fill="#fde047" />

          {/* SPOT 3: lighthouse_stripe (266, 98) */}
          <g>
            <polygon points="256,136 260,72 272,72 276,136" fill="#ffffff" stroke="#334155" strokeWidth="2" />
            <rect x="258" y="88" width="16" height="12" fill={diffActive('lighthouse_stripe') ? '#2563eb' : '#ef4444'} />
            <rect x="257" y="112" width="18" height="12" fill={diffActive('lighthouse_stripe') ? '#2563eb' : '#ef4444'} />
            <rect x="258" y="64" width="16" height="10" rx="2" fill="#fde047" stroke="#334155" strokeWidth="1.5" />
            <polygon points="255,64 266,52 277,64" fill={diffActive('lighthouse_stripe') ? '#1d4ed8' : '#dc2626'} />
          </g>

          {/* SPOT 4: jumping_fish (74, 156) */}
          {!diffActive('jumping_fish') && renderEmoji3D('🐠', 74, 156, 36)}

          {/* SPOT 5: starfish (246, 174) */}
          {diffActive('starfish')
            ? renderEmoji3D('🐚', 246, 174, 30)
            : renderEmoji3D('⭐', 246, 174, 30)}

          {/* SPOT 7: crab (156, 178) */}
          {diffActive('crab') && renderEmoji3D('🦀', 156, 178, 34)}
        </g>
      )}

      {/* ================================================================= */}
      {/* SCENE 3: LA FATTORIA ALLEGRA                                      */}
      {/* ================================================================= */}
      {scene.id === 'farm' && (
        <g>
          <rect x="0" y="0" width="320" height="145" fill={`url(#${uid}-sky)`} />
          <ellipse cx="160" cy="166" rx="200" ry="60" fill={`url(#${uid}-grass)`} />
          <rect x="0" y="148" width="320" height="62" fill={`url(#${uid}-grass)`} />

          {/* SPOT 5: rainbow (162, 40) */}
          {!diffActive('rainbow') && renderEmoji3D('🌈', 162, 42, 62)}

          {/* SPOT 7: cloud_extra (56, 38) */}
          {diffActive('cloud_extra')
            ? renderEmoji3D('☀️', 56, 38, 40)
            : renderEmoji3D('☁️', 56, 38, 44)}

          {/* Red Barn + SPOT 1: barn_star (92, 86) */}
          <polygon points="56,102 92,66 128,102" fill="#b91c1c" stroke="#ffffff" strokeWidth="2.2" />
          <rect x="62" y="102" width="60" height="54" rx="4" fill="#dc2626" stroke="#ffffff" strokeWidth="2" />
          <rect x="78" y="122" width="28" height="34" rx="3" fill="#7f1d1d" stroke="#ffffff" strokeWidth="2" />
          <line x1="78" y1="122" x2="106" y2="156" stroke="#ffffff" strokeWidth="1.8" />
          <line x1="106" y1="122" x2="78" y2="156" stroke="#ffffff" strokeWidth="1.8" />
          {diffActive('barn_star') ? (
            <circle cx="92" cy="88" r="9" fill="#e0f2fe" stroke="#ffffff" strokeWidth="2" />
          ) : (
            renderEmoji3D('⭐', 92, 87, 22)
          )}

          {/* Wooden Fence on Left */}
          <rect x="14" y="144" width="46" height="6" rx="2" fill="#d97706" />
          <rect x="20" y="136" width="7" height="24" rx="2" fill="#b45309" />
          <rect x="44" y="136" width="7" height="24" rx="2" fill="#b45309" />

          {/* SPOT 6: fence_bird (48, 164) */}
          <g>
            {diffActive('fence_bird')
              ? renderEmoji3D('🌺', 48, 168, 34)
              : renderEmoji3D('🌻', 48, 168, 36)}
          </g>

          {/* Windmill + SPOT 4: windmill (256, 76) */}
          <polygon points="242,146 250,78 262,78 270,146" fill="#fef3c7" stroke="#b45309" strokeWidth="2" />
          <g transform="translate(256, 76)">
            {[0, 90, 180, 270].map((deg) => (
              <rect
                key={deg}
                x="-4"
                y="-26"
                width="8"
                height="24"
                rx="3"
                transform={`rotate(${deg + 45})`}
                fill={diffActive('windmill') ? '#facc15' : '#ef4444'}
                stroke="#ffffff"
                strokeWidth="1.4"
              />
            ))}
            <circle cx="0" cy="0" r="5.5" fill="#78350f" stroke="#ffffff" strokeWidth="1.5" />
          </g>

          {/* SPOT 2: tractor_color (224, 148) */}
          <g>
            <rect
              x="202"
              y="138"
              width="42"
              height="20"
              rx="5"
              fill={diffActive('tractor_color') ? '#2563eb' : '#16a34a'}
              stroke="#ffffff"
              strokeWidth="2"
            />
            <rect
              x="220"
              y="122"
              width="22"
              height="18"
              rx="4"
              fill={diffActive('tractor_color') ? '#3b82f6' : '#22c55e'}
              stroke="#ffffff"
              strokeWidth="2"
            />
            <rect x="224" y="126" width="13" height="10" rx="2" fill="#bae6fd" />
            <circle cx="236" cy="160" r="12" fill="#1e293b" stroke="#facc15" strokeWidth="3.5" />
            <circle cx="208" cy="164" r="8" fill="#1e293b" stroke="#facc15" strokeWidth="3" />
          </g>

          {/* SPOT 3: chick (144, 172) */}
          {!diffActive('chick') && renderEmoji3D('🐥', 146, 172, 32)}
        </g>
      )}

      {/* ================================================================= */}
      {/* SCENE 4: AVVENTURA NELLO SPAZIO                                   */}
      {/* ================================================================= */}
      {scene.id === 'space' && (
        <g>
          <rect x="0" y="0" width="320" height="210" fill={`url(#${uid}-space)`} />
          {/* Ambient tiny stars */}
          {[
            [26, 22], [108, 28], [202, 26], [296, 30], [28, 108],
            [102, 118], [292, 118], [32, 186], [116, 190], [294, 188],
          ].map(([sx, sy], idx) => (
            <circle key={idx} cx={sx} cy={sy} r="2" fill="#fef08a" opacity="0.85" />
          ))}

          {/* SPOT 3: moon_face (56, 56) */}
          {diffActive('moon_face')
            ? renderEmoji3D('🌕', 56, 56, 38)
            : renderEmoji3D('🌙', 56, 56, 38)}

          {/* SPOT 6: planet_green (156, 36) */}
          <g>
            <circle
              cx="156"
              cy="36"
              r="14"
              fill={diffActive('planet_green') ? '#f97316' : '#22c55e'}
              stroke="#ffffff"
              strokeWidth="1.8"
            />
            <circle cx="152" cy="33" r="3" fill="rgba(255,255,255,0.35)" />
            <circle cx="161" cy="40" r="2.5" fill="rgba(255,255,255,0.3)" />
          </g>

          {/* SPOT 2: saturn_ring (252, 64) */}
          <g>
            <ellipse
              cx="252"
              cy="64"
              rx="28"
              ry="8"
              fill="none"
              stroke={diffActive('saturn_ring') ? '#f472b6' : '#fde047'}
              strokeWidth="4.5"
              transform="rotate(-16 252 64)"
            />
            <circle
              cx="252"
              cy="64"
              r="15"
              fill={diffActive('saturn_ring') ? '#c084fc' : '#fb923c'}
              stroke="#ffffff"
              strokeWidth="1.8"
            />
          </g>

          {/* Center Rocket + SPOT 1: rocket_window (158, 102) */}
          <g>
            {/* Flame */}
            <polygon points="149,134 158,154 167,134" fill="#f97316" />
            <polygon points="153,134 158,146 163,134" fill="#fde047" />
            {/* Fins */}
            <polygon
              points="142,118 128,136 144,132"
              fill={diffActive('rocket_window') ? '#22c55e' : '#ef4444'}
              stroke="#ffffff"
              strokeWidth="1.5"
            />
            <polygon
              points="174,118 188,136 172,132"
              fill={diffActive('rocket_window') ? '#22c55e' : '#ef4444'}
              stroke="#ffffff"
              strokeWidth="1.5"
            />
            {/* Body */}
            <path
              d="M158 64 Q176 84 174 134 L142 134 Q140 84 158 64 Z"
              fill="#f8fafc"
              stroke="#cbd5e1"
              strokeWidth="2"
            />
            {/* Nose cone */}
            <path
              d="M158 64 Q168 74 171 86 L145 86 Q148 74 158 64 Z"
              fill={diffActive('rocket_window') ? '#22c55e' : '#ef4444'}
            />
            {/* Window */}
            {diffActive('rocket_window') ? (
              renderEmoji3D('⭐', 158, 103, 22)
            ) : (
              <circle cx="158" cy="103" r="10" fill="#38bdf8" stroke="#1e293b" strokeWidth="2.5" />
            )}
          </g>

          {/* SPOT 5: comet (74, 156) */}
          {!diffActive('comet') && renderEmoji3D('☄️', 74, 156, 36)}

          {/* SPOT 4: ufo (244, 154) */}
          {!diffActive('ufo') && renderEmoji3D('🛸', 244, 154, 42)}

          {/* SPOT 7: big_star (158, 174) */}
          {diffActive('big_star')
            ? renderEmoji3D('💖', 158, 174, 30)
            : renderEmoji3D('⭐', 158, 174, 32)}
        </g>
      )}

      {/* ================================================================= */}
      {/* OVERLAYS: HINT HALO, FOUND RINGS & SOFT MISS RIPPLE               */}
      {/* ================================================================= */}
      {scene.spots.map((spot) => {
        if (!activeSpotIds.includes(spot.id)) return null;
        const isFound = foundSpotIds.includes(spot.id);
        const isHint = !isFound && hintSpotId === spot.id;

        if (isFound) {
          return (
            <g key={spot.id} className="pointer-events-none">
              <circle
                cx={spot.cx}
                cy={spot.cy}
                r={Math.max(16, spot.r - 3)}
                fill="rgba(16, 185, 129, 0.22)"
                stroke="#10b981"
                strokeWidth="3.5"
              />
              <circle
                cx={spot.cx + spot.r * 0.62}
                cy={spot.cy - spot.r * 0.62}
                r="8.5"
                fill="#10b981"
                stroke="#ffffff"
                strokeWidth="2"
              />
              <path
                d={`M${spot.cx + spot.r * 0.62 - 3.5} ${spot.cy - spot.r * 0.62} L${spot.cx + spot.r * 0.62 - 1} ${spot.cy - spot.r * 0.62 + 3} L${spot.cx + spot.r * 0.62 + 4} ${spot.cy - spot.r * 0.62 - 3}`}
                fill="none"
                stroke="#ffffff"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </g>
          );
        }

        if (isHint) {
          return (
            <g key={spot.id} className="pointer-events-none">
              <circle
                cx={spot.cx}
                cy={spot.cy}
                r={spot.r}
                fill="rgba(250, 204, 21, 0.24)"
                stroke="#facc15"
                strokeWidth="3.5"
                strokeDasharray="6 4"
              >
                <animate
                  attributeName="r"
                  values={`${spot.r - 3};${spot.r + 4};${spot.r - 3}`}
                  dur="1.1s"
                  repeatCount="indefinite"
                />
              </circle>
            </g>
          );
        }

        return null;
      })}

      {missRipple && (
        <circle
          key={missRipple.key}
          cx={missRipple.x}
          cy={missRipple.y}
          r="12"
          fill="rgba(255,255,255,0.38)"
          stroke="#ffffff"
          strokeWidth="2.5"
          className="pointer-events-none"
        />
      )}
    </svg>
  );
};
