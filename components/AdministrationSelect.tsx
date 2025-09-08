import { administrations } from "@/lib/metrics"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

type AdministrationSelectProps = {
  value: string
  onChange: (value: string) => void
  className?: string
}

const itemHighlightClass = (party?: "D" | "R") => {
  if (party === "R") {
    return "data-[highlighted]:bg-red-100 data-[highlighted]:text-red-900 dark:data-[highlighted]:bg-red-900/60 dark:data-[highlighted]:text-red-100"
  }
  if (party === "D") {
    return "data-[highlighted]:bg-blue-100 data-[highlighted]:text-blue-900 dark:data-[highlighted]:bg-blue-900/60 dark:data-[highlighted]:text-blue-100"
  }
  return "data-[highlighted]:bg-accent data-[highlighted]:text-accent-foreground"
}

export default function AdministrationSelect({ value, onChange, className }: AdministrationSelectProps) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className={className ?? "w-64"}>
        <SelectValue placeholder="Select Administration" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem
          value="party-R"
          className={`${itemHighlightClass("R")} cursor-pointer transition-colors duration-200`}
        >
          Republicans (1980-present)
        </SelectItem>
        <SelectItem
          value="party-D"
          className={`${itemHighlightClass("D")} cursor-pointer transition-colors duration-200`}
        >
          Democrats (1980-present)
        </SelectItem>
        {administrations.map((admin) => (
          <SelectItem
            key={admin.value}
            value={admin.value}
            className={`${itemHighlightClass((admin as any).party)} cursor-pointer transition-colors duration-200`}
          >
            {admin.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}


