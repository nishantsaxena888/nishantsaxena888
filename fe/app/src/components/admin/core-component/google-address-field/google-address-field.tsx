"use client";

import * as React from "react";
import { cn } from "@/common/lib/utils";
import { FormLabel } from "@/components/admin/core-component/form-label";
import { SearchAutocomplete } from "@/components/admin/core-component/search-autocomplete";
import { useGoogleAutocomplete } from "@/common/hooks/use-google-autocomplete";
import { parseAddressComponents, type Address } from "./utils/google-api-utils";
import { containerStyles } from "./utils/input-style";
import { inputStyles } from "@/components/admin/core-component/input-field/utils/input-style";

export type GoogleAddressFieldProps = {
  apiKey: string;
  value?: Address;
  defaultValue?: Address;
  onChange?: (address: Address) => void;
  themeName?: string;
  disabled?: boolean;
  className?: string;
  placeholder?: string;
};

const emptyAddress: Address = {
  street: "",
  apt: "",
  city: "",
  state: "",
  postalCode: "",
  country: "US",
};

export const GoogleAddressField = ({
  apiKey,
  value,
  defaultValue,
  onChange,
  themeName = "default",
  disabled,
  className,
  placeholder = "Start typing your address...",
}: GoogleAddressFieldProps) => {
  const [internalAddress, setInternalAddress] = React.useState<Address>(
    value || defaultValue || emptyAddress
  );

  const { isLoaded, getSuggestions, getPlaceDetails } = useGoogleAutocomplete(apiKey);

  const [prevSyncedValue, setPrevSyncedValue] = React.useState(value);
  if (value && value !== prevSyncedValue) {
    setPrevSyncedValue(value);
    setInternalAddress(value);
  }

  const updateAddress = (updates: Partial<Address>) => {
    const nextAddress = { ...internalAddress, ...updates };
    setInternalAddress(nextAddress);
    onChange?.(nextAddress);
  };

  const handleStreetSelect = async (suggestion: any) => {
    if (typeof suggestion === "string") return;
    
    const details = await getPlaceDetails(suggestion.placeId);
    if (details) {
      const parsed = parseAddressComponents(details.address_components);
      updateAddress({
        ...parsed,
        street: suggestion.description.split(",")[0], // Use the main description part as street
      });
    }
  };

  const handleInputChange = (field: keyof Address, val: string) => {
    updateAddress({ [field]: val });
  };

  // Common input classes based on themes
  const inputClass = inputStyles[themeName] || inputStyles.default;

  return (
    <div className={cn(containerStyles[themeName] || containerStyles.default, className)}>
      {/* Street Address */}
      <div className="space-y-2">
        <FormLabel>Street Address</FormLabel>
        <SearchAutocomplete
          placeholder={placeholder}
          onFetch={async (query) => {
            if (!isLoaded) return [];
            const results = await getSuggestions(query);
            return results.map(r => ({ label: r.description, value: r.placeId, ...r }));
          }}
          labelKey="label"
          valueKey="value"
          onSelect={handleStreetSelect}
          themeName={themeName}
          className="w-full"
          disabled={disabled}
        />
      </div>

      {/* Apt/Suite */}
      <div className="space-y-2">
        <FormLabel>Apt / Suite (Optional)</FormLabel>
        <input suppressHydrationWarning
          type="text"
          value={internalAddress.apt || ""}
          onChange={(e) => handleInputChange("apt", e.target.value)}
          placeholder="Apt 101, Suite B..."
          className={inputClass}
          disabled={disabled}
        />
      </div>

      {/* City & State */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <FormLabel>City</FormLabel>
          <input suppressHydrationWarning
            type="text"
            value={internalAddress.city}
            onChange={(e) => handleInputChange("city", e.target.value)}
            placeholder="City"
            className={inputClass}
            disabled={disabled}
          />
        </div>
        <div className="space-y-2">
          <FormLabel>State / Province</FormLabel>
          <input suppressHydrationWarning
            type="text"
            value={internalAddress.state}
            onChange={(e) => handleInputChange("state", e.target.value)}
            placeholder="State"
            className={inputClass}
            disabled={disabled}
          />
        </div>
      </div>

      {/* Postal Code & Country */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <FormLabel>Postal Code</FormLabel>
          <input suppressHydrationWarning
            type="text"
            value={internalAddress.postalCode}
            onChange={(e) => handleInputChange("postalCode", e.target.value)}
            placeholder="Postal Code"
            className={inputClass}
            disabled={disabled}
          />
        </div>
        <div className="space-y-2">
          <FormLabel>Country</FormLabel>
          <select suppressHydrationWarning
            value={internalAddress.country}
            onChange={(e) => handleInputChange("country", e.target.value)}
            className={inputClass}
            disabled={disabled}
          >
            <option value="US">United States</option>
            <option value="CA">Canada</option>
            <option value="GB">United Kingdom</option>
            <option value="IN">India</option>
            <option value="AU">Australia</option>
          </select>
        </div>
      </div>
    </div>
  );
};
