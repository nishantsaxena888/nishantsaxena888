export type Address = {
  street: string;
  apt?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
};

export const parseAddressComponents = (components: any[]): Partial<Address> => {
  const result: Partial<Address> = {
    street: "",
    city: "",
    state: "",
    postalCode: "",
    country: "",
  };

  let streetNumber = "";
  let route = "";

  components.forEach((component) => {
    const types = component.types;

    if (types.includes("street_number")) {
      streetNumber = component.long_name;
    }
    if (types.includes("route")) {
      route = component.long_name;
    }
    if (types.includes("locality")) {
      result.city = component.long_name;
    }
    if (types.includes("administrative_area_level_1")) {
      result.state = component.short_name;
    }
    if (types.includes("postal_code")) {
      result.postalCode = component.long_name;
    }
    if (types.includes("country")) {
      result.country = component.short_name;
    }
  });

  result.street = `${streetNumber} ${route}`.trim();

  return result;
};
