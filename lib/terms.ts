export type Party = "D" | "R"

export type Term = {
  id: string
  name: string
  label: string
  party: Party
  start: number
  end: number
}

export type PartyGroup = {
  id: "party-D" | "party-R"
  name: string
  label: string
  party: Party
}

export type Selection = ({ kind: "term" } & Term) | ({ kind: "party" } & PartyGroup)

// Calendar years of each four-year term. Inauguration is January 20, so a
// term's first year is the first full calendar year in office.
export const TERMS: Term[] = [
  { id: "trump-2", name: "Trump", label: "Trump (2025–)", party: "R", start: 2025, end: 2028 },
  { id: "biden-1", name: "Biden", label: "Biden (2021–2024)", party: "D", start: 2021, end: 2024 },
  { id: "trump-1", name: "Trump", label: "Trump (2017–2020)", party: "R", start: 2017, end: 2020 },
  { id: "obama-2", name: "Obama", label: "Obama (2013–2016)", party: "D", start: 2013, end: 2016 },
  { id: "obama-1", name: "Obama", label: "Obama (2009–2012)", party: "D", start: 2009, end: 2012 },
  { id: "gwbush-2", name: "George W. Bush", label: "George W. Bush (2005–2008)", party: "R", start: 2005, end: 2008 },
  { id: "gwbush-1", name: "George W. Bush", label: "George W. Bush (2001–2004)", party: "R", start: 2001, end: 2004 },
  { id: "clinton-2", name: "Clinton", label: "Clinton (1997–2000)", party: "D", start: 1997, end: 2000 },
  { id: "clinton-1", name: "Clinton", label: "Clinton (1993–1996)", party: "D", start: 1993, end: 1996 },
  { id: "ghwbush-1", name: "George H. W. Bush", label: "George H. W. Bush (1989–1992)", party: "R", start: 1989, end: 1992 },
  { id: "reagan-2", name: "Reagan", label: "Reagan (1985–1988)", party: "R", start: 1985, end: 1988 },
  { id: "reagan-1", name: "Reagan", label: "Reagan (1981–1984)", party: "R", start: 1981, end: 1984 },
]

export const PARTY_GROUPS: PartyGroup[] = [
  { id: "party-R", name: "Republicans", label: "Republicans (1981–present)", party: "R" },
  { id: "party-D", name: "Democrats", label: "Democrats (1981–present)", party: "D" },
]

export const DEFAULT_A = "trump-1"
export const DEFAULT_B = "biden-1"

export function getSelection(id: string | undefined | null): Selection | null {
  const term = TERMS.find((t) => t.id === id)
  if (term) return { kind: "term", ...term }
  const group = PARTY_GROUPS.find((g) => g.id === id)
  if (group) return { kind: "party", ...group }
  return null
}

export function termsForParty(party: Party): Term[] {
  return TERMS.filter((t) => t.party === party)
}

// Normalize ?a=&b= search params into a valid matchup.
export function resolveMatchup(a?: string | string[] | null, b?: string | string[] | null): { a: string; b: string } {
  const first = (v?: string | string[] | null) => (Array.isArray(v) ? v[0] : v)
  return {
    a: getSelection(first(a))?.id ?? DEFAULT_A,
    b: getSelection(first(b))?.id ?? DEFAULT_B,
  }
}
