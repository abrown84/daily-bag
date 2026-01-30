import React from "react";
import {
  useCurrentFrame,
  useVideoConfig,
  spring,
  interpolate,
  Img,
  staticFile,
  Sequence,
  Easing,
} from "remotion";

// Floating coin component
const FloatingCoin: React.FC<{
  delay: number;
  x: number;
  y: number;
  size: number;
}> = ({ delay, x, y, size }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const entrance = spring({
    frame: frame - delay,
    fps,
    config: { damping: 12, stiffness: 100 },
  });

  const float = Math.sin((frame - delay) / 10) * 5;
  const rotate = interpolate(frame - delay, [0, 60], [0, 360], {
    extrapolateRight: "extend",
  });

  const scale = interpolate(entrance, [0, 1], [0, 1]);
  const opacity = interpolate(entrance, [0, 0.5], [0, 1], {
    extrapolateRight: "clamp",
  });

  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y + float,
        width: size,
        height: size,
        borderRadius: "50%",
        background: "linear-gradient(135deg, #FFD700 0%, #FFA500 50%, #FFD700 100%)",
        boxShadow: "0 4px 15px rgba(255, 215, 0, 0.5), inset 0 -3px 8px rgba(0,0,0,0.2)",
        transform: `scale(${scale}) rotateY(${rotate}deg)`,
        opacity,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: size * 0.5,
        fontWeight: "bold",
        color: "#B8860B",
        textShadow: "1px 1px 2px rgba(255,255,255,0.5)",
      }}
    >
      $
    </div>
  );
};

// Particle sparkle effect
const Sparkle: React.FC<{ delay: number; x: number; y: number }> = ({
  delay,
  x,
  y,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const progress = spring({
    frame: frame - delay,
    fps,
    config: { damping: 20, stiffness: 150 },
  });

  const scale = interpolate(progress, [0, 0.5, 1], [0, 1.5, 0], {
    extrapolateRight: "clamp",
  });
  const opacity = interpolate(progress, [0, 0.3, 1], [0, 1, 0], {
    extrapolateRight: "clamp",
  });

  if (frame < delay) return null;

  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        width: 20,
        height: 20,
        transform: `scale(${scale}) rotate(45deg)`,
        opacity,
      }}
    >
      <div
        style={{
          width: "100%",
          height: "100%",
          background: "linear-gradient(135deg, #FFD700, #FFFFFF)",
          clipPath:
            "polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)",
        }}
      />
    </div>
  );
};

