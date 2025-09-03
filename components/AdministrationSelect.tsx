import { administrations } from "@/lib/metrics"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

type AdministrationSelectProps = {
  value: string
  onChange: (value: string) => void
  className?: string
}

export default function AdministrationSelect({ value, onChange, className }: AdministrationSelectProps) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className={className ?? "w-64"}>
        <SelectValue placeholder="Select Administration" />
      </SelectTrigger>
      <SelectContent>
        {administrations.map((admin) => (
          <SelectItem key={admin.value} value={admin.value}>
            {admin.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}


