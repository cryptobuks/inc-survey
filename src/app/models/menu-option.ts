export interface MenuOption {
  titleKey: string;
  checked?: boolean;
  disabled?: boolean;
  onClick: (index: number) => void;
}
