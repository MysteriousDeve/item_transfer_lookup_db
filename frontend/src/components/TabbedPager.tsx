import { Button, CSSProperties } from "@mantine/core";
import { useState, Children, JSX } from "react";
 
/**
 * TabbedPager
 *
 * A vertically stacked tab switcher: a row of buttons on top (acting like
 * radio inputs — exactly one active at a time), and the matching page
 * below. Both sections share the same width (the width of the parent).
 *
 * Props:
 *  - tabs:  string[]        Names for each tab, in order.
 *  - children: ReactNode[]  One child per tab — children[i] renders when
 *                            tabs[i] is active. Pass more children than
 *                            tabs and the extras are ignored; pass fewer
 *                            and the missing pages render blank.
 *  - defaultIndex?: number  Which tab starts active (default 0).
 *  - onChange?: (index: number) => void  Called when the active tab changes.
 */
export function TabbedPager({
  children,
  activeIndex
} : {
  children: JSX.Element[], activeIndex: number
}) {
  const pages = Children.toArray(children);
 
  return (
    <div style={styles.page}>
      {pages.map((page, index) => {
        return <div key={index} style={{display: index === activeIndex ? "block" : "none",}}>
          {page}
        </div>
      })}
    </div>
  );
}

/*
// Previous way to do it
<div key={index} style={{display: index === activeIndex ? "block" : "none",}}>
  {page}
</div>

// Performant way
if (index === activeIndex) return page;
        return null;
*/


export function TabbedPagerRadio({
  tabs = [],
  activeIndex,
  onChange
} : {
  tabs: string[], activeIndex?: number, onChange?: CallableFunction
}) {
  const selectTab = (index: number) => {
    onChange?.(index);
  }

  return (
    <div style={styles.tabRow} role="radiogroup">
      {tabs.map((label, index) => {
        const isActive = index === activeIndex;
        return (
          <Button
            key={index}
            type="button"
            role="radio"
            aria-checked={isActive}
            onClick={() => selectTab(index)}
            style={{
              ...styles.tabButton,
              ...(isActive ? styles.tabButtonActive : null),
            }}
          >
            {label}
          </Button>
        );
      })}
    </div>
  );
}


const styles: Record<string, CSSProperties> = {
  container: {
    display: "flex",
    flexDirection: "column",
    width: "100%",
  },
  tabRow: {
    display: "flex",
    flexDirection: "column",
    width: "100%",
    gap: "0.2rem",
    padding: "0.4rem",
    background: "rgba(0, 0, 0, 0.12)",
    borderRadius: "1rem",
    boxSizing: "border-box",
  },
  tabButton: {
    flex: 1,
    padding: "8px 12px",
    border: "none",
    borderRadius: "8px",
    background: "transparent",
    color: "#b9b9b9",
    fontSize: "14px",
    fontWeight: 500,
    lineHeight: "normal",
    cursor: "pointer",
    transition: "background 0.15s ease, color 0.15s ease",
  },
  tabButtonActive: {
    background: "#fff",
    color: "#111",
    boxShadow: "0 1px 3px rgba(0, 0, 0, 0.12)",
  },
  page: {
    width: "100%",
    boxSizing: "border-box",
    marginTop: "12px",
  },
};