export const DailyBagIntro: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();

  // Background gradient animation
  const bgHue = interpolate(frame, [0, 150], [220, 240], {
    extrapolateRight: "clamp",
  });

  // Logo entrance animation
  const logoEntrance = spring({
    frame,
    fps,
    config: { damping: 12, stiffness: 80 },
  });

  const logoScale = interpolate(logoEntrance, [0, 1], [0.3, 1]);
  const logoY = interpolate(logoEntrance, [0, 1], [100, 0], {
    extrapolateRight: "clamp",
  });

  // Logo subtle bounce after entrance
  const logoBounce = spring({
    frame: frame - 30,
    fps,
    config: { damping: 8, stiffness: 200 },
  });
  const bounceScale = interpolate(logoBounce, [0, 1], [1, 1.05]);

  // Text animations
  const textDelay = 40;
  const titleEntrance = spring({
    frame: frame - textDelay,
    fps,
    config: { damping: 15, stiffness: 100 },
  });

  const titleOpacity = interpolate(titleEntrance, [0, 1], [0, 1], {
    extrapolateRight: "clamp",
  });
  const titleY = interpolate(titleEntrance, [0, 1], [30, 0], {
    extrapolateRight: "clamp",
  });

  // Tagline
  const taglineDelay = 60;
  const taglineEntrance = spring({
    frame: frame - taglineDelay,
    fps,
    config: { damping: 20, stiffness: 100 },
  });

  const taglineOpacity = interpolate(taglineEntrance, [0, 1], [0, 1], {
    extrapolateRight: "clamp",
  });

  // Coins positions
  const coins = [
    { delay: 20, x: width * 0.15, y: height * 0.25, size: 50 },
    { delay: 25, x: width * 0.8, y: height * 0.2, size: 40 },
    { delay: 30, x: width * 0.1, y: height * 0.6, size: 35 },
    { delay: 35, x: width * 0.85, y: height * 0.55, size: 45 },
    { delay: 40, x: width * 0.2, y: height * 0.8, size: 30 },
    { delay: 45, x: width * 0.75, y: height * 0.75, size: 38 },
  ];

  // Sparkles positions
  const sparkles = [
    { delay: 15, x: width * 0.45, y: height * 0.25 },
    { delay: 25, x: width * 0.55, y: height * 0.3 },
    { delay: 35, x: width * 0.4, y: height * 0.35 },
    { delay: 45, x: width * 0.6, y: height * 0.28 },
    { delay: 55, x: width * 0.5, y: height * 0.22 },
  ];

  // Exit animation (last 30 frames)
  const exitStart = 120;
  const exitProgress = interpolate(frame, [exitStart, 150], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.inOut(Easing.quad),
  });

  const exitScale = interpolate(exitProgress, [0, 1], [1, 1.2]);
  const exitOpacity = interpolate(exitProgress, [0, 1], [1, 0]);

  return (
    <div
      style={{
        flex: 1,
        width: "100%",
        height: "100%",
        background: `linear-gradient(135deg,
          hsl(${bgHue}, 60%, 15%) 0%,
          hsl(${bgHue + 20}, 50%, 25%) 50%,
          hsl(${bgHue}, 45%, 20%) 100%)`,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        opacity: exitOpacity,
        transform: `scale(${exitScale})`,
      }}
    >
      {/* Animated background circles */}
      <div
        style={{
          position: "absolute",
          width: 600,
          height: 600,
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(99, 102, 241, 0.15) 0%, transparent 70%)",
          transform: `scale(${1 + Math.sin(frame / 30) * 0.1})`,
        }}
      />

      {/* Floating coins */}
      {coins.map((coin, i) => (
        <FloatingCoin key={i} {...coin} />
      ))}

      {/* Sparkles */}
      {sparkles.map((sparkle, i) => (
        <Sparkle key={i} {...sparkle} />
      ))}

      {/* Logo */}
      <div
        style={{
          transform: `translateY(${logoY}px) scale(${logoScale * bounceScale})`,
          marginBottom: 20,
        }}
      >
        <Img
          src={staticFile("dailybag-transparent.png")}
          style={{
            width: 280,
            height: "auto",
            filter: "drop-shadow(0 20px 40px rgba(0, 0, 0, 0.4))",
          }}
        />
      </div>

      {/* App Name */}
      <div
        style={{
          opacity: titleOpacity,
          transform: `translateY(${titleY}px)`,
        }}
      >
        <h1
          style={{
            fontSize: 72,
            fontWeight: 800,
            color: "white",
            margin: 0,
            textShadow: "0 4px 20px rgba(0, 0, 0, 0.5)",
            fontFamily:
              '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            letterSpacing: -2,
          }}
        >
          <span style={{ color: "#FFD700" }}>Daily</span>
          <span style={{ color: "#FFFFFF" }}>Bag</span>
        </h1>
      </div>

      {/* Tagline */}
      <div
        style={{
          opacity: taglineOpacity,
          marginTop: 16,
        }}
      >
        <p
          style={{
            fontSize: 28,
            color: "rgba(255, 255, 255, 0.85)",
            margin: 0,
            fontFamily:
              '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            fontWeight: 500,
            letterSpacing: 1,
          }}
        >
          Make Every Chore Count
        </p>
      </div>

      {/* Decorative line */}
      <Sequence from={70} durationInFrames={80}>
        <div
          style={{
            position: "absolute",
            bottom: 80,
            width: interpolate(
              spring({ frame: frame - 70, fps, config: { damping: 20 } }),
              [0, 1],
              [0, 200]
            ),
            height: 3,
            background: "linear-gradient(90deg, transparent, #FFD700, transparent)",
            borderRadius: 2,
          }}
        />
      </Sequence>
    </div>
  );
};
