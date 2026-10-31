import React from "react";
import { Composition } from "remotion";
import { Walkthrough } from "./Walkthrough";

export const Root: React.FC = () => {
  return (
    <>
      <Composition
        id="PulseLedgerWalkthrough"
        component={Walkthrough}
        durationInFrames={30 * 210} // 3 minutes 30 seconds = 6,300 frames at 30fps
        fps={30}
        width={1920}
        height={1080}
      />
    </>
  );
};

