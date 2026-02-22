import { createContext, useContext, useState } from "react";

interface UIContextValue {
  storiesOpen: boolean;
  setStoriesOpen: (v: boolean) => void;
}

const UIContext = createContext<UIContextValue>({
  storiesOpen: false,
  setStoriesOpen: () => {},
});

export const UIProvider = ({ children }: { children: React.ReactNode }) => {
  const [storiesOpen, setStoriesOpen] = useState(false);
  return (
    <UIContext.Provider value={{ storiesOpen, setStoriesOpen }}>
      {children}
    </UIContext.Provider>
  );
};

export const useUI = () => useContext(UIContext);
