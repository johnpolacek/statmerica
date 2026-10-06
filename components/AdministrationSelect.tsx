import { PARTY_GROUPS, TERMS } from "@/lib/terms"
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
        {PARTY_GROUPS.map((group) => (
          <SelectItem
            key={group.id}
            value={group.id}
            className={`${itemHighlightClass(group.party)} cursor-pointer transition-colors duration-200`}
          >
            {group.label}
          </SelectItem>
        ))}
        {TERMS.map((term) => (
          <SelectItem
            key={term.id}
            value={term.id}
            className={`${itemHighlightClass(term.party)} cursor-pointer transition-colors duration-200`}
          >
            {term.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}


