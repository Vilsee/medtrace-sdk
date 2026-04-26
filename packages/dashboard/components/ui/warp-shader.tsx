'use client'
import { Warp } from "@paper-design/shaders-react"

export default function WarpShaderHero() {
  return (
    <div className="absolute inset-0 w-full h-full">
      <Warp
        style={{ height: "100%", width: "100%" }}
        proportion={0.45}
        softness={1}
        distortion={0.25}
        swirl={0.8}
        swirlIterations={10}
        shape="checks"
        shapeScale={0.1}
        scale={1}
        rotation={0}
        speed={0.6}
        colors={["hsl(200, 100%, 8%)", "hsl(174, 100%, 29%)", "hsl(180, 90%, 15%)", "hsl(160, 100%, 40%)"]}
      />
    </div>
  )
}
