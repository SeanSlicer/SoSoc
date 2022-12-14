export interface post {
  id: number;
  text: string;
  timeStamp: number;
  likes: number[];
  author: user;
  comments: comment[];
}

export interface comment {
  id: number;
  text: string;
  author: number;
  timeStamp: number;
  likes: number[];
}

export interface user {
  id: number;
  name: string;
  userName: string;
  password?: string;
  email: string;
  avatar?: string;
}

interface IService {
  init: () => PVoid;
}
type Services = Record<string, IService>;

interface IStore {
  hydrate?: () => PVoid;
}
type Stores = Record<string, IStore>;

type PVoid = Promise<void>;
type AnyObj = Record<string, unknown>;
export type PureFunc = () => void;

type DesignSystemColors = Record<string, string>;
type AppearanceMode = "light" | "dark";
type StatusBarStyle = "light-content" | "dark-content" | undefined;
type ThemeColors = {
  textColor: string;
  bgColor: string;
  bg2Color: string;
};
type CurrentAppearance = {
  value: AppearanceMode;
  system: boolean;
};

type Language = "en" | "ru";

// SERVICES
type AppType = "one_screen" | "three_tabs";

// STORES
type UIAppearance = "System" | "Light" | "Dark";
type UILanguage = "System" | "English" | "Russian";

// SCREENS
// Props
type ExampleScreenProps = {
  value?: number;
};

// Settings
type AppearanceAction = {
  name: UIAppearance;
};

type LanguageAction = {
  name: UILanguage;
};

// API
// Responses
type CounterGetResponse = {
  value: number;
};
