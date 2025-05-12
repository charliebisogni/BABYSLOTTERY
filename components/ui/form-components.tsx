"use client"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"

interface InputFieldProps {
  id: string
  label: string
  type?: string
  placeholder?: string
  required?: boolean
  className?: string
  value?: string | number
  onChange?: (value: string) => void
  error?: string
}

export function InputField({
  id,
  label,
  type = "text",
  placeholder,
  required = false,
  className,
  value,
  onChange,
  error,
}: InputFieldProps) {
  return (
    <div className={cn("space-y-2", className)}>
      <Label htmlFor={id} className="text-sm font-medium">
        {label} {required && <span className="text-rose-500">*</span>}
      </Label>
      <Input
        id={id}
        name={id}
        type={type}
        placeholder={placeholder}
        required={required}
        value={value}
        onChange={(e) => onChange && onChange(e.target.value)}
        className={cn(error && "border-rose-500")}
      />
      {error && <p className="text-xs text-rose-500">{error}</p>}
    </div>
  )
}

interface SelectFieldProps {
  id: string
  label: string
  options: { value: string; label: string }[]
  required?: boolean
  className?: string
  value?: string
  onChange?: (value: string) => void
  error?: string
}

export function SelectField({
  id,
  label,
  options,
  required = false,
  className,
  value,
  onChange,
  error,
}: SelectFieldProps) {
  return (
    <div className={cn("space-y-2", className)}>
      <Label htmlFor={id} className="text-sm font-medium">
        {label} {required && <span className="text-rose-500">*</span>}
      </Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger id={id} className={cn(error && "border-rose-500")}>
          <SelectValue placeholder="Seleccionar" />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {error && <p className="text-xs text-rose-500">{error}</p>}
    </div>
  )
}

interface DateTimeFieldProps {
  id: string
  label: string
  required?: boolean
  className?: string
  value?: string
  onChange?: (value: string) => void
  error?: string
}

export function DateField({ id, label, required = false, className, value, onChange, error }: DateTimeFieldProps) {
  return (
    <div className={cn("space-y-2", className)}>
      <Label htmlFor={id} className="text-sm font-medium">
        {label} {required && <span className="text-rose-500">*</span>}
      </Label>
      <Input
        id={id}
        name={id}
        type="date"
        required={required}
        value={value}
        onChange={(e) => onChange && onChange(e.target.value)}
        className={cn(error && "border-rose-500")}
      />
      {error && <p className="text-xs text-rose-500">{error}</p>}
    </div>
  )
}

export function TimeField({ id, label, required = false, className, value, onChange, error }: DateTimeFieldProps) {
  return (
    <div className={cn("space-y-2", className)}>
      <Label htmlFor={id} className="text-sm font-medium">
        {label} {required && <span className="text-rose-500">*</span>}
      </Label>
      <Input
        id={id}
        name={id}
        type="time"
        required={required}
        value={value}
        onChange={(e) => onChange && onChange(e.target.value)}
        className={cn(error && "border-rose-500")}
      />
      {error && <p className="text-xs text-rose-500">{error}</p>}
    </div>
  )
}

interface NumberWithUnitFieldProps {
  id: string
  label: string
  units: { value: string; label: string }[]
  required?: boolean
  className?: string
  value?: number
  unitValue?: string
  onValueChange?: (value: number) => void
  onUnitChange?: (unit: string) => void
  error?: string
}

export function NumberWithUnitField({
  id,
  label,
  units,
  required = false,
  className,
  value,
  unitValue,
  onValueChange,
  onUnitChange,
  error,
}: NumberWithUnitFieldProps) {
  return (
    <div className={cn("space-y-2", className)}>
      <Label htmlFor={id} className="text-sm font-medium">
        {label} {required && <span className="text-rose-500">*</span>}
      </Label>
      <div className="flex space-x-2">
        <Input
          id={id}
          name={id}
          type="number"
          step="0.01"
          required={required}
          value={value === undefined ? "" : value}
          onChange={(e) => onValueChange && onValueChange(Number.parseFloat(e.target.value))}
          className={cn("flex-1", error && "border-rose-500")}
        />
        <Select value={unitValue} onValueChange={onUnitChange}>
          <SelectTrigger className="w-24">
            <SelectValue placeholder="Unidad" />
          </SelectTrigger>
          <SelectContent>
            {units.map((unit) => (
              <SelectItem key={unit.value} value={unit.value}>
                {unit.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {error && <p className="text-xs text-rose-500">{error}</p>}
    </div>
  )
}
