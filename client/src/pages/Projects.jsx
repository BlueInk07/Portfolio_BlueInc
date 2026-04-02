import { Suspense, lazy } from "react";
import "./Projects.css";

const MagicBento = lazy(() => import("../components/MagicBento"));
function Projects() {
  return (
    <div 
      className="projects-container" 
      style={{ 
        position: "relative", 
        zIndex: 999, 
        paddingTop: "40px"  /* was 120px — reduced */
      }}
    > 
      <h1 
        className="projects-title"  /* ← add the class so CSS gradient applies */
        style={{
          position: "relative",
          zIndex: 1000,
          margin: "0 0 1rem 5%",   /* was 2rem — less gap below */
          padding: "0",            /* remove the blue box padding */
          display: "inline-block",
          /* NO color, NO backgroundColor — let Projects.css gradient do its job */
        }}
      >
        PROJECTS
      </h1>
      
      <Suspense fallback={null}>
        <MagicBento
          textAutoHide={true}
          enableStars
          enableSpotlight
          enableBorderGlow={true}
          enableTilt={false}
          enableMagnetism={false}
          clickEffect
          spotlightRadius={400}
          particleCount={12}
          glowColor="132, 0, 255"
          disableAnimations={false}
        />
      </Suspense>
    </div>
  );
}

export default Projects;
