'use client'
import { Warp } from "@paper-design/shaders-react"

export default function WarpShaderHero() {
  return (
    <div className="absolute inset-0 w-full h-full">
      <Warp
        style={{ height: "100%", width: "100%" }}
        proportion={0.6}
        softness={0.8}
        distortion={0.45}
        swirl={1.2}
        swirlIterations={14}
        shape="checks"
        shapeScale={0.15}
        scale={1.2}
        rotation={0}
        speed={0.4}
        colors={[
          "hsl(0 0% 3%)",
          "hsl(160 90% 25%)",
          "hsl(30 100% 45%)",
          "hsl(0 0% 5%)",
          "hsl(180 80% 35%)",
          "hsl(25 95% 35%)"
        ]}
      />
    </div>
  )
}
