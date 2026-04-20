import { ViewConfig } from '../types/views.types';
import {
  Rotations,
  LiveMatchView,
  MatchHistoryView,
  ProfileView,
  ContributeView,
  ItemStatsView,
  HeroStatsView,
  OverlayEditorView,
} from '../views';
import LiveMatchIcon from '../views/LiveMatch/components/LiveMatchIcon';
import MatchHistoryIcon from '../views/MatchHistory/components/MatchHistoryIcon';
import ProfileIcon from '../views/Profile/components/ProfileIcon';
import RotationsIcon from '../views/Rotations/components/RotationsIcon';
import ContributeIcon from '../views/Contribute/components/ContributeIcon';
import ItemStatsIcon from '../views/ItemStats/components/ItemStatsIcon';
import HeroStatsIcon from '../views/HeroStats/components/HeroStatsIcon';
import OverlayEditorIcon from '../views/OverlayEditor/components/OverlayEditorIcon';

export const viewsConfig: ViewConfig[] = [
  {
    name: 'Live Match',
    icon: LiveMatchIcon,
    component: LiveMatchView,
    active: true,
  },
  {
    name: 'Match History',
    icon: MatchHistoryIcon,
    component: MatchHistoryView,
    active: false,
  },
  {
    name: 'Hero Stats',
    icon: HeroStatsIcon,
    component: HeroStatsView,
    active: false,
  },
  {
    name: 'Item Stats',
    icon: ItemStatsIcon,
    component: ItemStatsView,
    active: false,
  },
  {
    name: 'Overlay Editor',
    icon: OverlayEditorIcon,
    component: OverlayEditorView,
    active: false,
  },
  {
    name: 'Contribute',
    icon: ContributeIcon,
    component: ContributeView,
    active: false,
  },
  {
    name: 'Profile',
    icon: ProfileIcon,
    component: ProfileView,
    active: false,
  },
];
