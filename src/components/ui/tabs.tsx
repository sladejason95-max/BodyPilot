import React, { createContext, useContext, useState } from "react";

type TabsContextValue = {
  value: string;
  setValue: (value: string) => void;
};

const TabsContext = createContext<TabsContextValue | null>(null);

export function Tabs({
  value,
  defaultValue,
  onValueChange,
  className = "",
  children,
}: {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  className?: string;
  children: React.ReactNode;
}) {
  const [internalValue, setInternalValue] = useState(defaultValue ?? value ?? "");
  const activeValue = value ?? internalValue;

  const setValue = (nextValue: string) => {
    if (value === undefined) {
      setInternalValue(nextValue);
    }
    onValueChange?.(nextValue);
  };

  return (
    <TabsContext.Provider value={{ value: activeValue, setValue }}>
      <div className={className}>{children}</div>
    </TabsContext.Provider>
  );
}

export function TabsList({
  className = "",
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return <div className={className}>{children}</div>;
}

export function TabsTrigger({
  value,
  className = "",
  children,
}: {
  value: string;
  className?: string;
  children: React.ReactNode;
}) {
  const ctx = useContext(TabsContext);
  if (!ctx) return null;
  const active = ctx.value === value;

  return (
    <button
      type="button"
      data-state={active ? "active" : "inactive"}
      onClick={() => ctx.setValue(value)}
      className={[
        "rounded-2xl border px-3 py-2 text-xs font-medium transition-colors duration-200 sm:px-4 sm:py-2.5 sm:text-sm",
        active
          ? "premium-tab-trigger-active"
          : "premium-tab-trigger-inactive",
        className,
      ].join(" ")}
    >
      {children}
    </button>
  );
}

export function TabsContent({
  value,
  className = "",
  children,
}: {
  value: string;
  className?: string;
  children: React.ReactNode;
}) {
  const ctx = useContext(TabsContext);
  if (!ctx || ctx.value !== value) return null;
  return <div className={className}>{children}</div>;
}
