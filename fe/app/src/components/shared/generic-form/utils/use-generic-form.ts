import { useState } from "react";
import { toast } from "sonner";
import { useEntity } from "@/engine";
import { useFormStyleStore } from "@/store/use-form-style";
import { useNav } from "@/platform/navigation";
import { useConfigStore } from "@/store/use-config-store";
import { storage } from "@/platform/storage";

const DEFAULT_AUTH_FORMS: Record<string, any> = {
  login: {
    form: {
      title: "Sign In",
      description: "Access your portal",
      formType: "simple",
      labels: {
        submit: "Sign In",
        cancel: "Forgot Password?",
        reset: "Create Account",
      },
      submit_included: true,
      inputs: [
        {
          name: "email",
          label: "Email Address",
          type: "email",
          placeholder: "you@example.com",
          column: { md: 12 },
          validation: [
            { rule: "required", message: "Email address is required" },
            { rule: "email", message: "Please enter a valid email" },
          ],
        },
        {
          name: "password",
          label: "Password",
          type: "password",
          placeholder: "••••••••",
          column: { md: 12 },
          validation: [
            { rule: "required", message: "Password is required" },
            {
              rule: "minLength",
              value: 8,
              message: "Password must be at least 8 characters",
            },
          ],
        },
        {
          name: "login_btn",
          label: "",
          type: "submit",
          isNoneInput: true,
          button_label: "Sign In",
          column: { md: 12 },
        },
        {
          name: "link",
          label: "",
          type: "typography",
          isNoneInput: true,
          content:
            "New user? {{Sign up||l||/register}} {{||br}} Forgot your password? {{Reset password||l||/forgot-password}}",
          column: { md: 12 },
        },
      ],
    },
  },
};

export const useGenericForm = (props: any) => {
  const { navigate } = useNav();
  const config = useConfigStore((state) => state.config);
  const { themeName, styles } = useFormStyleStore();
  const endpoint = props?.config?.endpoint || "login";
  const action = props?.config?.action || {
    type: "redirect",
    navigation: "/",
    login: true,
  };
  const { option, onPost } = useEntity(endpoint, {
    disabledMethods: ["get"],
  });

  const [serverError, setServerError] = useState<any>(null);

  const handleAction = (formConfig: any, values: any) => {
    console.log({ type: action?.type, formConfig, action });

    if (action?.store_local_storage) {
      const toStore: any = {};
      action.store_local_storage.forEach((key: string) => {
        toStore[key] = values[key];
      });
      storage.setItem("generic-form-action", JSON.stringify(toStore));
    }

    if (
      action?.remove_local_storage &&
      Array.isArray(action.remove_local_storage)
    ) {
      try {
        const storedStr = storage.getItem("generic-form-action");
        if (storedStr) {
          const stored = JSON.parse(storedStr);
          action.remove_local_storage.forEach((key: string) => {
            delete stored[key];
          });
          if (Object.keys(stored).length > 0) {
            storage.setItem("generic-form-action", JSON.stringify(stored));
          } else {
            storage.removeItem("generic-form-action");
          }
        }
      } catch (e) {
        console.error(e);
      }
    } else if (action?.remove_local_storage === true) {
      storage.removeItem("generic-form-action");
    }
    switch (action?.type) {
      case "redirect": {
        if (action?.login) {
          storage.setItem(
            "token",
            formConfig?.access_token || "mock_token_" + Date.now(),
          );
        }

        let redirectPath =
          action?.navigation ||
          config?.admin?.login_redirect ||
          "/admin/overview";
        if (
          action?.login &&
          (redirectPath === "/admin/language" || redirectPath === "/")
        ) {
          redirectPath = "/admin/overview";
        }
        navigate(redirectPath);
        break;
      }

      default:
        break;
    }
  };

  const handleSubmit = async (values: any) => {
    setServerError(null);
    const res = await onPost(values);

    if (res?.error) {
      toast.error(res?.details?.message || "Operation failed!");
      if (res?.status_code === 400) {
        setServerError(res?.details);
      }
      return res;
    }

    if (res?.data?.error === true || res?.data?.success === false) {
      const message = res?.data?.message || "Operation failed!";
      toast.error(message);
      setServerError(res.data);
      return res;
    }

    if (res?.data || res) {
      handleAction(res?.data || res, values);
    }
    return res;
  };

  const rawConfigList =
    option?.config ||
    option?.data?.config ||
    (Array.isArray(option) ? option : []);

  const matchedContent =
    rawConfigList.find(
      (optionsItem: any) =>
        (props?.config?.type && optionsItem.type === props?.config?.type) ||
        optionsItem.type === "login-card" ||
        optionsItem.content?.form,
    )?.content ||
    (props?.config?.form ? props?.config : null) ||
    (props?.config?.content?.form ? props?.config?.content : null) ||
    (props?.config?.inputs ? { form: props.config } : null) ||
    (endpoint && DEFAULT_AUTH_FORMS[endpoint]);

  const finalOptions = matchedContent;

  const populateData = (() => {
    if (
      !action?.populate_from_local_storage ||
      !Array.isArray(action.populate_from_local_storage)
    ) {
      return {};
    }
    try {
      const stored = storage.getItem("generic-form-action");
      if (stored) {
        const parsed = JSON.parse(stored);
        const result: any = {};
        action.populate_from_local_storage.forEach((key: string) => {
          if (parsed[key] !== undefined) {
            result[key] = parsed[key];
          }
        });
        return result;
      }
    } catch (e) {
      console.error(e);
    }
    return {};
  })();

  return {
    themeName,
    styles,
    serverError,
    handleSubmit,
    finalOptions,
    populateData,
    loading: !finalOptions,
  };
};
