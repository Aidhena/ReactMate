import React from 'react';
import { MascotMood } from '../types';

export type RobotActivity =
  | 'scolding'
  | 'clock_warning'
  | 'worried_note'
  | 'coin_toss'
  | 'cheering'
  | 'saving_coin'
  | 'checklist'
  | 'waving'
  | 'writing_notes'
  | 'calculating'
  | 'coin_bounce';

interface KasMateActivityRobotProps {
  mood: MascotMood;
  activity: RobotActivity;
  sizeClassName?: string;
}

export const KasMateActivityRobot: React.FC<KasMateActivityRobotProps> = ({
  mood,
  activity,
  sizeClassName = 'w-[76px] h-[76px]',
}) => {
  const uid = React.useId().replace(/:/g, '');
  const isAngry = mood === MascotMood.ANGRY;
  const isSad = mood === MascotMood.SAD;
  const isCoinToss = activity === 'coin_toss';
  const isCheering = activity === 'cheering';
  const isHappyMood =
    mood === MascotMood.HAPPY ||
    mood === MascotMood.EXCITED ||
    isCoinToss ||
    isCheering;

  const wrapperAnim = isAngry
    ? 'animate-angry-shake'
    : isCoinToss || isCheering
    ? 'animate-mascot-excited'
    : 'animate-mascot-bob';

  // Dynamic arm poses per activity
  const leftArmTransform = isCoinToss
    ? 'translate(-4px, -16px) rotate(24deg)'
    : isCheering || activity === 'waving'
    ? 'translate(-6px, -22px) rotate(42deg)'
    : isAngry
    ? 'translate(-2px, -8px) rotate(14deg)'
    : activity === 'checklist' || activity === 'writing_notes'
    ? 'translate(4px, -6px) rotate(-14deg)'
    : 'translate(0px, 0px) rotate(-8deg)';

  const rightArmTransform = isCoinToss
    ? 'translate(4px, -26px) rotate(-48deg)'
    : isCheering
    ? 'translate(6px, -22px) rotate(-42deg)'
    : activity === 'saving_coin' || activity === 'coin_bounce'
    ? 'translate(2px, -16px) rotate(-28deg)'
    : activity === 'calculating'
    ? 'translate(-3px, -10px) rotate(12deg)'
    : isAngry
    ? 'translate(2px, -8px) rotate(-14deg)'
    : 'translate(0px, 0px) rotate(8deg)';

  return (
    <div
      className={`relative flex items-center justify-center select-none ${sizeClassName}`}
    >
      <svg
        viewBox="0 0 220 205"
        className={`w-full h-full overflow-visible ${wrapperAnim}`}
        aria-hidden="true"
      >
        <defs>
          <linearGradient
            id={`redMain-${uid}`}
            x1="15%"
            y1="0%"
            x2="85%"
            y2="100%"
          >
            <stop offset="0%" stopColor="#FF7A7E" />
            <stop offset="48%" stopColor="#E31E24" />
            <stop offset="100%" stopColor="#A91018" />
          </linearGradient>
          <linearGradient
            id={`redDark-${uid}`}
            x1="0%"
            y1="0%"
            x2="100%"
            y2="100%"
          >
            <stop offset="0%" stopColor="#E31E24" />
            <stop offset="100%" stopColor="#8E0B12" />
          </linearGradient>
          <linearGradient
            id={`white3D-${uid}`}
            x1="20%"
            y1="0%"
            x2="80%"
            y2="100%"
          >
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="65%" stopColor="#F0F3F7" />
            <stop offset="100%" stopColor="#CFD6E2" />
          </linearGradient>
          <linearGradient id={`visor-${uid}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#1A2232" />
            <stop offset="100%" stopColor="#0B1018" />
          </linearGradient>
          <linearGradient id={`goldCoin-${uid}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFF08A" />
            <stop offset="48%" stopColor="#F5B700" />
            <stop offset="100%" stopColor="#D48800" />
          </linearGradient>
        </defs>

        {/* Floor Shadow */}
        <ellipse
          cx="110"
          cy="192"
          rx="36"
          ry="6"
          fill="currentColor"
          className="text-black/10 dark:text-black/35"
        />

        {/* Lower Egg Torso + Red T-Shaped Chest Bib */}
        <g>
          <path
            d="M 74 134 C 74 167, 90 185, 110 185 C 130 185, 146 167, 146 134 C 146 120, 132 112, 110 112 C 88 112, 74 120, 74 134 Z"
            fill={`url(#white3D-${uid})`}
          />
          <path
            d="M 72 132 C 72 116, 88 110, 110 110 C 132 110, 148 116, 148 132 C 148 143, 135 146, 121 146 L 118 164 C 117 171, 103 171, 102 164 L 99 146 C 85 146, 72 143, 72 132 Z"
            fill={`url(#redMain-${uid})`}
          />
          <circle
            cx="110"
            cy="129"
            r="8.5"
            fill={isAngry ? '#FF8A65' : '#72F2FF'}
          />
          <circle cx="107.5" cy="126.5" r="2.5" fill="#FFFFFF" opacity="0.85" />
        </g>

        {/* Neck Joint */}
        <rect
          x="96"
          y="102"
          width="28"
          height="12"
          rx="6"
          fill={`url(#redDark-${uid})`}
        />

        {/* Head & Antennas */}
        <g>
          <ellipse
            cx="47"
            cy="41"
            rx="5.5"
            ry="16"
            transform="rotate(-22 47 41)"
            fill={`url(#redMain-${uid})`}
          />
          <ellipse cx="53" cy="71" rx="11" ry="15" fill={`url(#redMain-${uid})`} />
          <ellipse
            cx="173"
            cy="41"
            rx="5.5"
            ry="16"
            transform="rotate(22 173 41)"
            fill={`url(#redMain-${uid})`}
          />
          <ellipse cx="167" cy="71" rx="11" ry="15" fill={`url(#redMain-${uid})`} />

          <rect
            x="54"
            y="32"
            width="112"
            height="76"
            rx="31"
            fill={`url(#white3D-${uid})`}
            stroke="#E2E7EF"
            strokeWidth="1"
          />
          <rect
            x="67"
            y="44"
            width="86"
            height="52"
            rx="17"
            fill={`url(#visor-${uid})`}
            stroke="#C5CEDC"
            strokeWidth="1.4"
          />
          {/* Corner Brackets */}
          <path
            d="M 74 55 L 74 50 L 79 50 M 141 50 L 146 50 L 146 55 M 74 85 L 74 90 L 79 90 M 141 90 L 146 90 L 146 85"
            fill="none"
            stroke={isAngry ? '#FF6B70' : '#72F2FF'}
            strokeWidth="1.7"
            strokeLinecap="round"
            opacity="0.75"
          />

          {/* Eyes + Smile Expression */}
          {isAngry ? (
            <g>
              {/* Angry glowing furrowed eyes */}
              <path
                d="M 81 60 L 101 68 L 83 72 Z"
                fill="#FF5C61"
              />
              <path
                d="M 139 60 L 119 68 L 137 72 Z"
                fill="#FF5C61"
              />
              {/* Frown line */}
              <path
                d="M 98 83 Q 110 76 122 83"
                fill="none"
                stroke="#FF6B70"
                strokeWidth="3.4"
                strokeLinecap="round"
              />
            </g>
          ) : isSad ? (
            <g>
              {/* Sad droopy eyes */}
              <path
                d="M 83 68 Q 93 61 102 68"
                fill="none"
                stroke="#72F2FF"
                strokeWidth="4"
                strokeLinecap="round"
              />
              <path
                d="M 118 68 Q 127 61 137 68"
                fill="none"
                stroke="#72F2FF"
                strokeWidth="4"
                strokeLinecap="round"
              />
              <path
                d="M 101 82 Q 110 77 119 82"
                fill="none"
                stroke="#72F2FF"
                strokeWidth="3"
                strokeLinecap="round"
              />
            </g>
          ) : isHappyMood ? (
            <g>
              {/* Big beaming ^ ^ happy eyes + bright smile */}
              <path
                d="M 82 69 Q 92 55 102 69"
                fill="none"
                stroke="#72F2FF"
                strokeWidth="4.4"
                strokeLinecap="round"
              />
              <path
                d="M 118 69 Q 128 55 138 69"
                fill="none"
                stroke="#72F2FF"
                strokeWidth="4.4"
                strokeLinecap="round"
              />
              <path
                d="M 97 76 Q 110 87 123 76"
                fill="none"
                stroke="#72F2FF"
                strokeWidth="3.6"
                strokeLinecap="round"
              />
            </g>
          ) : (
            <g className="animate-robot-blink">
              <rect x="84" y="57" width="16" height="18" rx="8" fill="#72F2FF" />
              <circle cx="94" cy="63" r="2.2" fill="#FFFFFF" opacity="0.9" />
              <rect x="120" y="57" width="16" height="18" rx="8" fill="#72F2FF" />
              <circle cx="130" cy="63" r="2.2" fill="#FFFFFF" opacity="0.9" />
              <path
                d="M 102 80 Q 110 85 118 80"
                fill="none"
                stroke="#72F2FF"
                strokeWidth="2.8"
                strokeLinecap="round"
                opacity="0.85"
              />
            </g>
          )}
        </g>

        {/* Left Arm */}
        <g
          style={{
            transform: leftArmTransform,
            transformOrigin: '54px 124px',
          }}
          className="transition-transform duration-500 ios-spring"
        >
          <path
            d="M 62 120 C 46 113, 25 121, 25 131 C 25 141, 47 144, 61 136 Z"
            fill={`url(#white3D-${uid})`}
            stroke="#DCE2EC"
            strokeWidth="0.9"
          />
          <path
            d="M 65 117 C 56 115, 46 119, 45 128 C 44 136, 53 141, 63 138 C 69 136, 70 120, 65 117 Z"
            fill={`url(#redMain-${uid})`}
          />
        </g>

        {/* Right Arm */}
        <g
          style={{
            transform: rightArmTransform,
            transformOrigin: '166px 124px',
          }}
          className="transition-transform duration-500 ios-spring"
        >
          <path
            d="M 158 120 C 174 113, 195 121, 195 131 C 195 141, 173 144, 159 136 Z"
            fill={`url(#white3D-${uid})`}
            stroke="#DCE2EC"
            strokeWidth="0.9"
          />
          <path
            d="M 155 117 C 164 115, 174 119, 175 128 C 176 136, 167 141, 157 138 C 151 136, 150 120, 155 117 Z"
            fill={`url(#redMain-${uid})`}
          />
        </g>

        {/* Activity Props & Animated Overlays */}
        {isAngry && (
          <g>
            {/* Angry Steam Puffs */}
            <g className="animate-steam-rise">
              <circle cx="42" cy="24" r="6" fill="#FF6B70" opacity="0.85" />
              <circle cx="178" cy="22" r="5" fill="#FF6B70" opacity="0.85" />
            </g>
            {activity === 'clock_warning' ? (
              <g transform="translate(164, 118)">
                <circle cx="16" cy="16" r="15" fill="#FFFFFF" stroke="#E31E24" strokeWidth="3" />
                <path d="M 16 9 L 16 16 L 21 19" fill="none" stroke="#E31E24" strokeWidth="2.5" strokeLinecap="round" />
              </g>
            ) : (
              <g transform="translate(168, 18)">
                <circle cx="14" cy="14" r="13" fill="#E31E24" />
                <text x="14" y="19.5" textAnchor="middle" fill="#FFFFFF" fontSize="16" fontWeight="900">
                  !
                </text>
              </g>
            )}
          </g>
        )}

        {(isCoinToss || activity === 'saving_coin' || activity === 'coin_bounce') && (
          <g>
            {/* Tossing / Floating Gold Coins */}
            <g className="animate-coin-toss-1">
              <circle cx="165" cy="70" r="13" fill={`url(#goldCoin-${uid})`} stroke="#FFF4B8" strokeWidth="2" />
              <text x="165" y="74.5" textAnchor="middle" fill="#8A5200" fontSize="11" fontWeight="900">
                Rp
              </text>
            </g>
            <g className="animate-coin-toss-2">
              <circle cx="110" cy="36" r="15" fill={`url(#goldCoin-${uid})`} stroke="#FFF4B8" strokeWidth="2" />
              <text x="110" y="41" textAnchor="middle" fill="#8A5200" fontSize="12" fontWeight="900">
                Rp
              </text>
            </g>
            {isCoinToss && (
              <g className="animate-coin-toss-3">
                <circle cx="58" cy="68" r="12" fill={`url(#goldCoin-${uid})`} stroke="#FFF4B8" strokeWidth="2" />
                <text x="58" y="72.5" textAnchor="middle" fill="#8A5200" fontSize="10" fontWeight="900">
                  Rp
                </text>
              </g>
            )}
          </g>
        )}

        {(isCheering || isCoinToss) && (
          <g className="animate-sparkle-twinkle">
            <path d="M 32 38 L 36 28 L 40 38 L 50 42 L 40 46 L 36 56 L 32 46 L 22 42 Z" fill="#FFD54F" />
            <path d="M 184 32 L 187 24 L 190 32 L 198 35 L 190 38 L 187 46 L 184 38 L 176 35 Z" fill="#FF6B70" />
          </g>
        )}

        {(activity === 'checklist' || activity === 'writing_notes' || activity === 'worried_note') && (
          <g transform="translate(152, 114) rotate(8)">
            <rect x="0" y="0" width="34" height="44" rx="7" fill="#FFFFFF" stroke="#CFD6E2" strokeWidth="2" />
            <rect x="10" y="-4" width="14" height="7" rx="3" fill="#E31E24" />
            <line x1="7" y1="14" x2="27" y2="14" stroke={activity === 'checklist' ? '#168A62' : '#E31E24'} strokeWidth="2.6" strokeLinecap="round" />
            <line x1="7" y1="23" x2="27" y2="23" stroke="#94A3B8" strokeWidth="2.4" strokeLinecap="round" />
            <line x1="7" y1="32" x2="21" y2="32" stroke="#94A3B8" strokeWidth="2.4" strokeLinecap="round" />
          </g>
        )}

        {activity === 'calculating' && (
          <g transform="translate(156, 112)">
            <rect x="0" y="0" width="32" height="40" rx="7" fill="#1A2232" stroke="#72F2FF" strokeWidth="1.6" />
            <rect x="5" y="5" width="22" height="9" rx="2" fill="#72F2FF" opacity="0.85" />
            <circle cx="9" cy="21" r="2.3" fill="#FFFFFF" />
            <circle cx="16" cy="21" r="2.3" fill="#FFFFFF" />
            <circle cx="23" cy="21" r="2.3" fill="#FF6B70" />
            <circle cx="9" cy="30" r="2.3" fill="#FFFFFF" />
            <circle cx="16" cy="30" r="2.3" fill="#FFFFFF" />
            <circle cx="23" cy="30" r="2.3" fill="#FF6B70" />
          </g>
        )}

        {activity === 'waving' && (
          <path
            d="M 32 76 C 32 70, 41 68, 43 74 C 45 68, 54 70, 54 76 C 54 83, 43 90, 43 90 C 43 90, 32 83, 32 76 Z"
            fill="#E31E24"
            className="animate-mascot-float"
          />
        )}
      </svg>
    </div>
  );
};
