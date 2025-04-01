interface HeritagePalMascotProps {
  size?: "small" | "medium" | "large"
}

export function HeritagePalMascot({ size = "medium" }: HeritagePalMascotProps) {
  const dimensions = {
    small: { width: 40, height: 40 },
    medium: { width: 80, height: 80 },
    large: { width: 120, height: 120 },
  }

  const { width, height } = dimensions[size]

  return (
    <div className="relative">
      <div className={`rounded-full overflow-hidden bg-yellow-400 border-2 border-green-500`} style={{ width, height }}>
        {/* This is a placeholder. In a real implementation, you would use an actual mascot image */}
        <div className="w-full h-full flex items-center justify-center text-2xl">🦜</div>
      </div>
    </div>
  )
}

