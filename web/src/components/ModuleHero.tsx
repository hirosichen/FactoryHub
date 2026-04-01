import { cn } from '@/lib/utils'

interface TechTag {
  label: string
  color?: 'blue' | 'green' | 'purple' | 'orange' | 'red'
}

interface Props {
  image?: string
  video?: string
  title: string
  subtitle: string
  techTags?: TechTag[]
  iotDevice?: string
  children?: React.ReactNode
  className?: string
}

const tagColors = {
  blue: 'bg-blue-500/20 text-blue-100 border-blue-400/30',
  green: 'bg-green-500/20 text-green-100 border-green-400/30',
  purple: 'bg-purple-500/20 text-purple-100 border-purple-400/30',
  orange: 'bg-orange-500/20 text-orange-100 border-orange-400/30',
  red: 'bg-red-500/20 text-red-100 border-red-400/30',
}

export function ModuleHero({ image, video, title, subtitle, techTags, iotDevice, children, className }: Props) {
  return (
    <div className={cn("relative rounded-2xl overflow-hidden", iotDevice ? "h-52" : "h-44", className)}>
      {video ? (
        <video
          src={video}
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
        />
      ) : image ? (
        <img
          src={image}
          alt={title}
          className="absolute inset-0 w-full h-full object-cover"
        />
      ) : null}
      <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-black/20" />

      <div className="relative h-full flex items-end p-6">
        <div className="flex-1 min-w-0">
          {techTags && techTags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-2">
              {techTags.map((tag, i) => (
                <span
                  key={i}
                  className={cn(
                    "inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium border",
                    tagColors[tag.color ?? 'blue']
                  )}
                >
                  {tag.label}
                </span>
              ))}
            </div>
          )}
          <h2 className="text-[22px] font-semibold text-white tracking-tight">{title}</h2>
          <p className="text-white/60 text-[13px] mt-0.5">{subtitle}</p>
        </div>

        {iotDevice && (
          <div className="shrink-0 ml-4 mb-1">
            <div className="relative">
              <img
                src={iotDevice}
                alt="IoT Device"
                className="h-28 w-28 object-contain drop-shadow-2xl"
              />
              <div className="absolute -bottom-1 inset-x-0 text-center">
                <span className="text-[9px] text-white/40 font-medium">IoT Device</span>
              </div>
            </div>
          </div>
        )}

        {children && <div className="flex items-center gap-2 shrink-0 ml-3">{children}</div>}
      </div>
    </div>
  )
}
