import { FormRender } from "@/components/admin/form-render";
import { ArrowLeft } from "lucide-react";
import { toast } from "@/common/lib/toast";
import { useFormStyleStore } from "@/common/store/use-form-style";
import { Button } from "@/components/third-party-shadcn/button";

export const DefaultEditModule = ({
  formOpenManage,
  form,
  populateData,
  onPost,
  onUpdate,
  setProcess,
}: any) => {
  const { styles, themeName } = useFormStyleStore();

  const checkHasManyToMany = (obj: any): boolean => {
    if (!obj || typeof obj !== "object") return false;
    if (obj.type === "many-to-many" || obj.type === "manyToMany") return true;
    if (Array.isArray(obj)) {
      return obj.some(checkHasManyToMany);
    }
    for (const key in obj) {
      if (checkHasManyToMany(obj[key])) return true;
    }
    return false;
  };

  const hasManyToMany = checkHasManyToMany(form);

  return (
    <div className="min-h-full ">
      <div className="space-y-8 ">
        <div className="flex justify-between items-center border-b pb-2">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              {populateData
                ? `Edit ${form?.title || "Record"}`
                : `Add ${form?.title || "Record"}`}
            </h1>
            <p className="text-sm text-muted-foreground">
              {form?.description ||
                "Complete the details below to manage staff access."}
            </p>
          </div>
          <Button
            onClick={() => formOpenManage(false)}
            variant={"outline"}
            className="bg-transparent"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to List
          </Button>
        </div>

        <div className=" overflow-hidden">
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

                if (response && !hasManyToMany) {
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
                base: "flex justify-start gap-4 mt-4 border-t border-border pt-4 ",
                cancel: "  px-10 transition-all shadow-sm active:scale-95",
                reset:
                  "  px-10 transition-all border border-border active:scale-95",
                submit: "  px-10 transition-all shadow-sm active:scale-95",
              },
              tabs: {
                tabHeader: {
                  base: "px-0 mb-8 gap-x-12 border-b border-border/35",
                  button: {
                    base: "text-[13px] font-black pb-5 -mb-px transition-all relative uppercase tracking-widest",
                    active: "text-zinc-900 border-b-2 border-primary",
                    inactive:
                      "text-zinc-400 border-b-2 border-transparent hover:text-zinc-600",
                  },
                },
                footer: {
                  base: "px-12 py-8 justify-end border-none",
                  cancel:
                    "px-10   font-bold transition-all shadow-sm active:scale-95 order-1",
                  reset:
                    " px-10   font-bold transition-all border border-border active:scale-95 order-2",
                  previous:
                    " px-10   font-bold transition-all border border-border active:scale-95 order-3",
                  next: " px-10   font-bold transition-all shadow-sm active:scale-95 order-4",
                  submit:
                    " px-10   font-bold transition-all shadow-sm active:scale-95 order-4",
                },
              },
            }}
          />
        </div>
      </div>
    </div>
  );
};
