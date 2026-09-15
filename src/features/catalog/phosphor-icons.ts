import type { IconType } from "react-icons";
import {
  PiBank,
  PiCamera,
  PiCar,
  PiChatCircle,
  PiCreditCard,
  PiCrown,
  PiDesktop,
  PiDeviceMobile,
  PiDiamond,
  PiDiscordLogo,
  PiFilmStrip,
  PiFire,
  PiFolder,
  PiFootball,
  PiGameController,
  PiGift,
  PiGlobe,
  PiHeadphones,
  PiHeart,
  PiInstagramLogo,
  PiLightning,
  PiMusicNotes,
  PiPackage,
  PiPuzzlePiece,
  PiRobot,
  PiShoppingBag,
  PiSparkle,
  PiStar,
  PiSword,
  PiTicket,
  PiUsers,
  PiWhatsappLogo,
} from "react-icons/pi";

export const CATEGORY_ICONS = {
  PiGameController,
  PiFire,
  PiSword,
  PiCrown,
  PiDiamond,
  PiRobot,
  PiSparkle,
  PiLightning,
  PiStar,
  PiHeart,
  PiPuzzlePiece,
  PiPackage,
  PiShoppingBag,
  PiGift,
  PiTicket,
  PiCreditCard,
  PiBank,
  PiGlobe,
  PiUsers,
  PiChatCircle,
  PiDiscordLogo,
  PiInstagramLogo,
  PiWhatsappLogo,
  PiCamera,
  PiFilmStrip,
  PiHeadphones,
  PiMusicNotes,
  PiDeviceMobile,
  PiDesktop,
  PiCar,
  PiFootball,
  PiFolder,
} as const satisfies Record<string, IconType>;

export type CategoryIconName = keyof typeof CATEGORY_ICONS;

export function getCategoryIcon(name: string | null | undefined): IconType | null {
  if (name && name in CATEGORY_ICONS) {
    return CATEGORY_ICONS[name as CategoryIconName];
  }
  return null;
}
