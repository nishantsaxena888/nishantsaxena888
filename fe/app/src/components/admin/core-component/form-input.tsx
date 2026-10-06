import { TextAreaField } from "./text-area/text-area";
import { InputField } from "./input-field/input-field";
import { InputSwitch } from "./input-switch/input-switch";
import { Select } from "./select/select";
import { InputPhone } from "./input-phone/input-phone";
import { InputDate } from "./input-date/input-date";
import { InputCheckbox } from "./input-checkbox/input-checkbox";
// import { InputOtp } from "./input-otp/input-otp";
import { InputColor } from "./input-color/input-color";
import { InputPassword } from "./input-password/input-password";
// import { AppButton } from "./app-button/app-button";
import { TypographyRenderer } from "./typography-renderer/typography-renderer";

// New specialized components
import { AudioPicker } from "./audio-picker/audio-picker";
// import { BrandLogos } from "./brand-logos/brand-logos";
// import { DatetimePicker } from "./datetime-picker/datetime-picker";
import { Dropdown } from "./dropdown/dropdown";
import { Gallery } from "./gallery/gallery";
// import { GoogleAddressField } from "./google-address-field/google-address-field";
import { Iframe } from "./iframe/iframe";
import { ImageRadioGroupField } from "./image-radio-group-field/image-radio-group-field";
import { InputEmoji } from "./input-emoji/input-emoji";
import { InputFile } from "./input-file/input-file";
import { InputPriceRange } from "./input-price-range/input-price-range";
import { LoginCard } from "./login-card/login-card";
import { MultiCheckboxField } from "./multi-checkbox-field/multi-checkbox-field";
import { MultiImageCheckboxField } from "./multi-image-checkbox-field/multi-image-checkbox-field";
import { MultiSelectField } from "./multi-select/multi-select";
import { QuantitySelector } from "./quantity-selector/quantity-selector";
import { RadioGroup } from "./radio-group/radio-group";
import { RangeSlider } from "./range-slider/range-slider";
import { SearchAutocomplete } from "./search-autocomplete/search-autocomplete";
import { StringArrayInput } from "./string-array-input/string-array-input";
import { ThemeSwitcher } from "./theme-switcher/theme-switcher";
import { TimePicker } from "./time-picker/time-picker";
import { InputOTP } from "../../third-party-shadcn/input-otp";
import { AppButton } from "./app-button";
import { DateTimePicker } from "./datetime-picker";
import { YouTubeVideo } from "./youtube-video";
import { DynamicSelect } from "./dynamic-select/dynamic-select";
import { DynamicMultiSelect } from "./dynamic-multi-select/dynamic-multi-select";
import { IconPicker } from "./icon-picker/icon-picker";
import { ManyToMany } from "./many-to-many/many-to-many";

export const formInput: Record<string, any> = {
  // Core Fields
  text: InputField,
  email: InputField,
  password: InputPassword,
  number: InputField,
  textarea: TextAreaField,
  switch: InputSwitch,
  select: Select,
  phone: InputPhone,
  date: InputDate,
  checkbox: InputCheckbox,
  otp: InputOTP,
  color: InputColor,
  submit: AppButton,
  typography: TypographyRenderer,

  // Specialized Fields & Components
  audio: AudioPicker,
  // brandLogos: BrandLogos,
  datetime: DateTimePicker,
  dropdown: Dropdown,
  "dynamic-select": DynamicSelect,
  dynamicSelect: DynamicSelect,
  "dynamic-multi-select": DynamicMultiSelect,
  dynamicMultiSelect: DynamicMultiSelect,
  "icon-picker": IconPicker,
  iconPicker: IconPicker,
  "many-to-many": ManyToMany,
  manyToMany: ManyToMany,
  gallery: Gallery,
  // address: GoogleAddressField,
  iframe: Iframe,
  imageRadio: ImageRadioGroupField,
  emoji: InputEmoji,
  file: InputFile,
  priceRange: InputPriceRange,
  loginCard: LoginCard,
  multiCheckbox: MultiCheckboxField,
  multiImageCheckbox: MultiImageCheckboxField,
  multiSelect: MultiSelectField,
  quantity: QuantitySelector,
  radio: RadioGroup,
  range: RangeSlider,
  autocomplete: SearchAutocomplete,
  stringArray: StringArrayInput,
  themeSwitcher: ThemeSwitcher,
  time: TimePicker,
  youtube: YouTubeVideo,

  // PascalCase versions for backward compatibility
  TextInput: InputField,
  TextArea: TextAreaField,
  Switch: InputSwitch,
  SelectField: Select,
  DynamicSelect: DynamicSelect,
  PhoneInput: InputPhone,
  DateInput: InputDate,
  CheckboxInput: InputCheckbox,
  // OTPInput: InputOtp,
  ColorInput: InputColor,
  MultiSelect: MultiSelectField,
  IconPicker: IconPicker,
  // GoogleAddress: GoogleAddressField,
};
