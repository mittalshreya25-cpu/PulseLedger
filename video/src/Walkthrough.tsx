import React from "react";
import { Sequence } from "remotion";
import { Scene1Intro } from "./scenes/Scene1Intro";
import { Scene2Overview } from "./scenes/Scene2Overview";
import { Scene3Ledger } from "./scenes/Scene3Ledger";
import { Scene4Plan } from "./scenes/Scene4Plan";
import { Scene5Coach } from "./scenes/Scene5Coach";
import { Scene6Outro } from "./scenes/Scene6Outro";

export const Walkthrough: React.FC = () => {
  return (
    <div style={{ flex: 1, width: "100%", height: "100%", background: "#020E0E" }}>
      {/* Scene 1: Introduction & Philosophy (0:00 - 0:30) */}
      <Sequence from={0} durationInFrames={30 * 30} name="Scene 1: Introduction & Brand">
        <Scene1Intro />
      </Sequence>

      {/* Scene 2: Overview & Autonomous SMS Ingestion (0:30 - 1:15) */}
      <Sequence from={30 * 30} durationInFrames={30 * 45} name="Scene 2: Overview Dashboard & SMS Sync">
        <Scene2Overview />
      </Sequence>

      {/* Scene 3: Audited Ledger & Rule Replay (1:15 - 2:00) */}
      <Sequence from={30 * 75} durationInFrames={30 * 45} name="Scene 3: Ledger Table 1 & Rules">
        <Scene3Ledger />
      </Sequence>

      {/* Scene 4: Monte Carlo 365-Day Trajectory (2:00 - 2:45) */}
      <Sequence from={30 * 120} durationInFrames={30 * 45} name="Scene 4: Monte Carlo 365-Day Plan">
        <Scene4Plan />
      </Sequence>

      {/* Scene 5: Guarded AI Financial Coach (2:45 - 3:15) */}
      <Sequence from={30 * 165} durationInFrames={30 * 30} name="Scene 5: Guarded Coach & SEBI Firewall">
        <Scene5Coach />
      </Sequence>

      {/* Scene 6: Mobile Showcase & Outro (3:15 - 3:30) */}
      <Sequence from={30 * 195} durationInFrames={30 * 15} name="Scene 6: Mobile Showcase & Outro">
        <Scene6Outro />
      </Sequence>
    </div>
  );
};

