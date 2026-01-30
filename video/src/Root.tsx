import React from "react";
import { Composition } from "remotion";
import { DailyBagIntro } from "./DailyBagIntro";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      {/* Main intro video - 5 seconds at 30fps */}
      <Composition
        id="DailyBagIntro"
        component={DailyBagIntro}
        durationInFrames={150}
        fps={30}
        width={1080}
        height={1080}
      />

      {/* 16:9 variant for YouTube/web */}
      <Composition
        id="DailyBagIntro-16x9"
        component={DailyBagIntro}
        durationInFrames={150}
        fps={30}
        width={1920}
        height={1080}
      />

      {/* 9:16 variant for TikTok/Reels */}
      <Composition
        id="DailyBagIntro-9x16"
        component={DailyBagIntro}
        durationInFrames={150}
        fps={30}
        width={1080}
        height={1920}
      />
    </>
  );
};
