import React, { useState } from "react";
import { OldFormRenderer } from "@/components/shared/old-form-render";
import type { FormSchema, FieldSchema } from "@/components/shared/old-form-render";

const baseFields: FieldSchema[] = [
  {
    name: "profile",
    label: "Professional Profile",
    componentType: "group",
    required: true,
    columns: 2,
    children: [
      {
        name: "firstName",
        label: "First Name",
        componentType: "TextInput",
        placeholder: "Enter first name",
        colSpan: 1,
        validation: [{ type: "required", message: "First name is mandatory" }],
      },
      {
        name: "lastName",
        label: "Last Name",
        componentType: "TextInput",
        placeholder: "Enter last name",
        colSpan: 1,
        validation: [{ type: "required", message: "Last name is mandatory" }],
      },
      {
        name: "email",
        label: "Email Address",
        componentType: "TextInput",
        placeholder: "email@example.com",
        colSpan: 2,
        validation: [
          { type: "required", message: "Email is required" },
          { type: "email", message: "Provide a valid email" },
        ],
      },
      {
        name: "bio",
        label: "Short Biography",
        componentType: "TextArea",
        placeholder: "Tell us about yourself...",
        colSpan: 2,
        validation: [
          {
            type: "minLength",
            value: 20,
            message: "Bio must be at least 20 chars",
          },
        ],
      },
    ],
  },
  {
    name: "preferences",
    label: "User Preferences",
    componentType: "group",
    children: [
      {
        name: "newsletter",
        label: "Newsletter Subscription",
        componentType: "TextInput",
        defaultValue: "Yes",
      },
      {
        name: "theme",
        label: "Preferred Theme",
        componentType: "TextInput",
        placeholder: "Dark or Light",
      },
    ],
  },
];

const schemas: Record<string, FormSchema> = {
  default: {
    id: "default-form",
    title: "Standard Form Layout",
    description: "A clean, single-page form with advanced styling.",
    layout: "default",
    fields: baseFields,
  },
  step: {
    id: "step-form",
    title: "Multi-Step Process",
    layout: "step",
    validateBeforeNext: true,
    fields: baseFields,
  },
  accordion: {
    id: "accordion-form",
    title: "Categorized Sections",
    layout: "accordion",
    fields: baseFields,
  },
  grid: {
    id: "grid-form",
    title: "High-Density Grid",
    layout: "default",
    columns: 2,
    fields: [
      {
        name: "user",
        label: "Personal Data",
        componentType: "group",
        columns: 2,
        children: [
          { name: "fName", label: "First", componentType: "TextInput" },
          { name: "lName", label: "Last", componentType: "TextInput" },
          { name: "age", label: "Age", componentType: "TextInput" },
          { name: "job", label: "Job Title", componentType: "TextInput" },
        ],
      },
      {
        name: "comments",
        label: "Comments",
        componentType: "TextArea",
      },
    ],
  },
};

