import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/third-party-shadcn/dialog";
import { FormRender } from "@/components/admin/form-render";
import { toast } from "@/lib/toast";

export const ManyToManyForm = ({
  openForm,
  formOpenManage,
  form,
  populateData,
  isEdit,
  label,
  onPost,
  onUpdate,
  setProcess,
  styles,
  themeName,
}: any) => {
  return (
    <Dialog open={openForm} modal={false} onOpenChange={formOpenManage}>
      {openForm ? <div className="fixed  inset-0 z-10 h-full w-full bg-black/50 backdrop-blur-sm" ></div> : null}
      <DialogContent className="md:min-w-[600px]" >
        <DialogHeader className="border-b border-border pb-4">
          <DialogTitle className="text-lg font-semibold text-foreground">
            {isEdit ? `Update ${label}` : `Add ${label}`}
          </DialogTitle>
        </DialogHeader>
        {form ? (
          <FormRender
            formSchema={form}
            populateData={populateData}
            onSubmit={async (values: any) => {
              setProcess(true);
              try {
                let response;
                if (populateData) {
                  response = await onUpdate(
                    populateData.id || populateData,
                    values,
                  );
                  if (response) toast.success("Record updated successfully");
                } else {
                  response = await onPost(values);
                  if (response) toast.success("Record created successfully");
                }

                if (response) {
                  formOpenManage(false);
                }
              } catch (error) {
                console.error("Submission error:", error);
                toast.error("An error occurred during submission");
              } finally {
                setProcess(false);
              }
            }}
            onCancel={() => {
              formOpenManage(false);
            }}
            styles={styles}
            themeName={themeName}
            labels={form?.labels}
            classNames={{
              mainContainer: "p-0",
              buttons: {
                base: "flex justify-start gap-4 border-t border-border pt-4 mt-5",
                cancel: "  px-10 transition-all shadow-sm active:scale-95",
                reset:
                  "  px-10 transition-all border border-border active:scale-95",
                submit: "  px-10 transition-all shadow-sm active:scale-95",
              },
              tabs: {
                tabHeader: {
                  base: "px-0  mb-8 gap-x-12 border-b",
                  button: {
                    base: "text-[13px] font-black pb-5 -mb-px transition-all relative uppercase tracking-widest",
                    active: "text-zinc-900 border-b-2 border-primary",
                    inactive:
                      "text-zinc-400 border-b-2 border-transparent hover:text-zinc-600",
                  },
                },
                footer: {
                  base: "px-12 py-8 justify-end border-none ",
                  cancel:
                    "px-10 font-bold transition-all shadow-sm active:scale-95 order-1",
                  reset:
                    " px-10 font-bold transition-all border border-border active:scale-95 order-2",
                  previous:
                    " px-10 font-bold transition-all border border-border active:scale-95 order-3",
                  next: " px-10 font-bold transition-all shadow-sm active:scale-95 order-4",
                  submit:
                    " px-10 font-bold transition-all shadow-sm active:scale-95 order-4",
                },
              },
            }}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
};
