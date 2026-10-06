import { useProcess } from "@/store/use-process";
import { createPortal } from "react-dom";
import { Spinner } from "@/components/third-party-shadcn/spinner";

export const ProcessLoader = () => {
  const { process } = useProcess();

  return process
    ? createPortal(
        <div className="bg-white/50 fixed top-0 left-0 w-full h-full z-999 flex justify-center items-center">
          <Spinner className="w-10 h-10" />
        </div>,
        document.body,
      )
    : null;
};