export const FormPlayground: React.FC = () => {
  const [activeLayout, setActiveLayout] = useState("default");
  const [submittedData, setSubmittedData] = useState<any>(null);

  // Design System State
  const [primaryColor, setPrimaryColor] = useState("#4f46e5");
  const [fieldHeight, setFieldHeight] = useState("48");
  const [fieldBorderRadius, setFieldBorderRadius] = useState("12");
  const [fontSize, setFontSize] = useState("14");
  const [gap, setGap] = useState("24");
  const [gridCols, setGridCols] = useState(1);

  const handleSubmit = (data: any) => {
    console.log(`Form (${activeLayout}) Submitted Successfully:`, data);
    setSubmittedData(data);
  };

  const colors = [
    "#4f46e5",
    "#0ea5e9",
    "#10b981",
    "#f59e0b",
    "#ef4444",
    "#8b5cf6",
    "#ec4899",
    "#1e293b",
  ];

  return (
    <div className="min-h-screen bg-[#fcfcfd] flex flex-col md:flex-row font-sans selection:bg-indigo-100 selection:text-indigo-900">
      {/* --- Sidebar / Stylist --- */}
      <aside className="w-full md:w-80 bg-white border-r border-slate-100 p-8 flex flex-col shadow-2xl z-10 sticky top-0 h-screen overflow-y-auto">
        <div className="flex items-center gap-3 mb-10">
          <div
            className="w-10 h-10 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-200"
            style={{ backgroundColor: primaryColor }}
          >
            <span className="text-white font-black text-xl italic">N</span>
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-800 tracking-tighter leading-tight">
              STYLIST
            </h2>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-tight">
              Design Engine
            </p>
          </div>
        </div>

        <div className="flex-1 space-y-10">
          {/* Color Picker */}
          <div className="space-y-4">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 block">
              Brand Identity
            </label>
            <div className="grid grid-cols-4 gap-2">
              {colors.map((c) => (
                <button
                  key={c}
                  onClick={() => setPrimaryColor(c)}
                  className={`h-8 rounded-lg transition-all ${primaryColor === c ? "ring-2 ring-offset-2 scale-110 shadow-lg" : "opacity-60 hover:opacity-100"}`}
                  style={{
                    backgroundColor: c,
                    borderColor: c,
                    boxShadow:
                      primaryColor === c
                        ? `0 0 0 2px white, 0 0 0 4px ${c}`
                        : "none",
                  }}
                />
              ))}
            </div>
          </div>

          <div className="space-y-8">
            <div className="space-y-2">
              <div className="flex justify-between">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                  Field Geometry
                </label>
                <span className="text-[10px] font-bold text-indigo-600">
                  {fieldHeight}px
                </span>
              </div>
              <input
                type="range"
                min="32"
                max="64"
                value={fieldHeight}
                onChange={(e) => setFieldHeight(e.target.value)}
                className="w-full accent-indigo-600"
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                  Border Radius
                </label>
                <span className="text-[10px] font-bold text-indigo-600">
                  {fieldBorderRadius}px
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="32"
                value={fieldBorderRadius}
                onChange={(e) => setFieldBorderRadius(e.target.value)}
                className="w-full accent-indigo-600"
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                  Typo Size
                </label>
                <span className="text-[10px] font-bold text-indigo-600">
                  {fontSize}px
                </span>
              </div>
              <input
                type="range"
                min="11"
                max="18"
                value={fontSize}
                onChange={(e) => setFontSize(e.target.value)}
                className="w-full accent-indigo-600"
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                  Section Gap
                </label>
                <span className="text-[10px] font-bold text-indigo-600">
                  {gap}px
                </span>
              </div>
              <input
                type="range"
                min="8"
                max="64"
                value={gap}
                onChange={(e) => setGap(e.target.value)}
                className="w-full accent-indigo-600"
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                  Layout Columns
                </label>
                <span className="text-[10px] font-bold text-indigo-600">
                  {gridCols} Cols
                </span>
              </div>
              <input
                type="range"
                min="1"
                max="4"
                value={gridCols}
                onChange={(e) => setGridCols(Number(e.target.value))}
                className="w-full accent-indigo-600"
              />
            </div>
          </div>
        </div>

        <div className="space-y-4 pt-8 border-t border-slate-100 flex flex-col gap-3">
          <button
            onClick={() => {
              setPrimaryColor("#4f46e5");
              setFieldHeight("48");
              setFieldBorderRadius("12");
              setFontSize("14");
              setGap("24");
              setGridCols(1);
            }}
            className="w-full py-3 bg-slate-100 text-slate-600 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-slate-200 transition-all active:scale-95"
          >
            Reset Defaults
          </button>
          <div className="text-[10px] font-medium text-slate-400">
            Nishify Render Engine v2.1
          </div>
        </div>
      </aside>

      {/* --- Main Preview Area --- */}
      <main className="flex-1 py-12 px-6 lg:px-12 overflow-y-auto">
        <div className="max-w-4xl mx-auto space-y-10">
          <div className="text-center space-y-4">
            <h1 className="text-5xl font-black text-slate-900 tracking-tighter">
              NISHIFY{" "}
              <span
                className="text-indigo-600 underline decoration-indigo-200"
                style={{
                  color: primaryColor,
                  textDecorationColor: `${primaryColor}30`,
                }}
              >
                ENGINE
              </span>
            </h1>
            <div className="flex justify-center gap-2 p-1 bg-white border border-slate-200 rounded-2xl shadow-sm inline-flex mx-auto overflow-hidden">
              {Object.keys(schemas).map((layout) => (
                <button
                  key={layout}
                  onClick={() => {
                    setActiveLayout(layout);
                    setSubmittedData(null);
                  }}
                  className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                    activeLayout === layout
                      ? "text-white shadow-lg"
                      : "text-slate-500 hover:bg-slate-50"
                  }`}
                  style={{
                    backgroundColor:
                      activeLayout === layout ? primaryColor : "transparent",
                  }}
                >
                  {layout}
                </button>
              ))}
            </div>
          </div>

          <div key={activeLayout} className="transition-all duration-500">
            <OldFormRenderer
              schema={schemas[activeLayout]}
              onSubmit={handleSubmit}
              primaryColor={primaryColor}
              fieldHeight={`${fieldHeight}px`}
              fieldBorderRadius={`${fieldBorderRadius}px`}
              fontSize={`${fontSize}px`}
              gap={`${gap}px`}
              columns={gridCols}
              className=""
            />
          </div>

          {submittedData && (
            <div className="animate-slide-in p-8 bg-slate-900 rounded-3xl shadow-2xl text-white">
              <h3 className="text-xl font-black mb-6 flex items-center gap-2">
                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                Submission Payload
              </h3>
              <pre className="text-xs text-slate-300 font-mono overflow-auto p-4 bg-slate-800 rounded-2xl border border-slate-700">
                {JSON.stringify(submittedData, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};
