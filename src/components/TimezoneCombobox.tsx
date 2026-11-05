import { useEffect, useState } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { TIMEZONES, timezoneOptions } from "@/lib/timezones";

export function TimezoneCombobox({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const [open, setOpen] = useState(false);
  const [options, setOptions] = useState(TIMEZONES);
  useEffect(() => setOptions(timezoneOptions()), []);
  const selected = options.find((zone) => zone.value === value);
  return <Popover open={open} onOpenChange={setOpen}>
    <PopoverTrigger asChild><Button id="circadian-timezone" variant="outline" role="combobox" aria-expanded={open} aria-label="Timezone" className="mt-1 h-auto min-h-11 w-full justify-between whitespace-normal text-left text-xs">
      <span className="min-w-0 break-words">{selected ? `${selected.label} — ${selected.value}` : value || "Select timezone"}</span><ChevronsUpDown size={16} className="shrink-0" />
    </Button></PopoverTrigger>
    <PopoverContent align="start" className="w-80 max-w-[calc(100vw-2rem)] p-0">
      <Command><CommandInput placeholder="Search city or timezone…" aria-label="Search timezones" className="min-h-11" />
        <CommandList><CommandEmpty>No matching timezone.</CommandEmpty>
          {options.map((zone) => <CommandItem key={zone.value} value={`${zone.label} ${zone.value}`} keywords={zone.cities} onSelect={() => { onChange(zone.value); setOpen(false); }} className="min-h-11 items-start whitespace-normal text-xs">
            <Check aria-hidden="true" className={zone.value === value ? "opacity-100" : "opacity-0"} /><span className="min-w-0 break-words">{zone.label} — {zone.value}</span>
          </CommandItem>)}
        </CommandList>
      </Command>
    </PopoverContent>
  </Popover>;
}