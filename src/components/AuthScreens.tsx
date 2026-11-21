import React, { useEffect, useRef, useState } from 'react';
import { ArrowRight, CheckCircle2, Eye, EyeOff, Lock, User, Wallet } from 'lucide-react';

interface WelcomeScreenProps {
  onGetStarted: () => void;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({
  onGetStarted,
}) => {
  const [imgErr, setImgErr] = useState(false);
  const [exiting, setExiting] = useState(false);

  const handleGetStarted = () => {
    if (exiting) return;
    setExiting(true);
    window.setTimeout(() => {
      onGetStarted();
    }, 430);
  };

  return (
    <div className="min-h-[100dvh] w-full flex items-center justify-center overflow-hidden">
      <div className="w-full max-w-md min-h-[100dvh] sm:min-h-[760px] sm:my-6 sm:rounded-[36px] bg-white/95 dark:bg-[#191A20]/95 backdrop-blur-sm sm:border sm:border-[#EEEEF0] sm:dark:border-[#34353C] sm:shadow-[0_12px_40px_rgba(0,0,0,0.08)] flex flex-col justify-between overflow-hidden relative">
        {/* Step 1: Darkened Hero Image reveals first and dissolves cleanly into card */}
        <div
          className={`relative w-full h-[450px] sm:h-[470px] overflow-hidden ${
            exiting ? 'animate-welcome-exit-hero' : ''
          }`}
        >
          <div
            className="relative w-full h-full"
            style={{
              maskImage:
                'linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,1) 34%, rgba(0,0,0,0.92) 47%, rgba(0,0,0,0.74) 59%, rgba(0,0,0,0.48) 71%, rgba(0,0,0,0.22) 83%, rgba(0,0,0,0.06) 93%, rgba(0,0,0,0) 100%)',
              WebkitMaskImage:
                'linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,1) 34%, rgba(0,0,0,0.92) 47%, rgba(0,0,0,0.74) 59%, rgba(0,0,0,0.48) 71%, rgba(0,0,0,0.22) 83%, rgba(0,0,0,0.06) 93%, rgba(0,0,0,0) 100%)',
            }}
          >
            {!imgErr ? (
              <img
                src="/assets/aistudio/Financial_Goals_088abbc0.jpg"
                alt="KasMate Finance"
                referrerPolicy="no-referrer"
                onError={() => setImgErr(true)}
                className="w-full h-full object-cover brightness-[0.72] contrast-[1.06] saturate-[0.94] animate-welcome-image"
              />
            ) : (
              <div className="w-full h-full kas-gradient flex items-center justify-center animate-welcome-image">
                <Wallet className="w-20 h-20 text-white" />
              </div>
            )}

            {/* Subtle dark glaze for cohesive contrast */}
            <div className="pointer-events-none absolute inset-0 bg-black/22" />
          </div>
        </div>

        {/* Step 2..4: Welcome copy & Get Started button slide up cleanly and exit smoothly */}
        <div
          className={`-mt-14 px-7 pb-10 pt-2 flex flex-col items-center text-center relative z-10 ${
            exiting ? 'animate-welcome-exit-content' : ''
          }`}
        >
          <span
            className="text-[#E31E24] font-bold tracking-[2.4px] text-xs mb-2 animate-welcome-up"
            style={{ animationDelay: '240ms' }}
          >
            KASMATE
          </span>
          <h1
            className="text-[32px] font-extrabold text-[#171717] dark:text-[#F4F4F5] tracking-[-0.025em] leading-[1.12] animate-welcome-up"
            style={{ animationDelay: '340ms' }}
          >
            Welcome to{' '}
            <span className="text-[#E31E24]">KasMate</span>
          </h1>
          <p
            className="text-sm text-[#858585] dark:text-[#B3B3BA] mt-3 mb-8 max-w-[300px] leading-relaxed animate-welcome-up"
            style={{ animationDelay: '460ms' }}
          >
            Manage class funds transparently, effortlessly, and with peace of
            mind.
          </p>

          <div
            className="w-full animate-welcome-up"
            style={{ animationDelay: '580ms' }}
          >
            <button
              type="button"
              onClick={handleGetStarted}
              disabled={exiting}
              className="group w-full h-[54px] rounded-[16px] kas-gradient text-white font-extrabold text-[15px] tracking-wide shadow-[0_10px_24px_rgba(227,30,36,0.28)] hover:shadow-[0_14px_30px_rgba(227,30,36,0.36)] hover:brightness-105 active:scale-[0.95] ios-spring transition-[transform,box-shadow,filter] duration-200 flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Get Started</span>
              <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

type RobotMode = 'idle' | 'typingUser' | 'cover' | 'peek' | 'success';

function useSlowTypewriter(phrases: string[], loop = true): string {
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [charCount, setCharCount] = useState(0);
  const [deleting, setDeleting] = useState(false);

  const phrasesKey = phrases.join('|');
  const phrasesRef = useRef(phrases);
  phrasesRef.current = phrases;

  useEffect(() => {
    setPhraseIndex(0);
    setCharCount(0);
    setDeleting(false);
  }, [phrasesKey, loop]);

  useEffect(() => {
    const list = phrasesRef.current;
    const activePhrase = list[phraseIndex % list.length] ?? '';
    const delay = deleting ? 52 : 92;

    if (!deleting && charCount >= activePhrase.length) {
      if (!loop && phraseIndex >= list.length - 1) {
        return;
      }
      const t = window.setTimeout(() => setDeleting(true), 1750);
      return () => window.clearTimeout(t);
    }

    if (deleting && charCount <= 0) {
      const t = window.setTimeout(() => {
        setDeleting(false);
        setPhraseIndex((prev) => (prev + 1) % list.length);
      }, 360);
      return () => window.clearTimeout(t);
    }

    const t = window.setTimeout(() => {
      setCharCount((prev) => prev + (deleting ? -1 : 1));
    }, delay);

    return () => window.clearTimeout(t);
  }, [charCount, deleting, phraseIndex, phrasesKey, loop]);

  const current = phrases[phraseIndex % phrases.length] ?? '';
  return current.slice(0, charCount);
}

interface LoginRobotMascotProps {
  mode: RobotMode;
  phrases: string[];
  loopDialog: boolean;
  eyeShiftX: number;
}

const LoginRobotMascot: React.FC<LoginRobotMascotProps> = ({
  mode,
  phrases,
  loopDialog,
  eyeShiftX,
}) => {
  const typedText = useSlowTypewriter(phrases, loopDialog);

  const isCover = mode === 'cover';
  const isPeek = mode === 'peek';
  const isSuccess = mode === 'success';
  const isTypingUser = mode === 'typingUser';

  // Tapered flipper arms aligned cleanly over left eye (cx=93, cy=59) and right eye (cx=127, cy=59)
  const leftArmTranslate = isCover
    ? 'translate(48px, -64px)'
    : isPeek
    ? 'translate(49px, -62px)'
    : isSuccess
    ? 'translate(-4px, -16px)'
    : 'translate(0px, 0px)';

  const leftArmRotate = isCover
    ? 'rotate(38deg)'
    : isPeek
    ? 'rotate(36deg)'
    : isSuccess
    ? 'rotate(24deg)'
    : 'rotate(-8deg)';

  const rightArmTranslate = isCover
    ? 'translate(-48px, -64px)'
    : isPeek
    ? 'translate(2px, 2px)'
    : isSuccess
    ? 'translate(4px, -16px)'
    : 'translate(0px, 0px)';

  const rightArmRotate = isCover
    ? 'rotate(-38deg)'
    : isPeek
    ? 'rotate(12deg)'
    : isSuccess
    ? 'rotate(-24deg)'
    : 'rotate(8deg)';

  const headTransform = isCover
    ? 'translateY(3px) scale(0.99)'
    : isPeek
    ? 'translateY(1px) rotate(3deg)'
    : isSuccess
    ? 'translateY(-4px) scale(1.03)'
    : isTypingUser
    ? 'translateY(3px) rotate(-2deg)'
    : 'translateY(0px)';

  const eyeTx = isTypingUser ? eyeShiftX : isPeek ? 1.5 : 0;
  const eyeTy = isTypingUser ? 3 : 0;

  return (
    <div className="relative flex flex-col items-center justify-center pt-1 pb-1 select-none">
      {/* Subtle KasMate red ambient aura behind mascot */}
      <div
        className={`pointer-events-none absolute top-10 w-44 h-44 rounded-full blur-2xl transition-colors duration-500 ${
          isSuccess
            ? 'bg-[#168A62]/18 dark:bg-[#168A62]/24'
            : 'bg-[#E31E24]/11 dark:bg-[#E31E24]/18'
        }`}
      />

      {/* Slow Typewriter Speech Dialog Bubble */}
      <div className="relative z-20 -mb-1 self-start ml-3 sm:ml-6">
        <div className="min-h-[38px] min-w-[116px] max-w-[300px] px-4 py-2 rounded-[18px] rounded-bl-[6px] bg-white dark:bg-[#24252C] border border-[#EEEEF0] dark:border-[#34353C] shadow-[0_8px_24px_rgba(0,0,0,0.08)] dark:shadow-[0_8px_24px_rgba(0,0,0,0.4)] flex items-center">
          <span className="text-[13px] font-bold text-[#171717] dark:text-[#F4F4F5] tracking-tight truncate">
            {typedText}
          </span>
          <span
            aria-hidden="true"
            className="inline-block w-[2px] h-[14px] bg-[#E31E24] ml-0.5 rounded-full animate-pulse shrink-0"
          />
        </div>
      </div>

      {/* 3D-Styled KasMate Red Robot SVG (matching sticker proportions in KasMate Red) */}
      <div
        className={`relative z-10 w-[198px] h-[184px] ${
          isSuccess ? 'animate-mascot-excited' : 'animate-mascot-float'
        }`}
      >
        <svg
          viewBox="0 0 220 196"
          className="w-full h-full overflow-visible drop-shadow-[0_12px_20px_rgba(227,30,36,0.14)]"
          aria-label="KasMate Red Robot Mascot"
        >
          <defs>
            <linearGradient id="kasmateRedMain" x1="15%" y1="0%" x2="85%" y2="100%">
              <stop offset="0%" stopColor="#FF7A7E" />
              <stop offset="48%" stopColor="#E31E24" />
              <stop offset="100%" stopColor="#A91018" />
            </linearGradient>
            <linearGradient id="kasmateRedDark" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#E31E24" />
              <stop offset="100%" stopColor="#8E0B12" />
            </linearGradient>
            <linearGradient id="kasmateWhite3D" x1="20%" y1="0%" x2="80%" y2="100%">
              <stop offset="0%" stopColor="#FFFFFF" />
              <stop offset="65%" stopColor="#F0F3F7" />
              <stop offset="100%" stopColor="#CFD6E2" />
            </linearGradient>
            <linearGradient id="kasmateVisor" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#1A2232" />
              <stop offset="100%" stopColor="#0B1018" />
            </linearGradient>
            <radialGradient id="cyanEyeGlow" cx="45%" cy="35%" r="65%">
              <stop offset="0%" stopColor="#C8FCFF" />
              <stop offset="55%" stopColor="#72F2FF" />
              <stop offset="100%" stopColor="#35D7EE" />
            </radialGradient>
            <filter id="softCyanGlow" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="1.8" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Soft floor shadow */}
          <ellipse
            cx="110"
            cy="184"
            rx="38"
            ry="6.5"
            fill="currentColor"
            className="text-black/10 dark:text-black/35"
          />

          {/* 3D Egg Torso + Red T-Shaped Chest Bib */}
          <g>
            {/* White lower torso */}
            <path
              d="M 74 126 C 74 159, 90 177, 110 177 C 130 177, 146 159, 146 126 C 146 112, 132 104, 110 104 C 88 104, 74 112, 74 126 Z"
              fill="url(#kasmateWhite3D)"
            />
            {/* Subtle underside shadow */}
            <path
              d="M 80 154 C 88 171, 100 176, 110 176 C 120 176, 132 171, 140 154 C 132 164, 121 168, 110 168 C 99 168, 88 164, 80 154 Z"
              fill="#B9C2D0"
              opacity="0.45"
            />
            {/* Red T-shaped vest matching sticker */}
            <path
              d="M 72 124 C 72 108, 88 102, 110 102 C 132 102, 148 108, 148 124 C 148 135, 135 138, 121 138 L 118 156 C 117 163, 103 163, 102 156 L 99 138 C 85 138, 72 135, 72 124 Z"
              fill="url(#kasmateRedMain)"
            />
            {/* Glowing cyan chest core badge (matching sticker) */}
            <circle cx="110" cy="121" r="10.5" fill="#A91018" opacity="0.45" />
            <circle
              cx="110"
              cy="121"
              r="8.2"
              fill="url(#cyanEyeGlow)"
              filter="url(#softCyanGlow)"
            />
            <circle cx="107.5" cy="118.5" r="2.6" fill="#FFFFFF" opacity="0.85" />
          </g>

          {/* Neck joint */}
          <rect
            x="96"
            y="94"
            width="28"
            height="12"
            rx="6"
            fill="url(#kasmateRedDark)"
          />

          {/* Rounded 3D Helmet Head & Antennas */}
          <g
            style={{
              transform: headTransform,
              transformOrigin: '110px 66px',
            }}
            className="transition-transform duration-[420ms] ios-spring"
          >
            {/* Left antenna fin + ear pod */}
            <g
              style={{
                transform: isSuccess ? 'rotate(-10deg)' : 'rotate(0deg)',
                transformOrigin: '56px 56px',
              }}
              className="transition-transform duration-300 ios-spring"
            >
              <ellipse
                cx="47"
                cy="33"
                rx="5.5"
                ry="16"
                transform="rotate(-22 47 33)"
                fill="url(#kasmateRedMain)"
              />
              <ellipse cx="45" cy="28" rx="1.8" ry="6" transform="rotate(-22 45 28)" fill="#FFB3B6" opacity="0.55" />
              <ellipse cx="53" cy="63" rx="11" ry="15" fill="url(#kasmateRedMain)" />
              <ellipse cx="48" cy="63" rx="5.5" ry="9.5" fill="url(#kasmateRedDark)" opacity="0.5" />
            </g>

            {/* Right antenna fin + ear pod */}
            <g
              style={{
                transform: isSuccess ? 'rotate(10deg)' : 'rotate(0deg)',
                transformOrigin: '164px 56px',
              }}
              className="transition-transform duration-300 ios-spring"
            >
              <ellipse
                cx="173"
                cy="33"
                rx="5.5"
                ry="16"
                transform="rotate(22 173 33)"
                fill="url(#kasmateRedMain)"
              />
              <ellipse cx="175" cy="28" rx="1.8" ry="6" transform="rotate(22 175 28)" fill="#FFB3B6" opacity="0.55" />
              <ellipse cx="167" cy="63" rx="11" ry="15" fill="url(#kasmateRedMain)" />
              <ellipse cx="172" cy="63" rx="5.5" ry="9.5" fill="url(#kasmateRedDark)" opacity="0.5" />
            </g>

            {/* Outer glossy white TV-style helmet */}
            <rect
              x="54"
              y="24"
              width="112"
              height="76"
              rx="31"
              fill="url(#kasmateWhite3D)"
              stroke="#E2E7EF"
              strokeWidth="1"
            />
            {/* Soft top sheen highlight on helmet */}
            <path
              d="M 78 29 C 96 26, 124 26, 142 29"
              fill="none"
              stroke="#FFFFFF"
              strokeWidth="3.5"
              strokeLinecap="round"
              opacity="0.9"
            />

            {/* Inset Dark Visor Screen */}
            <rect
              x="67"
              y="36"
              width="86"
              height="52"
              rx="17"
              fill="url(#kasmateVisor)"
              stroke="#C5CEDC"
              strokeWidth="1.4"
            />
            {/* Crisp cyan corner brackets matching sticker */}
            <path
              d="M 74 47 L 74 42 L 79 42 M 141 42 L 146 42 L 146 47 M 74 77 L 74 82 L 79 82 M 141 82 L 146 82 L 146 77"
              fill="none"
              stroke="#72F2FF"
              strokeWidth="1.7"
              strokeLinecap="round"
              opacity="0.72"
            />

            {/* Dynamic Glowing Cyan Eyes */}
            <g
              style={{
                transform: `translate(${eyeTx}px, ${eyeTy}px)`,
              }}
              className="transition-transform duration-200 ease-out"
            >
              {isSuccess ? (
                <g filter="url(#softCyanGlow)">
                  {/* Happy ^ ^ eyes matching top-right sticker */}
                  <path
                    d="M 83 64 Q 93 51 103 64"
                    fill="none"
                    stroke="#72F2FF"
                    strokeWidth="4.4"
                    strokeLinecap="round"
                  />
                  <path
                    d="M 117 64 Q 127 51 137 64"
                    fill="none"
                    stroke="#72F2FF"
                    strokeWidth="4.4"
                    strokeLinecap="round"
                  />
                </g>
              ) : isCover ? (
                <g filter="url(#softCyanGlow)">
                  {/* Closed shy eyes behind covered paws */}
                  <path
                    d="M 85 62 Q 93 67 101 62"
                    fill="none"
                    stroke="#72F2FF"
                    strokeWidth="3.8"
                    strokeLinecap="round"
                  />
                  <path
                    d="M 119 62 Q 127 67 135 62"
                    fill="none"
                    stroke="#72F2FF"
                    strokeWidth="3.8"
                    strokeLinecap="round"
                  />
                </g>
              ) : isPeek ? (
                <g filter="url(#softCyanGlow)">
                  {/* Left eye covered by left paw, Right eye peeking brightly */}
                  <rect
                    x="119"
                    y="51"
                    width="17"
                    height="19"
                    rx="8.5"
                    fill="url(#cyanEyeGlow)"
                  />
                  <circle cx="129.5" cy="57" r="2.3" fill="#FFFFFF" opacity="0.9" />
                </g>
              ) : (
                <g className="animate-robot-blink" filter="url(#softCyanGlow)">
                  {/* Big glowing cyan rounded pill eyes matching sticker */}
                  <rect
                    x="84"
                    y="51"
                    width="17"
                    height="19"
                    rx="8.5"
                    fill="url(#cyanEyeGlow)"
                  />
                  <circle cx="94" cy="57" r="2.2" fill="#FFFFFF" opacity="0.85" />
                  <rect
                    x="119"
                    y="51"
                    width="17"
                    height="19"
                    rx="8.5"
                    fill="url(#cyanEyeGlow)"
                  />
                  <circle cx="129" cy="57" r="2.2" fill="#FFFFFF" opacity="0.85" />
                </g>
              )}
            </g>
          </g>

          {/* Left Tapered Flipper Arm (red shoulder + white rounded flipper matching sticker) */}
          <g
            style={{ transform: leftArmTranslate }}
            className="transition-transform duration-[460ms] ios-spring"
          >
            <g
              style={{
                transform: leftArmRotate,
                transformOrigin: '54px 116px',
              }}
              className="transition-transform duration-[460ms] ios-spring"
            >
              {/* Tapered white arm */}
              <path
                d="M 62 112 C 46 105, 25 113, 25 123 C 25 133, 47 136, 61 128 Z"
                fill="url(#kasmateWhite3D)"
                stroke="#DCE2EC"
                strokeWidth="0.9"
              />
              {/* Red shoulder sleeve */}
              <path
                d="M 65 109 C 56 107, 46 111, 45 120 C 44 128, 53 133, 63 130 C 69 128, 70 112, 65 109 Z"
                fill="url(#kasmateRedMain)"
              />
            </g>
          </g>

          {/* Right Tapered Flipper Arm (red shoulder + white rounded flipper matching sticker) */}
          <g
            style={{ transform: rightArmTranslate }}
            className="transition-transform duration-[460ms] ios-spring"
          >
            <g
              style={{
                transform: rightArmRotate,
                transformOrigin: '166px 116px',
              }}
              className="transition-transform duration-[460ms] ios-spring"
            >
              {/* Tapered white arm */}
              <path
                d="M 158 112 C 174 105, 195 113, 195 123 C 195 133, 173 136, 159 128 Z"
                fill="url(#kasmateWhite3D)"
                stroke="#DCE2EC"
                strokeWidth="0.9"
              />
              {/* Red shoulder sleeve */}
              <path
                d="M 155 109 C 164 107, 174 111, 175 120 C 176 128, 167 133, 157 130 C 151 128, 150 112, 155 109 Z"
                fill="url(#kasmateRedMain)"
              />
            </g>
          </g>
        </svg>
      </div>
    </div>
  );
};

function getTimeGreeting(): string {
  const hour = new Date().getHours();
  if (hour >= 1 && hour < 11) {
    return 'Good morning';
  }
  if (hour >= 11 && hour < 15) {
    return 'Good afternoon';
  }
  return 'Good evening';
}

interface LoginScreenProps {
  onLogin: (credentials: { name: string; nis: string; password: string }) => Promise<{ name: string }>;
  onAuthenticated: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin, onAuthenticated }) => {
  const [username, setUsername] = useState('');
  const [nis, setNis] = useState('');
  const [debouncedUser, setDebouncedUser] = useState('');
  const [password, setPassword] = useState('');
  const [usernameFocused, setUsernameFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [peeking, setPeeking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loginSuccess, setLoginSuccess] = useState(false);
  const [loggedUser, setLoggedUser] = useState('');
  const redirectTimerRef = useRef<number | null>(null);

  useEffect(() => {
    const t = window.setTimeout(() => {
      const cleaned = username.trim();
      setDebouncedUser(
        cleaned ? cleaned.charAt(0).toUpperCase() + cleaned.slice(1) : ''
      );
    }, 340);
    return () => window.clearTimeout(t);
  }, [username]);

  useEffect(() => {
    return () => {
      if (redirectTimerRef.current !== null) {
        window.clearTimeout(redirectTimerRef.current);
      }
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (loginSuccess || isSubmitting) return;
    if (!username.trim() || !password) {
      setError('Student name and password are required.');
      return;
    }
    setError(null);
    setIsSubmitting(true);
    try {
      const student = await onLogin({
        name: username.trim(),
        nis: nis.trim(),
        password,
      });
      const displayUser = student.name || username.trim();
      setLoggedUser(displayUser);
      setLoginSuccess(true);
      redirectTimerRef.current = window.setTimeout(onAuthenticated, 900);
    } catch (loginError) {
      setError(
        loginError instanceof Error
          ? loginError.message
          : 'Sign-in failed. Please try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const timeGreeting = getTimeGreeting();
  const passwordActive = passwordFocused || password.length > 0;
  const robotMode: RobotMode = loginSuccess
    ? 'success'
    : passwordActive
    ? peeking
      ? 'peek'
      : 'cover'
    : usernameFocused
    ? 'typingUser'
    : 'idle';

  const dialogPhrases = (() => {
    if (loginSuccess) {
      return [`${timeGreeting}, ${loggedUser}!`];
    }
    if (error) {
      return ['Oops, check again!', 'Fill both fields please'];
    }
    if (isSubmitting) {
      return ['Checking your account…', 'Connecting to your class'];
    }
    if (robotMode === 'cover') {
      return ["I won't look!", 'Eyes closed tight...'];
    }
    if (robotMode === 'peek') {
      return ['Ooh, peeking 👀', 'Checking carefully!'];
    }
    if (debouncedUser) {
      return [`${timeGreeting}, ${debouncedUser}!`, 'Ready for KasMate?'];
    }
    if (robotMode === 'typingUser') {
      return [`${timeGreeting}!`, "What's your username?"];
    }
    return [`${timeGreeting}! Welcome`, 'Ready for KasMate?'];
  })();

  const eyeShiftX = Math.max(-6, Math.min(6, (username.length - 5) * 0.9));

  return (
    <div className="min-h-[100dvh] w-full flex items-center justify-center overflow-hidden animate-auth-enter">
      <div className="w-full max-w-md min-h-[100dvh] sm:min-h-[760px] sm:my-6 sm:rounded-[36px] bg-white/90 dark:bg-[#191A20]/90 backdrop-blur-sm sm:border sm:border-[#EEEEF0] sm:dark:border-[#34353C] sm:shadow-[0_12px_40px_rgba(0,0,0,0.08)] px-7 pt-10 pb-[calc(2.5rem+env(safe-area-inset-bottom,0px))] flex flex-col justify-between relative overflow-hidden">
        {/* Clean KasMate Title Header (no dot, no subtitle, no logo box) */}
        <div className="flex flex-col items-center text-center pt-3">
          <h1 className="text-[32px] font-extrabold tracking-tight text-[#171717] dark:text-[#F4F4F5]">
            Kas<span className="text-[#E31E24]">Mate</span>
          </h1>
        </div>

        {/* Center Interactive Red Robot Mascot + Typewriter Speech Dialog */}
        <div className="my-2">
          <LoginRobotMascot
            mode={robotMode}
            phrases={dialogPhrases}
            loopDialog={!loginSuccess}
            eyeShiftX={eyeShiftX}
          />
        </div>

        {/* Login Form OR Smooth Login Successful State */}
        <div className="w-full">
          {loginSuccess ? (
            <div className="w-full rounded-[24px] bg-[#168A62]/10 dark:bg-[#168A62]/15 border border-[#168A62]/25 p-6 text-center flex flex-col items-center gap-2.5 animate-success-pop">
              <div className="w-12 h-12 rounded-full bg-[#168A62] text-white flex items-center justify-center shadow-[0_8px_20px_rgba(22,138,98,0.28)]">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h2 className="text-[20px] font-extrabold text-[#171717] dark:text-[#F4F4F5] tracking-tight">
                Login Successful!
              </h2>
              <p className="text-sm text-[#858585] dark:text-[#B3B3BA]">
                {timeGreeting},{' '}
                <span className="font-bold text-[#171717] dark:text-[#F4F4F5]">
                  {loggedUser}
                </span>
                ! Opening your dashboard…
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="w-full flex flex-col gap-3">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="student-name" className="pl-1 text-xs font-semibold text-[#55555C] dark:text-[#C8C8D0]">
                  Student name <span aria-hidden="true">*</span>
                </label>
              <div className="relative">
                <User
                  className={`w-[18px] h-[18px] absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none transition-colors duration-200 ${
                    usernameFocused
                      ? 'text-[#E31E24]'
                      : 'text-[#858585] dark:text-[#B3B3BA]'
                  }`}
                />
                <input
                  id="student-name"
                  name="name"
                  type="text"
                  autoComplete="name"
                  autoCapitalize="words"
                  spellCheck={false}
                  maxLength={100}
                  required
                  value={username}
                  onFocus={() => setUsernameFocused(true)}
                  onBlur={() => setUsernameFocused(false)}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    if (error) setError(null);
                  }}
                  placeholder="Your full name"
                  aria-invalid={Boolean(error)}
                  aria-describedby={error ? 'student-login-error' : undefined}
                  className="w-full h-[54px] pl-11 pr-4 rounded-[18px] border border-[#EEEEF0] dark:border-[#34353C] bg-[#F7F8FA] dark:bg-[#24252C] focus:bg-white dark:focus:bg-[#191A20] text-[#171717] dark:text-[#F4F4F5] placeholder:text-[#858585] dark:placeholder:text-[#B3B3BA] text-sm font-medium focus:outline-none focus:border-[#E31E24] focus:ring-4 focus:ring-[#E31E24]/10 transition-all duration-200"
                />
              </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="student-nis" className="pl-1 text-xs font-semibold text-[#55555C] dark:text-[#C8C8D0]">
                  NIS <span className="font-normal text-[#858585] dark:text-[#B3B3BA]">(optional)</span>
                </label>
                <input
                  id="student-nis"
                  name="nis"
                  type="text"
                  inputMode="numeric"
                  autoComplete="off"
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  maxLength={30}
                  value={nis}
                  onChange={(e) => {
                    setNis(e.target.value);
                    if (error) setError(null);
                  }}
                  placeholder="Enter NIS if names are duplicated"
                  aria-invalid={Boolean(error)}
                  aria-describedby={error ? 'student-login-error' : undefined}
                  className="w-full h-[54px] px-4 rounded-[18px] border border-[#EEEEF0] dark:border-[#34353C] bg-[#F7F8FA] dark:bg-[#24252C] focus:bg-white dark:focus:bg-[#191A20] text-[#171717] dark:text-[#F4F4F5] placeholder:text-[#858585] dark:placeholder:text-[#B3B3BA] text-sm font-medium focus:outline-none focus:border-[#E31E24] focus:ring-4 focus:ring-[#E31E24]/10 transition-all duration-200"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="student-password" className="pl-1 text-xs font-semibold text-[#55555C] dark:text-[#C8C8D0]">
                  Password <span aria-hidden="true">*</span>
                </label>
              <div className="relative">
                <Lock
                  className={`w-[18px] h-[18px] absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none transition-colors duration-200 ${
                    passwordFocused
                      ? 'text-[#E31E24]'
                      : 'text-[#858585] dark:text-[#B3B3BA]'
                  }`}
                />
                <input
                  id="student-password"
                  name="password"
                  type={peeking ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={password}
                  onFocus={() => setPasswordFocused(true)}
                  onBlur={() => setPasswordFocused(false)}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (error) setError(null);
                  }}
                  placeholder="Enter your student password"
                  aria-invalid={Boolean(error)}
                  aria-describedby={error ? 'student-login-error' : undefined}
                  className="w-full h-[54px] pl-11 pr-12 rounded-[18px] border border-[#EEEEF0] dark:border-[#34353C] bg-[#F7F8FA] dark:bg-[#24252C] focus:bg-white dark:focus:bg-[#191A20] text-[#171717] dark:text-[#F4F4F5] placeholder:text-[#858585] dark:placeholder:text-[#B3B3BA] text-sm font-medium focus:outline-none focus:border-[#E31E24] focus:ring-4 focus:ring-[#E31E24]/10 transition-all duration-200"
                />
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => setPeeking((v) => !v)}
                  aria-pressed={peeking}
                  aria-label={peeking ? 'Hide password' : 'Show password'}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 min-w-[40px] min-h-[40px] rounded-full flex items-center justify-center text-[#858585] dark:text-[#B3B3BA] hover:text-[#E31E24] active:scale-90 ios-spring transition-all duration-150 cursor-pointer"
                >
                  {peeking ? (
                    <Eye className="w-[18px] h-[18px] text-[#E31E24]" />
                  ) : (
                    <EyeOff className="w-[18px] h-[18px]" />
                  )}
                </button>
              </div>
              </div>

              {error && (
                <p id="student-login-error" role="alert" aria-live="polite" className="text-xs font-semibold text-[#E31E24] text-center pt-0.5">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="mt-1.5 w-full h-[54px] rounded-[18px] kas-gradient text-white font-extrabold text-[15px] tracking-wide shadow-[0_10px_24px_rgba(227,30,36,0.26)] hover:shadow-[0_14px_28px_rgba(227,30,36,0.34)] hover:brightness-105 active:scale-[0.96] disabled:opacity-60 disabled:cursor-wait ios-spring transition-[transform,box-shadow,filter] duration-200 cursor-pointer"
              >
                {isSubmitting ? 'Connecting…' : 'Sign In'}
              </button>

              <p className="text-center text-xs text-[#858585] dark:text-[#B3B3BA] pt-2">
                Use the student name and password provided by your school. Add NIS if another student has the same name.
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
